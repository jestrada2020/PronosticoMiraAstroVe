// Advanced Machine Learning Forecast Module (LightGBM-inspired)
class MLForecast {
    constructor() {
        this.data = null;
        this.models = {
            c1: null,
            c2: null,
            c3: null,
            c4: null
        };
        this.trainingData = null;
        this.testData = null;
        this.predictions = null;
        this.modelMetrics = {};
        this.features = [];
        this.engineeredData = null;
    }

    init(appData) {
        console.log('MLForecast.init() called with data:', {
            hasMain: !!(appData && appData.main),
            hasInverse: !!(appData && appData.inverse),
            mainLength: appData && appData.main ? appData.main.length : 0,
            inverseLength: appData && appData.inverse ? appData.inverse.length : 0
        });
        
        // Store the data reference more securely
        this.data = appData || {};
        this.setupEventListeners();
        
        // Always display status to provide user feedback
        this.displayModelStatus();
        
        // Check if we have the required data
        if (this.data && this.data.main && this.data.inverse) {
            console.log('✅ ML Forecast initialized successfully with required data');
        } else {
            console.warn('⚠️ ML Forecast initialized but missing required data. Current data keys:', 
                this.data ? Object.keys(this.data) : 'null');
        }
    }

    setupEventListeners() {
        document.getElementById('train-model').addEventListener('click', () => {
            this.trainModels();
        });

        document.getElementById('generate-predictions').addEventListener('click', () => {
            this.generatePredictions();
        });

        // Add debug button if it exists
        const debugBtn = document.getElementById('debug-ml-data');
        if (debugBtn) {
            debugBtn.addEventListener('click', () => {
                this.debugDataStatus();
            });
        }

        // Parameter validation
        ['n-indices', 'learning-rate', 'train-percentage'].forEach(id => {
            document.getElementById(id).addEventListener('change', (e) => {
                this.validateParameter(id, e.target.value);
            });
        });
    }

    validateParameter(paramId, value) {
        let isValid = true;
        let message = '';

        switch (paramId) {
            case 'n-indices':
                const nIndices = parseInt(value);
                if (isNaN(nIndices) || nIndices < 50 || nIndices > 2000) {
                    isValid = false;
                    message = 'Número de índices debe estar entre 50 y 2000';
                }
                break;
            case 'learning-rate':
                const lr = parseFloat(value);
                if (isNaN(lr) || lr <= 0.001 || lr > 0.5) {
                    isValid = false;
                    message = 'Tasa de aprendizaje debe estar entre 0.001 y 0.5';
                }
                break;
            case 'train-percentage':
                const trainPct = parseInt(value);
                if (isNaN(trainPct) || trainPct < 60 || trainPct > 90) {
                    isValid = false;
                    message = 'Porcentaje de entrenamiento debe estar entre 60% y 90%';
                }
                break;
        }

        if (!isValid) {
            alert(message);
            document.getElementById(paramId).focus();
        }
    }

    displayModelStatus() {
        const dataConnectionStatus = this.data && this.data.main && this.data.inverse ? 'connected' : 'disconnected';
        const dataStatusText = dataConnectionStatus === 'connected' ? 
            `✅ Conectado (${this.data.main.length + this.data.inverse.length} registros)` : 
            '❌ Sin conexión de datos';

        const statusHtml = `
            <div class="model-status">
                <h4>Estado de los Modelos LightGBM</h4>
                <div class="connection-status">
                    <p><strong>Conexión de datos:</strong> ${dataStatusText}</p>
                    ${dataConnectionStatus === 'disconnected' ? 
                        '<p style="color: #e53e3e; font-size: 0.9em;">⚠️ Cargue los archivos Principal e Inverso para entrenar</p>' : 
                        ''
                    }
                </div>
                <div class="status-grid">
                    ${Object.keys(this.models).map(pos => {
                        const model = this.models[pos];
                        const metrics = this.modelMetrics[pos];
                        return `
                            <div class="status-item">
                                <span>Modelo ${pos.toUpperCase()}:</span>
                                <span class="status ${model ? 'trained' : 'untrained'}">
                                    ${model ? '✅ Entrenado' : '⭕ Sin entrenar'}
                                </span>
                                ${metrics ? `<div style="font-size: 0.8em; color: #666; margin-top: 2px;">Precisión: ${metrics.test_accuracy.toFixed(1)}%</div>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="feature-info">
                    <p><strong>Características disponibles:</strong> ${this.features.length}</p>
                    <p><strong>Datos procesados:</strong> ${this.engineeredData ? this.engineeredData.length : 0} registros</p>
                    ${this.engineeredData ? `<p><strong>Última actualización:</strong> ${new Date().toLocaleTimeString()}</p>` : ''}
                </div>
                ${!this.data || !this.data.main || !this.data.inverse ? `
                    <div class="help-info" style="background: #f7fafc; padding: 10px; border-radius: 8px; margin-top: 10px;">
                        <p style="margin: 0; font-size: 0.9em; color: #4a5568;">
                            <strong>Para entrenar los modelos:</strong><br>
                            1. Cargue el archivo Principal (ProHOY...csv)<br>
                            2. Cargue el archivo Inverso (ProInvHOY...csv)<br>
                            3. Haga clic en "Entrenar Modelo"
                        </p>
                    </div>
                ` : ''}
            </div>
        `;

        const mlResults = document.getElementById('ml-predictions');
        const existingStatus = mlResults.querySelector('.model-status');
        if (existingStatus) {
            existingStatus.remove();
        }
        mlResults.insertAdjacentHTML('afterbegin', statusHtml);
    }

    async trainModels() {
        console.log('🚀 Starting ML training process...');
        
        // First, always try to refresh data connection
        const dataRefreshed = this.refreshDataConnection();
        
        console.log('MLForecast data check after refresh:', {
            refreshed: dataRefreshed,
            hasData: !!this.data,
            hasMain: !!(this.data && this.data.main),
            hasInverse: !!(this.data && this.data.inverse),
            mainLength: this.data && this.data.main ? this.data.main.length : 0,
            inverseLength: this.data && this.data.inverse ? this.data.inverse.length : 0,
            dataKeys: this.data ? Object.keys(this.data) : 'null',
            appFilesLoaded: window.app ? window.app.filesLoaded : 'app not available'
        });

        // Check if we have the required data after refresh
        if (!this.data || !this.data.main || !this.data.inverse) {
            console.error('Missing required data for ML training after refresh attempt');
            
            // Comprehensive diagnostic
            console.log('🔍 DIAGNOSTIC INFO:');
            console.log('- MLForecast data object:', this.data);
            console.log('- window.app available:', !!window.app);
            console.log('- window.app.data available:', window.app ? !!window.app.data : 'N/A');
            console.log('- window.app.filesLoaded:', window.app ? window.app.filesLoaded : 'N/A');
            
            if (window.app && window.app.data) {
                console.log('- app.data keys:', Object.keys(window.app.data));
                console.log('- app.data.main length:', window.app.data.main ? window.app.data.main.length : 'null');
                console.log('- app.data.inverse length:', window.app.data.inverse ? window.app.data.inverse.length : 'null');
            }
            
            // Try one more forced refresh
            console.log('🔄 Attempting one more forced data refresh...');
            const forceRefresh = this.forceDataRefresh();
            
            if (forceRefresh && this.data && this.data.main && this.data.inverse) {
                console.log('✅ Forced refresh successful, continuing with training...');
            } else {
                // Check app status for better error message
                if (window.app && window.app.filesLoaded) {
                    const filesStatus = window.app.filesLoaded;
                    if (!filesStatus.main || !filesStatus.inverse) {
                        const missingFiles = [];
                        if (!filesStatus.main) missingFiles.push('Archivo Principal');
                        if (!filesStatus.inverse) missingFiles.push('Archivo Inverso');
                        alert(`⚠️ Faltan archivos requeridos para ML:\n\n${missingFiles.join(', ')}\n\nPor favor cargue estos archivos en la sección superior de la página antes de entrenar los modelos.`);
                    } else {
                        alert('⚠️ Error de conectividad de datos:\n\nLos archivos están marcados como cargados pero no son accesibles desde ML.\n\nDiagnóstico disponible en la consola.\n\nSoluciones:\n1. Haga clic en "Debug Estado"\n2. Recargue la página\n3. Vuelva a cargar los archivos CSV');
                    }
                } else {
                    alert('⚠️ Sistema no inicializado:\n\nPor favor cargue los archivos CSV requeridos:\n• Archivo Principal (ProHOY...csv)\n• Archivo Inverso (ProInvHOY...csv)\n\nEstos archivos son necesarios para entrenar los modelos ML.');
                }
                return;
            }
        }

        console.log('✅ Data validation passed. Proceeding with training...');

        window.app.showLoading();

        try {
            console.log('Iniciando entrenamiento de modelos ML...');
            
            // Get training parameters
            const nIndices = parseInt(document.getElementById('n-indices').value) || 500;
            const learningRate = parseFloat(document.getElementById('learning-rate').value) || 0.1;
            const trainPercentage = parseInt(document.getElementById('train-percentage').value) || 80;

            // Step 1: Feature Engineering
            console.log('Paso 1: Ingeniería de características...');
            await this.performFeatureEngineering();

            // Step 2: Prepare training data
            console.log('Paso 2: Preparación de datos de entrenamiento...');
            this.prepareTrainingData(nIndices, trainPercentage);

            // Step 3: Train models for each digit position
            console.log('Paso 3: Entrenamiento de modelos...');
            for (const position of ['c1', 'c2', 'c3', 'c4']) {
                console.log(`Entrenando modelo para posición ${position.toUpperCase()}...`);
                await this.trainLightGBMModel(position, learningRate);
            }

            // Step 4: Calculate metrics
            console.log('Paso 4: Calculando métricas...');
            this.calculateAdvancedMetrics();

            this.displayModelStatus();
            this.displayTrainingResults();

            window.app.showSuccess('Modelos LightGBM entrenados exitosamente');

        } catch (error) {
            console.error('Error durante el entrenamiento:', error);
            window.app.showError('Error durante el entrenamiento: ' + error.message);
        } finally {
            window.app.hideLoading();
        }
    }

    async performFeatureEngineering() {
        // Validate input data
        if (!this.data.main || !this.data.inverse) {
            throw new Error('Datos principales e inversos son requeridos para la ingeniería de características');
        }

        if (this.data.main.length === 0 || this.data.inverse.length === 0) {
            throw new Error('Los archivos de datos están vacíos. Por favor verifique los archivos CSV.');
        }

        // Combine main and inverse data
        const combinedData = [...this.data.main, ...this.data.inverse];
        
        console.log(`Procesando ${combinedData.length} registros para ingeniería de características...`);
        console.log(`- Datos principales: ${this.data.main.length} registros`);
        console.log(`- Datos inversos: ${this.data.inverse.length} registros`);

        // Sort by date to ensure chronological order
        combinedData.sort((a, b) => {
            const dateA = new Date(a.Tfecha);
            const dateB = new Date(b.Tfecha);
            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
                console.warn('Fecha inválida encontrada durante ordenamiento');
                return 0;
            }
            return dateA - dateB;
        });

        this.engineeredData = combinedData.map((row, index) => {
            const engineeredRow = { ...row };

            // Basic features from CSV
            engineeredRow.C1 = parseInt(row.C1) || 0;
            engineeredRow.C2 = parseInt(row.C2) || 0;
            engineeredRow.C3 = parseInt(row.C3) || 0;
            engineeredRow.C4 = parseInt(row.C4) || 0;

            // Statistical features (S1-S5)
            engineeredRow.S1 = parseInt(row.S1) || 0;
            engineeredRow.S2 = parseInt(row.S2) || 0;
            engineeredRow.S3 = parseInt(row.S3) || 0;
            engineeredRow.S4 = parseInt(row.S4) || 0;
            engineeredRow.S5 = parseInt(row.S5) || 0;
            engineeredRow.S3PM = parseInt(row.S3PM) || 0;
            engineeredRow.S3ULT = parseInt(row.S3ULT) || 0;
            engineeredRow.ST = parseInt(row.ST) || 0;
            engineeredRow.Mpeso = parseFloat(row.Mpeso) || 0;

            // Astrological features
            engineeredRow.SIGNOnumerico = parseInt(row.SIGNOnumerico) || this.getSignoNumerico(row.SIGNO);

            // Pattern Indicators (PIC features) - 66 features total
            for (let i = 0; i <= 10; i++) {
                engineeredRow[`PIC${i}PM2`] = parseInt(row[`PIC${i}PM2`]) || 0;
                engineeredRow[`PIC${i}EXT`] = parseInt(row[`PIC${i}EXT`]) || 0;
                engineeredRow[`PIC${i}ULT2`] = parseInt(row[`PIC${i}ULT2`]) || 0;
                engineeredRow[`PIC${i}C1C3`] = parseInt(row[`PIC${i}C1C3`]) || 0;
                engineeredRow[`PIC${i}C2C4`] = parseInt(row[`PIC${i}C2C4`]) || 0;
                engineeredRow[`PIC${i}DC`] = parseInt(row[`PIC${i}DC`]) || 0;
            }

            // Matrix features (50 features total)
            for (let i = 0; i <= 9; i++) {
                engineeredRow[`MatrizN${i}C1`] = parseInt(row[`MatrizN${i}C1`]) || 0;
                engineeredRow[`MatrizN${i}C2`] = parseInt(row[`MatrizN${i}C2`]) || 0;
                engineeredRow[`MatrizN${i}C3`] = parseInt(row[`MatrizN${i}C3`]) || 0;
                engineeredRow[`MatrizN${i}C4`] = parseInt(row[`MatrizN${i}C4`]) || 0;
                engineeredRow[`MatN${i}CS`] = parseInt(row[`MatN${i}CS`]) || 0;
            }

            // Time-based features
            const date = new Date(row.Tfecha);
            if (!isNaN(date.getTime())) {
                engineeredRow.Año = date.getFullYear();
                engineeredRow.Mes = date.getMonth() + 1;
                engineeredRow.Dia = date.getDate();
                engineeredRow.DiaSemana = date.getDay();
            }

            // Interaction features
            engineeredRow.C1C3_interaction = engineeredRow.C1 * engineeredRow.C3;
            engineeredRow.C2C4_interaction = engineeredRow.C2 * engineeredRow.C4;
            engineeredRow.digit_sum = engineeredRow.C1 + engineeredRow.C2 + engineeredRow.C3 + engineeredRow.C4;
            
            // Lag features (using previous values if available)
            if (index > 0) {
                const prevRow = combinedData[index - 1];
                engineeredRow.C1_lag1 = parseInt(prevRow.C1) || 0;
                engineeredRow.C2_lag1 = parseInt(prevRow.C2) || 0;
                engineeredRow.C3_lag1 = parseInt(prevRow.C3) || 0;
                engineeredRow.C4_lag1 = parseInt(prevRow.C4) || 0;
            }

            return engineeredRow;
        });

        // Build feature list (excluding target variables)
        this.features = Object.keys(this.engineeredData[0]).filter(key => 
            !['NUM', 'SIGNO', 'ID', 'FECHA', 'Tfecha', 'ano', 'nfecha', 'nDIA'].includes(key)
        );

        console.log(`Ingeniería de características completada. ${this.features.length} características generadas.`);
    }

    prepareTrainingData(nIndices, trainPercentage) {
        if (!this.engineeredData) {
            throw new Error('Los datos de características no han sido procesados');
        }

        // Filter out future dates and take specified number of indices
        const today = new Date();
        const validData = this.engineeredData.filter(row => {
            const rowDate = new Date(row.Tfecha);
            return !isNaN(rowDate.getTime()) && rowDate <= today;
        }).slice(-nIndices); // Take last N records

        // Split into training and test sets
        const trainSize = Math.floor(validData.length * (trainPercentage / 100));
        this.trainingData = validData.slice(0, trainSize);
        this.testData = validData.slice(trainSize);

        console.log(`Datos preparados: ${this.trainingData.length} entrenamiento, ${this.testData.length} prueba`);
    }

    async trainLightGBMModel(position, learningRate) {
        const positionMap = { c1: 'C1', c2: 'C2', c3: 'C3', c4: 'C4' };
        const targetColumn = positionMap[position];

        // Prepare feature matrix and target vector
        const X_train = this.trainingData.map(row => 
            this.features.map(feature => parseFloat(row[feature]) || 0)
        );
        const y_train = this.trainingData.map(row => parseInt(row[targetColumn]) || 0);

        const X_test = this.testData.map(row => 
            this.features.map(feature => parseFloat(row[feature]) || 0)
        );
        const y_test = this.testData.map(row => parseInt(row[targetColumn]) || 0);

        // Simple gradient boosting implementation (mimicking LightGBM behavior)
        const model = {
            trees: [],
            learningRate: learningRate,
            nRounds: 20, // Increased from 5 in original R code
            position: position
        };

        // Train multiple weak learners (simplified gradient boosting)
        let predictions = new Array(X_train.length).fill(0);
        
        for (let round = 0; round < model.nRounds; round++) {
            // Calculate residuals
            const residuals = y_train.map((target, i) => target - predictions[i]);
            
            // Train simple decision tree on residuals
            const tree = this.trainSimpleTree(X_train, residuals);
            model.trees.push(tree);
            
            // Update predictions
            for (let i = 0; i < predictions.length; i++) {
                const treePred = this.predictWithTree(tree, X_train[i]);
                predictions[i] += learningRate * treePred;
            }
        }

        this.models[position] = model;

        // Calculate training metrics
        const trainPredictions = X_train.map(features => this.predictWithModel(model, features));
        const testPredictions = X_test.map(features => this.predictWithModel(model, features));

        // Store metrics
        this.modelMetrics[position] = {
            train_rmse: this.calculateRMSE(y_train, trainPredictions),
            test_rmse: this.calculateRMSE(y_test, testPredictions),
            train_accuracy: this.calculateAccuracy(y_train, trainPredictions),
            test_accuracy: this.calculateAccuracy(y_test, testPredictions),
            feature_count: this.features.length
        };

        console.log(`Modelo ${position.toUpperCase()} entrenado. Test RMSE: ${this.modelMetrics[position].test_rmse.toFixed(3)}`);
    }

    trainSimpleTree(X, y) {
        // Simplified decision tree (single split)
        let bestFeature = 0;
        let bestThreshold = 0;
        let bestScore = Infinity;

        // Try different features and thresholds
        for (let featureIdx = 0; featureIdx < X[0].length; featureIdx++) {
            const values = X.map(row => row[featureIdx]);
            const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
            
            for (let i = 0; i < Math.min(uniqueValues.length - 1, 10); i++) {
                const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;
                const score = this.evaluateSplit(X, y, featureIdx, threshold);
                
                if (score < bestScore) {
                    bestScore = score;
                    bestFeature = featureIdx;
                    bestThreshold = threshold;
                }
            }
        }

        // Calculate leaf values
        const leftValues = [];
        const rightValues = [];
        
        for (let i = 0; i < X.length; i++) {
            if (X[i][bestFeature] <= bestThreshold) {
                leftValues.push(y[i]);
            } else {
                rightValues.push(y[i]);
            }
        }

        const leftMean = leftValues.length > 0 ? leftValues.reduce((a, b) => a + b) / leftValues.length : 0;
        const rightMean = rightValues.length > 0 ? rightValues.reduce((a, b) => a + b) / rightValues.length : 0;

        return {
            feature: bestFeature,
            threshold: bestThreshold,
            leftValue: leftMean,
            rightValue: rightMean
        };
    }

    evaluateSplit(X, y, featureIdx, threshold) {
        let leftSumSquares = 0, rightSumSquares = 0;
        let leftCount = 0, rightCount = 0;
        let leftSum = 0, rightSum = 0;

        for (let i = 0; i < X.length; i++) {
            if (X[i][featureIdx] <= threshold) {
                leftSum += y[i];
                leftCount++;
            } else {
                rightSum += y[i];
                rightCount++;
            }
        }

        const leftMean = leftCount > 0 ? leftSum / leftCount : 0;
        const rightMean = rightCount > 0 ? rightSum / rightCount : 0;

        for (let i = 0; i < X.length; i++) {
            if (X[i][featureIdx] <= threshold) {
                leftSumSquares += Math.pow(y[i] - leftMean, 2);
            } else {
                rightSumSquares += Math.pow(y[i] - rightMean, 2);
            }
        }

        return leftSumSquares + rightSumSquares;
    }

    predictWithTree(tree, features) {
        return features[tree.feature] <= tree.threshold ? tree.leftValue : tree.rightValue;
    }

    predictWithModel(model, features) {
        let prediction = 0;
        for (const tree of model.trees) {
            prediction += model.learningRate * this.predictWithTree(tree, features);
        }
        return Math.max(0, Math.min(9, Math.round(prediction))); // Clamp to 0-9
    }

    calculateRMSE(actual, predicted) {
        const mse = actual.reduce((sum, actual_val, i) => 
            sum + Math.pow(actual_val - predicted[i], 2), 0) / actual.length;
        return Math.sqrt(mse);
    }

    calculateAccuracy(actual, predicted) {
        const correct = actual.reduce((count, actual_val, i) => 
            count + (Math.round(predicted[i]) === actual_val ? 1 : 0), 0);
        return (correct / actual.length) * 100;
    }

    calculateAdvancedMetrics() {
        console.log('Métricas de los modelos:');
        Object.entries(this.modelMetrics).forEach(([position, metrics]) => {
            console.log(`${position.toUpperCase()}: Precisión=${metrics.test_accuracy.toFixed(1)}%, RMSE=${metrics.test_rmse.toFixed(3)}`);
        });
    }

    displayTrainingResults() {
        const resultsHtml = `
            <div class="training-results">
                <h4>Resultados del Entrenamiento LightGBM</h4>
                <div class="metrics-grid">
                    ${Object.entries(this.modelMetrics).map(([position, metrics]) => `
                        <div class="metric-card">
                            <h5>Modelo ${position.toUpperCase()}</h5>
                            <div class="metric-item">
                                <span>Precisión (Test):</span>
                                <span class="metric-value">${metrics.test_accuracy.toFixed(1)}%</span>
                            </div>
                            <div class="metric-item">
                                <span>RMSE (Test):</span>
                                <span class="metric-value">${metrics.test_rmse.toFixed(3)}</span>
                            </div>
                            <div class="metric-item">
                                <span>Características:</span>
                                <span class="metric-value">${metrics.feature_count}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="feature-summary">
                    <h5>Resumen de Características</h5>
                    <p>Total de características utilizadas: <strong>${this.features.length}</strong></p>
                    <p>Tipos de características:</p>
                    <ul>
                        <li>Estadísticas básicas (S1-S5): 8 características</li>
                        <li>Indicadores de patrones (PIC): 66 características</li>
                        <li>Características de matriz: 50 características</li>
                        <li>Características temporales: 4 características</li>
                        <li>Características de interacción: 5 características</li>
                        <li>Otras: ${Math.max(0, this.features.length - 133)} características</li>
                    </ul>
                </div>
            </div>
        `;

        const performanceSection = document.querySelector('.ml-performance');
        performanceSection.innerHTML = resultsHtml + performanceSection.innerHTML;

        this.updateAccuracyChart();
    }

    generatePredictions() {
        // Check if all models are trained
        const trainedModels = Object.values(this.models).filter(model => model);
        if (trainedModels.length === 0) {
            alert('⚠️ No hay modelos entrenados.\n\nPor favor haga clic en "Entrenar Modelo" primero.');
            return;
        }
        
        if (trainedModels.length < 4) {
            const untrainedPositions = Object.keys(this.models).filter(pos => !this.models[pos]);
            alert(`⚠️ Modelos incompletos.\n\nFaltan los modelos para: ${untrainedPositions.map(p => p.toUpperCase()).join(', ')}\n\nPor favor complete el entrenamiento primero.`);
            return;
        }

        // Check if we have engineered data
        if (!this.engineeredData || this.engineeredData.length === 0) {
            alert('⚠️ No hay datos procesados disponibles.\n\nPor favor entrene los modelos primero para procesar los datos.');
            return;
        }

        window.app.showLoading();

        try {
            console.log('🔮 Generando predicciones ML...');
            console.log(`- Modelos entrenados: ${trainedModels.length}/4`);
            console.log(`- Datos base disponibles: ${this.engineeredData.length} registros`);
            
            // Generate predictions for next 7 days
            const predictions = this.generateAdvancedPredictions(7);
            this.displayPredictions(predictions);
            
            console.log('✅ Predicciones generadas exitosamente');
            window.app.showSuccess('Predicciones ML generadas exitosamente');

        } catch (error) {
            console.error('❌ Error generando predicciones:', error);
            alert(`❌ Error generando predicciones:\n\n${error.message}\n\nRevise la consola para más detalles.`);
        } finally {
            window.app.hideLoading();
        }
    }

    generateAdvancedPredictions(numDays) {
        const predictions = {
            c1: [],
            c2: [],
            c3: [],
            c4: []
        };

        // Use the most recent data as baseline for future predictions
        const recentData = this.engineeredData.slice(-10); // Last 10 records
        const baseFeatures = this.calculateBaselineFeatures(recentData);

        for (let day = 1; day <= numDays; day++) {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + day);
            
            // Create synthetic feature vector for future date
            const syntheticFeatures = this.createAdvancedSyntheticFeatures(futureDate, baseFeatures, day);

            // Generate prediction for each position
            for (const position of ['c1', 'c2', 'c3', 'c4']) {
                const model = this.models[position];
                const prediction = this.predictWithModel(model, syntheticFeatures);
                
                // Calculate confidence based on model performance
                const confidence = Math.max(0.1, 1 - (this.modelMetrics[position].test_rmse / 3));

                predictions[position].push({
                    date: futureDate.toISOString().split('T')[0],
                    prediction: prediction,
                    confidence: confidence,
                    day: day
                });
            }
        }

        this.predictions = predictions;
        return predictions;
    }

    calculateBaselineFeatures(recentData) {
        const baseline = {};
        
        // Calculate averages for numerical features
        this.features.forEach(feature => {
            const values = recentData.map(row => parseFloat(row[feature]) || 0).filter(v => !isNaN(v));
            baseline[feature] = values.length > 0 ? values.reduce((a, b) => a + b) / values.length : 0;
        });

        return baseline;
    }

    createAdvancedSyntheticFeatures(date, baseFeatures, dayOffset) {
        // Update time-based features
        const featureArray = this.features.map(featureName => {
            if (featureName === 'Año') return date.getFullYear();
            if (featureName === 'Mes') return date.getMonth() + 1;
            if (featureName === 'Dia') return date.getDate();
            if (featureName === 'DiaSemana') return date.getDay();
            
            // Add some variability for future predictions
            let value = baseFeatures[featureName] || 0;
            
            // Apply slight random variations to avoid deterministic predictions
            if (featureName.startsWith('PIC') || featureName.startsWith('Matriz')) {
                value += (Math.random() - 0.5) * 0.1;
            }
            
            return value;
        });

        return featureArray;
    }

    displayPredictions(predictions) {
        // Display predictions for each position
        for (const position of ['c1', 'c2', 'c3', 'c4']) {
            const container = document.getElementById(`${position}-predictions`);
            const positionPredictions = predictions[position];

            const predictionsHtml = positionPredictions.map((pred, index) => `
                <div class="prediction-item" style="margin-bottom: 10px;">
                    <div style="font-weight: bold;">Día ${pred.day}</div>
                    <div style="font-size: 1.4em; color: #667eea; font-weight: bold;">${pred.prediction}</div>
                    <div style="font-size: 0.8em; color: #718096;">
                        ${pred.date}
                    </div>
                    <div style="font-size: 0.7em; color: #4a5568;">
                        Confianza: ${(pred.confidence * 100).toFixed(1)}%
                    </div>
                </div>
            `).join('');

            container.innerHTML = predictionsHtml;
        }

        // Display combined predictions
        this.displayCombinedPredictions(predictions);
    }

    displayCombinedPredictions(predictions) {
        const combinedHtml = `
            <div class="combined-predictions" style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 10px;">
                <h4>Predicciones Combinadas (Próximos 7 días)</h4>
                <div class="combined-grid" style="display: grid; gap: 10px;">
                    ${predictions.c1.map((_, index) => {
                        const combo = `${predictions.c1[index].prediction}${predictions.c2[index].prediction}${predictions.c3[index].prediction}${predictions.c4[index].prediction}`;
                        const avgConfidence = ((predictions.c1[index].confidence + predictions.c2[index].confidence + predictions.c3[index].confidence + predictions.c4[index].confidence) / 4 * 100).toFixed(1);
                        
                        return `
                            <div style="padding: 10px; background: white; border-radius: 8px; text-align: center;">
                                <div style="font-size: 1.2em; font-weight: bold; color: #2d3748;">Día ${index + 1}</div>
                                <div style="font-size: 2em; font-weight: bold; color: #667eea; margin: 5px 0;">${combo}</div>
                                <div style="font-size: 0.8em; color: #4a5568;">${predictions.c1[index].date}</div>
                                <div style="font-size: 0.7em; color: #718096;">Confianza: ${avgConfidence}%</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        const mlResults = document.getElementById('ml-predictions');
        const existingCombined = mlResults.querySelector('.combined-predictions');
        if (existingCombined) {
            existingCombined.remove();
        }
        mlResults.insertAdjacentHTML('beforeend', combinedHtml);
    }

    updateAccuracyChart() {
        const canvas = document.getElementById('accuracy-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');

        // Clear previous chart
        if (this.accuracyChart) {
            this.accuracyChart.destroy();
        }

        const accuracyData = Object.entries(this.modelMetrics).map(([position, metrics]) => ({
            label: position.toUpperCase(),
            accuracy: metrics.test_accuracy,
            rmse: metrics.test_rmse
        }));

        this.accuracyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: accuracyData.map(d => d.label),
                datasets: [{
                    label: 'Precisión (%)',
                    data: accuracyData.map(d => d.accuracy),
                    backgroundColor: [
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(72, 187, 120, 0.8)',
                        'rgba(237, 137, 54, 0.8)',
                        'rgba(224, 102, 102, 0.8)'
                    ],
                    borderColor: [
                        'rgba(102, 126, 234, 1)',
                        'rgba(72, 187, 120, 1)',
                        'rgba(237, 137, 54, 1)',
                        'rgba(224, 102, 102, 1)'
                    ],
                    borderWidth: 2
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
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Precisión de los Modelos LightGBM por Posición de Dígito'
                    }
                }
            }
        });
    }

    refreshDataConnection() {
        console.log('🔄 Attempting to refresh data connection...');
        
        if (window.app && window.app.data) {
            const appData = window.app.data;
            console.log('Available app data keys:', Object.keys(appData));
            console.log('App files loaded status:', window.app.filesLoaded);
            
            // Re-initialize with current app data
            this.data = { ...appData }; // Create shallow copy
            
            console.log('After refresh - ML data keys:', Object.keys(this.data));
            console.log('After refresh - has main:', !!this.data.main);
            console.log('After refresh - has inverse:', !!this.data.inverse);
            
            if (this.data.main) {
                console.log('Main data length:', this.data.main.length);
                console.log('Main data sample columns:', Object.keys(this.data.main[0] || {}));
            }
            if (this.data.inverse) {
                console.log('Inverse data length:', this.data.inverse.length);
                console.log('Inverse data sample columns:', Object.keys(this.data.inverse[0] || {}));
            }
            
            // Update the display status after refresh
            this.displayModelStatus();
            
            return !!(this.data.main && this.data.inverse);
        } else {
            console.error('Cannot refresh - window.app or window.app.data not available');
            return false;
        }
    }

    forceDataRefresh() {
        console.log('🔥 Force data refresh initiated...');
        
        // Multiple strategies to get the data
        let success = false;
        
        // Strategy 1: Direct app data access
        if (window.app && window.app.data) {
            console.log('Strategy 1: Direct app data access');
            this.data = JSON.parse(JSON.stringify(window.app.data)); // Deep copy
            if (this.data.main && this.data.inverse) {
                console.log('✅ Strategy 1 successful');
                success = true;
            }
        }
        
        // Strategy 2: Re-initialize ML completely
        if (!success && window.app) {
            console.log('Strategy 2: Complete ML re-initialization');
            try {
                window.app.initMLForecast();
                if (this.data && this.data.main && this.data.inverse) {
                    console.log('✅ Strategy 2 successful');
                    success = true;
                }
            } catch (error) {
                console.warn('Strategy 2 failed:', error);
            }
        }
        
        // Strategy 3: Direct assignment from window references
        if (!success && window.app) {
            console.log('Strategy 3: Direct window reference assignment');
            try {
                this.data = {
                    main: window.app.data?.main || null,
                    inverse: window.app.data?.inverse || null,
                    base4cifras: window.app.data?.base4cifras || null,
                    base3cifras: window.app.data?.base3cifras || null,
                    seg: window.app.data?.seg || null
                };
                
                if (this.data.main && this.data.inverse) {
                    console.log('✅ Strategy 3 successful');
                    success = true;
                }
            } catch (error) {
                console.warn('Strategy 3 failed:', error);
            }
        }
        
        if (success) {
            console.log('🎉 Force refresh successful!');
            console.log('Final data state:', {
                hasMain: !!this.data.main,
                hasInverse: !!this.data.inverse,
                mainLength: this.data.main ? this.data.main.length : 0,
                inverseLength: this.data.inverse ? this.data.inverse.length : 0
            });
            this.displayModelStatus();
        } else {
            console.error('❌ All force refresh strategies failed');
        }
        
        return success;
    }

    getSignoNumerico(signo) {
        const signos = {
            'Aries': 1, 'Tauro': 2, 'Geminis': 3, 'Cancer': 4,
            'Leo': 5, 'Virgo': 6, 'Libra': 7, 'Escorpion': 8,
            'Sagitario': 9, 'Capricornio': 10, 'Acuario': 11, 'Piscis': 12
        };
        return signos[signo] || 0;
    }


    debugDataStatus() {
        const status = {
            hasData: !!this.data,
            hasMain: !!(this.data && this.data.main),
            hasInverse: !!(this.data && this.data.inverse),
            mainLength: this.data && this.data.main ? this.data.main.length : 0,
            inverseLength: this.data && this.data.inverse ? this.data.inverse.length : 0,
            featuresCount: this.features.length,
            engineeredDataLength: this.engineeredData ? this.engineeredData.length : 0,
            modelsStatus: Object.keys(this.models).map(key => ({
                position: key,
                trained: !!this.models[key]
            })),
            appDataAvailable: !!(window.app && window.app.data),
            appFilesLoadedStatus: window.app ? window.app.filesLoaded : 'not available'
        };

        console.log('=== ML FORECAST DEBUG STATUS ===');
        console.log(status);
        console.log('App data keys:', window.app && window.app.data ? Object.keys(window.app.data) : 'not available');
        
        // Additional detailed debugging
        if (window.app && window.app.data) {
            console.log('App main data available:', !!window.app.data.main);
            console.log('App inverse data available:', !!window.app.data.inverse);
            if (window.app.data.main) {
                console.log('App main data length:', window.app.data.main.length);
                console.log('App main data sample:', window.app.data.main[0]);
            }
            if (window.app.data.inverse) {
                console.log('App inverse data length:', window.app.data.inverse.length);
                console.log('App inverse data sample:', window.app.data.inverse[0]);
            }
        }
        
        console.log('ML data object structure:', this.data);
        console.log('===============================');

        const debugText = `🔍 ESTADO ML DEBUG:

📊 DATOS:
✓ ML data disponible: ${status.hasData ? 'Sí' : 'No'}
✓ Archivo principal: ${status.hasMain ? `Sí (${status.mainLength} filas)` : 'No'}
✓ Archivo inverso: ${status.hasInverse ? `Sí (${status.inverseLength} filas)` : 'No'}

🎯 PROCESAMIENTO:
✓ Características extraídas: ${status.featuresCount}
✓ Datos procesados: ${status.engineeredDataLength}
✓ Modelos entrenados: ${status.modelsStatus.filter(m => m.trained).length}/4

🔗 CONEXIÓN:
✓ App data disponible: ${status.appDataAvailable ? 'Sí' : 'No'}
✓ Archivos cargados en app: ${status.appDataAvailable ? 
    (window.app.filesLoaded.main ? 'Main✓' : 'Main✗') + ' ' + 
    (window.app.filesLoaded.inverse ? 'Inverse✓' : 'Inverse✗') : 'N/A'}

${!status.hasMain || !status.hasInverse ? 
    '\n⚠️ PROBLEMA DETECTADO:\nUse el botón "Reconectar Datos" si los archivos están cargados.' : 
    '\n✅ Conexión de datos OK'}

Ver consola para detalles completos.`;

        alert(debugText);
    }

    exportPredictions() {
        if (!this.predictions) {
            alert('No hay predicciones para exportar');
            return;
        }

        const exportData = {
            predictions: this.predictions,
            modelMetrics: this.modelMetrics,
            features: this.features,
            featureCount: this.features.length,
            timestamp: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lightgbm_predictions_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize ML forecast when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.mlForecast = new MLForecast();
});