import type { Metadata, Viewport } from 'next'
import AccountGate from '@/components/AccountGate'
import OnboardingGate from '@/components/OnboardingGate'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Slovensko – Slowenisch lernen',
    template: '%s · Slovensko',
  },
  description: 'Aktives Slowenischlernen mit Wortschatz, Grammatik, Hören, Sprechen und gezielten Wiederholungen.',
  applicationName: 'Slovensko',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '192x192', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'Slovensko',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0f172a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="de"><body><AccountGate><OnboardingGate>{children}</OnboardingGate></AccountGate></body></html>
}
