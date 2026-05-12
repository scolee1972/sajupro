'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const RELATIONSHIP_KO: Record<string, string> = {
  couple: '💕 연인', married: '💍 부부', family: '👨‍👩 가족',
  friend: '🤝 친구', colleague: '💼 직장동료', business: '🚀 사업파트너',
  parent_child: '👶 부모-자녀', siblings: '👬 형제자매',
}

export default function CompatibilityResultPage() {
  const params = useParams()
  const id = params?.id as string

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) load()
  }, [id])

  async function load() {
    const { data: result } = await supabase
      .from('compatibility_readings')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    setData(result)
    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f1f5f9',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>☯️</div>
          <p>궁합 분석 결과 로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <p>결과를 찾을 수 없습니다.</p>
        <Link href="/admin">← 관리자로</Link>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f1f5f9',
      padding: '20px',
      fontFamily: 'sans-serif',
    }}>

      {/* 상단 */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto 20px',
        display: 'flex',
        gap: '10px',
      }}>
        <Link href="/admin" style={{
          background: '#1a2744', color: 'white',
          padding: '10px 20px', borderRadius: '10px',
          textDecoration: 'none', fontWeight: 'bold', fontSize: '14px',
        }}>
          ← 관리자
        </Link>
        <Link href="/admin/compatibility" style={{
          background: '#ec4899', color: 'white',
          padding: '10px 20px', borderRadius: '10px',
          textDecoration: 'none', fontWeight: 'bold', fontSize: '14px',
        }}>
          ☯️ 새 궁합
        </Link>
        <button
          onClick={() => window.print()}
          style={{
            background: '#2d6a4f', color: 'white',
            padding: '10px 20px', borderRadius: '10px',
            border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
          }}
        >
          🖨️ 인쇄/PDF
        </button>
      </div>

      {/* 두 사람 카드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 80px 1fr',
        gap: '16px',
        maxWidth: '900px',
        margin: '0 auto 20px',
        alignItems: 'center',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
          color: 'white',
          padding: '20px',
          borderRadius: '16px',
        }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>
            {data.person1_gender === 'male' ? '👨' : '👩'} {data.person1_name}
          </h3>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>
            <div>🎂 {data.person1_birth_date}</div>
            <div>⏰ {data.person1_birth_time}</div>
            <div>📍 {data.person1_birth_city}</div>
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          fontSize: '40px',
        }}>
          ☯️
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #ec4899, #be185d)',
          color: 'white',
          padding: '20px',
          borderRadius: '16px',
        }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>
            {data.person2_gender === 'male' ? '👨' : '👩'} {data.person2_name}
          </h3>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>
            <div>🎂 {data.person2_birth_date}</div>
            <div>⏰ {data.person2_birth_time}</div>
            <div>📍 {data.person2_birth_city}</div>
          </div>
        </div>
      </div>

      {/* 관계 정보 */}
      <div style={{
        background: '#1a2744',
        color: 'white',
        padding: '16px',
        borderRadius: '12px',
        maxWidth: '900px',
        margin: '0 auto 20px',
        textAlign: 'center',
      }}>
        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
          관계: {RELATIONSHIP_KO[data.relationship_type]}
        </span>
        {data.question && (
          <div style={{
            marginTop: '10px',
            fontSize: '13px',
            color: '#93c5fd',
          }}>
            💬 {data.question}
          </div>
        )}
      </div>

      {/* 보고서 */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        lineHeight: '1.8',
        fontSize: '16px',
        maxWidth: '900px',
        margin: '0 auto 40px',
      }}>
        <div dangerouslySetInnerHTML={{ __html: data.report_html }} />
      </div>

    </div>
  )
}