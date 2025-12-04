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
  merchantId: process.env.FASPAY_MERCHANT_ID || 'oasisbi',
  password: process.env.FASPAY_PASSWORD || '@Daqukemang4',
  partnerId: process.env.FASPAY_PARTNER_ID || 'oasisbi',
  channelId: process.env.FASPAY_CHANNEL_ID || '77001',
  environment: process.env.FASPAY_ENV || 'sandbox',
  baseUrl: process.env.FASPAY_BASE_URL || 'https://debit-sandbox.faspay.co.id',
  // Private key untuk signature generation (RSA)
  // CRITICAL: Ini harus di-generate merchant dan di-share public key ke Faspay
  // For now, kita akan generate dummy key untuk testing
  privateKey: process.env.FASPAY_PRIVATE_KEY || '',
  // Public key dari Faspay untuk verify callback signature
  publicKeyFaspay: process.env.FASPAY_PUBLIC_KEY_FASPAY || '',
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
 * Algorithm: SHA256withRSA(Private_Key, stringToSign)
 * 
 * Formula: HTTPMethod + ":" + EndpointUrl + ":" + Lowercase(HexEncode(SHA256(minify(RequestBody)))) + ":" + TimeStamp
 */
export function generateSnapSignature(
  httpMethod: string,
  endpointUrl: string,
  requestBody: object,
  timestamp: string
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
    const stringToSign = `${httpMethod}:${endpointUrl}:${bodyHash}:${timestamp}`
    
    console.log('🔐 SNAP Signature Generation:')
    console.log('   HTTP Method:', httpMethod)
    console.log('   Endpoint:', endpointUrl)
    console.log('   Body Hash (SHA256):', bodyHash)
    console.log('   Timestamp:', timestamp)
    console.log('   String to Sign:', stringToSign)
    
    // STEP 4: Sign with SHA256withRSA using private key
    // NOTE: For SNAP Sandbox without real RSA keys, we'll use simulated signature
    // In production, you MUST use real RSA private key
    
    if (!FASPAY_CONFIG.privateKey) {
      // FALLBACK: Generate deterministic signature for testing
      // CRITICAL: This is NOT secure! Only for sandbox testing without RSA setup
      console.warn('⚠️ WARNING: Using fallback signature (no RSA private key)')
      const fallbackSignature = crypto
        .createHash('sha256')
        .update(stringToSign + FASPAY_CONFIG.password)
        .digest('base64')
      
      return fallbackSignature
    }
    
    // PRODUCTION CODE: Use RSA private key
    const sign = crypto.createSign('RSA-SHA256')
    sign.update(stringToSign)
    sign.end()
    
    const signature = sign.sign(FASPAY_CONFIG.privateKey, 'base64')
    
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

export async function createFaspayVADynamic(data: FaspayPaymentRequest) {
  const { merchantId, partnerId, channelId, baseUrl } = FASPAY_CONFIG
  
  try {
    // Generate timestamp in ISO 8601 format
    const timestamp = new Date().toISOString()
    
    // Generate unique external ID (daily unique)
    const externalId = generateExternalId()
    
    // Prepare request body
    const requestBody = {
      virtualAccountName: data.customerName,
      virtualAccountEmail: data.email,
      virtualAccountPhone: data.phoneNumber,
      trxId: data.merchantOrderId,
      totalAmount: {
        value: data.paymentAmount.toFixed(2),
        currency: 'IDR'
      },
      expiredDate: getExpiredDate(),
      additionalInfo: {
        billDate: timestamp,
        channelCode: '402', // Permata VA Dynamic
        billDescription: data.productDetails
      }
    }
    
    // Generate SNAP signature
    const endpoint = '/v1.0/transfer-va/create-va'
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
    
    console.log('📤 Faspay SNAP Create VA Request:')
    console.log('   URL:', `${baseUrl}${endpoint}`)
    console.log('   Headers:', headers)
    console.log('   Body:', requestBody)
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })
    
    const result = await response.json()
    
    console.log('📥 Faspay Response:', result)
    
    if (!response.ok) {
      throw new Error(`Faspay API Error (${response.status}): ${result.responseMessage || result.message || 'Unknown error'}`)
    }
    
    // Check response code
    if (result.responseCode !== '2002500') {
      throw new Error(`Faspay VA Creation Failed: ${result.responseMessage} (${result.responseCode})`)
    }
    
    // Extract important data
    const vaData = result.virtualAccountData
    const redirectUrl = vaData.additionalInfo?.redirectUrl
    
    return {
      success: true,
      data: result,
      virtualAccountNo: vaData.virtualAccountNo,
      redirectUrl,
      reference: vaData.trxId,
      expiryDate: vaData.expiredDate,
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
