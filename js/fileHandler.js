// File Handler for CSV Upload and Validation
class FileHandler {
    constructor() {
        this.requiredFiles = {
            'file-main': { type: 'main', statusId: 'main', name: 'Archivo Principal' },
            'file-inv': { type: 'inverse', statusId: 'inv', name: 'Archivo Inverso' },
            'file-4cifras': { type: 'base4cifras', statusId: '4cifras', name: 'Base 4 Cifras' },
            'file-3cifras': { type: 'base3cifras', statusId: '3cifras', name: 'Base 3 Cifras' },
            'file-seg': { type: 'seg', statusId: 'seg', name: 'Archivo SEG' }
        };
        this.dataAdapter = window.DataAdapter ? new window.DataAdapter() : null;
        this.init();
    }

    init() {
        this.setupFileInputs();
    }

    setupFileInputs() {
        Object.keys(this.requiredFiles).forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('change', (e) => {
                    this.handleFileUpload(e, inputId);
                });
            }
        });
    }

    async handleFileUpload(event, inputId) {
        const file = event.target.files[0];
        const fileInfo = this.requiredFiles[inputId];
        const statusElement = document.getElementById(`status-${fileInfo.statusId}`);

        // Verificar que el elemento de estado existe
        if (!statusElement) {
            console.error(`Status element not found: status-${fileInfo.statusId}`);
            console.log('Available status elements:', Array.from(document.querySelectorAll('[id^="status-"]')).map(el => el.id));
            return;
        }

        if (!file) {
            this.updateFileStatus(statusElement, 'No cargado', 'default');
            return;
        }

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.updateFileStatus(statusElement, 'Error: No es un archivo CSV', 'error');
            window.app.onFileError(fileInfo.type, 'El archivo debe ser de tipo CSV');
            return;
        }

        this.updateFileStatus(statusElement, 'Cargando...', 'loading');

        try {
            console.log(`Processing file: ${file.name} as type: ${fileInfo.type}`);
            const csvData = await this.parseCSV(file);
            console.log(`Parsed CSV data: ${csvData.length} rows`);
            
            // Validate CSV structure
            const validation = this.validateCSVStructure(csvData, fileInfo.type);
            console.log(`Validation result for ${fileInfo.type}:`, validation);
            
            if (!validation.isValid) {
                throw new Error(validation.error);
            }

            // Normalize data using DataAdapter
            let processedData = csvData;
            
            if (this.dataAdapter) {
                try {
                    switch(fileInfo.type) {
                        case 'seg':
                            processedData = this.dataAdapter.convertSegData(csvData);
                            break;
                        case 'base4cifras':
                            processedData = this.dataAdapter.convertBaseData(csvData, '4cifras');
                            break;
                        case 'base3cifras':
                            processedData = this.dataAdapter.convertBaseData(csvData, '3cifras');
                            break;
                        default:
                            processedData = this.dataAdapter.normalizeData(csvData, fileInfo.type);
                    }
                } catch (adapterError) {
                    console.warn('DataAdapter error, using raw data:', adapterError);
                    processedData = csvData;
                }
            } else {
                console.warn('DataAdapter not available, using raw data');
                processedData = csvData;
            }

            this.updateFileStatus(statusElement, `✓ Cargado (${processedData.length} filas)`, 'loaded');
            
            // Verificar que el estado visual se actualizó correctamente
            setTimeout(() => {
                const updatedElement = document.getElementById(`status-${fileInfo.statusId}`);
                if (updatedElement && !updatedElement.classList.contains('loaded')) {
                    console.warn(`⚠️ File status visual update failed for ${fileInfo.name}`);
                    // Forzar actualización visual
                    updatedElement.classList.add('loaded');
                    updatedElement.style.background = '#c6f6d5';
                    updatedElement.style.color = '#2f855a';
                }
            }, 100);
            
            window.app.onFileLoaded(fileInfo.type, processedData);

        } catch (error) {
            this.updateFileStatus(statusElement, `Error: ${error.message}`, 'error');
            window.app.onFileError(fileInfo.type, error.message);
        }
    }

    parseCSV(file) {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true,
                complete: (results) => {
                    if (results.errors.length > 0) {
                        reject(new Error('Error parsing CSV: ' + results.errors[0].message));
                    } else {
                        resolve(results.data);
                    }
                },
                error: (error) => {
                    reject(new Error('Failed to parse CSV: ' + error.message));
                }
            });
        });
    }

    validateCSVStructure(data, fileType) {
        if (!data || data.length === 0) {
            return {
                isValid: false,
                error: 'El archivo CSV está vacío'
            };
        }

        const requiredColumns = this.getRequiredColumns(fileType);
        const columns = Object.keys(data[0]);

        // Check for required columns
        const missingColumns = requiredColumns.filter(col => !columns.includes(col));
        
        if (missingColumns.length > 0) {
            return {
                isValid: false,
                error: `Faltan columnas requeridas: ${missingColumns.join(', ')}`
            };
        }

        // Additional validation based on file type
        switch (fileType) {
            case 'main':
                return this.validateMainFile(data);
            case 'inverse':
                // Inverse file should have same structure as main
                return this.validateMainFile(data);
            case 'base4cifras':
                return this.validateBase4File(data);
            case 'base3cifras':
                return this.validateBase3File(data);
            case 'seg':
                return this.validateSegFile(data);
            default:
                return { isValid: true };
        }
    }

    getRequiredColumns(fileType) {
        const columnSets = {
            main: ['NUM', 'SIGNO', 'ID', 'FECHA', 'Tfecha', 'C1', 'C2', 'C3', 'C4'],
            inverse: ['NUM', 'SIGNO', 'ID', 'FECHA', 'Tfecha', 'C1', 'C2', 'C3', 'C4'],
            base4cifras: ['A', 'B', 'C', 'D', 'CUATROC'], // Actualizado según estructura real
            base3cifras: ['B', 'C', 'D', 'TRESC'], // Actualizado según estructura real
            seg: ['GANO', 'SIGNO', 'ID', 'FECHA'] // Actualizado según estructura real
        };

        return columnSets[fileType] || [];
    }

    validateMainFile(data) {
        // Check if we have the expected numeric columns
        const numericColumns = ['C1', 'C2', 'C3', 'C4', 'ID'];
        
        for (let i = 0; i < Math.min(10, data.length); i++) {
            const row = data[i];
            
            for (const col of numericColumns) {
                if (row[col] !== null && row[col] !== undefined && row[col] !== '') {
                    const value = parseInt(row[col]);
                    if (isNaN(value) || (col.startsWith('C') && (value < 0 || value > 9))) {
                        return {
                            isValid: false,
                            error: `Valor inválido en columna ${col}: ${row[col]} (debe ser un dígito 0-9)`
                        };
                    }
                }
            }

            // Validate date format
            if (row.Tfecha) {
                const date = new Date(row.Tfecha);
                if (isNaN(date.getTime())) {
                    return {
                        isValid: false,
                        error: `Formato de fecha inválido en Tfecha: ${row.Tfecha}`
                    };
                }
            }

            // Validate zodiac signs
            const validSigns = ['Aries', 'Tauro', 'Geminis', 'Cancer', 'Leo', 'Virgo', 
                              'Libra', 'Escorpion', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis'];
            if (row.SIGNO && !validSigns.includes(row.SIGNO)) {
                return {
                    isValid: false,
                    error: `Signo zodiacal inválido: ${row.SIGNO}`
                };
            }
        }

        return { isValid: true };
    }

    validateBase4File(data) {
        // Check 4-digit combination data structure
        for (let i = 0; i < Math.min(5, data.length); i++) {
            const row = data[i];
            
            // Validate that A, B, C, D are digits 0-9
            const digits = ['A', 'B', 'C', 'D'];
            for (const digit of digits) {
                if (row[digit] !== null && row[digit] !== undefined) {
                    const value = parseInt(row[digit]);
                    if (isNaN(value) || value < 0 || value > 9) {
                        return {
                            isValid: false,
                            error: `Valor inválido en columna ${digit}: ${row[digit]} (debe ser 0-9)`
                        };
                    }
                }
            }

            // Validate REP4 if present
            if (row.REP4 !== null && row.REP4 !== undefined) {
                const rep = parseInt(row.REP4);
                if (isNaN(rep) || rep < 0) {
                    return {
                        isValid: false,
                        error: `REP4 inválido: ${row.REP4}`
                    };
                }
            }
        }

        return { isValid: true };
    }

    validateBase3File(data) {
        // Check 3-digit combination data structure
        for (let i = 0; i < Math.min(5, data.length); i++) {
            const row = data[i];
            
            // Validate that B, C, D are digits 0-9
            const digits = ['B', 'C', 'D'];
            for (const digit of digits) {
                if (row[digit] !== null && row[digit] !== undefined) {
                    const value = parseInt(row[digit]);
                    if (isNaN(value) || value < 0 || value > 9) {
                        return {
                            isValid: false,
                            error: `Valor inválido en columna ${digit}: ${row[digit]} (debe ser 0-9)`
                        };
                    }
                }
            }

            // Validate REP3 if present
            if (row.REP3 !== null && row.REP3 !== undefined) {
                const rep = parseInt(row.REP3);
                if (isNaN(rep) || rep < 0) {
                    return {
                        isValid: false,
                        error: `REP3 inválido: ${row.REP3}`
                    };
                }
            }
        }

        return { isValid: true };
    }

    validateSegFile(data) {
        // Check SEG file structure
        for (let i = 0; i < Math.min(5, data.length); i++) {
            const row = data[i];
            
            // Validate date format
            if (row.FECHA) {
                const date = new Date(row.FECHA);
                if (isNaN(date.getTime())) {
                    return {
                        isValid: false,
                        error: `Formato de fecha inválido en archivo SEG: ${row.FECHA}`
                    };
                }
            }

            // Validate GANO (winning number)
            if (row.GANO && typeof row.GANO === 'string') {
                const digits = row.GANO.replace(/\s/g, '').split('');
                if (digits.length !== 4 || !digits.every(d => /^[0-9]$/.test(d))) {
                    return {
                        isValid: false,
                        error: `Número ganador inválido: ${row.GANO} (debe ser 4 dígitos)`
                    };
                }
            }

            // Validate zodiac sign
            const validSigns = ['Aries', 'Tauro', 'Geminis', 'Cancer', 'Leo', 'Virgo', 
                              'Libra', 'Escorpion', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis'];
            if (row.SIGNO && !validSigns.includes(row.SIGNO)) {
                return {
                    isValid: false,
                    error: `Signo zodiacal inválido: ${row.SIGNO}`
                };
            }
        }

        return { isValid: true };
    }

    updateFileStatus(element, message, type) {
        if (!element) {
            console.error('Cannot update file status: element is null');
            return;
        }

        console.log(`Updating file status: ${message} (${type})`, element.id);
        
        element.textContent = message;
        element.className = 'file-status';
        
        switch (type) {
            case 'loaded':
                element.classList.add('loaded');
                console.log(`✅ File status updated to loaded: ${element.id}`);
                break;
            case 'error':
                element.classList.add('error');
                console.log(`❌ File status updated to error: ${element.id}`);
                break;
            case 'loading':
                element.style.color = '#667eea';
                console.log(`⏳ File status updated to loading: ${element.id}`);
                break;
            default:
                console.log(`ℹ️ File status updated to default: ${element.id}`);
                break;
        }
    }

    // Utility method to download sample CSV structure
    downloadSampleCSV(fileType) {
        const samples = {
            main: `NUM,SIGNO,ID,FECHA,Tfecha,ano,nfecha,nDIA,C1,C2,C3,C4,PM3,DC,EXT,PM2,ULT3,ULT2
1969,Tauro,8186,2025-08-03,2025-08-03,2025,agosto,domingo,1,9,6,9,196,69,19,19,969,69`,
            inverse: `NUM,SIGNO,ID,FECHA,Tfecha,ano,nfecha,nDIA,C1,C2,C3,C4,PM3,DC,EXT,PM2,ULT3,ULT2
1969,Tauro,8186,2025-08-03,2025-08-03,2025,agosto,domingo,1,9,6,9,196,69,19,19,969,69`,
            base4cifras: `A,B,C,D,CUATROC,REP4,TRESC
5,3,4,3,5 3 4 3,1,3 4 3
5,3,3,4,5 3 3 4,0,3 3 4`,
            base3cifras: `B,C,D,TRESC,REP3
3,4,3,3 4 3,7
3,3,4,3 3 4,9`,
            seg: `GANO,REP4,ULT3,REP3,SIGNO,ID,FECHA,MES
4 2 0 1,1,2 0 1,9,Libra,8053,2025-02-02,febrero
2 2 2 1,3,2 2 1,6,Leo,8052,2025-02-01,febrero`
        };

        const csvContent = samples[fileType] || '';
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sample_${fileType}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    // Diagnostic method to check file loading status
    debugFileStatus() {
        console.log('=== FILE LOADING DEBUG STATUS ===');
        
        Object.entries(this.requiredFiles).forEach(([inputId, fileInfo]) => {
            const inputElement = document.getElementById(inputId);
            const statusElement = document.getElementById(`status-${fileInfo.statusId}`);
            
            console.log(`📁 ${fileInfo.name}:`);
            console.log(`  - Input ID: ${inputId}`);
            console.log(`  - Type: ${fileInfo.type}`);
            console.log(`  - Status ID: status-${fileInfo.statusId}`);
            console.log(`  - Input element exists: ${!!inputElement}`);
            console.log(`  - Status element exists: ${!!statusElement}`);
            console.log(`  - File selected: ${inputElement?.files?.length > 0 ? 'Yes' : 'No'}`);
            
            if (statusElement) {
                console.log(`  - Status text: "${statusElement.textContent}"`);
                console.log(`  - Has loaded class: ${statusElement.classList.contains('loaded')}`);
                console.log(`  - Has error class: ${statusElement.classList.contains('error')}`);
                console.log(`  - Current classes: ${statusElement.className}`);
            }
            
            if (window.app && window.app.filesLoaded) {
                console.log(`  - App reports loaded: ${window.app.filesLoaded[fileInfo.type]}`);
            }
            
            console.log('');
        });
        
        console.log('App data availability:');
        if (window.app && window.app.data) {
            Object.entries(window.app.data).forEach(([key, value]) => {
                console.log(`  - ${key}: ${value ? `${value.length} records` : 'null'}`);
            });
        }
        
        console.log('=====================================');
    }
}

// Initialize file handler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fileHandler = new FileHandler();
});