'use client'

import { useState } from 'react'

const CATEGORY_KO: Record<string, string> = {
  general: '🔮 종합', love: '💕 연애', career: '💼 직장',
  business: '🚀 사업', investment: '💰 투자', study: '📚 학업',
  moving: '🏠 이사', family: '👨‍👩 가족', compatibility: '☯️ 궁합',
}

interface Props {
  customerId: string
  customer: any
  onSuccess: () => void
}

export default function FollowupSection({ customerId, customer, onSuccess }: Props) {
  const [askCategory, setAskCategory] = useState('general')
  const [askQuestion, setAskQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [paying, setPaying] = useState(false)

  async function handleAskWithPayment() {
    if (!askQuestion.trim()) {
      alert('질문을 입력해주세요')
      return
    }

    // 결제 확인
    const confirmed = confirm(
      '💎 추가 질문 결제\n\n' +
      '추가 질문 1회: 9,900원\n\n' +
      '결제하시겠습니까?\n' +
      '(테스트 모드에서는 결제 없이 진행됩니다)'
    )

    if (!confirmed) return

    setPaying(true)

    // 실제 결제 연동 시 여기에 PortOne 결제 코드 추가
    // 지금은 테스트 모드로 결제 우회
    
    setPaying(false)
    setAsking(true)

    try {
      const res = await fetch('/api/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          customer,
          category: askCategory,
          question: askQuestion,
          isPaid: true,
        }),
      })
      const result = await res.json()
      if (result.success) {
        setAskQuestion('')
        onSuccess()
      } else {
        alert('오류: ' + result.message)
      }
    } finally {
      setAsking(false)
    }
  }

  return (
    <div style={{
      background: 'white',
      padding: '28px',
      borderRadius: '16px',
      maxWidth: '900px',
      margin: '0 auto 20px',
      border: '2px solid #7c3aed',
    }}>
      <h2 style={{ marginTop: 0, color: '#7c3aed', fontSize: '20px' }}>
        💬 추가 질문하기
      </h2>

      <div style={{
        background: '#fef3c7', borderLeft: '4px solid #f59e0b',
        padding: '14px', borderRadius: '8px', marginBottom: '16px',
      }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
          💎 <strong>추가 질문 (1회 9,900원)</strong>
        </p>
        <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#92400e' }}>
          위 사주 분석을 바탕으로 추가 질문에 대한 상세 답변을 받으세요.
          연운, 월운, 주간운까지 구체적으로 분석해드립니다.
        </p>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '6px', marginBottom: '14px',
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
        value={askQuestion}
        onChange={e => setAskQuestion(e.target.value)}
        placeholder="예: 올해 안에 연애 가능할까요?"
        style={{
          width: '100%', minHeight: '100px', padding: '14px',
          border: '1px solid #ddd', borderRadius: '10px',
          fontSize: '15px', marginBottom: '14px', resize: 'vertical',
          fontFamily: 'sans-serif',
        }}
      />

      <button
        onClick={handleAskWithPayment}
        disabled={asking || paying}
        style={{
          width: '100%', padding: '16px',
          background: (asking || paying) ? '#888' : '#7c3aed',
          color: 'white', border: 'none', borderRadius: '12px',
          fontSize: '17px', fontWeight: 'bold',
          cursor: (asking || paying) ? 'not-allowed' : 'pointer',
        }}
      >
        {paying ? '💳 결제 처리 중...' :
         asking ? '⏳ AI 분석 중... (약 30초~1분)' :
         '💎 9,900원 결제 후 질문하기'}
      </button>
    </div>
  )
}