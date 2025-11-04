// js/dataService.js
import { GOOGLE_SHEET_API_KEY, SPREADSHEET_ID, SHEET_NAME_AND_RANGE } from './config.js';
import { handleError } from './errorHandler.js';
import { loadingIndicator } from './uiElements.js'; // For showing/hiding loading

/**
 * Parses a ServerTimeStamp string (expected as DD/MM/YYYY H(H):MM:SS) into a JS Date object.
 * @param {string} timestampStr - The timestamp string from the 'ServerTimeStamp' column.
 * @returns {Date|null} A Date object or null if parsing fails.
 */
function parseServerTimestamp(timestampStr) {
    if (!timestampStr || typeof timestampStr !== 'string') {
        // console.warn('parseServerTimestamp: Input is null or not a string for parsing.');
        return null;
    }
    let sanitizedTimestampStr = timestampStr.trim();
    sanitizedTimestampStr = sanitizedTimestampStr.replace(/\s+/g, ' '); 
    
    const match = sanitizedTimestampStr.match(/^(\d{2})\/(\d{2})\/(\d{4})\s(\d{1,2}):(\d{2}):(\d{2})$/); 
    if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1; // Month is 0-indexed in JS Date
        const year = parseInt(match[3], 10);
        const hour = parseInt(match[4], 10);
        const minute = parseInt(match[5], 10);
        const second = parseInt(match[6], 10);
        const d = new Date(year, month, day, hour, minute, second);
        if (!isNaN(d)) {
            return d;
        } else {
            // console.warn(`Parsed (trimmed and space-normalized) "${sanitizedTimestampStr}" but resulted in an invalid Date object.`);
            return null;
        }
    }
    // console.warn(`Could not parse 'ServerTimeStamp' (trimmed and space-normalized): "${sanitizedTimestampStr}" with expected format DD/MM/YYYY H:MM:SS or HH:MM:SS (regex failed).`);
    return null;
}

/**
 * Fetches data from the configured Google Sheet.
 * @param {boolean} fetchAll - If true, tries to fetch all data (for CSV export).
 * @returns {Promise<Array<object>>} A promise that resolves to an array of data objects.
 */
export async function fetchSheetData(fetchAll = false) {
    if (GOOGLE_SHEET_API_KEY.startsWith("YOUR_") || SPREADSHEET_ID.startsWith("YOUR_")) {
        handleError(new Error("Configuration Error"), "CRITICAL: Google Sheet API Key or Spreadsheet ID is not configured. Please set it in js/config.js.");
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        return [];
    }
    if (loadingIndicator) loadingIndicator.classList.remove('hidden');

    const rangeToFetch = fetchAll ? SHEET_NAME_AND_RANGE.split('!')[0] + "!A:Z" : SHEET_NAME_AND_RANGE;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(rangeToFetch)}?key=${GOOGLE_SHEET_API_KEY}&majorDimension=ROWS`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = `Error fetching data (Status ${response.status}): ${errorData.error?.message || response.statusText}`;
            handleError(new Error(errorMessage), errorMessage);
            return [];
        }
        const json = await response.json();
        if (!json.values || json.values.length < 2) {
            console.log("No data rows or only header row found in sheet.");
            return [];
        }

        const headers = json.values[0].map(h => String(h).trim());
        const dataRows = json.values.slice(1);

        const formattedData = dataRows.map(row => {
            const entry = {};
            headers.forEach((header, index) => {
                entry[header] = row[index] !== undefined ? String(row[index]) : null;
            });

            // Parse numeric sensor values
            entry.Suhu = parseFloat(entry.Suhu);
            entry.TDS = parseFloat(entry.TDS);
            entry.Salinitas = parseFloat(entry.Salinitas);
            entry.pH = parseFloat(entry.pH);
            entry.Turbiditas = parseFloat(entry.Turbiditas);
            
            // Create a JS Date object from 'ServerTimeStamp' for charting and sorting
            entry.chartTimestamp = parseServerTimestamp(entry.ServerTimeStamp);
            return entry;
        }).filter(entry => entry.chartTimestamp); // Filter out rows where timestamp parsing failed

        // Sort data by chartTimestamp (derived from ServerTimeStamp), newest first
        formattedData.sort((a, b) => b.chartTimestamp.getTime() - a.chartTimestamp.getTime());
        return formattedData;

    } catch (error) {
        handleError(error, `Failed to fetch or parse sheet data: ${error.message}`);
        return [];
    } finally {
        if(loadingIndicator) loadingIndicator.classList.add('hidden');
    }
}
