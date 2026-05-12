'use client'

import { useEffect, useState } from 'react'
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

export default function CompatibilityListPage() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabase
      .from('compatibility_readings')
      .select('*')
      .order('created_at', { ascending: false })

    setList(data || [])
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f1f5f9',
      padding: '30px 20px',
      fontFamily: 'sans-serif',
    }}>

      <div style={{ maxWidth: '900px', margin: '0 auto 16px' }}>
        <Link href="/admin" style={{
          color: '#1a2744', textDecoration: 'none',
          fontSize: '14px', fontWeight: 'bold',
        }}>
          ← 관리자 메인으로
        </Link>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #ec4899, #be185d)',
        color: 'white',
        padding: '24px',
        borderRadius: '16px',
        maxWidth: '900px',
        margin: '0 auto 20px',
      }}>
        <h1 style={{ margin: 0, fontSize: '22px' }}>📊 궁합 분석 이력</h1>
        <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>
          전체 {list.length}건의 궁합 분석
        </p>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
        ) : list.length === 0 ? (
          <div style={{
            background: 'white',
            padding: '60px 20px',
            borderRadius: '16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              아직 궁합 분석 이력이 없습니다
            </p>
            <Link href="/admin/compatibility" style={{
              background: '#ec4899',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 'bold',
            }}>
              첫 궁합 분석 시작
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {list.map(item => (
              <Link
                key={item.id}
                href={`/admin/compatibility/result/${item.id}`}
                style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#1a2744',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontSize: '17px', fontWeight: 'bold', marginBottom: '6px' }}>
                    ☯️ {item.person1_name} & {item.person2_name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    {RELATIONSHIP_KO[item.relationship_type]} · {' '}
                    {new Date(item.created_at).toLocaleString('ko-KR')}
                  </div>
                </div>
                <div style={{
                  background: '#ec4899',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                }}>
                  결과 보기 →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}