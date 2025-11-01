import { convertToCSV } from '../js/utils.js';

describe('convertToCSV', () => {
    // Test case for a basic array of objects
    test('should convert an array of objects to a CSV string', () => {
        const dataArray = [
            { ServerTimeStamp: '01/01/2023 14:30:00', Suhu: 25, TDS: 300 },
            { ServerTimeStamp: '01/01/2023 14:35:00', Suhu: 26, TDS: 310 },
        ];
        const expectedCSV = 'ServerTimeStamp,OriginalTimeStamp,apiKey,Suhu,TDS,Salinitas,pH,Turbiditas\r\n"01/01/2023 14:30:00","","","25","300","","",""\r\n"01/01/2023 14:35:00","","","26","310","","",""';
        expect(convertToCSV(dataArray)).toEqual(expectedCSV);
    });

    // Test case for an empty array
    test('should return an empty string for an empty array', () => {
        const dataArray = [];
        expect(convertToCSV(dataArray)).toEqual('');
    });

    // Test case for an array with special characters
    test('should handle special characters in the data', () => {
        const dataArray = [
            { ServerTimeStamp: '01/01/2023 14:30:00', Suhu: '25 "C"', TDS: '300,5' },
        ];
        const expectedCSV = 'ServerTimeStamp,OriginalTimeStamp,apiKey,Suhu,TDS,Salinitas,pH,Turbiditas\r\n"01/01/2023 14:30:00","","","25 ""C""","300,5","","",""';
        expect(convertToCSV(dataArray)).toEqual(expectedCSV);
    });

    // Test case for null or undefined values
    test('should handle null or undefined values in the data', () => {
        const dataArray = [
            { ServerTimeStamp: '01/01/2023 14:30:00', Suhu: null, TDS: undefined },
        ];
        const expectedCSV = 'ServerTimeStamp,OriginalTimeStamp,apiKey,Suhu,TDS,Salinitas,pH,Turbiditas\r\n"01/01/2023 14:30:00","","","","","","",""';
        expect(convertToCSV(dataArray)).toEqual(expectedCSV);
    });
});
