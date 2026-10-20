const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  redisUrl: process.env.REDIS_URL || null,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  baseUrl: process.env.BASE_URL || process.env.RENDER_EXTERNAL_URL || (process.env.NODE_ENV === 'production' ? 'https://linkpulse-fbk6.onrender.com' : `http://localhost:${process.env.PORT || 3001}`),
};
