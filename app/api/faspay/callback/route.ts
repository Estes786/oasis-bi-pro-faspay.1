/**
 * FASPAY PAYMENT CALLBACK HANDLER
 * POST /api/faspay/callback
 * 
 * Purpose: Receive payment notification from Faspay
 * This webhook is called by Faspay when payment status changes
 * 
 * IMPORTANT: This is for OUR subscription billing only
 * 
 * SECURITY: Signature verification using SHA1(MD5(credentials))
 * DATABASE: Automatic Supabase update on successful payment
 * 
 * DUAL FORMAT SUPPORT:
 * 1. Legacy Debit API (JSON with signature SHA1-MD5)
 * 2. SNAP Payment Notification (with X-SIGNATURE header)
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyFaspayLegacyCallback, FASPAY_STATUS } from '@/lib/faspay'
import { 
  updateSubscriptionAfterPayment, 
  getUserIdFromTransaction 
} from '@/lib/subscription-service'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Parse callback data from Faspay
    const body = await request.json()
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔔 FASPAY CALLBACK RECEIVED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📦 Full Payload:', body)
    console.log('   Timestamp:', new Date().toISOString())

    // Check if this is Legacy Debit API format or SNAP format
    const isLegacyFormat = body.hasOwnProperty('bill_no')
    
    console.log('📋 Format Detection:', isLegacyFormat ? 'Legacy Debit API' : 'SNAP Payment')

    let billNo: string
    let merchantOrderId: string
    let amount: string | number
    let paymentStatusCode: string
    let signature: string
    let reference: string
    let merchantUserId: string | undefined

    if (isLegacyFormat) {
      // LEGACY DEBIT API FORMAT
      billNo = body.bill_no
      merchantOrderId = billNo
      amount = body.bill_total
      paymentStatusCode = body.payment_status_code
      signature = body.signature
      reference = body.payment_reff || body.trx_id
      
      console.log('📋 Legacy Format Data:')
      console.log('   Bill No:', billNo)
      console.log('   Amount:', amount)
      console.log('   Status Code:', paymentStatusCode)
      console.log('   Reference:', reference)
      
      // STEP 1: Verify signature (CRITICAL SECURITY CHECK)
      const isValid = verifyFaspayLegacyCallback(billNo, paymentStatusCode, signature)
      
      if (!isValid) {
        console.error('❌ SIGNATURE VERIFICATION FAILED!')
        console.error('Expected signature mismatch - possible fraud attempt')
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid signature' 
          },
          { status: 401 }
        )
      }
      
      console.log('✅ Signature verified successfully')
      
    } else {
      // SNAP FORMAT
      billNo = body.virtualAccountNo || body.merchantOrderId
      merchantOrderId = body.merchantOrderId || billNo
      amount = body.paidAmount?.value || body.totalAmount?.value || '0'
      paymentStatusCode = body.paymentFlagStatus || '1' // Assume pending if not specified
      reference = body.paymentRequestId || body.referenceNo || ''
      
      console.log('📋 SNAP Format Data:')
      console.log('   Virtual Account No:', billNo)
      console.log('   Merchant Order ID:', merchantOrderId)
      console.log('   Amount:', amount)
      console.log('   Status:', paymentStatusCode)
      console.log('   Reference:', reference)
      
      // TODO: Verify X-SIGNATURE header for SNAP format
      // For now, we accept SNAP notifications without signature verification
      // In production, you MUST verify the X-SIGNATURE header
      console.log('⚠️ SNAP signature verification not implemented yet')
    }

    // STEP 2: Extract plan ID from merchant order ID
    // Format: OASIS-{PLAN}-{TIMESTAMP}-{RANDOM}
    const planMatch = merchantOrderId.match(/OASIS-([A-Z]+)-/i)
    const planId = planMatch ? planMatch[1].toLowerCase() : 'starter'
    
    console.log('📋 Extracted Plan ID:', planId)

    // STEP 3: Get user ID from transaction record or body
    const userId = merchantUserId || await getUserIdFromTransaction(merchantOrderId)
    
    if (!userId) {
      console.error('❌ User ID not found for order:', merchantOrderId)
      // Still return 200 to avoid Faspay retry loop
      return NextResponse.json({
        success: false,
        error: 'User ID not found',
        message: 'Will process manually'
      })
    }
    
    console.log('👤 User ID:', userId)

    // STEP 4: Process payment based on status code
    // CRITICAL: '2' = SUCCESS for Legacy API, '00' = SUCCESS for SNAP
    const isSuccess = paymentStatusCode === FASPAY_STATUS.SUCCESS || paymentStatusCode === '00'
    const isPending = paymentStatusCode === FASPAY_STATUS.IN_PROCESS || paymentStatusCode === '01'
    const isExpired = paymentStatusCode === FASPAY_STATUS.EXPIRED || paymentStatusCode === '02'
    const isCancelled = paymentStatusCode === FASPAY_STATUS.CANCELLED || paymentStatusCode === '03'
    
    if (isSuccess) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('💰 PAYMENT SUCCESS - Processing subscription activation')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      // Update subscription in Supabase
      const result = await updateSubscriptionAfterPayment({
        userId,
        planId,
        merchantOrderId,
        amount: parseFloat(amount.toString()),
        faspayReference: reference,
        status: 'active'
      })
      
      if (result.success) {
        console.log('✅ Subscription activated successfully!')
        console.log('   - Team ID:', result.teamId)
        console.log('   - Plan:', planId)
        console.log('   - Amount:', amount, 'IDR')
        console.log('   - Reference:', reference)
      } else {
        console.error('❌ Subscription activation failed:', result.error)
      }
      
    } else if (isPending) {
      console.log('⏳ Payment PENDING:', merchantOrderId)
      
      await updateSubscriptionAfterPayment({
        userId,
        planId,
        merchantOrderId,
        amount: parseFloat(amount.toString()),
        faspayReference: reference,
        status: 'pending'
      })
      
    } else if (isExpired) {
      console.log('⏰ Payment EXPIRED/FAILED:', merchantOrderId)
      
      await updateSubscriptionAfterPayment({
        userId,
        planId,
        merchantOrderId,
        amount: parseFloat(amount.toString()),
        faspayReference: reference,
        status: 'expired'
      })
      
    } else if (isCancelled) {
      console.log('❌ Payment CANCELLED:', merchantOrderId)
      
      await updateSubscriptionAfterPayment({
        userId,
        planId,
        merchantOrderId,
        amount: parseFloat(amount.toString()),
        faspayReference: reference,
        status: 'cancelled'
      })
    } else {
      console.log('⚠️ Unknown status code:', paymentStatusCode)
    }

    const processingTime = Date.now() - startTime
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ CALLBACK PROCESSED SUCCESSFULLY')
    console.log(`⏱️  Processing time: ${processingTime}ms`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // IMPORTANT: Always return 200 to Faspay
    // Prepare response based on format
    if (isLegacyFormat) {
      return NextResponse.json({
        response: 'Payment Notification',
        trx_id: body.trx_id,
        merchant_id: body.merchant_id,
        bill_no: billNo,
        response_code: '00',
        response_desc: 'Success',
        response_date: new Date().toISOString(),
      })
    } else {
      return NextResponse.json({
        responseCode: '2002500',
        responseMessage: 'Success',
        virtualAccountData: {
          partnerServiceId: body.partnerServiceId,
          customerNo: body.customerNo,
          virtualAccountNo: body.virtualAccountNo,
          paymentRequestId: reference,
          paidAmount: body.paidAmount
        }
      })
    }

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('💥 CALLBACK PROCESSING ERROR')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error(error)
    console.error(`⏱️  Failed after: ${processingTime}ms`)
    
    // IMPORTANT: Still return 200 to Faspay to avoid retry loops
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal error',
        message: 'Error logged, will investigate manually',
        processingTime: `${processingTime}ms`
      },
      { status: 200 }
    )
  }
}

// GET endpoint for testing callback URL
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Faspay Callback Endpoint',
    status: 'Active',
    timestamp: new Date().toISOString(),
    note: 'This endpoint receives POST requests from Faspay payment gateway',
    formats: ['Legacy Debit API (JSON)', 'SNAP Payment Notification'],
  })
}
