// js/main.js
import { POLLING_INTERVAL_MS, GOOGLE_SHEET_API_KEY } from './config.js';
import {
    latestSuhuEl, latestTDSEl, latestSalinitasEl, latestPHEl, latestTurbiditasEl,
    latestServerTimeStampEl, exportCsvButton, refreshDataButtonEl, showModal,
    tabDataChartsButton, tabSvmButton, tabContentDataCharts, tabContentSvm,
    svmExplanationEl, potabilityAssessmentEl, runSvmAnalysisButtonEl,
    loadingIndicator
} from './uiElements.js';
import { chartConfigs, createChart, updateAllCharts } from './chartManager.js';
import { fetchSheetData } from './dataService.js';
import { convertToCSV } from './utils.js';
import { initSvmAnalysis } from './svmAnalysis.js';

// Store the latest fetched sensor data to be used by the rule-based analysis
export let latestSensorDataSnapshot = null;

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



    } else {
        latestSensorDataSnapshot = null;
        if(latestSuhuEl) latestSuhuEl.textContent = na;
        if(latestTDSEl) latestTDSEl.textContent = na;
        if(latestSalinitasEl) latestSalinitasEl.textContent = na;
        if(latestPHEl) latestPHEl.textContent = na;
        if(latestTurbiditasEl) latestTurbiditasEl.textContent = na;
        if(latestServerTimeStampEl) latestServerTimeStampEl.textContent = na;

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

    initSvmAnalysis();

    refreshDashboardData();
    setInterval(refreshDashboardData, POLLING_INTERVAL_MS);
}

initializeDashboard();
