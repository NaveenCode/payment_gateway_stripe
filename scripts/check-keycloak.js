#!/usr/bin/env node

/**
 * Keycloak Configuration Checker
 * Verifies that Keycloak is properly configured for the application
 */

const http = require('http');

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'nextjs-realm';

console.log('🔍 Checking Keycloak Configuration...\n');

// Check 1: Keycloak is running
console.log('1️⃣  Checking if Keycloak is running...');
http.get(KEYCLOAK_URL, (res) => {
  if (res.statusCode === 200) {
    console.log('   ✅ Keycloak is running at:', KEYCLOAK_URL);
    checkRealm();
  } else {
    console.log('   ❌ Keycloak returned status:', res.statusCode);
    console.log('   💡 Make sure Keycloak is running: docker-compose up -d');
    process.exit(1);
  }
}).on('error', (err) => {
  console.log('   ❌ Cannot connect to Keycloak');
  console.log('   💡 Make sure Keycloak is running: docker-compose up -d');
  console.log('   Error:', err.message);
  process.exit(1);
});

// Check 2: Realm exists
function checkRealm() {
  console.log('\n2️⃣  Checking if realm exists...');
  const realmUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`;

  http.get(realmUrl, (res) => {
    if (res.statusCode === 200) {
      console.log('   ✅ Realm exists:', KEYCLOAK_REALM);
      checkWellKnown();
    } else {
      console.log('   ❌ Realm not found:', KEYCLOAK_REALM);
      console.log('   💡 You need to create the realm in Keycloak!');
      console.log('');
      console.log('   Quick Steps:');
      console.log('   1. Go to: http://localhost:8080/admin');
      console.log('   2. Login: admin/admin');
      console.log('   3. Click dropdown (top-left) → "Create Realm"');
      console.log('   4. Realm name: nextjs-realm');
      console.log('   5. Click "Create"');
      console.log('');
      console.log('   📚 See QUICK_START.md for detailed instructions');
      process.exit(1);
    }
  }).on('error', (err) => {
    console.log('   ❌ Error checking realm:', err.message);
    process.exit(1);
  });
}

// Check 3: OIDC endpoint
function checkWellKnown() {
  console.log('\n3️⃣  Checking OIDC configuration...');
  const oidcUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/.well-known/openid-configuration`;

  http.get(oidcUrl, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      if (res.statusCode === 200) {
        const config = JSON.parse(data);
        console.log('   ✅ OIDC endpoint configured');
        console.log('   ✅ Issuer:', config.issuer);
        checkEnvironment(config.issuer);
      } else {
        console.log('   ❌ OIDC configuration not found');
        process.exit(1);
      }
    });
  }).on('error', (err) => {
    console.log('   ❌ Error checking OIDC:', err.message);
    process.exit(1);
  });
}

// Check 4: Environment variables
function checkEnvironment(issuer) {
  console.log('\n4️⃣  Checking environment variables...');

  const checks = [
    { key: 'KEYCLOAK_URL', value: process.env.KEYCLOAK_URL },
    { key: 'KEYCLOAK_REALM', value: process.env.KEYCLOAK_REALM },
    { key: 'KEYCLOAK_ISSUER', value: process.env.KEYCLOAK_ISSUER },
    { key: 'KEYCLOAK_CLIENT_ID', value: process.env.KEYCLOAK_CLIENT_ID },
    { key: 'KEYCLOAK_CLIENT_SECRET', value: process.env.KEYCLOAK_CLIENT_SECRET },
    { key: 'KEYCLOAK_ADMIN_USERNAME', value: process.env.KEYCLOAK_ADMIN_USERNAME },
    { key: 'KEYCLOAK_ADMIN_PASSWORD', value: process.env.KEYCLOAK_ADMIN_PASSWORD },
  ];

  let allGood = true;

  checks.forEach(check => {
    if (!check.value || check.value.includes('your-')) {
      console.log(`   ❌ ${check.key} is missing or not configured`);
      allGood = false;
    } else {
      console.log(`   ✅ ${check.key} is set`);
    }
  });

  if (process.env.KEYCLOAK_ISSUER !== issuer) {
    console.log('\n   ⚠️  WARNING: Issuer mismatch!');
    console.log('   Expected:', issuer);
    console.log('   Configured:', process.env.KEYCLOAK_ISSUER);
    console.log('   💡 Update KEYCLOAK_ISSUER in .env.local');
    allGood = false;
  }

  if (allGood) {
    console.log('\n✅ All checks passed! Keycloak is properly configured.\n');
    console.log('Next steps:');
    console.log('1. Create a client "nextjs-app" in Keycloak (if not done)');
    console.log('2. Get the client secret and update .env.local');
    console.log('3. Restart your dev server: npm run dev');
    console.log('4. Test signup at: http://localhost:3000/signup');
    console.log('\n📚 See QUICK_START.md for detailed instructions\n');
  } else {
    console.log('\n❌ Some checks failed. Please fix the issues above.\n');
    process.exit(1);
  }
}
