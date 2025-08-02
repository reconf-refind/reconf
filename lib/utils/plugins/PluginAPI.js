import TtyError from '../../other/TtyError.js';

/**
 * Plugin API - Provides standardized interface for plugins to interact with reconf
 */
class PluginAPI {
    constructor(registry) {
        this.registry = registry;
        this.eventEmitter = new Map();
    }

    /**
     * Base Plugin Interface - All plugins should extend this
     */
    static BasePlugin = class {
        constructor(api) {
            this.api = api;
            this.config = api.config;
            this.name = api.plugin.name;
            this.version = api.plugin.version;
        }

        /**
         * Initialize the plugin
         * @param {Object} api Plugin API instance
         */
        async initialize(api) {
            // Override in plugin implementation
        }

        /**
         * Cleanup when plugin is deactivated
         */
        async cleanup() {
            // Override in plugin implementation
        }

        /**
         * Get plugin hooks
         * @returns {Object} Hook handlers
         */
        get hooks() {
            return {};
        }
    };

    /**
     * Theme Plugin Interface
     */
    static ThemePlugin = class extends PluginAPI.BasePlugin {
        /**
         * Get theme configuration
         * @returns {Object} Theme configuration
         */
        getTheme() {
            throw new TtyError('ThemePlugin must implement getTheme()');
        }

        /**
         * Apply theme to blessed screen
         * @param {Object} screen Blessed screen instance
         */
        applyTheme(screen) {
            throw new TtyError('ThemePlugin must implement applyTheme()');
        }

        get hooks() {
            return {
                'ui:theme': this.getTheme.bind(this),
                'ui:render': this.applyTheme.bind(this)
            };
        }
    };

    /**
     * Config Parser Plugin Interface
     */
    static ConfigParserPlugin = class extends PluginAPI.BasePlugin {
        /**
         * Parse configuration file
         * @param {string} content File content
         * @param {string} filePath File path
         * @returns {Object} Parsed configuration
         */
        parse(content, filePath) {
            throw new TtyError('ConfigParserPlugin must implement parse()');
        }

        /**
         * Serialize configuration to string
         * @param {Object} config Configuration object
         * @returns {string} Serialized configuration
         */
        serialize(config) {
            throw new TtyError('ConfigParserPlugin must implement serialize()');
        }

        /**
         * Get supported file extensions
         * @returns {Array} Array of supported extensions
         */
        getSupportedExtensions() {
            return [];
        }

        get hooks() {
            return {
                'config:parse': this.parse.bind(this),
                'config:serialize': this.serialize.bind(this)
            };
        }
    };

    /**
     * UI Component Plugin Interface
     */
    static UIComponentPlugin = class extends PluginAPI.BasePlugin {
        /**
         * Create UI component
         * @param {Object} parent Parent blessed element
         * @param {Object} options Component options
         * @returns {Object} Blessed element
         */
        createComponent(parent, options = {}) {
            throw new TtyError('UIComponentPlugin must implement createComponent()');
        }

        /**
         * Get component type
         * @returns {string} Component type identifier
         */
        getComponentType() {
            throw new TtyError('UIComponentPlugin must implement getComponentType()');
        }

        get hooks() {
            return {
                'ui:component:create': this.createComponent.bind(this)
            };
        }
    };

    /**
     * Validator Plugin Interface
     */
    static ValidatorPlugin = class extends PluginAPI.BasePlugin {
        /**
         * Validate configuration
         * @param {Object} config Configuration to validate
         * @returns {Object} Validation result { valid: boolean, errors: Array }
         */
        validate(config) {
            throw new TtyError('ValidatorPlugin must implement validate()');
        }

        /**
         * Get validation rules
         * @returns {Object} Validation rules
         */
        getRules() {
            return {};
        }

        get hooks() {
            return {
                'validation:config': this.validate.bind(this)
            };
        }
    };

    /**
     * Exporter Plugin Interface
     */
    static ExporterPlugin = class extends PluginAPI.BasePlugin {
        /**
         * Export configuration
         * @param {Object} config Configuration to export
         * @param {string} format Export format
         * @returns {string} Exported configuration
         */
        export(config, format) {
            throw new TtyError('ExporterPlugin must implement export()');
        }

        /**
         * Get supported export formats
         * @returns {Array} Array of supported formats
         */
        getSupportedFormats() {
            return [];
        }

        get hooks() {
            return {
                'export:config': this.export.bind(this)
            };
        }
    };

    /**
     * Utility functions for plugins
     */
    static Utils = {
        /**
         * Validate semantic version
         * @param {string} version Version string
         * @returns {boolean} True if valid semver
         */
        isValidSemver(version) {
            return /^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?(\+[a-zA-Z0-9-]+)?$/.test(version);
        },

        /**
         * Compare semantic versions
         * @param {string} v1 First version
         * @param {string} v2 Second version
         * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2
         */
        compareVersions(v1, v2) {
            const parts1 = v1.split('.').map(Number);
            const parts2 = v2.split('.').map(Number);

            for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
                const part1 = parts1[i] || 0;
                const part2 = parts2[i] || 0;

                if (part1 < part2) return -1;
                if (part1 > part2) return 1;
            }

            return 0;
        },

        /**
         * Deep merge objects
         * @param {Object} target Target object
         * @param {Object} source Source object
         * @returns {Object} Merged object
         */
        deepMerge(target, source) {
            const result = { ...target };

            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(result[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }

            return result;
        },

        /**
         * Validate plugin configuration against schema
         * @param {Object} config Plugin configuration
         * @param {Object} schema Validation schema
         * @returns {Object} Validation result
         */
        validateConfig(config, schema) {
            const errors = [];

            for (const [key, rules] of Object.entries(schema)) {
                const value = config[key];

                if (rules.required && (value === undefined || value === null)) {
                    errors.push(`Missing required field: ${key}`);
                    continue;
                }

                if (value !== undefined && rules.type && typeof value !== rules.type) {
                    errors.push(`Invalid type for ${key}: expected ${rules.type}, got ${typeof value}`);
                }

                if (rules.enum && !rules.enum.includes(value)) {
                    errors.push(`Invalid value for ${key}: must be one of ${rules.enum.join(', ')}`);
                }

                if (rules.pattern && typeof value === 'string' && !new RegExp(rules.pattern).test(value)) {
                    errors.push(`Invalid format for ${key}: must match pattern ${rules.pattern}`);
                }
            }

            return {
                valid: errors.length === 0,
                errors
            };
        }
    };

    /**
     * Plugin factory - Creates plugin instances based on type
     * @param {Object} pluginConfig Plugin configuration
     * @param {Object} pluginModule Plugin module
     * @returns {Object} Plugin instance
     */
    static createPlugin(pluginConfig, pluginModule, api) {
        const PluginClass = pluginModule.default || pluginModule;

        // Validate plugin class
        if (typeof PluginClass !== 'function') {
            throw new TtyError(`Plugin ${pluginConfig.name} does not export a valid class`);
        }

        // Create plugin instance
        const plugin = new PluginClass(api);

        // Validate plugin implements required interface
        switch (pluginConfig.type) {
            case 'theme':
                if (!(plugin instanceof PluginAPI.ThemePlugin) && !plugin.getTheme) {
                    throw new TtyError(`Theme plugin ${pluginConfig.name} must implement ThemePlugin interface`);
                }
                break;
            case 'config-parser':
                if (!(plugin instanceof PluginAPI.ConfigParserPlugin) && !plugin.parse) {
                    throw new TtyError(`Config parser plugin ${pluginConfig.name} must implement ConfigParserPlugin interface`);
                }
                break;
            case 'ui-component':
                if (!(plugin instanceof PluginAPI.UIComponentPlugin) && !plugin.createComponent) {
                    throw new TtyError(`UI component plugin ${pluginConfig.name} must implement UIComponentPlugin interface`);
                }
                break;
            case 'validator':
                if (!(plugin instanceof PluginAPI.ValidatorPlugin) && !plugin.validate) {
                    throw new TtyError(`Validator plugin ${pluginConfig.name} must implement ValidatorPlugin interface`);
                }
                break;
            case 'exporter':
                if (!(plugin instanceof PluginAPI.ExporterPlugin) && !plugin.export) {
                    throw new TtyError(`Exporter plugin ${pluginConfig.name} must implement ExporterPlugin interface`);
                }
                break;
        }

        return plugin;
    }

    /**
     * Event system for plugin communication
     */
    on(event, handler) {
        if (!this.eventEmitter.has(event)) {
            this.eventEmitter.set(event, []);
        }
        this.eventEmitter.get(event).push(handler);
    }

    emit(event, data) {
        const handlers = this.eventEmitter.get(event) || [];
        for (const handler of handlers) {
            try {
                handler(data);
            } catch (error) {
                console.error(`Event handler error for ${event}: ${error.message}`);
            }
        }
    }

    off(event, handler) {
        const handlers = this.eventEmitter.get(event) || [];
        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
        }
    }
}

export default PluginAPI;