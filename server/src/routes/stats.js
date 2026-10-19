const { Router } = require('express');
const ctrl = require('../controllers/statsController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.get('/dashboard', ctrl.dashboard);

module.exports = router;
