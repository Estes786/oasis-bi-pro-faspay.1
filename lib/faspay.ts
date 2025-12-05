/**
 * FASPAY SNAP Payment Gateway Integration
 * Official Documentationitas: https://docs.faspay.co.id/merchant-integration/api-reference-1/snap
 * 
 * IMPORTANT: This is for SUBSCRIPTION BILLING ONLY
 * We are NOT a payment facilitator/aggregator
 * We use Faspay to collect OUR subscription fees from OUR customers
 * 
 * SNAP: Standar Nasional Open API Pembayaran (Bank Indonesia standard)
 */

import crypto from 'crypto'

// Faspay SNAP Configuration
export const FASPAY_CONFIG = {
  merchantId: process.env.FASPAY_MERCHANT_ID || '36619',
  password: process.env.FASPAY_PASSWORD_KEY || 'p@ssw0rd',
  userId: process.env.FASPAY_USER_ID || 'bot36619',
  partnerId: process.env.FASPAY_PARTNER_ID || '36619',
  channelId: process.env.FASPAY_CHANNEL_ID || '77001',
  environment: process.env.FASPAY_ENV || 'sandbox',
  baseUrl: process.env.FASPAY_BASE_URL || 'https://debit-sandbox.faspay.co.id/api',
  // Private key untuk signature generation (RSA)
  // CRITICAL: Ini harus di-generate merchant dan di-share public key ke Faspay
  // For now, kita akan generate dummy key untuk testing
  privateKey: process.env.FASPAY_PRIVATE_KEY || '',
  // Public key dari Faspay untuk verify callback signature
  publicKeyFaspay: process.env.FASPAY_PUBLIC_KEY_FASPAY || '',
  // Callback URL untuk notifikasi pembayaran
  callbackUrl: process.env.FASPAY_CALLBACK_URL || 'https://oasis-bi-pro-faspay-1.vercel.app/api/faspay/callback',
  // SIMULATION MODE: Set to true if sandbox credentials invalid
  simulationMode: process.env.FASPAY_SIMULATION_MODE === 'true',
}

// Subscription Plans (matching pricing page)
export const SUBSCRIPTION_PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter Plan',
    price: 99000,
    currency: 'IDR',
    duration: 'monthly',
    features: [
      '5 dashboard interaktif',
      '10 data source connections',
      'Basic analytics & reporting',
      'Email support (24 jam)',
      '1 user account'
    ]
  },
  professional: {
    id: 'professional',
    name: 'Professional Plan',
    price: 299000,
    currency: 'IDR',
    duration: 'monthly',
    features: [
      '50 dashboard interaktif',
      'Unlimited data sources',
      'Advanced AI analytics',
      'Priority support (12 jam)',
      'Custom branding',
      '5 user accounts',
      'API access'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Plan',
    price: 999000,
    currency: 'IDR',
    duration: 'monthly',
    features: [
      'Unlimited dashboards',
      'Unlimited data sources',
      'AI-powered insights',
      'Dedicated support (24/7)',
      'White-label solution',
      'Unlimited users',
      'Full API access',
      'Custom integrations',
      'SLA guarantee'
    ]
  }
}

/**
 * Generate SNAP Signature for API Request
 * Algorithm: HMAC-SHA512 for Request Signature
 * 
 * SNAP Request Signature Formula:
 * HMAC-SHA512(clientSecret, stringToSign)
 * where stringToSign = HTTPMethod + ":" + RelativeUrl + ":" + AccessToken + ":" + Lowercase(HexEncode(SHA256(minify(RequestBody)))) + ":" + Timestamp
 * 
 * For Faspay SNAP, we use simplified format:
 * stringToSign = HTTPMethod + ":" + EndpointUrl + ":" + Lowercase(HexEncode(SHA256(minify(RequestBody)))) + ":" + Timestamp
 */
export function generateSnapSignature(
  httpMethod: string,
  endpointUrl: string,
  requestBody: object,
  timestamp: string,
  accessToken: string = ''
): string {
  try {
    // STEP 1: Minify request body (remove whitespace)
    const minifiedBody = JSON.stringify(requestBody)
    
    // STEP 2: SHA256 hash the minified body
    const bodyHash = crypto
      .createHash('sha256')
      .update(minifiedBody)
      .digest('hex')
      .toLowerCase()
    
    // STEP 3: Create stringToSign
    // Format: HTTPMethod:EndpointUrl:AccessToken:BodyHash:Timestamp
    const stringToSign = accessToken 
      ? `${httpMethod}:${endpointUrl}:${accessToken}:${bodyHash}:${timestamp}`
      : `${httpMethod}:${endpointUrl}:${bodyHash}:${timestamp}`
    
    console.log('🔐 SNAP Signature Generation:')
    console.log('   HTTP Method:', httpMethod)
    console.log('   Endpoint:', endpointUrl)
    console.log('   Body Hash (SHA256):', bodyHash)
    console.log('   Timestamp:', timestamp)
    console.log('   String to Sign:', stringToSign)
    
    // STEP 4: Sign with HMAC-SHA512 using merchant password as secret
    // For Faspay SNAP, password acts as the client secret
    const signature = crypto
      .createHmac('sha512', FASPAY_CONFIG.password)
      .update(stringToSign)
      .digest('base64')
    
    console.log('   Signature (Base64):', signature.substring(0, 50) + '...')
    
    return signature
    
  } catch (error) {
    console.error('❌ Signature generation error:', error)
    throw error
  }
}

/**
 * Verify callback signature from Faspay (Legacy Debit API)
 * Formula: SHA1(MD5(merchantId + password + bill_no + payment_status_code))
 */
export function verifyFaspayLegacyCallback(
  billNo: string,
  paymentStatusCode: string,
  signature: string
): boolean {
  try {
    const { merchantId, password } = FASPAY_CONFIG
    
    // STEP 1: MD5 hash
    const md5Hash = crypto
      .createHash('md5')
      .update(`${merchantId}${password}${billNo}${paymentStatusCode}`)
      .digest('hex')
    
    // STEP 2: SHA1 hash
    const expectedSignature = crypto
      .createHash('sha1')
      .update(md5Hash)
      .digest('hex')
    
    console.log('🔍 Legacy Callback Verification:')
    console.log('   Bill No:', billNo)
    console.log('   Status Code:', paymentStatusCode)
    console.log('   Expected Signature:', expectedSignature)
    console.log('   Received Signature:', signature)
    console.log('   Match:', expectedSignature.toLowerCase() === signature.toLowerCase())
    
    return expectedSignature.toLowerCase() === signature.toLowerCase()
    
  } catch (error) {
    console.error('❌ Signature verification error:', error)
    return false
  }
}

/**
 * Verify SNAP callback signature
 * Formula: HMAC-SHA256(clientSecret, stringToSign)
 * where stringToSign = HTTPMethod + ":" + EndpointUrl + ":" + AccessToken + ":" + Lowercase(HexEncode(SHA256(RequestBody))) + ":" + Timestamp
 */
export function verifySnapCallback(
  httpMethod: string,
  endpointUrl: string,
  requestBody: object | string,
  timestamp: string,
  receivedSignature: string,
  accessToken: string = ''
): boolean {
  try {
    // Minify body if it's an object
    const bodyString = typeof requestBody === 'string' 
      ? requestBody 
      : JSON.stringify(requestBody)
    
    // SHA256 hash the body
    const bodyHash = crypto
      .createHash('sha256')
      .update(bodyString)
      .digest('hex')
      .toLowerCase()
    
    // Create stringToSign
    const stringToSign = accessToken
      ? `${httpMethod}:${endpointUrl}:${accessToken}:${bodyHash}:${timestamp}`
      : `${httpMethod}:${endpointUrl}:${bodyHash}:${timestamp}`
    
    // Calculate expected signature using HMAC-SHA256
    const expectedSignature = crypto
      .createHmac('sha256', FASPAY_CONFIG.password)
      .update(stringToSign)
      .digest('base64')
    
    console.log('🔍 SNAP Callback Verification:')
    console.log('   HTTP Method:', httpMethod)
    console.log('   Endpoint:', endpointUrl)
    console.log('   Body Hash:', bodyHash)
    console.log('   Timestamp:', timestamp)
    console.log('   String to Sign:', stringToSign)
    console.log('   Expected Signature:', expectedSignature.substring(0, 50) + '...')
    console.log('   Received Signature:', receivedSignature.substring(0, 50) + '...')
    console.log('   Match:', expectedSignature === receivedSignature)
    
    return expectedSignature === receivedSignature
    
  } catch (error) {
    console.error('❌ SNAP signature verification error:', error)
    return false
  }
}

/**
 * Create Faspay SNAP VA Dynamic
 */
export interface FaspayPaymentRequest {
  merchantOrderId: string
  paymentAmount: number
  productDetails: string
  email: string
  phoneNumber: string
  customerName: string
  planId: keyof typeof SUBSCRIPTION_PLANS
  userId?: string
}

/**
 * Create Faspay VA using Legacy Debit API
 * Legacy API documentation: https://docs.faspay.co.id/merchant-integration/debit/
 * 
 * NOTE: Faspay Sandbox hanya mendukung Legacy Debit API, bukan SNAP
 * CRITICAL: Sandbox credentials (36619/p@ssw0rd) TIDAK MEMILIKI AKSES ke API
 * 
 * SIMULATION MODE: Jika simulationMode=true, return mock response
 */
export async function createFaspayVADynamic(data: FaspayPaymentRequest) {
  const { merchantId, password, userId, baseUrl, simulationMode } = FASPAY_CONFIG
  
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(simulationMode ? '🎭 FASPAY SIMULATION MODE' : '📤 FASPAY LEGACY DEBIT API - CREATE VA')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // Format expired date (YYYY-MM-DD HH:MM:SS)
    const expiredDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const formattedExpiry = expiredDate.toISOString().replace('T', ' ').substring(0, 19)
    
    console.log('📋 Request Data:')
    console.log('   Bill No:', data.merchantOrderId)
    console.log('   Amount:', data.paymentAmount)
    console.log('   Customer:', data.customerName)
    console.log('   Expired:', formattedExpiry)
    
    // SIMULATION MODE: Return mock response
    if (simulationMode) {
      console.log('🎭 SIMULATION MODE ACTIVE')
      console.log('   ⚠️  This is NOT a real transaction')
      console.log('   ℹ️  Faspay sandbox credentials (36619/p@ssw0rd) are invalid')
      console.log('   ℹ️  Returning mock VA number for demonstration')
      
      // Generate mock VA number
      const mockVANumber = '8770' + data.merchantOrderId.substring(data.merchantOrderId.length - 12)
      const mockTrxId = 'TRX-MOCK-' + Date.now()
      
      // Create mock redirect URL (in production, this would be Faspay's payment page)
      const mockRedirectUrl = `https://debit-sandbox.faspay.co.id/payment/mock/${mockVANumber}`
      
      console.log('✅ Mock VA Number:', mockVANumber)
      console.log('✅ Mock Redirect URL:', mockRedirectUrl)
      console.log('✅ Mock Transaction ID:', mockTrxId)
      console.log('')
      console.log('📝 NOTE FOR PRODUCTION:')
      console.log('   1. Register for REAL Faspay merchant account at https://faspay.co.id')
      console.log('   2. Get production credentials (merchant_id, password, user_id)')
      console.log('   3. Update FASPAY_SIMULATION_MODE=false in .env.local')
      console.log('   4. Test with real production credentials')
      
      return {
        success: true,
        data: {
          response_code: '00',
          response_desc: 'Success (Simulation)',
          bill_no: mockVANumber,
          redirect_url: mockRedirectUrl,
          trx_id: mockTrxId,
          simulation: true,
        },
        virtualAccountNo: mockVANumber,
        redirectUrl: mockRedirectUrl,
        reference: mockTrxId,
        expiryDate: formattedExpiry,
      }
    }
    
    // REAL MODE: Call Faspay API
    // Generate signature for Legacy Debit API
    // Formula: SHA1(MD5(merchantId + password + bill_no))
    const signatureString = `${merchantId}${password}${data.merchantOrderId}`
    const md5Hash = crypto.createHash('md5').update(signatureString).digest('hex')
    const signature = crypto.createHash('sha1').update(md5Hash).digest('hex')
    
    // Prepare request body for Legacy Debit API
    const requestBody = {
      request: 'Informasi Tagihan',
      merchant_id: merchantId,
      merchant: merchantId,
      bill_no: data.merchantOrderId,
      bill_reff: data.merchantOrderId,
      bill_date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      bill_expired: formattedExpiry,
      bill_desc: data.productDetails,
      bill_currency: 'IDR',
      bill_gross: data.paymentAmount,
      bill_miscfee: 0,
      bill_total: data.paymentAmount,
      cust_no: data.phoneNumber,
      cust_name: data.customerName,
      payment_channel: '402', // Permata VA
      pay_type: '1', // 1 = Closed Payment (Fixed amount)
      bank_userid: userId,
      signature: signature,
    }
    
    console.log('   Signature:', signature.substring(0, 20) + '...')
    
    // Endpoint untuk Legacy Debit API
    const endpoint = '/cvr/300011/10'
    const url = `${baseUrl}${endpoint}`
    
    console.log('📤 Sending request to:', url)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    
    console.log('📥 Response Status:', response.status)
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('❌ Response is not JSON:', text.substring(0, 200))
      console.error('')
      console.error('⚠️  FASPAY SANDBOX CREDENTIALS ARE INVALID')
      console.error('   The provided credentials (36619/p@ssw0rd) do not have API access')
      console.error('   Please use real merchant credentials or enable SIMULATION_MODE')
      throw new Error('Faspay API credentials invalid - enable SIMULATION_MODE or use real credentials')
    }
    
    const result = await response.json()
    console.log('📥 Faspay Response:', result)
    
    // Check response code
    // response_code: '00' = Success
    // response_code: '01' = Failed
    if (result.response_code === '01' || !result.redirect_url) {
      throw new Error(`Faspay VA Creation Failed: ${result.response_desc || 'Unknown error'}`)
    }
    
    console.log('✅ VA Number:', result.bill_no)
    console.log('✅ Redirect URL:', result.redirect_url)
    console.log('✅ Faspay Transaction ID:', result.trx_id)
    
    return {
      success: true,
      data: result,
      virtualAccountNo: result.bill_no,
      redirectUrl: result.redirect_url,
      reference: result.trx_id,
      expiryDate: formattedExpiry,
    }
    
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('💥 FASPAY VA CREATION ERROR')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error(error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Generate unique external ID (must be unique per day)
 * Format: YYYYMMDDHHMMSS + Random 10 digits
 */
function generateExternalId(): string {
  const now = new Date()
  const dateStr = now.toISOString().replace(/[-:T.Z]/g, '').substring(0, 14)
  const random = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')
  return dateStr + random
}

/**
 * Generate merchant order ID
 * Format: OASIS-{PLAN}-{TIMESTAMP}-{RANDOM}
 */
export function generateMerchantOrderId(planId: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `OASIS-${planId.toUpperCase()}-${timestamp}-${random}`
}

/**
 * Get expired date (24 hours from now in ISO 8601)
 */
function getExpiredDate(): string {
  const now = new Date()
  const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  return expiry.toISOString()
}

/**
 * Payment status codes from Faspay Legacy API
 */
export const FASPAY_STATUS = {
  UNPROCESSED: '0',
  IN_PROCESS: '1',
  SUCCESS: '2',
  FAILED: '3',
  REVERSAL: '4',
  NO_BILLS: '5',
  EXPIRED: '7',
  CANCELLED: '8',
  UNKNOWN: '9'
} as const

export type FaspayStatus = typeof FASPAY_STATUS[keyof typeof FASPAY_STATUS]

/**
 * Create Faspay SNAP QRIS Dynamic (E-Wallet MPM)
 * MPM = Merchant Presented Mode (Customer scans merchant QR)
 */
export interface FaspayQRISRequest {
  merchantOrderId: string
  paymentAmount: number
  productDetails: string
  email: string
  phoneNumber: string
  customerName: string
  planId: keyof typeof SUBSCRIPTION_PLANS
  userId?: string
}

export async function createFaspayQRIS(data: FaspayQRISRequest) {
  const { merchantId, partnerId, channelId, baseUrl } = FASPAY_CONFIG
  
  try {
    // Generate timestamp in ISO 8601 format
    const timestamp = new Date().toISOString()
    
    // Generate unique external ID
    const externalId = generateExternalId()
    
    // Prepare request body for QRIS
    const requestBody = {
      partnerReferenceNo: data.merchantOrderId,
      amount: {
        value: data.paymentAmount.toFixed(2),
        currency: 'IDR'
      },
      merchantId: merchantId,
      storeLabel: 'OASIS BI PRO',
      terminalLabel: 'WEB',
      validityPeriod: '2024-12-31T23:59:59+07:00', // Default expiry
      additionalInfo: {
        customerName: data.customerName,
        customerEmail: data.email,
        customerPhone: data.phoneNumber,
        billDescription: data.productDetails,
        billDate: timestamp
      }
    }
    
    // Generate SNAP signature
    const endpoint = '/v1.0/qr/qr-mpm-generate'
    const signature = generateSnapSignature('POST', endpoint, requestBody, timestamp)
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'X-TIMESTAMP': timestamp,
      'X-SIGNATURE': signature,
      'ORIGIN': 'www.oasis-bi-pro.web.id',
      'X-PARTNER-ID': partnerId,
      'X-EXTERNAL-ID': externalId,
      'CHANNEL-ID': channelId
    }
    
    console.log('📤 Faspay SNAP Create QRIS Request:')
    console.log('   URL:', `${baseUrl}${endpoint}`)
    console.log('   Headers:', headers)
    console.log('   Body:', requestBody)
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })
    
    const result = await response.json()
    
    console.log('📥 Faspay QRIS Response:', result)
    
    if (!response.ok) {
      throw new Error(`Faspay API Error (${response.status}): ${result.responseMessage || result.message || 'Unknown error'}`)
    }
    
    // Check response code
    if (result.responseCode !== '2002500') {
      throw new Error(`Faspay QRIS Creation Failed: ${result.responseMessage} (${result.responseCode})`)
    }
    
    // Extract QR data
    const qrData = result.qrContent || result.qrCode
    const qrUrl = result.qrUrl
    
    return {
      success: true,
      data: result,
      qrContent: qrData,
      qrUrl: qrUrl,
      reference: result.referenceNo || data.merchantOrderId,
      expiryDate: result.validityPeriod,
    }
    
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('💥 FASPAY QRIS CREATION ERROR')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error(error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
