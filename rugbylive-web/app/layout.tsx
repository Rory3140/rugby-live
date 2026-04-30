import type { Metadata } from 'next'
import { Bebas_Neue, DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'
import Providers from './providers'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'

const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})
const dmMono = DM_Mono({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'RugbyLive — Live Scores & Results',
  description: 'Fast, clean rugby scores. Live fixtures, standings and results from every competition.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebas.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body>
        <Providers>
          <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <div style={{
              flex: 1,
              display: 'flex',
              maxWidth: 1120,
              margin: '0 auto',
              width: '100%',
            }}>
              <Sidebar />
              <main style={{ flex: 1, minWidth: 0, paddingBottom: 80 }} className="md:pb-0">
                {children}
              </main>
            </div>
          </div>
          <MobileNav />
        </Providers>
      </body>
    </html>
  )
}
