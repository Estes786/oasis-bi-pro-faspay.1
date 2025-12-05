# 🚀 OASIS BI PRO - PRODUCTION ENVIRONMENT CONFIGURATION

**Date**: December 5, 2025  
**Version**: Production V2.0  
**Status**: ✅ READY FOR DEPLOYMENT

---

## 📋 ENVIRONMENT VARIABLES CHECKLIST

### Required for Production Deployment

Copy these to your Vercel/Production environment:

```bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1️⃣ SUPABASE CONFIGURATION (PRODUCTION)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=https://ifvusvcmcxytwcokbzje.supabase.co

# Supabase Anonymous Key (Public - safe for client-side)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmdnVzdmNtY3h5dHdjb2tiemplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MTU0NDUsImV4cCI6MjA4MDQ5MTQ0NX0._J3G2l_7uXOkFzvKVbfarchH6EsXvjdGS6D3ddPq5bY

# Supabase Service Role Key (SECRET - server-side only!)
# ⚠️  NEVER expose this in client-side code!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmdnVzdmNtY3h5dHdjb2tiemplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDkxNTQ0NSwiZXhwIjoyMDgwNDkxNDQ1fQ.4VZyCX-xhVkgbI3QhKhLUSDojeHAyruqJB-Dr7RUKqg

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 2️⃣ FASPAY CONFIGURATION (PRODUCTION)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Faspay Environment
# Options: 'sandbox' | 'production'
FASPAY_ENV=production

# Faspay Merchant ID (Production)
# TODO: Replace with PRODUCTION merchant ID from Faspay
# Current: Sandbox ID (36619)
FASPAY_MERCHANT_ID=36619

# Faspay Password/Key (Production)
# TODO: Replace with PRODUCTION password from Faspay
# Current: Sandbox password
FASPAY_PASSWORD_KEY=p@ssw0rd

# Faspay API URLs
# Production URL
FASPAY_API_URL=https://web.faspay.co.id

# Faspay SNAP API URLs (if using SNAP)
FASPAY_SNAP_CLIENT_ID=YOUR_PRODUCTION_CLIENT_ID
FASPAY_SNAP_CLIENT_SECRET=YOUR_PRODUCTION_CLIENT_SECRET
FASPAY_SNAP_API_URL=https://api.faspay.co.id

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 3️⃣ APPLICATION CONFIGURATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Public Application URL
NEXT_PUBLIC_APP_URL=https://oasis-bi-pro-faspay-1.vercel.app

# Callback URL (for Faspay notification)
# This must match URL registered in Faspay dashboard
NEXT_PUBLIC_CALLBACK_URL=https://oasis-bi-pro-faspay-1.vercel.app/api/faspay/callback

# Environment
NODE_ENV=production

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 4️⃣ OPTIONAL: ADDITIONAL SERVICES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Google Analytics (Optional)
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Sentry Error Tracking (Optional)
# SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Email Service (Optional)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
```

---

## 🔐 SECURITY CHECKLIST

### Before Going to Production

- [ ] **Supabase Service Role Key**: Confirmed stored server-side only
- [ ] **Faspay Credentials**: Updated to production merchant ID and password
- [ ] **API URLs**: Changed from sandbox to production URLs
- [ ] **Environment Variables**: All sensitive data in environment variables (not hardcoded)
- [ ] **RLS Policies**: Enabled and tested on all Supabase tables
- [ ] **HTTPS**: All URLs use HTTPS (production requirement)
- [ ] **Callback URL**: Registered correctly in Faspay dashboard

---

## 🎯 FASPAY PRODUCTION SETUP

### Step 1: Get Production Credentials

1. **Contact Faspay Sales/Support**:
   - Email: support@faspay.co.id
   - Request production merchant account

2. **Receive Production Credentials**:
   - Merchant ID (Production)
   - Password/Key (Production)
   - SNAP Client ID (if using SNAP API)
   - SNAP Client Secret (if using SNAP API)

3. **Update Environment Variables**:
   ```bash
   FASPAY_MERCHANT_ID=YOUR_PRODUCTION_MERCHANT_ID
   FASPAY_PASSWORD_KEY=YOUR_PRODUCTION_PASSWORD
   FASPAY_ENV=production
   ```

### Step 2: Register Callback URL

1. **Login to Faspay Dashboard** (Production):
   - URL: https://dashboard.faspay.co.id

2. **Navigate to Settings → Callback URL**

3. **Register Callback URL**:
   ```
   https://oasis-bi-pro-faspay-1.vercel.app/api/faspay/callback
   ```

4. **Select Notification Type**:
   - ✅ Payment Notification
   - ✅ Status Update

5. **Test Callback**:
   - Use Faspay dashboard test tool
   - Verify signature verification passes

### Step 3: Configure Payment Methods

1. **Enable Payment Channels**:
   - Virtual Account (Mandiri, BCA, BNI, Permata, dll)
   - E-Wallet (OVO, Dana, GoPay, dll)
   - Credit Card (Optional)
   - QRIS (Optional)

2. **Set Payment Limits**:
   - Minimum: 10,000 IDR
   - Maximum: 50,000,000 IDR (or as per business needs)

3. **Configure Auto-Settlement**:
   - Daily settlement to bank account
   - Confirm settlement schedule with Faspay

---

## 🚀 VERCEL DEPLOYMENT CONFIGURATION

### Deploy to Vercel

1. **Connect GitHub Repository**:
   ```bash
   # Vercel will auto-detect Next.js project
   # No special configuration needed
   ```

2. **Configure Environment Variables in Vercel**:
   - Go to: Project Settings → Environment Variables
   - Add all variables from section above
   - Select: Production, Preview, Development

3. **Configure Build Settings** (Auto-detected):
   ```
   Framework Preset: Next.js
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

4. **Deploy**:
   ```bash
   # Auto-deploy on git push to main
   git push origin main
   
   # Or manual deploy
   npx vercel --prod
   ```

### Vercel Domains

1. **Default Domain** (Auto):
   ```
   https://oasis-bi-pro-faspay-1.vercel.app
   ```

2. **Custom Domain** (Optional):
   ```bash
   # Add in Vercel Dashboard
   # Example: oasis-bi.com
   ```

---

## 📊 MONITORING & LOGGING

### Production Monitoring Setup

1. **Vercel Logs**:
   - Dashboard → Project → Logs
   - Real-time function logs
   - API route performance

2. **Supabase Logs**:
   - Dashboard → Logs
   - Database queries
   - API requests
   - Auth events

3. **Faspay Transaction Logs**:
   - Faspay Dashboard → Transactions
   - Payment status
   - Callback logs

### Key Metrics to Monitor

- **Callback Success Rate**: Should be > 99%
- **Subscription Activation Time**: Should be < 5 seconds
- **Database Query Performance**: Should be < 100ms
- **API Response Time**: Should be < 500ms

---

## 🧪 PRODUCTION TESTING CHECKLIST

### Before Launch

- [ ] **Smoke Test**: Basic functionality works
- [ ] **Payment Test**: Complete checkout flow with small amount (10,000 IDR)
- [ ] **Callback Test**: Verify subscription activates after payment
- [ ] **Email Test**: Confirmation emails sent correctly
- [ ] **Mobile Test**: Responsive design on mobile devices
- [ ] **Browser Test**: Works on Chrome, Safari, Firefox
- [ ] **Load Test**: Can handle expected traffic
- [ ] **Security Test**: No sensitive data exposed

### After Launch

- [ ] **Monitor Logs**: Check for errors in first 24 hours
- [ ] **Test Real Transaction**: Process actual customer payment
- [ ] **Verify Settlement**: Confirm funds arrive in bank account
- [ ] **User Feedback**: Collect feedback from early users

---

## 🔄 ROLLBACK PLAN

### If Issues Detected in Production

1. **Immediate Rollback**:
   ```bash
   # Vercel rollback to previous deployment
   vercel rollback
   ```

2. **Fix and Redeploy**:
   ```bash
   # Fix issue locally
   git commit -m "fix: production issue"
   git push origin main
   # Vercel auto-deploys
   ```

3. **Database Rollback** (if schema changed):
   - Restore from Supabase backup
   - Or apply rollback migration

---

## 📞 SUPPORT CONTACTS

### Technical Support

**Faspay**:
- Email: support@faspay.co.id
- Phone: +62 21 5021 5888
- Hours: Mon-Fri 09:00-17:00 WIB

**Supabase**:
- Dashboard: https://supabase.com/dashboard/support
- Discord: https://discord.supabase.com
- Email: support@supabase.io

**Vercel**:
- Dashboard: https://vercel.com/support
- Email: support@vercel.com
- Discord: https://discord.gg/vercel

---

## 📈 EXPECTED PRODUCTION PERFORMANCE

### Baseline Metrics

| Metric | Target | Excellent |
|--------|--------|-----------|
| Callback Response Time | < 500ms | < 200ms |
| Database Query Time | < 100ms | < 50ms |
| Page Load Time | < 3s | < 1s |
| API Latency | < 300ms | < 100ms |
| Uptime | > 99.5% | > 99.9% |

### Scaling Considerations

- **Traffic**: Vercel auto-scales (no action needed)
- **Database**: Supabase auto-scales (monitor usage)
- **Payment Gateway**: Faspay handles high volume

---

## ✅ FINAL PRE-LAUNCH CHECKLIST

### Critical Items (Must Complete)

- [x] ✅ Schema V2.0 applied to Supabase
- [x] ✅ Callback endpoint tested and verified
- [x] ✅ Foreign keys and constraints working
- [x] ✅ RLS policies enabled on all tables
- [x] ✅ Code deployed to Vercel
- [x] ✅ Build successful (no errors)
- [ ] ⏳ Faspay production credentials obtained
- [ ] ⏳ Callback URL registered in Faspay dashboard
- [ ] ⏳ Production payment test completed
- [ ] ⏳ Email notifications configured
- [ ] ⏳ Custom domain configured (optional)

### Optional Enhancements

- [ ] Google Analytics integrated
- [ ] Sentry error tracking setup
- [ ] Email service configured
- [ ] SMS notifications setup
- [ ] Admin dashboard enhanced

---

## 🎉 READY FOR PRODUCTION

**Current Status**: ✅ **TECHNICALLY READY**

**Pending Actions**:
1. Obtain Faspay production credentials
2. Register callback URL in Faspay dashboard
3. Test production payment flow
4. Launch! 🚀

---

**Document Version**: 2.0  
**Last Updated**: December 5, 2025  
**Status**: PRODUCTION READY (pending Faspay credentials)

---

## 📝 NOTES

### Known Limitations

1. **Sandbox Credentials**: Currently using sandbox Faspay credentials
   - **Action**: Replace with production credentials before launch

2. **Email Notifications**: Not yet configured
   - **Action**: Add SMTP configuration for production

3. **Custom Domain**: Using default Vercel domain
   - **Action**: Configure custom domain if desired

### Future Enhancements

1. **Multi-Gateway Support**: Add Xendit, Midtrans as alternatives
2. **Subscription Management**: Add upgrade/downgrade features
3. **Analytics Dashboard**: Enhanced admin analytics
4. **API Rate Limiting**: Implement rate limiting for security
5. **Caching**: Add Redis caching for performance

---

**END OF CONFIGURATION DOCUMENT**
