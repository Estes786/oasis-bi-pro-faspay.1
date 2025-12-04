/**
 * FASPAY SNAP CHECKOUT API ROUTE
 * POST /api/faspay/checkout
 * 
 * Purpose: Create VA Dynamic payment request to Faspay for SUBSCRIPTION BILLING ONLY
 * This is NOT for processing third-party payments
 * We are collecting OUR subscription fees from OUR customers
 * 
 * SNAP: Standar Nasional Open API Pembayaran (Bank Indonesia)
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  createFaspayVADynamic, 
  generateMerchantOrderId,
  SUBSCRIPTION_PLANS,
  type FaspayPaymentRequest 
} from '@/lib/faspay'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { planId, email, phoneNumber, customerName, userId } = body
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🛒 FASPAY CHECKOUT REQUEST RECEIVED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📦 Request data:', { planId, email, phoneNumber, customerName, userId })
    
    if (!planId || !email || !phoneNumber || !customerName) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: planId, email, phoneNumber, customerName' 
        },
        { status: 400 }
      )
    }

    // Validate plan exists
    if (!SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS]) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid plan ID: ${planId}` 
        },
        { status: 400 }
      )
    }

    const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS]
    console.log('✅ Plan validated:', plan.name, '-', plan.price, 'IDR')
    
    // Generate unique order ID
    const merchantOrderId = generateMerchantOrderId(planId)
    console.log('🔑 Generated Order ID:', merchantOrderId)
    
    // Create payment request
    const paymentRequest: FaspayPaymentRequest = {
      merchantOrderId,
      paymentAmount: plan.price,
      productDetails: `${plan.name} - OASIS BI PRO Subscription`,
      email,
      phoneNumber,
      customerName,
      planId: planId as keyof typeof SUBSCRIPTION_PLANS,
      userId: userId || undefined,
    }

    console.log('📤 Calling Faspay SNAP API...')
    
    // Call Faspay SNAP API
    const result = await createFaspayVADynamic(paymentRequest)
    
    if (!result.success) {
      console.error('❌ Faspay API call failed:', result.error)
      return NextResponse.json(
        { 
          success: false, 
          error: result.error 
        },
        { status: 500 }
      )
    }

    console.log('✅ VA Number generated:', result.virtualAccountNo)
    console.log('✅ Redirect URL:', result.redirectUrl)
    console.log('✅ Faspay Reference:', result.reference)
    
    // Create pending transaction in database (if userId provided)
    if (userId) {
      try {
        console.log('🔄 Attempting to create pending transaction...')
        
        // Verify Supabase environment variables
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        
        if (!supabaseUrl || !supabaseServiceKey) {
          console.error('❌ CRITICAL: Missing Supabase credentials!')
          console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
          console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing')
          throw new Error('Missing Supabase environment variables')
        }
        
        console.log('✅ Supabase credentials verified')
        
        const { createPendingTransaction } = await import('@/lib/subscription-service')
        await createPendingTransaction({
          userId,
          merchantOrderId,
          amount: plan.price,
          planId
        })
        console.log('✅ Pending transaction created in database')
      } catch (dbError) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.error('⚠️ DATABASE ERROR (NON-BLOCKING)')
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.error('   Error:', dbError)
        console.error('   Context: Failed to create pending transaction')
        console.error('   Impact: Payment will proceed, but transaction not logged')
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        // Don't fail the checkout - just log the error
      }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ FASPAY CHECKOUT COMPLETED SUCCESSFULLY')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Return VA info and redirect URL
    return NextResponse.json({
      success: true,
      data: {
        virtualAccountNo: result.virtualAccountNo,
        redirectUrl: result.redirectUrl,
        reference: result.reference,
        merchantOrderId,
        amount: plan.price,
        planName: plan.name,
        expiryDate: result.expiryDate,
      }
    })

  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('💥 CHECKOUT ERROR')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error(error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  )
}
