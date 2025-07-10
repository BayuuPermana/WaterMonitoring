// js/chartManager.js

// This object will hold all chart instances, keyed by canvasId
export const charts = {};

// Configuration for each chart: label for y-axis, border color, and data key from sheet
export const chartConfigs = {
    suhuChart:       { label: 'Suhu (°C)',    borderColor: 'rgb(255, 99, 132)', dataKey: 'Suhu' },
    tdsChart:        { label: 'TDS (ppm)',    borderColor: 'rgb(54, 162, 235)', dataKey: 'TDS' },
    salinitasChart:  { label: 'Salinitas (ppt)',    borderColor: 'rgb(75, 192, 192)', dataKey: 'Salinitas' },
    phChart:         { label: 'pH',           borderColor: 'rgb(153, 102, 255)',dataKey: 'pH' },
    turbiditasChart: { label: 'Kekeruhan (NTU)',   borderColor: 'rgb(255, 159, 64)', dataKey: 'Turbiditas' }
};

/**
 * Creates a new Chart.js instance for a given canvas.
 * @param {string} canvasId - The ID of the canvas element.
 * @param {string} label - The label for the dataset (used for y-axis title).
 * @param {string} borderColor - The color of the line.
 * @returns {Chart} The Chart.js instance.
 */
export function createChart(canvasId, label, borderColor) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const chartInstance = new Chart(ctx, {
        type: 'line',
        data: { 
            labels: [], // These will be populated with ServerTimeStamp strings
            datasets: [{ 
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
                    type: 'category', // CHANGED from 'time'
                    title: { display: true, text: 'Time (ServerTimeStamp - Categorical)' }, // Updated title
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 10, // Limit the number of visible ticks to avoid clutter
                        maxRotation: 70,   // Rotate labels if they overlap
                        minRotation: 20
                    }
                },
                y: { 
                    title: { display: true, text: label.split('(')[0].trim() } 
                }
            },
            plugins: { 
                legend: { 
                    display: false 
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                    // Tooltip will show the category label (ServerTimeStamp string)
                }
            }
        }
    });
    charts[canvasId] = chartInstance;
    return chartInstance;
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
