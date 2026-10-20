const dotenv = require('dotenv');
dotenv.config();

const jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' && !process.env.RENDER ? 'fallback-secret' : null);
if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is missing. Server cannot start.');
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  adminEmail: (process.env.ADMIN_EMAIL || 'platform404@gmail.com').trim().toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin@123',
  redisUrl: process.env.REDIS_URL || null,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  baseUrl: process.env.BASE_URL || process.env.RENDER_EXTERNAL_URL || (process.env.NODE_ENV === 'production' ? 'https://linkpulse-fbk6.onrender.com' : `http://localhost:${process.env.PORT || 3001}`),
};
