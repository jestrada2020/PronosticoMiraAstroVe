// Main Application Controller
class PronosticoApp {
    constructor() {
        this.data = {
            main: null,
            inverse: null,
            base4cifras: null,
            base3cifras: null,
            seg: null
        };
        this.filesLoaded = {
            main: false,
            inverse: false,
            base4cifras: false,
            base3cifras: false,
            seg: false
        };
        this.currentTab = 'config';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateValidationStatus();
        this.initializeDateInputs();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Base tabs in general section
        document.querySelectorAll('.base-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchBaseTab(e.target.dataset.base);
            });
        });

        // Control inputs
        document.getElementById('num-datos').addEventListener('change', (e) => {
            this.updateDataRange(parseInt(e.target.value));
        });

        document.getElementById('fecha-inicio').addEventListener('change', () => {
            this.filterDataByDate();
        });

        document.getElementById('fecha-fin').addEventListener('change', () => {
            this.filterDataByDate();
        });

        // Search controls
        document.getElementById('vini-id').addEventListener('change', () => {
            this.updateGeneralSearch();
        });

        document.getElementById('vfinal-id').addEventListener('change', () => {
            this.updateGeneralSearch();
        });

        document.getElementById('signo-select').addEventListener('change', () => {
            this.updateGeneralSearch();
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;
        this.onTabSwitch(tabName);
    }

    switchBaseTab(baseType) {
        // Update base tab buttons
        document.querySelectorAll('.base-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-base="${baseType}"]`).classList.add('active');

        // Update base content
        document.querySelectorAll('.base-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`base-${baseType}`).classList.add('active');

        this.loadBaseData(baseType);
    }

    onTabSwitch(tabName) {
        switch(tabName) {
            case 'config':
                this.loadConfigurationData();
                break;
            case 'general':
                this.loadGeneralSearchData();
                break;
            case 'pronostico0':
                this.initPatternForecast();
                break;
            case 'ml':
                this.initMLForecast();
                // Also force refresh ML status display after tab switch
                setTimeout(() => {
                    if (window.mlForecast) {
                        window.mlForecast.displayModelStatus();
                    }
                }, 200);
                break;
            case 'ml-advanced':
                this.initMLAdvanced();
                // Also force refresh ML Advanced status display
                setTimeout(() => {
                    if (window.mlAdvanced) {
                        window.mlAdvanced.displayAdvancedStatus();
                    }
                }, 200);
                break;
        }
    }

    updateValidationStatus() {
        const allLoaded = Object.values(this.filesLoaded).every(loaded => loaded);
        const messageEl = document.getElementById('validation-message');
        const statusEl = messageEl.parentElement;

        console.log('Updating validation status. All loaded:', allLoaded);
        console.log('Files loaded:', this.filesLoaded);

        if (allLoaded) {
            messageEl.textContent = '✓ Todos los archivos CSV han sido cargados correctamente';
            statusEl.className = 'validation-status valid';
        } else {
            const missing = Object.keys(this.filesLoaded).filter(key => !this.filesLoaded[key]);
            const loaded = Object.keys(this.filesLoaded).filter(key => this.filesLoaded[key]);
            console.log('Missing files:', missing);
            console.log('Loaded files:', loaded);
            
            if (loaded.length > 0) {
                messageEl.textContent = `Cargados: ${loaded.join(', ')} | Faltan: ${missing.join(', ')}`;
            } else {
                messageEl.textContent = `Faltan archivos: ${missing.join(', ')}`;
            }
            statusEl.className = 'validation-status invalid';
        }
    }

    initializeDateInputs() {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        document.getElementById('fecha-inicio').value = startDate.toISOString().split('T')[0];
        document.getElementById('fecha-fin').value = endDate.toISOString().split('T')[0];
    }

    updateDataRange(numDatos) {
        if (this.data.main && this.data.main.length > 0) {
            const maxRows = Math.min(numDatos, this.data.main.length);
            this.loadConfigurationData(maxRows);
        }
    }

    filterDataByDate() {
        const startDate = document.getElementById('fecha-inicio').value;
        const endDate = document.getElementById('fecha-fin').value;

        if (!startDate || !endDate || !this.data.main) return;

        const filteredData = this.data.main.filter(row => {
            const rowDate = new Date(row.Tfecha);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return rowDate >= start && rowDate <= end;
        });

        this.loadConfigurationData(null, filteredData);
    }

    loadConfigurationData(maxRows = null, filteredData = null) {
        if (!this.data.main) return;

        const dataToUse = filteredData || this.data.main;
        const displayData = maxRows ? dataToUse.slice(0, maxRows) : dataToUse;

        // Update pattern table
        this.updatePatternTable(displayData);

        // Update correlations if visualization is available
        if (window.dataVisualization) {
            // Initialize data visualization if not already done
            if (!window.dataVisualization.data) {
                window.dataVisualization.init(this.data);
            }
            window.dataVisualization.updateCorrelations(displayData);
        }
    }

    updatePatternTable(data) {
        const tableContainer = document.getElementById('pattern-table');
        if (!data || data.length === 0) {
            tableContainer.innerHTML = '<p>No hay datos disponibles</p>';
            return;
        }

        // Analyze last 3 digits patterns
        const patterns = {};
        data.forEach(row => {
            if (row.ULT3) {
                const pattern = row.ULT3.toString();
                patterns[pattern] = (patterns[pattern] || 0) + 1;
            }
        });

        // Sort patterns by frequency
        const sortedPatterns = Object.entries(patterns)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20); // Top 20 patterns

        const table = `
            <table>
                <thead>
                    <tr>
                        <th>Patrón ULT3</th>
                        <th>Frecuencia</th>
                        <th>Porcentaje</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedPatterns.map(([pattern, count]) => {
                        const percentage = ((count / data.length) * 100).toFixed(2);
                        return `
                            <tr>
                                <td><strong>${pattern}</strong></td>
                                <td>${count}</td>
                                <td>${percentage}%</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

        tableContainer.innerHTML = table;
    }

    loadGeneralSearchData() {
        if (!this.data.seg) return;

        this.updateWinnersTable();
        this.loadBaseData('4cifras');
    }

    updateGeneralSearch() {
        const viniId = parseInt(document.getElementById('vini-id').value) || 1;
        const vfinalId = parseInt(document.getElementById('vfinal-id').value) || 100;
        const selectedSigno = document.getElementById('signo-select').value;

        if (!this.data.main) return;

        let filteredData = this.data.main.filter(row => {
            const id = parseInt(row.ID);
            return id >= viniId && id <= vfinalId;
        });

        if (selectedSigno) {
            filteredData = filteredData.filter(row => row.SIGNO === selectedSigno);
        }

        this.updateWinnersTable(filteredData);
    }

    updateWinnersTable(data = null) {
        const tableContainer = document.getElementById('winners-table');
        const dataToUse = data || this.data.seg || [];

        if (dataToUse.length === 0) {
            tableContainer.innerHTML = '<p>No hay datos de ganadores disponibles</p>';
            return;
        }

        const displayData = dataToUse.slice(0, 50); // Show first 50 records

        const table = `
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Número Ganador</th>
                        <th>Signo</th>
                        <th>ID</th>
                        <th>Mes</th>
                    </tr>
                </thead>
                <tbody>
                    ${displayData.map(row => `
                        <tr>
                            <td>${row.Tfecha || row.FECHA || ''}</td>
                            <td><strong>${row.NUM || row.GANO || ''}</strong></td>
                            <td>${row.SIGNO || ''}</td>
                            <td>${row.ID || ''}</td>
                            <td>${row.MES || ''}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        tableContainer.innerHTML = table;
    }

    loadBaseData(type) {
        const tableContainer = document.getElementById(`base-${type}-table`);
        const data = type === '4cifras' ? this.data.base4cifras : this.data.base3cifras;

        if (!data || data.length === 0) {
            tableContainer.innerHTML = '<p>No hay datos base disponibles</p>';
            return;
        }

        const displayData = data.slice(0, 50); // Show first 50 records
        const columns = Object.keys(displayData[0]).slice(0, 8); // Show first 8 columns

        const table = `
            <table>
                <thead>
                    <tr>
                        ${columns.map(col => `<th>${col}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${displayData.map(row => `
                        <tr>
                            ${columns.map(col => `<td>${row[col] || ''}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        tableContainer.innerHTML = table;
    }

    initPatternForecast() {
        if (window.patternForecast) {
            window.patternForecast.init(this.data);
        }
    }

    initMLForecast() {
        if (window.mlForecast) {
            console.log('🔧 Initializing ML Forecast with current app data:', {
                hasMain: !!this.data.main,
                hasInverse: !!this.data.inverse,
                mainLength: this.data.main ? this.data.main.length : 0,
                inverseLength: this.data.inverse ? this.data.inverse.length : 0,
                allDataKeys: Object.keys(this.data),
                filesLoadedStatus: this.filesLoaded
            });
            
            // Force a fresh copy of data
            const freshData = {
                main: this.data.main ? [...this.data.main] : null,
                inverse: this.data.inverse ? [...this.data.inverse] : null,
                base4cifras: this.data.base4cifras ? [...this.data.base4cifras] : null,
                base3cifras: this.data.base3cifras ? [...this.data.base3cifras] : null,
                seg: this.data.seg ? [...this.data.seg] : null
            };
            
            // Always pass the most current data
            window.mlForecast.init(freshData);
            
            // Verify the data was passed correctly with multiple checks
            console.log('✅ ML Forecast initialized. Verifying data transfer...');
            setTimeout(() => {
                const mlData = window.mlForecast.data;
                const hasValidData = mlData && mlData.main && mlData.inverse && 
                                   mlData.main.length > 0 && mlData.inverse.length > 0;
                
                if (hasValidData) {
                    console.log('✅ ML data transfer verified successfully');
                    console.log('- ML Main data:', mlData.main.length, 'records');
                    console.log('- ML Inverse data:', mlData.inverse.length, 'records');
                    // Display updated status immediately
                    window.mlForecast.displayModelStatus();
                } else {
                    console.warn('⚠️ ML data transfer verification failed');
                    console.log('- MLForecast data object:', mlData);
                    console.log('- Calling force refresh...');
                    
                    const refreshResult = window.mlForecast.forceDataRefresh();
                    if (!refreshResult) {
                        console.error('❌ Force refresh also failed');
                        // One more attempt with direct assignment
                        window.mlForecast.data = freshData;
                        window.mlForecast.displayModelStatus();
                    }
                }
            }, 150);
        } else {
            console.warn('MLForecast not available');
        }
    }

    initMLAdvanced() {
        if (window.mlAdvanced) {
            console.log('🚀 Initializing ML Advanced with current app data:', {
                hasMain: !!this.data.main,
                hasInverse: !!this.data.inverse,
                mainLength: this.data.main ? this.data.main.length : 0,
                inverseLength: this.data.inverse ? this.data.inverse.length : 0,
                allDataKeys: Object.keys(this.data),
                filesLoadedStatus: this.filesLoaded
            });
            
            // Force a fresh copy of data for ML Advanced
            const freshData = {
                main: this.data.main ? [...this.data.main] : null,
                inverse: this.data.inverse ? [...this.data.inverse] : null,
                base4cifras: this.data.base4cifras ? [...this.data.base4cifras] : null,
                base3cifras: this.data.base3cifras ? [...this.data.base3cifras] : null,
                seg: this.data.seg ? [...this.data.seg] : null
            };
            
            // Initialize ML Advanced with fresh data
            window.mlAdvanced.init(freshData);
            
            // Verify the data was passed correctly
            console.log('✅ ML Advanced initialized. Verifying data transfer...');
            setTimeout(() => {
                const mlData = window.mlAdvanced.data;
                const hasValidData = mlData && mlData.main && mlData.inverse && 
                                   mlData.main.length > 0 && mlData.inverse.length > 0;
                
                if (hasValidData) {
                    console.log('✅ ML Advanced data transfer verified successfully');
                    console.log('- ML Advanced Main data:', mlData.main.length, 'records');
                    console.log('- ML Advanced Inverse data:', mlData.inverse.length, 'records');
                } else {
                    console.warn('⚠️ ML Advanced data transfer verification failed');
                    console.log('- MLAdvanced data object:', mlData);
                    
                    // Try direct assignment as fallback
                    window.mlAdvanced.data = freshData;
                    window.mlAdvanced.displayAdvancedStatus();
                }
            }, 150);
        } else {
            console.warn('MLAdvanced not available');
        }
    }

    showLoading() {
        document.getElementById('loading-overlay').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    }

    showError(message) {
        alert(`Error: ${message}`);
    }

    showSuccess(message) {
        console.log(`Success: ${message}`);
    }

    // Method to be called when files are loaded
    onFileLoaded(fileType, data) {
        console.log(`File loaded: ${fileType}, rows: ${data.length}`);
        this.data[fileType] = data;
        this.filesLoaded[fileType] = true;
        
        console.log('Files loaded status:', this.filesLoaded);
        this.updateValidationStatus();

        // Trigger appropriate updates based on current tab
        if (this.currentTab === 'config' && this.filesLoaded.main) {
            this.loadConfigurationData();
        } else if (this.currentTab === 'general' && (this.filesLoaded.seg || this.filesLoaded.base4cifras || this.filesLoaded.base3cifras)) {
            this.loadGeneralSearchData();
        } else if (this.currentTab === 'ml' && this.filesLoaded.main && this.filesLoaded.inverse) {
            this.initMLForecast();
        }

        // Always initialize ML and pattern forecast when data is loaded (for background processing)
        if (this.filesLoaded.main && this.filesLoaded.inverse) {
            console.log('Both main and inverse files loaded, initializing ML systems...');
            this.initMLForecast();
            this.initMLAdvanced();
        } else {
            console.log('Not all required files loaded yet for ML. Main:', this.filesLoaded.main, 'Inverse:', this.filesLoaded.inverse);
        }
        if (this.filesLoaded.main) {
            this.initPatternForecast();
        }
    }

    // Method to be called when file loading fails
    onFileError(fileType, error) {
        console.error(`File error: ${fileType}, error: ${error}`);
        this.filesLoaded[fileType] = false;
        this.updateValidationStatus();
        this.showError(`Error loading ${fileType}: ${error}`);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PronosticoApp();
});