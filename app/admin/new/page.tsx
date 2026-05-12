'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FamilyInfoInput from '../../../components/FamilyInfoInput'

export default function NewConsultation() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState('')
  const [gender, setGender] = useState('male')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [familyInfo, setFamilyInfo] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthHour, setBirthHour] = useState('')
  const [birthMinute, setBirthMinute] = useState('')
  const [birthCity, setBirthCity] = useState('서울')
  const [calendarType, setCalendarType] = useState('solar')
  const [leapMonth, setLeapMonth] = useState(false)
  const [category, setCategory] = useState('general')
  const [question, setQuestion] = useState('')

  const handleFamilyChange = useCallback((text: string) => {
    setFamilyInfo(text)
  }, [])

  const handleSubmit = async () => {
    if (!name || !phone || !birthDate) {
      alert('이름, 연락처, 생년월일은 필수입니다!')
      return
    }

    const hour = parseInt(birthHour) || 0
    const minute = parseInt(birthMinute) || 0

    setLoading(true)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, gender, phone, email, address, familyInfo,
          birthDate,
          birthTime: String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0'),
          birthCity, calendarType, leapMonth, category, question,
        }),
      })

      const data = await res.json()

      if (data.success) {
        router.push('/admin/result/' + data.consultationId)
      } else {
        alert('오류: ' + (data.message || '알 수 없는 오류'))
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
    fontFamily: 'sans-serif', boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontWeight: 'bold', color: '#444', fontSize: '14px',
  }

  const sectionTitle: React.CSSProperties = {
    color: '#1a2744', marginTop: '32px', fontSize: '17px',
    borderBottom: '2px solid #c9a84c', paddingBottom: '8px',
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f1f5f9',
      padding: '20px', fontFamily: 'sans-serif',
    }}>

      <div style={{ maxWidth: '600px', margin: '0 auto 16px' }}>
        <Link href="/admin" style={{
          color: '#1a2744', textDecoration: 'none',
          fontSize: '14px', fontWeight: 'bold',
        }}>← 관리자 메인</Link>
      </div>

      <div style={{
        background: '#1a2744', color: 'white',
        padding: '20px', borderRadius: '16px',
        maxWidth: '600px', margin: '0 auto 16px',
      }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>🔮 새 상담 입력</h1>
        <p style={{ margin: '6px 0 0', color: '#93c5fd', fontSize: '13px' }}>
          AI가 자동으로 사주를 분석합니다 (약 6~8분)
        </p>
      </div>

      <div style={{
        background: 'white', borderRadius: '16px',
        padding: '24px', maxWidth: '600px', margin: '0 auto',
        boxSizing: 'border-box',
      }}>

        {/* 기본 정보 */}
        <h3 style={{ ...sectionTitle, marginTop: 0 }}>👤 기본 정보</h3>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>이름 *</label>
          <input style={inputStyle} placeholder="홍길동" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>성별 *</label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            {[{ v: 'male', l: '👨 남성' }, { v: 'female', l: '👩 여성' }].map(o => (
              <button key={o.v} onClick={() => setGender(o.v)} style={{
                flex: 1, padding: '12px', borderRadius: '10px',
                border: gender === o.v ? '2px solid #1a2744' : '2px solid #ddd',
                background: gender === o.v ? '#e8edf5' : 'white',
                fontWeight: 'bold', cursor: 'pointer', fontSize: '15px',
              }}>{o.l}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>연락처 *</label>
          <input style={inputStyle} placeholder="010-0000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>이메일 (선택)</label>
          <input style={inputStyle} type="email" placeholder="example@email.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>주소 (선택)</label>
          <input style={inputStyle} placeholder="서울시 강남구 ..." value={address} onChange={e => setAddress(e.target.value)} />
        </div>

        {/* 출생 정보 */}
        <h3 style={sectionTitle}>🎂 출생 정보</h3>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>달력 종류 *</label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            {[{ v: 'solar', l: '☀️ 양력' }, { v: 'lunar', l: '🌙 음력' }].map(o => (
              <button key={o.v} onClick={() => setCalendarType(o.v)} style={{
                flex: 1, padding: '12px', borderRadius: '10px',
                border: calendarType === o.v ? '2px solid #1a2744' : '2px solid #ddd',
                background: calendarType === o.v ? '#e8edf5' : 'white',
                fontWeight: 'bold', cursor: 'pointer', fontSize: '15px',
              }}>{o.l}</button>
            ))}
          </div>
          {calendarType === 'lunar' && (
            <label style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              marginTop: '10px', padding: '10px',
              background: '#fef3c7', borderRadius: '8px', cursor: 'pointer',
            }}>
              <input type="checkbox" checked={leapMonth} onChange={e => setLeapMonth(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              <span style={{ fontSize: '14px', color: '#92400e', fontWeight: 'bold' }}>윤달입니다</span>
            </label>
          )}
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>생년월일 *</label>
          <input style={inputStyle} type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>출생 시각 (24시간)</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
            <input type="number" min="0" max="23" placeholder="시" value={birthHour}
              onChange={e => setBirthHour(e.target.value)}
              style={{ ...inputStyle, textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }} />
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>시</span>
            <input type="number" min="0" max="59" placeholder="분" value={birthMinute}
              onChange={e => setBirthMinute(e.target.value)}
              style={{ ...inputStyle, textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }} />
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>분</span>
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>출생 도시</label>
          <select style={inputStyle} value={birthCity} onChange={e => setBirthCity(e.target.value)}>
            {['서울','부산','대구','인천','광주','대전','울산','세종','수원','제주','춘천','강릉','전주','청주','창원','포항','목포','여수','안동','진주'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* 가족 관계 (버튼식) */}
        <h3 style={sectionTitle}>👨‍👩‍👧 가족 관계 (선택)</h3>
        <FamilyInfoInput onChange={handleFamilyChange} />

        {/* 상담 내용 */}
        <h3 style={sectionTitle}>💬 상담 내용</h3>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>상담 분야</label>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px', marginTop: '8px',
          }}>
            {[
              { v: 'general', l: '🔮 종합' }, { v: 'love', l: '💕 연애' }, { v: 'career', l: '💼 직장' },
              { v: 'business', l: '🚀 사업' }, { v: 'investment', l: '💰 투자' }, { v: 'study', l: '📚 학업' },
              { v: 'moving', l: '🏠 이사' }, { v: 'family', l: '👨‍👩 가족' }, { v: 'compatibility', l: '☯️ 궁합' },
            ].map(o => (
              <button key={o.v} onClick={() => setCategory(o.v)} style={{
                padding: '10px 4px', borderRadius: '8px',
                border: category === o.v ? '2px solid #1a2744' : '2px solid #ddd',
                background: category === o.v ? '#e8edf5' : 'white',
                cursor: 'pointer', fontSize: '12px',
                fontWeight: category === o.v ? 'bold' : 'normal',
              }}>{o.l}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>궁금한 질문 (1개 기본 제공)</label>
          <p style={{ fontSize: '12px', color: '#888', margin: '4px 0 6px' }}>
            💡 추가 질문은 결과 페이지에서 결제 후 가능
          </p>
          <textarea
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
            placeholder="예: 올해 안에 이직을 해야 할까요?"
            value={question} onChange={e => setQuestion(e.target.value)}
          />
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '16px',
          background: loading ? '#888' : '#c9a84c',
          color: 'white', borderRadius: '14px',
          border: 'none', fontSize: '18px', fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? '⏳ AI 심층 분석 중... (약 7~9분)' : '🔮 사주 분석 시작'}
        </button>

      </div>
    </div>
  )
}