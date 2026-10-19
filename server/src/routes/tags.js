
const { Router } = require('express');
const ctrl = require('../controllers/tagController');
const { authenticate } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

router.get('/',       ctrl.list);
router.post('/',      ctrl.create);
router.delete('/:id', ctrl.remove);

module.exports = router;
