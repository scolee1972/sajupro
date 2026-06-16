import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: '명리당 - 30년 경력 명리학 AI 대가의 사주 분석',
  description: '정통 자평명리학 기반 AI 심층 분석. 과거 검증부터 미래 30년 로드맵까지 12장 상세 분석.',
  keywords: '사주, 명리, 사주풀이, 운세, AI 사주, 사주 상담, 궁합, 명리학',
  openGraph: {
    title: '명리당 - AI 사주 분석',
    description: '30년 경력 명리학 대가의 12장 심층 사주 분석',
    type: 'website',
    locale: 'ko_KR',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

// ⭐ Google Analytics 측정 ID (있으면 입력)
const GA_ID = ''  // 예: 'G-XXXXXXXXXX'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        {/* 한국어 폰트 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500;600;700&family=Nanum+Myeongjo:wght@400;700;800&display=swap"
          rel="stylesheet"
        />

        {/* Google Analytics */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body>{children}</body>
    </html>
  )
}