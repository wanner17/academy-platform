import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Jeong Academy',
  description: 'Multi-tenant academy platform.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
