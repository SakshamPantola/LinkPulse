const https = require('https');

async function testLogin(email, password) {
  const data = JSON.stringify({ email, password });
  const options = {
    hostname: 'linkpulse-fbk6.onrender.com',
    port: 443,
    path: '/api/auth/login',
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
  console.log('Testing logins against Render: https://linkpulse-fbk6.onrender.com/api/auth/login\n');
  
  const test1 = await testLogin('admin@platform404.com', 'Admin@123');
  console.log('1. admin@platform404.com: status =', test1.status, test1.body);

  const test2 = await testLogin('platform404@gmail.com', 'Admin@123');
  console.log('2. platform404@gmail.com: status =', test2.status, test2.body);

  const test3 = await testLogin('user@linkpulse.test', 'User@123');
  console.log('3. user@linkpulse.test:  status =', test3.status, test3.body);
})();
