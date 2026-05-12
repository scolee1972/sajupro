'use client'

interface SajuPillar {
  stem: string
  branch: string
  full: string
}

interface SajuData {
  year: SajuPillar
  month: SajuPillar
  day: SajuPillar
  hour: SajuPillar
  dayMaster: string
  correction?: { hour: number; minute: number; correction: number }
}

interface Props {
  saju: SajuData
  name?: string
}

const STEM_ELEMENT: Record<string, { element: string; color: string; bg: string }> = {
  '갑': { element: '목', color: '#22c55e', bg: '#dcfce7' },
  '을': { element: '목', color: '#22c55e', bg: '#dcfce7' },
  '병': { element: '화', color: '#ef4444', bg: '#fee2e2' },
  '정': { element: '화', color: '#ef4444', bg: '#fee2e2' },
  '무': { element: '토', color: '#f59e0b', bg: '#fef3c7' },
  '기': { element: '토', color: '#f59e0b', bg: '#fef3c7' },
  '경': { element: '금', color: '#94a3b8', bg: '#f1f5f9' },
  '신': { element: '금', color: '#94a3b8', bg: '#f1f5f9' },
  '임': { element: '수', color: '#3b82f6', bg: '#dbeafe' },
  '계': { element: '수', color: '#3b82f6', bg: '#dbeafe' },
}

const BRANCH_ELEMENT: Record<string, { element: string; color: string; bg: string }> = {
  '자': { element: '수', color: '#3b82f6', bg: '#dbeafe' },
  '축': { element: '토', color: '#f59e0b', bg: '#fef3c7' },
  '인': { element: '목', color: '#22c55e', bg: '#dcfce7' },
  '묘': { element: '목', color: '#22c55e', bg: '#dcfce7' },
  '진': { element: '토', color: '#f59e0b', bg: '#fef3c7' },
  '사': { element: '화', color: '#ef4444', bg: '#fee2e2' },
  '오': { element: '화', color: '#ef4444', bg: '#fee2e2' },
  '미': { element: '토', color: '#f59e0b', bg: '#fef3c7' },
  '신': { element: '금', color: '#94a3b8', bg: '#f1f5f9' },
  '유': { element: '금', color: '#94a3b8', bg: '#f1f5f9' },
  '술': { element: '토', color: '#f59e0b', bg: '#fef3c7' },
  '해': { element: '수', color: '#3b82f6', bg: '#dbeafe' },
}

const STEM_HANJA: Record<string, string> = {
  '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊',
  '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸',
}

const BRANCH_HANJA: Record<string, string> = {
  '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳',
  '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥',
}

export default function SajuChart({ saju, name }: Props) {
  const elementCount = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 }
  
  ;[saju.year, saju.month, saju.day, saju.hour].forEach(p => {
    const stemElem = STEM_ELEMENT[p.stem]?.element
    const branchElem = BRANCH_ELEMENT[p.branch]?.element
    if (stemElem) elementCount[stemElem as keyof typeof elementCount]++
    if (branchElem) elementCount[branchElem as keyof typeof elementCount]++
  })

  const total = 8

  const renderPillar = (pillar: SajuPillar, label: string, sublabel: string, isMain: boolean = false) => {
    const stemInfo = STEM_ELEMENT[pillar.stem]
    const branchInfo = BRANCH_ELEMENT[pillar.branch]

    return (
      <div style={{
        flex: 1,
        background: isMain ? '#fffbeb' : 'white',
        border: isMain ? '3px solid #c9a84c' : '2px solid #e5e7eb',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          background: isMain ? '#c9a84c' : '#1a2744',
          color: 'white',
          padding: '8px 4px',
          textAlign: 'center',
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{label}</div>
          <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>{sublabel}</div>
        </div>

        <div style={{
          background: stemInfo?.bg || '#f8f5ef',
          padding: '20px 8px',
          textAlign: 'center',
          borderBottom: '1px dashed #ddd',
        }}>
          <div style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: stemInfo?.color || '#1a2744',
            lineHeight: 1,
          }}>
            {STEM_HANJA[pillar.stem] || pillar.stem}
          </div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
            {pillar.stem}({stemInfo?.element || ''})
          </div>
        </div>

        <div style={{
          background: branchInfo?.bg || '#f8f5ef',
          padding: '20px 8px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: branchInfo?.color || '#1a2744',
            lineHeight: 1,
          }}>
            {BRANCH_HANJA[pillar.branch] || pillar.branch}
          </div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
            {pillar.branch}({branchInfo?.element || ''})
          </div>
        </div>

        {isMain && (
          <div style={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            background: '#ef4444',
            color: 'white',
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: 'bold',
          }}>
            나
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      <h2 style={{
        margin: '0 0 20px',
        color: '#1a2744',
        fontSize: '20px',
        borderBottom: '3px solid #c9a84c',
        paddingBottom: '10px',
      }}>
        🔮 {name ? `${name}님의 ` : ''}사주 원국 시각화
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
        marginBottom: '24px',
      }}>
        {renderPillar(saju.hour, '시주', '자녀·말년')}
        {renderPillar(saju.day, '일주', '본인·배우자', true)}
        {renderPillar(saju.month, '월주', '부모·청년')}
        {renderPillar(saju.year, '년주', '조상·초년')}
      </div>

      <div style={{
        background: '#fffbeb',
        border: '2px solid #c9a84c',
        borderRadius: '10px',
        padding: '14px',
        marginBottom: '20px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
          ⭐ 일간(日干) - 본인을 나타냅니다
        </div>
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: STEM_ELEMENT[saju.dayMaster]?.color || '#1a2744',
        }}>
          {STEM_HANJA[saju.dayMaster]} ({saju.dayMaster}) · {STEM_ELEMENT[saju.dayMaster]?.element}
        </div>
      </div>

      <h3 style={{ color: '#1a2744', fontSize: '16px', marginBottom: '14px' }}>
        📊 오행(五行) 분포
      </h3>

      <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
        {([
          { name: '목(木)', key: '목' as const, color: '#22c55e', icon: '🌳' },
          { name: '화(火)', key: '화' as const, color: '#ef4444', icon: '🔥' },
          { name: '토(土)', key: '토' as const, color: '#f59e0b', icon: '🪨' },
          { name: '금(金)', key: '금' as const, color: '#94a3b8', icon: '⚙️' },
          { name: '수(水)', key: '수' as const, color: '#3b82f6', icon: '💧' },
        ]).map(elem => {
          const count = elementCount[elem.key]
          const percentage = (count / total) * 100
          const isHigh = count >= 3
          const isLow = count === 0
          
          return (
            <div key={elem.key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '70px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: elem.color,
              }}>
                {elem.icon} {elem.name}
              </div>
              <div style={{
                flex: 1,
                background: '#f1f5f9',
                borderRadius: '8px',
                height: '24px',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <div style={{
                  width: `${percentage}%`,
                  height: '100%',
                  background: elem.color,
                  borderRadius: '8px',
                  transition: 'width 0.5s',
                }} />
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: percentage > 30 ? 'white' : '#1a2744',
                }}>
                  {count}/8 ({percentage.toFixed(0)}%)
                </div>
              </div>
              <div style={{
                width: '60px',
                fontSize: '11px',
                fontWeight: 'bold',
                color: isHigh ? '#ef4444' : isLow ? '#94a3b8' : '#666',
              }}>
                {isHigh ? '과다' : isLow ? '없음' : '적정'}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{
        background: '#f8f5ef',
        borderLeft: '4px solid #c9a84c',
        padding: '14px',
        borderRadius: '8px',
        fontSize: '13px',
        lineHeight: 1.7,
      }}>
        <strong style={{ color: '#1a2744' }}>💡 오행 균형 진단:</strong>
        <div style={{ marginTop: '6px', color: '#444' }}>
          {Object.entries(elementCount).filter(([, v]) => v === 0).length > 0 && (
            <div>• <strong style={{ color: '#ef4444' }}>부족한 오행:</strong> {Object.entries(elementCount).filter(([, v]) => v === 0).map(([k]) => k).join(', ')}</div>
          )}
          {Object.entries(elementCount).filter(([, v]) => v >= 3).length > 0 && (
            <div>• <strong style={{ color: '#f59e0b' }}>과다한 오행:</strong> {Object.entries(elementCount).filter(([, v]) => v >= 3).map(([k]) => k).join(', ')}</div>
          )}
          <div>• <strong>일간 오행:</strong> {STEM_ELEMENT[saju.dayMaster]?.element} (강약은 전체 분석 참고)</div>
        </div>
      </div>

      {saju.correction && saju.correction.correction !== 0 && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: '#eff6ff',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#1e40af',
        }}>
          ⏰ <strong>출생지 시간 보정:</strong> {saju.correction.correction}분
          (보정 후 {String(saju.correction.hour).padStart(2,'0')}:{String(saju.correction.minute).padStart(2,'0')})
        </div>
      )}
    </div>
  )
}