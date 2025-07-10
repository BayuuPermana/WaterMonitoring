// js/utils.js

/**
 * Converts an array of data objects to a CSV formatted string.
 * @param {Array<object>} dataArray - Array of sensor data objects, expected to be sorted as desired for output.
 * @returns {string} CSV formatted string.
 */
export function convertToCSV(dataArray) {
    if (!dataArray || dataArray.length === 0) return "";

    // Define CSV headers based on your Google Sheet columns you want to export
    const csvHeaders = ["ServerTimeStamp", "OriginalTimeStamp", "apiKey", "Suhu", "TDS", "Salinitas", "pH", "Turbiditas"];
    
    const rows = dataArray.map(row => {
        return csvHeaders.map(header => {
            let value = row[header]; // Access data using the header string
            // Ensure any double quotes within the value are escaped by doubling them
            return `"${String(value ?? '').replace(/"/g, '""')}"`; 
        }).join(',');
    });
    return [csvHeaders.join(','), ...rows].join('\r\n'); // Add headers and join rows
}
