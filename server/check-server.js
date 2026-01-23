// Quick script to check if the chat server is running
const http = require('http');

const PORT = process.env.PORT || 3001;
const HOST = 'localhost';

const options = {
  hostname: HOST,
  port: PORT,
  path: '/health',
  method: 'GET',
  timeout: 2000
};

const req = http.request(options, (res) => {
  console.log(`✅ Chat server is running on port ${PORT}`);
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error(`❌ Chat server is NOT running on port ${PORT}`);
  console.error(`Error: ${error.message}`);
  console.log('\nTo start the server, run:');
  console.log('  cd server');
  console.log('  npm run dev');
  process.exit(1);
});

req.on('timeout', () => {
  console.error(`❌ Connection timeout - server may not be running on port ${PORT}`);
  req.destroy();
  process.exit(1);
});

req.end();
