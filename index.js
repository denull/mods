const fs = require('fs');
const path = require('path');
const Module = require('module');
const EventEmitter = require('node:events');
const originalRequire = Module.prototype.require;
//const originalResolveFilename = Module._resolveFilename;

const modsDir = path.resolve(process.cwd(), 'mods');

class Mod extends EventEmitter {
  constructor(mods, name, ctx) {
    super();
    this.mods = mods;
    this.name = name;
    this.ctx = ctx;
    this.timeouts = [];
    this.intervals = [];
  }

  broadcast(event, ...args) {
    this.mods.forEach(mod => {
      mod.emit(event, ...args);
    });
  }

  setTimeout(fn, ms) {
    const timeout = setTimeout(fn, ms);
    this.timeouts.push(timeout);
    return timeout;
  }

  setInterval(fn, ms) {
    const interval = setInterval(fn, ms);
    this.intervals.push(interval);
    return interval;
  }

  clearTimeout(timeout) {
    clearTimeout(timeout);
    this.timeouts.splice(this.timeouts.indexOf(timeout), 1);
  }

  clearInterval(interval) {
    clearInterval(interval);
    this.intervals.splice(this.intervals.indexOf(interval), 1);
  }

  async unload(isReloading = false) {
    this.emit('beforeUnload', isReloading);
    this.removeAllListeners();
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.intervals.forEach(interval => clearInterval(interval));
    this.beforeUnload && await this.beforeUnload();
  }
}

class Mods {
  constructor() {
    this.graph = {};
    this.loaded = {};
  }

  async autoload(ctx) {
    const files = fs.readdirSync(modsDir);
    await Promise.all(files.map(file => this.load(file.replace('.js', ''), ctx)));
  }

  async load(name, ctx) {
    if (Array.isArray(name)) {
      return Promise.all(name.map(mod => this.load(mod)));
    }
    const load = originalRequire(`${modsDir}/${name}`);
    const mod = new Mod(this.loaded, name, ctx);
    this.loaded[name] = mod;
    mod.beforeUnload = load.call(mod, ctx); // We need to set the beforeUnload even before loading is complete (so the unload can work correctly)
    await mod.beforeUnload;
    return mod;
  }

  async unload(name, isReloading = false) {
    if (!name) {
      Object.keys(this.loaded).forEach(mod => this.unload(mod, isReloading));
      return;
    }
    if (Array.isArray(name)) {
      await Promise.all(name.map(mod => this.unload(mod, isReloading)));
      return;
    }
    if (!this.loaded[name]) {
      return;
    }
    await this.loaded[name].unload(isReloading);
    delete this.loaded[name];
  }

  uncache(name) {
    const filename = require.resolve(name, {
      paths: [modsDir]
    });
    delete require.cache[filename];
    if (this.graph[filename]) {
      this.graph[filename].requires.forEach(dependency => {
        this.uncache(dependency);
      });
    }
  }

  async reload(name, ctx) {
    if (!name) {
      Object.keys(this.loaded).forEach(mod => this.reload(mod, ctx));
      return;
    }
    if (Array.isArray(name)) {
      await Promise.all(name.map(mod => this.reload(mod, ctx)));
      return;
    }
    await this.unload(name, true);
    this.uncache(`${modsDir}/${name}`);
    await this.load(name, ctx);
  }
}
const mods = new Mods();

Module.prototype.require = function(path) {
  if (!mods.graph[this.filename]) {
    mods.graph[this.filename] = {
      requires: new Set(),
    }
  }
  mods.graph[this.filename].requires.add(path);
  return originalRequire.call(this, path);
};

/*Module._resolveFilename = function(request, parent, isMain, options) {
  const resolvedPath = originalResolveFilename.apply(this, arguments);

  // Now you have both the requested module name and its resolved path
  console.log(`${request} resolves to ${resolvedPath}`);

  return resolvedPath;
};*/

// Handle process exit events
const exitSignals = ['SIGINT', 'SIGTERM', 'SIGHUP'];
let isExiting = false;

const cleanup = async () => {
  if (isExiting) return;
  isExiting = true;
  
  try {
    await mods.unload();
  } catch (error) {
    console.error('Error during module cleanup:', error);
  } finally {
    process.exit(0);
  }
};

exitSignals.forEach(signal => {
  process.on(signal, cleanup);
});

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  await cleanup();
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  await cleanup();
});

module.exports = mods;