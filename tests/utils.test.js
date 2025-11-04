// tests/utils.test.js
const { convertToCSV } = require('../js/utils.js');

describe('convertToCSV', () => {
    it('should return an empty string for null or empty input', () => {
        expect(convertToCSV(null)).toBe('');
        expect(convertToCSV([])).toBe('');
    });

    it('should correctly convert an array of objects to a CSV string', () => {
        const data = [
            { ServerTimeStamp: '01/01/2025 12:00:00', Suhu: 25, TDS: 500, Salinitas: 35, pH: 7, Turbiditas: 10 },
            { ServerTimeStamp: '01/01/2025 12:05:00', Suhu: 26, TDS: 510, Salinitas: 36, pH: 7.1, Turbiditas: 11 },
        ];
        const expectedCSV = 'ServerTimeStamp,OriginalTimeStamp,apiKey,Suhu,TDS,Salinitas,pH,Turbiditas\r\n' +
            '"01/01/2025 12:00:00","","","25","500","35","7","10"\r\n' +
            '"01/01/2025 12:05:00","","","26","510","36","7.1","11"';
        expect(convertToCSV(data)).toBe(expectedCSV);
    });

    it('should handle values with commas and quotes', () => {
        const data = [
            { ServerTimeStamp: '01/01/2025 12:00:00', Suhu: '25,5', TDS: '"500"', Salinitas: 35, pH: 7, Turbiditas: 10 },
        ];
        const expectedCSV = 'ServerTimeStamp,OriginalTimeStamp,apiKey,Suhu,TDS,Salinitas,pH,Turbiditas\r\n' +
            '"01/01/2025 12:00:00","","","25,5","""500""","35","7","10"';
        expect(convertToCSV(data)).toBe(expectedCSV);
    });
});
