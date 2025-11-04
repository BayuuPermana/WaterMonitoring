// tests/dataService.test.js
import { fetchSheetData } from '../js/dataService.js';
import { GOOGLE_SHEET_API_KEY, SPREADSHEET_ID, SHEET_NAME_AND_RANGE } from '../js/config.js';

global.fetch = jest.fn();

describe('fetchSheetData', () => {
    beforeEach(() => {
        fetch.mockClear();
    });

    it('should fetch and parse data correctly', async () => {
        const mockResponse = {
            values: [
                ['ServerTimeStamp', 'Suhu', 'TDS', 'Salinitas', 'pH', 'Turbiditas'],
                ['01/01/2025 12:00:00', '25', '500', '35', '7', '10'],
                ['01/01/2025 12:05:00', '26', '510', '36', '7.1', '11'],
            ],
        };

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });

        const data = await fetchSheetData();

        expect(fetch).toHaveBeenCalledWith(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME_AND_RANGE)}?key=${GOOGLE_SHEET_API_KEY}&majorDimension=ROWS`);
        expect(data).toHaveLength(2);
        expect(data[0].Suhu).toBe(26);
        expect(data[1].TDS).toBe(500);
    });

    it('should handle API errors gracefully', async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 403,
            json: async () => ({ error: { message: 'API key expired' } }),
        });

        const data = await fetchSheetData();

        expect(data).toEqual([]);
    });

    it('should handle empty data gracefully', async () => {
        const mockResponse = {
            values: [
                ['ServerTimeStamp', 'Suhu', 'TDS', 'Salinitas', 'pH', 'Turbiditas'],
            ],
        };

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });

        const data = await fetchSheetData();

        expect(data).toEqual([]);
    });
});
