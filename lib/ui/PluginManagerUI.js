import blessed from 'blessed';

class PluginManagerUI {
    constructor(screen, pluginRegistry) {
        this.screen = screen;
        this.pluginRegistry = pluginRegistry;
        this.container = null;
        this.pluginList = null;
        this.detailsBox = null;
        this.statusBar = null;
        this.currentPlugin = null;
    }

    /**
     * Create and show plugin manager interface
     */
    show() {
        this.createContainer();
        this.createPluginList();
        this.createDetailsBox();
        this.createStatusBar();
        this.createButtons();
        this.setupEventHandlers();
        this.refreshPluginList();
        
        this.container.show();
        this.pluginList.focus();
        this.screen.render();
    }

    /**
     * Hide plugin manager interface
     */
    hide() {
        if (this.container) {
            this.container.hide();
            this.screen.render();
        }
    }

    /**
     * Create main container
     */
    createContainer() {
        this.container = blessed.box({
            parent: this.screen,
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            border: 'line',
            style: {
                border: {
                    fg: 'cyan'
                }
            },
            label: ' Plugin Manager ',
            hidden: true
        });
    }

    /**
     * Create plugin list
     */
    createPluginList() {
        this.pluginList = blessed.list({
            parent: this.container,
            width: '40%',
            height: '80%',
            top: 1,
            left: 1,
            border: 'line',
            style: {
                border: {
                    fg: 'blue'
                },
                selected: {
                    bg: 'blue',
                    fg: 'white',
                    bold: true
                },
                item: {
                    hover: {
                        bg: 'grey',
                        fg: 'white'
                    }
                }
            },
            label: ' Available Plugins ',
            keys: true,
            mouse: true,
            scrollable: true,
            alwaysScroll: true,
            scrollbar: {
                ch: ' ',
                style: {
                    bg: 'blue'
                }
            }
        });
    }

    /**
     * Create details box
     */
    createDetailsBox() {
        this.detailsBox = blessed.box({
            parent: this.container,
            width: '58%',
            height: '80%',
            top: 1,
            right: 1,
            border: 'line',
            style: {
                border: {
                    fg: 'green'
                }
            },
            label: ' Plugin Details ',
            scrollable: true,
            alwaysScroll: true,
            scrollbar: {
                ch: ' ',
                style: {
                    bg: 'green'
                }
            },
            content: 'Select a plugin to view details...'
        });
    }

    /**
     * Create status bar
     */
    createStatusBar() {
        this.statusBar = blessed.box({
            parent: this.container,
            width: '100%',
            height: 3,
            bottom: 5,
            left: 0,
            border: 'line',
            style: {
                border: {
                    fg: 'yellow'
                }
            },
            label: ' Status ',
            content: 'Ready'
        });
    }

    /**
     * Create action buttons
     */
    createButtons() {
        const buttonContainer = blessed.box({
            parent: this.container,
            width: '100%',
            height: 4,
            bottom: 0,
            left: 0
        });

        // Activate/Deactivate button
        this.toggleButton = blessed.button({
            parent: buttonContainer,
            width: 12,
            height: 3,
            top: 0,
            left: 2,
            content: 'Activate',
            border: 'line',
            style: {
                border: {
                    fg: 'green'
                },
                focus: {
                    border: {
                        fg: 'white'
                    }
                }
            },
            mouse: true
        });

        // Reload button
        this.reloadButton = blessed.button({
            parent: buttonContainer,
            width: 10,
            height: 3,
            top: 0,
            left: 16,
            content: 'Reload',
            border: 'line',
            style: {
                border: {
                    fg: 'blue'
                },
                focus: {
                    border: {
                        fg: 'white'
                    }
                }
            },
            mouse: true
        });

        // Validate button
        this.validateButton = blessed.button({
            parent: buttonContainer,
            width: 12,
            height: 3,
            top: 0,
            left: 28,
            content: 'Validate',
            border: 'line',
            style: {
                border: {
                    fg: 'yellow'
                },
                focus: {
                    border: {
                        fg: 'white'
                    }
                }
            },
            mouse: true
        });

        // Close button
        this.closeButton = blessed.button({
            parent: buttonContainer,
            width: 8,
            height: 3,
            top: 0,
            right: 2,
            content: 'Close',
            border: 'line',
            style: {
                border: {
                    fg: 'red'
                },
                focus: {
                    border: {
                        fg: 'white'
                    }
                }
            },
            mouse: true
        });
    }

    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Plugin list selection
        this.pluginList.on('select', (item) => {
            const pluginName = this.extractPluginName(item.getText());
            this.selectPlugin(pluginName);
        });

        // Button handlers
        this.toggleButton.on('press', () => this.togglePlugin());
        this.reloadButton.on('press', () => this.reloadPlugins());
        this.validateButton.on('press', () => this.validatePlugin());
        this.closeButton.on('press', () => this.hide());

        // Keyboard shortcuts
        this.container.key(['escape'], () => this.hide());
        this.container.key(['r'], () => this.reloadPlugins());
        this.container.key(['space'], () => this.togglePlugin());
        this.container.key(['v'], () => this.validatePlugin());
        this.container.key(['tab'], () => this.focusNext());
    }

    /**
     * Focus next element
     */
    focusNext() {
        const focusables = [this.pluginList, this.toggleButton, this.reloadButton, this.validateButton, this.closeButton];
        const current = this.screen.focused;
        const currentIndex = focusables.indexOf(current);
        const nextIndex = (currentIndex + 1) % focusables.length;
        focusables[nextIndex].focus();
        this.screen.render();
    }

    /**
     * Refresh plugin list
     */
    refreshPluginList() {
        const allPlugins = this.pluginRegistry.getAllPlugins();
        const activePlugins = this.pluginRegistry.getActivePlugins();
        const items = [];

        for (const [name, plugin] of allPlugins) {
            const isActive = activePlugins.has(name);
            const status = isActive ? '●' : '○';
            const statusColor = isActive ? 'green' : 'grey';
            
            items.push(`{${statusColor}-fg}${status}{/} ${name} (${plugin.type}) v${plugin.version}`);
        }

        this.pluginList.setItems(items);
        this.updateStatusBar();
        this.screen.render();
    }

    /**
     * Extract plugin name from list item text
     */
    extractPluginName(itemText) {
        // Remove status indicator and extract name
        const match = itemText.match(/[●○] (.+?) \(/);
        return match ? match[1] : '';
    }

    /**
     * Select plugin and show details
     */
    selectPlugin(pluginName) {
        const plugin = this.pluginRegistry.getAllPlugins().get(pluginName);
        if (!plugin) return;

        this.currentPlugin = pluginName;
        this.showPluginDetails(plugin);
        this.updateToggleButton();
    }

    /**
     * Show plugin details
     */
    showPluginDetails(plugin) {
        const isActive = this.pluginRegistry.getActivePlugins().has(plugin.name);
        const activePlugin = this.pluginRegistry.getActivePlugins().get(plugin.name);

        let details = `Name: ${plugin.name}
Version: ${plugin.version}
Type: ${plugin.type}
Author: ${plugin.author || 'Unknown'}
Description: ${plugin.description || 'No description'}

Status: ${isActive ? '{green-fg}Active{/}' : '{red-fg}Inactive{/}'}
Main File: ${plugin.main}
Plugin Path: ${plugin._path}

Dependencies: ${plugin.dependencies ? plugin.dependencies.join(', ') : 'None'}

Configuration:
${JSON.stringify(plugin.config || {}, null, 2)}`;

        if (isActive && activePlugin) {
            details += `

Activation Details:
Activated At: ${activePlugin.activatedAt}
Hooks Registered: ${Object.keys(activePlugin.instance?.hooks || {}).length}`;
        }

        if (plugin.permissions && plugin.permissions.length > 0) {
            details += `

Required Permissions:
${plugin.permissions.map(p => `• ${p}`).join('\n')}`;
        }

        this.detailsBox.setContent(details);
        this.screen.render();
    }

    /**
     * Update toggle button text
     */
    updateToggleButton() {
        if (!this.currentPlugin) {
            this.toggleButton.setContent('Select Plugin');
            return;
        }

        const isActive = this.pluginRegistry.getActivePlugins().has(this.currentPlugin);
        this.toggleButton.setContent(isActive ? 'Deactivate' : 'Activate');
        this.toggleButton.style.border.fg = isActive ? 'red' : 'green';
        this.screen.render();
    }

    /**
     * Toggle plugin activation
     */
    async togglePlugin() {
        if (!this.currentPlugin) {
            this.setStatus('No plugin selected', 'warning');
            return;
        }

        try {
            const isActive = this.pluginRegistry.getActivePlugins().has(this.currentPlugin);
            
            this.setStatus(`${isActive ? 'Deactivating' : 'Activating'} ${this.currentPlugin}...`, 'info');

            if (isActive) {
                await this.pluginRegistry.deactivatePlugin(this.currentPlugin);
                this.setStatus(`Deactivated ${this.currentPlugin}`, 'success');
            } else {
                await this.pluginRegistry.activatePlugin(this.currentPlugin);
                this.setStatus(`Activated ${this.currentPlugin}`, 'success');
            }

            this.refreshPluginList();
            this.selectPlugin(this.currentPlugin); // Refresh details
            this.updateToggleButton();

        } catch (error) {
            this.setStatus(`Error: ${error.message}`, 'error');
        }
    }

    /**
     * Reload all plugins
     */
    async reloadPlugins() {
        try {
            this.setStatus('Reloading plugins...', 'info');
            await this.pluginRegistry.reload();
            this.refreshPluginList();
            this.currentPlugin = null;
            this.detailsBox.setContent('Select a plugin to view details...');
            this.updateToggleButton();
            this.setStatus('Plugins reloaded successfully', 'success');
        } catch (error) {
            this.setStatus(`Reload failed: ${error.message}`, 'error');
        }
    }

    /**
     * Validate selected plugin
     */
    validatePlugin() {
        if (!this.currentPlugin) {
            this.setStatus('No plugin selected', 'warning');
            return;
        }

        const plugin = this.pluginRegistry.getAllPlugins().get(this.currentPlugin);
        if (!plugin) return;

        // This would integrate with PluginValidator
        this.setStatus(`Validation for ${this.currentPlugin} - Feature coming soon`, 'info');
    }

    /**
     * Update status bar
     */
    updateStatusBar() {
        const stats = this.pluginRegistry.getStats();
        const status = `Loaded: ${stats.loaded.total} | Active: ${stats.active.total} | Types: ${Object.keys(stats.active.byType).join(', ')}`;
        this.statusBar.setContent(status);
    }

    /**
     * Set status message with color
     */
    setStatus(message, type = 'info') {
        const colors = {
            info: 'blue',
            success: 'green',
            warning: 'yellow',
            error: 'red'
        };

        const color = colors[type] || 'white';
        this.statusBar.setContent(`{${color}-fg}${message}{/}`);
        this.screen.render();

        // Clear status after 3 seconds
        setTimeout(() => {
            this.updateStatusBar();
            this.screen.render();
        }, 3000);
    }
}

export default PluginManagerUI;