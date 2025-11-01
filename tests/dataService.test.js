import { parseServerTimestamp } from '../js/dataService.js';

describe('parseServerTimestamp', () => {
    // Test case for a valid timestamp
    test('should parse a valid timestamp string correctly', () => {
        const timestampStr = '01/01/2023 14:30:00';
        const expectedDate = new Date(2023, 0, 1, 14, 30, 0);
        expect(parseServerTimestamp(timestampStr)).toEqual(expectedDate);
    });

    // Test case for an invalid timestamp
    test('should return null for an invalid timestamp string', () => {
        const timestampStr = '2023-01-01 14:30:00';
        expect(parseServerTimestamp(timestampStr)).toBeNull();
    });

    // Test case for a timestamp with extra whitespace
    test('should handle extra whitespace in the timestamp string', () => {
        const timestampStr = '  01/01/2023   14:30:00  ';
        const expectedDate = new Date(2023, 0, 1, 14, 30, 0);
        expect(parseServerTimestamp(timestampStr)).toEqual(expectedDate);
    });

    // Test case for a null or undefined timestamp
    test('should return null for a null or undefined timestamp string', () => {
        expect(parseServerTimestamp(null)).toBeNull();
        expect(parseServerTimestamp(undefined)).toBeNull();
    });
});
