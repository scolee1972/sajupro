import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '사주명리 상담 시스템',
  description: '사주 분석 및 상담 서비스',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}