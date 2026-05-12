'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CATEGORY_KO: Record<string, string> = {
  general: '🔮 종합 운세',
  love: '💕 연애/애정',
  career: '💼 직장/이직',
  business: '🚀 사업/창업',
  investment: '💰 투자/재테크',
  study: '📚 학업/진로',
  moving: '🏠 이사/방위',
  family: '👨‍👩 가족 관계',
  compatibility: '☯️ 궁합',
}

export default function CustomerDetailPage() {
  const params = useParams()
  const customerId = params?.id as string

  const [customer, setCustomer] = useState<any>(null)
  const [consultations, setConsultations] = useState<any[]>([])
  const [followups, setFollowups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // 새 질문
  const [newCategory, setNewCategory] = useState('general')
  const [newQuestion, setNewQuestion] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (customerId) loadAll()
  }, [customerId])

  async function loadAll() {
    setLoading(true)

    const { data: cust } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .maybeSingle()

    setCustomer(cust)

    const { data: consults } = await supabase
      .from('consultations')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    setConsultations(consults || [])

    const { data: fups } = await supabase
      .from('followup_questions')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    setFollowups(fups || [])
    setLoading(false)
  }

  async function handleAskQuestion() {
    if (!newQuestion.trim()) {
      alert('질문을 입력해주세요!')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          customer,
          category: newCategory,
          question: newQuestion,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setNewQuestion('')
        await loadAll()
        alert('답변이 완료되었습니다!')
      } else {
        alert('오류: ' + (data.message || '알 수 없는 오류'))
      }
    } catch (err) {
      alert('오류: ' + String(err))
    } finally {
      setSubmitting(false)
    }
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
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>🔮</div>
          <p style={{ fontSize: '18px', color: '#666' }}>고객 정보 로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <p>고객을 찾을 수 없습니다.</p>
        <Link href="/admin/list">← 목록으로</Link>
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
      <div style={{ maxWidth: '900px', margin: '0 auto 16px' }}>
        <Link href="/admin/list" style={{
          color: '#1a2744', textDecoration: 'none',
          fontSize: '14px', fontWeight: 'bold',
        }}>
          ← 고객 목록으로
        </Link>
      </div>

      {/* 고객 카드 */}
      <div style={{
        background: '#1a2744',
        color: 'white',
        padding: '24px',
        borderRadius: '16px',
        maxWidth: '900px',
        margin: '0 auto 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{
            background: customer.gender === 'male' ? '#3b82f6' : '#ec4899',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
          }}>
            {customer.gender === 'male' ? '👨' : '👩'}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px' }}>{customer.name}</h1>
            <p style={{ margin: '6px 0 0', color: '#93c5fd', fontSize: '14px' }}>
              {customer.gender === 'male' ? '남성' : '여성'} · {customer.birth_date} · {customer.birth_time}
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '8px',
          fontSize: '13px',
          color: '#93c5fd',
        }}>
          <div>📞 {customer.phone}</div>
          <div>📍 {customer.birth_city}</div>
        </div>
      </div>

      {/* 새 질문 입력 */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '16px',
        maxWidth: '900px',
        margin: '0 auto 20px',
      }}>
        <h2 style={{ marginTop: 0, fontSize: '18px', color: '#1a2744' }}>
          💬 추가 상담 질의
        </h2>
        <p style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>
          이 고객의 사주를 바탕으로 추가 질문에 대한 답변을 받습니다
        </p>

        {/* 분야 선택 */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#444' }}>
            상담 분야
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginTop: '8px',
          }}>
            {Object.entries(CATEGORY_KO).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setNewCategory(v)}
                style={{
                  padding: '10px 6px',
                  borderRadius: '8px',
                  border: newCategory === v ? '2px solid #1a2744' : '2px solid #ddd',
                  background: newCategory === v ? '#e8edf5' : 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: newCategory === v ? 'bold' : 'normal',
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* 질문 입력 */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#444' }}>
            질문 내용
          </label>
          <textarea
            value={newQuestion}
            onChange={e => setNewQuestion(e.target.value)}
            placeholder="예: 2026년에 이직해도 괜찮을까요? 어떤 분야가 적합한가요?"
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'sans-serif',
              marginTop: '8px',
              resize: 'vertical',
              outline: 'none',
            }}
          />
        </div>

        <button
          onClick={handleAskQuestion}
          disabled={submitting}
          style={{
            width: '100%',
            padding: '14px',
            background: submitting ? '#888' : '#c9a84c',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? '⏳ AI 분석 중... (약 30초~1분)' : '🔮 질문하기'}
        </button>
      </div>

      {/* 추가 질의 답변 목록 */}
      {followups.length > 0 && (
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '16px',
          maxWidth: '900px',
          margin: '0 auto 20px',
        }}>
          <h2 style={{ marginTop: 0, fontSize: '18px', color: '#1a2744' }}>
            📝 추가 질의 이력 ({followups.length}건)
          </h2>

          {followups.map(fup => (
            <div
              key={fup.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '16px',
                marginTop: '12px',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
                flexWrap: 'wrap',
                gap: '8px',
              }}>
                <span style={{
                  background: '#1a2744',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}>
                  {CATEGORY_KO[fup.category] || fup.category}
                </span>
                <span style={{ fontSize: '12px', color: '#888' }}>
                  {new Date(fup.created_at).toLocaleString('ko-KR')}
                </span>
              </div>

              <div style={{
                background: '#f8f5ef',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#1a2744',
              }}>
                💬 {fup.question}
              </div>

              <div
                style={{ fontSize: '14px', lineHeight: '1.7' }}
                dangerouslySetInnerHTML={{ __html: fup.answer_html }}
              />
            </div>
          ))}
        </div>
      )}

      {/* 종합 상담 보고서 */}
      {consultations.length > 0 && (
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '16px',
          maxWidth: '900px',
          margin: '0 auto 20px',
        }}>
          <h2 style={{ marginTop: 0, fontSize: '18px', color: '#1a2744' }}>
            📊 종합 상담 보고서
          </h2>
          {consultations.map(c => (
            <Link
              key={c.id}
              href={`/admin/result/${c.id}`}
              style={{
                display: 'block',
                background: '#f8f5ef',
                padding: '16px',
                borderRadius: '10px',
                marginTop: '10px',
                textDecoration: 'none',
                color: '#1a2744',
              }}
            >
              <div style={{ fontWeight: 'bold' }}>
                {CATEGORY_KO[c.category] || c.category}
              </div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                {new Date(c.created_at).toLocaleString('ko-KR')} · 상세보기 →
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  )
}