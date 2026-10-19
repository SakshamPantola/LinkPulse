const { Router } = require('express');
const ctrl = require('../controllers/linkController');
const statsCtrl = require('../controllers/statsController');
const tagCtrl = require('../controllers/tagController');
const { authenticate } = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');

const router = Router();

const linkCreateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many link creation requests. Rate limit is 20 links per minute. Please try again shortly.',
});

router.use(authenticate);

router.post('/validate', ctrl.validate);                          
router.post('/import',   linkCreateLimiter, ctrl.importCsv);      
router.post('/',         linkCreateLimiter, ctrl.create);         
router.get('/',          ctrl.list);                               

router.get('/:id/analytics', statsCtrl.linkAnalytics);             
router.get('/:id/qr',        ctrl.getQr);                          
router.get('/:id/qr-info',   ctrl.getQrInfo);                      

router.get('/:id',       ctrl.getOne);                             
router.patch('/:id',     ctrl.update);                             
router.delete('/:id',    ctrl.disable);                            

router.post('/:id/tags',          tagCtrl.attach);
router.delete('/:id/tags/:tagId', tagCtrl.detach);

module.exports = router;
