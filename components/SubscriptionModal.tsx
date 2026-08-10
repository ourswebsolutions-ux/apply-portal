'use client'

import { useState } from 'react'
import {
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  QrCode,
  User,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react'

type SubscriptionModalProps = {
  open: boolean
  onClose: () => void
  onSubscribe: () => void
}

type FormData = {
  fullName: string
  email: string
  phone: string
}

export default function SubscriptionModal({
  open,
  onClose,
}: SubscriptionModalProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const resetAndClose = () => {
    setStep(1)
    setFormData({ fullName: '', email: '', phone: '' })
    setErrors({})
    setShowSuccess(false)
    onClose()
  }

  const validateStep2 = () => {
    const newErrors: Partial<FormData> = {}
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required'
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address'
    }
    if (!formData.phone.trim()) newErrors.phone = 'WhatsApp / Phone number is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinueFromStep1 = () => setStep(2)

  const handleContinueFromStep2 = () => {
    if (validateStep2()) setStep(3)
  }

  const handleBack = () => {
    setShowSuccess(false)
    setStep((prev) => Math.max(1, prev - 1))
  }

  const handlePaymentCompleteClick = async () => {
  try {
    setLoading(true)

    const res = await fetch('/api/payment-submission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        amount: 250,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Failed to submit payment')
    }

    setShowSuccess(true)
  } catch (error) {
    console.error(error)
    alert('Unable to submit payment. Please try again.')
  } finally {
    setLoading(false)
  }
}

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) resetAndClose()
      }}
    >
      <section
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscription-title"
      >
        {/* Close button */}
        <button
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          onClick={resetAndClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Success Screen */}
        {showSuccess ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 size={36} className="text-emerald-600" strokeWidth={2} />
            </div>

            <h2 className="mb-2 text-xl font-bold text-slate-900">
              Payment Submitted!
            </h2>

            <p className="mb-6 max-w-xs text-sm leading-relaxed text-slate-600">
              Thank you. We have received your payment request.
            </p>

            <div className="mb-6 w-full rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <div className="mb-1 flex items-center justify-center gap-2 text-sm font-semibold text-indigo-700">
                <Clock size={16} />
                Account Activation
              </div>
              <p className="text-sm text-indigo-800">
                Your account will be activated within{' '}
                <strong>1 hour</strong> after payment verification.
              </p>
            </div>

            <p className="mb-6 text-xs text-slate-250">
              You will receive a confirmation once your premium access is live.
            </p>

            <button
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-250 focus:ring-offset-2"
              onClick={resetAndClose}
            >
              Got it
            </button>
          </div>
        ) : (
          <>
            {/* Step Indicator */}
            <div className="mb-6 flex items-center justify-center gap-2 text-xs text-slate-250">
              <span
                className={`flex items-center gap-1.5 ${
                  step === 1 ? 'font-semibold text-indigo-600' : ''
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                    step === 1
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  1
                </span>
                Details
              </span>
              <span className="text-slate-300">→</span>
              <span
                className={`flex items-center gap-1.5 ${
                  step === 2 ? 'font-semibold text-indigo-600' : ''
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                    step === 2
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  2
                </span>
                Information
              </span>
              <span className="text-slate-300">→</span>
              <span
                className={`flex items-center gap-1.5 ${
                  step === 3 ? 'font-semibold text-indigo-600' : ''
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                    step === 3
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  3
                </span>
                Payment
              </span>
            </div>

            {/* STEP 1 — Premium Access */}
            {step === 1 && (
              <>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  Premium Access
                </span>
                <h2
                  id="subscription-title"
                  className="mb-2 text-xl font-bold text-slate-900"
                >
                  Unlock Company Information
                </h2>
                <p className="mb-5 text-sm leading-relaxed text-slate-600">
                  Get access to verified company and recruiter details for this job
                  opportunity.
                </p>

                <ul className="mb-6 space-y-2.5">
                  {[
                    'Company information',
                    'Company website',
                    'HR / recruiter name',
                    'HR email',
                    'HR phone number',
                    'Recruitment contact details',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2.5 text-sm text-slate-700"
                    >
                      <Check
                        size={16}
                        className="shrink-0 text-emerald-250"
                        strokeWidth={2.5}
                      />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mb-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <span className="text-xs font-medium text-slate-250">
                    Subscription
                  </span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <strong className="text-2xl font-bold text-slate-900">
                      ₨ 250
                    </strong>
                    <span className="text-sm text-slate-250">/ month</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-250">
                    Cancel anytime · Instant access after subscribe
                  </p>
                </div>

                <button
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-250 focus:ring-offset-2"
                  onClick={handleContinueFromStep1}
                >
                  Continue to Payment <ArrowRight size={16} />
                </button>
                <button
                  className="mt-3 w-full py-2 text-sm font-medium text-slate-250 transition hover:text-slate-700"
                  onClick={resetAndClose}
                >
                  Maybe Later
                </button>
              </>
            )}

            {/* STEP 2 — Customer Information */}
            {step === 2 && (
              <>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  Payment Information
                </span>
                <h2
                  id="subscription-title"
                  className="mb-2 text-xl font-bold text-slate-900"
                >
                  Payment Information
                </h2>
                <p className="mb-5 text-sm leading-relaxed text-slate-600">
                  Enter your information before continuing to payment.
                </p>

                <div className="mb-6 space-y-4">
                  <div>
                    <label
                      htmlFor="fullName"
                      className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700"
                    >
                      <User size={15} className="text-slate-400" />
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-indigo-250/20 ${
                        errors.fullName
                          ? 'border-red-400 focus:border-red-400'
                          : 'border-slate-200 focus:border-indigo-250'
                      }`}
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-xs text-red-250">{errors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700"
                    >
                      <Mail size={15} className="text-slate-400" />
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-indigo-250/20 ${
                        errors.email
                          ? 'border-red-400 focus:border-red-400'
                          : 'border-slate-200 focus:border-indigo-250'
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-250">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700"
                    >
                      <Phone size={15} className="text-slate-400" />
                      WhatsApp / Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="+92 3XX XXXXXXX"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-indigo-250/20 ${
                        errors.phone
                          ? 'border-red-400 focus:border-red-400'
                          : 'border-slate-200 focus:border-indigo-250'
                      }`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-250">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    onClick={handleBack}
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-250 focus:ring-offset-2"
                    onClick={handleContinueFromStep2}
                  >
                    Continue to Payment <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}

            {/* STEP 3 — JazzCash QR Payment */}
            {step === 3 && (
              <>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  Complete Payment
                </span>
                <h2
                  id="subscription-title"
                  className="mb-2 text-xl font-bold text-slate-900"
                >
                  Complete Your Payment
                </h2>
                <p className="mb-5 text-sm leading-relaxed text-slate-600">
                  Scan the QR code below using JazzCash to complete your ₨250
                  subscription payment.
                </p>

                <div className="mb-5 flex flex-col items-center">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <img
                      src="/jazzcash-qr.png"
                      alt="JazzCash QR Code"
                      className="h-48 w-48 object-contain"
                    />
                  </div>
                </div>

                <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <QrCode size={16} className="text-indigo-600" />
                    JazzCash Payment
                  </div>
                  <p className="mb-3 text-xs text-slate-600">
                    Scan this QR code using your JazzCash app and pay ₨250.
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-250">Amount</span>
                      <strong className="font-semibold text-slate-900">₨250</strong>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-250">JazzCash Number</span>
                      <strong className="font-semibold text-slate-900">
                        03XX XXXXXXX
                      </strong>
                    </div>
                  </div>

                  <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-700">
                    <ShieldCheck size={13} />
                    Please make sure you pay exactly ₨250.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    onClick={handleBack}
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
  onClick={handlePaymentCompleteClick}
  disabled={loading}
>
  {loading ? (
    <>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      Verifying Payment...
    </>
  ) : (
    <>
      I've Completed Payment
    </>
  )}
</button>
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  )
}