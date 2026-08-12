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

// 한국 도시 (특별시/광역시/도별 정리)
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

// 해외 도시 (국가별)
const FOREIGN_CITIES: Record<string, string[]> = {
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
  const [p1Region, setP1Region] = useState('특별시/광역시')
  const [p1IsForeign, setP1IsForeign] = useState(false)
  const [p1ForeignCountry, setP1ForeignCountry] = useState('일본')
  const [p1City, setP1City] = useState('서울')

  // 두 번째 사람
  const [p2Name, setP2Name] = useState('')
  const [p2Gender, setP2Gender] = useState('female')
  const [p2Calendar, setP2Calendar] = useState('solar')
  const [p2LeapMonth, setP2LeapMonth] = useState(false)
  const [p2Date, setP2Date] = useState('')
  const [p2Hour, setP2Hour] = useState('')
  const [p2Minute, setP2Minute] = useState('')
  const [p2Region, setP2Region] = useState('특별시/광역시')
  const [p2IsForeign, setP2IsForeign] = useState(false)
  const [p2ForeignCountry, setP2ForeignCountry] = useState('일본')
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
    region, setRegion,
    isForeign, setIsForeign,
    foreignCountry, setForeignCountry,
    city, setCity,
  }: any) {
    // 현재 선택된 도시 리스트
    const cityList = isForeign 
      ? (FOREIGN_CITIES[foreignCountry] || [])
      : (KOREA_CITIES_BY_REGION[region] || [])

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

        {/* ⭐ 시간 입력 - 1분 단위 정확 입력 */}
        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>출생 시각 (24시간)</label>
          <p style={{ fontSize: '11px', color: '#888', margin: '2px 0 4px' }}>
            💡 정확한 시간 입력 (예: 9시 15분)
          </p>
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
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>시</span>
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
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>분</span>
          </div>
        </div>

        {/* ⭐ 출생지 - 국내/해외 선택 */}
        <div style={{ marginBottom: '10px' }}>
          <label style={labelStyle}>출생지</label>
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            <button onClick={() => { 
              setIsForeign(false); 
              setRegion('특별시/광역시'); 
              setCity('서울');
            }} style={{
              flex: 1, padding: '8px', borderRadius: '6px',
              border: !isForeign ? `2px solid ${color}` : '2px solid #ddd',
              background: !isForeign ? color : 'white',
              color: !isForeign ? 'white' : '#333',
              fontWeight: 'bold', cursor: 'pointer', fontSize: '13px',
            }}>🇰🇷 국내</button>
            <button onClick={() => { 
              setIsForeign(true); 
              setForeignCountry('일본'); 
              setCity('도쿄');
            }} style={{
              flex: 1, padding: '8px', borderRadius: '6px',
              border: isForeign ? `2px solid ${color}` : '2px solid #ddd',
              background: isForeign ? color : 'white',
              color: isForeign ? 'white' : '#333',
              fontWeight: 'bold', cursor: 'pointer', fontSize: '13px',
            }}>🌏 해외</button>
          </div>
        </div>

        {/* 지역 선택 */}
        {!isForeign ? (
          <div style={{ marginBottom: '10px' }}>
            <label style={labelStyle}>지역 (도)</label>
            <select style={inputStyle} value={region} 
              onChange={(e: any) => {
                setRegion(e.target.value)
                const cities = KOREA_CITIES_BY_REGION[e.target.value]
                if (cities && cities.length > 0) setCity(cities[0])
              }}>
              {Object.keys(KOREA_CITIES_BY_REGION).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{ marginBottom: '10px' }}>
            <label style={labelStyle}>국가</label>
            <select style={inputStyle} value={foreignCountry}
              onChange={(e: any) => {
                setForeignCountry(e.target.value)
                const cities = FOREIGN_CITIES[e.target.value]
                if (cities && cities.length > 0) setCity(cities[0])
              }}>
              {Object.keys(FOREIGN_CITIES).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label style={labelStyle}>도시</label>
          <select style={inputStyle} value={city} onChange={(e: any) => setCity(e.target.value)}>
            {cityList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {isForeign && (
            <p style={{ fontSize: '11px', color: '#3b82f6', margin: '4px 0 0' }}>
              🌐 해외 출생: 현지 시간 기준
            </p>
          )}
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
          두 사람의 사주를 비교 분석합니다 (국내 150개 도시 + 해외 200개 도시 지원)
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
          region={p1Region} setRegion={setP1Region}
          isForeign={p1IsForeign} setIsForeign={setP1IsForeign}
          foreignCountry={p1ForeignCountry} setForeignCountry={setP1ForeignCountry}
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
          region={p2Region} setRegion={setP2Region}
          isForeign={p2IsForeign} setIsForeign={setP2IsForeign}
          foreignCountry={p2ForeignCountry} setForeignCountry={setP2ForeignCountry}
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