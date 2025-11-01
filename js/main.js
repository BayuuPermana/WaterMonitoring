// js/main.js
import { POLLING_INTERVAL_MS, GOOGLE_SHEET_API_KEY } from './config.js';
import {
    latestSuhuEl, latestTDSEl, latestSalinitasEl, latestPHEl, latestTurbiditasEl,
    latestServerTimeStampEl, exportCsvButton, refreshDataButtonEl, showModal,
    tabDataChartsButton, tabSvmButton, tabContentDataCharts, tabContentSvm,
    svmExplanationEl, potabilityAssessmentEl, runSvmAnalysisButtonEl,
    modelFileInputEl, runRandomAnalysisButtonEl, randomAnalysisResultEl,
    loadingIndicator
} from './uiElements.js';
import { chartConfigs, createChart, updateAllCharts } from './chartManager.js';
import { fetchSheetData } from './dataService.js';
import { convertToCSV } from './utils.js';

// Store the latest fetched sensor data to be used by the rule-based analysis
let latestSensorDataSnapshot = null;

// =================================================================================
// TAB SWITCHING LOGIC
// =================================================================================
function switchTab(activeTabButton, activeTabContent) {
    // Hide all tab contents
    if(tabContentDataCharts) tabContentDataCharts.classList.add('hidden');
    if(tabContentSvm) tabContentSvm.classList.add('hidden');

    // Deactivate all tab buttons
    if(tabDataChartsButton) {
        tabDataChartsButton.classList.remove('active-tab');
        tabDataChartsButton.classList.add('inactive-tab');
    }
    if(tabSvmButton) {
        tabSvmButton.classList.remove('active-tab');
        tabSvmButton.classList.add('inactive-tab');
    }

    // Activate the selected tab and content
    if (activeTabButton) {
        activeTabButton.classList.remove('inactive-tab');
        activeTabButton.classList.add('active-tab');
    }
    if (activeTabContent) {
        activeTabContent.classList.remove('hidden');
    }

    // Special actions for SVM tab
    if (activeTabButton === tabSvmButton) {
        displaySvmExplanation(); // Display the pre-written explanation
        if (latestSensorDataSnapshot && latestSensorDataSnapshot.length > 0) {
            runPotabilityAnalysis(latestSensorDataSnapshot[0]);
        } else {
            if(potabilityAssessmentEl) {
                potabilityAssessmentEl.innerHTML = `<div class="text-gray-500">No data available for analysis.</div>`;
            }
        }
    }
}

// =================================================================================
// SVM & POTABILITY ANALYSIS (RULE-BASED)
// =================================================================================
/**
 * Displays a pre-written summary of SVM based on the provided document.
 */
function displaySvmExplanation() {
    if (!svmExplanationEl) return;
    svmExplanationEl.innerHTML = `
        <p class="mb-2">Support Vector Machine (SVM) adalah salah satu algoritma machine learning yang digunakan untuk tugas klasifikasi dan regresi. Prinsip utama SVM adalah mencari 'hyperplane' atau pemisah terbaik yang dapat membedakan dua atau lebih kelas dalam suatu kumpulan data.</p>
        <p class="mb-2">SVM bekerja dengan memaksimalkan 'margin', yaitu jarak antara hyperplane dengan titik data terdekat dari setiap kelas (disebut 'support vectors'). Jika data tidak dapat dipisahkan secara linear, SVM menggunakan teknik 'kernel trick' (seperti RBF Kernel) untuk memetakan data ke dimensi yang lebih tinggi agar pemisahan dapat dilakukan.</p>
        <p>Dalam konteks kelayakan air, SVM dapat digunakan untuk mengklasifikasikan sampel air sebagai 'Layak' atau 'Tidak Layak' berdasarkan parameter-parameter terukur seperti pH, TDS, dan Kekeruhan, menjadikannya alat yang efektif untuk analisis kualitas air.</p>
    `;
}

/**
 * Determines water potability based on a fixed set of rules from the research paper.
 * @param {object} latestData - The latest sensor data object.
 */
function runPotabilityAnalysis(latestData) {
    if (!potabilityAssessmentEl || !latestData) {
        if(potabilityAssessmentEl) {
            potabilityAssessmentEl.innerHTML = `<div class="text-gray-500">Awaiting data for analysis...</div>`;
        }
        return;
    }

    // Rules based on PERMENKES No. 492/2010 and general water quality standards
    const rules = {
        pH: { min: 6.5, max: 8.5 },
        TDS: { max: 500 }, // mg/L, which is equivalent to ppm for water
        Turbiditas: { max: 5 }, // NTU
        Suhu: { min: 10, max: 35 } // Using a general acceptable range as a proxy for 'Suhu Udara ±3°C'
    };

    let reasonsForFailure = [];
    let isPotable = true;

    // Check pH
    if (latestData.pH < rules.pH.min || latestData.pH > rules.pH.max) {
        isPotable = false;
        reasonsForFailure.push(`pH level (${latestData.pH.toFixed(2)}) is outside the acceptable range of ${rules.pH.min} - ${rules.pH.max}.`);
    }

    // Check TDS
    if (latestData.TDS > rules.TDS.max) {
        isPotable = false;
        reasonsForFailure.push(`TDS level (${latestData.TDS.toFixed(0)} mg/L) exceeds the maximum limit of ${rules.TDS.max} mg/L.`);
    }

    // Check Turbidity
    if (latestData.Turbiditas > rules.Turbiditas.max) {
        isPotable = false;
        reasonsForFailure.push(`Turbidity level (${latestData.Turbiditas.toFixed(2)} NTU) exceeds the maximum limit of ${rules.Turbiditas.max} NTU.`);
    }

    // Check Temperature
    if (latestData.Suhu < rules.Suhu.min || latestData.Suhu > rules.Suhu.max) {
        isPotable = false;
        reasonsForFailure.push(`Temperature (${latestData.Suhu.toFixed(1)}°C) is outside the general comfort and quality range of ${rules.Suhu.min}°C - ${rules.Suhu.max}°C.`);
    }

    // Display the result
    let resultHTML = '';
    if (isPotable) {
        resultHTML = `
            <div class="text-4xl font-bold text-green-600 my-2">Layak</div>
            <p class="text-md text-gray-700">All measured parameters are within the acceptable limits based on the provided standards.</p>
        `;
    } else {
        resultHTML = `
            <div class="text-4xl font-bold text-red-600 my-2">Tidak Layak</div>
            <p class="text-md text-gray-700 mb-3">The following parameters are outside the acceptable limits:</p>
            <ul class="list-disc list-inside text-left max-w-md mx-auto text-gray-600">
                ${reasonsForFailure.map(reason => `<li>${reason}</li>`).join('')}
            </ul>
        `;
    }
    potabilityAssessmentEl.innerHTML = resultHTML;
}


// =================================================================================
// UI UPDATE FUNCTION (LATEST READINGS)
// =================================================================================
function updateLatestReadingsUI(dataArray) {
    const na = '-';
    if (dataArray && dataArray.length > 0) {
        const latestData = dataArray[0];
        latestSensorDataSnapshot = dataArray; // Store for SVM tab

        if(latestSuhuEl) latestSuhuEl.textContent = latestData.Suhu?.toFixed(1) ?? na;
        if(latestTDSEl) latestTDSEl.textContent = latestData.TDS?.toFixed(0) ?? na;
        if(latestSalinitasEl) latestSalinitasEl.textContent = latestData.Salinitas?.toFixed(1) ?? na;
        if(latestPHEl) latestPHEl.textContent = latestData.pH?.toFixed(1) ?? na;
        if(latestTurbiditasEl) latestTurbiditasEl.textContent = latestData.Turbiditas?.toFixed(0) ?? na;
        if(latestServerTimeStampEl) latestServerTimeStampEl.textContent = latestData.ServerTimeStamp || na;

        // If SVM tab is active, update its prediction
        if (tabSvmButton && tabSvmButton.classList.contains('active-tab')) {
            runPotabilityAnalysis(latestData);
        }

    } else {
        latestSensorDataSnapshot = null;
        if(latestSuhuEl) latestSuhuEl.textContent = na;
        if(latestTDSEl) latestTDSEl.textContent = na;
        if(latestSalinitasEl) latestSalinitasEl.textContent = na;
        if(latestPHEl) latestPHEl.textContent = na;
        if(latestTurbiditasEl) latestTurbiditasEl.textContent = na;
        if(latestServerTimeStampEl) latestServerTimeStampEl.textContent = na;
        if (tabSvmButton && tabSvmButton.classList.contains('active-tab')) {
            if(potabilityAssessmentEl) {
                 potabilityAssessmentEl.innerHTML = `<div class="text-gray-500">No data available for analysis.</div>`;
            }
        }
    }
}

// =================================================================================
// DATA REFRESH LOGIC
// =================================================================================
async function refreshDashboardData() {
    const sensorData = await fetchSheetData(); 
    
    if (sensorData.length > 0) {
        updateLatestReadingsUI(sensorData);
        updateAllCharts(sensorData.slice().reverse()); 
    } else {
         updateLatestReadingsUI([]);
         updateAllCharts([]);
    }
}

// =================================================================================
// CSV EXPORT FUNCTIONALITY
// =================================================================================
async function handleExportDataToCSV() {
    const exportModalMessage = "Fetching all data for export... This may take a moment.";
    showModal(exportModalMessage);
    const allData = await fetchSheetData(true); 

    if (allData.length === 0) {
        if (document.getElementById('infoModalMessage').textContent !== exportModalMessage) { 
        } else {
            showModal("No data available to export.");
        }
        return;
    }
    const sortedDataForCSV = allData.slice().sort((a,b) => a.chartTimestamp.getTime() - b.chartTimestamp.getTime()); 
    const csvData = convertToCSV(sortedDataForCSV);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        const now = new Date();
        const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
        const timeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
        link.setAttribute("download", `sensor_data_export_${dateStr}_${timeStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showModal("Data exported successfully!");
    } else {
        showModal("CSV export is not supported by your browser.");
    }
}

// =================================================================================
// EVENT LISTENERS
// =================================================================================

/**
 * Simulates the prediction of an SVM model.
 * @param {object} dataPoint - The sensor data object to analyze.
 * @returns {string} The simulated prediction ('Layak' or 'Tidak Layak').
 */
function simulateSvmPrediction(dataPoint) {
    // This is a placeholder. In a real scenario with a compatible model,
    // this function would preprocess the data and run it through the model.
    // The logic here is simplified for demonstration.
    const { pH, TDS, Turbiditas } = dataPoint;
    if (pH >= 6.5 && pH <= 8.5 && TDS <= 500 && Turbiditas <= 5) {
        return 'Layak';
    } else {
        return 'Tidak Layak';
    }
}

/**
 * Fetches all data, picks a random data point, and runs the simulated SVM analysis.
 */
async function runSvmAnalysisWithRandomData() {
    if (!randomAnalysisResultEl) return;

    randomAnalysisResultEl.classList.remove('hidden');
    randomAnalysisResultEl.innerHTML = `<div class="text-gray-500">Fetching data and analyzing...</div>`;

    const allData = await fetchSheetData(true); // Fetch all data
    if (allData.length === 0) {
        randomAnalysisResultEl.innerHTML = `<div class="text-red-500">No data available to analyze.</div>`;
        return;
    }

    const randomDataPoint = allData[Math.floor(Math.random() * allData.length)];
    const prediction = simulateSvmPrediction(randomDataPoint);

    const resultHTML = `
        <h4 class="text-lg font-semibold text-gray-700 mb-2">Analysis of Random Data Point</h4>
        <p class="text-sm text-gray-500 mb-3">Timestamp: ${randomDataPoint.ServerTimeStamp}</p>
        <div class="grid grid-cols-3 gap-2 text-sm mb-4">
            <div><strong>pH:</strong> ${randomDataPoint.pH.toFixed(2)}</div>
            <div><strong>TDS:</strong> ${randomDataPoint.TDS.toFixed(0)}</div>
            <div><strong>Turbidity:</strong> ${randomDataPoint.Turbiditas.toFixed(2)}</div>
        </div>
        <div class="mt-2">
            <span class="text-md font-medium">Model Prediction:</span>
            <span class="text-xl font-bold ${prediction === 'Layak' ? 'text-green-600' : 'text-red-600'}">${prediction}</span>
        </div>
    `;
    randomAnalysisResultEl.innerHTML = resultHTML;
}


if(exportCsvButton) {
    exportCsvButton.addEventListener('click', handleExportDataToCSV);
}

if (refreshDataButtonEl) {
    refreshDataButtonEl.addEventListener('click', () => {
        refreshDashboardData().catch(error => {
            console.error("Error during manual refresh top-level call:", error);
            showModal(`An unexpected error occurred during manual refresh: ${error.message}`);
            if(loadingIndicator) loadingIndicator.classList.add('hidden');
        });
    });
}

if (tabDataChartsButton && tabContentDataCharts) {
    tabDataChartsButton.addEventListener('click', () => switchTab(tabDataChartsButton, tabContentDataCharts));
}
if (tabSvmButton && tabContentSvm) {
    tabSvmButton.addEventListener('click', () => switchTab(tabSvmButton, tabContentSvm));
}
if (runSvmAnalysisButtonEl) {
    runSvmAnalysisButtonEl.addEventListener('click', () => {
        if (latestSensorDataSnapshot && latestSensorDataSnapshot.length > 0) {
            runPotabilityAnalysis(latestSensorDataSnapshot[0]);
        } else {
            showModal("No sensor data available to run analysis.");
            if(potabilityAssessmentEl) {
                potabilityAssessmentEl.innerHTML = `<div class="text-gray-500">No data for analysis.</div>`;
            }
        }
    });
}

if (runRandomAnalysisButtonEl) {
    runRandomAnalysisButtonEl.addEventListener('click', runSvmAnalysisWithRandomData);
}


// =================================================================================
// INITIALIZATION
// =================================================================================
async function initializeDashboard() {
    Object.keys(chartConfigs).forEach(canvasId => {
        createChart(canvasId, chartConfigs[canvasId].label, chartConfigs[canvasId].borderColor);
    });

    if (GOOGLE_SHEET_API_KEY.startsWith("YOUR_")) {
         showModal("CRITICAL: Google Sheet API Key needs to be configured with your actual values in js/config.js.");
         if(loadingIndicator) loadingIndicator.classList.add('hidden');
         return;
    }
    
    // Set initial active tab
    switchTab(tabDataChartsButton, tabContentDataCharts);

    refreshDashboardData();
    setInterval(refreshDashboardData, POLLING_INTERVAL_MS);
}

initializeDashboard();
