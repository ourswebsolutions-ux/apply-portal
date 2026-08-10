'use client'

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  Link2,
  LockKeyhole,
  Mail,
  MapPin,
  Plus,
  Rocket,
  UploadCloud,
  X,
} from 'lucide-react'
import CompanyInformation from '../components/CompanyInformation'
import SubscriptionModal from '../components/SubscriptionModal'
import DynamicAd from '../components/DynamicAd'; // adjust the path if needed

type FileState = { name: string; size: string } | null

const initialSkills = ['React', 'Next.js', 'Node.js', 'TypeScript']

/** Converts URL hash slug → human-readable job title */
function getJobTitleFromHash() {
  const slug = window.location.hash.replace(/^#/, '').trim()

  if (!slug) {
    return 'Senior Full Stack Developer'
  }

  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function Field({
  label,
  required,
  optional,
  hint,
  children,
}: {
  label: string
  required?: boolean
  optional?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="field">
      <span className="field-label">
        {label} {required && <em>*</em>} {optional && <small>OPTIONAL</small>}
      </span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

function SectionHeading({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description?: string
}) {
  return (
    <div className="section-heading">
      <span className="section-number">{number}</span>
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
    </div>
  )
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export default function Page() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [skills, setSkills] = useState(initialSkills)
  const [skillInput, setSkillInput] = useState('')
  const [file, setFile] = useState<FileState>(null)
  const [boostOpen, setBoostOpen] = useState(false)
  const [boostRequested, setBoostRequested] = useState(false)
  const [consent, setConsent] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [unlocked, setUnlocked] = useState(false)

  // Dynamic job title from URL hash
  const [jobTitle, setJobTitle] = useState('Senior Full Stack Developer')

  // Premium email access
  const [email, setEmail] = useState('')
  const [paidAccess, setPaidAccess] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [emailCheckError, setEmailCheckError] = useState(false)

  const hasPremiumAccess = paidAccess || boostRequested

  // Keep job title in sync with the URL hash (including live changes)
  useEffect(() => {
    const updateTitle = () => setJobTitle(getJobTitleFromHash())
    updateTitle() // initial read

    window.addEventListener('hashchange', updateTitle)
    return () => window.removeEventListener('hashchange', updateTitle)
  }, [])

  // Debounced paid-access check
  useEffect(() => {
    // Reset immediately when email changes
    setPaidAccess(false)
    setEmailCheckError(false)

    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !isValidEmail(trimmed)) {
      setCheckingEmail(false)
      return
    }

    setCheckingEmail(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/paid-access?email=${encodeURIComponent(trimmed)}`
        )
        if (!res.ok) throw new Error('check failed')
        const data = await res.json()
        setPaidAccess(!!data.paid)
        setEmailCheckError(false)
      } catch {
        setPaidAccess(false)
        setEmailCheckError(true)
      } finally {
        setCheckingEmail(false)
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [email])

  const handleSubscribe = () => {
    setUnlocked(true)
    setModalOpen(false)
  }

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0]
    if (!selected) return
    if (selected.size > 5 * 1024 * 1024) {
      setError('Please choose a file smaller than 5 MB.')
      return
    }
    setError('')
    setFile({
      name: selected.name,
      size: `${(selected.size / (1024 * 1024)).toFixed(1)} MB`,
    })
  }

  const addSkill = () => {
    const value = skillInput.trim()
    if (value && !skills.includes(value)) setSkills([...skills, value])
    setSkillInput('')
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!file) return setError('Please upload your CV before submitting.')
    if (!consent)
      return setError('Please confirm that the information provided is accurate.')
    setError('')
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 900)
  }

  if (submitted) {
    return (
      <main className="site-shell success-shell">
        <header className="site-header">
          <div className="brand">
            <span className="brand-mark">A</span>
            <span>
              AXORA <b>WEB SOLUTIONS</b>
            </span>
          </div>
          <span className="help-link">
            Need Help? <a href="mailto:info.axoraweb@gmail.com">Contact us</a>
          </span>
        </header>
        <section className="success-card" aria-live="polite">
          <div className="success-icon">
            <Check />
          </div>
          <span className="eyebrow">APPLICATION RECEIVED</span>
          <h1>Application submitted</h1>
          <p>
            Your application has been successfully received and will be reviewed
            by our recruitment team.
          </p>
          <div className="success-details">
            <div>
              <span>POSITION</span>
              <strong>{jobTitle}</strong>
            </div>
            <div>
              <span>APPLICATION REFERENCE</span>
              <strong>AXR-2026-000124</strong>
            </div>
          </div>
          <div className="success-status">
            <CheckCircle2 />{' '}
            {hasPremiumAccess ? 'CV Boost Requested' : 'Application Submitted'}
          </div>
          <p className="thank-you">Thank you for your interest in Axora.</p>
        </section>
        <Footer />
      </main>
    )
  }

  return (
    <main className="site-shell">
      <header className="site-header mx-auto flex w-[96%] max-w-[1400px] items-center justify-between px-7 py-5">
        <div className="brand lg:-ml-20">
          <img
            src="/logo.png"
            alt="Axora Web Solutions"
            className="h-auto w-[190px] object-contain"
          />
        </div>

        <span className="help-link text-sm">
          Need Help?{' '}
          <a
            href="mailto:hello@axorawebsolutions.com"
            className="font-medium hover:underline"
          >
            Contact us
          </a>
        </span>
      </header>

      <section className="application-intro">
        <span className="eyebrow">APPLICATION</span>
        <h1>
          Apply for the <span>position</span>
        </h1>
        <p>
          Complete the form below and submit your CV to apply for this
          opportunity.
        </p>
        <div className="position-pill">
          <span className="position-dot" />{' '}
          <strong>{jobTitle}</strong>
          <i /> <span>Remote · Full-time</span>
        </div>
      </section>

      <div className="application-layout">
        <div className="form-column">
          <form className="application-card" onSubmit={submit}>
            <div className="form-section">
              <SectionHeading number="01" title="Personal information" />
              <div className="field-grid">
                <Field label="Full Name" required>
                  <input name="name" placeholder="John Doe" autoComplete="name" />
                </Field>

                <Field label="Email Address" required>
                  <div className="input-icon">
                    <Mail />
                    <input
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  {/* Subtle status under the email field */}
                  {checkingEmail && (
                    <span className="field-hint" style={{ marginTop: 6 }}>
                      Checking premium access…
                    </span>
                  )}
                  {!checkingEmail && paidAccess && (
                    <span
                      className="field-hint"
                      style={{ marginTop: 6, color: 'var(--success, #16a34a)' }}
                    >
                      ✓ Premium access verified
                    </span>
                  )}
                  {!checkingEmail && emailCheckError && (
                    <span className="field-hint" style={{ marginTop: 6 }}>
                      Unable to verify premium access right now.
                    </span>
                  )}
                </Field>

                <Field label="Phone / WhatsApp" required>
                  <input
                    name="phone"
                    placeholder="+92 3XX XXXXXXX"
                    autoComplete="tel"
                  />
                </Field>
                <Field label="Country" required>
                  <div className="input-icon">
                    <MapPin />
                    <input
                      name="country"
                      placeholder="Pakistan"
                      autoComplete="country-name"
                    />
                  </div>
                </Field>
              </div>
            </div>

            {/* … sections 02, 03, 04 remain exactly as you had them … */}

            <div className="form-section">
              <SectionHeading number="02" title="Professional information" />
              <div className="field-grid">
                <Field label="Current Job Title">
                  <input placeholder="e.g. Software Engineer" />
                </Field>
                <Field label="Years of Experience" required>
                  <div className="select-wrap">
                    <select defaultValue="">
                      <option value="" disabled>
                        Select experience
                      </option>
                      <option>0–2 years</option>
                      <option>3–5 years</option>
                      <option>6–10 years</option>
                      <option>10+ years</option>
                    </select>
                    <ChevronDown />
                  </div>
                </Field>
                <Field
                  label="Primary Skills"
                  hint="Add the skills most relevant to this opportunity."
                >
                  <div className="tag-input">
                    {skills.map((skill) => (
                      <span className="skill-tag" key={skill}>
                        {skill}
                        <button
                          type="button"
                          onClick={() =>
                            setSkills(skills.filter((item) => item !== skill))
                          }
                          aria-label={`Remove ${skill}`}
                        >
                          <X />
                        </button>
                      </span>
                    ))}
                    <input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addSkill()
                        }
                      }}
                      onBlur={addSkill}
                      placeholder="Add a skill"
                    />
                    <button
                      className="add-skill"
                      type="button"
                      onClick={addSkill}
                      aria-label="Add skill"
                    >
                      <Plus />
                    </button>
                  </div>
                </Field>
                <Field label="Expected Salary">
                  <input placeholder="e.g. ₨300,000 / month" />
                </Field>
              </div>
            </div>

            <div className="form-section">
              <SectionHeading
                number="03"
                title="Professional links"
                description="Share your work so our team can get to know you better."
              />
              <div className="field-grid three">
                <Field label="LinkedIn Profile" optional>
                  <div className="input-icon">
                    <Link2 />
                    <input placeholder="linkedin.com/in/yourname" />
                  </div>
                </Field>
                <Field label="GitHub" optional>
                  <div className="input-icon">
                    <Link2 />
                    <input placeholder="github.com/yourname" />
                  </div>
                </Field>
                <Field label="Portfolio / Website" optional>
                  <div className="input-icon">
                    <Link2 />
                    <input placeholder="yourwebsite.com" />
                  </div>
                </Field>
              </div>
            </div>

            <div className="form-section upload-section">
              <SectionHeading
                number="04"
                title="Upload your CV"
                description="A clear, up-to-date CV helps us understand your experience."
              />
              <input
                ref={fileInput}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={selectFile}
                hidden
              />
              {file ? (
                <div className="uploaded-file">
                  <div className="file-icon">
                    <FileText />
                  </div>
                  <div className="file-copy">
                    <strong>{file.name}</strong>
                    <span>
                      {file.size} ·{' '}
                      <b>
                        <CheckCircle2 /> CV uploaded successfully
                      </b>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="remove-file"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="upload-dropzone"
                  onClick={() => fileInput.current?.click()}
                >
                  <span className="upload-icon">
                    <UploadCloud />
                  </span>
                  <strong>Upload your CV</strong>
                  <span>
                    Drag & drop your CV here or <u>browse files</u>
                  </span>
                  <small>PDF · DOC · DOCX &nbsp; / &nbsp; Maximum 5 MB</small>
                </button>
              )}
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <div className="trust-line">
                <LockKeyhole /> Your application information is handled securely.
              </div>
            </div>

            {/* BOOST CARD — visual structure unchanged, content switches on paidAccess */}
            <div
              className={`boost-card ${
                hasPremiumAccess ? 'boost-selected' : ''
              }`}
            >
              <div className="boost-icon">
                <Rocket />
              </div>
              <div className="boost-copy">
                {paidAccess ? (
                  <>
                    <span className="boost-label">PREMIUM ACCESS ACTIVE</span>
                    <h2>Your premium access is already enabled for this email.</h2>
                    <p>
                      CV Boost is included. No additional payment is required.
                    </p>
                    <ul>
                      <li>
                        <Check /> CV Boost included
                      </li>
                      <li>
                        <Check /> No additional payment required
                      </li>
                    </ul>
                  </>
                ) : (
                  <>
                    <span className="boost-label">OPTIONAL PREMIUM SERVICE</span>
                    <h2>Make your CV stand out</h2>
                    <p>
                      Get your CV reviewed and optimized specifically for this
                      opportunity.
                    </p>
                    <ul>
                      <li>
                        <Check /> Skills
                      </li>
                      <li>
                        <Check /> Experience
                      </li>
                      <li>
                        <Check /> Achievements
                      </li>
                      <li>
                        <Check /> Professional strengths
                      </li>
                    </ul>
                  </>
                )}
              </div>

              <div className="boost-action">
                {paidAccess ? (
                  <div className="requested">
                    <CheckCircle2 /> Premium access verified
                  </div>
                ) : boostRequested ? (
                  <div className="requested">
                    <CheckCircle2 /> Boost requested
                  </div>
                ) : (
                  <>
                    <strong>
                      ₨ 250<small>one-time</small>
                    </strong>
                    <button type="button" onClick={() => setModalOpen(true)}>
                      Boost my CV <ArrowRight />
                    </button>
                    <button
                      type="button"
                      className="quiet-button"
                      onClick={() => setBoostRequested(false)}
                    >
                      Continue without boost
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="form-footer">
              <label className="consent">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span className="check-box">
                  <Check />
                </span>
                <span>
                  I confirm that the information provided is accurate.
                </span>
              </label>
              <button className="submit-button" type="submit" disabled={loading}>
                {loading ? (
                  <span className="spinner" />
                ) : (
                  <>
                    Submit application <ArrowRight />
                  </>
                )}
              </button>
              <p>Your application will be securely submitted for review.</p>
            </div>
          </form>
        </div>

        {/* RIGHT column */}
        <div className="company-column">
          <CompanyInformation unlocked={paidAccess} />
        </div>
      </div>

      <Footer />

      <SubscriptionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubscribe={handleSubscribe}
      />
      <DynamicAd
        image="/whatsapp.png"
        alt="WhatsApp API by Axora Web Solutions"
        href="https://waapi.axorawebsolutions.com"
        label="Sponsored"
        title="WhatsApp API"
        description="Automate WhatsApp messaging for your business."
        ctaText="Learn more"
      />
    </main>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <span>© 2026 Axora Web Solutions</span>
      <nav>
        <a href="#privacy">Privacy</a>
        <a href="#terms">Terms</a>
        <a href="mailto:hello@axorawebsolutions.com">Contact</a>
      </nav>
    </footer>
  )
}