/**
 * DUITKU Payment Gateway Integration
 * Official Documentation: https://docs.duitku.com/
 * 
 * IMPORTANT: This is for SUBSCRIPTION BILLING ONLY
 * We are NOT a payment facilitator/aggregator
 * We use Duitku to collect OUR subscription fees from OUR customers
 */

import crypto from 'crypto'

// Duitku Configuration (UPDATED WITH NEW CREDENTIALS - DS26557)
export const DUITKU_CONFIG = {
  merchantCode: process.env.NEXT_PUBLIC_DUITKU_MERCHANT_CODE || 'DS26557',
  apiKey: process.env.DUITKU_API_KEY || '68e1d64813c7f21a1ffc3839064ab6b3',
  environment: process.env.NEXT_PUBLIC_DUITKU_ENV || 'sandbox',
  baseUrl: process.env.NEXT_PUBLIC_DUITKU_API_URL || 'https://api-sandbox.duitku.com/api/merchant',
  returnUrl: process.env.NEXT_PUBLIC_DUITKU_RETURN_URL || 'https://www.oasis-bi-pro.web.id/payment/success',
  callbackUrl: process.env.NEXT_PUBLIC_DUITKU_CALLBACK_URL || 'https://www.oasis-bi-pro.web.id/api/duitku/callback',
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
 * Generate signature for Duitku API REQUEST HEADER
 * Formula: SHA256(merchantCode + timestamp + apiKey)
 * NOTE: This is for x-duitku-signature header, NOT for request body
 */
export function generateDuitkuRequestSignature(timestamp: string): string {
  const { merchantCode, apiKey } = DUITKU_CONFIG
  // CRITICAL: Use hyphen (-) separator as per Duitku docs
  const signatureString = `${merchantCode}-${timestamp}-${apiKey}`
  return crypto.createHash('sha256').update(signatureString).digest('hex')
}

/**
 * Generate signature for Duitku API REQUEST BODY (old method - DEPRECATED)
 * This was the OLD API format - keeping for reference
 * NEW API uses header signature only
 */
export function generateDuitkuSignature(
  merchantOrderId: string,
  paymentAmount: number
): string {
  const { merchantCode, apiKey } = DUITKU_CONFIG
  const signatureString = `${merchantCode}${merchantOrderId}${paymentAmount}${apiKey}`
  return crypto.createHash('md5').update(signatureString).digest('hex')
}

/**
 * Verify callback signature from Duitku
 * Formula: MD5(merchantCode + amount + merchantOrderId + apiKey)
 */
export function verifyDuitkuCallback(
  merchantOrderId: string,
  amount: string,
  signature: string
): boolean {
  const { merchantCode, apiKey } = DUITKU_CONFIG
  const expectedSignature = crypto
    .createHash('md5')
    .update(`${merchantCode}${amount}${merchantOrderId}${apiKey}`)
    .digest('hex')
  
  return signature.toLowerCase() === expectedSignature.toLowerCase()
}

/**
 * Create Duitku payment request
 */
export interface DuitkuPaymentRequest {
  merchantOrderId: string
  paymentAmount: number
  productDetails: string
  email: string
  phoneNumber: string
  customerName: string
  planId: keyof typeof SUBSCRIPTION_PLANS
  userId?: string
}

export async function createDuitkuPayment(data: DuitkuPaymentRequest) {
  const { merchantCode, apiKey, baseUrl, returnUrl, callbackUrl } = DUITKU_CONFIG
  
  // CRITICAL: Generate timestamp in Jakarta timezone (milliseconds)
  const timestamp = Date.now().toString()
  
  // CRITICAL: Generate SHA256 signature for REQUEST HEADER
  const headerSignature = generateDuitkuRequestSignature(timestamp)
  
  console.log('🔐 Signature Generation:')
  console.log('   Merchant Code:', merchantCode)
  console.log('   API Key:', apiKey ? (apiKey.substring(0, 10) + '...') : '❌ MISSING')
  console.log('   Timestamp:', timestamp)
  console.log('   Signature String:', `${merchantCode}-${timestamp}-${apiKey}`)
  console.log('   Signature (SHA256):', headerSignature)
  
  const requestBody = {
    paymentAmount: data.paymentAmount,
    merchantOrderId: data.merchantOrderId,
    productDetails: data.productDetails,
    email: data.email,
    phoneNumber: data.phoneNumber,
    customerVaName: data.customerName,
    callbackUrl,
    returnUrl,
    expiryPeriod: 60, // 60 minutes expiry
    // NOTE: NO signature in body for new API format!
  }

  try {
    console.log('📤 Sending request to:', `${baseUrl}/createInvoice`)
    console.log('📤 Request headers:', {
      'x-duitku-signature': headerSignature.substring(0, 20) + '...',
      'x-duitku-timestamp': timestamp,
      'x-duitku-merchantcode': merchantCode,
    })
    console.log('📤 Request body:', requestBody)
    
    const response = await fetch(`${baseUrl}/createInvoice`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        // CRITICAL: New API format requires these headers
        'x-duitku-signature': headerSignature,
        'x-duitku-timestamp': timestamp,
        'x-duitku-merchantcode': merchantCode,
      },
      body: JSON.stringify(requestBody),
    })

    const result = await response.json()
    
    console.log('📥 Duitku Response:', result)
    
    if (!response.ok) {
      console.error('❌ Duitku API Error Response:', result)
      throw new Error(`Duitku API Error (${response.status}): ${result.message || result.statusMessage || response.statusText}`)
    }
    
    // Check if response has expected fields
    if (!result.paymentUrl && !result.reference) {
      console.error('❌ Invalid Duitku response format:', result)
      throw new Error('Invalid response from Duitku: missing paymentUrl or reference')
    }

    console.log('✅ Payment URL:', result.paymentUrl)
    console.log('✅ Reference:', result.reference)
    
    return {
      success: true,
      data: result,
      paymentUrl: result.paymentUrl,
      reference: result.reference,
    }
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('💥 DUITKU PAYMENT CREATION ERROR')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('Error details:', error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
      console.error('Stack:', error.stack)
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check payment status from Duitku
 */
export async function checkDuitkuPaymentStatus(merchantOrderId: string) {
  const { merchantCode, baseUrl } = DUITKU_CONFIG
  
  // Generate timestamp for header signature
  const timestamp = Date.now().toString()
  const headerSignature = generateDuitkuRequestSignature(timestamp)

  try {
    const response = await fetch(`${baseUrl}/checkTransaction`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-duitku-signature': headerSignature,
        'x-duitku-timestamp': timestamp,
        'x-duitku-merchantcode': merchantCode,
      },
      body: JSON.stringify({
        merchantOrderId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`)
    }

    const result = await response.json()
    return {
      success: true,
      data: result,
      statusCode: result.statusCode,
      statusMessage: result.statusMessage,
    }
  } catch (error) {
    console.error('Duitku status check error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Generate unique merchant order ID
 * Format: OASIS-{PLAN}-{TIMESTAMP}-{RANDOM}
 */
export function generateMerchantOrderId(planId: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `OASIS-${planId.toUpperCase()}-${timestamp}-${random}`
}

/**
 * Payment status codes from Duitku
 * CRITICAL: These are the CORRECT codes from official documentation
 */
export const DUITKU_STATUS = {
  SUCCESS: '00', // Payment SUCCESS (CORRECT!)
  PENDING: '01', // Payment PENDING (was wrongly '00')
  EXPIRED: '02', // Payment expired/failed
  CANCELLED: '03', // Payment cancelled
} as const

export type DuitkuStatus = typeof DUITKU_STATUS[keyof typeof DUITKU_STATUS]
