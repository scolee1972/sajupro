'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminPage() {
  const router = useRouter()

  // 로그인 체크
  useEffect(() => {
    const auth = localStorage.getItem('admin_auth')
    if (!auth) {
      router.push('/admin/login')
    }
  }, [router])

  const [stats, setStats] = useState({
    customers: 0,
    consultations: 0,
    today: 0,
    compatibility: 0,
  })

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    const today = new Date().toISOString().split('T')[0]

    const { count: customerCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })

    const { count: consultCount } = await supabase
      .from('consultations')
      .select('*', { count: 'exact', head: true })

    const { count: todayCount } = await supabase
      .from('consultations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)

    const { count: compatCount } = await supabase
      .from('compatibility_readings')
      .select('*', { count: 'exact', head: true })

    setStats({
      customers: customerCount || 0,
      consultations: consultCount || 0,
      today: todayCount || 0,
      compatibility: compatCount || 0,
    })
  }

  function handleLogout() {
    localStorage.removeItem('admin_auth')
    router.push('/admin/login')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f1f5f9',
      padding: '30px 20px',
      fontFamily: 'sans-serif',
    }}>

      {/* 헤더 */}
      <div style={{
        background: '#1a2744',
        color: 'white',
        padding: '24px 32px',
        borderRadius: '20px',
        marginBottom: '24px',
        maxWidth: '900px',
        margin: '0 auto 24px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 'bold', margin: 0 }}>
              🔮 사주 상담 관리자
            </h1>
            <p style={{ color: '#93c5fd', margin: '8px 0 0', fontSize: '14px' }}>
              {new Date().toLocaleDateString('ko-KR', { 
                year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
              })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/" style={{
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
            }}>
              🏠 메인으로
            </Link>
            <button onClick={handleLogout} style={{
              background: 'rgba(239,68,68,0.3)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
            }}>
              🔒 로그아웃
            </button>
          </div>
        </div>
      </div>

      {/* 통계 */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
      }}>
        <StatCard icon="👥" label="전체 고객" value={stats.customers} unit="명" color="#3b82f6" />
        <StatCard icon="📋" label="총 상담" value={stats.consultations} unit="건" color="#22c55e" />
        <StatCard icon="🔥" label="오늘 상담" value={stats.today} unit="건" color="#f59e0b" />
        <StatCard icon="☯️" label="궁합 상담" value={stats.compatibility} unit="건" color="#ec4899" />
      </div>

      {/* 메뉴 */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px',
      }}>

        <MenuCard
          href="/admin/new"
          icon="➕"
          title="새 상담 시작"
          desc="고객 정보 입력 후 자동 분석"
          color="#1a2744"
        />

        <MenuCard
          href="/admin/calendar"
          icon="📅"
          title="예약 캘린더"
          desc="월별 예약·결제 현황 관리"
          color="#0891b2"
        />

        <MenuCard
          href="/admin/compatibility"
          icon="☯️"
          title="궁합 분석"
          desc="부부·연인·동료 궁합 보기"
          color="#ec4899"
        />

        <MenuCard
          href="/admin/list"
          icon="📋"
          title="고객 목록"
          desc="전체 고객 및 추가 질의"
          color="#2d6a4f"
        />

        <MenuCard
          href="/admin/compatibility/list"
          icon="📊"
          title="궁합 이력"
          desc="궁합 분석 이력 보기"
          color="#7b2d8b"
        />

      </div>

    </div>
  )
}

function StatCard({ icon, label, value, unit, color }: {
  icon: string
  label: string
  value: number
  unit: string
  color: string
}) {
  return (
    <div style={{
      background: 'white',
      padding: '20px',
      borderRadius: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a2744' }}>
        {value}<span style={{ fontSize: '14px', color: '#888', marginLeft: '4px' }}>{unit}</span>
      </div>
    </div>
  )
}

function MenuCard({ href, icon, title, desc, color }: {
  href: string
  icon: string
  title: string
  desc: string
  color: string
}) {
  return (
    <Link href={href} style={{
      background: color,
      color: 'white',
      padding: '24px',
      borderRadius: '16px',
      textDecoration: 'none',
      display: 'block',
    }}>
      <div style={{ fontSize: '36px', marginBottom: '12px' }}>{icon}</div>
      <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{desc}</div>
    </Link>
  )
}