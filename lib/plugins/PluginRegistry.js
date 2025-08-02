import PluginLoader from './PluginLoader.js';
import PluginAPI from './PluginAPI.js';
import TtyError from '../other/TtyError.js';
import { join } from 'path';

class PluginRegistry {
    constructor() {
        this.loader = new PluginLoader();
        this.plugins = new Map();
        this.activePlugins = new Map();
        this.hooks = new Map();
        this.initialized = false;
    }

    /**
     * Initialize the plugin registry
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        try {
            console.log('Initializing plugin registry...');
            this.plugins = this.loader.loadAllPlugins();
            
            // Initialize hooks system
            this.initializeHooks();
            
            // Auto-activate compatible plugins
            await this.autoActivatePlugins();
            
            this.initialized = true;
            console.log(`Plugin registry initialized with ${this.plugins.size} plugins`);
        } catch (error) {
            throw new TtyError(`Failed to initialize plugin registry: ${error.message}`);
        }
    }

    /**
     * Initialize the hooks system
     */
    initializeHooks() {
        const defaultHooks = [
            'app:init',
            'app:shutdown',
            'config:load',
            'config:save',
            'ui:render',
            'ui:theme',
            'validation:config',
            'export:config'
        ];

        for (const hook of defaultHooks) {
            this.hooks.set(hook, []);
        }
    }

    /**
     * Auto-activate plugins based on type and dependencies
     */
    async autoActivatePlugins() {
        const autoActivateTypes = ['theme', 'validator'];
        
        for (const [name, plugin] of this.plugins) {
            if (autoActivateTypes.includes(plugin.type)) {
                try {
                    await this.activatePlugin(name);
                } catch (error) {
                    console.warn(`Failed to auto-activate plugin ${name}: ${error.message}`);
                }
            }
        }
    }

    /**
     * Activate a plugin
     * @param {string} pluginName Name of the plugin to activate
     * @returns {Promise<boolean>} True if activation successful
     */
    async activatePlugin(pluginName) {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) {
            throw new TtyError(`Plugin not found: ${pluginName}`);
        }

        if (this.activePlugins.has(pluginName)) {
            console.log(`Plugin ${pluginName} is already active`);
            return true;
        }

        try {
            // Check dependencies
            await this.checkDependencies(plugin);
            
            // Load the main plugin file
            const pluginModule = await this.loadPluginModule(plugin);
            
            // Create plugin API
            const api = this.createPluginAPI(plugin);
            
            // Create plugin instance using PluginAPI factory
            const pluginInstance = PluginAPI.createPlugin(plugin, pluginModule, api);
            
            // Initialize the plugin
            if (pluginInstance.initialize) {
                await pluginInstance.initialize(api);
            }

            // Register plugin hooks
            this.registerPluginHooks(plugin, pluginInstance);

            // Mark as active
            this.activePlugins.set(pluginName, {
                plugin,
                module: pluginModule,
                instance: pluginInstance,
                activatedAt: new Date().toISOString()
            });

            console.log(`Activated plugin: ${pluginName} v${plugin.version}`);
            return true;
        } catch (error) {
            throw new TtyError(`Failed to activate plugin ${pluginName}: ${error.message}`);
        }
    }

    /**
     * Deactivate a plugin
     * @param {string} pluginName Name of the plugin to deactivate
     * @returns {Promise<boolean>} True if deactivation successful
     */
    async deactivatePlugin(pluginName) {
        const activePlugin = this.activePlugins.get(pluginName);
        if (!activePlugin) {
            console.log(`Plugin ${pluginName} is not active`);
            return true;
        }

        try {
            // Call plugin cleanup if available
            if (activePlugin.instance && activePlugin.instance.cleanup) {
                await activePlugin.instance.cleanup();
            } else if (activePlugin.module.cleanup) {
                await activePlugin.module.cleanup();
            }

            // Unregister hooks
            this.unregisterPluginHooks(activePlugin.plugin);

            // Remove from active plugins
            this.activePlugins.delete(pluginName);

            console.log(`Deactivated plugin: ${pluginName}`);
            return true;
        } catch (error) {
            throw new TtyError(`Failed to deactivate plugin ${pluginName}: ${error.message}`);
        }
    }

    /**
     * Load plugin module from file system
     * @param {Object} plugin Plugin configuration
     * @returns {Promise<Object>} Plugin module
     */
    async loadPluginModule(plugin) {
        const mainPath = join(plugin._directory, plugin.main);
        
        try {
            const module = await import(mainPath);
            return module.default || module;
        } catch (error) {
            throw new TtyError(`Failed to load plugin module ${mainPath}: ${error.message}`);
        }
    }

    /**
     * Check plugin dependencies
     * @param {Object} plugin Plugin configuration
     */
    async checkDependencies(plugin) {
        if (!plugin.dependencies || plugin.dependencies.length === 0) {
            return;
        }

        for (const dependency of plugin.dependencies) {
            if (!this.plugins.has(dependency)) {
                throw new TtyError(`Missing dependency: ${dependency}`);
            }

            // Auto-activate dependency if not active
            if (!this.activePlugins.has(dependency)) {
                await this.activatePlugin(dependency);
            }
        }
    }

    /**
     * Register plugin hooks
     * @param {Object} plugin Plugin configuration
     * @param {Object} pluginModule Plugin module
     */
    registerPluginHooks(plugin, pluginModule) {
        if (!pluginModule.hooks) {
            return;
        }

        for (const [hookName, handler] of Object.entries(pluginModule.hooks)) {
            if (!this.hooks.has(hookName)) {
                this.hooks.set(hookName, []);
            }

            this.hooks.get(hookName).push({
                plugin: plugin.name,
                handler,
                priority: handler.priority || 0
            });

            // Sort by priority (higher priority first)
            this.hooks.get(hookName).sort((a, b) => b.priority - a.priority);
        }
    }

    /**
     * Unregister plugin hooks
     * @param {Object} plugin Plugin configuration
     */
    unregisterPluginHooks(plugin) {
        for (const [hookName, handlers] of this.hooks) {
            const filtered = handlers.filter(h => h.plugin !== plugin.name);
            this.hooks.set(hookName, filtered);
        }
    }

    /**
     * Execute hooks for a given event
     * @param {string} hookName Name of the hook
     * @param {*} data Data to pass to hook handlers
     * @returns {Promise<*>} Modified data after all hooks
     */
    async executeHooks(hookName, data = null) {
        const handlers = this.hooks.get(hookName) || [];
        let result = data;

        for (const { handler, plugin } of handlers) {
            try {
                const hookResult = await handler(result, this.createPluginAPI(this.plugins.get(plugin)));
                if (hookResult !== undefined) {
                    result = hookResult;
                }
            } catch (error) {
                console.error(`Hook error in plugin ${plugin} for ${hookName}: ${error.message}`);
            }
        }

        return result;
    }

    /**
     * Create plugin API object
     * @param {Object} plugin Plugin configuration
     * @returns {Object} Plugin API
     */
    createPluginAPI(plugin) {
        return {
            plugin,
            registry: this,
            hooks: {
                execute: this.executeHooks.bind(this),
                register: (hookName, handler) => {
                    if (!this.hooks.has(hookName)) {
                        this.hooks.set(hookName, []);
                    }
                    this.hooks.get(hookName).push({
                        plugin: plugin.name,
                        handler,
                        priority: handler.priority || 0
                    });
                }
            },
            config: plugin.config || {},
            log: (message) => console.log(`[${plugin.name}] ${message}`),
            error: (message) => console.error(`[${plugin.name}] ${message}`)
        };
    }

    /**
     * Get all plugins
     * @returns {Map} All loaded plugins
     */
    getAllPlugins() {
        return new Map(this.plugins);
    }

    /**
     * Get active plugins
     * @returns {Map} Active plugins
     */
    getActivePlugins() {
        return new Map(this.activePlugins);
    }

    /**
     * Get plugins by type
     * @param {string} type Plugin type
     * @returns {Array} Plugins of specified type
     */
    getPluginsByType(type) {
        return Array.from(this.plugins.values()).filter(plugin => plugin.type === type);
    }

    /**
     * Get active plugins by type
     * @param {string} type Plugin type
     * @returns {Array} Active plugins of specified type
     */
    getActivePluginsByType(type) {
        return Array.from(this.activePlugins.values())
            .filter(({ plugin }) => plugin.type === type)
            .map(({ plugin, module }) => ({ plugin, module }));
    }

    /**
     * Reload all plugins
     */
    async reload() {
        console.log('Reloading plugin registry...');
        
        // Deactivate all plugins
        for (const pluginName of this.activePlugins.keys()) {
            await this.deactivatePlugin(pluginName);
        }

        // Clear registry
        this.plugins.clear();
        this.activePlugins.clear();
        this.hooks.clear();
        this.initialized = false;

        // Reinitialize
        await this.initialize();
    }

    /**
     * Get registry statistics
     * @returns {Object} Registry statistics
     */
    getStats() {
        const pluginStats = this.loader.getStats();
        const activeStats = {
            total: this.activePlugins.size,
            byType: {}
        };

        for (const { plugin } of this.activePlugins.values()) {
            activeStats.byType[plugin.type] = (activeStats.byType[plugin.type] || 0) + 1;
        }

        return {
            loaded: pluginStats,
            active: activeStats,
            hooks: Object.fromEntries(
                Array.from(this.hooks.entries()).map(([name, handlers]) => [name, handlers.length])
            )
        };
    }
}

export default PluginRegistry;