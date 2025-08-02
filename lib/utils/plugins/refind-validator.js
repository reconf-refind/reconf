import PluginAPI from './PluginAPI.js';

class RefindValidatorPlugin extends PluginAPI.ValidatorPlugin {
    constructor(api) {
        super(api);
        this.rules = this.config.validation_rules;
        this.severityLevels = this.config.severity_levels;
    }

    /**
     * Initialize the validator plugin
     */
    async initialize(api) {
        this.api.log('rEFInd validator plugin initialized');
    }

    /**
     * Validate rEFInd configuration
     * @param {Object} config Configuration object to validate
     * @returns {Object} Validation result
     */
    validate(config) {
        const errors = [];
        const warnings = [];
        const info = [];

        try {
            // Parse config if it's a string
            if (typeof config === 'string') {
                config = this.parseRefindConfig(config);
            }

            // Validate global configuration
            this.validateGlobalConfig(config, errors, warnings, info);

            // Validate menu entries
            this.validateMenuEntries(config, errors, warnings, info);

            // Validate file paths and references
            this.validateFilePaths(config, errors, warnings, info);

            // Check for common issues
            this.checkCommonIssues(config, errors, warnings, info);

            // Performance and security checks
            this.performanceChecks(config, errors, warnings, info);
            this.securityChecks(config, errors, warnings, info);

        } catch (error) {
            errors.push(`Validation error: ${error.message}`);
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            info,
            summary: {
                total_issues: errors.length + warnings.length,
                errors: errors.length,
                warnings: warnings.length,
                info: info.length
            }
        };
    }

    /**
     * Parse rEFInd configuration from string
     * @param {string} configText Configuration text
     * @returns {Object} Parsed configuration
     */
    parseRefindConfig(configText) {
        const config = {
            global: {},
            menuentry: []
        };

        const lines = configText.split('\n');
        let currentSection = 'global';
        let currentMenuEntry = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip comments and empty lines
            if (!line || line.startsWith('#')) continue;

            // Check for menu entry
            if (line.startsWith('menuentry')) {
                if (currentMenuEntry) {
                    config.menuentry.push(currentMenuEntry);
                }
                currentMenuEntry = {
                    line: i + 1,
                    title: this.extractMenuEntryTitle(line),
                    options: {}
                };
                currentSection = 'menuentry';
                continue;
            }

            // Check for closing brace
            if (line === '}' && currentSection === 'menuentry') {
                if (currentMenuEntry) {
                    config.menuentry.push(currentMenuEntry);
                    currentMenuEntry = null;
                }
                currentSection = 'global';
                continue;
            }

            // Parse option
            const [key, ...valueParts] = line.split(/\s+/);
            const value = valueParts.join(' ');

            if (currentSection === 'global') {
                config.global[key] = value;
            } else if (currentMenuEntry) {
                currentMenuEntry.options[key] = value;
            }
        }

        // Add final menu entry if exists
        if (currentMenuEntry) {
            config.menuentry.push(currentMenuEntry);
        }

        return config;
    }

    /**
     * Extract menu entry title from line
     * @param {string} line Menu entry line
     * @returns {string} Extracted title
     */
    extractMenuEntryTitle(line) {
        const match = line.match(/menuentry\s+"([^"]+)"/);
        return match ? match[1] : 'Untitled';
    }

    /**
     * Validate global configuration options
     */
    validateGlobalConfig(config, errors, warnings, info) {
        const global = config.global || {};

        // Check for required sections
        for (const required of this.rules.required_sections) {
            if (required === 'global' && Object.keys(global).length === 0) {
                warnings.push('No global configuration options found');
            }
        }

        // Validate each global option
        for (const [key, value] of Object.entries(global)) {
            if (!this.rules.valid_boot_options.includes(key)) {
                errors.push(`Unknown global option: ${key}`);
                continue;
            }

            // Validate specific options
            switch (key) {
                case 'timeout':
                    this.validateTimeout(value, errors, warnings);
                    break;
                case 'hideui':
                    this.validateHideUI(value, errors, warnings);
                    break;
                case 'scanfor':
                    this.validateScanFor(value, errors, warnings);
                    break;
                case 'resolution':
                    this.validateResolution(value, errors, warnings);
                    break;
                case 'icons_dir':
                case 'banner':
                    this.validateFilePath(key, value, errors, warnings);
                    break;
            }
        }
    }

    /**
     * Validate timeout option
     */
    validateTimeout(value, errors, warnings) {
        const timeout = parseInt(value);
        if (isNaN(timeout)) {
            errors.push(`Invalid timeout value: ${value} (must be a number)`);
        } else if (timeout < 0) {
            errors.push(`Timeout cannot be negative: ${timeout}`);
        } else if (timeout > 3600) {
            warnings.push(`Very long timeout: ${timeout} seconds (consider reducing)`);
        } else if (timeout === 0) {
            info.push('Timeout set to 0 - boot menu will not be shown');
        }
    }

    /**
     * Validate hideui option
     */
    validateHideUI(value, errors, warnings) {
        const options = value.split(/[,\s]+/).filter(opt => opt);
        
        for (const option of options) {
            if (!this.rules.valid_hideui_options.includes(option)) {
                errors.push(`Invalid hideui option: ${option}`);
            }
        }

        if (options.includes('all')) {
            warnings.push('hideui "all" hides all UI elements - ensure this is intended');
        }
    }

    /**
     * Validate scanfor option
     */
    validateScanFor(value, errors, warnings) {
        const options = value.split(/[,\s]+/).filter(opt => opt);
        
        for (const option of options) {
            if (!this.rules.valid_scanfor_options.includes(option)) {
                errors.push(`Invalid scanfor option: ${option}`);
            }
        }

        if (options.includes('hdbios') && options.includes('internal')) {
            warnings.push('Both "hdbios" and "internal" specified - may cause conflicts');
        }
    }

    /**
     * Validate resolution option
     */
    validateResolution(value, errors, warnings) {
        const resolutionPattern = /^\d+x\d+(@\d+)?$/;
        if (!resolutionPattern.test(value)) {
            errors.push(`Invalid resolution format: ${value} (expected format: WIDTHxHEIGHT or WIDTHxHEIGHT@REFRESH)`);
        }
    }

    /**
     * Validate file path
     */
    validateFilePath(option, path, errors, warnings) {
        if (!path) {
            warnings.push(`Empty path for ${option}`);
            return;
        }

        // Check for common path issues
        if (path.includes('\\')) {
            warnings.push(`${option} uses backslashes - use forward slashes for better compatibility`);
        }

        if (path.startsWith('/')) {
            info.push(`${option} uses absolute path: ${path}`);
        }

        // Check for suspicious paths
        if (path.includes('..')) {
            warnings.push(`${option} contains parent directory references: ${path}`);
        }
    }

    /**
     * Validate menu entries
     */
    validateMenuEntries(config, errors, warnings, info) {
        const menuEntries = config.menuentry || [];

        if (menuEntries.length === 0) {
            warnings.push('No menu entries defined - rEFInd will auto-detect boot options');
            return;
        }

        for (const [index, entry] of menuEntries.entries()) {
            this.validateMenuEntry(entry, index, errors, warnings, info);
        }
    }

    /**
     * Validate individual menu entry
     */
    validateMenuEntry(entry, index, errors, warnings, info) {
        const entryPrefix = `Menu entry ${index + 1} (${entry.title})`;

        // Check for required options
        if (!entry.options.loader && !entry.options.volume) {
            errors.push(`${entryPrefix}: Missing loader or volume specification`);
        }

        // Validate options
        for (const [key, value] of Object.entries(entry.options)) {
            switch (key) {
                case 'loader':
                case 'icon':
                case 'initrd':
                    this.validateFilePath(`${entryPrefix} ${key}`, value, errors, warnings);
                    break;
                case 'volume':
                    this.validateVolume(`${entryPrefix}`, value, errors, warnings);
                    break;
                case 'options':
                    this.validateBootOptions(`${entryPrefix}`, value, errors, warnings);
                    break;
            }
        }
    }

    /**
     * Validate volume specification
     */
    validateVolume(prefix, volume, errors, warnings) {
        // Volume can be GUID, label, or filesystem label
        if (!volume) {
            errors.push(`${prefix}: Empty volume specification`);
            return;
        }

        // Check for GUID format
        const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (guidPattern.test(volume)) {
            info.push(`${prefix}: Using GUID volume specification`);
        }
    }

    /**
     * Validate boot options
     */
    validateBootOptions(prefix, options, errors, warnings) {
        if (options.includes('root=')) {
            info.push(`${prefix}: Contains root= parameter`);
        }

        // Check for potentially dangerous options
        const dangerousOptions = ['init=/bin/sh', 'single', 'emergency'];
        for (const dangerous of dangerousOptions) {
            if (options.includes(dangerous)) {
                warnings.push(`${prefix}: Contains potentially dangerous boot option: ${dangerous}`);
            }
        }
    }

    /**
     * Check for common configuration issues
     */
    checkCommonIssues(config, errors, warnings, info) {
        const global = config.global || {};

        // Check for deprecated options
        const deprecatedOptions = ['legacy', 'scan_all_linux_kernels'];
        for (const deprecated of deprecatedOptions) {
            if (global[deprecated]) {
                warnings.push(`Deprecated option found: ${deprecated}`);
            }
        }

        // Check for conflicting options
        if (global.textonly && global.resolution) {
            warnings.push('textonly and resolution options may conflict');
        }

        if (global.hideui && global.hideui.includes('all') && global.timeout && parseInt(global.timeout) > 0) {
            warnings.push('hideui "all" with timeout > 0 may not show timeout countdown');
        }
    }

    /**
     * Performance checks
     */
    performanceChecks(config, errors, warnings, info) {
        const global = config.global || {};

        // Check scan delay
        if (global.scan_delay) {
            const delay = parseInt(global.scan_delay);
            if (delay > 5) {
                warnings.push(`High scan_delay (${delay}s) may slow boot process`);
            }
        }

        // Check for excessive menu entries
        const menuEntries = config.menuentry || [];
        if (menuEntries.length > 20) {
            warnings.push(`Many menu entries (${menuEntries.length}) may clutter interface`);
        }
    }

    /**
     * Security checks
     */
    securityChecks(config, errors, warnings, info) {
        const global = config.global || {};

        // Check for security-related options
        if (global.enable_and_lock_vmx === 'false') {
            info.push('VMX support is disabled');
        }

        // Check for CSR values (macOS security)
        if (global.csr_values) {
            warnings.push('CSR values specified - ensure this is necessary for your setup');
        }

        // Check menu entries for security issues
        const menuEntries = config.menuentry || [];
        for (const entry of menuEntries) {
            if (entry.options.options && entry.options.options.includes('nokaslr')) {
                warnings.push(`Menu entry "${entry.title}" disables KASLR - security risk`);
            }
        }
    }

    /**
     * Get validation rules
     */
    getRules() {
        return this.rules;
    }

    /**
     * Plugin cleanup
     */
    async cleanup() {
        this.api.log('rEFInd validator plugin cleaned up');
    }

    /**
     * Plugin hooks
     */
    get hooks() {
        return {
            'validation:config': this.validate.bind(this),
            'validation:refind': this.validate.bind(this)
        };
    }
}

export default RefindValidatorPlugin;