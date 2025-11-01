// js/uiElements.js

// =================================================================================
// UI ELEMENT SELECTORS
// =================================================================================

// Latest Readings
export const latestSuhuEl = document.getElementById('latestSuhu');
export const latestTDSEl = document.getElementById('latestTDS');
export const latestSalinitasEl = document.getElementById('latestSalinitas');
export const latestPHEl = document.getElementById('latestPH');
export const latestTurbiditasEl = document.getElementById('latestTurbiditas');
export const latestServerTimeStampEl = document.getElementById('latestServerTimeStamp');

// Controls
export const loadingIndicator = document.getElementById('loadingIndicator');
export const exportCsvButton = document.getElementById('exportCsvButton');
export const refreshDataButtonEl = document.getElementById('refreshDataButton');

// Tab System
export const tabDataChartsButton = document.getElementById('tabDataCharts');
export const tabSvmButton = document.getElementById('tabSvm');
export const tabContentDataCharts = document.getElementById('tabContentDataCharts');
export const tabContentSvm = document.getElementById('tabContentSvm');

// SVM Tab Specific
export const svmExplanationEl = document.getElementById('svmExplanation');
export const potabilityAssessmentEl = document.getElementById('potabilityAssessment');
export const runSvmAnalysisButtonEl = document.getElementById('runSvmAnalysisButton');
export const modelFileInputEl = document.getElementById('modelFileInput');
export const runRandomAnalysisButtonEl = document.getElementById('runRandomAnalysisButton');
export const randomAnalysisResultEl = document.getElementById('randomAnalysisResult');


// =================================================================================
// MODAL DIALOG LOGIC
// =================================================================================
const infoModal = document.getElementById('infoModal');
const infoModalMessage = document.getElementById('infoModalMessage');
const infoModalOkButton = document.getElementById('infoModalOkButton');

export function showModal(message) {
    if (infoModalMessage && infoModal) {
        infoModalMessage.textContent = message;
        infoModal.style.display = "block";
    } else {
        console.warn("Modal elements not found. Message:", message);
        alert(message); // Fallback to alert if modal is broken
    }
}

if (infoModalOkButton && infoModal) {
    infoModalOkButton.onclick = function () {
        infoModal.style.display = "none";
    }
}

window.onclick = function (event) {
    if (event.target == infoModal) {
        if (infoModal) {
            infoModal.style.display = "none";
        }
    }
}
