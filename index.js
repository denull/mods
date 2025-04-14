const fs = require('fs');
const path = require('path');
const Module = require('module');
const originalRequire = Module.prototype.require;
//const originalResolveFilename = Module._resolveFilename;

const modsDir = path.resolve(process.cwd(), 'mods');

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
      await Promise.all(name.map(mod => this.load(mod)));
      return;
    }
    const mod = originalRequire(`${modsDir}/${name}`);
    this.loaded[name] = await mod(ctx);
  }

  async unload(name) {
    if (Array.isArray(name)) {
      await Promise.all(name.map(mod => this.unload(mod)));
      return;
    }
    this.loaded[name] && await this.loaded[name]();
    delete this.loaded[name];
  }

  uncache(name) {
    const filename = require.resolve(name, {
      paths: [process.cwd()]
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
    await this.unload(name);
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

module.exports = mods;