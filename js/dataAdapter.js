// Data Adapter for handling different CSV structures
class DataAdapter {
    constructor() {
        this.mappings = {
            main: {
                number: ['NUM', 'NUMERO'],
                sign: ['SIGNO'],
                id: ['ID'],
                date: ['FECHA', 'Tfecha'],
                c1: ['C1'],
                c2: ['C2'],
                c3: ['C3'],
                c4: ['C4']
            },
            seg: {
                number: ['GANO', 'NUM'],
                sign: ['SIGNO'],
                id: ['ID'],
                date: ['FECHA'],
                month: ['MES']
            },
            base4cifras: {
                a: ['A'],
                b: ['B'],
                c: ['C'],
                d: ['D'],
                combination: ['CUATROC'],
                frequency: ['REP4', 'FRECUENCIA']
            },
            base3cifras: {
                b: ['B'],
                c: ['C'],
                d: ['D'],
                combination: ['TRESC'],
                frequency: ['REP3', 'FRECUENCIA']
            }
        };
    }

    // Normalize data structure for consistent processing
    normalizeData(data, dataType) {
        if (!data || !Array.isArray(data) || data.length === 0) {
            return [];
        }

        const mapping = this.mappings[dataType];
        if (!mapping) {
            return data; // Return as-is if no mapping defined
        }

        return data.map(row => {
            const normalizedRow = { ...row }; // Keep original data
            
            // Add normalized fields
            for (const [normalizedField, possibleFields] of Object.entries(mapping)) {
                for (const field of possibleFields) {
                    if (row[field] !== undefined && row[field] !== null) {
                        normalizedRow[normalizedField] = row[field];
                        break;
                    }
                }
            }

            return normalizedRow;
        });
    }

    // Extract digits from number string (handles spaces and formatting)
    extractDigits(numberString, count = 4) {
        if (!numberString) return null;
        
        const digits = numberString.toString().replace(/\s+/g, '');
        if (digits.length >= count) {
            return digits.substring(0, count).split('').map(d => parseInt(d));
        }
        
        return null;
    }

    // Convert SEG data to standard format
    convertSegData(data) {
        return data.map(row => {
            const converted = { ...row };
            
            if (row.GANO) {
                const digits = this.extractDigits(row.GANO, 4);
                if (digits) {
                    converted.C1 = digits[0];
                    converted.C2 = digits[1];
                    converted.C3 = digits[2];
                    converted.C4 = digits[3];
                    converted.NUM = digits.join('');
                }
            }

            return converted;
        });
    }

    // Convert base data to usable format
    convertBaseData(data, type) {
        return data.map(row => {
            const converted = { ...row };
            
            if (type === '4cifras') {
                if (row.A !== undefined && row.B !== undefined && row.C !== undefined && row.D !== undefined) {
                    converted.NUM = `${row.A}${row.B}${row.C}${row.D}`;
                    converted.C1 = parseInt(row.A);
                    converted.C2 = parseInt(row.B);
                    converted.C3 = parseInt(row.C);
                    converted.C4 = parseInt(row.D);
                }
                converted.FRECUENCIA = row.REP4 || 0;
            } else if (type === '3cifras') {
                if (row.B !== undefined && row.C !== undefined && row.D !== undefined) {
                    converted.NUM = `${row.B}${row.C}${row.D}`;
                    converted.C2 = parseInt(row.B);
                    converted.C3 = parseInt(row.C);
                    converted.C4 = parseInt(row.D);
                }
                converted.FRECUENCIA = row.REP3 || 0;
            }

            return converted;
        });
    }

    // Validate data structure compatibility
    validateCompatibility(data, expectedType) {
        if (!data || data.length === 0) {
            return { compatible: false, reason: 'No data provided' };
        }

        const firstRow = data[0];
        const mapping = this.mappings[expectedType];
        
        if (!mapping) {
            return { compatible: true }; // No specific requirements
        }

        const missingFields = [];
        for (const [normalizedField, possibleFields] of Object.entries(mapping)) {
            const hasAnyField = possibleFields.some(field => firstRow.hasOwnProperty(field));
            if (!hasAnyField) {
                missingFields.push(`${normalizedField} (${possibleFields.join(' or ')})`);
            }
        }

        return {
            compatible: missingFields.length === 0,
            reason: missingFields.length > 0 ? `Missing fields: ${missingFields.join(', ')}` : null
        };
    }

    // Get field value using mapping
    getFieldValue(row, dataType, fieldName) {
        const mapping = this.mappings[dataType];
        if (!mapping || !mapping[fieldName]) {
            return row[fieldName]; // Fallback to direct access
        }

        for (const field of mapping[fieldName]) {
            if (row[field] !== undefined && row[field] !== null) {
                return row[field];
            }
        }

        return null;
    }

    // Create summary statistics for data
    createDataSummary(data, dataType) {
        if (!data || data.length === 0) {
            return null;
        }

        const summary = {
            totalRecords: data.length,
            dataType: dataType,
            fields: Object.keys(data[0]),
            dateRange: null,
            uniqueValues: {}
        };

        // Calculate date range if dates are available
        const dateField = this.getDateField(data[0], dataType);
        if (dateField) {
            const dates = data.map(row => new Date(row[dateField])).filter(d => !isNaN(d));
            if (dates.length > 0) {
                summary.dateRange = {
                    start: new Date(Math.min(...dates)),
                    end: new Date(Math.max(...dates))
                };
            }
        }

        // Count unique values for key fields
        const keyFields = this.getKeyFields(dataType);
        keyFields.forEach(field => {
            const values = [...new Set(data.map(row => row[field]).filter(v => v !== null && v !== undefined))];
            summary.uniqueValues[field] = values.length;
        });

        return summary;
    }

    getDateField(row, dataType) {
        const dateFields = ['FECHA', 'Tfecha', 'DATE'];
        return dateFields.find(field => row[field]);
    }

    getKeyFields(dataType) {
        switch (dataType) {
            case 'main':
            case 'inverse':
                return ['SIGNO', 'NUM', 'C1', 'C2', 'C3', 'C4'];
            case 'seg':
                return ['SIGNO', 'GANO'];
            case 'base4cifras':
                return ['A', 'B', 'C', 'D'];
            case 'base3cifras':
                return ['B', 'C', 'D'];
            default:
                return [];
        }
    }
}

// Export for use in other modules
window.DataAdapter = DataAdapter;