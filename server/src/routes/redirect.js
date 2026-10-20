const { Router } = require('express');
const { handleRedirect, handleUnlock } = require('../controllers/redirectController');
const rateLimiter = require('../middleware/rateLimiter');

const router = Router();

// Protect password unlock endpoint from brute-force attempts
const unlockRateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many unlock attempts. Please wait 1 minute before trying again.',
});

router.get('/:code', handleRedirect);
router.post('/:code/unlock', unlockRateLimiter, handleUnlock);

module.exports = router;
