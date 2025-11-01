import { latestSensorDataSnapshot } from './main.js';

export function initSvmAnalysis() {
    const analyzeButton = document.getElementById('analyze-random-data-button');
    const svmResult = document.getElementById('svm-result');
    const svmPrediction = document.getElementById('svm-prediction');
    const svmSelectedData = document.getElementById('svm-selected-data');
    const svmSelectedDataContent = document.getElementById('svm-selected-data-content');
    const svmSelectedTimestamp = document.getElementById('svm-selected-timestamp');
    const svmPredictionCard = document.getElementById('svm-prediction-card');

    analyzeButton.addEventListener('click', async () => {
        if (!latestSensorDataSnapshot || latestSensorDataSnapshot.length === 0) {
            alert('No data available from the \'Data & Charts\' tab. Please refresh the data first.');
            return;
        }

        const randomIndex = Math.floor(Math.random() * latestSensorDataSnapshot.length);
        const randomData = latestSensorDataSnapshot[randomIndex];

        // Display the selected data
        svmSelectedDataContent.innerHTML = `
            <div class="p-3 bg-gray-50 rounded-lg text-center">
                <div class="text-2xl font-bold">${randomData.Suhu?.toFixed(1) ?? '-'} °C</div>
                <div class="text-sm text-gray-600">Suhu</div>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg text-center">
                <div class="text-2xl font-bold">${randomData.TDS?.toFixed(0) ?? '-'} ppm</div>
                <div class="text-sm text-gray-600">TDS</div>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg text-center">
                <div class="text-2xl font-bold">${randomData.Salinitas?.toFixed(1) ?? '-'}</div>
                <div class="text-sm text-gray-600">Salinitas</div>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg text-center">
                <div class="text-2xl font-bold">${randomData.pH?.toFixed(1) ?? '-'}</div>
                <div class="text-sm text-gray-600">pH</div>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg text-center">
                <div class="text-2xl font-bold">${randomData.Turbiditas?.toFixed(0) ?? '-'}</div>
                <div class="text-sm text-gray-600">Turbiditas</div>
            </div>
        `;
        svmSelectedTimestamp.textContent = `Timestamp: ${randomData.ServerTimeStamp}`;
        svmSelectedData.classList.remove('hidden');

        const features = [
            randomData.Suhu,
            randomData.TDS,
            randomData.Salinitas,
            randomData.pH,
            randomData.Turbiditas,
        ];

        try {
            const response = await fetch('http://127.0.0.1:5000/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ features }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            svmPrediction.classList.remove('text-green-600', 'text-red-600');
            svmPredictionCard.classList.remove('bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800');

            if (data.prediction === 1) {
                svmPrediction.textContent = 'Potable';
                svmPredictionCard.classList.add('bg-green-100', 'text-green-800');
            } else {
                svmPrediction.textContent = 'Not Potable';
                svmPredictionCard.classList.add('bg-red-100', 'text-red-800');
            }
            svmResult.classList.remove('hidden');

        } catch (error) {
            console.error('Error during SVM analysis:', error);
            alert('An error occurred during SVM analysis. Please check the console for details.');
        }
    });
}