'use client'

import { useEffect, useState, useRef } from 'react'
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

  // 실시간 생성 상태
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentPart, setCurrentPart] = useState(0)
  const [generationMsg, setGenerationMsg] = useState('')
  const [generatedHtml, setGeneratedHtml] = useState('')
  const isGeneratingRef = useRef(false)

  useEffect(() => {
    if (id) loadAll()
  }, [id])

  async function loadAll() {
    setLoading(true)
    const { data: consult } = await supabase
      .from('consultations').select('*').eq('id', id).maybeSingle()

    if (!consult) { setLoading(false); return }
    setData(consult)
    setGeneratedHtml(consult.report_html || '')

    if (consult.customer_id) {
      const { data: cust } = await supabase
        .from('customers').select('*').eq('id', consult.customer_id).maybeSingle()
      if (cust) {
        setCustomer(cust)
        const { data: fups } = await supabase
          .from('followup_questions').select('*')
          .eq('customer_id', cust.id)
          .order('created_at', { ascending: false })
        setFollowups(fups || [])

        // URL 쿼리에 autoGenerate가 들어있거나 보고서가 비어있으면 실시간 분할 생성 작동
        const isAuto = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('autoGenerate') === 'true'
        
        if ((!consult.report_html || isAuto) && consult.status !== 'completed' && !isGeneratingRef.current) {
          startBatchGeneration(consult.id, cust, consult.saju_data, consult.category, consult.question)
        }
      }
    }
    setLoading(false)
  }

  // ⭐ 실시간 파트별 연속 생성기 (60초 타임아웃 절대 안 걸림!)
  async function startBatchGeneration(consultId: string, custData: any, sajuData: any, category: string, question: string) {
    isGeneratingRef.current = true
    setIsGenerating(true)
    let fullHtml = ''

    const formBody = {
      name: custData.name,
      gender: custData.gender,
      phone: custData.phone,
      email: custData.email,
      address: custData.address,
      familyInfo: custData.family_info,
      marriageDate: custData.marriage_date,
      divorceDate: custData.divorce_date,
      spouseBirth: custData.spouse_birth,
      childrenInfo: custData.children_info,
      majorEvents: custData.major_events,
      bodyType: custData.body_type,
      healthStatus: custData.health_status,
      birthDate: custData.birth_date,
      birthTime: custData.birth_time,
      birthCity: custData.birth_city,
      birthCountry: custData.birth_country,
      calendarType: sajuData?.calendarType || 'solar',
      leapMonth: sajuData?.leapMonth || false,
      category,
      question,
    }

    const partNames = [
      '제1~3장 (사주 원국, 과거 검증, 육친 분석)',
      '제4~6장 (건강 체질, 격국 용신, 십성 분석)',
      '제7~9장 (대운 흐름, 올해 운세, 향후 3년)',
      '제10~12장 (맞춤 분석, 인생 로드맵, 종합 조언)',
    ]

    for (let part = 1; part <= 4; part++) {
      setCurrentPart(part)
      setGenerationMsg(`${partNames[part - 1]} 생성 중... (약 10~12초 소요)`)

      try {
        const res = await fetch('/api/generate-part', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ consultationId: consultId, part, formBody, sajuData }),
        })

        const resData = await res.json()
        if (resData.success && resData.partHtml) {
          fullHtml += resData.partHtml + '\n\n'
          setGeneratedHtml(fullHtml)
        }
      } catch (err) {
        console.error(`Part ${part} 생성 오류:`, err)
      }
    }

    // 전체 4개 파트 완결 후 Supabase DB에 최종 저장
    await supabase
      .from('consultations')
      .update({
        report_html: fullHtml,
        status: 'completed',
        progress: 100,
      })
      .eq('id', consultId)

    setIsGenerating(false)
    isGeneratingRef.current = false
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '60px' }}>🔮</div>
          <p>로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>결과를 찾을 수 없습니다</p>
        <Link href="/admin">← 관리자로</Link>
      </div>
    )
  }

  const isPremium = data.premium_paid || false

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* 실시간 생성이 진행 중일 때 보이는 상태바 */}
      {isGenerating && (
        <div style={{
          position: 'fixed', top: '10px', left: '50%', transform: 'translateX(-50%)',
          background: '#1a2744', color: 'white', padding: '14px 24px', borderRadius: '50px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <div style={{ fontSize: '20px' }}>🔮</div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#c9a84c' }}>
              실시간 AI 보고서 작성 중 ({currentPart}/4 단계 완료)
            </div>
            <div style={{ fontSize: '12px', color: '#93c5fd' }}>{generationMsg}</div>
          </div>
        </div>
      )}

      {/* 상단 버튼 */}
      <div style={{ maxWidth: '900px', margin: '0 auto 20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <Link href="/admin" style={{ background: '#1a2744', color: 'white', padding: '10px 20px', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>← 관리자</Link>
        <Link href="/admin/new" style={{ background: '#c9a84c', color: 'white', padding: '10px 20px', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>🔮 새 상담</Link>
        <button onClick={() => window.print()} style={{ background: '#2d6a4f', color: 'white', padding: '10px 20px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>🖨️ 인쇄</button>
        {customer && (generatedHtml || data.report_html) && (
          <PdfChapterSelector
            reportHtml={generatedHtml || data.report_html}
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
            <div>📋 {CATEGORY_KO[data.category]}</div>
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

        {/* AI 보고서 (실시간으로 써내려가듯 출력) */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', lineHeight: '1.8', fontSize: '16px', maxWidth: '900px', margin: '0 auto 20px' }}>
          {generatedHtml ? (
            <div dangerouslySetInnerHTML={{ __html: generatedHtml }} />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>✍️</div>
              사주 명리 보고서를 실시간으로 작성하고 있습니다...
            </div>
          )}
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