'use client'

import { useState, useEffect } from 'react'

interface FamilyData {
  brothers: number
  sisters: number
  birthOrder: number
  marriageStatus: string
  sons: number
  daughters: number
}

interface Props {
  onChange: (text: string) => void
}

export default function FamilyInfoInput({ onChange }: Props) {
  const [data, setData] = useState<FamilyData>({
    brothers: 0,
    sisters: 0,
    birthOrder: 1,
    marriageStatus: '미혼',
    sons: 0,
    daughters: 0,
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
    onChange(text)
  }, [data, onChange])

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
            <button key={i} onClick={() => onValueChange(i)}
              style={numBtnStyle(value === i)}>
              {i}
            </button>
          ))}
        </div>
      </div>
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
        label="형제 (남자 형제 수, 본인 포함)"
        value={data.brothers}
        max={9}
        onValueChange={v => setData({ ...data, brothers: v })}
      />

      <NumberSelector
        label="자매 (여자 형제 수, 본인 포함)"
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

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
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
        {' / '}
        {data.sons + data.daughters > 0
          ? `아들 ${data.sons}명, 딸 ${data.daughters}명`
          : '자녀 없음'
        }
      </div>
    </div>
  )
}