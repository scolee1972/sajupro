'use client'

import { useState, useEffect } from 'react'

interface ChildBirth {
  date: string
  hour: string
  minute: string
  calendar: string
  isLeap: boolean
}

interface FamilyData {
  brothers: number
  sisters: number
  birthOrder: number
  marriageStatus: string
  marriageDate: string
  divorceDate: string
  spouseBirth: string
  spouseHour: string
  spouseMinute: string
  spouseCalendar: string
  spouseIsLeap: boolean
  sons: number
  daughters: number
  childrenBirths: ChildBirth[]
  majorEvents: string
  bodyType: string
  healthStatus: string
}

interface Props {
  onChange: (data: {
    text: string
    marriageDate: string
    divorceDate: string
    spouseBirth: string
    childrenInfo: string
    majorEvents: string
    bodyType: string
    healthStatus: string
  }) => void
}

export default function FamilyInfoInput({ onChange }: Props) {
  const [data, setData] = useState<FamilyData>({
    brothers: 0,
    sisters: 0,
    birthOrder: 1,
    marriageStatus: '미혼',
    marriageDate: '',
    divorceDate: '',
    spouseBirth: '',
    spouseHour: '',
    spouseMinute: '',
    spouseCalendar: 'solar',
    spouseIsLeap: false,
    sons: 0,
    daughters: 0,
    childrenBirths: [],
    majorEvents: '',
    bodyType: '',
    healthStatus: '',
  })

  useEffect(() => {
    const totalSiblings = data.brothers + data.sisters
    const siblingText = totalSiblings > 0
      ? `${data.brothers}남 ${data.sisters}녀 중 ${data.birthOrder}째`
      : '외동'

    const childrenTotal = data.sons + data.daughters
    const childrenText = childrenTotal > 0
      ? `아들 ${data.sons}명, 딸 ${data.daughters}명`
      : '자녀 없음'

    const text = `형제자매: ${siblingText} / 결혼: ${data.marriageStatus} / 자녀: ${childrenText}`

    // 배우자 정보 합치기
    let spouseFullInfo = ''
    if (data.spouseBirth) {
      const calLabel = data.spouseCalendar === 'lunar' ? '음력' : '양력'
      const leapLabel = data.spouseIsLeap ? ' (윤달)' : ''
      const timeStr = (data.spouseHour || data.spouseMinute)
        ? ` ${data.spouseHour || '0'}시 ${data.spouseMinute || '0'}분`
        : ''
      spouseFullInfo = `배우자: ${data.spouseBirth} ${calLabel}${leapLabel}${timeStr}`
    }

    // 자녀 정보 합치기
    const childrenInfoArr = data.childrenBirths
      .filter(c => c.date)
      .map((c, idx) => {
        const calLabel = c.calendar === 'lunar' ? '음력' : '양력'
        const leapLabel = c.isLeap ? ' (윤달)' : ''
        const timeStr = (c.hour || c.minute)
          ? ` ${c.hour || '0'}시 ${c.minute || '0'}분`
          : ''
        return `${idx + 1}째: ${c.date} ${calLabel}${leapLabel}${timeStr}`
      })

    const childrenInfo = [
      ...(spouseFullInfo ? [spouseFullInfo] : []),
      ...childrenInfoArr,
    ].join(' / ')

    onChange({
      text,
      marriageDate: data.marriageDate,
      divorceDate: data.divorceDate,
      spouseBirth: data.spouseBirth,
      childrenInfo,
      majorEvents: data.majorEvents,
      bodyType: data.bodyType,
      healthStatus: data.healthStatus,
    })
  }, [data, onChange])

  // 자녀 수 변경 시 배열 조정
  useEffect(() => {
    const total = data.sons + data.daughters
    const newBirths = [...data.childrenBirths]
    while (newBirths.length < total) {
      newBirths.push({ date: '', hour: '', minute: '', calendar: 'solar', isLeap: false })
    }
    while (newBirths.length > total) newBirths.pop()
    if (newBirths.length !== data.childrenBirths.length) {
      setData(d => ({ ...d, childrenBirths: newBirths }))
    }
  }, [data.sons, data.daughters])

  function updateChild(index: number, field: keyof ChildBirth, value: any) {
    const newBirths = [...data.childrenBirths]
    newBirths[index] = { ...newBirths[index], [field]: value }
    setData({ ...data, childrenBirths: newBirths })
  }

  const numBtnStyle = (isActive: boolean): React.CSSProperties => ({
    width: '36px', height: '36px',
    borderRadius: '8px',
    border: isActive ? '2px solid #1a2744' : '1px solid #ddd',
    background: isActive ? '#1a2744' : 'white',
    color: isActive ? 'white' : '#333',
    fontWeight: 'bold', fontSize: '14px',
    cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  })

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    border: '1px solid #ddd', borderRadius: '8px',
    fontSize: '14px', marginTop: '4px', outline: 'none',
    boxSizing: 'border-box',
  }

  const numInputStyle: React.CSSProperties = {
    ...inputStyle,
    textAlign: 'center',
    fontWeight: 'bold',
  }

  function NumberSelector({ label, value, max, onValueChange }: {
    label: string; value: number; max: number;
    onValueChange: (v: number) => void
  }) {
    return (
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#444' }}>
          {label}: <span style={{ color: '#c9a84c', fontSize: '16px' }}>{value}</span>
        </label>
        <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
          {Array.from({ length: max + 1 }, (_, i) => (
            <button key={i} onClick={() => onValueChange(i)} style={numBtnStyle(value === i)}>
              {i}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // 양력/음력 + 윤달 선택 컴포넌트
  function CalendarSelector({ calendar, onCalChange, isLeap, onLeapChange }: {
    calendar: string
    onCalChange: (v: string) => void
    isLeap: boolean
    onLeapChange: (v: boolean) => void
  }) {
    return (
      <>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
          {[{ v: 'solar', l: '☀️ 양력' }, { v: 'lunar', l: '🌙 음력' }].map(o => (
            <button key={o.v} onClick={() => onCalChange(o.v)} style={{
              flex: 1, padding: '8px', borderRadius: '6px',
              border: calendar === o.v ? '2px solid #1a2744' : '2px solid #ddd',
              background: calendar === o.v ? '#e8edf5' : 'white',
              cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
            }}>{o.l}</button>
          ))}
        </div>
        {calendar === 'lunar' && (
          <label style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 10px', background: '#fef3c7',
            borderRadius: '6px', cursor: 'pointer', marginBottom: '6px',
          }}>
            <input type="checkbox" checked={isLeap}
              onChange={e => onLeapChange(e.target.checked)}
              style={{ width: '14px', height: '14px' }} />
            <span style={{ fontSize: '12px', color: '#92400e', fontWeight: 'bold' }}>
              윤달
            </span>
          </label>
        )}
      </>
    )
  }

  return (
    <div style={{
      background: '#fafafa', borderRadius: '12px',
      padding: '20px', marginTop: '8px',
    }}>

      {/* 형제자매 */}
      <h4 style={{ margin: '0 0 12px', color: '#1a2744', fontSize: '15px' }}>
        👫 형제/자매
      </h4>

      <NumberSelector
        label="형제 (남자, 본인 포함)"
        value={data.brothers}
        max={9}
        onValueChange={v => setData({ ...data, brothers: v })}
      />

      <NumberSelector
        label="자매 (여자, 본인 포함)"
        value={data.sisters}
        max={9}
        onValueChange={v => setData({ ...data, sisters: v })}
      />

      <NumberSelector
        label="본인은 몇째?"
        value={data.birthOrder}
        max={Math.max(data.brothers + data.sisters, 1)}
        onValueChange={v => setData({ ...data, birthOrder: v })}
      />

      {/* 결혼 여부 */}
      <h4 style={{ margin: '20px 0 12px', color: '#1a2744', fontSize: '15px' }}>
        💍 결혼 여부
      </h4>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {['미혼', '기혼', '이혼', '사별', '동거'].map(status => (
          <button key={status}
            onClick={() => setData({ ...data, marriageStatus: status })}
            style={{
              padding: '10px 16px', borderRadius: '8px',
              border: data.marriageStatus === status ? '2px solid #1a2744' : '2px solid #ddd',
              background: data.marriageStatus === status ? '#1a2744' : 'white',
              color: data.marriageStatus === status ? 'white' : '#333',
              fontWeight: 'bold', cursor: 'pointer', fontSize: '14px',
            }}>
            {status}
          </button>
        ))}
      </div>

      {/* 결혼/이혼 정보 */}
      {(data.marriageStatus === '기혼' || data.marriageStatus === '이혼' || data.marriageStatus === '사별' || data.marriageStatus === '동거') && (
        <div style={{
          background: 'white', padding: '14px',
          borderRadius: '8px', marginBottom: '12px',
          border: '1px solid #e5e7eb',
        }}>
          <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#444' }}>
            💒 {data.marriageStatus === '동거' ? '동거 시작일' : '결혼일 (또는 결혼 기념일)'}
          </label>
          <input type="date" value={data.marriageDate}
            onChange={e => setData({ ...data, marriageDate: e.target.value })}
            style={inputStyle} />

          {(data.marriageStatus === '이혼' || data.marriageStatus === '사별') && (
            <>
              <label style={{
                fontSize: '13px', fontWeight: 'bold', color: '#444',
                marginTop: '12px', display: 'block',
              }}>
                💔 {data.marriageStatus} 일자
              </label>
              <input type="date" value={data.divorceDate}
                onChange={e => setData({ ...data, divorceDate: e.target.value })}
                style={inputStyle} />
            </>
          )}

          {/* 배우자 상세 정보 (양력/음력 + 시간 추가!) */}
          <div style={{
            marginTop: '16px',
            padding: '14px',
            background: '#f8f5ef',
            borderRadius: '8px',
          }}>
            <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#444', marginTop: 0, marginBottom: '10px' }}>
              👤 배우자 정보 (선택)
            </p>

            <CalendarSelector
              calendar={data.spouseCalendar}
              onCalChange={v => setData({ ...data, spouseCalendar: v })}
              isLeap={data.spouseIsLeap}
              onLeapChange={v => setData({ ...data, spouseIsLeap: v })}
            />

            <label style={{ fontSize: '12px', color: '#666' }}>생년월일</label>
            <input type="date" value={data.spouseBirth}
              onChange={e => setData({ ...data, spouseBirth: e.target.value })}
              style={inputStyle} />

            <label style={{ fontSize: '12px', color: '#666', marginTop: '8px', display: 'block' }}>
              출생 시각
            </label>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
              <input type="number" min="0" max="23" placeholder="시" value={data.spouseHour}
                onChange={e => setData({ ...data, spouseHour: e.target.value })}
                style={numInputStyle} />
              <span style={{ fontSize: '13px' }}>시</span>
              <input type="number" min="0" max="59" placeholder="분" value={data.spouseMinute}
                onChange={e => setData({ ...data, spouseMinute: e.target.value })}
                style={numInputStyle} />
              <span style={{ fontSize: '13px' }}>분</span>
            </div>
          </div>
        </div>
      )}

      {/* 자녀 */}
      <h4 style={{ margin: '20px 0 12px', color: '#1a2744', fontSize: '15px' }}>
        👶 자녀
      </h4>

      <NumberSelector
        label="아들"
        value={data.sons}
        max={9}
        onValueChange={v => setData({ ...data, sons: v })}
      />

      <NumberSelector
        label="딸"
        value={data.daughters}
        max={9}
        onValueChange={v => setData({ ...data, daughters: v })}
      />

      {/* 자녀 상세 정보 */}
      {data.childrenBirths.length > 0 && (
        <div style={{
          background: 'white', padding: '14px',
          borderRadius: '8px', marginBottom: '12px',
          border: '1px solid #e5e7eb',
        }}>
          <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#444', marginTop: 0 }}>
            👶 자녀 정보
          </p>
          {data.childrenBirths.map((child, idx) => (
            <div key={idx} style={{
              padding: '12px',
              background: '#f8f5ef',
              borderRadius: '8px',
              marginBottom: '10px',
            }}>
              <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a2744', margin: '0 0 8px' }}>
                {idx + 1}번째 자녀
              </p>

              <CalendarSelector
                calendar={child.calendar}
                onCalChange={v => updateChild(idx, 'calendar', v)}
                isLeap={child.isLeap}
                onLeapChange={v => updateChild(idx, 'isLeap', v)}
              />

              <label style={{ fontSize: '12px', color: '#666' }}>생년월일</label>
              <input type="date" value={child.date}
                onChange={e => updateChild(idx, 'date', e.target.value)}
                style={inputStyle} />

              <label style={{ fontSize: '12px', color: '#666', marginTop: '8px', display: 'block' }}>
                출생 시각
              </label>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                <input type="number" min="0" max="23" placeholder="시" value={child.hour}
                  onChange={e => updateChild(idx, 'hour', e.target.value)}
                  style={numInputStyle} />
                <span style={{ fontSize: '13px' }}>시</span>
                <input type="number" min="0" max="59" placeholder="분" value={child.minute}
                  onChange={e => updateChild(idx, 'minute', e.target.value)}
                  style={numInputStyle} />
                <span style={{ fontSize: '13px' }}>분</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 주요 인생 사건 */}
      <h4 style={{ margin: '20px 0 12px', color: '#1a2744', fontSize: '15px' }}>
        📅 주요 인생 사건 (선택)
      </h4>

      <p style={{ fontSize: '12px', color: '#888', margin: '0 0 8px' }}>
        💡 과거 검증 정확도가 크게 올라갑니다
      </p>

      <textarea
        value={data.majorEvents}
        onChange={e => setData({ ...data, majorEvents: e.target.value })}
        placeholder="예시:
- 1995년: 대학 입학
- 2000년: 첫 직장 입사
- 2008년: 이직 (대기업)
- 2015년: 부친 별세
- 2020년: 사업 시작"
        style={{
          width: '100%', minHeight: '120px', padding: '12px',
          border: '1px solid #ddd', borderRadius: '8px',
          fontSize: '14px', fontFamily: 'sans-serif',
          resize: 'vertical', outline: 'none',
        }}
      />

      {/* 체형 정보 */}
      <h4 style={{ margin: '20px 0 12px', color: '#1a2744', fontSize: '15px' }}>
        💪 체형 (정확한 건강 분석용)
      </h4>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {['마른형', '보통', '근육형', '통통', '비만'].map(type => (
          <button key={type}
            onClick={() => setData({ ...data, bodyType: type })}
            style={{
              padding: '10px 16px', borderRadius: '8px',
              border: data.bodyType === type ? '2px solid #1a2744' : '2px solid #ddd',
              background: data.bodyType === type ? '#1a2744' : 'white',
              color: data.bodyType === type ? 'white' : '#333',
              fontWeight: 'bold', cursor: 'pointer', fontSize: '14px',
            }}>
            {type}
          </button>
        ))}
      </div>

      <textarea
        value={data.healthStatus}
        onChange={e => setData({ ...data, healthStatus: e.target.value })}
        placeholder="현재 건강 상태나 자주 아픈 부분"
        style={{
          width: '100%', minHeight: '60px', padding: '12px',
          border: '1px solid #ddd', borderRadius: '8px',
          fontSize: '14px', fontFamily: 'sans-serif',
          resize: 'vertical', outline: 'none',
        }}
      />

      {/* 요약 */}
      <div style={{
        marginTop: '16px', padding: '12px',
        background: '#f8f5ef', borderRadius: '8px',
        borderLeft: '4px solid #c9a84c',
        fontSize: '14px', color: '#1a2744',
      }}>
        📝 <strong>가족 요약:</strong>{' '}
        {data.brothers + data.sisters > 0
          ? `${data.brothers}남 ${data.sisters}녀 중 ${data.birthOrder}째`
          : '외동'
        }
        {' / '}
        {data.marriageStatus}
        {data.marriageDate && ` (${data.marriageDate})`}
        {' / '}
        {data.sons + data.daughters > 0
          ? `아들 ${data.sons}명, 딸 ${data.daughters}명`
          : '자녀 없음'
        }
      </div>
    </div>
  )
}