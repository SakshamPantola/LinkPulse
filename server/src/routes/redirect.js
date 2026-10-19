
const { Router } = require('express');
const { handleRedirect, handleUnlock } = require('../controllers/redirectController');

const router = Router();

router.get('/:code',         handleRedirect);
router.post('/:code/unlock', handleUnlock);

module.exports = router;
