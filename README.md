# mods - Dynamic Module Management System

A powerful module management system for Node.js that provides dynamic loading, unloading, and hot-reloading capabilities for your application modules.

## Features

- 🔄 Dynamic module loading and unloading
- 🔍 Automatic dependency tracking
- 🔥 Hot-reloading support
- 📦 Module lifecycle management
- 🧩 Context-aware module initialization
- 📡 Event emitter capabilities for inter-module communication
- ⏱️ Automatic timeout and interval management
- 🧹 Automatic cleanup on process exit and error handling

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
const module = await mods.load('moduleName', ctx);

// Load multiple modules
const modules = await mods.load(['module1', 'module2'], ctx);
```

### Unloading Modules

```javascript
// Unload a single module
await mods.unload('moduleName');

// Unload multiple modules
await mods.unload(['module1', 'module2']);

// Unload all modules
await mods.unload();
```

### Reloading Modules

```javascript
// Reload a single module
await mods.reload('moduleName', ctx);

// Reload multiple modules
await mods.reload(['module1', 'module2'], ctx);

// Reload all loaded modules
await mods.reload(null, ctx);
```

### Module Communication

```javascript
// Inside a module
this.emit('eventName', data);

// Listen for events from other modules
this.on('eventName', (data) => {
  // Handle event
});

// Broadcast events to all modules
this.broadcast('eventName', data);
```

### Timeout and Interval Management

```javascript
// Set a timeout that will be automatically cleared on unload
this.setTimeout(() => {
  // Your code
}, 1000);

// Set an interval that will be automatically cleared on unload
this.setInterval(() => {
  // Your code
}, 1000);
```

## Module Structure

Modules should be placed in the `mods` directory and follow this structure:

```javascript
// mods/example.js
module.exports = function(ctx) {
  // Module initialization code
  
  // Return cleanup function
  return async () => {
    // Cleanup code
  };
};
```

## How It Works

1. **Module Loading**: When a module is loaded, it receives a context object and returns a cleanup function.
2. **Dependency Tracking**: The system automatically tracks module dependencies through a graph system.
3. **Event System**: Modules can communicate through events using the built-in event emitter.
4. **Resource Management**: Timeouts and intervals are automatically managed and cleaned up.
5. **Hot Reloading**: Modules can be reloaded without restarting the application.
6. **Cleanup**: When unloading, the cleanup function is called to properly dispose of resources.
7. **Process Management**: Automatic cleanup on process exit and error handling.

## License

MIT 