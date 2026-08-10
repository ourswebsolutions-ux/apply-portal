'use client'

import { useEffect, useState } from 'react'
import {
  Mail,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Loader2,
} from 'lucide-react'

type PaidEmail = {
  id: string
  email: string
  createdAt: string
}

export default function PaidEmailManagementPage() {
  const [emails, setEmails] = useState<PaidEmail[]>([])
  const [emailInput, setEmailInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchEmails = async () => {
    try {
      const res = await fetch('/api/admin/paid-emails')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setEmails(data)
    } catch {
      setMessage({ type: 'error', text: 'Could not load paid emails.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmails()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleaned = emailInput.trim().toLowerCase()

    if (!cleaned) {
      setMessage({ type: 'error', text: 'Email is required.' })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' })
      return
    }

    setSubmitting(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/paid-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleaned }),
      })

      const data = await res.json()

      if (res.status === 409) {
        setMessage({ type: 'error', text: 'This email is already added.' })
        return
      }

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to add email.' })
        return
      }

      setEmails((prev) => [data, ...prev])
      setEmailInput('')
      setMessage({ type: 'success', text: 'Email added successfully.' })
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemove = async (id: string) => {
    setRemovingId(id)
    setMessage(null)

    try {
      const res = await fetch(`/api/admin/paid-emails/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        setMessage({ type: 'error', text: 'Failed to remove email.' })
        return
      }

      setEmails((prev) => prev.filter((e) => e.id !== id))
      setMessage({ type: 'success', text: 'Email removed.' })
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' })
    } finally {
      setRemovingId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-indigo-600">
            <ShieldCheck size={14} />
            Admin
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Paid Email Management
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Add email addresses that should have access to premium company information.
          </p>
        </div>

        {/* Add Email Card */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleAdd} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="email"
                  type="email"
                  placeholder="candidate@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  disabled={submitting}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              Add Email
            </button>
          </form>

          {/* Feedback message */}
          {message && (
            <div
              className={`mt-4 flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm ${
                message.type === 'success'
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border border-red-200 bg-red-50 text-red-800'
              }`}
            >
              {message.type === 'success' && <CheckCircle2 size={16} />}
              {message.text}
            </div>
          )}
        </div>

        {/* Paid Emails List */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Paid Emails
          </h2>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <Loader2 size={22} className="animate-spin" />
              </div>
            ) : emails.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <Mail size={22} className="text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  No paid emails yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Add an email address above to give a candidate premium access.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {emails.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50/80"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {item.email}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Added: {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={removingId === item.id}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {removingId === item.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}