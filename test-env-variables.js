/**
 * TEST ENVIRONMENT VARIABLES
 * Purpose: Verify that all Faspay and Supabase credentials are accessible
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🔍 TESTING ENVIRONMENT VARIABLES')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

// Faspay Configuration
const faspayConfig = {
  FASPAY_MERCHANT_ID: process.env.FASPAY_MERCHANT_ID,
  FASPAY_PASSWORD_KEY: process.env.FASPAY_PASSWORD_KEY,
  FASPAY_USER_ID: process.env.FASPAY_USER_ID,
  FASPAY_PARTNER_ID: process.env.FASPAY_PARTNER_ID,
  FASPAY_CHANNEL_ID: process.env.FASPAY_CHANNEL_ID,
  FASPAY_BASE_URL: process.env.FASPAY_BASE_URL,
  FASPAY_ENV: process.env.FASPAY_ENV,
  FASPAY_CALLBACK_URL: process.env.FASPAY_CALLBACK_URL,
}

// Supabase Configuration
const supabaseConfig = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
}

console.log('\n📦 FASPAY CONFIGURATION:')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
let faspayValid = true
for (const [key, value] of Object.entries(faspayConfig)) {
  if (!value) {
    console.log(`❌ ${key}: MISSING`)
    faspayValid = false
  } else if (key === 'FASPAY_PASSWORD_KEY') {
    console.log(`✅ ${key}: ${value.substring(0, 4)}**** (masked)`)
  } else {
    console.log(`✅ ${key}: ${value}`)
  }
}

console.log('\n📦 SUPABASE CONFIGURATION:')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
let supabaseValid = true
for (const [key, value] of Object.entries(supabaseConfig)) {
  if (!value) {
    console.log(`❌ ${key}: MISSING`)
    supabaseValid = false
  } else if (key.includes('KEY')) {
    console.log(`✅ ${key}: ${value.substring(0, 20)}...(${value.length} chars)`)
  } else {
    console.log(`✅ ${key}: ${value}`)
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('📊 VALIDATION SUMMARY:')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

if (faspayValid && supabaseValid) {
  console.log('✅ ALL ENVIRONMENT VARIABLES ARE VALID')
  console.log('✅ Next.js API Routes can access Faspay credentials')
  console.log('✅ Next.js API Routes can access Supabase credentials')
  console.log('\n🚀 READY TO TEST CHECKOUT API\n')
  process.exit(0)
} else {
  console.log('❌ SOME ENVIRONMENT VARIABLES ARE MISSING')
  console.log('❌ Please check .env.local file')
  console.log('\n⚠️  FIX REQUIRED BEFORE TESTING\n')
  process.exit(1)
}
