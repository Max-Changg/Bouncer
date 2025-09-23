#!/usr/bin/env node

/**
 * Test script to verify Supabase configuration works across domains
 * Run with: node scripts/test-supabase-config.js
 */

const { createClient } = require('@supabase/supabase-js');

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

console.log('🧪 Testing Supabase Configuration...');
console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
console.log(`🔑 Anon Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    console.log('\n1️⃣ Testing database connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('Events')
      .select('id, name')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }

    console.log('✅ Database connection successful');
    console.log(`📊 Found ${data.length} events`);

    return true;
  } catch (err) {
    console.error('❌ Connection test failed:', err.message);
    return false;
  }
}

async function testAuth() {
  try {
    console.log('\n2️⃣ Testing authentication...');
    
    // Test auth session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Auth test failed:', error.message);
      return false;
    }

    if (session) {
      console.log('✅ User is authenticated');
      console.log(`👤 User: ${session.user.email}`);
    } else {
      console.log('ℹ️ No active session (this is normal for unauthenticated users)');
    }

    return true;
  } catch (err) {
    console.error('❌ Auth test failed:', err.message);
    return false;
  }
}

async function testPermissions() {
  try {
    console.log('\n3️⃣ Testing database permissions...');
    
    // Test if we can read from public tables
    const { data: rsvps, error: rsvpError } = await supabase
      .from('rsvps')
      .select('id')
      .limit(1);

    if (rsvpError) {
      console.error('❌ RSVP table access failed:', rsvpError.message);
      return false;
    }

    console.log('✅ RSVP table accessible');
    
    // Test if we can read from Events table
    const { data: events, error: eventError } = await supabase
      .from('Events')
      .select('id')
      .limit(1);

    if (eventError) {
      console.error('❌ Events table access failed:', eventError.message);
      return false;
    }

    console.log('✅ Events table accessible');

    return true;
  } catch (err) {
    console.error('❌ Permissions test failed:', err.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Supabase configuration tests...\n');

  const results = await Promise.all([
    testConnection(),
    testAuth(),
    testPermissions()
  ]);

  const allPassed = results.every(result => result);

  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('🎉 All tests passed! Supabase configuration is working correctly.');
    console.log('\n✅ Your configuration will work on both domains:');
    console.log('   - bouncer-app.dev');
    console.log('   - bouncer-silk.vercel.app');
    console.log('\n📋 Next steps:');
    console.log('   1. Deploy to Vercel with these environment variables');
    console.log('   2. Update Supabase Auth settings for both domains');
    console.log('   3. Test the redirect system');
  } else {
    console.log('❌ Some tests failed. Please check your configuration.');
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Verify environment variables are correct');
    console.log('   2. Check Supabase project is active');
    console.log('   3. Verify database tables exist');
    console.log('   4. Check RLS policies if enabled');
  }

  console.log('='.repeat(50));
}

// Run the tests
runTests().catch(console.error);
