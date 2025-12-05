# 🎯 OASIS BI PRO - SCHEMA V2.0 MIGRATION GUIDE

**Date**: December 5, 2025  
**Version**: 2.0 (Unified Schema with Faspay Support)  
**Status**: ✅ READY FOR DEPLOYMENT

---

## 📋 EXECUTIVE SUMMARY

This guide provides complete instructions for applying the unified database schema V2.0 to your Supabase project. This schema includes **critical fixes for Faspay callback** functionality.

### ✅ What's New in V2.0

1. **Unified Schema**: Merged `001_initial_schema.sql` and `add_transactions_table.sql`
2. **Faspay Callback Support**: Proper `transactions` table with optimized indexes
3. **Enhanced Security**: Complete RLS policies on all tables
4. **Performance**: Optimized indexes for fast lookups
5. **Data Integrity**: Proper foreign key constraints
6. **Auto-Provisioning**: Automatic user/team creation on signup

---

## 🚀 QUICK START (3 Minutes)

### Step 1: Backup Current Data (RECOMMENDED)

If you have existing data in Supabase, export it first:

```bash
# Login to Supabase Dashboard
# Go to: Table Editor → Export → Download as CSV
```

### Step 2: Apply Schema to Supabase

1. **Open Supabase SQL Editor**:
   ```
   https://supabase.com/dashboard/project/ifvusvcmcxytwcokbzje/sql/new
   ```

2. **Copy Schema File**:
   - Open: `/home/user/webapp/migrations/FULL_OASIS_SCHEMA_V2.sql`
   - Copy entire contents (24,000+ characters)

3. **Paste and Run**:
   - Paste into SQL Editor
   - Click **"Run"** button
   - Wait 10-15 seconds for completion

4. **Verify Success**:
   ```sql
   -- Run this query to verify
   SELECT tablename FROM pg_tables 
   WHERE schemaname = 'public' 
   ORDER BY tablename;
   ```

   Expected output should include:
   - ✅ ai_insights
   - ✅ analytics_data
   - ✅ data_integrations
   - ✅ reports
   - ✅ subscriptions
   - ✅ team_members
   - ✅ teams
   - ✅ **transactions** ← CRITICAL for Faspay
   - ✅ user_profiles

### Step 3: Test Transactions Table

Run this query to confirm transactions table is ready:

```sql
-- Check transactions table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
ORDER BY ordinal_position;
```

Expected columns:
- ✅ id (UUID)
- ✅ user_id (UUID) - References auth.users
- ✅ team_id (UUID) - References teams
- ✅ subscription_id (UUID) - References subscriptions
- ✅ amount (NUMERIC)
- ✅ currency (TEXT)
- ✅ status (TEXT)
- ✅ payment_method (TEXT)
- ✅ payment_gateway (TEXT)
- ✅ **gateway_reference** (TEXT) ← Used by Faspay callback
- ✅ metadata (JSONB)
- ✅ created_at (TIMESTAMPTZ)
- ✅ updated_at (TIMESTAMPTZ)

---

## 🔍 SCHEMA DETAILS

### Tables Overview

| Table | Purpose | Rows (Est.) |
|-------|---------|-------------|
| **user_profiles** | Extended user info | 1 per user |
| **teams** | Organizations | 1 per user |
| **team_members** | Team membership | 1+ per team |
| **subscriptions** | Billing plans | 1 per team |
| **transactions** | Payment records | 1+ per payment |
| **data_integrations** | External sources | 0+ per team |
| **analytics_data** | Time-series metrics | 1000+ per team |
| **reports** | Generated exports | 0+ per team |
| **ai_insights** | AI recommendations | 0+ per team |

### Critical Indexes for Faspay

```sql
-- These indexes are CRITICAL for callback performance
idx_transactions_gateway_reference  -- Fast lookup by merchant_order_id
idx_transactions_user_id            -- Fast user lookup
idx_transactions_team_id            -- Fast team lookup
idx_transactions_status             -- Filter by status
idx_transactions_payment_gateway    -- Filter by gateway
```

### Foreign Key Relationships

```
auth.users (Supabase Auth)
    ↓
user_profiles (1:1)
    ↓
teams (1:many via ownership)
    ↓
team_members (many:many)
    ↓
subscriptions (1:1 per team)
    ↓
transactions (1:many per user/team)
```

---

## 🔧 TROUBLESHOOTING

### Issue 1: "DROP TABLE permission denied"

**Cause**: Schema file has `DROP TABLE` statements (for clean slate)

**Solution**: Comment out DROP statements if you want to preserve data:
```sql
-- DROP TABLE IF EXISTS transactions CASCADE; -- COMMENTED OUT
```

### Issue 2: "Foreign key constraint violation"

**Cause**: Existing data doesn't match new constraints

**Solution**: 
1. Export data
2. Apply schema
3. Re-import with proper foreign keys

### Issue 3: "Table already exists"

**Cause**: Schema already partially applied

**Solution**: Use `IF NOT EXISTS` (already included in schema) or drop tables manually:
```sql
DROP TABLE IF EXISTS transactions CASCADE;
```

### Issue 4: Faspay callback still fails

**Verification**:
```sql
-- Check if transactions table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'transactions'
);
-- Should return: true
```

**Test Lookup**:
```sql
-- Test gateway_reference lookup (simulates Faspay callback)
EXPLAIN ANALYZE 
SELECT user_id FROM transactions 
WHERE gateway_reference = 'OASIS-STARTER-123456-ABC';
-- Should show index scan (fast)
```

---

## 🔐 SECURITY VALIDATION

### RLS Policies Applied

All tables have Row Level Security (RLS) enabled:

- ✅ **user_profiles**: Users can view/update own profile
- ✅ **teams**: Team members can view team
- ✅ **team_members**: Team members can view members
- ✅ **subscriptions**: Team members can view subscriptions
- ✅ **transactions**: Team members can view transactions
- ✅ **data_integrations**: Team admins can manage
- ✅ **analytics_data**: Team members can view
- ✅ **reports**: Team members can view/create
- ✅ **ai_insights**: Team members can view/update

### Service Role Key

Faspay callback uses `SUPABASE_SERVICE_ROLE_KEY` which **bypasses RLS**. This is necessary because:
- Callback comes from Faspay server (not user browser)
- No user auth.uid() available
- Needs direct database write access

**Security Note**: Service Role Key should only be used server-side!

---

## 🧪 TESTING CHECKLIST

After applying schema, verify each step:

- [ ] **Step 1**: All 9 tables created
  ```sql
  SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';
  -- Should return: 9
  ```

- [ ] **Step 2**: Transactions table has gateway_reference column
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'transactions' AND column_name = 'gateway_reference';
  -- Should return: gateway_reference
  ```

- [ ] **Step 3**: Indexes created (at least 30 indexes)
  ```sql
  SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';
  -- Should return: 30+
  ```

- [ ] **Step 4**: RLS enabled on all tables
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables 
  WHERE schemaname = 'public' AND rowsecurity = true;
  -- Should return: 9 tables
  ```

- [ ] **Step 5**: Triggers created (5 update triggers)
  ```sql
  SELECT COUNT(*) FROM pg_trigger 
  WHERE tgname LIKE 'update_%_updated_at';
  -- Should return: 5
  ```

- [ ] **Step 6**: Functions created
  ```sql
  SELECT proname FROM pg_proc 
  WHERE proname IN ('handle_new_user', 'seed_sample_analytics_data', 'update_updated_at_column');
  -- Should return: 3 functions
  ```

---

## 📊 POST-MIGRATION ACTIONS

### 1. Test User Signup Flow

Create a test user and verify auto-provisioning:

```sql
-- After creating user via Supabase Auth UI, check:
SELECT 
  up.id AS user_id,
  up.email,
  t.name AS team_name,
  tm.role,
  s.status AS subscription_status
FROM user_profiles up
JOIN team_members tm ON tm.user_id = up.id
JOIN teams t ON t.id = tm.team_id
JOIN subscriptions s ON s.team_id = t.id
WHERE up.email = 'test@example.com';
```

Expected: 1 row with all data populated

### 2. Seed Sample Analytics Data (Optional)

```sql
-- Get team_id for your test team
SELECT id FROM teams WHERE name = 'Your Team Name';

-- Seed 30 days of sample data
SELECT seed_sample_analytics_data('YOUR_TEAM_ID_HERE', 30);
```

### 3. Test Faspay Callback Locally

```bash
cd /home/user/webapp
node test-faspay-callback-e2e.js
```

Expected output:
```
✅ Test team created
✅ Pending transaction created
✅ Callback accepted by server
✅ Subscription status updated to: active
```

---

## 🎯 FASPAY CALLBACK WORKFLOW

### How Callback Works with New Schema

1. **Checkout**:
   ```typescript
   // User initiates payment
   createPendingTransaction({
     userId: user.id,
     merchantOrderId: 'OASIS-STARTER-123456-ABC',
     amount: 99000,
     planId: 'starter'
   })
   // Creates row in transactions table with status='pending'
   ```

2. **Faspay Callback**:
   ```typescript
   // Faspay sends notification
   POST /api/faspay/callback
   {
     bill_no: 'OASIS-STARTER-123456-ABC',
     payment_status_code: '2', // SUCCESS
     signature: '7600e239ce...'
   }
   ```

3. **User Lookup**:
   ```sql
   -- Callback queries transactions table
   SELECT user_id FROM transactions 
   WHERE gateway_reference = 'OASIS-STARTER-123456-ABC';
   -- Returns: user_id (fast, uses index)
   ```

4. **Subscription Update**:
   ```typescript
   // Update subscription to active
   updateSubscriptionAfterPayment({
     userId: userId,
     planId: 'starter',
     status: 'active'
   })
   ```

---

## 📈 PERFORMANCE BENCHMARKS

After applying schema, run these queries to verify performance:

### Query 1: Callback User Lookup
```sql
EXPLAIN ANALYZE 
SELECT user_id FROM transactions 
WHERE gateway_reference = 'OASIS-STARTER-123456-ABC';
```
Expected: `Index Scan using idx_transactions_gateway_reference` (< 1ms)

### Query 2: Team Analytics
```sql
EXPLAIN ANALYZE 
SELECT * FROM analytics_data 
WHERE team_id = 'YOUR_TEAM_ID' 
AND metric_date >= CURRENT_DATE - INTERVAL '30 days';
```
Expected: `Index Scan using idx_analytics_data_team_id` (< 10ms)

### Query 3: Subscription Status
```sql
EXPLAIN ANALYZE 
SELECT * FROM subscriptions 
WHERE team_id = 'YOUR_TEAM_ID' 
AND status = 'active';
```
Expected: `Index Scan using idx_subscriptions_team_id` (< 1ms)

---

## 🔄 ROLLBACK PLAN (If Needed)

If you need to rollback to previous schema:

1. **Export Current Data**:
   ```bash
   # Use Supabase Dashboard: Table Editor → Export
   ```

2. **Drop New Schema**:
   ```sql
   DROP TABLE IF EXISTS ai_insights CASCADE;
   DROP TABLE IF EXISTS reports CASCADE;
   DROP TABLE IF EXISTS transactions CASCADE;
   DROP TABLE IF EXISTS analytics_data CASCADE;
   DROP TABLE IF EXISTS data_integrations CASCADE;
   DROP TABLE IF EXISTS subscriptions CASCADE;
   DROP TABLE IF EXISTS team_members CASCADE;
   DROP TABLE IF EXISTS teams CASCADE;
   DROP TABLE IF EXISTS user_profiles CASCADE;
   ```

3. **Re-apply Old Schema**:
   - Use backup SQL file
   - Re-import data

---

## 📞 SUPPORT

### Common Questions

**Q: Do I need to update my application code?**  
A: No. The schema is backward compatible. But you should add checkout transaction logging.

**Q: Will this affect existing users?**  
A: No. Existing auth.users are preserved. New tables are added separately.

**Q: How long does migration take?**  
A: 10-15 seconds for empty database, up to 1 minute for databases with data.

**Q: Can I run this on production?**  
A: Yes, but **backup first**! The schema includes `DROP TABLE` statements.

---

## ✅ SUCCESS CRITERIA

Schema migration is complete when:

- ✅ All 9 tables created
- ✅ All indexes created (30+)
- ✅ All RLS policies active
- ✅ All triggers working
- ✅ Test user signup works
- ✅ Faspay callback test passes
- ✅ No errors in Supabase logs

---

## 🎉 NEXT STEPS

After successful migration:

1. **Test Faspay Checkout**:
   ```bash
   cd /home/user/webapp
   npm run dev
   # Navigate to /pricing
   # Test checkout flow
   ```

2. **Monitor Logs**:
   - Check Vercel logs for callback activity
   - Check Supabase logs for database queries

3. **Deploy to Production**:
   ```bash
   git add migrations/FULL_OASIS_SCHEMA_V2.sql
   git commit -m "feat: Apply unified schema V2.0 with Faspay support"
   git push origin main
   ```

4. **Update Environment Variables**:
   - Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel
   - Verify Faspay credentials are correct

---

**Schema Version**: 2.0  
**Last Updated**: December 5, 2025  
**Status**: ✅ PRODUCTION READY

---

## 📝 CHANGELOG

### V2.0 (December 5, 2025)
- ✅ Unified `001_initial_schema.sql` and `add_transactions_table.sql`
- ✅ Added `transactions` table with proper indexes
- ✅ Fixed `team_id` foreign key in transactions
- ✅ Enhanced RLS policies for transactions table
- ✅ Added `owner` role to team_members
- ✅ Added `paid`, `pending` status to subscriptions
- ✅ Optimized indexes for Faspay callback performance
- ✅ Added validation queries and testing guide

### V1.0 (Initial)
- Basic schema without transactions table
- Faspay callback failed due to missing user lookup
