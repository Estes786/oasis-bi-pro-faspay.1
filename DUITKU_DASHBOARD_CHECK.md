# 🎯 Duitku Dashboard Verification Guide

## Critical Action Required: Verify Transaction Logging

**Date**: 2025-12-04  
**Merchant Code**: DS26335  
**Environment**: Sandbox

---

## 📋 Step-by-Step Verification

### Step 1: Login to Duitku Sandbox Dashboard

1. **Navigate to**: https://sandbox.duitku.com/
2. **Login with your sandbox credentials**
   - Username: (your Duitku sandbox email)
   - Password: (your Duitku sandbox password)

### Step 2: Navigate to Project Transactions

1. After login, click **"Proyek Saya"** (My Projects) in the sidebar
2. Select your project (should show Merchant Code: **DS26335**)
3. Look for **"Transaksi"** or **"Transaction List"** tab

### Step 3: Verify Test Transactions

**You should see the following transactions**:

#### Transaction #1
- **Order ID**: `OASIS-STARTER-1764844434449-N8BONX`
- **Reference**: `DS2633525QRPBWKLSS1OZLA1`
- **Amount**: Rp 99,000
- **Status**: Pending / Waiting Payment
- **Customer Email**: test@example.com
- **Product**: Starter Plan - OASIS BI PRO Subscription

#### Transaction #2
- **Order ID**: `OASIS-STARTER-1764844442284-4657L9`
- **Reference**: `DS26335251C3NNWHXHAG0YWO`
- **Amount**: Rp 99,000
- **Status**: Pending / Waiting Payment
- **Customer Email**: test@example.com
- **Product**: Starter Plan - OASIS BI PRO Subscription

---

## ✅ What to Look For

### Transaction Appears in List
- [ ] Both transactions are visible in dashboard
- [ ] Order IDs match exactly
- [ ] Amount is correct (Rp 99,000)
- [ ] Product description shows "Starter Plan - OASIS BI PRO Subscription"
- [ ] Customer email is correct

### Transaction Details
- [ ] Payment URL is accessible (click to test)
- [ ] Merchant Order ID is correct format: `OASIS-{PLAN}-{TIMESTAMP}-{RANDOM}`
- [ ] Duitku Reference is generated (format: `DS26335...`)

---

## 🧪 Optional: Test Payment Flow (Sandbox)

If you want to test the complete flow:

1. **Copy Payment URL** from one of the transactions:
   ```
   https://sandbox.duitku.com/payment/inquiryV2.aspx?ref=DS26335...
   ```

2. **Open in Browser** and select payment method

3. **Use Sandbox Test Cards/Numbers**:
   - For Virtual Account: Use any test bank account
   - For E-Wallet: Use test wallet numbers provided by Duitku sandbox
   - For Credit Card: Use Duitku test card numbers

4. **Complete Payment** in sandbox

5. **Check Callback**:
   ```bash
   pm2 logs oasis-bi-pro --nostream | grep "CALLBACK"
   ```

---

## 🔍 Troubleshooting

### If Transactions DO NOT Appear

**Possible Causes**:
1. Wrong merchant code used
2. API key mismatch
3. Duitku API returned error (check server logs)
4. Network connectivity issue during API call

**Action**:
```bash
# Check server logs for Duitku API errors
cd /home/user/webapp
pm2 logs oasis-bi-pro --nostream --lines 100 | grep "Duitku"
```

### If Transactions Appear but with Errors

**Check**:
- Transaction status (should be "Pending", not "Failed")
- Amount matches (Rp 99,000 for Starter)
- Product description is correct

---

## 📊 Expected Dashboard View

You should see something like:

```
┌─────────────────────┬──────────────────────┬───────────┬──────────┬──────────┐
│ Tanggal             │ Order ID              │ Produk    │ Nominal  │ Status   │
├─────────────────────┼──────────────────────┼───────────┼──────────┼──────────┤
│ 04-12-2025 10:34    │ OASIS-STARTER-...    │ Starter   │ 99,000   │ Pending  │
│ 04-12-2025 10:33    │ OASIS-STARTER-...    │ Starter   │ 99,000   │ Pending  │
└─────────────────────┴──────────────────────┴───────────┴──────────┴──────────┘
```

---

## ✅ Success Criteria

**Transaction Logging is VERIFIED if**:
- ✅ Both transactions appear in Duitku Dashboard
- ✅ Order IDs are correct
- ✅ Amounts are accurate
- ✅ Status is "Pending" (waiting payment)
- ✅ Payment URLs are accessible

**If ALL criteria met**: ✅ **TRANSACTION LOGGING VERIFIED - PRODUCTION READY**

---

## 📝 Report Template

After verification, document results:

```markdown
## Duitku Dashboard Verification Results

**Date**: 2025-12-04
**Verified By**: [Your Name]
**Environment**: Sandbox

### Results
- [ ] ✅ Transaction #1 visible
- [ ] ✅ Transaction #2 visible
- [ ] ✅ Order IDs correct
- [ ] ✅ Amounts accurate
- [ ] ✅ Payment URLs working

### Notes
[Add any observations or issues here]

### Screenshots
[Attach screenshot of Duitku dashboard showing transactions]

### Conclusion
✅ Transaction logging VERIFIED / ❌ Issues found (describe)
```

---

## 🚀 Next Steps After Verification

Once transaction logging is verified:

1. ✅ **Mark Task Complete**: Transaction Logging di Duitku Dashboard
2. 🔄 **Test Callback**: Simulate payment completion
3. 🔄 **Test Database Update**: Verify Supabase updates
4. 🔄 **Test Dashboard Access**: Check premium features unlock
5. 📤 **Push to GitHub**: Commit verified code

---

**Last Updated**: 2025-12-04 10:40 UTC  
**Status**: Awaiting Manual Verification  
**Priority**: 🔴 HIGH
