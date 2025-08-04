// Quick Fix para el problema de carga de archivos
// Este archivo sobrescribe temporalmente algunos métodos para debugging

document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que el app esté inicializada
    setTimeout(() => {
        if (window.app) {
            console.log('Aplicando quick fix...');
            
            // Sobrescribir el método updateValidationStatus para ser menos estricto
            const originalUpdateValidationStatus = window.app.updateValidationStatus;
            
            window.app.updateValidationStatus = function() {
                const messageEl = document.getElementById('validation-message');
                const statusEl = messageEl.parentElement;
                
                const loadedCount = Object.values(this.filesLoaded).filter(loaded => loaded).length;
                const totalFiles = Object.keys(this.filesLoaded).length;
                
                console.log(`QuickFix: ${loadedCount}/${totalFiles} archivos cargados`);
                
                if (loadedCount === totalFiles) {
                    messageEl.textContent = '✓ Todos los archivos CSV han sido cargados correctamente';
                    statusEl.className = 'validation-status valid';
                } else if (loadedCount > 0) {
                    const loaded = Object.keys(this.filesLoaded).filter(key => this.filesLoaded[key]);
                    const missing = Object.keys(this.filesLoaded).filter(key => !this.filesLoaded[key]);
                    messageEl.textContent = `Progreso: ${loadedCount}/${totalFiles} - Cargados: ${loaded.join(', ')}`;
                    statusEl.className = 'validation-status warning';
                } else {
                    const missing = Object.keys(this.filesLoaded).filter(key => !this.filesLoaded[key]);
                    messageEl.textContent = `Faltan archivos: ${missing.join(', ')}`;
                    statusEl.className = 'validation-status invalid';
                }
            };
            
            // Forzar actualización del estado
            window.app.updateValidationStatus();
            
            console.log('Quick fix aplicado correctamente');
        }
    }, 1000);
});

// Función de prueba para verificar el estado de los archivos
function checkFileStatus() {
    if (window.app) {
        console.log('=== Estado de Archivos ===');
        console.log('Data loaded:', Object.keys(window.app.data).filter(key => window.app.data[key]));
        console.log('Files loaded flags:', window.app.filesLoaded);
        console.log('========================');
    }
}

// Exponer función globalmente para debugging
window.checkFileStatus = checkFileStatus;

// Auto-check cada 5 segundos
setInterval(() => {
    if (window.app) {
        const loadedCount = Object.values(window.app.filesLoaded).filter(loaded => loaded).length;
        if (loadedCount > 0) {
            console.log(`Auto-check: ${loadedCount} archivos cargados`);
            checkFileStatus();
        }
    }
}, 5000);