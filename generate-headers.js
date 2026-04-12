const fs = require('fs');
const path = require('path');

// Get credentials from Netlify environment variables
const username = process.env.BASIC_AUTH_USERNAME || 'admin';
const password = process.env.BASIC_AUTH_PASSWORD;

if (!password) {
  console.error('❌ Error: BASIC_AUTH_PASSWORD environment variable is required');
  process.exit(1);
}

// Encode credentials
const credentials = Buffer.from(`${username}:${password}`).toString('base64');

// CRITICAL: Must match your publish directory in netlify.toml
// Your log shows "Starting to deploy site from '.next'" so we use '.next'
const outputDir = '.next';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create _headers file in the correct location
const headersContent = `/*
  Basic-Auth: ${credentials}
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
`;

const headersPath = path.join(outputDir, '_headers');
fs.writeFileSync(headersPath, headersContent);

console.log('✅ Password protection activated');
console.log(`📁 _headers created at: ${headersPath}`);
console.log(`👤 Username: ${username}`);
