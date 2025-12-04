'use client'

import { useState } from 'react'
import { Check, Zap, Users, Building2, Loader2 } from 'lucide-react'

// Subscription plans matching lib/faspay.ts
const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99000,
    priceDisplay: '99K',
    description: 'Perfect untuk startup dan bisnis kecil',
    icon: Zap,
    features: [
      { text: '5 dashboard interaktif', included: true },
      { text: '10 data source connections', included: true },
      { text: 'Basic analytics & reporting', included: true },
      { text: 'Email support (24 jam)', included: true },
      { text: '1 user account', included: true },
      { text: 'Custom branding', included: false },
      { text: 'API access', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Mulai Gratis',
    popular: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 299000,
    priceDisplay: '299K',
    description: 'Paling populer untuk tim profesional',
    icon: Users,
    features: [
      { text: '50 dashboard interaktif', included: true },
      { text: 'Unlimited data sources', included: true },
      { text: 'Advanced AI analytics', included: true },
      { text: 'Priority support (12 jam)', included: true },
      { text: 'Custom branding', included: true },
      { text: '5 user accounts', included: true },
      { text: 'API access', included: true },
      { text: 'White-label solution', included: false },
    ],
    cta: 'Mulai Gratis',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 999000,
    priceDisplay: '999K',
    description: 'Untuk organisasi besar dengan kebutuhan khusus',
    icon: Building2,
    features: [
      { text: 'Unlimited dashboards', included: true },
      { text: 'Unlimited data sources', included: true },
      { text: 'AI-powered insights', included: true },
      { text: 'Dedicated support (24/7)', included: true },
      { text: 'White-label solution', included: true },
      { text: 'Unlimited users', included: true },
      { text: 'Full API access', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'SLA guarantee', included: true },
    ],
    cta: 'Hubungi Sales',
    popular: false,
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [showCheckoutForm, setShowCheckoutForm] = useState(false)

  const handlePlanSelect = (planId: string, isEnterprise: boolean) => {
    if (isEnterprise) {
      // Redirect to contact for enterprise
      window.location.href = '/legal/contact'
      return
    }

    setSelectedPlan(planId)
    setShowCheckoutForm(true)
  }

  const handleCheckout = async (planId: string) => {
    // Validate form
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      alert('Mohon lengkapi semua field (Nama, Email, No. HP)')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customerInfo.email)) {
      alert('Format email tidak valid')
      return
    }

    // Validate phone format (Indonesian)
    const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/
    if (!phoneRegex.test(customerInfo.phone)) {
      alert('Format nomor HP tidak valid (contoh: 08123456789 atau +628123456789)')
      return
    }

    setLoading(planId)

    try {
      console.log('🛒 Starting checkout for plan:', planId)
      
      // Call Duitku checkout API with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout
      
      const response = await fetch('/api/faspay/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          email: customerInfo.email,
          phoneNumber: customerInfo.phone,
          customerName: customerInfo.name,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ Checkout response:', result)

      if (!result.success) {
        throw new Error(result.error || 'Checkout failed')
      }

      if (!result.data?.redirectUrl && !result.data?.virtualAccountNo) {
        throw new Error('Payment information not found in response')
      }

      // Faspay can return redirectUrl or just VA number
      if (result.data.redirectUrl) {
        console.log('🔗 Redirecting to:', result.data.redirectUrl)
        window.location.href = result.data.redirectUrl
      } else {
        // If only VA number is returned, show it to user
        alert(`VA Number: ${result.data.virtualAccountNo}\nSilakan transfer ke nomor VA ini untuk melanjutkan.`)
      }

    } catch (error) {
      console.error('❌ Checkout error:', error)
      
      let errorMessage = 'Terjadi kesalahan. Silakan coba lagi.'
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout. Silakan coba lagi atau periksa koneksi internet Anda.'
        } else {
          errorMessage = error.message
        }
      }
      
      alert(errorMessage)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Pilih Paket yang Tepat untuk Bisnis Anda
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Semua paket include 14-day money-back guarantee. 
            Tidak puas? Refund 100% tanpa pertanyaan.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {PLANS.map((plan) => {
            const Icon = plan.icon
            return (
              <div
                key={plan.id}
                className={`
                  relative bg-white rounded-2xl shadow-xl p-8 
                  ${plan.popular ? 'border-4 border-blue-600 scale-105' : 'border border-gray-200'}
                  transition-all hover:shadow-2xl
                `}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                      🔥 PALING POPULER
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  
                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-5xl font-bold text-gray-900">
                      Rp {plan.priceDisplay}
                    </span>
                    <span className="text-gray-600 text-lg">/bulan</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      ) : (
                        <span className="w-5 h-5 text-gray-300 mr-2 flex-shrink-0 mt-0.5">—</span>
                      )}
                      <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handlePlanSelect(plan.id, plan.id === 'enterprise')}
                  disabled={loading === plan.id}
                  className={`
                    w-full py-3 px-6 rounded-lg font-semibold text-lg
                    transition-all transform hover:scale-105
                    ${plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {loading === plan.id ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Processing...
                    </span>
                  ) : (
                    plan.cta
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Checkout Form Modal */}
        {showCheckoutForm && selectedPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Checkout - {PLANS.find(p => p.id === selectedPlan)?.name}
              </h2>
              <p className="text-gray-600 mb-6">
                Lengkapi data untuk melanjutkan pembayaran
              </p>

              <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault()
                handleCheckout(selectedPlan)
              }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor HP *
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="08123456789"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: 08xxx atau +628xxx
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCheckoutForm(false)
                      setSelectedPlan(null)
                    }}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={!!loading}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Processing...
                      </span>
                    ) : (
                      'Bayar Sekarang'
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  🔒 Pembayaran aman melalui <strong>Faspay</strong>
                  <br />
                  💳 Mendukung: Virtual Account, Transfer Bank, E-Wallet, Kartu Kredit
                  <br />
                  ✅ 14-day money-back guarantee
                </p>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Bagaimana cara pembayaran?
              </h3>
              <p className="text-gray-700">
                Kami menggunakan <strong>Faspay</strong> sebagai payment gateway. 
                Anda bisa bayar via Virtual Account (Permata, Mandiri, BNI, BRI), 
                Transfer Bank, E-Wallet, Kartu Kredit, atau Retail Payment.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Apakah ada garansi uang kembali?
              </h3>
              <p className="text-gray-700">
                Ya! Kami memberikan <strong>14-day money-back guarantee</strong>. 
                Jika tidak puas dalam 14 hari pertama, refund 100% tanpa pertanyaan.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Apakah bisa upgrade/downgrade paket?
              </h3>
              <p className="text-gray-700">
                Tentu! Anda bisa upgrade atau downgrade kapan saja dari dashboard. 
                Pro-rated adjustment akan diterapkan untuk sisa periode billing.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Apakah OASIS BI PRO memproses transaksi pelanggan saya?
              </h3>
              <p className="text-gray-700">
                <strong>TIDAK.</strong> OASIS BI PRO adalah <strong>Pure Business Intelligence SaaS</strong>. 
                Kami BUKAN payment facilitator atau payment aggregator. 
                Kami hanya menyediakan analytics software, dan Anda bayar kami untuk subscription akses software tersebut.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-600 mb-4">Dipercaya oleh 1000+ perusahaan di Indonesia</p>
          <div className="flex justify-center items-center gap-8 text-gray-400">
            <span className="font-semibold">🔒 Secure Payment</span>
            <span className="font-semibold">✅ 14-Day Guarantee</span>
            <span className="font-semibold">🇮🇩 Made in Indonesia</span>
          </div>
        </div>
      </div>
    </div>
  )
}
