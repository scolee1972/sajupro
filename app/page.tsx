import Link from 'next/link'

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a2744',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ textAlign: 'center', color: 'white', maxWidth: '600px' }}>
        
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>🔮</div>
        
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '12px' }}>
          사주명리 프리미엄 상담
        </h1>
        
        <p style={{ color: '#93c5fd', fontSize: '18px', marginBottom: '40px' }}>
          자평명리학 기반 정밀 사주 분석 서비스
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          
          <Link href="/admin" style={{
            background: '#c9a84c',
            color: 'white',
            padding: '16px 32px',
            borderRadius: '16px',
            textDecoration: 'none',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            🔮 상담 시작하기
          </Link>

        </div>

        <div style={{
          marginTop: '40px',
          padding: '20px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '16px',
          fontSize: '14px',
          color: '#93c5fd'
        }}>
          ✨ 출생지 시간 보정 · AI 분석 · 전문가 상담
        </div>

      </div>
    </div>
  )
}