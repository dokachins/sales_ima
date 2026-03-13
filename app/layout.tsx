import type { Metadata } from 'next'
import { Geist, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const spaceGrotesk = Space_Grotesk({
  weight: '700',
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Scout',
  description: '新規顧客開拓向け営業支援アプリ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${geist.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors />
      </body>
    </html>
  )
}
