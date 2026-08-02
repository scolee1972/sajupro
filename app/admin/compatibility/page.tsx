'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const RELATIONSHIPS = [
  { v: 'couple', l: '💕 연인' },
  { v: 'married', l: '💍 부부' },
  { v: 'family', l: '👨‍👩 가족' },
  { v: 'friend', l: '🤝 친구' },
  { v: 'colleague', l: '💼 직장동료' },
  { v: 'business', l: '🚀 사업파트너' },
  { v: 'parent_child', l: '👶 부모-자녀' },
  { v: 'siblings', l: '👬 형제자매' },
]

const CITIES = [
  '서울','부산','대구','인천','광주','대전','울산','세종',
  '수원','제주','춘천','강릉','전주','청주','창원',
  '포항','목포','여수','안동','진주',
]

export default function CompatibilityPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [relationship, setRelationship] = useState('couple')
  const [question, setQuestion] = useState('')

  // 첫 번째 사람
  const [p1Name, setP1Name] = useState('')
  const [p1Gender, setP1Gender] = useState('male')
  const [p1Calendar, setP1Calendar] = useState('solar')
  const [p1LeapMonth, setP1LeapMonth] = useState(false)
  const [p1Date, setP1Date] = useState('')
  const [p1Hour, setP1Hour] = useState('')
  const [p1Minute, setP1Minute] = useState('')
  const [p1City, setP1City] = useState('서울')

  // 두 번째 사람
  const [p2Name, setP2Name] = useState('')
  const [p2Gender, setP2Gender] = useState('female')
  const [p2Calendar, setP2Calendar] = useState('solar')
  const [p2LeapMonth, setP2LeapMonth] = useState(false)
  const [p2Date, setP2Date] = useState('')
  const [p2Hour, setP2Hour] = useState('')
  const [p2Minute, setP2Minute] = useState('')
  const [p2City, setP2City] = useState('서울')

  async function handleSubmit() {
    if (!p1Name || !p2Name || !p1Date || !p2Date) {
      alert('두 사람의 이름과 생년월일은 필수입니다!')
      return
    }

    const h1 = parseInt(p1Hour) || 0
    const m1 = parseInt(p1Minute) || 0
    const h2 = parseInt(p2Hour) || 0
    const m2 = parseInt(p2Minute) || 0

    setLoading(true)

    try {
      const res = await fetch('/api/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person1: {
            name: p1Name,
            gender: p1Gender,
            calendar: p1Calendar,
            leapMonth: p1LeapMonth,
            birth_date: p1Date,
            birth_time: String(h1).padStart(2,'0') + ':' + String(m1).padStart(2,'0'),
            birth_city: p1City,
          },
          person2: {
            name: p2Name,
            gender: p2Gender,
            calendar: p2Calendar,
            leapMonth: p2LeapMonth,
            birth_date: p2Date,
            birth_time: String(h2).padStart(2,'0') + ':' + String(m2).padStart(2,'0'),
            birth_city: p2City,
          },
          relationship, question,
        }),
      })

      const data = await res.json()
      if (data.success) {
        router.push('/admin/compatibility/result/' + data.id)
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
    width: '100%', padding: '10px 14px',
    border: '1px solid #ddd', borderRadius: '8px',
    fontSize: '14px', marginTop: '4px', outline: 'none',
    fontFamily: 'sans-serif', boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontWeight: 'bold', color: '#444', fontSize: '13px',
  }

  function PersonCard({ 
    title, color, 
    name, setName, 
    gender, setGender, 
    calendar, setCalendar, 
    leapMonth, setLeapMonth,
    date, setDate, 
    hour, setHour, 
    minute, setMinute, 
    city, setCity 
  }: any) {
    return (
      <div style={{
        background: 'white', borderRadius: '12px',
        padding: '20px', borderTop: `4px solid ${color}`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      }}>
        <h3 style={{ marginTop: 0, color, fontSize: '16px' }}>{title}</h3>

        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>이름 *</label>
          <input style={inputStyle} placeholder="이름" value={name} onChange={(e: any) => setName(e.target.value)} />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>성별</label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            {[{ v: 'male', l: '👨' }, { v: 'female', l: '👩' }].map(o => (
              <button key={o.v} onClick={() => setGender(o.v)} style={{
                flex: 1, padding: '8px', borderRadius: '6px',
                border: gender === o.v ? `2px solid ${color}` : '2px solid #ddd',
                background: gender === o.v ? color : 'white',
                color: gender === o.v ? 'white' : '#333',
                fontWeight: 'bold', cursor: 'pointer',
              }}>{o.l} {o.v === 'male' ? '남' : '여'}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>달력</label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            {[{ v: 'solar', l: '☀️ 양력' }, { v: 'lunar', l: '🌙 음력' }].map(o => (
              <button key={o.v} onClick={() => setCalendar(o.v)} style={{
                flex: 1, padding: '8px', borderRadius: '6px',
                border: calendar === o.v ? `2px solid ${color}` : '2px solid #ddd',
                background: calendar === o.v ? color : 'white',
                color: calendar === o.v ? 'white' : '#333',
                fontWeight: 'bold', cursor: 'pointer', fontSize: '13px',
              }}>{o.l}</button>
            ))}
          </div>
          {calendar === 'lunar' && (
            <label style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              marginTop: '8px', padding: '8px',
              background: '#fef3c7', borderRadius: '6px', cursor: 'pointer',
            }}>
              <input type="checkbox" checked={leapMonth} 
                onChange={(e: any) => setLeapMonth(e.target.checked)}
                style={{ width: '16px', height: '16px' }} />
              <span style={{ fontSize: '12px', color: '#92400e', fontWeight: 'bold' }}>
                윤달입니다
              </span>
            </label>
          )}
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>생년월일 *</label>
          <input type="date" style={inputStyle} value={date} onChange={(e: any) => setDate(e.target.value)} />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>출생 시각 (24시간)</label>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
            <input 
              type="number" 
              min="0" 
              max="23" 
              step="1"
              placeholder="시" 
              value={hour}
              onChange={(e: any) => setHour(e.target.value)}
              style={{ ...inputStyle, textAlign: 'center', fontWeight: 'bold' }} 
            />
            <span style={{ fontSize: '14px' }}>시</span>
            <input 
              type="number" 
              min="0" 
              max="59" 
              step="1"
              placeholder="분" 
              value={minute}
              onChange={(e: any) => setMinute(e.target.value)}
              style={{ ...inputStyle, textAlign: 'center', fontWeight: 'bold' }} 
            />
            <span style={{ fontSize: '14px' }}>분</span>
          </div>
        </div>

        <div>
          <label style={labelStyle}>출생 도시</label>
          <select style={inputStyle} value={city} onChange={(e: any) => setCity(e.target.value)}>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f1f5f9',
      padding: '20px', fontFamily: 'sans-serif',
    }}>

      <div style={{ maxWidth: '900px', margin: '0 auto 16px' }}>
        <Link href="/admin" style={{
          color: '#1a2744', textDecoration: 'none',
          fontSize: '14px', fontWeight: 'bold',
        }}>← 관리자 메인으로</Link>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #ec4899, #be185d)',
        color: 'white', padding: '24px', borderRadius: '16px',
        maxWidth: '900px', margin: '0 auto 20px',
      }}>
        <h1 style={{ margin: 0, fontSize: '22px' }}>☯️ 궁합 분석</h1>
        <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
          두 사람의 사주를 비교 분석합니다
        </p>
      </div>

      {/* 관계 종류 */}
      <div style={{
        background: 'white', padding: '20px', borderRadius: '16px',
        maxWidth: '900px', margin: '0 auto 20px',
      }}>
        <label style={{ ...labelStyle, fontSize: '15px' }}>관계 종류</label>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '8px', marginTop: '12px',
        }}>
          {RELATIONSHIPS.map(o => (
            <button key={o.v} onClick={() => setRelationship(o.v)} style={{
              padding: '12px 8px', borderRadius: '10px',
              border: relationship === o.v ? '2px solid #ec4899' : '2px solid #ddd',
              background: relationship === o.v ? '#fdf2f8' : 'white',
              cursor: 'pointer', fontSize: '13px',
              fontWeight: relationship === o.v ? 'bold' : 'normal',
            }}>{o.l}</button>
          ))}
        </div>
      </div>

      {/* 두 사람 입력 */}
      <div style={{
        maxWidth: '900px', margin: '0 auto 20px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
      }}>
        <PersonCard 
          title="👤 첫 번째 사람" 
          color="#3b82f6"
          name={p1Name} setName={setP1Name}
          gender={p1Gender} setGender={setP1Gender}
          calendar={p1Calendar} setCalendar={setP1Calendar}
          leapMonth={p1LeapMonth} setLeapMonth={setP1LeapMonth}
          date={p1Date} setDate={setP1Date}
          hour={p1Hour} setHour={setP1Hour}
          minute={p1Minute} setMinute={setP1Minute}
          city={p1City} setCity={setP1City}
        />
        <PersonCard 
          title="👤 두 번째 사람" 
          color="#ec4899"
          name={p2Name} setName={setP2Name}
          gender={p2Gender} setGender={setP2Gender}
          calendar={p2Calendar} setCalendar={setP2Calendar}
          leapMonth={p2LeapMonth} setLeapMonth={setP2LeapMonth}
          date={p2Date} setDate={setP2Date}
          hour={p2Hour} setHour={setP2Hour}
          minute={p2Minute} setMinute={setP2Minute}
          city={p2City} setCity={setP2City}
        />
      </div>

      {/* 질문 */}
      <div style={{
        background: 'white', padding: '20px', borderRadius: '16px',
        maxWidth: '900px', margin: '0 auto 20px',
      }}>
        <label style={labelStyle}>궁금한 내용 (선택)</label>
        <textarea
          value={question} onChange={e => setQuestion(e.target.value)}
          placeholder="예: 결혼해도 괜찮을까요?"
          style={{
            ...inputStyle, minHeight: '80px', resize: 'vertical',
          }}
        />
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto 40px' }}>
        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '18px',
          background: loading ? '#888' : 'linear-gradient(135deg, #ec4899, #be185d)',
          color: 'white', border: 'none', borderRadius: '14px',
          fontSize: '20px', fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? '⏳ 궁합 분석 중... (약 2~3분)' : '☯️ 궁합 분석 시작'}
        </button>
      </div>

    </div>
  )
}