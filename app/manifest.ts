import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Slovensko – Slowenisch lernen',
    short_name: 'Slovensko',
    description: 'Professionelles Slowenischlernen mit Wortschatz, Grammatik, Hören, Sprechen und Wiederholungen.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#0f172a',
    orientation: 'portrait-primary',
    lang: 'de',
    categories: ['education'],
    icons: [
      { src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
    ],
  }
}
