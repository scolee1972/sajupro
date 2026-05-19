'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import SajuChart from '../../../components/SajuChart'
import PdfChapterSelector from '../../../components/PdfChapterSelector'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CATEGORY_KO: Record<string, string> = {
  general: '🔮 종합', love: '💕 연애', career: '💼 직장',
  business: '🚀 사업', investment: '💰 투자', study: '📚 학업',
  moving: '🏠 이사', family: '👨‍👩 가족', compatibility: '☯️ 궁합',
}

export default function CustomerResultPage() {
  const params = useParams()
  const id = params?.id as string

  const [data, setData] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [followups, setFollowups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [askCategory, setAskCategory] = useState('general')
  const [askQuestion, setAskQuestion] = useState('')
  const [asking, setAsking] = useState(false)

  useEffect(() => {
    if (id) loadAll()
  }, [id])

  async function loadAll() {
    setLoading(true)
    const { data: consult } = await supabase
      .from('consultations').select('*').eq('id', id).maybeSingle()

    if (!consult) { setLoading(false); return }
    setData(consult)

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
      }
    }
    setLoading(false)
  }

  async function handleAsk() {
    if (!askQuestion.trim()) return alert('질문을 입력해주세요')
    if (!customer) return alert('고객 정보 없음')

    setAsking(true)
    try {
      const res = await fetch('/api/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id, customer,
          category: askCategory, question: askQuestion,
        }),
      })
      const result = await res.json()
      if (result.success) {
        setAskQuestion('')
        await loadAll()
      } else {
        alert('오류: ' + result.message)
      }
    } finally {
      setAsking(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        <Link href="/">← 홈으로</Link>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f1f5f9',
      padding: '20px', fontFamily: 'sans-serif',
    }}>

      <div style={{
        maxWidth: '900px', margin: '0 auto 20px',
        display: 'flex', gap: '10px', flexWrap: 'wrap',
      }}>
        <Link href="/" style={{
          background: '#1a2744', color: 'white',
          padding: '10px 20px', borderRadius: '10px',
          textDecoration: 'none', fontSize: '14px', fontWeight: 'bold',
        }}>🏠 홈으로</Link>
        <button onClick={() => window.print()} style={{
          background: '#2d6a4f', color: 'white',
          padding: '10px 20px', borderRadius: '10px',
          border: 'none', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
        }}>🖨️ 인쇄</button>
        {customer && data.report_html && (
          <PdfChapterSelector
            reportHtml={data.report_html}
            customer={customer}
            followups={followups}
            isPremium={data.premium_paid || false}
            isAdmin={false}
          />
        )}
      </div>

      <div id="report-content">
        <div style={{
          background: '#1a2744', color: 'white', padding: '24px',
          borderRadius: '16px', maxWidth: '900px', margin: '0 auto 20px',
        }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '22px' }}>
            🔮 {customer?.name || data.customer_name}님 사주 분석 결과
          </h2>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '8px', fontSize: '14px', color: '#93c5fd',
          }}>
            {customer?.gender && <div>👤 {customer.gender === 'male' ? '남성' : '여성'}</div>}
            {customer?.birth_date && (
  <div>🎂 {customer.birth_date} {data.saju_data?.calendarType === 'lunar' ? '(음력)' : '(양력)'}</div>
)}
            {customer?.birth_time && <div>⏰ {customer.birth_time}</div>}
            {customer?.birth_city && <div>📍 {customer.birth_city}</div>}
            <div>📋 {CATEGORY_KO[data.category]}</div>
          </div>
        </div>

        {data.saju_data && (
          <div style={{ maxWidth: '900px', margin: '0 auto 20px' }}>
            <SajuChart saju={data.saju_data} name={customer?.name} />
          </div>
        )}

        <div style={{
          background: 'white', borderRadius: '16px',
          padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          lineHeight: '1.8', fontSize: '16px',
          maxWidth: '900px', margin: '0 auto 20px',
        }}>
          <div dangerouslySetInnerHTML={{ __html: data.report_html || '<p>보고서 없음</p>' }} />
        </div>

        {followups.length > 0 && (
          <div style={{
            background: 'white', padding: '28px', borderRadius: '16px',
            maxWidth: '900px', margin: '0 auto 20px',
          }}>
            <h2 style={{ marginTop: 0, color: '#1a2744', fontSize: '20px' }}>
              📝 추가 질의 ({followups.length}건)
            </h2>
            {followups.map(fup => (
              <div key={fup.id} style={{
                border: '1px solid #e5e7eb', borderRadius: '12px',
                padding: '20px', marginTop: '16px',
              }}>
                <div style={{
                  background: '#f3e8ff', padding: '14px',
                  borderRadius: '10px', marginBottom: '14px',
                  fontSize: '15px', fontWeight: 'bold', color: '#7c3aed',
                }}>💬 {fup.question}</div>
                <div style={{ fontSize: '15px', lineHeight: '1.8' }}
                  dangerouslySetInnerHTML={{ __html: fup.answer_html }} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{
        background: 'white', padding: '28px', borderRadius: '16px',
        maxWidth: '900px', margin: '0 auto 20px',
        border: '2px solid #7c3aed',
      }}>
        <h2 style={{ marginTop: 0, color: '#7c3aed', fontSize: '20px' }}>
          💬 추가 질문하기
        </h2>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px', marginBottom: '14px', marginTop: '14px',
        }}>
          {Object.entries(CATEGORY_KO).map(([v, l]) => (
            <button key={v} onClick={() => setAskCategory(v)} style={{
              padding: '8px', borderRadius: '8px',
              border: askCategory === v ? '2px solid #7c3aed' : '2px solid #ddd',
              background: askCategory === v ? '#f3e8ff' : 'white',
              cursor: 'pointer', fontSize: '12px',
              fontWeight: askCategory === v ? 'bold' : 'normal',
            }}>{l}</button>
          ))}
        </div>

        <textarea
          value={askQuestion} onChange={e => setAskQuestion(e.target.value)}
          placeholder="예: 올해 연애 가능할까요?"
          style={{
            width: '100%', minHeight: '100px', padding: '14px',
            border: '1px solid #ddd', borderRadius: '10px',
            fontSize: '15px', marginBottom: '14px', resize: 'vertical',
          }}
        />

        <button onClick={handleAsk} disabled={asking} style={{
          width: '100%', padding: '16px',
          background: asking ? '#888' : '#7c3aed',
          color: 'white', border: 'none', borderRadius: '12px',
          fontSize: '17px', fontWeight: 'bold',
          cursor: asking ? 'not-allowed' : 'pointer',
        }}>
          {asking ? '⏳ 분석 중...' : '💬 질문하기'}
        </button>
      </div>

      <div style={{
        background: '#1a2744', color: 'white', padding: '24px',
        borderRadius: '16px', textAlign: 'center',
        maxWidth: '900px', margin: '0 auto 40px',
      }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>📅 재상담 안내</h3>
        <Link href="/booking" style={{
          background: '#c9a84c', color: 'white',
          padding: '12px 32px', borderRadius: '12px',
          textDecoration: 'none', fontWeight: 'bold', fontSize: '16px',
          marginTop: '10px', display: 'inline-block',
        }}>🔮 재상담 신청</Link>
      </div>

    </div>
  )
}