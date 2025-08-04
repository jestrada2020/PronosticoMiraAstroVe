// Error Handler and Utility Functions
class ErrorHandler {
    static logError(error, context = '') {
        console.error(`[${context}] Error:`, error);
    }

    static logWarning(message, context = '') {
        console.warn(`[${context}] Warning:`, message);
    }

    static safeExecute(fn, context = '', fallback = null) {
        try {
            return fn();
        } catch (error) {
            this.logError(error, context);
            return fallback;
        }
    }

    static waitForElement(elementId, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.getElementById(elementId);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver((mutations, obs) => {
                const element = document.getElementById(elementId);
                if (element) {
                    obs.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${elementId} not found within ${timeout}ms`));
            }, timeout);
        });
    }

    static isElementVisible(element) {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }

    static validateDataStructure(data, requiredFields = []) {
        if (!Array.isArray(data) || data.length === 0) {
            return { valid: false, error: 'Data is empty or not an array' };
        }

        const firstRow = data[0];
        const missingFields = requiredFields.filter(field => !(field in firstRow));
        
        if (missingFields.length > 0) {
            return { 
                valid: false, 
                error: `Missing required fields: ${missingFields.join(', ')}` 
            };
        }

        return { valid: true };
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Global error handlers
window.addEventListener('error', (event) => {
    ErrorHandler.logError(event.error, 'Global');
});

window.addEventListener('unhandledrejection', (event) => {
    ErrorHandler.logError(event.reason, 'Promise');
});

// Expose globally
window.ErrorHandler = ErrorHandler;