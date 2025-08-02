import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import TtyError from '../../other/TtyError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class PluginLoader {
    constructor() {
        this.pluginPaths = [
            join(__dirname, '.'),
            join(process.cwd(), 'plugins'),
            join(process.cwd(), '.reconf-plugins')
        ];
        this.loadedPlugins = new Map();
    }

    /**
     * Discover all .reconf files in plugin directories
     * @returns {Array} Array of plugin file paths
     */
    discoverPlugins() {
        const pluginFiles = [];
        
        for (const pluginPath of this.pluginPaths) {
            try {
                if (this.directoryExists(pluginPath)) {
                    const files = this.scanDirectory(pluginPath);
                    pluginFiles.push(...files);
                }
            } catch (error) {
                console.warn(`Warning: Could not scan plugin directory ${pluginPath}: ${error.message}`);
            }
        }
        
        return pluginFiles;
    }

    /**
     * Recursively scan directory for .reconf files
     * @param {string} dir Directory to scan
     * @returns {Array} Array of .reconf file paths
     */
    scanDirectory(dir) {
        const files = [];
        
        try {
            const entries = readdirSync(dir);
            
            for (const entry of entries) {
                const fullPath = join(dir, entry);
                const stat = statSync(fullPath);
                
                if (stat.isDirectory()) {
                    files.push(...this.scanDirectory(fullPath));
                } else if (extname(entry) === '.reconf') {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            throw new TtyError(`Failed to scan directory ${dir}: ${error.message}`);
        }
        
        return files;
    }

    /**
     * Load and parse a single plugin file
     * @param {string} pluginPath Path to .reconf file
     * @returns {Object} Parsed plugin configuration
     */
    loadPlugin(pluginPath) {
        try {
            const content = readFileSync(pluginPath, 'utf8');
            const plugin = JSON.parse(content);
            
            // Validate required fields
            this.validatePlugin(plugin, pluginPath);
            
            // Add metadata
            plugin._path = pluginPath;
            plugin._directory = dirname(pluginPath);
            plugin._loaded = new Date().toISOString();
            
            return plugin;
        } catch (error) {
            if (error instanceof SyntaxError) {
                throw new TtyError(`Invalid JSON in plugin file ${pluginPath}: ${error.message}`);
            }
            throw new TtyError(`Failed to load plugin ${pluginPath}: ${error.message}`);
        }
    }

    /**
     * Load all discovered plugins
     * @returns {Map} Map of plugin name to plugin object
     */
    loadAllPlugins() {
        const pluginFiles = this.discoverPlugins();
        const loadedPlugins = new Map();
        const errors = [];

        for (const pluginPath of pluginFiles) {
            try {
                const plugin = this.loadPlugin(pluginPath);
                
                if (loadedPlugins.has(plugin.name)) {
                    console.warn(`Warning: Duplicate plugin name "${plugin.name}" found at ${pluginPath}`);
                    continue;
                }
                
                loadedPlugins.set(plugin.name, plugin);
                console.log(`Loaded plugin: ${plugin.name} v${plugin.version}`);
            } catch (error) {
                errors.push({ path: pluginPath, error: error.message });
                console.error(`Failed to load plugin ${pluginPath}: ${error.message}`);
            }
        }

        this.loadedPlugins = loadedPlugins;
        
        if (errors.length > 0) {
            console.warn(`${errors.length} plugin(s) failed to load`);
        }

        return loadedPlugins;
    }

    /**
     * Validate plugin configuration
     * @param {Object} plugin Plugin configuration object
     * @param {string} pluginPath Path to plugin file for error reporting
     */
    validatePlugin(plugin, pluginPath) {
        const requiredFields = ['name', 'version', 'type', 'main'];
        const validTypes = ['theme', 'config-parser', 'ui-component', 'validator', 'exporter'];

        for (const field of requiredFields) {
            if (!plugin[field]) {
                throw new TtyError(`Plugin ${pluginPath} missing required field: ${field}`);
            }
        }

        if (!validTypes.includes(plugin.type)) {
            throw new TtyError(`Plugin ${pluginPath} has invalid type: ${plugin.type}. Valid types: ${validTypes.join(', ')}`);
        }

        // Validate version format (basic semver check)
        if (!/^\d+\.\d+\.\d+/.test(plugin.version)) {
            throw new TtyError(`Plugin ${pluginPath} has invalid version format: ${plugin.version}`);
        }
    }

    /**
     * Get loaded plugin by name
     * @param {string} name Plugin name
     * @returns {Object|null} Plugin object or null if not found
     */
    getPlugin(name) {
        return this.loadedPlugins.get(name) || null;
    }

    /**
     * Get all loaded plugins of a specific type
     * @param {string} type Plugin type
     * @returns {Array} Array of plugins of the specified type
     */
    getPluginsByType(type) {
        return Array.from(this.loadedPlugins.values()).filter(plugin => plugin.type === type);
    }

    /**
     * Check if directory exists
     * @param {string} dir Directory path
     * @returns {boolean} True if directory exists
     */
    directoryExists(dir) {
        try {
            return statSync(dir).isDirectory();
        } catch {
            return false;
        }
    }

    /**
     * Reload all plugins
     */
    reload() {
        this.loadedPlugins.clear();
        return this.loadAllPlugins();
    }

    /**
     * Get plugin statistics
     * @returns {Object} Plugin statistics
     */
    getStats() {
        const stats = {
            total: this.loadedPlugins.size,
            byType: {}
        };

        for (const plugin of this.loadedPlugins.values()) {
            stats.byType[plugin.type] = (stats.byType[plugin.type] || 0) + 1;
        }

        return stats;
    }
}

export default PluginLoader;