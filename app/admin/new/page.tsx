'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FamilyInfoInput from '../../../components/FamilyInfoInput'

const KOREA_CITIES = [
  '서울','부산','대구','인천','광주','대전','울산','세종',
  '수원','제주','춘천','강릉','전주','청주','창원',
  '포항','목포','여수','안동','진주',
]

const FOREIGN_CITIES_BY_COUNTRY: Record<string, string[]> = {
  '일본': ['도쿄','오사카','교토','나고야','삿포로','후쿠오카'],
  '중국': ['베이징','상하이','광저우','선전','청두','시안','홍콩','타이베이'],
  '동남아': ['방콕','싱가포르','쿠알라룸푸르','자카르타','하노이','호치민','마닐라','프놈펜'],
  '미국': ['뉴욕','로스앤젤레스','시카고','샌프란시스코','시애틀','워싱턴','보스턴','휴스턴','애틀랜타','라스베가스','하와이'],
  '캐나다': ['토론토','밴쿠버','몬트리올','캘거리'],
  '유럽': ['런던','파리','베를린','로마','마드리드','암스테르담','비엔나','취리히','스톡홀름','모스크바','이스탄불'],
  '호주/뉴질랜드': ['시드니','멜버른','브리즈번','오클랜드'],
  '중동': ['두바이','도하','리야드','테헤란'],
  '인도': ['뉴델리','뭄바이','벵갈루루'],
  '남미': ['상파울루','리우데자네이루','부에노스아이레스','리마'],
  '아프리카': ['카이로','요하네스버그','나이로비'],
}

export default function NewConsultation() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // 기본 정보 (모두 필수)
  const [name, setName] = useState('')
  const [gender, setGender] = useState('male')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [currentAddress, setCurrentAddress] = useState('')

  // 가족 정보
  const [familyInfo, setFamilyInfo] = useState('')
  const [marriageDate, setMarriageDate] = useState('')
  const [divorceDate, setDivorceDate] = useState('')
  const [spouseBirth, setSpouseBirth] = useState('')
  const [childrenInfo, setChildrenInfo] = useState('')
  const [majorEvents, setMajorEvents] = useState('')
  const [bodyType, setBodyType] = useState('')
  const [healthStatus, setHealthStatus] = useState('')

  // 출생 정보
  const [birthDate, setBirthDate] = useState('')
  const [birthHour, setBirthHour] = useState('')
  const [birthMinute, setBirthMinute] = useState('')
  const [birthCountry, setBirthCountry] = useState('대한민국')
  const [birthRegion, setBirthRegion] = useState('한국')  // 일본/중국/미국 등
  const [birthCity, setBirthCity] = useState('서울')
  const [calendarType, setCalendarType] = useState('solar')
  const [leapMonth, setLeapMonth] = useState(false)

  // 상담 내용
  const [category, setCategory] = useState('general')
  const [question, setQuestion] = useState('')

  const handleFamilyChange = useCallback((data: any) => {
    setFamilyInfo(data.text)
    setMarriageDate(data.marriageDate)
    setDivorceDate(data.divorceDate)
    setSpouseBirth(data.spouseBirth)
    setChildrenInfo(data.childrenInfo)
    setMajorEvents(data.majorEvents)
    setBodyType(data.bodyType)
    setHealthStatus(data.healthStatus)
  }, [])

  const handleSubmit = async () => {
    // 모든 필수 항목 검증
    if (!name) { alert('이름을 입력해주세요'); return }
    if (!phone) { alert('연락처를 입력해주세요'); return }
    if (!email) { alert('이메일을 입력해주세요'); return }
    if (!currentAddress) { alert('현재 주소를 입력해주세요'); return }
    if (!birthDate) { alert('생년월일을 입력해주세요'); return }
    if (!birthHour && birthHour !== '0') { alert('출생 시각을 입력해주세요'); return }

    const hour = parseInt(birthHour) || 0
    const minute = parseInt(birthMinute) || 0

    setLoading(true)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, gender, phone, email,
          address: currentAddress,
          familyInfo, marriageDate, divorceDate, spouseBirth, childrenInfo,
          majorEvents, bodyType, healthStatus,
          birthDate,
          birthTime: String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0'),
          birthCity, birthCountry,
          calendarType, leapMonth, category, question,
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

  // 지역 변경 시 도시 자동 변경
  const handleRegionChange = (region: string) => {
    setBirthRegion(region)
    if (region === '한국') {
      setBirthCountry('대한민국')
      setBirthCity('서울')
    } else {
      setBirthCountry(region)
      const cities = FOREIGN_CITIES_BY_COUNTRY[region]
      if (cities && cities.length > 0) {
        setBirthCity(cities[0])
      }
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

  const requiredMark = <span style={{ color: '#ef4444' }}> *</span>

  // 현재 선택된 지역의 도시 목록
  const cityList = birthRegion === '한국'
    ? KOREA_CITIES
    : (FOREIGN_CITIES_BY_COUNTRY[birthRegion] || [])

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
          모든 항목을 입력하면 더 정확한 분석이 가능합니다 (약 7~9분)
        </p>
      </div>

      <div style={{
        background: 'white', borderRadius: '16px',
        padding: '24px', maxWidth: '600px', margin: '0 auto',
        boxSizing: 'border-box',
      }}>

        {/* 기본 정보 */}
        <h3 style={{ ...sectionTitle, marginTop: 0 }}>👤 기본 정보 (모두 필수)</h3>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>이름{requiredMark}</label>
          <input style={inputStyle} placeholder="홍길동" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>성별{requiredMark}</label>
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
          <label style={labelStyle}>연락처{requiredMark}</label>
          <input style={inputStyle} placeholder="010-0000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>이메일{requiredMark}</label>
          <input style={inputStyle} type="email" placeholder="example@email.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>현재 거주 주소{requiredMark}</label>
          <p style={{ fontSize: '12px', color: '#888', margin: '4px 0 6px' }}>
            💡 이사/여행 방위 추천 시 사용됩니다
          </p>
          <input style={inputStyle} placeholder="서울시 강남구 ..." value={currentAddress} onChange={e => setCurrentAddress(e.target.value)} />
        </div>

        {/* 출생 정보 */}
        <h3 style={sectionTitle}>🎂 출생 정보</h3>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>달력 종류{requiredMark}</label>
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
          <label style={labelStyle}>생년월일{requiredMark}</label>
          <input style={inputStyle} type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>출생 시각{requiredMark}</label>
          <p style={{ fontSize: '12px', color: '#888', margin: '4px 0 6px' }}>
            💡 24시간 형식 (모르면 12시 0분)
          </p>
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

        {/* 출생 국가/도시 (외국인 지원) */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>출생 지역{requiredMark}</label>
          <select style={inputStyle} value={birthRegion} onChange={e => handleRegionChange(e.target.value)}>
            <option value="한국">🇰🇷 한국</option>
            <option value="일본">🇯🇵 일본</option>
            <option value="중국">🇨🇳 중국/대만/홍콩</option>
            <option value="동남아">🇹🇭 동남아시아</option>
            <option value="미국">🇺🇸 미국</option>
            <option value="캐나다">🇨🇦 캐나다</option>
            <option value="유럽">🇪🇺 유럽</option>
            <option value="호주/뉴질랜드">🇦🇺 호주/뉴질랜드</option>
            <option value="중동">🇦🇪 중동</option>
            <option value="인도">🇮🇳 인도</option>
            <option value="남미">🌎 남미</option>
            <option value="아프리카">🌍 아프리카</option>
          </select>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>출생 도시{requiredMark}</label>
          <select style={inputStyle} value={birthCity} onChange={e => setBirthCity(e.target.value)}>
            {cityList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {birthRegion !== '한국' && (
            <p style={{ fontSize: '12px', color: '#3b82f6', margin: '4px 0 0' }}>
              🌐 해외 출생: 현지 시간 기준으로 입력해주세요
            </p>
          )}
        </div>

        {/* 가족 관계 */}
        <h3 style={sectionTitle}>👨‍👩‍👧 가족 관계 (정확도 향상)</h3>
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