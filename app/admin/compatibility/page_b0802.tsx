'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CompatibilityPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // 첫 번째 사람
  const [p1Name, setP1Name] = useState('')
  const [p1Gender, setP1Gender] = useState('male')
  const [p1Date, setP1Date] = useState('')
  const [p1Hour, setP1Hour] = useState('09')
  const [p1Minute, setP1Minute] = useState('00')
  const [p1City, setP1City] = useState('서울')
  const [p1Calendar, setP1Calendar] = useState('solar')

  // 두 번째 사람
  const [p2Name, setP2Name] = useState('')
  const [p2Gender, setP2Gender] = useState('female')
  const [p2Date, setP2Date] = useState('')
  const [p2Hour, setP2Hour] = useState('09')
  const [p2Minute, setP2Minute] = useState('00')
  const [p2City, setP2City] = useState('서울')
  const [p2Calendar, setP2Calendar] = useState('solar')

  // 관계 정보
  const [relationship, setRelationship] = useState('couple')
  const [question, setQuestion] = useState('')

  async function handleSubmit() {
    if (!p1Name || !p1Date || !p2Name || !p2Date) {
      alert('두 사람의 이름과 생년월일을 모두 입력해주세요!')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person1: {
            name: p1Name,
            gender: p1Gender,
            birth_date: p1Date,
            birth_time: p1Hour + ':' + p1Minute,
            birth_city: p1City,
            calendar: p1Calendar,
          },
          person2: {
            name: p2Name,
            gender: p2Gender,
            birth_date: p2Date,
            birth_time: p2Hour + ':' + p2Minute,
            birth_city: p2City,
            calendar: p2Calendar,
          },
          relationship,
          question,
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
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    marginTop: '4px',
    outline: 'none',
    fontFamily: 'sans-serif',
  }

  const labelStyle: React.CSSProperties = {
    fontWeight: 'bold',
    color: '#444',
    fontSize: '13px',
  }

  const cities = [
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
    '수원', '제주', '춘천', '강릉', '전주', '청주', '창원',
    '포항', '목포', '여수', '안동', '진주',
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f1f5f9',
      padding: '30px 20px',
      fontFamily: 'sans-serif',
    }}>

      {/* 상단 */}
      <div style={{ maxWidth: '900px', margin: '0 auto 16px' }}>
        <Link href="/admin" style={{
          color: '#1a2744', textDecoration: 'none',
          fontSize: '14px', fontWeight: 'bold',
        }}>
          ← 관리자 메인으로
        </Link>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #ec4899, #be185d)',
        color: 'white',
        padding: '24px',
        borderRadius: '16px',
        maxWidth: '900px',
        margin: '0 auto 20px',
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>☯️ 궁합 분석</h1>
        <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
          두 사람의 사주를 비교 분석하여 관계의 흐름을 봅니다
        </p>
      </div>

      {/* 관계 종류 선택 */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '16px',
        maxWidth: '900px',
        margin: '0 auto 20px',
      }}>
        <label style={{ ...labelStyle, fontSize: '15px' }}>관계 종류</label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '8px',
          marginTop: '12px',
        }}>
          {[
            { v: 'couple', l: '💕 연인' },
            { v: 'married', l: '💍 부부' },
            { v: 'family', l: '👨‍👩 가족' },
            { v: 'friend', l: '🤝 친구' },
            { v: 'colleague', l: '💼 직장동료' },
            { v: 'business', l: '🚀 사업파트너' },
            { v: 'parent_child', l: '👶 부모-자녀' },
            { v: 'siblings', l: '👬 형제자매' },
          ].map(o => (
            <button
              key={o.v}
              onClick={() => setRelationship(o.v)}
              style={{
                padding: '12px 8px',
                borderRadius: '10px',
                border: relationship === o.v ? '2px solid #ec4899' : '2px solid #ddd',
                background: relationship === o.v ? '#fdf2f8' : 'white',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: relationship === o.v ? 'bold' : 'normal',
              }}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      {/* 두 사람 입력 (좌우 분할) */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto 20px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
      }}>
        
        {/* 첫 번째 사람 */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '16px',
          borderTop: '4px solid #3b82f6',
        }}>
          <h3 style={{ marginTop: 0, color: '#3b82f6', fontSize: '16px' }}>
            👤 첫 번째 사람
          </h3>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>이름 *</label>
            <input style={inputStyle} value={p1Name} onChange={e => setP1Name(e.target.value)} placeholder="홍길동" />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>성별</label>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              {[{ v: 'male', l: '남' }, { v: 'female', l: '여' }].map(o => (
                <button
                  key={o.v}
                  onClick={() => setP1Gender(o.v)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: p1Gender === o.v ? '2px solid #3b82f6' : '2px solid #ddd',
                    background: p1Gender === o.v ? '#dbeafe' : 'white',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>달력</label>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              {[{ v: 'solar', l: '양력' }, { v: 'lunar', l: '음력' }].map(o => (
                <button
                  key={o.v}
                  onClick={() => setP1Calendar(o.v)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: p1Calendar === o.v ? '2px solid #3b82f6' : '2px solid #ddd',
                    background: p1Calendar === o.v ? '#dbeafe' : 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>생년월일 *</label>
            <input style={inputStyle} type="date" value={p1Date} onChange={e => setP1Date(e.target.value)} />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>출생시각</label>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <select style={inputStyle} value={p1Hour} onChange={e => setP1Hour(e.target.value)}>
                {Array.from({ length: 24 }, (_, i) => {
                  const h = String(i).padStart(2, '0')
                  return <option key={h} value={h}>{h}시</option>
                })}
              </select>
              <select style={inputStyle} value={p1Minute} onChange={e => setP1Minute(e.target.value)}>
                {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}분</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>출생도시</label>
            <select style={inputStyle} value={p1City} onChange={e => setP1City(e.target.value)}>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* 두 번째 사람 */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '16px',
          borderTop: '4px solid #ec4899',
        }}>
          <h3 style={{ marginTop: 0, color: '#ec4899', fontSize: '16px' }}>
            👤 두 번째 사람
          </h3>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>이름 *</label>
            <input style={inputStyle} value={p2Name} onChange={e => setP2Name(e.target.value)} placeholder="이몽룡" />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>성별</label>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              {[{ v: 'male', l: '남' }, { v: 'female', l: '여' }].map(o => (
                <button
                  key={o.v}
                  onClick={() => setP2Gender(o.v)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: p2Gender === o.v ? '2px solid #ec4899' : '2px solid #ddd',
                    background: p2Gender === o.v ? '#fdf2f8' : 'white',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>달력</label>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              {[{ v: 'solar', l: '양력' }, { v: 'lunar', l: '음력' }].map(o => (
                <button
                  key={o.v}
                  onClick={() => setP2Calendar(o.v)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: p2Calendar === o.v ? '2px solid #ec4899' : '2px solid #ddd',
                    background: p2Calendar === o.v ? '#fdf2f8' : 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>생년월일 *</label>
            <input style={inputStyle} type="date" value={p2Date} onChange={e => setP2Date(e.target.value)} />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>출생시각</label>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <select style={inputStyle} value={p2Hour} onChange={e => setP2Hour(e.target.value)}>
                {Array.from({ length: 24 }, (_, i) => {
                  const h = String(i).padStart(2, '0')
                  return <option key={h} value={h}>{h}시</option>
                })}
              </select>
              <select style={inputStyle} value={p2Minute} onChange={e => setP2Minute(e.target.value)}>
                {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}분</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>출생도시</label>
            <select style={inputStyle} value={p2City} onChange={e => setP2City(e.target.value)}>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* 질문 */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '16px',
        maxWidth: '900px',
        margin: '0 auto 20px',
      }}>
        <label style={labelStyle}>궁금한 내용 (선택)</label>
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="예: 결혼해도 괜찮을까요? 사업 동업이 잘 풀릴까요?"
          style={{
            ...inputStyle,
            minHeight: '80px',
            resize: 'vertical',
          }}
        />
      </div>

      {/* 분석 시작 */}
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            padding: '18px',
            background: loading ? '#888' : 'linear-gradient(135deg, #ec4899, #be185d)',
            color: 'white',
            border: 'none',
            borderRadius: '14px',
            fontSize: '20px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '⏳ 궁합 분석 중... (약 1분)' : '☯️ 궁합 분석 시작'}
        </button>
      </div>

    </div>
  )
}