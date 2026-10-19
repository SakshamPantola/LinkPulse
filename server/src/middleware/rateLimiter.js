
function rateLimiter({ windowMs = 60 * 1000, max = 20, message } = {}) {
  
  const hits = new Map();

  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetAt) {
        hits.delete(key);
      }
    }
  }, 60 * 1000);

  if (cleanupTimer.unref) cleanupTimer.unref();

  return function (req, res, next) {
    const key = req.user?.id ? `user:${req.user.id}` : `ip:${req.ip}`;
    const now = Date.now();

    let record = hits.get(key);

    if (!record || now > record.resetAt) {
      record = {
        count: 1,
        resetAt: now + windowMs,
      };
      hits.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetTimeSec = Math.ceil(record.resetAt / 1000);
    const retryAfterSec = Math.max(1, Math.ceil((record.resetAt - now) / 1000));

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTimeSec);

    if (record.count > max) {
      res.setHeader('Retry-After', retryAfterSec);
      const defaultMsg = `Too many link creation requests. Rate limit is ${max} links per minute. Please try again in ${retryAfterSec} seconds.`;
      return res.status(429).json({
        error: message || defaultMsg,
        retryAfter: retryAfterSec,
      });
    }

    next();
  };
}

module.exports = rateLimiter;
