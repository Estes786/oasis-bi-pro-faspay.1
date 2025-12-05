#!/usr/bin/env node
/**
 * SIMPLE FASPAY CALLBACK TEST
 * Test callback endpoint dengan signature yang valid
 */

const crypto = require('crypto')

const FASPAY_CONFIG = {
  merchantId: '36619',
  password: 'p@ssw0rd',
  callbackUrl: 'https://oasis-bi-pro-faspay-1.vercel.app/api/faspay/callback'
}

/**
 * Generate Faspay Legacy Signature
 * Formula: SHA1(MD5(merchantId + password + bill_no + payment_status_code))
 */
function generateSignature(billNo, statusCode) {
  const { merchantId, password } = FASPAY_CONFIG
  
  const md5Hash = crypto
    .createHash('md5')
    .update(`${merchantId}${password}${billNo}${statusCode}`)
    .digest('hex')
  
  const signature = crypto
    .createHash('sha1')
    .update(md5Hash)
    .digest('hex')
  
  console.log('🔐 Signature Generation:')
  console.log('   Input:', `${merchantId}${password}${billNo}${statusCode}`)
  console.log('   MD5:', md5Hash)
  console.log('   SHA1:', signature)
  console.log('')
  
  return signature
}

async function testCallback() {
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧪 SIMPLE FASPAY CALLBACK TEST')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  
  // Test data
  const billNo = 'OASIS-STARTER-' + Date.now() + '-TEST'
  const statusCode = '2' // SUCCESS
  const amount = '99000'
  
  console.log('📋 Test Data:')
  console.log('   Bill No:', billNo)
  console.log('   Amount:', amount)
  console.log('   Status:', statusCode, '(SUCCESS)')
  console.log('')
  
  // Generate signature
  const signature = generateSignature(billNo, statusCode)
  
  // Prepare payload
  const payload = {
    request: 'Payment Notification',
    trx_id: 'TRX-' + Date.now(),
    merchant_id: FASPAY_CONFIG.merchantId,
    merchant: FASPAY_CONFIG.merchantId,
    bill_no: billNo,
    bill_reff: billNo,
    bill_date: new Date().toISOString().replace('T', ' ').substring(0, 19),
    bill_expired: new Date(Date.now() + 24*60*60*1000).toISOString().replace('T', ' ').substring(0, 19),
    bill_desc: 'Starter Plan - OASIS BI PRO',
    bill_currency: 'IDR',
    bill_gross: amount,
    bill_miscfee: '0',
    bill_total: amount,
    payment_channel: '402',
    payment_channel_name: 'Permata VA',
    payment_status_code: statusCode,
    payment_status_desc: 'Payment Success',
    payment_date: new Date().toISOString().replace('T', ' ').substring(0, 19),
    payment_reff: 'REF-' + Date.now(),
    signature: signature
  }
  
  console.log('📤 Sending callback to:', FASPAY_CONFIG.callbackUrl)
  console.log('')
  
  try {
    const response = await fetch(FASPAY_CONFIG.callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Faspay-Test'
      },
      body: JSON.stringify(payload)
    })
    
    const responseData = await response.json()
    
    console.log('📥 Response Status:', response.status)
    console.log('📥 Response Body:')
    console.log(JSON.stringify(responseData, null, 2))
    console.log('')
    
    if (response.ok) {
      console.log('✅ Callback accepted by server')
      
      // Check for specific error messages
      if (responseData.error === 'User ID not found') {
        console.log('')
        console.log('⚠️  DIAGNOSIS: User ID not found')
        console.log('   Root Cause: Transaction record tidak ditemukan di database')
        console.log('   - Callback handler mencari user_id dari tabel transactions')
        console.log('   - Tabel transactions mungkin tidak ada atau kosong')
        console.log('')
        console.log('🔧 SOLUTION REQUIRED:')
        console.log('   1. Add transactions table to database schema')
        console.log('   2. Create transaction record saat checkout')
        console.log('   3. Alternative: Pass user_id dalam callback payload')
      } else if (responseData.success) {
        console.log('✅ Callback processed successfully!')
      }
    } else {
      console.log('❌ Callback rejected:', response.status)
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message)
  }
  
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎯 TEST COMPLETE')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
}

testCallback()
