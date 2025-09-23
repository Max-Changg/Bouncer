#!/usr/bin/env node

/**
 * Script to check your current Supabase configuration
 * Run with: node scripts/check-current-config.js
 */

console.log('🔍 Checking your current Supabase configuration...\n');

// Check if we can find the current Supabase URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ No Supabase environment variables found in current environment');
  console.log('\n📋 To find your current configuration:');
  console.log('1. Check your .env.local file');
  console.log('2. Check your Vercel environment variables');
  console.log('3. Look for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log('\n💡 Your Supabase URL should look like: https://xxxxx.supabase.co');
  process.exit(1);
}

console.log('✅ Found Supabase configuration:');
console.log(`📍 Supabase URL: ${supabaseUrl}`);
console.log(`🔑 Anon Key: ${supabaseKey.substring(0, 20)}...`);
console.log(`🔗 Project ID: ${supabaseUrl.split('//')[1].split('.')[0]}`);

console.log('\n📋 Next Steps:');
console.log('1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
console.log('2. Set these EXACT same values for both domains:');
console.log(`   NEXT_PUBLIC_SUPABASE_URL = ${supabaseUrl}`);
console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY = ${supabaseKey}`);
console.log('\n3. Go to Supabase Dashboard → Settings → API → CORS');
console.log('4. Add both domains to allowed origins:');
console.log('   - https://bouncer-app.dev');
console.log('   - https://bouncer-silk.vercel.app');
console.log('\n5. Go to Supabase Dashboard → Authentication → URL Configuration');
console.log('6. Update redirect URLs to include both domains');
