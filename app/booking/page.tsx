'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const PRODUCTS = [
  {
    id: 'basic',
    name: '기본 상담',
    price: 29000,
    desc: 'AI 사주 종합 분석 + PDF 보고서',
    features: ['사주 원국 분석', '오행/십성 분석', '운세 분석', '시각화 차트'],
    color: '#3b82f6',
  },
  {
    id: 'premium',
    name: '프리미엄 상담',
    price: 79000,
    desc: '전문가급 심층 분석 + 추가 질문 3회',
    features: [
      '기본 상담 모든 내용',
      '육친 관계 분석',
      '건강·체질 분석',
      '추가 질문 3회 (월운 분석)',
      'PDF 고급 디자인',
    ],
    color: '#c9a84c',
    popular: true,
  },
  {
    id: 'vip',
    name: 'VIP 상담',
    price: 149000,
    desc: '대면/전화 상담 + 평생 추가 질문',
    features: [
      '프리미엄 상담 모든 내용',
      '60분 대면/전화 상담',
      '평생 추가 질문 무제한',
      '궁합 분석 1회 무료',
      '연간 운세 업데이트',
    ],
    color: '#7c3aed',
  },
]

export default function BookingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [productId, setProductId] = useState('premium')

  // 고객 정보
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [gender, setGender] = useState('male')
  const [birthDate, setBirthDate] = useState('')
  const [birthHour, setBirthHour] = useState('')
  const [birthMinute, setBirthMinute] = useState('')
  const [birthCity, setBirthCity] = useState('서울')
  const [calendarType, setCalendarType] = useState('solar')
  const [category, setCategory] = useState('general')
  const [question, setQuestion] = useState('')

  // 예약 정보
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('14:00')

  const product = PRODUCTS.find(p => p.id === productId)!
  const needsBookingTime = productId === 'vip'

  async function handlePayment() {
    if (!name || !phone || !birthDate) {
      alert('필수 정보를 입력해주세요')
      return
    }
    if (needsBookingTime && !bookingDate) {
      alert('대면 상담 일정을 선택해주세요')
      return
    }

    setLoading(true)

    try {
      // PortOne 동적 import
      const PortOne = (await import('@portone/browser-sdk/v2')).default

      const paymentId = `payment-${crypto.randomUUID()}`

      const response = await PortOne.requestPayment({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!,
        paymentId,
        orderName: `사주명리상담 - ${product.name}`,
        totalAmount: product.price,
        currency: 'KRW',
        payMethod: 'CARD',
        customer: {
          fullName: name,
          phoneNumber: phone,
          email: email || undefined,
        },
      })

      // 결제 실패 처리
      if (response?.code !== undefined) {
        alert(`결제 실패: ${response.message}`)
        setLoading(false)
        return
      }

      // 결제 성공 → 예약 + 분석 진행
      const hour = parseInt(birthHour) || 0
      const minute = parseInt(birthMinute) || 0

      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name,
          customer_phone: phone,
          customer_email: email,
          gender,
          birth_date: birthDate,
          birth_time: String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0'),
          birth_city: birthCity,
          calendar_type: calendarType,
          booking_date: bookingDate || new Date().toISOString().split('T')[0],
          booking_time: bookingTime,
          consultation_type: productId,
          category,
          question,
          amount: product.price,
          payment_status: 'paid',
          payment_method: 'card',
          payment_id: paymentId,
          status: 'confirmed',
        }),
      })

      const data = await res.json()
      if (data.success) {
        router.push(`/booking/success/${data.bookingId}`)
      } else {
        alert('예약 저장 실패: ' + data.message)
      }
    } catch (err) {
      console.error(err)
      alert('결제 처리 중 오류: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  // 테스트용 (결제 없이 진행)
  async function handleTestSubmit() {
    if (!name || !phone || !birthDate) {
      alert('필수 정보를 입력해주세요')
      return
    }

    setLoading(true)
    try {
      const hour = parseInt(birthHour) || 0
      const minute = parseInt(birthMinute) || 0

      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name,
          customer_phone: phone,
          customer_email: email,
          gender,
          birth_date: birthDate,
          birth_time: String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0'),
          birth_city: birthCity,
          calendar_type: calendarType,
          booking_date: bookingDate || new Date().toISOString().split('T')[0],
          booking_time: bookingTime,
          consultation_type: productId,
          category,
          question,
          amount: product.price,
          payment_status: 'paid',
          payment_method: 'test',
          status: 'confirmed',
        }),
      })

      const data = await res.json()
      if (data.success) {
        router.push(`/booking/success/${data.bookingId}`)
      } else {
        alert('오류: ' + data.message)
      }
    } catch (err) {
      alert('오류: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px',
    border: '1px solid #ddd', borderRadius: '10px',
    fontSize: '16px', marginTop: '6px', outline: 'none',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a2744 0%, #2d1b4e 100%)',
      padding: '20px',
      fontFamily: 'sans-serif',
    }}>

      <div style={{ maxWidth: '700px', margin: '0 auto 20px' }}>
        <Link href="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px' }}>
          ← 메인으로
        </Link>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto 20px', textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: '50px', marginBottom: '10px' }}>🔮</div>
        <h1 style={{ fontSize: '28px', margin: '0 0 8px' }}>사주 상담 예약 & 결제</h1>
      </div>

      {/* 진행 상태 */}
      <div style={{ maxWidth: '700px', margin: '0 auto 20px', display: 'flex', gap: '8px' }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{
            flex: 1, height: '6px',
            background: step >= s ? '#c9a84c' : 'rgba(255,255,255,0.2)',
            borderRadius: '3px',
          }} />
        ))}
      </div>

      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '32px',
        maxWidth: '700px',
        margin: '0 auto',
      }}>

        {/* STEP 1: 상품 선택 */}
        {step === 1 && (
          <>
            <h2 style={{ marginTop: 0, color: '#1a2744' }}>1. 상담 종류 선택</h2>

            <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
              {PRODUCTS.map(p => (
                <div key={p.id}
                  onClick={() => setProductId(p.id)}
                  style={{
                    border: productId === p.id ? `3px solid ${p.color}` : '2px solid #ddd',
                    borderRadius: '14px',
                    padding: '20px',
                    cursor: 'pointer',
                    background: productId === p.id ? `${p.color}10` : 'white',
                    position: 'relative',
                  }}>
                  {p.popular && (
                    <div style={{
                      position: 'absolute', top: '-10px', right: '20px',
                      background: '#ef4444', color: 'white',
                      padding: '4px 12px', borderRadius: '12px',
                      fontSize: '12px', fontWeight: 'bold',
                    }}>인기</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <h3 style={{ margin: 0, color: p.color, fontSize: '18px' }}>{p.name}</h3>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>{p.desc}</p>
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: p.color }}>
                      {p.price.toLocaleString()}원
                    </div>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#444' }}>
                    {p.features.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              ))}
            </div>

            <button onClick={() => setStep(2)} style={{
              width: '100%', padding: '16px',
              background: '#1a2744', color: 'white',
              border: 'none', borderRadius: '12px',
              fontSize: '17px', fontWeight: 'bold', cursor: 'pointer',
            }}>다음 →</button>
          </>
        )}

        {/* STEP 2: 고객 정보 */}
        {step === 2 && (
          <>
            <h2 style={{ marginTop: 0, color: '#1a2744' }}>2. 고객 정보</h2>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>이름 *</label>
              <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>연락처 *</label>
              <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-0000-0000" />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>이메일 (영수증)</label>
              <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>성별 *</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                {[{ v: 'male', l: '👨 남성' }, { v: 'female', l: '👩 여성' }].map(o => (
                  <button key={o.v} onClick={() => setGender(o.v)} style={{
                    flex: 1, padding: '12px',
                    border: gender === o.v ? '2px solid #1a2744' : '2px solid #ddd',
                    background: gender === o.v ? '#e8edf5' : 'white',
                    borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
                  }}>{o.l}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>달력</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                {[{ v: 'solar', l: '☀️ 양력' }, { v: 'lunar', l: '🌙 음력' }].map(o => (
                  <button key={o.v} onClick={() => setCalendarType(o.v)} style={{
                    flex: 1, padding: '12px',
                    border: calendarType === o.v ? '2px solid #1a2744' : '2px solid #ddd',
                    background: calendarType === o.v ? '#e8edf5' : 'white',
                    borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
                  }}>{o.l}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>생년월일 *</label>
              <input style={inputStyle} type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>출생 시각</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                <input type="number" min="0" max="23" placeholder="시" value={birthHour}
                  onChange={e => setBirthHour(e.target.value)}
                  style={{ ...inputStyle, textAlign: 'center', fontWeight: 'bold' }} />
                <span>시</span>
                <input type="number" min="0" max="59" placeholder="분" value={birthMinute}
                  onChange={e => setBirthMinute(e.target.value)}
                  style={{ ...inputStyle, textAlign: 'center', fontWeight: 'bold' }} />
                <span>분</span>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>출생 도시</label>
              <select style={inputStyle} value={birthCity} onChange={e => setBirthCity(e.target.value)}>
                {['서울','부산','대구','인천','광주','대전','울산','세종','수원','제주','춘천','강릉','전주','청주','창원','포항','목포','여수','안동','진주'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {needsBookingTime && (
              <>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>대면/전화 상담 일정 *</label>
                  <input style={inputStyle} type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>시간</label>
                  <select style={inputStyle} value={bookingTime} onChange={e => setBookingTime(e.target.value)}>
                    {['10:00','11:00','13:00','14:00','15:00','16:00','17:00','19:00','20:00'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setStep(1)} style={{
                flex: 1, padding: '14px', background: '#f1f5f9',
                border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer',
              }}>← 이전</button>
              <button onClick={() => setStep(3)} style={{
                flex: 2, padding: '14px', background: '#1a2744',
                color: 'white', border: 'none', borderRadius: '10px',
                fontWeight: 'bold', cursor: 'pointer',
              }}>다음 →</button>
            </div>
          </>
        )}

        {/* STEP 3: 상담 분야 + 결제 */}
        {step === 3 && (
          <>
            <h2 style={{ marginTop: 0, color: '#1a2744' }}>3. 상담 분야 & 결제</h2>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>상담 분야</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '6px' }}>
                {[
                  { v: 'general', l: '🔮 종합' },
                  { v: 'love', l: '💕 연애' },
                  { v: 'career', l: '💼 직장' },
                  { v: 'business', l: '🚀 사업' },
                  { v: 'investment', l: '💰 투자' },
                  { v: 'family', l: '👨‍👩 가족' },
                ].map(o => (
                  <button key={o.v} onClick={() => setCategory(o.v)} style={{
                    padding: '8px', borderRadius: '8px',
                    border: category === o.v ? '2px solid #1a2744' : '2px solid #ddd',
                    background: category === o.v ? '#e8edf5' : 'white',
                    cursor: 'pointer', fontSize: '12px',
                    fontWeight: category === o.v ? 'bold' : 'normal',
                  }}>{o.l}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>궁금한 점</label>
              <textarea style={{ ...inputStyle, minHeight: '80px' }}
                value={question} onChange={e => setQuestion(e.target.value)} 
                placeholder="예: 올해 연애 가능한가요?" />
            </div>

            {/* 결제 요약 */}
            <div style={{
              background: '#f8f5ef',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '20px',
              borderLeft: '4px solid #c9a84c',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>상품:</span>
                <strong>{product.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', color: '#c9a84c' }}>
                <span>결제 금액:</span>
                <span>{product.price.toLocaleString()}원</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(2)} style={{
                flex: 1, padding: '16px', background: '#f1f5f9',
                border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer',
              }}>← 이전</button>
              <button onClick={handlePayment} disabled={loading} style={{
                flex: 2, padding: '16px',
                background: loading ? '#888' : 'linear-gradient(135deg, #c9a84c, #b8973b)',
                color: 'white', border: 'none', borderRadius: '12px',
                fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
              }}>
                {loading ? '⏳ 처리 중...' : `💳 ${product.price.toLocaleString()}원 결제`}
              </button>
            </div>

            {/* 테스트 버튼 */}
            <button onClick={handleTestSubmit} disabled={loading} style={{
              width: '100%', marginTop: '10px',
              padding: '12px', background: 'white',
              color: '#888', border: '1px dashed #ddd',
              borderRadius: '10px', cursor: 'pointer', fontSize: '13px',
            }}>
              🧪 테스트 모드 (결제 없이 진행)
            </button>
          </>
        )}
      </div>
    </div>
  )
}