
const config = require('../config');

function errorHandler(err, _req, res, _next) {
  
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
    });
  }

  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  if (config.nodeEnv !== 'test') {
    console.error(`[ERROR] ${status} — ${message}`, err.stack || '');
  }

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
