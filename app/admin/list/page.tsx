'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CustomerListPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers() {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    setCustomers(data || [])
    setLoading(false)
  }

  const filtered = customers.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  function getAge(birthDate: string) {
    if (!birthDate) return ''
    const year = parseInt(birthDate.split('-')[0], 10)
    return new Date().getFullYear() - year
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f1f5f9',
      padding: '30px 20px',
      fontFamily: 'sans-serif',
    }}>

      {/* 헤더 */}
      <div style={{ maxWidth: '900px', margin: '0 auto 16px' }}>
        <Link href="/admin" style={{
          color: '#1a2744', textDecoration: 'none',
          fontSize: '14px', fontWeight: 'bold',
        }}>
          ← 관리자 메인으로
        </Link>
      </div>

      <div style={{
        background: '#1a2744',
        color: 'white',
        padding: '24px',
        borderRadius: '16px',
        maxWidth: '900px',
        margin: '0 auto 20px',
      }}>
        <h1 style={{ margin: 0, fontSize: '22px' }}>📋 고객 목록</h1>
        <p style={{ margin: '6px 0 0', color: '#93c5fd', fontSize: '14px' }}>
          전체 {customers.length}명의 고객 · 클릭하여 추가 상담 진행
        </p>
      </div>

      {/* 검색 */}
      <div style={{ maxWidth: '900px', margin: '0 auto 20px' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 이름 또는 연락처로 검색..."
          style={{
            width: '100%',
            padding: '14px 20px',
            border: '1px solid #ddd',
            borderRadius: '12px',
            fontSize: '15px',
            outline: 'none',
          }}
        />
      </div>

      {/* 고객 목록 */}
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            로딩 중...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            background: 'white',
            padding: '60px 20px',
            borderRadius: '16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              {search ? '검색 결과가 없습니다' : '아직 고객이 없습니다'}
            </p>
            <Link href="/admin/new" style={{
              background: '#c9a84c',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 'bold',
            }}>
              첫 상담 시작하기
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {filtered.map(customer => (
              <Link
                key={customer.id}
                href={`/admin/customer/${customer.id}`}
                style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#1a2744',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{
                      background: customer.gender === 'male' ? '#3b82f6' : '#ec4899',
                      color: 'white',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      {customer.gender === 'male' ? '👨' : '👩'}
                    </div>
                    <div>
                      <div style={{ fontSize: '17px', fontWeight: 'bold' }}>
                        {customer.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        만 {getAge(customer.birth_date)}세 · {customer.gender === 'male' ? '남성' : '여성'}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', marginLeft: '46px' }}>
                    📞 {customer.phone} · 🎂 {customer.birth_date} · 📍 {customer.birth_city}
                  </div>
                </div>
                <div style={{
                  background: '#1a2744',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                }}>
                  상담 보기 →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}