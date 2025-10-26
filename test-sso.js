#!/usr/bin/env node

/**
 * SSO Configuration Tester
 * Tests Keycloak SSO configuration and identifies issues
 */

const https = require('https');
const http = require('http');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const config = {
  keycloakUrl: process.env.KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.KEYCLOAK_REALM || 'nextjs-realm',
  clientId: process.env.KEYCLOAK_CLIENT_ID || 'nextjs-app',
  issuer: process.env.KEYCLOAK_ISSUER,
};

console.log('🔍 Testing Keycloak SSO Configuration...\n');

let testsPassed = 0;
let testsFailed = 0;

// Test 1: Keycloak is accessible
console.log('1️⃣  Testing Keycloak accessibility...');
http.get(config.keycloakUrl, (res) => {
  if (res.statusCode === 200 || res.statusCode === 302) {
    console.log('   ✅ Keycloak is accessible at:', config.keycloakUrl);
    testsPassed++;
    test2();
  } else {
    console.log('   ❌ Keycloak returned status:', res.statusCode);
    console.log('   💡 Make sure Keycloak is running: docker-compose up -d');
    testsFailed++;
    process.exit(1);
  }
}).on('error', (err) => {
  console.log('   ❌ Cannot connect to Keycloak');
  console.log('   💡 Error:', err.message);
  console.log('   💡 Start Keycloak: docker-compose up -d');
  testsFailed++;
  process.exit(1);
});

// Test 2: Realm exists
function test2() {
  console.log('\n2️⃣  Testing if realm exists...');
  const realmUrl = `${config.keycloakUrl}/realms/${config.realm}`;

  http.get(realmUrl, (res) => {
    if (res.statusCode === 200) {
      console.log('   ✅ Realm exists:', config.realm);
      testsPassed++;
      test3();
    } else {
      console.log('   ❌ Realm not found:', config.realm);
      console.log('   💡 Create realm in Keycloak Admin Console');
      testsFailed++;
      process.exit(1);
    }
  }).on('error', (err) => {
    console.log('   ❌ Error:', err.message);
    testsFailed++;
    process.exit(1);
  });
}

// Test 3: OpenID configuration
function test3() {
  console.log('\n3️⃣  Testing OpenID configuration...');
  const oidcUrl = `${config.keycloakUrl}/realms/${config.realm}/.well-known/openid-configuration`;

  http.get(oidcUrl, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      if (res.statusCode === 200) {
        const oidcConfig = JSON.parse(data);
        console.log('   ✅ OpenID configuration found');
        console.log('   📍 Issuer:', oidcConfig.issuer);

        if (config.issuer === oidcConfig.issuer) {
          console.log('   ✅ KEYCLOAK_ISSUER matches');
          testsPassed++;
        } else {
          console.log('   ⚠️  WARNING: Issuer mismatch!');
          console.log('      Expected:', oidcConfig.issuer);
          console.log('      Configured:', config.issuer);
          console.log('   💡 Update KEYCLOAK_ISSUER in .env.local');
        }
        test4();
      } else {
        console.log('   ❌ OpenID configuration not found');
        testsFailed++;
        process.exit(1);
      }
    });
  }).on('error', (err) => {
    console.log('   ❌ Error:', err.message);
    testsFailed++;
    process.exit(1);
  });
}

// Test 4: Environment variables
function test4() {
  console.log('\n4️⃣  Checking environment variables...');

  const requiredVars = {
    'KEYCLOAK_URL': config.keycloakUrl,
    'KEYCLOAK_REALM': config.realm,
    'KEYCLOAK_ISSUER': config.issuer,
    'KEYCLOAK_CLIENT_ID': config.clientId,
    'KEYCLOAK_CLIENT_SECRET': process.env.KEYCLOAK_CLIENT_SECRET,
    'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET,
    'NEXTAUTH_URL': process.env.NEXTAUTH_URL,
  };

  let allVarsOk = true;

  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value || value.includes('your-')) {
      console.log(`   ❌ ${key} is missing or not configured`);
      allVarsOk = false;
    } else {
      console.log(`   ✅ ${key} is set`);
    }
  }

  if (allVarsOk) {
    testsPassed++;
    test5();
  } else {
    console.log('\n   💡 Fix missing environment variables in .env.local');
    testsFailed++;
    process.exit(1);
  }
}

// Test 5: Summary and next steps
function test5() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n🎉 All configuration tests passed!');
    console.log('\n📋 IMPORTANT: To use SSO login, you must:');
    console.log('');
    console.log('1. Create a user via signup first:');
    console.log('   → Go to: http://localhost:3000/signup');
    console.log('   → Sign up with email/password');
    console.log('   → This creates user in BOTH Keycloak and MongoDB');
    console.log('');
    console.log('2. Then try SSO login:');
    console.log('   → Go to: http://localhost:3000/login');
    console.log('   → Click "Sign in with Keycloak SSO"');
    console.log('   → Login with the SAME email you used in signup');
    console.log('');
    console.log('3. Verify client exists in Keycloak:');
    console.log('   → Go to: http://localhost:8080/admin');
    console.log('   → Login: admin/admin');
    console.log('   → Select "nextjs-realm" (top-left dropdown)');
    console.log('   → Go to Clients');
    console.log('   → Verify "nextjs-app" exists');
    console.log('   → Click on it and check:');
    console.log('     ✅ Client authentication: ON');
    console.log('     ✅ Valid redirect URIs: http://localhost:3000/*');
    console.log('     ✅ Web origins: http://localhost:3000');
    console.log('');
    console.log('4. Get client secret:');
    console.log('   → In "nextjs-app" client, go to Credentials tab');
    console.log('   → Copy the Client Secret');
    console.log('   → Update KEYCLOAK_CLIENT_SECRET in .env.local');
    console.log('   → Restart Next.js: npm run dev');
    console.log('');
    console.log('🔍 If SSO still doesn\'t work after this:');
    console.log('   → Read: DEBUG_SSO.md for detailed troubleshooting');
    console.log('');
  } else {
    console.log('\n❌ Some tests failed. Please fix the issues above.');
  }

  console.log('='.repeat(60) + '\n');
}
