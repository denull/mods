# mods - Dynamic Module Management System

A powerful module management system for Node.js that provides dynamic loading, unloading, and hot-reloading capabilities for your application modules.

## Features

- 🔄 Dynamic module loading and unloading
- 🔍 Automatic dependency tracking
- 🔥 Hot-reloading support
- 📦 Module lifecycle management
- 🧩 Context-aware module initialization

## Installation

```bash
npm install mods
```

## Usage

### Basic Setup

```javascript
const mods = require('mods');

// Initialize with context
const ctx = {
  // Your application context
};

// Autoload all modules from the mods directory
mods.autoload(ctx);
```

### Loading Modules

```javascript
// Load a single module
mods.load('moduleName', ctx);

// Load multiple modules
mods.load(['module1', 'module2'], ctx);
```

### Unloading Modules

```javascript
// Unload a single module
mods.unload('moduleName');

// Unload multiple modules
mods.unload(['module1', 'module2']);
```

### Reloading Modules

```javascript
// Reload a single module
mods.reload('moduleName', ctx);

// Reload multiple modules
mods.reload(['module1', 'module2'], ctx);

// Reload all loaded modules
mods.reload(null, ctx);
```

## Module Structure

Modules should be placed in the `mods` directory and follow this structure:

```javascript
// mods/example.js
module.exports = (ctx) => {
  // Module initialization code
  
  // Return cleanup function
  return () => {
    // Cleanup code
  };
};
```

## How It Works

1. **Module Loading**: When a module is loaded, it receives a context object and returns a cleanup function.
2. **Dependency Tracking**: The system automatically tracks which modules require which other modules.
3. **Hot Reloading**: Modules can be reloaded without restarting the application.
4. **Cleanup**: When unloading, the cleanup function is called to properly dispose of resources.

## Best Practices

1. Always return a cleanup function from your modules
2. Use the provided context for module configuration
3. Keep modules focused and single-purpose
4. Handle cleanup properly to prevent memory leaks

## License

MIT 