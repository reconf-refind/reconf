import PluginAPI from './PluginAPI.js';

class DarkThemePlugin extends PluginAPI.ThemePlugin {
    constructor(api) {
        super(api);
        this.theme = this.buildTheme();
    }

    /**
     * Initialize the theme plugin
     */
    async initialize(api) {
        this.api.log('Dark theme plugin initialized');
        
        // Register theme with the system
        await this.api.hooks.execute('ui:theme:register', {
            name: this.name,
            theme: this.theme
        });
    }

    /**
     * Build theme configuration from plugin config
     */
    buildTheme() {
        const config = this.config;
        
        return {
            name: 'dark-theme',
            colors: {
                primary: config.primary_color,
                secondary: config.secondary_color,
                accent: config.accent_color,
                text: config.text_color,
                border: config.border_color,
                error: config.error_color,
                warning: config.warning_color,
                success: config.success_color
            },
            styles: {
                screen: {
                    bg: config.primary_color,
                    fg: config.text_color
                },
                border: {
                    fg: config.border_color
                },
                selected: {
                    bg: config.selected_bg,
                    fg: config.selected_fg
                },
                focus: {
                    border: {
                        fg: config.accent_color
                    }
                },
                hover: {
                    bg: config.secondary_color,
                    fg: config.text_color
                },
                scrollbar: {
                    bg: config.secondary_color,
                    fg: config.accent_color
                }
            }
        };
    }

    /**
     * Get theme configuration
     */
    getTheme() {
        return this.theme;
    }

    /**
     * Apply theme to blessed screen and elements
     */
    applyTheme(screen) {
        if (!screen) {
            this.api.error('No screen provided to apply theme');
            return;
        }

        try {
            // Apply screen-level styles
            screen.style = {
                ...screen.style,
                bg: this.theme.colors.primary,
                fg: this.theme.colors.text
            };

            // Apply theme to all child elements recursively
            this.applyThemeToElement(screen);

            // Force screen refresh
            screen.render();
            
            this.api.log('Dark theme applied successfully');
        } catch (error) {
            this.api.error(`Failed to apply theme: ${error.message}`);
        }
    }

    /**
     * Recursively apply theme to element and its children
     */
    applyThemeToElement(element) {
        if (!element) return;

        // Apply theme based on element type
        const elementType = element.type || 'unknown';
        
        switch (elementType) {
            case 'list':
                this.applyListTheme(element);
                break;
            case 'box':
                this.applyBoxTheme(element);
                break;
            case 'form':
                this.applyFormTheme(element);
                break;
            case 'textbox':
            case 'textarea':
                this.applyInputTheme(element);
                break;
            case 'button':
                this.applyButtonTheme(element);
                break;
            default:
                this.applyDefaultTheme(element);
        }

        // Apply to children
        if (element.children) {
            for (const child of element.children) {
                this.applyThemeToElement(child);
            }
        }
    }

    /**
     * Apply theme to list elements
     */
    applyListTheme(element) {
        element.style = {
            ...element.style,
            bg: this.theme.colors.primary,
            fg: this.theme.colors.text,
            border: {
                fg: this.theme.colors.border
            },
            selected: {
                bg: this.theme.colors.accent,
                fg: this.theme.colors.primary
            },
            item: {
                hover: {
                    bg: this.theme.colors.secondary,
                    fg: this.theme.colors.text
                }
            }
        };
    }

    /**
     * Apply theme to box elements
     */
    applyBoxTheme(element) {
        element.style = {
            ...element.style,
            bg: this.theme.colors.primary,
            fg: this.theme.colors.text,
            border: {
                fg: this.theme.colors.border
            }
        };
    }

    /**
     * Apply theme to form elements
     */
    applyFormTheme(element) {
        element.style = {
            ...element.style,
            bg: this.theme.colors.secondary,
            fg: this.theme.colors.text,
            border: {
                fg: this.theme.colors.border
            }
        };
    }

    /**
     * Apply theme to input elements
     */
    applyInputTheme(element) {
        element.style = {
            ...element.style,
            bg: this.theme.colors.secondary,
            fg: this.theme.colors.text,
            border: {
                fg: this.theme.colors.border
            },
            focus: {
                bg: this.theme.colors.secondary,
                fg: this.theme.colors.accent,
                border: {
                    fg: this.theme.colors.accent
                }
            }
        };
    }

    /**
     * Apply theme to button elements
     */
    applyButtonTheme(element) {
        element.style = {
            ...element.style,
            bg: this.theme.colors.accent,
            fg: this.theme.colors.primary,
            border: {
                fg: this.theme.colors.accent
            },
            hover: {
                bg: this.theme.colors.text,
                fg: this.theme.colors.primary
            },
            focus: {
                bg: this.theme.colors.text,
                fg: this.theme.colors.primary,
                border: {
                    fg: this.theme.colors.text
                }
            }
        };
    }

    /**
     * Apply default theme to unknown elements
     */
    applyDefaultTheme(element) {
        element.style = {
            ...element.style,
            bg: this.theme.colors.primary,
            fg: this.theme.colors.text,
            border: {
                fg: this.theme.colors.border
            }
        };
    }

    /**
     * Get theme preview for UI
     */
    getPreview() {
        return {
            name: this.theme.name,
            colors: this.theme.colors,
            preview: `
┌─ Dark Theme Preview ─┐
│ Primary: ${this.theme.colors.primary}     │
│ Accent:  ${this.theme.colors.accent}     │
│ Text:    ${this.theme.colors.text}     │
└─────────────────────┘
            `.trim()
        };
    }

    /**
     * Plugin cleanup
     */
    async cleanup() {
        this.api.log('Dark theme plugin cleaned up');
    }

    /**
     * Plugin hooks
     */
    get hooks() {
        return {
            'ui:theme': this.getTheme.bind(this),
            'ui:render': this.applyTheme.bind(this),
            'ui:theme:preview': this.getPreview.bind(this)
        };
    }
}

export default DarkThemePlugin;