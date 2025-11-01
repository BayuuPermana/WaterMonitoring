import { runPotabilityAnalysis } from '../js/main.js';
import { potabilityAssessmentEl } from '../js/uiElements.js';

describe('runPotabilityAnalysis', () => {
    beforeEach(() => {
      // Clear the content of the mock element before each test
      potabilityAssessmentEl.innerHTML = '';
    });

    // Test case for when water is potable
    test('should identify water as potable when all parameters are within range', () => {
      const latestData = {
        pH: 7.2,
        TDS: 300,
        Turbiditas: 3,
        Suhu: 25,
      };
      runPotabilityAnalysis(latestData);
      // Check if the HTML content indicates "Layak" (Potable)
      expect(potabilityAssessmentEl.innerHTML).toContain('Layak');
      expect(potabilityAssessmentEl.innerHTML).not.toContain('Tidak Layak');
    });

    // Test case for non-potable water due to high TDS
    test('should identify water as non-potable due to high TDS', () => {
      const latestData = {
        pH: 7.2,
        TDS: 600,
        Turbiditas: 3,
        Suhu: 25,
      };
      runPotabilityAnalysis(latestData);
      expect(potabilityAssessmentEl.innerHTML).toContain('Tidak Layak');
      expect(potabilityAssessmentEl.innerHTML).toContain('TDS level');
    });

    // Test case for non-potable water due to low pH
    test('should identify water as non-potable due to low pH', () => {
      const latestData = {
        pH: 5.0,
        TDS: 300,
        Turbiditas: 3,
        Suhu: 25,
      };
      runPotabilityAnalysis(latestData);
      expect(potabilityAssessmentEl.innerHTML).toContain('Tidak Layak');
      expect(potabilityAssessmentEl.innerHTML).toContain('pH level');
    });

    // Test case for non-potable water due to high turbidity
    test('should identify water as non-potable due to high turbidity', () => {
        const latestData = {
            pH: 7.2,
            TDS: 300,
            Turbiditas: 10,
            Suhu: 25,
        };
        runPotabilityAnalysis(latestData);
        expect(potabilityAssessmentEl.innerHTML).toContain('Tidak Layak');
        expect(potabilityAssessmentEl.innerHTML).toContain('Turbidity level');
    });

    // Test case for non-potable water due to out-of-range temperature
    test('should identify water as non-potable due to out-of-range temperature', () => {
        const latestData = {
            pH: 7.2,
            TDS: 300,
            Turbiditas: 3,
            Suhu: 40,
        };
        runPotabilityAnalysis(latestData);
        expect(potabilityAssessmentEl.innerHTML).toContain('Tidak Layak');
        expect(potabilityAssessmentEl.innerHTML).toContain('Temperature');
    });

    // Test case for multiple failure reasons
    test('should list all reasons for failure when multiple parameters are out of range', () => {
        const latestData = {
            pH: 9.0,
            TDS: 700,
            Turbiditas: 6,
            Suhu: 5,
        };
        runPotabilityAnalysis(latestData);
        expect(potabilityAssessmentEl.innerHTML).toContain('Tidak Layak');
        expect(potabilityAssessmentEl.innerHTML).toContain('pH level');
        expect(potabilityAssessmentEl.innerHTML).toContain('TDS level');
        expect(potabilityAssessmentEl.innerHTML).toContain('Turbidity level');
        expect(potabilityAssessmentEl.innerHTML).toContain('Temperature');
    });

    // Test case for missing data
    test('should display a waiting message if data is null or undefined', () => {
        runPotabilityAnalysis(null);
        expect(potabilityAssessmentEl.innerHTML).toContain('Awaiting data for analysis...');

        runPotabilityAnalysis(undefined);
        expect(potabilityAssessmentEl.innerHTML).toContain('Awaiting data for analysis...');
    });
});
