'use client'

import {
  ArrowRight,
  Building2,
  Globe,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
} from 'lucide-react'
import { useState } from 'react'
import SubscriptionModal from './SubscriptionModal'

type CompanyData = {
  companyName: string
  website: string
  industry: string
  location: string
  hrName: string
  hrEmail: string
  hrPhone: string
  department: string
  hiringManager: string
  details: string
}

// Internal data – never rendered before unlock
const companyData: CompanyData = {
  companyName: 'Axora Technologies',
  website: 'https://www.example-company.com',
  industry: 'Software Development & Digital Services',
  location: 'Lahore, Pakistan · Remote-friendly',
  hrName: 'Sarah Ahmed',
  hrEmail: 'sarah@example-company.com',
  hrPhone: '+971 50 123 4567',
  department: 'Talent Acquisition',
  hiringManager: 'Hassan Ali',
  details:
    'Axora Technologies is a product-focused engineering studio specialising in high-performance web platforms, AI-assisted tooling and enterprise digital transformation. The company works with clients across fintech, healthcare and SaaS.',
}

const MASK = '••••••••••••••••'
const DETAILS_MASK = '••••••••••••••••••••••••••••••••'

export default function CompanyInformation() {
  const [unlocked, setUnlocked] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const handleSubscribe = () => {
    setUnlocked(true)
    setModalOpen(false)
  }

  return (
    <>
      <aside className={`company-card ${unlocked ? 'is-unlocked' : 'is-locked'}`}>
        {/* Header */}
        <div className="company-card-header">
          <span className={`access-badge ${unlocked ? 'active' : ''}`}>
            {unlocked ? 'PREMIUM ACCESS ACTIVE' : 'PREMIUM ACCESS'}
          </span>
          {!unlocked && (
            <>
              <h3>Unlock company details</h3>
              <p className="unlock-copy">
                Subscribe to access verified company, HR and recruiter information for this
                opportunity.
              </p>
              <button className="unlock-cta" onClick={() => setModalOpen(true)}>
                Subscribe to Unlock <ArrowRight />
              </button>
            </>
          )}
          {unlocked && (
            <h3 className="unlocked-title">Company &amp; Recruiter Details</h3>
          )}
        </div>

        {/* Information body – never blurred as a whole */}
        <div className="company-body-wrapper">
          <div className="company-body">
            <InfoRow
              icon={<Building2 />}
              label="Company Name"
              value={unlocked ? companyData.companyName : MASK}
              locked={!unlocked}
            />
            <InfoRow
              icon={<Globe />}
              label="Company Website"
              value={unlocked ? companyData.website : MASK}
              isLink={unlocked}
              locked={!unlocked}
            />
            <InfoRow
              icon={<Building2 />}
              label="Industry"
              value={unlocked ? companyData.industry : MASK}
              locked={!unlocked}
            />
            <InfoRow
              icon={<MapPin />}
              label="Company Location"
              value={unlocked ? companyData.location : MASK}
              locked={!unlocked}
            />
            <InfoRow
              icon={<User />}
              label="HR / Recruiter Name"
              value={unlocked ? companyData.hrName : MASK}
              locked={!unlocked}
            />
            <InfoRow
              icon={<Mail />}
              label="HR Email"
              value={unlocked ? companyData.hrEmail : MASK}
              isLink={unlocked}
              locked={!unlocked}
            />
            <InfoRow
              icon={<Phone />}
              label="HR Phone Number"
              value={unlocked ? companyData.hrPhone : MASK}
              isLink={unlocked}
              locked={!unlocked}
            />
            <InfoRow
              icon={<Building2 />}
              label="Recruitment Department"
              value={unlocked ? companyData.department : MASK}
              locked={!unlocked}
            />
            <InfoRow
              icon={<User />}
              label="Hiring Manager"
              value={unlocked ? companyData.hiringManager : MASK}
              locked={!unlocked}
            />

           
          </div>
        </div>
      </aside>

      <SubscriptionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubscribe={handleSubscribe}
      />
    </>
  )
}

function InfoRow({
  icon,
  label,
  value,
  isLink,
  locked,
}: {
  icon: React.ReactNode
  label: string
  value: string
  isLink?: boolean
  locked?: boolean
}) {
  const renderValue = () => {
    if (locked) {
      return <strong className="masked-value">{value}</strong>
    }

    if (isLink) {
      if (value.startsWith('http')) {
        return (
          <a href={value} target="_blank" rel="noreferrer">
            {value}
          </a>
        )
      }

      if (value.includes('@')) {
        return <a href={`mailto:${value}`}>{value}</a>
      }

      return (
        <a href={`tel:${value.replace(/\s+/g, '')}`}>
          {value}
        </a>
      )
    }

    return <strong>{value}</strong>
  }

  return (
    <div className="info-row">
      <div className="info-icon">{icon}</div>
      <div className="info-content">
        <span className="info-label">{label}</span>
        <div className="info-value">{renderValue()}</div>
      </div>
    </div>
  )
}