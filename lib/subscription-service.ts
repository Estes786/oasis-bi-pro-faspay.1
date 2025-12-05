/**
 * SUBSCRIPTION SERVICE
 * Handles all subscription-related database operations
 */

import { supabaseAdmin } from './supabase-client'

export interface SubscriptionUpdateData {
  userId: string
  planId: string
  merchantOrderId: string
  amount: number
  faspayReference: string
  status: 'active' | 'pending' | 'expired' | 'cancelled'
}

/**
 * Update or create subscription after successful payment
 */
export async function updateSubscriptionAfterPayment(data: SubscriptionUpdateData) {
  try {
    console.log('🔄 Starting subscription update:', data)
    
    // 1. Get user's team
    const { data: teamMember, error: teamError } = await supabaseAdmin
      .from('team_members')
      .select('team_id')
      .eq('user_id', data.userId)
      .single()
    
    if (teamError) {
      console.error('❌ Team lookup error:', teamError)
      throw new Error(`Team not found for user ${data.userId}`)
    }
    
    const teamId = teamMember.team_id
    console.log('✅ Found team:', teamId)
    
    // 2. Calculate subscription dates
    const now = new Date()
    const periodStart = now
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1) // 1 month subscription
    
    // 3. Update or insert subscription
    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('team_id', teamId)
      .single()
    
    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          plan: data.planId,
          status: data.status,
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
          payment_gateway: 'faspay',
          gateway_subscription_id: data.faspayReference,
          updated_at: now.toISOString(),
        })
        .eq('id', existingSubscription.id)
      
      if (updateError) {
        console.error('❌ Subscription update error:', updateError)
        throw updateError
      }
      
      console.log('✅ Subscription updated:', existingSubscription.id)
    } else {
      // Create new subscription
      const { error: insertError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          team_id: teamId,
          plan: data.planId,
          status: data.status,
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
          payment_gateway: 'faspay',
          gateway_subscription_id: data.faspayReference,
        })
      
      if (insertError) {
        console.error('❌ Subscription insert error:', insertError)
        throw insertError
      }
      
      console.log('✅ New subscription created')
    }
    
    // 4. Update team plan
    const { error: teamUpdateError } = await supabaseAdmin
      .from('teams')
      .update({
        plan: data.planId,
        billing_status: data.status,
        updated_at: now.toISOString(),
      })
      .eq('id', teamId)
    
    if (teamUpdateError) {
      console.error('❌ Team update error:', teamUpdateError)
      throw teamUpdateError
    }
    
    console.log('✅ Team plan updated')
    
    // 5. Log transaction
    const { error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: data.userId,
        amount: data.amount,
        currency: 'IDR',
        status: data.status === 'active' ? 'completed' : data.status,
        payment_method: 'faspay',
        payment_gateway: 'faspay',
        gateway_reference: data.faspayReference,
        metadata: {
          merchant_order_id: data.merchantOrderId,
          plan_id: data.planId,
        }
      })
    
    if (txError) {
      console.error('⚠️ Transaction log error (non-critical):', txError)
      // Don't throw - transaction logging is non-critical
    } else {
      console.log('✅ Transaction logged')
    }
    
    return {
      success: true,
      message: 'Subscription updated successfully',
      teamId,
    }
    
  } catch (error) {
    console.error('❌ Subscription update failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Create pending transaction record
 */
export async function createPendingTransaction(data: {
  userId: string
  merchantOrderId: string
  amount: number
  planId: string
}) {
  try {
    const { error } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: data.userId,
        amount: data.amount,
        currency: 'IDR',
        status: 'pending',
        payment_method: 'faspay',
        payment_gateway: 'faspay',
        gateway_reference: data.merchantOrderId,
        metadata: {
          merchant_order_id: data.merchantOrderId,
          plan_id: data.planId,
        }
      })
    
    if (error) {
      console.error('⚠️ Pending transaction creation error:', error)
      // Non-critical, don't throw
    } else {
      console.log('✅ Pending transaction created:', data.merchantOrderId)
    }
    
    return { success: true }
  } catch (error) {
    console.error('⚠️ Transaction creation failed:', error)
    return { success: false }
  }
}

/**
 * Get user ID from merchant order ID
 * Format: OASIS-{PLAN}-{TIMESTAMP}-{RANDOM}
 * 
 * FALLBACK: If transactions table doesn't exist, try to get first admin user from teams
 */
export async function getUserIdFromTransaction(merchantOrderId: string) {
  try {
    // Try to get from transactions table first
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('user_id')
      .eq('gateway_reference', merchantOrderId)
      .single()
    
    if (data && !error) {
      console.log('✅ User ID found from transactions:', data.user_id)
      return data.user_id
    }
    
    console.log('⚠️ Transaction not found, trying fallback method...')
    console.log('   Error:', error?.message || 'No data')
    
    // FALLBACK: Get first team owner/admin
    // This is a workaround when transactions table doesn't exist
    const { data: teamMember, error: teamError } = await supabaseAdmin
      .from('team_members')
      .select('user_id, role')
      .eq('role', 'admin')
      .limit(1)
      .single()
    
    if (teamMember && !teamError) {
      console.log('✅ Using fallback: First admin user ID:', teamMember.user_id)
      console.log('⚠️ WARNING: This is a fallback solution!')
      console.log('   Recommended: Add transactions table to database schema')
      return teamMember.user_id
    }
    
    console.error('❌ All user ID lookup methods failed')
    console.error('   Transactions error:', error)
    console.error('   Team members error:', teamError)
    
    return null
  } catch (error) {
    console.error('❌ User ID extraction error:', error)
    return null
  }
}
