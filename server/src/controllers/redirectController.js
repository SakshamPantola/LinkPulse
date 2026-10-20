
const { evaluateRedirect, verifyPassword } = require('../services/redirectService');
const clickQueue = require('../services/clickQueueService');

function renderPage(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — LinkPulse</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',sans-serif;background:#202225;color:#f2f3f5;
         display:flex;align-items:center;justify-content:center;min-height:100vh;
         background:radial-gradient(ellipse at 20% 50%,#00AEEF20 0%,transparent 50%),
                    radial-gradient(ellipse at 80% 20%,#00cec920 0%,transparent 50%),
                    #202225;}
    .card{background:#2F3136;border:1px solid #3f4248;border-radius:16px;
          padding:2.5rem 2rem;max-width:440px;width:100%;text-align:center;
          box-shadow:0 25px 60px rgba(0,0,0,.45)}
    h1{font-size:1.5rem;margin-bottom:.5rem;letter-spacing:-0.02em}
    p{color:#96989d;font-size:.9rem;line-height:1.6}
    .icon{font-size:2.5rem;margin-bottom:1rem}
    input{width:100%;padding:.7rem .85rem;border-radius:8px;border:1px solid #3f4248;
          background:#202225;color:#f2f3f5;font-size:.9rem;margin-top:1rem;outline:none}
    input:focus{border-color:#00AEEF;box-shadow:0 0 0 3px #00AEEF40}
    button{width:100%;padding:.75rem;border:none;border-radius:8px;
           background:linear-gradient(135deg,#00AEEF,#0077b6);color:#fff;
           font-weight:600;font-size:.9rem;cursor:pointer;margin-top:.75rem;
           transition:box-shadow .2s, filter .2s}
    button:hover{box-shadow:0 6px 20px #00AEEF40;filter:brightness(1.08)}
    .error{color:#ed4245;font-size:.8rem;margin-top:.5rem}
  </style>
</head>
<body><div class="card">${body}</div></body>
</html>`;
}

function buildClickJob(req, link, { blocked = false } = {}) {
  const clientIp = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  return {
    linkId:      link.id,
    shortCode:   link.short_code,
    ip:          clientIp,
    userAgent:   req.headers['user-agent'] || '',
    referrer:    req.headers.referer || req.headers.referrer || null,
    querySource: req.query.src || null,   
    blocked,
  };
}

async function handleRedirect(req, res, next) {
  try {
    const { code } = req.params;
    const result = await evaluateRedirect(code);

    switch (result.action) {
      case 'not_found':
        return res.status(404).send(renderPage('Not Found',
          '<div class="icon">🔍</div><h1>Link Not Found</h1><p>This short link doesn\'t exist or has been removed.</p>'
        ));

      case 'disabled':
        clickQueue.push(buildClickJob(req, result.link, { blocked: true }));
        return res.status(410).send(renderPage('Link Disabled',
          '<div class="icon">🚫</div><h1>Link Disabled</h1><p>This link has been disabled by its owner.</p>'
        ));

      case 'expired':
        clickQueue.push(buildClickJob(req, result.link, { blocked: true }));
        return res.status(410).send(renderPage('Link Expired',
          '<div class="icon">⏰</div><h1>Link Expired</h1><p>This link has passed its expiry date.</p>'
        ));

      case 'blocked':
        clickQueue.push(buildClickJob(req, result.link, { blocked: true }));
        return res.status(403).send(renderPage('Unsafe Website Blocked',
          '<div class="icon">🛑</div><h1>Unsafe Website Blocked</h1><p>The destination website has been flagged and blocked for platform and user safety.</p>'
        ));

      case 'limit_reached':
        clickQueue.push(buildClickJob(req, result.link, { blocked: true }));
        return res.status(410).send(renderPage('Limit Reached',
          '<div class="icon">📊</div><h1>Click Limit Reached</h1><p>This link has reached its maximum number of clicks.</p>'
        ));

      case 'password_required':
        return res.status(200).send(renderPage('Password Required',
          `<div class="icon">🔒</div>
           <h1>Password Required</h1>
           <p>This link is protected. Enter the password to continue.</p>
           <form id="unlock-form" method="POST" action="/${code}/unlock${req.query.src ? '?src=' + req.query.src : ''}">
             <input type="password" id="unlock-password" name="password" placeholder="Enter password" required autofocus autocomplete="current-password" />
             <button type="submit" id="unlock-btn">Unlock</button>
             <div id="unlock-error" class="error" style="display:none"></div>
           </form>
           <script>
             const form = document.getElementById('unlock-form');
             const btn = document.getElementById('unlock-btn');
             const errDiv = document.getElementById('unlock-error');
             form.addEventListener('submit', async (e) => {
               e.preventDefault();
               const password = document.getElementById('unlock-password').value;
               btn.disabled = true;
               btn.textContent = 'Unlocking...';
               errDiv.style.display = 'none';
               try {
                 const res = await fetch(form.action, {
                   method: 'POST',
                   headers: {
                     'Content-Type': 'application/json',
                     'Accept': 'application/json'
                   },
                   body: JSON.stringify({ password })
                 });
                 const data = await res.json();
                 if (res.ok && data.redirectUrl) {
                   btn.textContent = 'Redirecting...';
                   window.location.replace(data.redirectUrl);
                 } else {
                   throw new Error(data.error || 'Incorrect password. Please try again.');
                 }
               } catch (err) {
                 btn.disabled = false;
                 btn.textContent = 'Unlock';
                 errDiv.textContent = err.message || 'Incorrect password. Please try again.';
                 errDiv.style.display = 'block';
               }
             });
           </script>`
        ));

      case 'redirect': {
        clickQueue.push(buildClickJob(req, result.link));
        return res.redirect(302, result.link.destination_url);
      }

      default:
        return res.status(500).send('Unexpected state');
    }
  } catch (err) { next(err); }
}

async function handleUnlock(req, res, next) {
  try {
    const { code } = req.params;
    const password = req.body?.password;
    const isJsonRequest = req.is('json') || req.headers.accept?.includes('application/json');
    const unlockAction = `/${code}/unlock${req.query.src ? '?src=' + req.query.src : ''}`;

    if (!password) {
      if (isJsonRequest) {
        return res.status(400).json({ error: 'Password is required.' });
      }
      return res.status(400).send(renderPage('Password Required',
        `<div class="icon">🔒</div>
         <h1>Password Required</h1>
         <p>Please enter the password.</p>
         <form method="POST" action="${unlockAction}">
           <input type="password" name="password" placeholder="Enter password" required autofocus />
           <button type="submit">Unlock</button>
           <div class="error">Password is required.</div>
         </form>`
      ));
    }

    const result = await verifyPassword(code, password);
    if (!result.valid) {
      if (isJsonRequest) {
        return res.status(403).json({ error: 'Incorrect password. Please try again.' });
      }
      return res.status(403).send(renderPage('Wrong Password',
        `<div class="icon">🔒</div>
         <h1>Wrong Password</h1>
         <p>The password you entered is incorrect.</p>
         <form method="POST" action="${unlockAction}">
           <input type="password" name="password" placeholder="Enter password" required autofocus />
           <button type="submit">Try Again</button>
           <div class="error">Incorrect password. Please try again.</div>
         </form>`
      ));
    }

    if (result.blocked) {
      clickQueue.push(buildClickJob(req, result.link, { blocked: true }));
      if (isJsonRequest) {
        return res.status(403).json({ error: 'This destination domain has been blocked for safety reasons.' });
      }
      return res.status(403).send(renderPage('Unsafe Website Blocked',
        '<div class="icon">🛑</div><h1>Unsafe Website Blocked</h1><p>The destination website has been flagged and blocked for platform and user safety.</p>'
      ));
    }

    if (result.limitReached) {
      clickQueue.push(buildClickJob(req, result.link, { blocked: true }));
      if (isJsonRequest) {
        return res.status(410).json({ error: 'This link has reached its click limit.' });
      }
      return res.status(410).send(renderPage('Limit Reached',
        '<div class="icon">📊</div><h1>Click Limit Reached</h1><p>This link has reached its maximum number of clicks.</p>'
      ));
    }

    clickQueue.push(buildClickJob(req, result.link));

    if (isJsonRequest) {
      return res.status(200).json({ success: true, redirectUrl: result.link.destination_url });
    }

    return res.redirect(303, result.link.destination_url);
  } catch (err) { next(err); }
}

module.exports = { handleRedirect, handleUnlock };
