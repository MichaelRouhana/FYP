#!/usr/bin/env node

/**
 * Test backend connection
 * This script checks if the backend server is reachable at the configured IP and port
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Read app.json to get the configured IP and port
const appJsonPath = path.join(__dirname, '..', 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

const ipAddress = appJson.expo?.extra?.API_IP_ADDRESS || '192.168.10.249';
const port = appJson.expo?.extra?.API_PORT || '8080';
const pathPrefix = appJson.expo?.extra?.API_PATH_PREFIX || '/api/v1';

const testUrl = `http://${ipAddress}:${port}${pathPrefix}`;
const healthUrl = `http://${ipAddress}:${port}${pathPrefix}/health`; // Common health check endpoint

console.log('🔍 Testing backend connection...\n');
console.log(`📍 Testing: ${testUrl}`);
console.log(`🏥 Health check: ${healthUrl}\n`);

function testConnection(url, label) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'GET',
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      console.log(`✅ ${label}: Server is reachable!`);
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);
      resolve({ success: true, status: res.statusCode });
    });

    req.on('error', (error) => {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ ${label}: Connection refused - Backend is not running or not accessible`);
        console.log(`   Make sure your backend server is running on ${ipAddress}:${port}`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`❌ ${label}: Connection timeout - Backend is not responding`);
        console.log(`   Check if Windows Firewall is blocking port ${port}`);
      } else {
        console.log(`❌ ${label}: ${error.message}`);
        console.log(`   Error code: ${error.code}`);
      }
      resolve({ success: false, error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      console.log(`❌ ${label}: Request timeout`);
      resolve({ success: false, error: 'timeout' });
    });

    req.end();
  });
}

async function runTests() {
  const results = await Promise.all([
    testConnection(testUrl, 'Main API'),
    testConnection(healthUrl, 'Health Check'),
  ]);

  console.log('\n📊 Summary:');
  const allSuccess = results.every(r => r.success);
  
  if (allSuccess) {
    console.log('✅ Backend is reachable and responding!');
  } else {
    console.log('❌ Backend connection failed');
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Make sure your backend server is running');
    console.log(`   2. Verify the backend is listening on ${ipAddress}:${port}`);
    console.log('   3. Check Windows Firewall settings');
    console.log('   4. If using Docker, ensure port mapping is correct');
    console.log('   5. Try accessing http://localhost:8080 in your browser');
  }
}

runTests().catch(console.error);

