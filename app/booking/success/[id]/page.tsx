'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function BookingSuccessPage() {
  const params = useParams()
  const id = params?.id as string
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) load()
  }, [id])

  async function load() {
    const { data } = await supabase
      .from('bookings').select('*').eq('id', id).maybeSingle()
    setBooking(data)
    setLoading(false)
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
  if (!booking) return <div style={{ padding: '40px', textAlign: 'center' }}>예약을 찾을 수 없습니다</div>

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a2744 0%, #2d1b4e 100%)',
      padding: '40px 20px',
      fontFamily: 'sans-serif',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '600px',
        margin: '0 auto',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>✅</div>
        <h1 style={{ color: '#1a2744', marginBottom: '12px' }}>예약 완료!</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          {booking.customer_name}님의 사주 분석이 진행되었습니다
        </p>

        <div style={{
          background: '#f8f5ef',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'left',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>예약자:</span><strong>{booking.customer_name}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>연락처:</span><strong>{booking.customer_phone}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>상담 종류:</span><strong>{booking.consultation_type}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>결제 금액:</span>
            <strong style={{ color: '#c9a84c' }}>{booking.amount?.toLocaleString()}원</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>상태:</span>
            <strong style={{ color: '#22c55e' }}>✅ 결제완료</strong>
          </div>
        </div>

        {booking.consultation_id && (
          <Link href={`/result/${booking.consultation_id}`} style={{
            display: 'block',
            padding: '16px',
            background: 'linear-gradient(135deg, #c9a84c, #b8973b)',
            color: 'white', textDecoration: 'none',
            borderRadius: '12px', fontWeight: 'bold',
            fontSize: '17px', marginBottom: '12px',
          }}>
            🔮 사주 분석 결과 보기
          </Link>
        )}

        <Link href="/" style={{
          display: 'block', padding: '12px',
          background: '#f1f5f9', color: '#1a2744',
          textDecoration: 'none', borderRadius: '10px',
          fontWeight: 'bold',
        }}>
          🏠 메인으로
        </Link>
      </div>
    </div>
  )
}