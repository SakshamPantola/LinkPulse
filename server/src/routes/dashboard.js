
const { Router } = require('express');
const { getDashboard } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

router.get('/', getDashboard);

module.exports = router;
