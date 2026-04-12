const fs = require('fs');
const path = require('path');

// Get credentials from Netlify environment variables
const username = process.env.BASIC_AUTH_USERNAME || 'admin';
const password = process.env.BASIC_AUTH_PASSWORD;

if (!password) {
  console.error('Error: BASIC_AUTH_PASSWORD environment variable is required');
  process.exit(1);
}

// Automatically encode credentials (no CLI needed!)
const credentials = Buffer.from(`${username}:${password}`).toString('base64');

// Determine output directory (adjust if your build output differs)
const outputDir = process.env.NETLIFY && process.env.DEPLOY_PRIME_URL 
  ? (fs.existsSync('./out') ? './out' : './dist') 
  : './public';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create _headers content
const headersContent = `/*
  Basic-Auth: ${credentials}
  X-Frame-Options: DENY
`;

fs.writeFileSync(path.join(outputDir, '_headers'), headersContent);
console.log('✅ Password protection activated');
console.log(`Username: ${username}`);
