# reconf Plugin System

The reconf plugin system allows you to extend the functionality of the rEFInd configuration TUI through modular plugins using the `.reconf` extension format.

## Overview

The plugin system consists of several key components:

- **Plugin Specification**: Defines the `.reconf` format for plugin configuration
- **Plugin Loader**: Discovers and loads `.reconf` files from plugin directories
- **Plugin Registry**: Manages plugin lifecycle (activation, deactivation, hooks)
- **Plugin API**: Provides standardized interfaces for different plugin types
- **Plugin Validator**: Validates plugin configurations and implementations
- **Plugin Manager UI**: TUI interface for managing plugins

## Plugin Types

### 1. Theme Plugins
Customize the visual appearance of the TUI interface.

**Example**: `dark-theme.reconf`
```json
{
  "name": "dark-theme",
  "version": "1.0.0",
  "type": "theme",
  "main": "dark-theme.js",
  "description": "Dark theme for reconf TUI",
  "config": {
    "primary_color": "#1a1a1a",
    "accent_color": "#00ff00"
  }
}
```

### 2. Validator Plugins
Validate rEFInd configuration files for syntax and common issues.

**Example**: `refind-validator.reconf`
```json
{
  "name": "refind-validator",
  "version": "1.0.0",
  "type": "validator",
  "main": "refind-validator.js",
  "description": "Validates rEFInd configuration files"
}
```

### 3. Config Parser Plugins
Parse and serialize different configuration file formats.

### 4. UI Component Plugins
Add custom UI components to the interface.

### 5. Exporter Plugins
Export configurations to different formats.

## Plugin Structure

### Configuration File (`.reconf`)
Every plugin must have a `.reconf` configuration file:

```json
{
  "name": "plugin-name",
  "version": "1.0.0",
  "type": "theme|validator|config-parser|ui-component|exporter",
  "main": "main-file.js",
  "description": "Plugin description",
  "author": "Author name",
  "dependencies": [],
  "config": {},
  "permissions": []
}
```

#### Required Fields
- `name`: Unique plugin identifier (lowercase, alphanumeric, hyphens/underscores)
- `version`: Semantic version (x.y.z)
- `type`: Plugin type from supported types
- `main`: Path to main JavaScript file

#### Optional Fields
- `description`: Brief description of functionality
- `author`: Plugin author information
- `dependencies`: Array of required plugin dependencies
- `config`: Plugin-specific configuration options
- `permissions`: Required system permissions

### Implementation File (`.js`)
The main JavaScript file must export a class that extends the appropriate plugin interface:

```javascript
import PluginAPI from './PluginAPI.js';

class MyThemePlugin extends PluginAPI.ThemePlugin {
    constructor(api) {
        super(api);
    }

    async initialize(api) {
        // Plugin initialization code
    }

    getTheme() {
        // Return theme configuration
    }

    applyTheme(screen) {
        // Apply theme to blessed screen
    }

    async cleanup() {
        // Cleanup when plugin is deactivated
    }

    get hooks() {
        return {
            'ui:theme': this.getTheme.bind(this),
            'ui:render': this.applyTheme.bind(this)
        };
    }
}

export default MyThemePlugin;
```

## Plugin API Interfaces

### Base Plugin Interface
All plugins extend `PluginAPI.BasePlugin`:

```javascript
class BasePlugin {
    constructor(api) {
        this.api = api;
        this.config = api.config;
        this.name = api.plugin.name;
        this.version = api.plugin.version;
    }

    async initialize(api) { /* Override */ }
    async cleanup() { /* Override */ }
    get hooks() { return {}; }
}
```

### Theme Plugin Interface
```javascript
class ThemePlugin extends BasePlugin {
    getTheme() { /* Return theme config */ }
    applyTheme(screen) { /* Apply to blessed screen */ }
}
```

### Validator Plugin Interface
```javascript
class ValidatorPlugin extends BasePlugin {
    validate(config) { 
        /* Return { valid: boolean, errors: [], warnings: [] } */ 
    }
    getRules() { /* Return validation rules */ }
}
```

## Plugin Directories

Plugins are automatically discovered in these directories:
- `lib/plugins/` (built-in plugins)
- `plugins/` (project plugins)
- `.reconf-plugins/` (user plugins)

## Plugin Lifecycle

1. **Discovery**: Plugin loader scans directories for `.reconf` files
2. **Loading**: Configuration is parsed and validated
3. **Registration**: Plugin is registered with the plugin registry
4. **Activation**: Plugin module is loaded and initialized
5. **Hook Registration**: Plugin hooks are registered with the system
6. **Execution**: Hooks are called during application events
7. **Deactivation**: Plugin is cleaned up and hooks are unregistered

## Hook System

Plugins can register hooks for various application events:

### Available Hooks
- `app:init` - Application initialization
- `app:shutdown` - Application shutdown
- `config:load` - Configuration loading
- `config:save` - Configuration saving
- `ui:render` - UI rendering
- `ui:theme` - Theme application
- `validation:config` - Configuration validation
- `export:config` - Configuration export

### Registering Hooks
```javascript
get hooks() {
    return {
        'ui:theme': this.getTheme.bind(this),
        'validation:config': this.validate.bind(this)
    };
}
```

## Plugin Validation

The plugin validator checks for:

### Structural Validation
- Required fields presence
- Correct data types
- Valid plugin type
- Semantic version format
- Plugin name format

### Security Validation
- File path security (no parent directory references)
- Permission validation
- Dangerous permission warnings

### Type-Specific Validation
- Theme plugins: color configuration
- Validators: validation rules
- UI components: component type
- Exporters: export formats

## Plugin Manager UI

Access the plugin manager through the main menu:
1. Start reconf: `npm start`
2. Select "Plugin Management"
3. Use the interface to:
   - View all loaded plugins
   - See plugin details and status
   - Activate/deactivate plugins
   - Reload plugins
   - Validate plugin configurations

### Keyboard Shortcuts
- `Tab` - Navigate between elements
- `Space` - Toggle plugin activation
- `r` - Reload plugins
- `v` - Validate selected plugin
- `Escape` - Close plugin manager

## Development Guide

### Creating a New Plugin

1. **Create plugin configuration**:
```bash
touch my-plugin.reconf
```

2. **Define plugin metadata**:
```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "type": "theme",
  "main": "my-plugin.js",
  "description": "My custom plugin"
}
```

3. **Implement plugin class**:
```javascript
import PluginAPI from './PluginAPI.js';

class MyPlugin extends PluginAPI.ThemePlugin {
    // Implementation here
}

export default MyPlugin;
```

4. **Test your plugin**:
   - Place files in a plugin directory
   - Restart reconf
   - Check Plugin Manager for your plugin

### Best Practices

1. **Follow naming conventions**: Use lowercase with hyphens
2. **Implement proper error handling**: Use try-catch blocks
3. **Provide meaningful descriptions**: Help users understand functionality
4. **Use semantic versioning**: Follow x.y.z format
5. **Clean up resources**: Implement cleanup method
6. **Validate inputs**: Check parameters in your methods
7. **Log appropriately**: Use `this.api.log()` and `this.api.error()`

### Testing Plugins

1. **Use the validator**: Check plugin configuration
2. **Test activation/deactivation**: Ensure proper lifecycle
3. **Verify hooks**: Confirm hooks are called correctly
4. **Check error handling**: Test with invalid inputs
5. **Performance testing**: Ensure plugins don't slow the UI

## Troubleshooting

### Common Issues

1. **Plugin not loading**:
   - Check `.reconf` file syntax (valid JSON)
   - Verify required fields are present
   - Ensure main file exists and is valid JavaScript

2. **Plugin activation fails**:
   - Check console for error messages
   - Verify plugin implements required interface methods
   - Check for missing dependencies

3. **Hooks not working**:
   - Ensure hooks are properly defined in `get hooks()`
   - Check hook names match available hooks
   - Verify hook handlers are bound correctly

4. **Theme not applying**:
   - Check `applyTheme` method implementation
   - Verify theme configuration format
   - Ensure blessed screen object is valid

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=reconf:plugins npm start
```

## File Structure

```
lib/plugins/
├── README.md                 # This documentation
├── PluginSpec.reconf        # Plugin format specification
├── PluginLoader.js          # Plugin discovery and loading
├── PluginRegistry.js        # Plugin lifecycle management
├── PluginAPI.js             # Plugin interfaces and utilities
├── PluginValidator.js       # Plugin validation
├── dark-theme.reconf        # Example theme plugin config
├── dark-theme.js            # Example theme plugin implementation
├── refind-validator.reconf  # Example validator plugin config
└── refind-validator.js      # Example validator plugin implementation
```

## Contributing

When contributing plugins to reconf:

1. Follow the plugin specification exactly
2. Include comprehensive documentation
3. Add appropriate error handling
4. Test thoroughly across different scenarios
5. Follow the project's coding standards
6. Include example configurations if applicable

## License

Plugins should be compatible with the main project license (ISC).