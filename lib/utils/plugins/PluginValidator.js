import TtyError from '../../other/TtyError.js';
import PluginAPI from './PluginAPI.js';

class PluginValidator {
    constructor() {
        this.validationRules = this.getValidationRules();
    }

    /**
     * Get comprehensive validation rules for plugins
     * @returns {Object} Validation rules schema
     */
    getValidationRules() {
        return {
            name: {
                required: true,
                type: 'string',
                pattern: '^[a-z0-9-_]+$',
                minLength: 2,
                maxLength: 50,
                description: 'Plugin name must be lowercase alphanumeric with hyphens/underscores'
            },
            version: {
                required: true,
                type: 'string',
                pattern: '^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9-]+)?(\\+[a-zA-Z0-9-]+)?$',
                description: 'Version must follow semantic versioning (x.y.z)'
            },
            type: {
                required: true,
                type: 'string',
                enum: ['theme', 'config-parser', 'ui-component', 'validator', 'exporter'],
                description: 'Plugin type must be one of the supported types'
            },
            main: {
                required: true,
                type: 'string',
                pattern: '\\.(js|mjs)$',
                description: 'Main file must be a JavaScript module (.js or .mjs)'
            },
            description: {
                required: false,
                type: 'string',
                maxLength: 200,
                description: 'Plugin description should be concise'
            },
            author: {
                required: false,
                type: 'string',
                maxLength: 100,
                description: 'Author information'
            },
            dependencies: {
                required: false,
                type: 'object',
                description: 'Plugin dependencies'
            },
            config: {
                required: false,
                type: 'object',
                description: 'Plugin configuration options'
            },
            permissions: {
                required: false,
                type: 'object',
                description: 'Required system permissions'
            }
        };
    }

    /**
     * Validate plugin configuration
     * @param {Object} plugin Plugin configuration object
     * @param {string} pluginPath Path to plugin file
     * @returns {Object} Validation result
     */
    validatePlugin(plugin, pluginPath = 'unknown') {
        const errors = [];
        const warnings = [];

        try {
            // Basic structure validation
            if (!plugin || typeof plugin !== 'object') {
                return {
                    valid: false,
                    errors: ['Plugin configuration must be a valid object'],
                    warnings: []
                };
            }

            // Validate against schema
            const schemaResult = this.validateAgainstSchema(plugin, this.validationRules);
            errors.push(...schemaResult.errors);
            warnings.push(...schemaResult.warnings);

            // Type-specific validation
            const typeResult = this.validatePluginType(plugin);
            errors.push(...typeResult.errors);
            warnings.push(...typeResult.warnings);

            // Security validation
            const securityResult = this.validateSecurity(plugin);
            errors.push(...securityResult.errors);
            warnings.push(...securityResult.warnings);

            // Dependency validation
            const depResult = this.validateDependencies(plugin);
            errors.push(...depResult.errors);
            warnings.push(...depResult.warnings);

            // Configuration validation
            const configResult = this.validateConfiguration(plugin);
            errors.push(...configResult.errors);
            warnings.push(...configResult.warnings);

        } catch (error) {
            errors.push(`Validation error: ${error.message}`);
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            pluginPath
        };
    }

    /**
     * Validate plugin against schema rules
     * @param {Object} plugin Plugin configuration
     * @param {Object} schema Validation schema
     * @returns {Object} Validation result
     */
    validateAgainstSchema(plugin, schema) {
        const errors = [];
        const warnings = [];

        for (const [field, rules] of Object.entries(schema)) {
            const value = plugin[field];

            // Required field check
            if (rules.required && (value === undefined || value === null || value === '')) {
                errors.push(`Missing required field: ${field}`);
                continue;
            }

            // Skip validation if field is not present and not required
            if (value === undefined || value === null) {
                continue;
            }

            // Type validation
            if (rules.type && typeof value !== rules.type) {
                errors.push(`Invalid type for ${field}: expected ${rules.type}, got ${typeof value}`);
                continue;
            }

            // Enum validation
            if (rules.enum && !rules.enum.includes(value)) {
                errors.push(`Invalid value for ${field}: must be one of [${rules.enum.join(', ')}]`);
                continue;
            }

            // Pattern validation
            if (rules.pattern && typeof value === 'string') {
                const regex = new RegExp(rules.pattern);
                if (!regex.test(value)) {
                    errors.push(`Invalid format for ${field}: ${rules.description || 'pattern mismatch'}`);
                    continue;
                }
            }

            // Length validation
            if (typeof value === 'string') {
                if (rules.minLength && value.length < rules.minLength) {
                    errors.push(`${field} is too short: minimum ${rules.minLength} characters`);
                }
                if (rules.maxLength && value.length > rules.maxLength) {
                    errors.push(`${field} is too long: maximum ${rules.maxLength} characters`);
                }
            }

            // Array validation
            if (Array.isArray(value) && rules.items) {
                for (let i = 0; i < value.length; i++) {
                    const itemResult = this.validateAgainstSchema({ item: value[i] }, { item: rules.items });
                    errors.push(...itemResult.errors.map(err => `${field}[${i}]: ${err.replace('item: ', '')}`));
                }
            }
        }

        // Check for unknown fields
        for (const field of Object.keys(plugin)) {
            if (!schema[field]) {
                warnings.push(`Unknown field: ${field}`);
            }
        }

        return { errors, warnings };
    }

    /**
     * Validate plugin type-specific requirements
     * @param {Object} plugin Plugin configuration
     * @returns {Object} Validation result
     */
    validatePluginType(plugin) {
        const errors = [];
        const warnings = [];

        switch (plugin.type) {
            case 'theme':
                if (plugin.config) {
                    const requiredThemeFields = ['primary_color', 'secondary_color'];
                    for (const field of requiredThemeFields) {
                        if (!plugin.config[field]) {
                            warnings.push(`Theme plugin should define ${field} in config`);
                        }
                    }
                }
                break;

            case 'config-parser':
                if (plugin.config && !plugin.config.supported_extensions) {
                    warnings.push('Config parser should specify supported_extensions in config');
                }
                break;

            case 'ui-component':
                if (plugin.config && !plugin.config.component_type) {
                    warnings.push('UI component should specify component_type in config');
                }
                break;

            case 'validator':
                if (plugin.config && !plugin.config.validation_rules) {
                    warnings.push('Validator plugin should define validation_rules in config');
                }
                break;

            case 'exporter':
                if (plugin.config && !plugin.config.export_formats) {
                    warnings.push('Exporter plugin should specify export_formats in config');
                }
                break;
        }

        return { errors, warnings };
    }

    /**
     * Validate plugin security aspects
     * @param {Object} plugin Plugin configuration
     * @returns {Object} Validation result
     */
    validateSecurity(plugin) {
        const errors = [];
        const warnings = [];

        // Check for suspicious patterns in main file path
        if (plugin.main) {
            if (plugin.main.includes('..')) {
                errors.push('Main file path cannot contain parent directory references (..)');
            }
            if (plugin.main.startsWith('/')) {
                errors.push('Main file path cannot be absolute');
            }
            if (plugin.main.includes('node_modules')) {
                warnings.push('Main file should not reference node_modules directly');
            }
        }

        // Validate permissions
        if (plugin.permissions) {
            const allowedPermissions = [
                'fs-read', 'fs-write', 'network', 'ui-modify', 'config-modify', 'system-info'
            ];

            if (Array.isArray(plugin.permissions)) {
                for (const permission of plugin.permissions) {
                    if (!allowedPermissions.includes(permission)) {
                        errors.push(`Unknown permission: ${permission}`);
                    }
                }
            } else {
                errors.push('Permissions must be an array');
            }

            // Warn about dangerous permissions
            const dangerousPermissions = ['fs-write', 'network', 'system-info'];
            const requestedDangerous = plugin.permissions.filter(p => dangerousPermissions.includes(p));
            if (requestedDangerous.length > 0) {
                warnings.push(`Plugin requests potentially dangerous permissions: ${requestedDangerous.join(', ')}`);
            }
        }

        return { errors, warnings };
    }

    /**
     * Validate plugin dependencies
     * @param {Object} plugin Plugin configuration
     * @returns {Object} Validation result
     */
    validateDependencies(plugin) {
        const errors = [];
        const warnings = [];

        if (plugin.dependencies) {
            if (Array.isArray(plugin.dependencies)) {
                // Simple array format
                for (const dep of plugin.dependencies) {
                    if (typeof dep !== 'string') {
                        errors.push('Dependencies array must contain strings');
                    } else if (!this.isValidPluginName(dep)) {
                        errors.push(`Invalid dependency name: ${dep}`);
                    }
                }
            } else if (typeof plugin.dependencies === 'object') {
                // Object format with versions
                for (const [name, version] of Object.entries(plugin.dependencies)) {
                    if (!this.isValidPluginName(name)) {
                        errors.push(`Invalid dependency name: ${name}`);
                    }
                    if (typeof version === 'string' && !PluginAPI.Utils.isValidSemver(version)) {
                        errors.push(`Invalid version for dependency ${name}: ${version}`);
                    }
                }
            } else {
                errors.push('Dependencies must be an array or object');
            }

            // Check for circular dependencies (basic check)
            if (plugin.dependencies.includes && plugin.dependencies.includes(plugin.name)) {
                errors.push('Plugin cannot depend on itself');
            }
        }

        return { errors, warnings };
    }

    /**
     * Validate plugin configuration
     * @param {Object} plugin Plugin configuration
     * @returns {Object} Validation result
     */
    validateConfiguration(plugin) {
        const errors = [];
        const warnings = [];

        if (plugin.config && typeof plugin.config !== 'object') {
            errors.push('Plugin config must be an object');
            return { errors, warnings };
        }

        // Validate configuration doesn't contain sensitive data
        if (plugin.config) {
            const sensitiveKeys = ['password', 'secret', 'key', 'token', 'api_key'];
            for (const key of Object.keys(plugin.config)) {
                if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
                    warnings.push(`Configuration contains potentially sensitive key: ${key}`);
                }
            }

            // Check for overly complex configuration
            const configString = JSON.stringify(plugin.config);
            if (configString.length > 10000) {
                warnings.push('Plugin configuration is very large, consider external config files');
            }
        }

        return { errors, warnings };
    }

    /**
     * Validate plugin name format
     * @param {string} name Plugin name
     * @returns {boolean} True if valid
     */
    isValidPluginName(name) {
        return typeof name === 'string' && /^[a-z0-9-_]+$/.test(name) && name.length >= 2 && name.length <= 50;
    }

    /**
     * Validate multiple plugins and return summary
     * @param {Array} plugins Array of plugin configurations
     * @returns {Object} Validation summary
     */
    validateMultiple(plugins) {
        const results = [];
        const summary = {
            total: plugins.length,
            valid: 0,
            invalid: 0,
            warnings: 0,
            duplicateNames: []
        };

        const namesSeen = new Set();

        for (const [index, plugin] of plugins.entries()) {
            const result = this.validatePlugin(plugin, `plugin-${index}`);
            results.push(result);

            if (result.valid) {
                summary.valid++;
            } else {
                summary.invalid++;
            }

            if (result.warnings.length > 0) {
                summary.warnings++;
            }

            // Check for duplicate names
            if (plugin.name) {
                if (namesSeen.has(plugin.name)) {
                    summary.duplicateNames.push(plugin.name);
                } else {
                    namesSeen.add(plugin.name);
                }
            }
        }

        return {
            results,
            summary
        };
    }

    /**
     * Generate validation report
     * @param {Object} validationResult Validation result
     * @returns {string} Formatted report
     */
    generateReport(validationResult) {
        const { valid, errors, warnings, pluginPath } = validationResult;
        
        let report = `Plugin Validation Report: ${pluginPath}\n`;
        report += `Status: ${valid ? 'VALID' : 'INVALID'}\n\n`;

        if (errors.length > 0) {
            report += `Errors (${errors.length}):\n`;
            errors.forEach((error, index) => {
                report += `  ${index + 1}. ${error}\n`;
            });
            report += '\n';
        }

        if (warnings.length > 0) {
            report += `Warnings (${warnings.length}):\n`;
            warnings.forEach((warning, index) => {
                report += `  ${index + 1}. ${warning}\n`;
            });
            report += '\n';
        }

        if (valid && errors.length === 0 && warnings.length === 0) {
            report += 'No issues found. Plugin is ready for use.\n';
        }

        return report;
    }
}

export default PluginValidator;