const { Router } = require('express');
const ctrl = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.post('/register', ctrl.register);
router.post('/login',    ctrl.login);
router.get('/me',        authenticate, ctrl.getMe);

module.exports = router;
