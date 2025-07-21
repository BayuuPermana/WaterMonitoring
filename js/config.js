// js/config.js

// =================================================================================
// CONFIGURATION CONSTANTS
// =================================================================================
// Replace with your actual Google Cloud API Key for Sheets API
export const GOOGLE_SHEET_API_KEY = "AIzaSyC3BLFgCM-fhJNAQdnYuEdYOcxFVb5DKpo"; // Example, use your key

// Replace with your actual Google Spreadsheet ID
export const SPREADSHEET_ID = "1yL96LSDQ8D-NsdigvxxzKVCH25ZMO3XQVOcAt396XYM"; // Example, use your ID

// Replace with your Sheet Name and the range that covers your data headers and values
// Example: "Sheet1!A:H" if data is in Sheet1, columns A through H
export const SHEET_NAME_AND_RANGE = "SensorData!A:H"; // Example, use your sheet name and range

// How often to automatically poll for new data from the Google Sheet (in milliseconds)
export const POLLING_INTERVAL_MS = 300000; // 300 seconds
