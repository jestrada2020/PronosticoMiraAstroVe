// Data Visualization Module using Chart.js
class DataVisualization {
    constructor() {
        this.charts = {};
        this.data = null;
    }

    init(appData) {
        this.data = appData;
        this.initializeCharts();
    }

    initializeCharts() {
        // Wait for DOM to be ready and tab to be active
        setTimeout(() => {
            this.createCorrelationChart1();
            this.createCorrelationChart2();
        }, 100);
    }

    updateCorrelations(data) {
        if (!data || data.length === 0) return;
        
        // Ensure charts are initialized before updating
        this.ensureChartsInitialized();
        
        this.updateCorrelationChart1(data);
        this.updateCorrelationChart2(data);
    }

    ensureChartsInitialized() {
        if (!this.charts.correlation1) {
            this.createCorrelationChart1();
        }
        if (!this.charts.correlation2) {
            this.createCorrelationChart2();
        }
    }

    createCorrelationChart1() {
        const canvas = document.getElementById('correlation-chart1');
        if (!canvas) {
            if (window.ErrorHandler) {
                window.ErrorHandler.logWarning('Canvas element correlation-chart1 not found', 'DataVisualization');
            }
            return;
        }
        
        if (!window.ErrorHandler.isElementVisible(canvas)) {
            if (window.ErrorHandler) {
                window.ErrorHandler.logWarning('Canvas element correlation-chart1 not visible', 'DataVisualization');
            }
            return;
        }
        
        const ctx = canvas.getContext('2d');

        this.charts.correlation1 = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'C1 vs C2',
                    data: [],
                    backgroundColor: 'rgba(102, 126, 234, 0.6)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: 0,
                        max: 9,
                        title: {
                            display: true,
                            text: 'C1 (Primera Cifra)'
                        }
                    },
                    y: {
                        min: 0,
                        max: 9,
                        title: {
                            display: true,
                            text: 'C2 (Segunda Cifra)'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Correlación C1 vs C2'
                    },
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    createCorrelationChart2() {
        const canvas = document.getElementById('correlation-chart2');
        if (!canvas) {
            if (window.ErrorHandler) {
                window.ErrorHandler.logWarning('Canvas element correlation-chart2 not found', 'DataVisualization');
            }
            return;
        }
        
        if (!window.ErrorHandler.isElementVisible(canvas)) {
            if (window.ErrorHandler) {
                window.ErrorHandler.logWarning('Canvas element correlation-chart2 not visible', 'DataVisualization');
            }
            return;
        }
        
        const ctx = canvas.getContext('2d');

        this.charts.correlation2 = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'C3 vs C4',
                    data: [],
                    backgroundColor: 'rgba(72, 187, 120, 0.6)',
                    borderColor: 'rgba(72, 187, 120, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: 0,
                        max: 9,
                        title: {
                            display: true,
                            text: 'C3 (Tercera Cifra)'
                        }
                    },
                    y: {
                        min: 0,
                        max: 9,
                        title: {
                            display: true,
                            text: 'C4 (Cuarta Cifra)'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Correlación C3 vs C4'
                    },
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    updateCorrelationChart1(data) {
        if (!this.charts.correlation1) {
            console.warn('Correlation chart 1 not initialized');
            return;
        }

        const correlationData = data
            .filter(row => row.C1 !== undefined && row.C2 !== undefined)
            .map(row => ({
                x: parseInt(row.C1),
                y: parseInt(row.C2)
            }))
            .filter(point => !isNaN(point.x) && !isNaN(point.y));

        this.charts.correlation1.data.datasets[0].data = correlationData;
        this.charts.correlation1.update();
    }

    updateCorrelationChart2(data) {
        if (!this.charts.correlation2) {
            console.warn('Correlation chart 2 not initialized');
            return;
        }

        const correlationData = data
            .filter(row => row.C3 !== undefined && row.C4 !== undefined)
            .map(row => ({
                x: parseInt(row.C3),
                y: parseInt(row.C4)
            }))
            .filter(point => !isNaN(point.x) && !isNaN(point.y));

        this.charts.correlation2.data.datasets[0].data = correlationData;
        this.charts.correlation2.update();
    }

    // Create frequency distribution chart
    createFrequencyChart(elementId, data, field, title) {
        const canvas = document.getElementById(elementId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Calculate frequency distribution
        const frequencies = {};
        data.forEach(row => {
            const value = row[field];
            if (value !== undefined && value !== null) {
                frequencies[value] = (frequencies[value] || 0) + 1;
            }
        });

        // Sort by key
        const sortedFreqs = Object.keys(frequencies)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(key => ({ label: key, count: frequencies[key] }));

        // Destroy existing chart if it exists
        if (this.charts[elementId]) {
            this.charts[elementId].destroy();
        }

        this.charts[elementId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedFreqs.map(item => item.label),
                datasets: [{
                    label: 'Frecuencia',
                    data: sortedFreqs.map(item => item.count),
                    backgroundColor: 'rgba(102, 126, 234, 0.6)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Frecuencia'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: field
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: title
                    }
                }
            }
        });
    }

    // Create time series chart
    createTimeSeriesChart(elementId, data, field, title) {
        const canvas = document.getElementById(elementId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Prepare time series data
        const timeSeriesData = data
            .filter(row => row.Tfecha && row[field] !== undefined)
            .map(row => ({
                x: new Date(row.Tfecha),
                y: parseInt(row[field])
            }))
            .sort((a, b) => a.x - b.x);

        // Destroy existing chart if it exists
        if (this.charts[elementId]) {
            this.charts[elementId].destroy();
        }

        this.charts[elementId] = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: field,
                    data: timeSeriesData,
                    borderColor: 'rgba(102, 126, 234, 1)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 2,
                    pointRadius: 2,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day'
                        },
                        title: {
                            display: true,
                            text: 'Fecha'
                        }
                    },
                    y: {
                        min: 0,
                        max: 9,
                        title: {
                            display: true,
                            text: field
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: title
                    }
                }
            }
        });
    }

    // Create zodiac sign distribution chart
    createZodiacChart(elementId, data, title) {
        const canvas = document.getElementById(elementId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Calculate zodiac sign frequencies
        const signFreqs = {};
        data.forEach(row => {
            if (row.SIGNO) {
                signFreqs[row.SIGNO] = (signFreqs[row.SIGNO] || 0) + 1;
            }
        });

        // Sort by frequency
        const sortedSigns = Object.entries(signFreqs)
            .sort((a, b) => b[1] - a[1]);

        // Colors for zodiac signs
        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
            '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56'
        ];

        // Destroy existing chart if it exists
        if (this.charts[elementId]) {
            this.charts[elementId].destroy();
        }

        this.charts[elementId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: sortedSigns.map(item => item[0]),
                datasets: [{
                    data: sortedSigns.map(item => item[1]),
                    backgroundColor: colors.slice(0, sortedSigns.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: title
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Create pattern analysis heatmap
    createPatternHeatmap(elementId, data, title) {
        const canvas = document.getElementById(elementId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Create 10x10 matrix for digit combinations
        const matrix = Array(10).fill().map(() => Array(10).fill(0));

        // Fill matrix with C1-C2 combinations
        data.forEach(row => {
            const c1 = parseInt(row.C1);
            const c2 = parseInt(row.C2);
            if (!isNaN(c1) && !isNaN(c2) && c1 >= 0 && c1 <= 9 && c2 >= 0 && c2 <= 9) {
                matrix[c1][c2]++;
            }
        });

        // Convert matrix to chart data
        const heatmapData = [];
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                heatmapData.push({
                    x: i,
                    y: j,
                    v: matrix[i][j]
                });
            }
        }

        // Find max value for scaling
        const maxValue = Math.max(...heatmapData.map(d => d.v));

        // Destroy existing chart if it exists
        if (this.charts[elementId]) {
            this.charts[elementId].destroy();
        }

        this.charts[elementId] = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: '频率',
                    data: heatmapData.map(d => ({
                        x: d.x,
                        y: d.y
                    })),
                    backgroundColor: heatmapData.map(d => {
                        const intensity = d.v / maxValue;
                        return `rgba(102, 126, 234, ${intensity})`;
                    }),
                    pointRadius: heatmapData.map(d => {
                        return Math.max(3, (d.v / maxValue) * 15);
                    })
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: -0.5,
                        max: 9.5,
                        ticks: {
                            stepSize: 1
                        },
                        title: {
                            display: true,
                            text: 'C1'
                        }
                    },
                    y: {
                        min: -0.5,
                        max: 9.5,
                        ticks: {
                            stepSize: 1
                        },
                        title: {
                            display: true,
                            text: 'C2'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: title
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const dataIndex = context.dataIndex;
                                const point = heatmapData[dataIndex];
                                return `C1: ${point.x}, C2: ${point.y}, Frecuencia: ${point.v}`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Create prediction accuracy chart
    createAccuracyChart(elementId, accuracyData, title) {
        const canvas = document.getElementById(elementId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Destroy existing chart if it exists
        if (this.charts[elementId]) {
            this.charts[elementId].destroy();
        }

        this.charts[elementId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: accuracyData.map((_, index) => `Época ${index + 1}`),
                datasets: [{
                    label: 'Precisión de Entrenamiento',
                    data: accuracyData,
                    borderColor: 'rgba(72, 187, 120, 1)',
                    backgroundColor: 'rgba(72, 187, 120, 0.1)',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Precisión (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Época de Entrenamiento'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: title
                    }
                }
            }
        });
    }

    // Utility method to destroy all charts
    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    // Method to resize all charts
    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }

    // Export chart as image
    exportChart(chartId, filename) {
        const chart = this.charts[chartId];
        if (!chart) {
            alert('Gráfico no encontrado');
            return;
        }

        const url = chart.toBase64Image();
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `chart_${chartId}_${Date.now()}.png`;
        a.click();
    }
}

// Initialize data visualization when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dataVisualization = new DataVisualization();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.dataVisualization) {
            window.dataVisualization.resizeCharts();
        }
    });
});