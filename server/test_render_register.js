const https = require('https');

async function testRegister(email, password, name) {
  const data = JSON.stringify({ email, password, name });
  const options = {
    hostname: 'linkpulse-fbk6.onrender.com',
    port: 443,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body });
      });
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.write(data);
    req.end();
  });
}

(async () => {
  console.log('Testing Registration on Render: https://linkpulse-fbk6.onrender.com/api/auth/register\n');
  const res = await testRegister('platform404@gmail.com', 'Admin@123', 'PLATFORM404 Admin');
  console.log('Register platform404@gmail.com: status =', res.status, res.body);
})();
