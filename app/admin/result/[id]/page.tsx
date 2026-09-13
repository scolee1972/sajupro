'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import SajuChart from '../../../../components/SajuChart'
import PdfChapterSelector from '../../../../components/PdfChapterSelector'
import FollowupSection from '../../../../components/FollowupSection'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CATEGORY_KO: Record<string, string> = {
  general: '🔮 종합', love: '💕 연애', career: '💼 직장',
  business: '🚀 사업', investment: '💰 투자', study: '📚 학업',
  moving: '🏠 이사', family: '👨‍👩 가족', compatibility: '☯️ 궁합',
}

export default function ResultPage() {
  const params = useParams()
  const id = params?.id as string

  const [data, setData] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [followups, setFollowups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (id) loadAll()
  }, [id])

  async function loadAll() {
    setLoading(true)
    setErrorMessage('')

    try {
      const { data: consult, error: consultError } = await supabase
        .from('consultations')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (consultError) {
        setErrorMessage('DB 조회 오류: ' + consultError.message)
        setLoading(false)
        return
      }

      if (!consult) {
        setErrorMessage('상담 데이터를 찾을 수 없습니다.')
        setLoading(false)
        return
      }

      setData(consult)

      if (consult.customer_id) {
        const { data: cust } = await supabase
          .from('customers')
          .select('*')
          .eq('id', consult.customer_id)
          .maybeSingle()
        
        if (cust) {
          setCustomer(cust)
          const { data: fups } = await supabase
            .from('followup_questions')
            .select('*')
            .eq('customer_id', cust.id)
            .order('created_at', { ascending: false })
          setFollowups(fups || [])
        }
      }
    } catch (err: any) {
      setErrorMessage('오류 발생: ' + (err?.message || String(err)))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>🔮</div>
          <p style={{ fontSize: '18px', color: '#1a2744', fontWeight: 'bold' }}>사주 분석 보고서를 불러오는 중입니다...</p>
        </div>
      </div>
    )
  }

  if (errorMessage || !data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: '50px', marginBottom: '16px' }}>⚠️</div>
        <h2 style={{ color: '#1a2744' }}>결과를 불러올 수 없습니다</h2>
        <p style={{ color: '#ef4444', marginBottom: '20px' }}>{errorMessage || '데이터가 존재하지 않거나 데이터베이스 연결이 일시 중지되었습니다.'}</p>
        <Link href="/admin" style={{ background: '#1a2744', color: 'white', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none' }}>
          ← 관리자 메인으로 돌아가기
        </Link>
      </div>
    )
  }

  const isPremium = data.premium_paid || false

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* 상단 버튼 */}
      <div style={{ maxWidth: '900px', margin: '0 auto 20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <Link href="/admin" style={{ background: '#1a2744', color: 'white', padding: '10px 20px', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>← 관리자</Link>
        <Link href="/admin/new" style={{ background: '#c9a84c', color: 'white', padding: '10px 20px', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>🔮 새 상담</Link>
        <button onClick={() => window.print()} style={{ background: '#2d6a4f', color: 'white', padding: '10px 20px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>🖨️ 인쇄</button>
        {customer && data?.report_html && (
          <PdfChapterSelector
            reportHtml={data.report_html}
            customer={customer}
            followups={followups}
            sajuData={data.saju_data}
            isPremium={isPremium}
            isAdmin={true}
          />
        )}
      </div>

      <div id="report-content">
        {/* 고객 정보 */}
        <div style={{ background: '#1a2744', color: 'white', padding: '24px', borderRadius: '16px', maxWidth: '900px', margin: '0 auto 20px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '22px' }}>
            🔮 {customer?.name || data.customer_name}님 사주 분석 결과
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px', fontSize: '14px', color: '#93c5fd' }}>
            {customer?.gender && <div>👤 {customer.gender === 'male' ? '남성' : '여성'}</div>}
            {customer?.phone && <div>📞 {customer.phone}</div>}
            {customer?.email && <div>✉️ {customer.email}</div>}
            {customer?.birth_date && <div>🎂 {customer.birth_date}</div>}
            {customer?.birth_time && <div>⏰ {customer.birth_time}</div>}
            {customer?.birth_city && <div>📍 {customer.birth_city}</div>}
            <div>📋 {CATEGORY_KO[data.category] || data.category}</div>
          </div>
          {customer?.family_info && (
            <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '13px' }}>
              <strong style={{ color: '#c9a84c' }}>가족 관계:</strong> {customer.family_info}
            </div>
          )}
          {data.question && (
            <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '13px' }}>
              <strong style={{ color: '#c9a84c' }}>질문:</strong> {data.question}
            </div>
          )}
        </div>

        {/* 사주 시각화 */}
        {data.saju_data && (
          <div style={{ maxWidth: '900px', margin: '0 auto 20px' }}>
            <SajuChart saju={data.saju_data} name={customer?.name} />
          </div>
        )}

        {/* AI 보고서 */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', lineHeight: '1.8', fontSize: '16px', maxWidth: '900px', margin: '0 auto 20px' }}>
          <div dangerouslySetInnerHTML={{ __html: data.report_html || '<p>작성된 보고서가 없습니다.</p>' }} />
        </div>

        {/* 추가 질의 결과 */}
        {followups.length > 0 && (
          <div style={{ background: 'white', padding: '28px', borderRadius: '16px', maxWidth: '900px', margin: '0 auto 20px' }}>
            <h2 style={{ marginTop: 0, color: '#1a2744', fontSize: '20px' }}>
              📝 추가 질의 ({followups.length}건)
            </h2>
            {followups.map(fup => (
              <div key={fup.id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginTop: '16px' }}>
                <div style={{ background: '#f3e8ff', padding: '14px', borderRadius: '10px', marginBottom: '14px', fontSize: '15px', fontWeight: 'bold', color: '#7c3aed' }}>💬 {fup.question}</div>
                <div style={{ fontSize: '15px', lineHeight: '1.8' }} dangerouslySetInnerHTML={{ __html: fup.answer_html }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {customer && (
        <FollowupSection customerId={customer.id} customer={customer} onSuccess={loadAll} />
      )}
    </div>
  )
}