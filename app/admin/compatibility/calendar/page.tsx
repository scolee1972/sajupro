'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const STATUS_COLOR: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  completed: '#22c55e',
  cancelled: '#94a3b8',
}

const STATUS_LABEL: Record<string, string> = {
  pending: '대기',
  confirmed: '확정',
  completed: '완료',
  cancelled: '취소',
}

const PAYMENT_LABEL: Record<string, string> = {
  pending: '미결제',
  paid: '결제완료',
  refunded: '환불',
}

export default function AdminCalendarPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [bookings, setBookings] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBookings()
  }, [year, month])

  async function loadBookings() {
    setLoading(true)
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`

    const { data } = await supabase
      .from('bookings')
      .select('*')
      .gte('booking_date', startDate)
      .lte('booking_date', endDate)
      .order('booking_time', { ascending: true })

    setBookings(data || [])
    setLoading(false)
  }

  // 달력 데이터 생성
  const firstDay = new Date(year, month - 1, 1).getDay()
  const lastDay = new Date(year, month, 0).getDate()
  const days: (number | null)[] = []
  
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= lastDay; i++) days.push(i)

  function getDateBookings(day: number) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return bookings.filter(b => b.booking_date === dateStr)
  }

  function changeMonth(diff: number) {
    let newMonth = month + diff
    let newYear = year
    if (newMonth < 1) { newMonth = 12; newYear-- }
    if (newMonth > 12) { newMonth = 1; newYear++ }
    setYear(newYear)
    setMonth(newMonth)
    setSelectedDate(null)
  }

  async function updateStatus(id: string, newStatus: string) {
    await supabase.from('bookings').update({ status: newStatus }).eq('id', id)
    await loadBookings()
  }

  const selectedBookings = selectedDate
    ? bookings.filter(b => b.booking_date === selectedDate)
    : []

  // 통계
  const totalCount = bookings.length
  const paidCount = bookings.filter(b => b.payment_status === 'paid').length
  const totalRevenue = bookings.filter(b => b.payment_status === 'paid')
    .reduce((sum, b) => sum + (b.amount || 0), 0)

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f1f5f9',
      padding: '30px 20px',
      fontFamily: 'sans-serif',
    }}>

      <div style={{ maxWidth: '1100px', margin: '0 auto 16px' }}>
        <Link href="/admin" style={{
          color: '#1a2744', textDecoration: 'none',
          fontSize: '14px', fontWeight: 'bold',
        }}>← 관리자 메인으로</Link>
      </div>

      <div style={{
        background: '#1a2744',
        color: 'white',
        padding: '24px',
        borderRadius: '16px',
        maxWidth: '1100px',
        margin: '0 auto 20px',
      }}>
        <h1 style={{ margin: 0, fontSize: '22px' }}>📅 예약 캘린더</h1>
        <p style={{ margin: '6px 0 0', color: '#93c5fd', fontSize: '14px' }}>
          예약 현황을 한눈에 확인하고 관리하세요
        </p>
      </div>

      {/* 월별 통계 */}
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
      }}>
        <div style={{
          background: 'white', padding: '16px', borderRadius: '12px',
          borderLeft: '4px solid #3b82f6',
        }}>
          <div style={{ fontSize: '12px', color: '#888' }}>이번 달 예약</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a2744' }}>{totalCount}건</div>
        </div>
        <div style={{
          background: 'white', padding: '16px', borderRadius: '12px',
          borderLeft: '4px solid #22c55e',
        }}>
          <div style={{ fontSize: '12px', color: '#888' }}>결제 완료</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a2744' }}>{paidCount}건</div>
        </div>
        <div style={{
          background: 'white', padding: '16px', borderRadius: '12px',
          borderLeft: '4px solid #c9a84c',
        }}>
          <div style={{ fontSize: '12px', color: '#888' }}>이번 달 매출</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#c9a84c' }}>
            {totalRevenue.toLocaleString()}원
          </div>
        </div>
      </div>

      {/* 캘린더 */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '16px',
        maxWidth: '1100px',
        margin: '0 auto 20px',
      }}>

        {/* 월 이동 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <button onClick={() => changeMonth(-1)} style={{
            padding: '8px 16px', background: '#f1f5f9',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            fontWeight: 'bold',
          }}>← 이전</button>

          <h2 style={{ margin: 0, fontSize: '20px', color: '#1a2744' }}>
            {year}년 {month}월
          </h2>

          <button onClick={() => changeMonth(1)} style={{
            padding: '8px 16px', background: '#f1f5f9',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            fontWeight: 'bold',
          }}>다음 →</button>
        </div>

        {/* 요일 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
          marginBottom: '4px',
        }}>
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div key={d} style={{
              textAlign: 'center',
              padding: '10px',
              fontSize: '13px',
              fontWeight: 'bold',
              color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : '#1a2744',
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
        }}>
          {days.map((day, i) => {
            if (day === null) return <div key={i} />

            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayBookings = getDateBookings(day)
            const isToday = year === today.getFullYear() && 
                           month === today.getMonth() + 1 && 
                           day === today.getDate()
            const isSelected = selectedDate === dateStr
            const dayOfWeek = (firstDay + day - 1) % 7

            return (
              <div
                key={i}
                onClick={() => setSelectedDate(dateStr)}
                style={{
                  minHeight: '90px',
                  padding: '8px',
                  background: isSelected ? '#fef3c7' : isToday ? '#eff6ff' : '#fafafa',
                  border: isSelected ? '2px solid #c9a84c' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: dayOfWeek === 0 ? '#ef4444' : dayOfWeek === 6 ? '#3b82f6' : '#1a2744',
                  marginBottom: '4px',
                }}>
                  {day}
                </div>

                {dayBookings.slice(0, 3).map(b => (
                  <div key={b.id} style={{
                    fontSize: '10px',
                    padding: '2px 4px',
                    marginBottom: '2px',
                    background: STATUS_COLOR[b.status] || '#94a3b8',
                    color: 'white',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {b.booking_time} {b.customer_name}
                  </div>
                ))}

                {dayBookings.length > 3 && (
                  <div style={{ fontSize: '10px', color: '#888' }}>
                    +{dayBookings.length - 3}건 더
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 범례 */}
        <div style={{
          marginTop: '16px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          fontSize: '12px',
        }}>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '14px', height: '14px',
                background: STATUS_COLOR[k],
                borderRadius: '3px',
              }} />
              {v}
            </div>
          ))}
        </div>
      </div>

      {/* 선택된 날짜 예약 목록 */}
      {selectedDate && (
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '16px',
          maxWidth: '1100px',
          margin: '0 auto 40px',
        }}>
          <h2 style={{ marginTop: 0, color: '#1a2744' }}>
            📋 {selectedDate} 예약 목록 ({selectedBookings.length}건)
          </h2>

          {selectedBookings.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888', padding: '40px 0' }}>
              이 날짜에 예약이 없습니다
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {selectedBookings.map(b => (
                <div key={b.id} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '16px',
                  borderLeft: `4px solid ${STATUS_COLOR[b.status]}`,
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                    marginBottom: '12px',
                  }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a2744' }}>
                        ⏰ {b.booking_time}
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                        {b.customer_name}
                      </span>
                      <span style={{
                        background: STATUS_COLOR[b.status],
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}>
                        {STATUS_LABEL[b.status]}
                      </span>
                      <span style={{
                        background: b.payment_status === 'paid' ? '#22c55e' : '#94a3b8',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}>
                        {PAYMENT_LABEL[b.payment_status] || '미결제'}
                      </span>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#c9a84c' }}>
                      {b.amount?.toLocaleString()}원
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#666',
                    marginBottom: '12px',
                  }}>
                    <div>📞 {b.customer_phone}</div>
                    <div>🎂 {b.birth_date} {b.birth_time}</div>
                    <div>📍 {b.birth_city}</div>
                    <div>👤 {b.gender === 'male' ? '남성' : '여성'}</div>
                  </div>

                  {b.question && (
                    <div style={{
                      background: '#f8f5ef',
                      padding: '10px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      marginBottom: '12px',
                    }}>
                      💬 {b.question}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => updateStatus(b.id, 'confirmed')}
                      style={{
                        padding: '6px 14px', background: '#3b82f6',
                        color: 'white', border: 'none', borderRadius: '6px',
                        cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
                      }}>확정</button>
                    <button onClick={() => updateStatus(b.id, 'completed')}
                      style={{
                        padding: '6px 14px', background: '#22c55e',
                        color: 'white', border: 'none', borderRadius: '6px',
                        cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
                      }}>완료</button>
                    <button onClick={() => updateStatus(b.id, 'cancelled')}
                      style={{
                        padding: '6px 14px', background: '#94a3b8',
                        color: 'white', border: 'none', borderRadius: '6px',
                        cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
                      }}>취소</button>
                    {b.consultation_id && (
                      <Link href={`/admin/result/${b.consultation_id}`} style={{
                        padding: '6px 14px', background: '#1a2744',
                        color: 'white', textDecoration: 'none', borderRadius: '6px',
                        fontSize: '12px', fontWeight: 'bold',
                      }}>📊 분석 보기</Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}