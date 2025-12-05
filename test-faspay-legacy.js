/**
 * TEST FASPAY LEGACY DEBIT API
 */

const crypto = require('crypto')
require('dotenv').config({ path: '.env.local' })

const FASPAY_CONFIG = {
  merchantId: process.env.FASPAY_MERCHANT_ID || '36619',
  password: process.env.FASPAY_PASSWORD_KEY || 'p@ssw0rd',
  userId: process.env.FASPAY_USER_ID || 'bot36619',
  baseUrl: process.env.FASPAY_BASE_URL || 'https://debit-sandbox.faspay.co.id/api',
}

async function testLegacyDebitAPI() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧪 TESTING FASPAY LEGACY DEBIT API')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  const merchantOrderId = `TEST-${Date.now()}`
  const amount = 99000
  const customerName = 'Test Customer'
  const phoneNumber = '08123456789'
  
  // Generate expiry (24 hours)
  const expiredDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const formattedExpiry = expiredDate.toISOString().replace('T', ' ').substring(0, 19)
  const billDate = new Date().toISOString().replace('T', ' ').substring(0, 19)
  
  // Generate signature: SHA1(MD5(merchantId + password + bill_no))
  const signatureString = `${FASPAY_CONFIG.merchantId}${FASPAY_CONFIG.password}${merchantOrderId}`
  const md5Hash = crypto.createHash('md5').update(signatureString).digest('hex')
  const signature = crypto.createHash('sha1').update(md5Hash).digest('hex')
  
  const requestBody = {
    request: 'Informasi Tagihan',
    merchant_id: FASPAY_CONFIG.merchantId,
    merchant: FASPAY_CONFIG.merchantId,
    bill_no: merchantOrderId,
    bill_reff: merchantOrderId,
    bill_date: billDate,
    bill_expired: formattedExpiry,
    bill_desc: 'Test Transaction - OASIS BI PRO',
    bill_currency: 'IDR',
    bill_gross: amount,
    bill_miscfee: 0,
    bill_total: amount,
    cust_no: phoneNumber,
    cust_name: customerName,
    payment_channel: '402', // Permata VA
    pay_type: '1', // Closed Payment
    bank_userid: FASPAY_CONFIG.userId,
    signature: signature,
  }
  
  console.log('\n📋 Request Details:')
  console.log('   Endpoint: /cvr/300011/10')
  console.log('   Bill No:', merchantOrderId)
  console.log('   Amount:', amount)
  console.log('   Signature String:', signatureString)
  console.log('   MD5 Hash:', md5Hash)
  console.log('   Signature:', signature)
  
  console.log('\n📤 Request Body:')
  console.log(JSON.stringify(requestBody, null, 2))
  
  const url = `${FASPAY_CONFIG.baseUrl}/cvr/300011/10`
  console.log('\n📤 Sending to:', url)
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    
    console.log('\n📥 Response Status:', response.status)
    console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()))
    
    const contentType = response.headers.get('content-type')
    console.log('📥 Content-Type:', contentType)
    
    if (contentType && contentType.includes('application/json')) {
      const result = await response.json()
      console.log('\n✅ JSON Response:')
      console.log(JSON.stringify(result, null, 2))
      
      if (result.response_code === '00') {
        console.log('\n✅ SUCCESS!')
        console.log('   VA Number:', result.bill_no)
        console.log('   Redirect URL:', result.redirect_url)
        console.log('   Transaction ID:', result.trx_id)
      } else {
        console.log('\n❌ FAILED:', result.response_desc)
      }
    } else {
      const text = await response.text()
      console.log('\n❌ Response is NOT JSON:')
      console.log(text.substring(0, 500))
    }
    
  } catch (error) {
    console.error('\n❌ Request failed:', error)
  }
}

testLegacyDebitAPI()
