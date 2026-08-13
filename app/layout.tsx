import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Slovensko – Slowenisch lernen',
  description: 'Aktives Slowenischlernen für deutschsprachige Anfänger'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="de"><body>{children}</body></html>
}
