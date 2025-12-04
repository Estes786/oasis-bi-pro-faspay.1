# 🎯 OASIS BI PRO - Business Intelligence Platform

[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)](https://github.com/Estes786/v0-v0oasisbiproduitkuv21mainmain-02-main-3-1-main-1-5-new)
[![Build](https://img.shields.io/badge/Build-Passing-brightgreen)](https://github.com/Estes786/v0-v0oasisbiproduitkuv21mainmain-02-main-3-1-main-1-5-new)
[![Integration](https://img.shields.io/badge/Duitku-Integrated-blue)](https://docs.duitku.com/)
[![Database](https://img.shields.io/badge/Supabase-Connected-green)](https://supabase.com/)

A modern, professional-grade Business Intelligence SaaS platform with complete payment gateway integration.

---

## ✨ Key Features

### 🎨 **Modern User Interface**
- Beautiful, responsive design with Tailwind CSS
- Professional Business Intelligence dashboards
- Real-time data visualization with Recharts
- Mobile-first approach

### 🔐 **Authentication & Security**
- Secure authentication with Supabase Auth
- Row Level Security (RLS) policies
- JWT-based session management
- MD5 signature verification for payments

### 💳 **Payment Processing**
- ✅ **Fully integrated Duitku Payment Gateway**
- ✅ **Automatic subscription management**
- ✅ **Real-time payment callbacks**
- ✅ **Secure signature verification**
- 3 subscription tiers (Starter, Professional, Enterprise)

### 📊 **Business Intelligence**
- Interactive analytics dashboards
- Real-time metrics and KPIs
- Custom report generation
- Data source integrations
- Team collaboration features

### 👥 **Team Management**
- Multi-user support
- Role-based access control
- Team analytics and insights
- Subscription management per team

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Supabase account
- Duitku merchant account

### Installation

```bash
# Clone the repository
git clone https://github.com/Estes786/v0-v0oasisbiproduitkuv21mainmain-02-main-3-1-main-1-5-new.git
cd webapp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
# Apply APPLY_TO_SUPABASE.sql to your Supabase project

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Duitku
NEXT_PUBLIC_DUITKU_MERCHANT_CODE=your-merchant-code
DUITKU_API_KEY=your-api-key
NEXT_PUBLIC_DUITKU_ENV=sandbox
NEXT_PUBLIC_DUITKU_CALLBACK_URL=https://yourdomain.com/api/duitku/callback
NEXT_PUBLIC_DUITKU_RETURN_URL=https://yourdomain.com/payment/success
```

---

## 📦 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payment**: Duitku Payment Gateway
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Deployment**: Vercel-ready

---

## 🎯 Subscription Plans

| Plan | Price | Features |
|------|-------|----------|
| **Starter** | Rp 99,000/mo | 5 dashboards, 10 data sources, Basic analytics |
| **Professional** | Rp 299,000/mo | 50 dashboards, Unlimited data sources, Advanced AI |
| **Enterprise** | Rp 999,000/mo | Unlimited everything, 24/7 support, SLA |

---

## 📚 Documentation

- **[DUITKU_INTEGRATION_COMPLETE.md](./DUITKU_INTEGRATION_COMPLETE.md)** - Complete Duitku integration guide
- **[AUTONOMOUS_EXECUTION_SUCCESS.md](./AUTONOMOUS_EXECUTION_SUCCESS.md)** - Implementation details and test results
- **[APPLY_TO_SUPABASE.sql](./APPLY_TO_SUPABASE.sql)** - Database schema

---

## 🧪 Testing

### Run Integration Tests

```bash
# Test Duitku integration
node test-duitku-integration.js
```

**Test Results:**
```
✅ Checkout Signature Generation - PASSED
✅ Callback Signature Verification - PASSED
✅ Order ID Format Validation - PASSED
✅ Duitku API Connectivity - PASSED
```

### Build Test

```bash
npm run build
```

**Build Status**: ✅ **ZERO ERRORS**

---

## 🚀 Deployment

### Production Build

```bash
npm run build
npm run start
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Important**: Update callback and return URLs in `.env.local` to match your production domain.

---

## 📖 API Routes

### Payment APIs

- `POST /api/duitku/checkout` - Create payment invoice
- `POST /api/duitku/callback` - Receive payment notifications
- `GET /api/duitku/check-status` - Check payment status

### Analytics APIs

- `GET /api/analytics/overview` - Dashboard overview
- `GET /api/analytics/revenue` - Revenue metrics
- `GET /api/analytics/traffic` - Traffic analytics

### Team APIs

- `GET /api/team/members` - Get team members
- `GET /api/integrations/list` - List integrations

---

## 🔒 Security

- **Signature Verification**: All payment callbacks verified with MD5 signatures
- **Row Level Security**: Supabase RLS policies on all tables
- **HTTPS Only**: Production environment requires HTTPS
- **Environment Variables**: Sensitive data stored securely
- **CSRF Protection**: Built-in Next.js protection

---

## 🎨 Project Structure

```
webapp/
├── app/                        # Next.js app directory
│   ├── api/                   # API routes
│   │   ├── duitku/           # Payment gateway APIs
│   │   └── analytics/        # Analytics APIs
│   ├── auth/                 # Authentication pages
│   ├── dashboard/            # Dashboard pages
│   ├── member/               # Member area
│   ├── pricing/              # Pricing page
│   └── legal/                # Legal pages
├── components/               # React components
├── lib/                      # Utilities and services
│   ├── duitku.ts            # Duitku client
│   ├── subscription-service.ts # Subscription logic
│   └── supabase-client.ts   # Supabase client
├── public/                   # Static assets
└── styles/                   # Global styles
```

---

## 🐛 Troubleshooting

### Payment Issues

If payments are not processing:
1. Check Duitku credentials in `.env.local`
2. Verify callback URL is publicly accessible
3. Check signature generation in logs
4. Review Supabase RLS policies

### Database Issues

If database updates fail:
1. Verify Supabase credentials
2. Check RLS policies
3. Run APPLY_TO_SUPABASE.sql
4. Check console logs for errors

For more troubleshooting, see [DUITKU_INTEGRATION_COMPLETE.md](./DUITKU_INTEGRATION_COMPLETE.md).

---

## 📊 Status

| Component | Status |
|-----------|--------|
| Build | ✅ Passing (0 errors) |
| Tests | ✅ All tests passing |
| Duitku Integration | ✅ Complete |
| Supabase Integration | ✅ Complete |
| Documentation | ✅ Complete |
| Production Ready | ✅ Yes |

---

## 🤝 Contributing

This is a production project. For changes, please open an issue first.

---

## 📄 License

Private project - All rights reserved.

---

## 🙏 Acknowledgments

- **Duitku** for payment gateway services
- **Supabase** for backend infrastructure
- **Vercel** for hosting platform
- **shadcn/ui** for beautiful components

---

## 📞 Support

- **Email**: support@oasis-bi-pro.web.id
- **Docs**: [DUITKU_INTEGRATION_COMPLETE.md](./DUITKU_INTEGRATION_COMPLETE.md)
- **GitHub**: [Issues](https://github.com/Estes786/v0-v0oasisbiproduitkuv21mainmain-02-main-3-1-main-1-5-new/issues)

---

**Last Updated**: December 4, 2024  
**Version**: 2.1.0  
**Status**: 🎉 **PRODUCTION READY**
