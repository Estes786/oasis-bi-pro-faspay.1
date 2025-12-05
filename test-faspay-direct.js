/**
 * TEST FASPAY API DIRECTLY
 * Purpose: Test direct connection to Faspay Sandbox API
 */

const crypto = require('crypto')
require('dotenv').config({ path: '.env.local' })

const FASPAY_CONFIG = {
  merchantId: process.env.FASPAY_MERCHANT_ID || '36619',
  password: process.env.FASPAY_PASSWORD_KEY || 'p@ssw0rd',
  userId: process.env.FASPAY_USER_ID || 'bot36619',
  partnerId: process.env.FASPAY_PARTNER_ID || '36619',
  channelId: process.env.FASPAY_CHANNEL_ID || '77001',
  baseUrl: process.env.FASPAY_BASE_URL || 'https://debit-sandbox.faspay.co.id/api',
}

function generateSnapSignature(httpMethod, endpointUrl, requestBody, timestamp) {
  const minifiedBody = JSON.stringify(requestBody)
  const bodyHash = crypto
    .createHash('sha256')
    .update(minifiedBody)
    .digest('hex')
    .toLowerCase()
  
  const stringToSign = `${httpMethod}:${endpointUrl}:${bodyHash}:${timestamp}`
  
  const signature = crypto
    .createHmac('sha512', FASPAY_CONFIG.password)
    .update(stringToSign)
    .digest('base64')
  
  return { signature, bodyHash, stringToSign }
}

async function testFaspayVACreation() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧪 TESTING FASPAY SNAP VA CREATION')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  const timestamp = new Date().toISOString()
  const externalId = Date.now().toString() + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')
  
  const requestBody = {
    virtualAccountName: 'Test Customer',
    virtualAccountEmail: 'test@example.com',
    virtualAccountPhone: '08123456789',
    trxId: `TEST-${Date.now()}`,
    totalAmount: {
      value: '99000.00',
      currency: 'IDR'
    },
    expiredDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    additionalInfo: {
      billDate: timestamp,
      channelCode: '402',
      billDescription: 'Test Transaction'
    }
  }
  
  const endpoint = '/v1.0/transfer-va/create-va'
  const { signature, bodyHash, stringToSign } = generateSnapSignature('POST', endpoint, requestBody, timestamp)
  
  console.log('\n📋 Request Details:')
  console.log('   URL:', `${FASPAY_CONFIG.baseUrl}${endpoint}`)
  console.log('   Method: POST')
  console.log('   Timestamp:', timestamp)
  console.log('   External ID:', externalId)
  console.log('   Body Hash:', bodyHash)
  console.log('   String to Sign:', stringToSign)
  console.log('   Signature:', signature.substring(0, 50) + '...')
  
  const headers = {
    'Content-Type': 'application/json',
    'X-TIMESTAMP': timestamp,
    'X-SIGNATURE': signature,
    'ORIGIN': 'www.oasis-bi-pro.web.id',
    'X-PARTNER-ID': FASPAY_CONFIG.partnerId,
    'X-EXTERNAL-ID': externalId,
    'CHANNEL-ID': FASPAY_CONFIG.channelId
  }
  
  console.log('\n📤 Sending request to Faspay...')
  
  try {
    const response = await fetch(`${FASPAY_CONFIG.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })
    
    console.log('\n📥 Response Status:', response.status, response.statusText)
    console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()))
    
    const contentType = response.headers.get('content-type')
    console.log('📥 Content-Type:', contentType)
    
    const responseText = await response.text()
    console.log('\n📥 Response Body (first 500 chars):')
    console.log(responseText.substring(0, 500))
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const result = JSON.parse(responseText)
        console.log('\n✅ JSON Response:', JSON.stringify(result, null, 2))
      } catch (e) {
        console.log('\n❌ Failed to parse as JSON')
      }
    } else {
      console.log('\n⚠️  Response is NOT JSON (likely HTML error page)')
      console.log('\n📄 Full Response:')
      console.log(responseText)
    }
    
  } catch (error) {
    console.error('\n❌ Request failed:', error)
  }
}

testFaspayVACreation()
