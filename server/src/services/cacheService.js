
const config = require('../config');

class MemoryCache {
  constructor() {
    this.store = new Map();   
  }

  async get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return JSON.parse(entry.value);
  }

  async set(key, value, ttl = 60) {
    this.store.set(key, {
      value: JSON.stringify(value),
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  async del(key) {
    this.store.delete(key);
  }

  async invalidatePrefix(prefix) {
    for (const k of this.store.keys()) {
      if (k.startsWith(prefix)) this.store.delete(k);
    }
  }
}

let instance = null;

function getCache() {
  if (instance) return instance;
  
  instance = new MemoryCache();
  console.log('📦 Cache: in-memory (set REDIS_URL for Redis)');
  return instance;
}

module.exports = getCache();
