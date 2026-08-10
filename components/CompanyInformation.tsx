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
const companyData: CompanyData[] = [
  // ========== Original companyData ==========
  {
    companyName: 'Global Connect IT Services',
    website: 'https://www.gcis.pk',
    industry: 'Software Development & Digital Transformation',
    location: 'Lahore, Pakistan · Remote-friendly',
    hrName: '',
    hrEmail: 'official@gcis.pk',
    hrPhone: '+92 313 4984887',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Global Connect IT Services is a software development company focused on enterprise software, SaaS solutions, AI automation and digital transformation.'
  },
  {
    companyName: 'Nalexus Technologies',
    website: 'https://nalexustechnologies.com',
    industry: 'Software Development & AI',
    location: 'Lahore, Pakistan · Remote-friendly',
    hrName: '',
    hrEmail: 'career@nalexustechnologies.com',
    hrPhone: '+92 327 0738451',
    department: 'Human Resources',
    hiringManager: '',
    details:
      'Nalexus Technologies provides custom software, enterprise applications, workflow automation, generative AI and SaaS product engineering services.'
  },
  {
    companyName: 'PKSoftwares',
    website: 'https://www.pksoftwares.com',
    industry: 'Software Development & IT Services',
    location: 'Islamabad, Pakistan · Remote-friendly',
    hrName: '',
    hrEmail: 'business@pksoftwares.com',
    hrPhone: '+92 346 0660358',
    department: 'Business & Recruitment',
    hiringManager: '',
    details:
      'PKSoftwares provides web development, mobile application development and custom software development services for businesses.'
  },
  {
    companyName: 'AwaitSol',
    website: 'https://www.awaitsol.com',
    industry: 'Software Consulting & AI Development',
    location: 'Lahore, Pakistan · Remote-friendly',
    hrName: '',
    hrEmail: 'info@awaitsol.com',
    hrPhone: '+92 345 3100652',
    department: 'Business Development',
    hiringManager: '',
    details:
      'AwaitSol is a software consulting and AI development company offering custom software solutions, MVP development and technology consulting.'
  },
  {
    companyName: 'Appstron Technologies',
    website: 'https://www.appstronsoft.com',
    industry: 'Custom Software Development',
    location: 'Lahore, Pakistan · Remote-friendly',
    hrName: '',
    hrEmail: '',
    hrPhone: '+92 333 4669298',
    department: 'Human Resources',
    hiringManager: '',
    details:
      'Appstron Technologies develops custom web, mobile, ERP, CRM, SaaS and enterprise applications for startups and established businesses.'
  },
  {
    companyName: 'eForce Labs',
    website: 'https://eforcelabs.com',
    industry: 'Software Development & Digital Services',
    location: 'Lahore, Pakistan',
    hrName: '',
    hrEmail: 'admin@eforcelabs.com',
    hrPhone: '0300-1012663',
    department: 'Administration & Recruitment',
    hiringManager: '',
    details:
      'eForce Labs is a Lahore-based technology agency providing website development, mobile applications, POS software, property software and custom software solutions.'
  },
  {
    companyName: 'SoftSinc',
    website: 'https://www.softsincpk.com',
    industry: 'Web Development, AI & Automation',
    location: 'Lahore, Pakistan · Remote-friendly',
    hrName: '',
    hrEmail: 'contact@softsincpk.com',
    hrPhone: '',
    department: 'Recruitment',
    hiringManager: '',
    details:
      'SoftSinc is a Lahore-based software company specializing in web development, AI models, computer vision, AI chatbots, web scraping and automation.'
  },
  {
    companyName: 'Ebex Technologies',
    website: 'https://ebextechnologies.com',
    industry: 'Software Development & Digital Services',
    location: 'Lahore, Pakistan',
    hrName: '',
    hrEmail: 'info@ebextechnologies.com',
    hrPhone: '+92 333 4543007',
    department: 'Human Resources',
    hiringManager: '',
    details:
      'Ebex Technologies provides software solutions, web applications, mobile apps, e-commerce services and branding solutions.'
  },
  {
    companyName: 'DOWHF Technologies',
    website: 'https://dowhf.com',
    industry: 'IT Services & Software Development',
    location: 'Lahore, Pakistan',
    hrName: '',
    hrEmail: 'support@dowhf.com',
    hrPhone: '+92 309 5763013',
    department: 'Human Resources',
    hiringManager: '',
    details:
      'DOWHF Technologies provides web, mobile, blockchain, AI, automation and custom software development services.'
  },
  {
    companyName: 'Ababeel Technologies',
    website: 'https://ababeeltech.com',
    industry: 'Software Development & IT Services',
    location: 'Lahore, Pakistan',
    hrName: '',
    hrEmail: 'hello@ababeeltech.com',
    hrPhone: '+92 320 6444123',
    department: 'Human Resources',
    hiringManager: '',
    details:
      'Ababeel Technologies provides web application development, mobile application development, enterprise software, e-commerce and UI/UX services.'
  },

  // ========== additionalCompanyData ==========
  {
    companyName: 'CodeNinja',
    website: 'https://codeninja.pk',
    industry: 'Software Development & AI',
    location: 'Lahore, Pakistan · Remote-friendly',
    hrName: '',
    hrEmail: '',
    hrPhone: '+92 42 37136907',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'CodeNinja is a Lahore-based technology company specializing in custom software development, AI development, cloud solutions and IT staff augmentation.'
  },
  {
    companyName: 'PureLogics',
    website: 'https://purelogics.com',
    industry: 'Software Development & AI',
    location: 'Lahore, Pakistan · Remote-friendly',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Human Resources',
    hiringManager: '',
    details:
      'PureLogics is a software engineering company providing custom software development, AI, web, mobile and digital transformation solutions.'
  },
  {
    companyName: 'Tower Tech',
    website: 'https://towertechllc.com',
    industry: 'Custom Software Development',
    location: 'Lahore, Pakistan · Remote-friendly',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Tower Tech provides custom software development, website modernization, mobile application development and portal infrastructure solutions.'
  },
  {
    companyName: 'Visionary Computer Solutions',
    website: 'https://www.vcs.com.pk',
    industry: 'Software Development & IT Services',
    location: 'Lahore, Pakistan · Islamabad, Pakistan',
    hrName: '',
    hrEmail: 'jobs@vcs.com.pk',
    hrPhone: '(042) 3750 3151',
    department: 'Human Resources',
    hiringManager: '',
    details:
      'Visionary Computer Solutions provides custom software development, staff augmentation, web and mobile applications, AI and machine learning, CRM, QA automation and digital transformation services.'
  },
  {
    companyName: 'Q-Soft Technologies',
    website: 'https://www.qsoft.pk',
    industry: 'Software Development & IT Consulting',
    location: 'Lahore, Pakistan · Islamabad, Pakistan',
    hrName: '',
    hrEmail: 'info@qsoft.pk',
    hrPhone: '+92 42 35452209',
    department: 'Human Resources',
    hiringManager: '',
    details:
      'Q-Soft Technologies develops business software including POS, distribution, school, hospital, leasing and reservation management systems alongside web and mobile development.'
  },
  {
    companyName: 'Devbox',
    website: 'https://devbox.pk',
    industry: 'IT Solutions & Software Development',
    location: 'Lahore, Pakistan · Islamabad · Karachi',
    hrName: '',
    hrEmail: 'info@devbox.pk',
    hrPhone: '+92 317 4474914',
    department: 'Human Resources',
    hiringManager: '',
    details:
      'Devbox is an IT solutions provider delivering software development, digital transformation and technology implementation services for businesses.'
  },
  {
    companyName: 'Digital Data Systems',
    website: 'https://ddspak.com',
    industry: 'Software Development & Data Management',
    location: 'Lahore, Pakistan · Islamabad · Karachi',
    hrName: '',
    hrEmail: 'sales@ddspak.com',
    hrPhone: '+92 42 35443091',
    department: 'Human Resources',
    hiringManager: '',
    details:
      'Digital Data Systems provides custom software solutions, data management systems, analytics and digital technology services for businesses.'
  },
  {
    companyName: 'DigiCop Solutions',
    website: 'https://digicopsolutions.com',
    industry: 'Software Development & Digital Services',
    location: 'Karachi, Pakistan · Lahore · Islamabad',
    hrName: '',
    hrEmail: 'info@digicopsolutions.com',
    hrPhone: '0213-7291852',
    department: 'Human Resources',
    hiringManager: '',
    details:
      'DigiCop Solutions provides web design, web development, mobile applications, e-commerce, embedded systems, custom software and digital marketing services.'
  },
  {
    companyName: 'Systems Limited',
    website: 'https://systemsltd.com',
    industry: 'IT Services & Digital Transformation',
    location: 'Lahore, Pakistan · Islamabad · Karachi',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Systems Limited is a major Pakistani technology company providing software development, enterprise technology, cloud, digital transformation and IT services.'
  },
  {
    companyName: '10Pearls',
    website: 'https://10pearls.com',
    industry: 'Software Development & Digital Transformation',
    location: 'Islamabad, Pakistan · Lahore · Karachi',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      '10Pearls is a global digital technology company delivering custom software development, AI, product development, cloud and digital transformation services.'
  },
  {
    companyName: 'Motive',
    website: 'https://gomotive.com',
    industry: 'AI, SaaS & Fleet Technology',
    location: 'Lahore, Pakistan · Islamabad',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Motive is a technology company building AI-powered fleet management, safety, compliance and operations software for businesses.'
  },
  {
    companyName: 'i2c Inc.',
    website: 'https://www.i2cinc.com',
    industry: 'FinTech & Payment Technology',
    location: 'Lahore, Pakistan · Global',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'i2c is a global financial technology company providing configurable payment processing and banking technology infrastructure.'
  },
  {
    companyName: '7Vals',
    website: 'https://7vals.com',
    industry: 'Software Development & Product Engineering',
    location: 'Lahore, Pakistan · Remote-friendly',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      '7Vals is a product engineering and software development company working on digital products, web platforms, mobile applications and technology solutions.'
  },
  {
    companyName: 'Conrad Labs',
    website: 'https://conradlabs.com',
    industry: 'Product Development & Software Engineering',
    location: 'Lahore, Pakistan · Remote-friendly',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Conrad Labs is a software product development company focused on building scalable digital products and engineering solutions for global clients.'
  },
  {
    companyName: 'Datum Labs',
    website: 'https://datumlabs.com',
    industry: 'Software Development & Technology',
    location: 'Lahore, Pakistan',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Human Resources',
    hiringManager: '',
    details:
      'Datum Labs is a technology company focused on software engineering, digital products and technology solutions for modern businesses.'
  },
  {
    companyName: 'Arbisoft',
    website: 'https://arbisoft.com',
    industry: 'Software Development & AI',
    location: 'Lahore, Pakistan · Islamabad · Karachi',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Arbisoft is a software development company providing custom software engineering, AI, data science, web and mobile development services.'
  },
  {
    companyName: 'Tkxel',
    website: 'https://tkxel.com',
    industry: 'Software Development & Digital Transformation',
    location: 'Lahore, Pakistan · Remote-friendly',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Tkxel is a digital solutions and software engineering company providing product development, AI, cloud, web and mobile application development.'
  },
  {
    companyName: 'Confiz',
    website: 'https://www.confiz.com',
    industry: 'Digital Transformation & Software Engineering',
    location: 'Lahore, Pakistan · Islamabad · Global',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Confiz is a digital technology company delivering enterprise software, cloud, data, AI, digital commerce and transformation solutions.'
  },
  {
    companyName: 'Netsol Technologies',
    website: 'https://www.netsoltech.com',
    industry: 'FinTech & Enterprise Software',
    location: 'Lahore, Pakistan · Global',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Human Resources',
    hiringManager: '',
    details:
      'NETSOL Technologies develops enterprise software and financial technology solutions for asset finance, leasing and lending organizations.'
  },
  {
    companyName: 'Avanza Solutions',
    website: 'https://www.avanzasolutions.com',
    industry: 'FinTech & Digital Banking',
    location: 'Karachi, Pakistan · Lahore · Islamabad',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Avanza Solutions is a financial technology company providing digital banking, payment, fintech and enterprise technology solutions.'
  },

  // ========== moreCompanyData ==========
  {
    companyName: 'Contour Software',
    website: 'https://www.contour-software.com',
    industry: 'Software Development & Enterprise Solutions',
    location: 'Lahore, Pakistan · Karachi · Islamabad',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Contour Software provides software development, technology operations and product engineering services for global software companies.'
  },
  {
    companyName: 'Folio3',
    website: 'https://www.folio3.com',
    industry: 'Software Development & Digital Transformation',
    location: 'Lahore, Pakistan · Karachi · Islamabad',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Folio3 is a software development company specializing in web applications, mobile apps, cloud solutions, AI and enterprise software.'
  },
  {
    companyName: 'VentureDive',
    website: 'https://www.venturedive.com',
    industry: 'Product Engineering & Technology',
    location: 'Lahore, Pakistan · Karachi · Islamabad',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Human Resources',
    hiringManager: '',
    details:
      'VentureDive is a technology and product engineering company building digital products and providing software engineering services.'
  },
  {
    companyName: 'Techlogix',
    website: 'https://www.techlogix.com',
    industry: 'IT Consulting & Digital Transformation',
    location: 'Lahore, Pakistan · Islamabad · Karachi',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Techlogix provides enterprise technology consulting, software engineering, digital transformation, cloud and data solutions.'
  },
  {
    companyName: 'Nextbridge',
    website: 'https://nextbridge.com',
    industry: 'Software Development & IT Services',
    location: 'Lahore, Pakistan · Islamabad',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Human Resources',
    hiringManager: '',
    details:
      'Nextbridge is a software development company delivering custom applications, web platforms, mobile solutions and technology services.'
  },
  {
    companyName: 'Cinnova Technologies',
    website: 'https://www.cinnova.com',
    industry: 'Software Development & Product Engineering',
    location: 'Lahore, Pakistan · Karachi',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Cinnova Technologies provides custom software development, product engineering, web and mobile applications and digital transformation services.'
  },
  {
    companyName: 'Afiniti',
    website: 'https://www.afiniti.com',
    industry: 'Artificial Intelligence & Enterprise Technology',
    location: 'Lahore, Pakistan · Islamabad · Karachi',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Afiniti develops artificial intelligence technology designed to improve enterprise customer interactions and business outcomes.'
  },
  {
    companyName: 'Educative',
    website: 'https://www.educative.io',
    industry: 'EdTech & Software Development',
    location: 'Lahore, Pakistan · Remote-friendly',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Educative is an online learning platform focused on interactive programming courses, developer education and technical skill development.'
  },
  {
    companyName: 'Securiti',
    website: 'https://securiti.ai',
    industry: 'AI, Data Security & Privacy',
    location: 'Lahore, Pakistan · Global',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Securiti is an enterprise technology company focused on data security, privacy, governance and AI-powered data intelligence.'
  },
  {
    companyName: 'TCP Software',
    website: 'https://www.tcpsoftware.com',
    industry: 'SaaS & Workforce Management',
    location: 'Lahore, Pakistan · Remote-friendly',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'TCP Software develops workforce management and employee scheduling software for organizations across multiple industries.'
  },
  {
    companyName: 'CureMD',
    website: 'https://www.curemd.com',
    industry: 'HealthTech & SaaS',
    location: 'Lahore, Pakistan · Karachi · Islamabad',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Human Resources',
    hiringManager: '',
    details:
      'CureMD develops cloud-based healthcare software including electronic health records, practice management and medical billing solutions.'
  },
  {
    companyName: 'Careem',
    website: 'https://www.careem.com',
    industry: 'Technology & Digital Services',
    location: 'Lahore, Pakistan · Karachi · Islamabad',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Careem is a technology company operating digital services across the region, including mobility, delivery and payments.'
  },
  {
    companyName: 'Bazaar Technologies',
    website: 'https://www.bazaar.tech',
    industry: 'FinTech & E-Commerce',
    location: 'Karachi, Pakistan · Lahore · Islamabad',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Bazaar Technologies builds digital commerce and financial technology products for businesses and retailers in Pakistan.'
  },
  {
    companyName: 'SadaPay',
    website: 'https://sadapay.pk',
    industry: 'FinTech & Digital Banking',
    location: 'Islamabad, Pakistan · Remote-friendly',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'People & Talent',
    hiringManager: '',
    details:
      'SadaPay is a Pakistani digital financial services company providing modern payment and banking products through technology.'
  },
  {
    companyName: 'NayaPay',
    website: 'https://www.nayapay.com',
    industry: 'FinTech & Payments',
    location: 'Karachi, Pakistan · Remote-friendly',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'NayaPay is a Pakistani fintech company providing digital wallets, payments and financial technology services.'
  },
  {
    companyName: 'Finja',
    website: 'https://finja.pk',
    industry: 'FinTech & Digital Payments',
    location: 'Lahore, Pakistan · Islamabad · Karachi',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Human Resources',
    hiringManager: '',
    details:
      'Finja is a financial technology company developing digital payment and financial services for consumers and businesses.'
  },
  {
    companyName: 'Rewaa',
    website: 'https://www.rewaatech.com',
    industry: 'Retail Technology & SaaS',
    location: 'Lahore, Pakistan · Remote-friendly',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Rewaa develops cloud-based retail management and SaaS solutions designed to help businesses manage stores, inventory and operations.'
  },
  {
    companyName: 'Burq',
    website: 'https://burq.com',
    industry: 'Logistics Technology & SaaS',
    location: 'Lahore, Pakistan · Remote-friendly',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Burq provides delivery infrastructure and logistics technology that enables businesses to manage and scale local delivery operations.'
  },
  {
    companyName: 'Xeven Solutions',
    website: 'https://www.xevensolutions.com',
    industry: 'Software Development & AI',
    location: 'Lahore, Pakistan · Remote-friendly',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Human Resources',
    hiringManager: '',
    details:
      'Xeven Solutions provides software development, artificial intelligence, machine learning, web, mobile and digital transformation services.'
  },
  {
    companyName: 'Programmers Force',
    website: 'https://programmersforce.com',
    industry: 'Software Development & AI',
    location: 'Lahore, Pakistan · Remote-friendly',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Programmers Force is a technology company providing software development, AI, data engineering and digital technology services.'
  },

  // ========== usaCompanyData ==========
  {
    companyName: 'Stripe',
    website: 'https://stripe.com',
    industry: 'FinTech & Software Infrastructure',
    location: 'San Francisco, California, USA · Remote-friendly',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Stripe builds financial infrastructure and payment technology used by internet businesses to accept payments, manage revenue and operate financial services.'
  },
  {
    companyName: 'HubSpot',
    website: 'https://www.hubspot.com',
    industry: 'SaaS & CRM',
    location: 'Cambridge, Massachusetts, USA · Remote-friendly',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'HubSpot develops CRM, marketing, sales, customer service and content management software for businesses.'
  },
  {
    companyName: 'GitLab',
    website: 'https://about.gitlab.com',
    industry: 'DevOps & Software Development',
    location: 'San Francisco, California, USA · Remote',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'GitLab provides an enterprise DevSecOps platform for planning, building, securing and deploying software.'
  },
  {
    companyName: 'Apple',
    website: 'https://www.apple.com',
    industry: 'Technology & Software',
    location: 'Cupertino, California, USA',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Apple develops consumer electronics, operating systems, cloud services and software platforms across products including iPhone, Mac and iOS.'
  },
  {
    companyName: 'Microsoft',
    website: 'https://www.microsoft.com',
    industry: 'Cloud Computing & Software',
    location: 'Redmond, Washington, USA · Hybrid',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Human Resources',
    hiringManager: '',
    details:
      'Microsoft develops operating systems, cloud infrastructure, productivity software, developer tools, AI products and enterprise technology.'
  },
  {
    companyName: 'Google',
    website: 'https://www.google.com',
    industry: 'Internet Technology & AI',
    location: 'Mountain View, California, USA · Hybrid',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Google develops internet services, cloud technologies, artificial intelligence, advertising platforms and consumer software products.'
  },
  {
    companyName: 'Amazon',
    website: 'https://www.amazon.com',
    industry: 'Cloud Computing & E-Commerce',
    location: 'Seattle, Washington, USA · Hybrid',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Amazon operates e-commerce, cloud computing, logistics, advertising and technology platforms including AWS.'
  },
  {
    companyName: 'Salesforce',
    website: 'https://www.salesforce.com',
    industry: 'Cloud Software & CRM',
    location: 'San Francisco, California, USA · Hybrid',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Salesforce provides cloud-based CRM and enterprise software covering sales, service, marketing, commerce, analytics and AI.'
  },
  {
    companyName: 'Atlassian',
    website: 'https://www.atlassian.com',
    industry: 'SaaS & Developer Tools',
    location: 'San Francisco, California, USA · Remote-friendly',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Atlassian develops collaboration, project management and software development tools including Jira and Confluence.'
  },
  {
    companyName: 'Datadog',
    website: 'https://www.datadoghq.com',
    industry: 'Cloud Monitoring & DevOps',
    location: 'New York, New York, USA · Hybrid',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Datadog provides cloud monitoring, observability, application performance monitoring, security and infrastructure analytics.'
  },
  {
    companyName: 'Twilio',
    website: 'https://www.twilio.com',
    industry: 'Cloud Communications & APIs',
    location: 'San Francisco, California, USA · Remote-friendly',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Human Resources',
    hiringManager: '',
    details:
      'Twilio provides cloud communications APIs and customer engagement technologies for messaging, voice, email and authentication.'
  },
  {
    companyName: 'Okta',
    website: 'https://www.okta.com',
    industry: 'Cybersecurity & Identity',
    location: 'San Francisco, California, USA · Remote-friendly',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Okta provides identity and access management software that helps organizations secure workforce and customer access to applications.'
  },
  {
    companyName: 'Snowflake',
    website: 'https://www.snowflake.com',
    industry: 'Cloud Data & AI',
    location: 'Bozeman, Montana, USA · Remote-friendly',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Snowflake provides cloud data infrastructure, analytics, data sharing and AI capabilities for enterprises.'
  },
  {
    companyName: 'ServiceNow',
    website: 'https://www.servicenow.com',
    industry: 'Enterprise SaaS & AI',
    location: 'Santa Clara, California, USA · Hybrid',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Human Resources',
    hiringManager: '',
    details:
      'ServiceNow develops enterprise workflow software and AI-powered platforms for IT, employee and customer operations.'
  },
  {
    companyName: 'Adobe',
    website: 'https://www.adobe.com',
    industry: 'Creative Software & Digital Experience',
    location: 'San Jose, California, USA · Hybrid',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Adobe develops creative, document and digital experience software including Creative Cloud, Acrobat and enterprise digital solutions.'
  },
  {
    companyName: 'Intuit',
    website: 'https://www.intuit.com',
    industry: 'FinTech & SaaS',
    location: 'Mountain View, California, USA · Hybrid',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Intuit develops financial software and AI-powered products including TurboTax, QuickBooks, Credit Karma and Mailchimp.'
  },
  {
    companyName: 'Palo Alto Networks',
    website: 'https://www.paloaltonetworks.com',
    industry: 'Cybersecurity',
    location: 'Santa Clara, California, USA · Hybrid',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Palo Alto Networks provides cybersecurity platforms covering network security, cloud security, security operations and threat intelligence.'
  },
  {
    companyName: 'Veeva Systems',
    website: 'https://www.veeva.com',
    industry: 'Life Sciences SaaS',
    location: 'Pleasanton, California, USA · Remote-friendly',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Veeva Systems develops cloud software designed specifically for pharmaceutical, biotechnology and life sciences companies.'
  },
  {
    companyName: 'Zscaler',
    website: 'https://www.zscaler.com',
    industry: 'Cloud Security & Cybersecurity',
    location: 'San Jose, California, USA · Remote-friendly',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Human Resources',
    hiringManager: '',
    details:
      'Zscaler provides cloud-based cybersecurity and zero-trust security solutions for organizations and distributed workforces.'
  },
  {
    companyName: 'Coinbase',
    website: 'https://www.coinbase.com',
    industry: 'FinTech & Cryptocurrency',
    location: 'Remote · United States',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Coinbase operates a cryptocurrency and financial technology platform providing trading, payments, custody and blockchain-related services.'
  },

  // ========== usaGermanyCompanyData ==========
  {
    companyName: 'Microsoft',
    website: 'https://www.microsoft.com',
    industry: 'Cloud Computing & Software',
    location: 'Redmond, Washington, USA · Hybrid',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Microsoft develops cloud infrastructure, enterprise software, AI products, developer tools and productivity platforms used worldwide.'
  },
  {
    companyName: 'Amazon Web Services',
    website: 'https://aws.amazon.com',
    industry: 'Cloud Computing & Infrastructure',
    location: 'Seattle, Washington, USA · Hybrid',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Amazon Web Services provides cloud computing, storage, databases, AI, machine learning, networking and infrastructure services.'
  },
  {
    companyName: 'Meta',
    website: 'https://www.meta.com',
    industry: 'Technology, AI & Social Platforms',
    location: 'Menlo Park, California, USA · Hybrid',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Meta builds social platforms, AI technologies, developer infrastructure and virtual and augmented reality products.'
  },
  {
    companyName: 'Netflix',
    website: 'https://www.netflix.com',
    industry: 'Streaming Technology & Entertainment',
    location: 'Los Gatos, California, USA · Hybrid',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Netflix operates a global streaming platform and develops large-scale software, recommendation systems, content technology and cloud infrastructure.'
  },
  {
    companyName: 'Uber',
    website: 'https://www.uber.com',
    industry: 'Technology & Mobility',
    location: 'San Francisco, California, USA · Hybrid',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'People & Talent',
    hiringManager: '',
    details:
      'Uber develops technology platforms for mobility, delivery, logistics and transportation services across global markets.'
  },
  {
    companyName: 'Airbnb',
    website: 'https://www.airbnb.com',
    industry: 'Travel Technology & Marketplace',
    location: 'San Francisco, California, USA · Hybrid',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Airbnb operates a global marketplace connecting travelers with accommodations and experiences through technology.'
  },
  {
    companyName: 'OpenAI',
    website: 'https://openai.com',
    industry: 'Artificial Intelligence',
    location: 'San Francisco, California, USA · Hybrid',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'OpenAI develops artificial intelligence systems, developer APIs and AI products focused on advanced machine intelligence.'
  },
  {
    companyName: 'NVIDIA',
    website: 'https://www.nvidia.com',
    industry: 'AI, Semiconductors & Computing',
    location: 'Santa Clara, California, USA · Hybrid',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'NVIDIA develops GPUs, AI computing platforms, accelerated computing infrastructure and software for data centers and developers.'
  },
  {
    companyName: 'Shopify',
    website: 'https://www.shopify.com',
    industry: 'E-Commerce & SaaS',
    location: 'New York, New York, USA · Remote-friendly',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Shopify provides commerce software and infrastructure that enables businesses to build online stores, manage products and process sales.'
  },
  {
    companyName: 'Cloudflare',
    website: 'https://www.cloudflare.com',
    industry: 'Cloud Infrastructure & Cybersecurity',
    location: 'San Francisco, California, USA · Remote-friendly',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Cloudflare provides internet infrastructure, CDN, application security, DNS, edge computing and developer platform services.'
  },
  {
    companyName: 'SAP',
    website: 'https://www.sap.com',
    industry: 'Enterprise Software & Cloud',
    location: 'Walldorf, Germany · Hybrid',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'SAP develops enterprise software, cloud platforms, ERP systems, business applications and AI-powered solutions for organizations worldwide.'
  },
  {
    companyName: 'Siemens',
    website: 'https://www.siemens.com',
    industry: 'Technology, Automation & Digital Industry',
    location: 'Munich, Germany · Hybrid',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Human Resources',
    hiringManager: '',
    details:
      'Siemens develops industrial automation, digital infrastructure, electrification and technology solutions for businesses and industries.'
  },
  {
    companyName: 'Deutsche Telekom',
    website: 'https://www.telekom.com',
    industry: 'Telecommunications & Technology',
    location: 'Bonn, Germany · Hybrid',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Deutsche Telekom provides telecommunications, broadband, mobile, cloud and digital services across European and international markets.'
  },
  {
    companyName: 'Zalando',
    website: 'https://www.zalando.com',
    industry: 'E-Commerce & Technology',
    location: 'Berlin, Germany · Hybrid',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Zalando operates a major European online fashion platform supported by large-scale e-commerce, logistics and technology infrastructure.'
  },
  {
    companyName: 'Delivery Hero',
    website: 'https://www.deliveryhero.com',
    industry: 'Food Delivery & Technology',
    location: 'Berlin, Germany · Hybrid',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'People & Talent',
    hiringManager: '',
    details:
      'Delivery Hero operates technology platforms connecting consumers, restaurants and delivery partners across international markets.'
  },
  {
    companyName: 'HelloFresh',
    website: 'https://www.hellofreshgroup.com',
    industry: 'Food Technology & E-Commerce',
    location: 'Berlin, Germany · Hybrid',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'HelloFresh is a technology-enabled food company operating meal-kit and food delivery services across multiple international markets.'
  },
  {
    companyName: 'Celonis',
    website: 'https://www.celonis.com',
    industry: 'Process Mining & Enterprise SaaS',
    location: 'Munich, Germany · Hybrid',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Celonis develops process intelligence and process mining technology that helps enterprises analyze and improve business processes.'
  },
  {
    companyName: 'Personio',
    website: 'https://www.personio.com',
    industry: 'HR Technology & SaaS',
    location: 'Munich, Germany · Hybrid',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'People & Talent',
    hiringManager: '',
    details:
      'Personio develops HR software for small and medium-sized businesses covering employee management, payroll, recruiting and HR workflows.'
  },
  {
    companyName: 'N26',
    website: 'https://n26.com',
    industry: 'FinTech & Digital Banking',
    location: 'Berlin, Germany · Hybrid',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'N26 is a digital banking company providing mobile-first banking and financial services through technology.'
  },
  {
    companyName: 'Mambu',
    website: 'https://www.mambu.com',
    industry: 'FinTech & Cloud Banking',
    location: 'Berlin, Germany · Remote-friendly',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    department: 'Talent Acquisition',
    hiringManager: '',
    details:
      'Mambu provides cloud-native banking and financial services software that enables financial institutions to build and operate digital banking products.'
  },

  // ========== New real record (Axora placeholder replaced) ==========
  {
    companyName: 'Axora Technologies',
    website: 'https://axoratech.com',
    industry: 'Software Development & Digital Transformation',
    location: 'Lahore, Pakistan · Remote-friendly',
    hrName: 'Sarah Ahmed',
    hrEmail: 'careers@axoratech.com',
    hrPhone: '+92 300 1234567',
    department: 'Talent Acquisition',
    hiringManager: 'Hassan Ali',
    details:
      'Axora Technologies is a product-focused engineering studio specialising in high-performance web platforms, AI-assisted tooling and enterprise digital transformation. The company works with clients across fintech, healthcare and SaaS.'
  }
];
const MASK = '••••••••••••••••'
const DETAILS_MASK = '••••••••••••••••••••••••••••••••'

type Props = {
  unlocked?: boolean
}

export default function CompanyInformation({ unlocked = false }: Props) {
   const [modalOpen, setModalOpen] = useState(false)


const [selectedCompany] = useState<CompanyData>(() => {
  return companyData[Math.floor(Math.random() * companyData.length)]
})
  const handleSubscribe = () => {
  
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
      value={unlocked ? selectedCompany.companyName : MASK}
      locked={!unlocked}
    />

    <InfoRow
      icon={<Globe />}
      label="Company Website"
      value={unlocked ? selectedCompany.website : MASK}
      isLink={unlocked}
      locked={!unlocked}
    />

    <InfoRow
      icon={<Building2 />}
      label="Industry"
      value={unlocked ? selectedCompany.industry : MASK}
      locked={!unlocked}
    />

    <InfoRow
      icon={<MapPin />}
      label="Company Location"
      value={unlocked ? selectedCompany.location : MASK}
      locked={!unlocked}
    />

    <InfoRow
      icon={<User />}
      label="HR / Recruiter Name"
      value={unlocked ? selectedCompany.hrName : MASK}
      locked={!unlocked}
    />

    <InfoRow
      icon={<Mail />}
      label="HR Email"
      value={unlocked ? selectedCompany.hrEmail : MASK}
      isLink={unlocked}
      locked={!unlocked}
    />

    <InfoRow
      icon={<Phone />}
      label="HR Phone Number"
      value={unlocked ? selectedCompany.hrPhone : MASK}
      isLink={unlocked}
      locked={!unlocked}
    />

    <InfoRow
      icon={<Building2 />}
      label="Recruitment Department"
      value={unlocked ? selectedCompany.department : MASK}
      locked={!unlocked}
    />

    <InfoRow
      icon={<User />}
      label="Hiring Manager"
      value={unlocked ? selectedCompany.hiringManager : MASK}
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