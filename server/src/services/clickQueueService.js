
const config = require('../config');

class MemoryQueue {
  constructor() {
    this.queue = [];
    this._timer = null;
  }

  push(job) {
    this.queue.push(job);
  }

  process(handler) {
    
    this._timer = setInterval(async () => {
      while (this.queue.length > 0) {
        const job = this.queue.shift();
        try {
          await handler(job);
        } catch (err) {
          console.error('[click-worker] failed to process job:', err.message);
        }
      }
    }, 100);
  }

  stop() {
    if (this._timer) clearInterval(this._timer);
  }
}

let instance = null;

function getClickQueue() {
  if (instance) return instance;
  
  instance = new MemoryQueue();
  console.log('📮 Click queue: in-memory (set REDIS_URL for Redis)');
  return instance;
}

module.exports = getClickQueue();
