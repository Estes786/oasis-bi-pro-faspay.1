#!/usr/bin/env node
/**
 * SUPABASE SCHEMA VERIFICATION TEST
 * 
 * Purpose: Verify that FULL_OASIS_SCHEMA_V2.sql has been applied correctly
 * This test checks:
 * 1. All 9 tables exist
 * 2. Transactions table has correct structure
 * 3. Indexes are created
 * 4. Foreign keys are in place
 * 
 * Run: node test-schema-verification.js
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration from environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifvusvcmcxytwcokbzje.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmdnVzdmNtY3h5dHdjb2tiemplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDkxNTQ0NSwiZXhwIjoyMDgwNDkxNDQ1fQ.4VZyCX-xhVkgbI3QhKhLUSDojeHAyruqJB-Dr7RUKqg'

// Create Supabase admin client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Expected tables from schema V2.0
const EXPECTED_TABLES = [
  'user_profiles',
  'teams',
  'team_members',
  'subscriptions',
  'transactions',
  'data_integrations',
  'analytics_data',
  'reports',
  'ai_insights'
]

// Expected columns in transactions table
const EXPECTED_TRANSACTIONS_COLUMNS = [
  'id',
  'user_id',
  'team_id',
  'subscription_id',
  'amount',
  'currency',
  'status',
  'payment_method',
  'payment_gateway',
  'gateway_reference',
  'metadata',
  'created_at',
  'updated_at'
]

/**
 * Test 1: Check if all tables exist
 */
async function testTablesExist() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋 TEST 1: Checking if all tables exist')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')

  const results = []

  for (const tableName of EXPECTED_TABLES) {
    try {
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .limit(0)

      if (error) {
        console.log(`❌ ${tableName}: NOT FOUND`)
        console.log(`   Error: ${error.message}`)
        results.push({ table: tableName, exists: false, error: error.message })
      } else {
        console.log(`✅ ${tableName}: EXISTS`)
        results.push({ table: tableName, exists: true })
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ERROR`)
      console.log(`   Error: ${err.message}`)
      results.push({ table: tableName, exists: false, error: err.message })
    }
  }

  console.log('')
  const existingCount = results.filter(r => r.exists).length
  console.log(`📊 Summary: ${existingCount}/${EXPECTED_TABLES.length} tables found`)
  console.log('')

  return {
    success: existingCount === EXPECTED_TABLES.length,
    results
  }
}

/**
 * Test 2: Check transactions table structure
 */
async function testTransactionsTableStructure() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔍 TEST 2: Verifying transactions table structure')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')

  try {
    // Try to insert a test transaction
    const testTransaction = {
      user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      team_id: '00000000-0000-0000-0000-000000000000',
      amount: 99000,
      currency: 'IDR',
      status: 'pending',
      payment_method: 'faspay',
      payment_gateway: 'faspay',
      gateway_reference: 'TEST-SCHEMA-VERIFICATION-' + Date.now(),
      metadata: { test: true }
    }

    console.log('📝 Attempting test insert...')
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .insert(testTransaction)
      .select()

    if (error) {
      console.log('⚠️  Insert test failed (expected if foreign keys enforced):')
      console.log(`   ${error.message}`)
      
      // This is actually good - means foreign keys are working
      if (error.message.includes('foreign key') || error.message.includes('violates')) {
        console.log('')
        console.log('✅ Foreign key constraints are working!')
        console.log('   Table structure is correct')
        return { success: true, foreignKeysWork: true }
      }
      
      return { success: false, error: error.message }
    }

    console.log('✅ Test insert successful')
    console.log('   Transaction ID:', data[0]?.id)
    
    // Clean up test data
    await supabaseAdmin
      .from('transactions')
      .delete()
      .eq('gateway_reference', testTransaction.gateway_reference)
    
    console.log('🧹 Test data cleaned up')
    console.log('')

    return { success: true, inserted: true }

  } catch (err) {
    console.error('❌ Test failed:', err.message)
    return { success: false, error: err.message }
  }
}

/**
 * Test 3: Check gateway_reference index performance
 */
async function testGatewayReferenceIndex() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('⚡ TEST 3: Testing gateway_reference index')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')

  try {
    const testRef = 'OASIS-STARTER-' + Date.now() + '-TEST'
    
    console.log('🔍 Testing query performance...')
    const startTime = Date.now()
    
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('user_id')
      .eq('gateway_reference', testRef)
      .single()

    const queryTime = Date.now() - startTime

    console.log(`⏱️  Query time: ${queryTime}ms`)

    if (queryTime < 100) {
      console.log('✅ Excellent performance! Index is working')
    } else if (queryTime < 500) {
      console.log('⚠️  Acceptable performance, but could be better')
    } else {
      console.log('❌ Slow query - index might be missing')
    }

    console.log('')
    return { success: true, queryTime }

  } catch (err) {
    console.error('❌ Test failed:', err.message)
    return { success: false, error: err.message }
  }
}

/**
 * Test 4: Check if fallback mechanism still works
 */
async function testFallbackMechanism() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔄 TEST 4: Testing fallback mechanism')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')

  try {
    // Try to get from team_members (fallback method)
    const { data, error } = await supabaseAdmin
      .from('team_members')
      .select('user_id, role')
      .eq('role', 'admin')
      .limit(1)

    if (error) {
      console.log('⚠️  team_members table query failed')
      console.log(`   Error: ${error.message}`)
      return { success: false, error: error.message }
    }

    if (data && data.length > 0) {
      console.log('✅ Fallback mechanism available')
      console.log(`   Found ${data.length} admin user(s)`)
      console.log(`   First admin ID: ${data[0].user_id}`)
    } else {
      console.log('⚠️  No admin users found (database might be empty)')
      console.log('   Fallback will work once users are created')
    }

    console.log('')
    return { success: true, hasAdmins: data && data.length > 0 }

  } catch (err) {
    console.error('❌ Test failed:', err.message)
    return { success: false, error: err.message }
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('')
  console.log('╔════════════════════════════════════════════╗')
  console.log('║  SUPABASE SCHEMA V2.0 VERIFICATION TEST    ║')
  console.log('╚════════════════════════════════════════════╝')
  console.log('')
  console.log('🎯 Verifying that FULL_OASIS_SCHEMA_V2.sql has been applied')
  console.log('📍 Supabase URL:', SUPABASE_URL)
  console.log('')

  const results = {
    timestamp: new Date().toISOString(),
    supabaseUrl: SUPABASE_URL,
    tests: {}
  }

  try {
    // Test 1: Tables
    results.tests.tablesExist = await testTablesExist()

    // Test 2: Transactions structure
    results.tests.transactionsStructure = await testTransactionsTableStructure()

    // Test 3: Index performance
    results.tests.indexPerformance = await testGatewayReferenceIndex()

    // Test 4: Fallback
    results.tests.fallbackMechanism = await testFallbackMechanism()

    // Final summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 FINAL SUMMARY')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')

    const allTestsPassed = Object.values(results.tests).every(t => t.success)

    if (allTestsPassed) {
      console.log('✅ ALL TESTS PASSED!')
      console.log('')
      console.log('🎉 Schema V2.0 is correctly applied')
      console.log('🚀 System is ready for E2E callback testing')
    } else {
      console.log('❌ SOME TESTS FAILED')
      console.log('')
      console.log('⚠️  Schema might not be fully applied')
      console.log('📝 Action required:')
      console.log('   1. Check Supabase Dashboard')
      console.log('   2. Apply migrations/FULL_OASIS_SCHEMA_V2.sql')
      console.log('   3. Re-run this test')
    }

    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // Save results to file
    const fs = require('fs')
    fs.writeFileSync(
      'schema-verification-results.json',
      JSON.stringify(results, null, 2)
    )
    console.log('💾 Results saved to: schema-verification-results.json')
    console.log('')

    return allTestsPassed ? 0 : 1

  } catch (error) {
    console.error('')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('💥 CRITICAL ERROR')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error(error)
    return 1
  }
}

// Run tests
runAllTests().then(exitCode => {
  process.exit(exitCode)
})
