# FASPAY CALLBACK FIX GUIDE

## 🔍 DIAGNOSIS COMPLETE

### Test Results (December 5, 2025)

✅ **Signature Verification**: PASSED
- Formula `SHA1(MD5(36619 + p@ssw0rd + bill_no + 2))` works correctly
- Callback endpoint accepts and verifies signatures properly

❌ **Database Update**: FAILED
- Root Cause: Missing `transactions` table in Supabase schema
- Callback cannot find `user_id` because it looks up from transactions table
- Current schema only has: `user_profiles`, `teams`, `team_members`, `subscriptions`, `daily_metrics`

## 🔧 SOLUTION: Add Transactions Table

### Step 1: Apply SQL Migration to Supabase

**Location**: `migrations/add_transactions_table.sql`

1. Login to Supabase Dashboard
2. Go to SQL Editor: https://supabase.com/dashboard/project/ifvusvcmcxytwcokbzje/sql/new
3. Copy and paste the SQL from `migrations/add_transactions_table.sql`
4. Click "Run"

**SQL Content**:
```sql
-- Add transactions table for payment tracking
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'IDR',
  status TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  payment_gateway TEXT NOT NULL,
  gateway_reference TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_gateway_reference ON transactions(gateway_reference);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
```

### Step 2: Update Checkout Flow

**File**: `app/api/faspay/checkout/route.ts`

Ensure that checkout creates a pending transaction record:

```typescript
// After VA creation, before returning response
await createPendingTransaction({
  userId: user.id,
  merchantOrderId: merchantOrderId,
  amount: plan.price,
  planId: planId
})
```

### Step 3: Verify Fix

Run the E2E test again:

```bash
node test-callback-simple.js
```

Expected output:
```
✅ Callback accepted by server
✅ Callback processed successfully!
✅ Subscription status updated to: active
```

## 🧪 Test Scripts Created

### 1. `test-callback-simple.js`
Simple callback test with valid signature:
```bash
node test-callback-simple.js
```

### 2. `test-faspay-callback-e2e.js`
Full E2E test with database setup:
```bash
node test-faspay-callback-e2e.js
```

## 📊 Current Test Results

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 SIMPLE FASPAY CALLBACK TEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Test Data:
   Bill No: OASIS-STARTER-1764950848845-TEST
   Amount: 99000
   Status: 2 (SUCCESS)

🔐 Signature Generation:
   Input: 36619p@ssw0rdOASIS-STARTER-1764950848845-TEST2
   MD5: e6c2c37baead01f2a5cb970c05020f4f
   SHA1: 7600e239ce97257092430624c5d6490d5655fde6

📥 Response Status: 200
📥 Response Body:
{
  "success": false,
  "error": "User ID not found",
  "message": "Will process manually"
}

⚠️  DIAGNOSIS: User ID not found
   Root Cause: Transaction record tidak ditemukan di database
```

## 🎯 Next Steps

1. **Apply SQL migration** to add transactions table
2. **Update checkout flow** to create transaction records
3. **Re-test callback** with the test script
4. **Verify database** shows updated subscription status
5. **Commit changes** to Git with message: `FIX: E2E Callback Verified & DB Update Fixed`

## 📝 Files Modified/Created

1. ✅ `migrations/add_transactions_table.sql` - SQL migration
2. ✅ `test-callback-simple.js` - Simple callback test
3. ✅ `test-faspay-callback-e2e.js` - Full E2E test
4. ✅ `CALLBACK_FIX_GUIDE.md` - This documentation

## 🔐 Signature Formula Verified

```
SHA1(MD5(merchant_id + password + bill_no + payment_status_code))
```

Example:
```
merchant_id: 36619
password: p@ssw0rd
bill_no: OASIS-STARTER-1764950848845-TEST
status_code: 2

MD5 Input: 36619p@ssw0rdOASIS-STARTER-1764950848845-TEST2
MD5 Output: e6c2c37baead01f2a5cb970c05020f4f

SHA1 Input: e6c2c37baead01f2a5cb970c05020f4f
SHA1 Output: 7600e239ce97257092430624c5d6490d5655fde6
```

✅ Formula is **CORRECT** and working!

---

**Status**: Ready for SQL migration and re-testing
**Date**: December 5, 2025
**Test Mode**: Production endpoint (https://oasis-bi-pro-faspay-1.vercel.app)
