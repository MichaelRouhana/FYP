#!/usr/bin/env node

/**
 * Auto-detect IP address and update app.json
 * This script finds your machine's local IP address and updates app.json automatically
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

// Get the app.json path
const appJsonPath = path.join(__dirname, '..', 'app.json');

/**
 * Get the local IP address of the machine
 * Prefers IPv4 addresses and excludes loopback and virtual network adapters
 */
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  const preferredNames = ['Ethernet', 'Wi-Fi', 'WiFi', 'WLAN', 'en0', 'eth0'];
  
  // First, try to find IP from preferred adapter names
  for (const preferredName of preferredNames) {
    for (const [name, addrs] of Object.entries(interfaces)) {
      if (name.toLowerCase().includes(preferredName.toLowerCase())) {
        for (const addr of addrs || []) {
          if (addr.family === 'IPv4' && !addr.internal) {
            // Exclude VMware, Hyper-V, WSL, and other virtual adapters
            if (!name.toLowerCase().includes('vmware') && 
                !name.toLowerCase().includes('hyper-v') &&
                !name.toLowerCase().includes('wsl') &&
                !name.toLowerCase().includes('virtualbox') &&
                !name.toLowerCase().includes('vboxnet')) {
              console.log(`✅ Found IP from adapter: ${name}`);
              return addr.address;
            }
          }
        }
      }
    }
  }
  
  // Fallback: find any non-internal IPv4 address
  for (const [name, addrs] of Object.entries(interfaces)) {
    // Skip virtual adapters
    if (name.toLowerCase().includes('vmware') || 
        name.toLowerCase().includes('hyper-v') ||
        name.toLowerCase().includes('wsl') ||
        name.toLowerCase().includes('virtualbox') ||
        name.toLowerCase().includes('vboxnet')) {
      continue;
    }
    
    for (const addr of addrs || []) {
      if (addr.family === 'IPv4' && !addr.internal) {
        console.log(`✅ Found IP from adapter: ${name}`);
        return addr.address;
      }
    }
  }
  
  return null;
}

/**
 * Update app.json with the new IP address
 */
function updateAppJson(newIP) {
  try {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    const oldIP = appJson.expo?.extra?.API_IP_ADDRESS;
    
    if (oldIP === newIP) {
      console.log(`ℹ️  IP address is already set to ${newIP}`);
      return false;
    }
    
    if (!appJson.expo) {
      appJson.expo = {};
    }
    if (!appJson.expo.extra) {
      appJson.expo.extra = {};
    }
    
    appJson.expo.extra.API_IP_ADDRESS = newIP;
    
    // Write back to file with proper formatting
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n', 'utf8');
    
    console.log(`✅ Updated app.json:`);
    console.log(`   Old IP: ${oldIP || 'not set'}`);
    console.log(`   New IP: ${newIP}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error updating app.json:', error.message);
    process.exit(1);
  }
}

// Main execution
console.log('🔍 Detecting local IP address...\n');

const ipAddress = getLocalIPAddress();

if (!ipAddress) {
  console.error('❌ Could not detect local IP address.');
  console.error('   Please set API_IP_ADDRESS manually in app.json');
  process.exit(1);
}

console.log(`📍 Detected IP address: ${ipAddress}\n`);

const updated = updateAppJson(ipAddress);

if (updated) {
  console.log('\n✨ IP address updated successfully!');
  console.log('   Restart your Expo dev server for changes to take effect.');
} else {
  console.log('\n✨ IP address is already correct!');
}

