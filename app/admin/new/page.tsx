'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FamilyInfoInput from '../../../components/FamilyInfoInput'

const KOREA_CITIES_BY_REGION: Record<string, string[]> = {
  '특별시/광역시': [
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종'
  ],
  '경기도': [
    '수원', '고양', '용인', '성남', '부천', '안산', '안양', '남양주',
    '화성', '평택', '의정부', '시흥', '파주', '김포', '광명', '광주(경기)',
    '군포', '오산', '이천', '양주', '안성', '구리', '포천', '의왕',
    '하남', '여주', '동두천', '가평', '연천', '양평', '과천'
  ],
  '강원도': [
    '춘천', '원주', '강릉', '동해', '태백', '속초', '삼척', '홍천',
    '횡성', '영월', '평창', '정선', '철원', '화천', '양구', '인제',
    '고성(강원)', '양양'
  ],
  '충청북도': [
    '청주', '충주', '제천', '보은', '옥천', '영동', '증평', '진천',
    '괴산', '음성', '단양'
  ],
  '충청남도': [
    '천안', '공주', '보령', '아산', '서산', '논산', '계룡', '당진',
    '금산', '부여', '서천', '청양', '홍성', '예산', '태안'
  ],
  '전라북도': [
    '전주', '군산', '익산', '정읍', '남원', '김제', '완주', '진안',
    '무주', '장수', '임실', '순창', '고창', '부안'
  ],
  '전라남도': [
    '목포', '여수', '순천', '나주', '광양', '담양', '곡성', '구례',
    '고흥', '보성', '화순', '장흥', '강진', '해남', '영암', '무안',
    '함평', '영광', '장성', '완도', '진도', '신안'
  ],
  '경상북도': [
    '포항', '경주', '김천', '안동', '구미', '영주', '영천', '상주',
    '문경', '경산', '군위', '의성', '청송', '영양', '영덕', '청도',
    '고령', '성주', '칠곡', '예천', '봉화', '울진', '울릉'
  ],
  '경상남도': [
    '창원', '진주', '통영', '사천', '김해', '밀양', '거제', '양산',
    '의령', '함안', '창녕', '고성(경남)', '남해', '하동', '산청', '함양',
    '거창', '합천'
  ],
  '제주도': [
    '제주', '서귀포'
  ],
}

const FOREIGN_CITIES_BY_COUNTRY: Record<string, string[]> = {
  '일본': ['도쿄','요코하마','오사카','나고야','삿포로','고베','교토','후쿠오카','히로시마','센다이','가와사키','사이타마','기타큐슈','치바','카나자와','나가사키','오키나와','나라','오이타','가고시마'],
  '중국/대만/홍콩': ['베이징','상하이','광저우','선전','충칭','톈진','청두','난징','항저우','우한','시안','쑤저우','샤먼','창사','따롄','칭다오','지난','선양','하얼빈','쿤밍','홍콩','마카오','타이베이','가오슝','타이중'],
  '동남아시아': ['방콕','치앙마이','푸켓','싱가포르','쿠알라룸푸르','조호르바루','페낭','자카르타','수라바야','발리','반둥','하노이','호치민','다낭','나짱','마닐라','세부','다바오','프놈펜','시엠립','비엔티안','루앙프라방','양곤','만달레이'],
  '인도/남아시아': ['뉴델리','뭄바이','벵갈루루','콜카타','첸나이','하이데라바드','푸네','카트만두','다카','콜롬보'],
  '미국': ['뉴욕','로스앤젤레스','시카고','샌프란시스코','시애틀','워싱턴','보스턴','휴스턴','애틀랜타','라스베가스','마이애미','덴버','피닉스','샌디에고','댈러스','필라델피아','디트로이트','미니애폴리스','올랜도','뉴올리언스','포틀랜드','하와이(호놀룰루)','알래스카(앵커리지)'],
  '캐나다': ['토론토','밴쿠버','몬트리올','캘거리','오타와','에드먼턴','위니펙','퀘벡','핼리팩스'],
  '유럽': ['런던','맨체스터','에든버러','리버풀','파리','마르세유','리옹','니스','베를린','뮌헨','함부르크','프랑크푸르트','쾰른','뒤셀도르프','로마','밀라노','나폴리','베네치아','피렌체','토리노','마드리드','바르셀로나','세비야','발렌시아','암스테르담','로테르담','헤이그','비엔나','잘츠부르크','인스브루크','취리히','제네바','베른','루체른','브뤼셀','앤트워프','스톡홀름','고텐부르크','말뫼','코펜하겐','오슬로','헬싱키','더블린','리스본','포르투','아테네','이스탄불','앙카라','프라하','부다페스트','바르샤바','모스크바','상트페테르부르크','블라디보스토크'],
  '호주/뉴질랜드/오세아니아': ['시드니','멜버른','브리즈번','퍼스','애들레이드','골드코스트','캔버라','호바트','다윈','오클랜드','웰링턴','크라이스트처치','괌','피지(수바)'],
  '중동': ['두바이','아부다비','도하','리야드','제다','테헤란','예루살렘','텔아비브','카이로','알렉산드리아','베이루트','암만','바그다드'],
  '남미': ['상파울루','리우데자네이루','브라질리아','살바도르','벨루오리존치','부에노스아이레스','코르도바','멘도사','리마','쿠스코','아레키파','보고타','메데인','카르타헤나','카라카스','키토','라파스','산티아고','발파라이소','아순시온','몬테비데오'],
  '아프리카': ['요하네스버그','케이프타운','더반','나이로비','아디스아바바','카사블랑카','라고스','아부자','아크라','다르에스살람','캄팔라','루안다','알제','튀니스','트리폴리'],
}

export default function NewConsultation() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // 기본 정보
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
  const [birthRegion, setBirthRegion] = useState('한국')
  const [birthKoreaRegion, setBirthKoreaRegion] = useState('특별시/광역시')
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

  const cityList = birthRegion === '한국'
    ? (KOREA_CITIES_BY_REGION[birthKoreaRegion] || KOREA_CITIES_BY_REGION['특별시/광역시'])
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
          모든 항목을 입력하면 더 정확한 분석이 가능합니다 (약 3~5분)
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
            <input 
              type="number" 
              min="0" 
              max="23" 
              step="1"
              placeholder="시" 
              value={birthHour}
              onChange={e => setBirthHour(e.target.value)}
              style={{ ...inputStyle, textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }} 
            />
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>시</span>
            <input 
              type="number" 
              min="0" 
              max="59" 
              step="1"
              placeholder="분" 
              value={birthMinute}
              onChange={e => setBirthMinute(e.target.value)}
              style={{ ...inputStyle, textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }} 
            />
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>분</span>
          </div>
        </div>

        {/* 출생 국가/도시 */}
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

        {birthRegion === '한국' && (
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>도/광역시{requiredMark}</label>
            <select style={inputStyle} value={birthKoreaRegion} 
              onChange={e => {
                setBirthKoreaRegion(e.target.value)
                const cities = KOREA_CITIES_BY_REGION[e.target.value]
                if (cities && cities.length > 0) setBirthCity(cities[0])
              }}>
              {Object.keys(KOREA_CITIES_BY_REGION).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        )}

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
          {loading ? '⏳ AI 심층 분석 중... (약 3~5분)' : '🔮 사주 분석 시작'}
        </button>

      </div>
    </div>
  )
}