// Pattern-based Forecasting Module
class PatternForecast {
    constructor() {
        this.data = null;
        this.currentPattern = null;
        this.triangleResults = null;
    }

    init(appData) {
        this.data = appData;
        this.setupEventListeners();
        this.loadULT3Table();
    }

    setupEventListeners() {
        // Pattern search button
        document.getElementById('search-pattern').addEventListener('click', () => {
            this.searchPattern();
        });

        // Pattern type change
        document.getElementById('pattern-type').addEventListener('change', () => {
            this.updatePatternSearch();
        });

        // Digit inputs
        ['dc1', 'dc2', 'dc3', 'dc4'].forEach(id => {
            document.getElementById(id).addEventListener('input', (e) => {
                this.validateDigitInput(e.target);
            });
        });
    }

    validateDigitInput(input) {
        let value = parseInt(input.value);
        if (isNaN(value) || value < 0 || value > 9) {
            input.value = '';
        }
    }

    loadULT3Table() {
        if (!this.data.main) return;

        const tableContainer = document.getElementById('ult3-table');
        
        // Analyze ULT3 patterns and their frequency
        const ult3Patterns = {};
        this.data.main.forEach(row => {
            if (row.ULT3) {
                const pattern = row.ULT3.toString();
                if (!ult3Patterns[pattern]) {
                    ult3Patterns[pattern] = {
                        count: 0,
                        lastSeen: null,
                        followedBy: {}
                    };
                }
                ult3Patterns[pattern].count++;
                ult3Patterns[pattern].lastSeen = row.Tfecha;
            }
        });

        // Sort patterns by frequency
        const sortedPatterns = Object.entries(ult3Patterns)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 30); // Top 30 patterns

        const table = `
            <table>
                <thead>
                    <tr>
                        <th>ULT3</th>
                        <th>Frecuencia</th>
                        <th>Probabilidad</th>
                        <th>Última Vez</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedPatterns.map(([pattern, data]) => {
                        const probability = ((data.count / this.data.main.length) * 100).toFixed(2);
                        return `
                            <tr>
                                <td><strong>${pattern}</strong></td>
                                <td>${data.count}</td>
                                <td>${probability}%</td>
                                <td>${data.lastSeen || 'N/A'}</td>
                                <td>
                                    <button onclick="window.patternForecast.analyzePattern('${pattern}')" 
                                            class="search-btn" style="padding: 5px 10px; font-size: 0.8rem;">
                                        Analizar
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

        tableContainer.innerHTML = table;
    }

    searchPattern() {
        const dc1 = document.getElementById('dc1').value;
        const dc2 = document.getElementById('dc2').value;
        const dc3 = document.getElementById('dc3').value;
        const dc4 = document.getElementById('dc4').value;
        const patternType = document.getElementById('pattern-type').value;

        if (!dc1 && !dc2 && !dc3 && !dc4) {
            alert('Por favor ingrese al menos un dígito para buscar');
            return;
        }

        this.currentPattern = { dc1, dc2, dc3, dc4, type: patternType };
        this.performPatternSearch();
    }

    performPatternSearch() {
        if (!this.data.main || !this.currentPattern) return;

        const { dc1, dc2, dc3, dc4, type } = this.currentPattern;
        
        // Filter data based on pattern
        let filteredData = this.data.main.filter(row => {
            let match = true;
            
            if (dc1 && row.C1 != dc1) match = false;
            if (dc2 && row.C2 != dc2) match = false;
            if (dc3 && row.C3 != dc3) match = false;
            if (dc4 && row.C4 != dc4) match = false;

            // Additional filtering based on pattern type
            if (match) {
                switch (type) {
                    case 'PM2':
                        return row.PM2 !== undefined;
                    case 'ULT2':
                        return row.ULT2 !== undefined;
                    case 'DC':
                        return row.DC !== undefined;
                    case 'EXT':
                        return row.EXT !== undefined;
                    case 'C1C3':
                        return row.C1C3 !== undefined;
                    case 'C2C4':
                        return row.C2C4 !== undefined;
                    default:
                        return true;
                }
            }
            return match;
        });

        this.displayPatternResults(filteredData);
        this.generateTriangleCalculation();
    }

    displayPatternResults(filteredData) {
        const resultsContainer = document.getElementById('pattern-forecast');
        
        if (filteredData.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <p>No se encontraron resultados para el patrón especificado.</p>
                </div>
            `;
            return;
        }

        // Analyze next occurrences after pattern matches
        const nextNumbers = this.analyzeNextOccurrences(filteredData);
        
        const resultsHtml = `
            <div class="pattern-analysis">
                <h4>Análisis del Patrón</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">Coincidencias encontradas:</span>
                        <span class="stat-value">${filteredData.length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Probabilidad de aparición:</span>
                        <span class="stat-value">${((filteredData.length / this.data.main.length) * 100).toFixed(2)}%</span>
                    </div>
                </div>
            </div>

            <div class="next-predictions">
                <h4>Números más probables después del patrón:</h4>
                <div class="prediction-grid">
                    ${nextNumbers.slice(0, 10).map((item, index) => `
                        <div class="prediction-item">
                            <div class="prediction-number">${item.number}</div>
                            <div class="prediction-probability">${item.probability}%</div>
                            <div class="prediction-rank">#${index + 1}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="pattern-details">
                <h4>Últimas 10 ocurrencias:</h4>
                <div class="occurrences-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Número</th>
                                <th>Signo</th>
                                <th>Día</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredData.slice(-10).reverse().map(row => `
                                <tr>
                                    <td>${row.Tfecha}</td>
                                    <td><strong>${row.NUM}</strong></td>
                                    <td>${row.SIGNO}</td>
                                    <td>${row.nDIA}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        resultsContainer.innerHTML = resultsHtml;
    }

    analyzeNextOccurrences(patternData) {
        if (!this.data.main || patternData.length === 0) return [];

        const nextNumbers = {};
        
        // Find what numbers came after each pattern occurrence
        patternData.forEach(patternRow => {
            const patternIndex = this.data.main.findIndex(row => 
                row.ID === patternRow.ID && row.Tfecha === patternRow.Tfecha
            );
            
            if (patternIndex >= 0 && patternIndex < this.data.main.length - 1) {
                const nextRow = this.data.main[patternIndex + 1];
                if (nextRow && nextRow.NUM) {
                    const nextNum = nextRow.NUM.toString();
                    nextNumbers[nextNum] = (nextNumbers[nextNum] || 0) + 1;
                }
            }
        });

        // Convert to array and sort by frequency
        const sortedNumbers = Object.entries(nextNumbers)
            .map(([number, count]) => ({
                number,
                count,
                probability: ((count / patternData.length) * 100).toFixed(1)
            }))
            .sort((a, b) => b.count - a.count);

        return sortedNumbers;
    }

    generateTriangleCalculation() {
        if (!this.currentPattern) return;

        const { dc1, dc2, dc3, dc4 } = this.currentPattern;
        const digits = [dc1, dc2, dc3, dc4].filter(d => d !== '').map(Number);
        
        if (digits.length < 2) {
            document.getElementById('triangle-display').innerHTML = 'Necesita al menos 2 dígitos para el cálculo triangular.';
            return;
        }

        const triangleSteps = this.calculateTriangle(digits);
        this.displayTriangleCalculation(triangleSteps);
    }

    calculateTriangle(digits) {
        const steps = [];
        let currentRow = [...digits];
        steps.push([...currentRow]);

        while (currentRow.length > 1) {
            const nextRow = [];
            for (let i = 0; i < currentRow.length - 1; i++) {
                let sum = currentRow[i] + currentRow[i + 1];
                if (sum > 10) {
                    sum = sum - 10;
                } else if (sum === 10) {
                    sum = 0;
                }
                nextRow.push(sum);
            }
            currentRow = nextRow;
            steps.push([...currentRow]);
        }

        return steps;
    }

    displayTriangleCalculation(steps) {
        const triangleContainer = document.getElementById('triangle-display');
        
        let triangleHtml = '<div class="triangle-visualization">';
        
        steps.forEach((row, index) => {
            const indent = ' '.repeat(index * 2);
            const rowStr = row.join(' ');
            triangleHtml += `<div class="triangle-row">${indent}${rowStr}</div>`;
        });
        
        triangleHtml += '</div>';

        // Add calculation explanation
        const finalResult = steps[steps.length - 1][0];
        triangleHtml += `
            <div class="triangle-result">
                <h5>Resultado Final: <span class="final-digit">${finalResult}</span></h5>
                <p>Este dígito se obtiene aplicando la reducción triangular:</p>
                <ul>
                    <li>Si suma > 10: resultado = suma - 10</li>
                    <li>Si suma = 10: resultado = 0</li>
                    <li>Si suma < 10: resultado = suma</li>
                </ul>
            </div>
        `;

        triangleContainer.innerHTML = triangleHtml;
        this.triangleResults = { steps, finalResult };
    }

    analyzePattern(ult3Pattern) {
        // Set the pattern in the search form
        if (ult3Pattern.length >= 3) {
            const digits = ult3Pattern.split('');
            document.getElementById('dc2').value = digits[0] || '';
            document.getElementById('dc3').value = digits[1] || '';
            document.getElementById('dc4').value = digits[2] || '';
            document.getElementById('pattern-type').value = 'ULT3';
        }
        
        // Perform the search
        this.searchPattern();
        
        // Scroll to results
        document.getElementById('pattern-forecast').scrollIntoView({ behavior: 'smooth' });
    }

    // Export pattern results
    exportPatternResults() {
        if (!this.currentPattern) {
            alert('No hay resultados de patrón para exportar');
            return;
        }

        const results = {
            pattern: this.currentPattern,
            triangleResults: this.triangleResults,
            timestamp: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pattern_analysis_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Get pattern statistics
    getPatternStatistics() {
        if (!this.data.main) return null;

        const stats = {
            totalRecords: this.data.main.length,
            uniqueULT3: new Set(this.data.main.map(row => row.ULT3).filter(Boolean)).size,
            uniqueSignos: new Set(this.data.main.map(row => row.SIGNO).filter(Boolean)).size,
            dateRange: {
                start: Math.min(...this.data.main.map(row => new Date(row.Tfecha).getTime())),
                end: Math.max(...this.data.main.map(row => new Date(row.Tfecha).getTime()))
            }
        };

        return stats;
    }
}

// Initialize pattern forecast when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.patternForecast = new PatternForecast();
});