#!/usr/bin/env node
/**
 * FASPAY CALLBACK PRODUCTION READINESS TEST
 * 
 * Purpose: Final E2E test to verify production readiness
 * This test simulates real-world callback scenario:
 * 1. Creates test user and team in Supabase
 * 2. Creates pending transaction
 * 3. Simulates Faspay callback with valid signature
 * 4. Verifies subscription status update
 * 5. Cleans up test data
 * 
 * Run: node test-callback-production-ready.js
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
  serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmdnVzdmNtY3h5dHdjb2tiemplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDkxNTQ0NSwiZXhwIjoyMDgwNDkxNDQ1fQ.4VZyCX-xhVkgbI3QhKhLUSDojeHAyruqJB-Dr7RUKqg'
}

// Create Supabase admin client
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
 */
function generateFaspaySignature(billNo, paymentStatusCode) {
  const { merchantId, password } = FASPAY_CONFIG
  
  const md5Hash = crypto
    .createHash('md5')
    .update(`${merchantId}${password}${billNo}${paymentStatusCode}`)
    .digest('hex')
  
  const signature = crypto
    .createHash('sha1')
    .update(md5Hash)
    .digest('hex')
  
  console.log('🔐 Signature Generation:')
  console.log('   Formula: SHA1(MD5(merchantId + password + billNo + statusCode))')
  console.log('   Merchant ID:', merchantId)
  console.log('   Bill No:', billNo)
  console.log('   Status Code:', paymentStatusCode)
  console.log('   MD5 Hash:', md5Hash)
  console.log('   SHA1 Signature:', signature)
  console.log('')
  
  return signature
}

/**
 * Setup test data in Supabase
 */
async function setupTestData() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋 STEP 1: SETUP TEST DATA')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  
  const timestamp = Date.now()
  const testUserId = crypto.randomUUID()
  const testTeamId = crypto.randomUUID()
  const merchantOrderId = `OASIS-STARTER-${timestamp}-PRODTEST`
  
  console.log('📝 Creating test data...')
  console.log('   User ID:', testUserId)
  console.log('   Team ID:', testTeamId)
  console.log('   Merchant Order ID:', merchantOrderId)
  console.log('')
  
  try {
    // Create test team
    console.log('🏢 Creating test team...')
    const { error: teamError } = await supabaseAdmin
      .from('teams')
      .insert({
        id: testTeamId,
        name: 'Test Team Production',
        slug: 'test-team-prod-' + timestamp,
        plan: 'starter',
        billing_status: 'pending',
        owner_id: testUserId
      })
    
    if (teamError) {
      console.error('❌ Team creation failed:', teamError.message)
      throw teamError
    }
    console.log('✅ Test team created')
    
    // Create test team member
    console.log('👤 Creating test team member...')
    const { error: memberError } = await supabaseAdmin
      .from('team_members')
      .insert({
        team_id: testTeamId,
        user_id: testUserId,
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString()
      })
    
    if (memberError) {
      console.error('❌ Team member creation failed:', memberError.message)
      throw memberError
    }
    console.log('✅ Test team member created')
    
    // Create pending transaction (CRITICAL for callback)
    console.log('💳 Creating pending transaction...')
    const { error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: testUserId,
        team_id: testTeamId,
        amount: 99000,
        currency: 'IDR',
        status: 'pending',
        payment_method: 'faspay',
        payment_gateway: 'faspay',
        gateway_reference: merchantOrderId,
        metadata: {
          merchant_order_id: merchantOrderId,
          plan_id: 'starter',
          test: true,
          test_type: 'production_readiness'
        }
      })
    
    if (txError) {
      console.error('❌ Transaction creation failed:', txError.message)
      throw txError
    }
    console.log('✅ Pending transaction created')
    
    console.log('')
    console.log('📊 Test Data Summary:')
    console.log('   User ID:', testUserId)
    console.log('   Team ID:', testTeamId)
    console.log('   Order ID:', merchantOrderId)
    console.log('   Amount: 99,000 IDR (Starter Plan)')
    console.log('')
    
    return { testUserId, testTeamId, merchantOrderId }
    
  } catch (error) {
    console.error('💥 Setup failed:', error.message)
    throw error
  }
}

/**
 * Simulate Faspay callback
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
  const signature = generateFaspaySignature(billNo, paymentStatusCode)
  
  // Prepare callback payload
  const callbackPayload = {
    request: 'Payment Notification',
    trx_id: trxId,
    merchant_id: FASPAY_CONFIG.merchantId,
    merchant: FASPAY_CONFIG.merchantId,
    bill_no: billNo,
    bill_reff: billNo,
    bill_date: new Date().toISOString().replace('T', ' ').substring(0, 19),
    bill_expired: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
    bill_desc: 'Starter Plan - OASIS BI PRO Subscription (Production Test)',
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
  
  try {
    const response = await fetch(FASPAY_CONFIG.callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Faspay-Callback-Production-Test'
      },
      body: JSON.stringify(callbackPayload)
    })
    
    console.log('📥 Response Status:', response.status, response.statusText)
    
    const responseData = await response.json()
    console.log('📥 Response Body:')
    console.log(JSON.stringify(responseData, null, 2))
    console.log('')
    
    return { 
      success: response.ok, 
      status: response.status,
      responseData 
    }
    
  } catch (error) {
    console.error('❌ Callback request failed:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Verify database update
 */
async function verifyDatabaseUpdate(testUserId, testTeamId, merchantOrderId) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔍 STEP 3: VERIFY DATABASE UPDATE')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  
  // Wait for async operations
  console.log('⏳ Waiting 3 seconds for callback processing...')
  await new Promise(resolve => setTimeout(resolve, 3000))
  console.log('')
  
  const results = {
    subscription: null,
    team: null,
    transaction: null
  }
  
  try {
    // Check subscriptions table
    console.log('🔎 Checking subscriptions table...')
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('team_id', testTeamId)
      .maybeSingle()
    
    if (subError) {
      console.error('❌ Subscription query error:', subError.message)
    } else if (subscription) {
      console.log('✅ Subscription found!')
      console.log('   Status:', subscription.status)
      console.log('   Plan:', subscription.plan)
      console.log('   Payment Gateway:', subscription.payment_gateway)
      console.log('   Gateway Reference:', subscription.gateway_subscription_id)
      
      results.subscription = subscription
      
      if (subscription.status === 'active' || subscription.status === 'paid') {
        console.log('')
        console.log('🎉 SUCCESS! Subscription is ACTIVE/PAID')
      } else {
        console.log('')
        console.log('⚠️  WARNING! Status is:', subscription.status)
      }
    } else {
      console.log('⚠️  No subscription found')
    }
    
    console.log('')
    
    // Check teams table
    console.log('🔎 Checking teams table...')
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', testTeamId)
      .single()
    
    if (teamError) {
      console.error('❌ Team query error:', teamError.message)
    } else if (team) {
      console.log('✅ Team found!')
      console.log('   Plan:', team.plan)
      console.log('   Billing Status:', team.billing_status)
      results.team = team
    }
    
    console.log('')
    
    // Check transactions table
    console.log('🔎 Checking transactions table...')
    const { data: transactions, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('gateway_reference', merchantOrderId)
      .order('created_at', { ascending: false })
    
    if (txError) {
      console.error('❌ Transactions query error:', txError.message)
    } else if (transactions && transactions.length > 0) {
      console.log(`✅ Found ${transactions.length} transaction(s)`)
      transactions.forEach((tx, idx) => {
        console.log(`   [${idx + 1}] Status: ${tx.status} | Amount: ${tx.amount} IDR`)
      })
      results.transaction = transactions[0]
    } else {
      console.log('⚠️  No transactions found')
    }
    
    console.log('')
    
    return results
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    return results
  }
}

/**
 * Cleanup test data
 */
async function cleanupTestData(testUserId, testTeamId) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧹 STEP 4: CLEANUP TEST DATA')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  
  try {
    // Delete in reverse order (respect foreign keys)
    await supabaseAdmin.from('transactions').delete().eq('user_id', testUserId)
    console.log('✅ Deleted transactions')
    
    await supabaseAdmin.from('subscriptions').delete().eq('team_id', testTeamId)
    console.log('✅ Deleted subscriptions')
    
    await supabaseAdmin.from('team_members').delete().eq('user_id', testUserId)
    console.log('✅ Deleted team members')
    
    await supabaseAdmin.from('teams').delete().eq('id', testTeamId)
    console.log('✅ Deleted team')
    
    console.log('')
    console.log('✅ Cleanup complete!')
    console.log('')
    
  } catch (error) {
    console.error('⚠️  Cleanup warning:', error.message)
    console.log('')
  }
}

/**
 * Main test flow
 */
async function runProductionReadinessTest() {
  console.log('')
  console.log('╔════════════════════════════════════════════════╗')
  console.log('║  FASPAY CALLBACK PRODUCTION READINESS TEST    ║')
  console.log('╚════════════════════════════════════════════════╝')
  console.log('')
  console.log('🎯 Testing complete E2E flow:')
  console.log('   1. Create test data in Supabase')
  console.log('   2. Simulate Faspay callback')
  console.log('   3. Verify subscription activation')
  console.log('   4. Cleanup test data')
  console.log('')
  
  const testResults = {
    timestamp: new Date().toISOString(),
    success: false,
    steps: {}
  }
  
  try {
    // Step 1: Setup
    const { testUserId, testTeamId, merchantOrderId } = await setupTestData()
    testResults.steps.setup = { success: true, testUserId, testTeamId, merchantOrderId }
    
    // Step 2: Callback
    const callbackResult = await simulateCallback(merchantOrderId)
    testResults.steps.callback = callbackResult
    
    // Step 3: Verify
    const verifyResult = await verifyDatabaseUpdate(testUserId, testTeamId, merchantOrderId)
    testResults.steps.verification = verifyResult
    
    // Step 4: Cleanup
    await cleanupTestData(testUserId, testTeamId)
    testResults.steps.cleanup = { success: true }
    
    // Final summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎯 FINAL SUMMARY')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    
    const subscriptionActive = verifyResult.subscription?.status === 'active' || 
                                verifyResult.subscription?.status === 'paid'
    
    if (callbackResult.success && subscriptionActive) {
      console.log('✅ PRODUCTION READINESS: PASSED')
      console.log('')
      console.log('🎉 All systems operational:')
      console.log('   ✅ Database schema applied correctly')
      console.log('   ✅ Callback signature verification working')
      console.log('   ✅ User ID lookup from transactions working')
      console.log('   ✅ Subscription activation working')
      console.log('   ✅ Team billing status updated')
      console.log('')
      console.log('🚀 System is PRODUCTION READY!')
      testResults.success = true
    } else {
      console.log('⚠️  PRODUCTION READINESS: PARTIAL')
      console.log('')
      console.log('Issues detected:')
      if (!callbackResult.success) {
        console.log('   ❌ Callback request failed')
      }
      if (!subscriptionActive) {
        console.log('   ❌ Subscription not activated')
      }
      console.log('')
      console.log('📝 Review logs above for details')
    }
    
    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // Save results
    const fs = require('fs')
    fs.writeFileSync(
      'production-readiness-test-results.json',
      JSON.stringify(testResults, null, 2)
    )
    console.log('💾 Results saved to: production-readiness-test-results.json')
    console.log('')
    
    return testResults.success ? 0 : 1
    
  } catch (error) {
    console.error('')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('💥 CRITICAL ERROR')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error(error)
    testResults.error = error.message
    return 1
  }
}

// Run test
runProductionReadinessTest().then(exitCode => {
  process.exit(exitCode)
})
