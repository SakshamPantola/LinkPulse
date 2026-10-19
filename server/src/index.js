
const express         = require('express');
const cors            = require('cors');
const helmet          = require('helmet');
const config          = require('./config');
const errorHandler    = require('./middleware/errorHandler');
const authRoutes      = require('./routes/auth');
const linkRoutes      = require('./routes/links');
const campaignRoutes  = require('./routes/campaigns');
const tagRoutes       = require('./routes/tags');
const statsRoutes     = require('./routes/stats');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes     = require('./routes/admin');
const redirectRoutes  = require('./routes/redirect');
const clickWorker     = require('./services/clickWorker');

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
}));
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth',      authRoutes);
app.use('/api/links',     linkRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/tags',      tagRoutes);
app.use('/api/stats',     statsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin',     adminRoutes);

app.use('/', redirectRoutes);

app.use(errorHandler);

app.listen(config.port, () => {
  clickWorker.start();
  console.log(`🚀 LinkPulse server running on http://localhost:${config.port}`);
});

module.exports = app; 
