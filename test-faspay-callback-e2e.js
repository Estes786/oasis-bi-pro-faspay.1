#!/usr/bin/env node
/**
 * FASPAY CALLBACK E2E TEST
 * 
 * Purpose: Simulasi lengkap callback dari Faspay untuk verifikasi:
 * 1. Signature verification (Legacy API)
 * 2. Database update ke Supabase (subscriptions table)
 * 3. Diagnosis error jika ada
 * 
 * Run: node test-faspay-callback-e2e.js
 */

const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')

// Configuration
const FASPAY_CONFIG = {
  merchantId: '36619',
  password: 'p@ssw0rd',
  callbackUrl: 'https://oasis-bi-pro-faspay-1.vercel.app/api/faspay/callback'
}

const SUPABASE_CONFIG = {
  url: 'https://ifvusvcmcxytwcokbzje.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmdnVzdmNtY3h5dHdjb2tiemplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MTU0NDUsImV4cCI6MjA4MDQ5MTQ0NX0._J3G2l_7uXOkFzvKVbfarchH6EsXvjdGS6D3ddPq5bY',
  serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmdnVzdmNtY3h5dHdjb2tiemplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDkxNTQ0NSwiZXhwIjoyMDgwNDkxNDQ1fQ.4VZyCX-xhVkgbI3QhKhLUSDojeHAyruqJB-Dr7RUKqg'
}

// Create Supabase client with Service Role Key (bypass RLS)
const supabaseAdmin = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * Generate Faspay Legacy Signature
 * Formula: SHA1(MD5(merchantId + password + bill_no + payment_status_code))
 */
function generateFaspayLegacySignature(billNo, paymentStatusCode) {
  const { merchantId, password } = FASPAY_CONFIG
  
  // STEP 1: MD5 hash
  const md5Hash = crypto
    .createHash('md5')
    .update(`${merchantId}${password}${billNo}${paymentStatusCode}`)
    .digest('hex')
  
  // STEP 2: SHA1 hash
  const signature = crypto
    .createHash('sha1')
    .update(md5Hash)
    .digest('hex')
  
  console.log('🔐 Signature Generation:')
  console.log('   Merchant ID:', merchantId)
  console.log('   Password:', password)
  console.log('   Bill No:', billNo)
  console.log('   Status Code:', paymentStatusCode)
  console.log('   MD5 Hash:', md5Hash)
  console.log('   SHA1 Signature:', signature)
  console.log('')
  
  return signature
}

/**
 * Setup Test User and Transaction
 */
async function setupTestData() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋 STEP 1: SETUP TEST USER & TRANSACTION')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  
  const testUserId = 'test-user-' + Date.now()
  const testTeamId = 'test-team-' + Date.now()
  const merchantOrderId = `OASIS-STARTER-${Date.now()}-TEST`
  
  console.log('👤 Creating test user:', testUserId)
  
  // Create test team
  const { error: teamError } = await supabaseAdmin
    .from('teams')
    .insert({
      id: testTeamId,
      name: 'Test Team',
      plan: 'starter',
      billing_status: 'pending'
    })
  
  if (teamError) {
    console.error('❌ Team creation error:', teamError)
    console.error('   This might be okay if table does not exist')
  } else {
    console.log('✅ Test team created:', testTeamId)
  }
  
  // Create test team member
  const { error: memberError } = await supabaseAdmin
    .from('team_members')
    .insert({
      team_id: testTeamId,
      user_id: testUserId,
      role: 'owner'
    })
  
  if (memberError) {
    console.error('❌ Team member creation error:', memberError)
    console.error('   This might be okay if table does not exist')
  } else {
    console.log('✅ Test team member created')
  }
  
  // Create pending transaction
  const { error: txError } = await supabaseAdmin
    .from('transactions')
    .insert({
      user_id: testUserId,
      amount: 99000,
      currency: 'IDR',
      status: 'pending',
      payment_method: 'faspay',
      payment_gateway: 'faspay',
      gateway_reference: merchantOrderId,
      metadata: {
        merchant_order_id: merchantOrderId,
        plan_id: 'starter',
        test: true
      }
    })
  
  if (txError) {
    console.error('❌ Transaction creation error:', txError)
    console.error('   This might be okay if table does not exist')
  } else {
    console.log('✅ Pending transaction created:', merchantOrderId)
  }
  
  console.log('')
  console.log('📋 Test Data Summary:')
  console.log('   User ID:', testUserId)
  console.log('   Team ID:', testTeamId)
  console.log('   Merchant Order ID:', merchantOrderId)
  console.log('   Amount: 99000 IDR (Starter Plan)')
  console.log('')
  
  return { testUserId, testTeamId, merchantOrderId }
}

/**
 * Simulate Faspay Callback
 */
async function simulateCallback(merchantOrderId) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📤 STEP 2: SIMULATE FASPAY CALLBACK')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  
  const billNo = merchantOrderId
  const billTotal = '99000'
  const paymentStatusCode = '2' // SUCCESS
  const trxId = 'TRX-' + Date.now()
  
  // Generate signature
  const signature = generateFaspayLegacySignature(billNo, paymentStatusCode)
  
  // Prepare callback payload (Legacy Debit API format)
  const callbackPayload = {
    request: 'Payment Notification',
    trx_id: trxId,
    merchant_id: FASPAY_CONFIG.merchantId,
    merchant: FASPAY_CONFIG.merchantId,
    bill_no: billNo,
    bill_reff: billNo,
    bill_date: new Date().toISOString().replace('T', ' ').substring(0, 19),
    bill_expired: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
    bill_desc: 'Starter Plan - OASIS BI PRO Subscription',
    bill_currency: 'IDR',
    bill_gross: billTotal,
    bill_miscfee: '0',
    bill_total: billTotal,
    payment_channel: '402',
    payment_channel_name: 'Permata VA',
    payment_status_code: paymentStatusCode,
    payment_status_desc: 'Payment Success',
    payment_date: new Date().toISOString().replace('T', ' ').substring(0, 19),
    payment_reff: 'REF-' + Date.now(),
    signature: signature
  }
  
  console.log('📦 Callback Payload:')
  console.log(JSON.stringify(callbackPayload, null, 2))
  console.log('')
  
  console.log('📤 Sending POST request to:', FASPAY_CONFIG.callbackUrl)
  console.log('')
  
  // Send callback request
  const response = await fetch(FASPAY_CONFIG.callbackUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Faspay-Callback-Simulator'
    },
    body: JSON.stringify(callbackPayload)
  })
  
  console.log('📥 Response Status:', response.status, response.statusText)
  
  const responseData = await response.json()
  console.log('📥 Response Body:')
  console.log(JSON.stringify(responseData, null, 2))
  console.log('')
  
  return { success: response.ok, responseData }
}

/**
 * Verify Database Update
 */
async function verifyDatabaseUpdate(testUserId, testTeamId, merchantOrderId) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔍 STEP 3: VERIFY DATABASE UPDATE')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  
  // Check subscriptions table
  console.log('🔎 Checking subscriptions table...')
  const { data: subscription, error: subError } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('team_id', testTeamId)
    .single()
  
  if (subError) {
    console.error('❌ Subscription query error:', subError)
    if (subError.code === 'PGRST116') {
      console.log('⚠️  No subscription found - callback might have failed')
    }
  } else if (subscription) {
    console.log('✅ Subscription found!')
    console.log('   Status:', subscription.status)
    console.log('   Plan:', subscription.plan)
    console.log('   Payment Gateway:', subscription.payment_gateway)
    console.log('   Gateway Reference:', subscription.gateway_subscription_id)
    console.log('')
    
    if (subscription.status === 'active' || subscription.status === 'paid') {
      console.log('✅ SUCCESS! Status is ACTIVE/PAID')
    } else {
      console.log('⚠️  WARNING! Status is NOT active:', subscription.status)
    }
  }
  
  // Check teams table
  console.log('')
  console.log('🔎 Checking teams table...')
  const { data: team, error: teamError } = await supabaseAdmin
    .from('teams')
    .select('*')
    .eq('id', testTeamId)
    .single()
  
  if (teamError) {
    console.error('❌ Team query error:', teamError)
  } else if (team) {
    console.log('✅ Team found!')
    console.log('   Plan:', team.plan)
    console.log('   Billing Status:', team.billing_status)
    console.log('')
  }
  
  // Check transactions table
  console.log('🔎 Checking transactions table...')
  const { data: transactions, error: txError } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('user_id', testUserId)
    .order('created_at', { ascending: false })
  
  if (txError) {
    console.error('❌ Transactions query error:', txError)
  } else if (transactions && transactions.length > 0) {
    console.log(`✅ Found ${transactions.length} transaction(s)`)
    transactions.forEach((tx, idx) => {
      console.log(`   [${idx + 1}] Status: ${tx.status} | Amount: ${tx.amount} | Gateway Ref: ${tx.gateway_reference}`)
    })
    console.log('')
  }
}

/**
 * Cleanup Test Data
 */
async function cleanupTestData(testUserId, testTeamId) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧹 STEP 4: CLEANUP TEST DATA')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  
  // Delete transactions
  await supabaseAdmin.from('transactions').delete().eq('user_id', testUserId)
  console.log('✅ Deleted transactions')
  
  // Delete subscriptions
  await supabaseAdmin.from('subscriptions').delete().eq('team_id', testTeamId)
  console.log('✅ Deleted subscriptions')
  
  // Delete team members
  await supabaseAdmin.from('team_members').delete().eq('user_id', testUserId)
  console.log('✅ Deleted team members')
  
  // Delete team
  await supabaseAdmin.from('teams').delete().eq('id', testTeamId)
  console.log('✅ Deleted team')
  
  console.log('')
  console.log('✅ Cleanup complete!')
}

/**
 * Main Test Flow
 */
async function runE2ETest() {
  console.log('')
  console.log('╔════════════════════════════════════════════╗')
  console.log('║  FASPAY CALLBACK E2E TEST - FINAL DIAGNOSIS  ║')
  console.log('╚════════════════════════════════════════════╝')
  console.log('')
  
  try {
    // Step 1: Setup test data
    const { testUserId, testTeamId, merchantOrderId } = await setupTestData()
    
    // Step 2: Simulate callback
    const { success, responseData } = await simulateCallback(merchantOrderId)
    
    // Wait 2 seconds for async operations
    console.log('⏳ Waiting 2 seconds for async operations...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    console.log('')
    
    // Step 3: Verify database update
    await verifyDatabaseUpdate(testUserId, testTeamId, merchantOrderId)
    
    // Step 4: Cleanup
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    })
    
    await new Promise(resolve => {
      readline.question('\n⚠️  Cleanup test data? (y/N): ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          await cleanupTestData(testUserId, testTeamId)
        } else {
          console.log('⚠️  Test data NOT cleaned up')
          console.log('   User ID:', testUserId)
          console.log('   Team ID:', testTeamId)
        }
        readline.close()
        resolve()
      })
    })
    
    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎯 E2E TEST COMPLETE')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
  } catch (error) {
    console.error('')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('💥 E2E TEST FAILED')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error(error)
    process.exit(1)
  }
}

// Run test
runE2ETest()
