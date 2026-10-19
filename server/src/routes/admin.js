
const { Router } = require('express');
const ctrl = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = Router();

router.use(authenticate, requireRole('admin'));

router.get('/stats', ctrl.stats);

router.get('/users', ctrl.listUsers);

router.get('/links', ctrl.listLinks);
router.post('/links/:id/disable', ctrl.disableLink);
router.post('/links/:id/enable', ctrl.enableLink);

router.get('/blocked-domains', ctrl.listBlockedDomains);
router.post('/blocked-domains', ctrl.createBlockedDomain);
router.delete('/blocked-domains/:id', ctrl.deleteBlockedDomain);

module.exports = router;
