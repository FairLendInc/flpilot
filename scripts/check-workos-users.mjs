#!/usr/bin/env node
/**
 * Check WorkOS users and help set up a test user for E2E testing
 */

import { WorkOS } from '@workos-inc/node';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local manually
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    envVars[key] = value;
    process.env[key] = value;
  }
});

const workos = new WorkOS(process.env.WORKOS_API_KEY, {
  clientId: process.env.WORKOS_CLIENT_ID,
});

async function checkUsers() {
  try {
    console.log('🔍 Checking WorkOS users...\n');

    const users = await workos.userManagement.listUsers({
      limit: 10,
    });

    if (users.data.length === 0) {
      console.log('❌ No users found in your WorkOS environment.\n');
      console.log('📝 You need to create a test user. Here are your options:\n');
      console.log('   1. Create via WorkOS Dashboard:');
      console.log('      https://dashboard.workos.com/users\n');
      console.log('   2. Create via your app\'s sign-up flow:');
      console.log('      http://localhost:3000/sign-up\n');
      console.log('   3. Create programmatically (we can add this script if needed)\n');
      return null;
    }

    console.log(`✅ Found ${users.data.length} user(s):\n`);

    for (const user of users.data) {
      console.log(`   📧 ${user.email}`);
      console.log(`      ID: ${user.id}`);
      console.log(`      First Name: ${user.firstName || 'N/A'}`);
      console.log(`      Last Name: ${user.lastName || 'N/A'}`);
      console.log(`      Created: ${user.createdAt}`);
      console.log('');
    }

    console.log('💡 Recommendation for E2E testing:');
    console.log('   Create a dedicated test user like:');
    console.log('   📧 test@example.com or e2e-test@yourapp.com');
    console.log('   🔑 Use a consistent password for E2E tests\n');

    return users.data;

  } catch (error) {
    console.error('❌ Error checking WorkOS users:', error.message);

    if (error.message && error.message.includes('401')) {
      console.log('\n⚠️  Authentication failed. Please check:');
      console.log('   - WORKOS_API_KEY is correct in .env.local');
      console.log('   - WORKOS_CLIENT_ID is correct in .env.local');
    }

    return null;
  }
}

checkUsers();
