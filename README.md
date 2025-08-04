# PRONOSTICO2024 - Aplicación Web de Análisis y Predicción

Aplicación web convertida desde Shiny R para análisis y predicción astrológica de números, implementada con HTML, CSS y JavaScript puro.

## 🚀 Características Principales

### 📁 Gestión de Archivos CSV
- **Carga manual de archivos**: El usuario puede cargar manualmente los 5 archivos CSV requeridos
- **Validación automática**: Verificación de estructura y formato de cada archivo
- **Feedback visual**: Indicadores de estado para cada archivo cargado

### 📊 Módulos de Análisis

#### 1. **Configuración**
- Control de número de datos a analizar
- Filtrado por rango de fechas
- Visualización de correlaciones (C1 vs C2, C3 vs C4)
- Análisis de patrones de últimas 3 cifras

#### 2. **Búsqueda General**
- Filtrado por ID y signo zodiacal
- Histórico de ganadores 2024
- Análisis de bases de 3 y 4 cifras

#### 3. **Pronóstico por Patrón**
- Búsqueda de patrones específicos (C1, C2, C3, C4)
- Análisis de tipos de patrón (PM2, ULT2, DC, EXT, C1C3, C2C4)
- Cálculo triangular automático
- Predicciones basadas en patrones históricos

#### 4. **Machine Learning (ML-LightGBM)**
- Entrenamiento de modelos para cada posición de dígito
- Parámetros configurables (índices, tasa de aprendizaje, % entrenamiento)
- Predicciones para los próximos 7 días
- Métricas de rendimiento del modelo

## 📋 Archivos CSV Requeridos

La aplicación requiere los siguientes archivos CSV:

1. **Archivo Principal** (`ProHOY...csv`)
   - Contiene: NUM, SIGNO, ID, FECHA, Tfecha, C1, C2, C3, C4, PM3, DC, EXT, etc.

2. **Archivo Inverso** (`ProInvHOY...csv`)
   - Estructura similar al archivo principal
   - Utilizado para entrenamiento ML

3. **Base 4 Cifras** (`BASEdata...4CIFRAS...csv`)
   - Contiene: NUM (4 dígitos), FRECUENCIA

4. **Base 3 Cifras** (`BASEdata...3CIFRAS...csv`)
   - Contiene: NUM (3 dígitos), FRECUENCIA

5. **Archivo SEG** (`SEG2024V1.csv`)
   - Contiene: NUM, FECHA, SIGNO

## 🛠️ Instalación y Uso

### Requisitos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Servidor web local (opcional, recomendado)

### Instalación

1. **Descarga los archivos**
   ```bash
   # Los archivos ya están organizados en:
   # ProcesoAstro1/
   # ├── index.html
   # ├── css/styles.css
   # └── js/
   #     ├── main.js
   #     ├── fileHandler.js
   #     ├── patternForecast.js
   #     ├── mlForecast.js
   #     └── dataVisualization.js
   ```

2. **Servidor local (recomendado)**
   ```bash
   # Usando Python
   python3 -m http.server 8080
   
   # Usando Node.js
   npx http-server -p 8080
   
   # Usando PHP
   php -S localhost:8080
   ```

3. **Acceso directo**
   - También puede abrir `index.html` directamente en el navegador
   - Algunas funcionalidades pueden estar limitadas sin servidor

### Uso

1. **Abrir la aplicación**
   - Navegar a `http://localhost:8080` (con servidor)
   - O abrir `index.html` directamente

2. **Cargar archivos CSV**
   - Hacer clic en cada campo de carga de archivos
   - Seleccionar los archivos CSV correspondientes
   - Verificar que todos muestren estado "✓ Cargado"

3. **Explorar las pestañas**
   - **Configuración**: Ajustar parámetros y ver correlaciones
   - **Búsqueda General**: Explorar datos históricos
   - **Pronóstico Patrón**: Buscar patrones específicos
   - **ML**: Entrenar modelos y generar predicciones

## 🎯 Funcionalidades Clave

### Validación de Archivos
- ✅ Verificación de formato CSV
- ✅ Validación de columnas requeridas
- ✅ Verificación de tipos de datos
- ✅ Validación de rangos (dígitos 0-9)
- ✅ Verificación de signos zodiacales
- ✅ Validación de fechas

### Análisis de Patrones
- 🔍 Búsqueda por combinaciones de dígitos
- 📈 Análisis de frecuencias y probabilidades
- 🔺 Cálculo triangular automático
- 📊 Visualización de resultados

### Machine Learning
- 🧠 Red neuronal simplificada para cada posición
- 📊 Métricas de precisión y error
- 🔮 Predicciones para múltiples días
- 📈 Gráficos de rendimiento

### Visualizaciones
- 📊 Gráficos de correlación (scatter plots)
- 📈 Gráficos de barras para frecuencias
- 🥧 Gráficos circulares para signos zodiacales
- 📉 Gráficos de líneas para series de tiempo

## 🔧 Estructura Técnica

### Tecnologías Utilizadas
- **HTML5**: Estructura de la aplicación
- **CSS3**: Estilos responsivos con gradientes y efectos
- **JavaScript ES6+**: Lógica de la aplicación
- **Chart.js**: Visualizaciones interactivas
- **PapaParse**: Procesamiento de archivos CSV

### Arquitectura
```
PronosticoApp (main.js)
├── FileHandler (fileHandler.js)
├── PatternForecast (patternForecast.js)
├── MLForecast (mlForecast.js)
└── DataVisualization (dataVisualization.js)
```

### Características del Código
- 🏗️ Arquitectura modular y orientada a objetos
- 🔄 Manejo de eventos asíncrono
- 📱 Diseño responsivo para móviles
- 🎨 Interfaz moderna con efectos visuales
- 🛡️ Validación robusta de datos
- 🔧 Configuración flexible de parámetros

## 📱 Compatibilidad

### Navegadores Soportados
- ✅ Chrome 70+
- ✅ Firefox 65+
- ✅ Safari 12+
- ✅ Edge 79+

### Dispositivos
- 💻 Desktop/Laptop
- 📱 Tablets
- 📱 Smartphones (responsive)

## 🤝 Diferencias con la Versión Original R

### Ventajas de la Versión Web
- ✅ No requiere instalación de R/RStudio
- ✅ Interfaz más moderna y responsive
- ✅ Carga manual de archivos por el usuario
- ✅ Validación mejorada de datos
- ✅ Exportación de resultados
- ✅ Funcionamiento offline (después de cargar)

### Limitaciones
- ⚠️ ML simplificado (no LightGBM completo)
- ⚠️ Algunas características estadísticas avanzadas no implementadas
- ⚠️ Rendimiento puede ser menor con datasets muy grandes

## 🔍 Solución de Problemas

### Problemas Comunes

1. **Archivos no se cargan**
   - Verificar que sean archivos .csv válidos
   - Revisar que tengan las columnas requeridas
   - Comprobar el formato de fechas

2. **Gráficos no se muestran**
   - Verificar conexión a internet (Chart.js CDN)
   - Comprobar que los datos estén cargados
   - Refrescar la página

3. **ML no funciona**
   - Asegurar que estén cargados archivos principal e inverso
   - Verificar parámetros de entrenamiento
   - Comprobar que haya suficientes datos

## 📄 Licencia

Este proyecto es una conversión de una aplicación Shiny R a tecnologías web estándar. Desarrollado para uso educativo y de investigación.

---

**Nota**: Esta aplicación mantiene la funcionalidad core de la versión original en R, adaptada a tecnologías web modernas para mayor accesibilidad y usabilidad.