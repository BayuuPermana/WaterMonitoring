// js/chartManager.js
import { i18n } from './i18n.js';

// This object will hold all chart instances, keyed by canvasId
export const charts = {};

// Configuration for each chart: label for y-axis, border color, and data key from sheet
export const chartConfigs = {
    suhuChart: { labelKey: 'tempLabel', borderColor: 'rgb(255, 99, 132)', dataKey: 'Suhu' },
    tdsChart: { labelKey: 'tdsLabel', borderColor: 'rgb(54, 162, 235)', dataKey: 'TDS' },
    salinitasChart: { labelKey: 'salinityLabel', borderColor: 'rgb(75, 192, 192)', dataKey: 'Salinitas' },
    phChart: { labelKey: 'phLabel', borderColor: 'rgb(153, 102, 255)', dataKey: 'pH' },
    turbiditasChart: { labelKey: 'turbidityLabel', borderColor: 'rgb(255, 159, 64)', dataKey: 'Turbiditas' }
};

/**
 * Creates a new Chart.js instance for a given canvas.
 * @param {string} canvasId - The ID of the canvas element.
 * @param {string} label - The label for the dataset (used for y-axis title).
 * @param {string} borderColor - The color of the line.
 * @returns {Chart} The Chart.js instance.
 */
export function createChart(canvasId, labelKey, borderColor) {
    const label = i18n.t(labelKey);
    const canvasElement = document.getElementById(canvasId);
    if (!canvasElement) {
        console.error(`Canvas element with ID '${canvasId}' not found!`);
        return null;
    }
    const ctx = canvasElement.getContext('2d');
    const chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], // These will be populated with ServerTimeStamp strings
            datasets: [{
                label: label,
                data: [],
                borderColor: borderColor,
                borderWidth: 2,
                fill: false,
                tension: 0.1,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHitRadius: 10,
                // spanGaps: 5 * 60 * 1000, // spanGaps behaves differently with category scale.
                // It will span over null/undefined data points if true.
                // If data is simply missing (no point for that category), it won't draw.
                // Let's set it to false to break line on explicit nulls.
                spanGaps: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'category',
                    title: { display: true, text: i18n.t('timeAxisLabel') },
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 8,
                        maxRotation: 45,
                        minRotation: 0,
                        callback: function (value, index, ticks) {
                            // Format: show only time portion (HH:MM:SS) for cleaner look
                            const label = this.getLabelForValue(value);
                            if (label && label !== 'N/A') {
                                const parts = label.split(' ');
                                if (parts.length >= 2) {
                                    return parts[1]; // Return time portion only
                                }
                            }
                            return label;
                        }
                    }
                },
                y: {
                    title: { display: true, text: label.split('(')[0].trim() }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                },
                title: {
                    display: true,
                    text: label,
                    font: {
                        size: 16,
                    },
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: function (tooltipItems) {
                            // Show full timestamp in tooltip
                            if (tooltipItems.length > 0) {
                                return tooltipItems[0].label;
                            }
                            return '';
                        }
                    }
                }
            }
        }
    });
    charts[canvasId] = chartInstance;
    return chartInstance;
}

/**
 * Initializes all charts defined in chartConfigs.
 */
export function initializeAllCharts() {
    Object.keys(chartConfigs).forEach(canvasId => {
        const config = chartConfigs[canvasId];
        createChart(canvasId, config.labelKey, config.borderColor);
    });

    i18n.subscribe(() => {
        updateChartLabels();
    });
}

function updateChartLabels() {
    Object.keys(charts).forEach(canvasId => {
        const chart = charts[canvasId];
        const config = chartConfigs[canvasId];
        if (chart && config) {
            const newLabel = i18n.t(config.labelKey);

            // Update dataset label
            if (chart.data.datasets[0]) {
                chart.data.datasets[0].label = newLabel;
            }

            // Update Y-axis title
            if (chart.options.scales.y.title) {
                chart.options.scales.y.title.text = newLabel.split('(')[0].trim();
            }

            // Update Chart Title
            if (chart.options.plugins.title) {
                chart.options.plugins.title.text = newLabel;
            }

            // Update X-axis title
            if (chart.options.scales.x.title) {
                chart.options.scales.x.title.text = i18n.t('timeAxisLabel');
            }

            chart.update();
        }
    });
}

/**
 * Updates all charts with new data.
 * @param {Array<object>} dataArray - Array of processed data objects, sorted oldest to newest.
                                      Each object must have a 'ServerTimeStamp' string property
                                      and a property matching the chart's 'dataKey'.
 */
export function updateAllCharts(dataArray) {
    const allDataForChart = dataArray; // dataArray is already sorted oldest first

    // For category scale, labels are the ServerTimeStamp strings
    const labels = allDataForChart.map(doc => doc.ServerTimeStamp || 'N/A');

    Object.keys(charts).forEach(key => { // key here is canvasId like 'suhuChart'
        if (charts[key] && chartConfigs[key]) {
            const dataKey = chartConfigs[key].dataKey;
            charts[key].data.labels = labels;
            charts[key].data.datasets[0].data = allDataForChart.map(doc => doc[dataKey]);
            charts[key].update();
        } else {
            console.warn(`Chart or chart config not found for key: ${key}`);
        }
    });
}
