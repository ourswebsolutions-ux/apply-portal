import { Analytics } from '@vercel/analytics/next'
import { Inter } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Apply for the Position | Axora Web Solutions',
  description: 'Submit your application and CV for the Senior Full Stack Developer opportunity at Axora Web Solutions.',
  generator: 'Axora Web Solutions',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className={`${inter.variable} antialiased`}>
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

        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
