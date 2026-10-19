
const dashboardService = require('../services/dashboardService');

async function getDashboard(req, res, next) {
  try {
    const { period } = req.query;
    const data = await dashboardService.getDashboardData(req.user.id, req.user.role, {
      period: period || '30d',
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard };
