import blessed from 'blessed';
import { readFileSync, writeFileSync } from 'fs';
import PluginRegistry from '../utils/plugins/pluginRegistry.js';
import PluginValidator from '../utils/plugins/pluginValidator.js';
import PluginManagerUI from '../ui/pluginManagerUI.js';
import constants from '../utils/constants.js';

class ReconfApp {
    constructor() {
        this.screen = null;
        this.pluginRegistry = new PluginRegistry();
        this.pluginValidator = new PluginValidator();
        this.pluginManagerUI = null;
        this.currentTheme = null;
        this.initialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log(`Starting reconf v${constants.VERSION}...`);
            
            // Initialize plugin system
            await this.initializePlugins();
            
            // Create blessed screen
            this.createScreen();
            
            // Apply theme if available
            await this.applyTheme();
            
            // Create main menu
            this.createMainMenu();
            
            // Create UI components
            this.createUIComponents();
            
            // Setup event handlers
            this.setupEventHandlers();
            
            // Execute app initialization hooks
            await this.pluginRegistry.executeHooks('app:init', { app: this });
            
            // Render screen
            this.screen.render();
            
            this.initialized = true;
            console.log('reconf initialized successfully');
            
        } catch (error) {
            console.error(`Failed to initialize reconf: ${error.message}`);
            process.exit(1);
        }
    }

    /**
     * Initialize plugin system
     */
    async initializePlugins() {
        try {
            await this.pluginRegistry.initialize();
            const stats = this.pluginRegistry.getStats();
            console.log(`Loaded ${stats.loaded.total} plugins (${stats.active.total} active)`);
        } catch (error) {
            console.warn(`Plugin system initialization failed: ${error.message}`);
            // Continue without plugins
        }
    }

    /**
     * Create blessed screen
     */
    createScreen() {
        this.screen = blessed.screen({
            smartCSR: true,
            title: 'reconf - rEFInd Configuration Tool',
            cursor: {
                artificial: true,
                shape: 'line',
                blink: true,
                color: null
            }
        });
    }

    /**
     * Apply theme from plugins
     */
    async applyTheme() {
        try {
            const themePlugins = this.pluginRegistry.getActivePluginsByType('theme');
            if (themePlugins.length > 0) {
                const themePlugin = themePlugins[0]; // Use first available theme
                this.currentTheme = await themePlugin.module.getTheme();
                await themePlugin.module.applyTheme(this.screen);
                console.log(`Applied theme: ${this.currentTheme.name}`);
            }
        } catch (error) {
            console.warn(`Failed to apply theme: ${error.message}`);
        }
    }

    /**
     * Create main menu
     */
    createMainMenu() {
        const menuItems = [
            'Configure rEFInd',
            'Validate Configuration',
            'Plugin Management',
            'Settings',
            'Exit'
        ];

        this.mainMenu = blessed.list({
            parent: this.screen,
            width: '60%',
            height: '70%',
            top: 'center',
            left: 'center',
            items: menuItems,
            keys: true,
            mouse: true,
            border: 'line',
            style: {
                selected: {
                    fg: 'green',
                    bold: true
                },
                item: {
                    hover: {
                        bg: 'blue',
                        fg: 'white',
                    },
                },
                border: {
                    fg: 'cyan',
                },
            },
            label: {
                text: ` reconf v${constants.VERSION} - Main Menu `,
                side: 'left'
            }
        });

        // Focus the menu
        this.mainMenu.focus();

        // Handle menu selection
        this.mainMenu.on('select', async (item) => {
            const itemName = item.getText();
            await this.handleMenuSelection(itemName);
        });
    }

    /**
     * Handle main menu selection
     */
    async handleMenuSelection(itemName) {
        try {
            switch (itemName) {
                case 'Configure rEFInd':
                    await this.showConfigurationMenu();
                    break;
                case 'Validate Configuration':
                    await this.showValidationMenu();
                    break;
                case 'Plugin Management':
                    await this.showPluginMenu();
                    break;
                case 'Settings':
                    await this.showSettingsMenu();
                    break;
                case 'Exit':
                    await this.shutdown();
                    break;
                default:
                    this.showMessage('Feature not implemented yet', 'info');
            }
        } catch (error) {
            this.showMessage(`Error: ${error.message}`, 'error');
        }
    }

    /**
     * Show configuration menu
     */
    async showConfigurationMenu() {
        this.showMessage('rEFInd configuration interface coming soon!', 'info');
    }

    /**
     * Show validation menu
     */
    async showValidationMenu() {
        const validators = this.pluginRegistry.getActivePluginsByType('validator');
        if (validators.length === 0) {
            this.showMessage('No validator plugins available', 'warning');
            return;
        }

        this.showMessage(`Found ${validators.length} validator plugin(s)`, 'info');
    }

    /**
     * Show plugin management menu
     */
    async showPluginMenu() {
        if (this.pluginManagerUI) {
            this.pluginManagerUI.show();
        } else {
            this.showMessage('Plugin manager not available', 'error');
        }
    }

    /**
     * Create UI components
     */
    createUIComponents() {
        // Create plugin manager UI
        this.pluginManagerUI = new PluginManagerUI(this.screen, this.pluginRegistry);
    }

    /**
     * Show settings menu
     */
    async showSettingsMenu() {
        this.showMessage('Settings interface coming soon!', 'info');
    }

    /**
     * Show message dialog
     */
    showMessage(message, type = 'info') {
        const colors = {
            info: 'blue',
            warning: 'yellow',
            error: 'red',
            success: 'green'
        };

        const messageBox = blessed.message({
            parent: this.screen,
            width: '50%',
            height: '30%',
            top: 'center',
            left: 'center',
            border: 'line',
            style: {
                border: {
                    fg: colors[type] || 'white'
                }
            },
            label: ` ${type.toUpperCase()} `
        });

        messageBox.display(message, () => {
            this.screen.render();
        });
    }

    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Global key handlers
        this.screen.key(['escape', 'q', 'C-c'], async () => {
            await this.shutdown();
        });

        // Help key
        this.screen.key(['h', '?'], () => {
            this.showHelp();
        });

        // Refresh key
        this.screen.key(['r', 'f5'], async () => {
            await this.refresh();
        });
    }

    /**
     * Show help dialog
     */
    showHelp() {
        const helpText = `reconf - rEFInd Configuration Tool

Keyboard Shortcuts:
  ESC, q, Ctrl+C  - Exit application
  h, ?            - Show this help
  r, F5           - Refresh replugs
  
Navigation:
  Arrow keys      - Navigate menus
  Enter           - Select item
  Tab             - Switch focus

Plugin System:
  Loaded: ${this.pluginRegistry.getStats().loaded.total} plugins
  Active: ${this.pluginRegistry.getStats().active.total} plugins`;

        this.showMessage(helpText, 'info');
    }

    /**
     * Refresh application and plugins
     */
    async refresh() {
        try {
            this.showMessage('Refreshing plugins...', 'info');
            await this.pluginRegistry.reload();
            await this.applyTheme();
            this.screen.render();
            this.showMessage('Refresh complete', 'success');
        } catch (error) {
            this.showMessage(`Refresh failed: ${error.message}`, 'error');
        }
    }

    /**
     * Shutdown application
     */
    async shutdown() {
        try {
            if (this.initialized) {
                console.log('Shutting down reconf...');
                
                // Execute shutdown hooks
                await this.pluginRegistry.executeHooks('app:shutdown', { app: this });
                
                // Cleanup plugins
                for (const pluginName of this.pluginRegistry.getActivePlugins().keys()) {
                    await this.pluginRegistry.deactivatePlugin(pluginName);
                }
            }
            
            console.log('Goodbye!');
            process.exit(0);
        } catch (error) {
            console.error(`Shutdown error: ${error.message}`);
            process.exit(1);
        }
    }
}

// Export function for backward compatibility
export default async function init() {
    const app = new ReconfApp();
    await app.init();
}
