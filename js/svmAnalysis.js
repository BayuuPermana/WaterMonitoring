import { latestSensorDataSnapshot } from './main.js';
import { SVM_PREDICTION_ENDPOINT } from './config.js';
import { handleError } from './errorHandler.js';
import { i18n } from './i18n.js';

/**
 * Updates the UI to display the data selected for SVM analysis.
 * @param {object} data - The sensor data object.
 */
function updateSelectedDataUI(data) {
    const svmSelectedDataContent = document.getElementById('svm-selected-data-content');
    const svmSelectedTimestamp = document.getElementById('svm-selected-timestamp');
    const svmSelectedData = document.getElementById('svm-selected-data');

    svmSelectedDataContent.innerHTML = `
        <div class="p-3 bg-gray-50 rounded-lg text-center">
            <div class="text-2xl font-bold">${data.Suhu?.toFixed(1) ?? '-'} °C</div>
            <div class="text-sm text-gray-600">${i18n.t('temp')}</div>
        </div>
        <div class="p-3 bg-gray-50 rounded-lg text-center">
            <div class="text-2xl font-bold">${data.TDS?.toFixed(0) ?? '-'} ppm</div>
            <div class="text-sm text-gray-600">${i18n.t('tds')}</div>
        </div>
        <div class="p-3 bg-gray-50 rounded-lg text-center">
            <div class="text-2xl font-bold">${data.Salinitas?.toFixed(1) ?? '-'} </div>
            <div class="text-sm text-gray-600">${i18n.t('salinity')}</div>
        </div>
        <div class="p-3 bg-gray-50 rounded-lg text-center">
            <div class="text-2xl font-bold">${data.pH?.toFixed(1) ?? '-'} </div>
            <div class="text-sm text-gray-600">${i18n.t('ph')}</div>
        </div>
        <div class="p-3 bg-gray-50 rounded-lg text-center">
            <div class="text-2xl font-bold">${data.Turbiditas?.toFixed(0) ?? '-'} </div>
            <div class="text-sm text-gray-600">${i18n.t('turbidity')}</div>
        </div>
    `;
    svmSelectedTimestamp.textContent = `${i18n.t('timestampLabel')}${data.ServerTimeStamp}`;
    svmSelectedData.classList.remove('hidden');
}

/**
 * Updates the UI to display the SVM prediction result.
 * @param {number} prediction - The prediction result (1 for Potable, 0 for Not Potable).
 */
function updatePredictionUI(prediction) {
    const svmResult = document.getElementById('svm-result');
    const svmPrediction = document.getElementById('svm-prediction');
    const svmPredictionCard = document.getElementById('svm-prediction-card');

    svmPrediction.classList.remove('text-green-600', 'text-red-600');
    svmPredictionCard.classList.remove('bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800');

    if (prediction === 1) {
        svmPrediction.textContent = i18n.t('potable');
        svmPredictionCard.classList.add('bg-green-100', 'text-green-800');
    } else {
        svmPrediction.textContent = i18n.t('notPotable');
        svmPredictionCard.classList.add('bg-red-100', 'text-red-800');
    }
    svmResult.classList.remove('hidden');
}

/**
 * Fetches the SVM prediction from the endpoint.
 * @param {Array<number>} features - The features to send for prediction.
 * @returns {Promise<object>} The prediction result.
 */
async function fetchPrediction(features) {
    const response = await fetch(SVM_PREDICTION_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ features }),
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return await response.json();
}

/**
 * Handles the SVM analysis process.
 * Fetches prediction first, then updates UI with selected data and prediction metrics.
 */
async function handleSvmAnalysis() {
    if (!latestSensorDataSnapshot || latestSensorDataSnapshot.length === 0) {
        handleError(new Error('No data available'), 'No data available from the \'Data & Charts\' tab. Please refresh the data first.');
        return;
    }
    const randomIndex = Math.floor(Math.random() * latestSensorDataSnapshot.length);
    const randomData = latestSensorDataSnapshot[randomIndex];
    const features = [
        randomData.Suhu,
        randomData.TDS,
        randomData.Salinitas,
        randomData.pH,
        randomData.Turbiditas,
    ];
    try {
        const result = await fetchPrediction(features);
        updateSelectedDataUI(randomData);
        updatePredictionUI(result.prediction);
    } catch (error) {
        handleError(error, 'An error occurred during SVM analysis. Please check the console for details.');
    }
}

/**
 * Initializes SVM analysis by setting up event listeners.
 */
export function initSvmAnalysis() {
    const analyzeButton = document.getElementById('analyze-random-data-button');
    if (analyzeButton) {
        analyzeButton.addEventListener('click', handleSvmAnalysis);
    }
}