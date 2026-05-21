'use client'

import { useState } from 'react'

interface Chapter {
  id: string
  title: string
  description: string
  isFree: boolean
}

const CHAPTERS: Chapter[] = [
  { id: 'ch1', title: '제1장: 사주 원국 총론', description: '사주의 기본 구조와 일간 분석', isFree: true },
  { id: 'ch2', title: '제2장: 과거 시기 검증', description: '대운별 과거 사건 예측', isFree: true },
  { id: 'ch3', title: '제3장: 육친 관계 심층 분석', description: '조상/부모/형제/배우자/자녀', isFree: false },
  { id: 'ch4', title: '제4장: 건강·체질 분석', description: '체질, 음식, 운동 가이드', isFree: false },
  { id: 'ch5', title: '제5장: 격국과 용신', description: '핵심 운명 분석', isFree: true },
  { id: 'ch6', title: '제6장: 십성 분석', description: '10가지 십성 상세 분석', isFree: false },
  { id: 'ch7', title: '제7장: 대운 흐름', description: '현재~미래 대운', isFree: true },
  { id: 'ch8', title: '제8장: 올해의 운세', description: '월별 상세 운세', isFree: true },
  { id: 'ch9', title: '제9장: 향후 3년 운세', description: '내년~3년 흐름', isFree: false },
  { id: 'ch10', title: '제10장: 맞춤 분야 분석', description: '관심 분야 심층', isFree: true },
  { id: 'ch11', title: '제11장: 인생 로드맵', description: '미래 인생 설계', isFree: false },
  { id: 'ch12', title: '제12장: 종합 조언', description: '핵심 조언과 격려', isFree: true },
]

interface Props {
  reportHtml: string
  customer: any
  followups: any[]
  sajuData?: any
  isPremium: boolean
  isAdmin: boolean
}

function generateSajuChartHtml(sajuData: any, customerName: string): string {
  if (!sajuData) return ''

  const STEM_INFO: Record<string, any> = {
    '갑': { hanja: '甲', element: '목', color: '#22c55e', bg: '#dcfce7' },
    '을': { hanja: '乙', element: '목', color: '#22c55e', bg: '#dcfce7' },
    '병': { hanja: '丙', element: '화', color: '#ef4444', bg: '#fee2e2' },
    '정': { hanja: '丁', element: '화', color: '#ef4444', bg: '#fee2e2' },
    '무': { hanja: '戊', element: '토', color: '#f59e0b', bg: '#fef3c7' },
    '기': { hanja: '己', element: '토', color: '#f59e0b', bg: '#fef3c7' },
    '경': { hanja: '庚', element: '금', color: '#94a3b8', bg: '#f1f5f9' },
    '신': { hanja: '辛', element: '금', color: '#94a3b8', bg: '#f1f5f9' },
    '임': { hanja: '壬', element: '수', color: '#3b82f6', bg: '#dbeafe' },
    '계': { hanja: '癸', element: '수', color: '#3b82f6', bg: '#dbeafe' },
  }

  const BRANCH_INFO: Record<string, any> = {
    '자': { hanja: '子', element: '수', color: '#3b82f6', bg: '#dbeafe' },
    '축': { hanja: '丑', element: '토', color: '#f59e0b', bg: '#fef3c7' },
    '인': { hanja: '寅', element: '목', color: '#22c55e', bg: '#dcfce7' },
    '묘': { hanja: '卯', element: '목', color: '#22c55e', bg: '#dcfce7' },
    '진': { hanja: '辰', element: '토', color: '#f59e0b', bg: '#fef3c7' },
    '사': { hanja: '巳', element: '화', color: '#ef4444', bg: '#fee2e2' },
    '오': { hanja: '午', element: '화', color: '#ef4444', bg: '#fee2e2' },
    '미': { hanja: '未', element: '토', color: '#f59e0b', bg: '#fef3c7' },
    '신': { hanja: '申', element: '금', color: '#94a3b8', bg: '#f1f5f9' },
    '유': { hanja: '酉', element: '금', color: '#94a3b8', bg: '#f1f5f9' },
    '술': { hanja: '戌', element: '토', color: '#f59e0b', bg: '#fef3c7' },
    '해': { hanja: '亥', element: '수', color: '#3b82f6', bg: '#dbeafe' },
  }

  const elementCount = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 }
  ;[sajuData.year, sajuData.month, sajuData.day, sajuData.hour].forEach((p: any) => {
    const stemElem = STEM_INFO[p.stem]?.element
    const branchElem = BRANCH_INFO[p.branch]?.element
    if (stemElem) elementCount[stemElem as keyof typeof elementCount]++
    if (branchElem) elementCount[branchElem as keyof typeof elementCount]++
  })

  const total = 8

  function renderPillar(pillar: any, label: string, sublabel: string, isMain: boolean = false) {
    const stemInfo = STEM_INFO[pillar.stem]
    const branchInfo = BRANCH_INFO[pillar.branch]
    return `
      <td style="padding:0;width:25%;vertical-align:top">
        <div style="background:${isMain ? '#fffbeb' : 'white'};border:${isMain ? '2px solid #c9a84c' : '1px solid #e5e7eb'};border-radius:8px;overflow:hidden">
          <div style="background:${isMain ? '#c9a84c' : '#1a2744'};color:white;padding:6px 4px;text-align:center">
            <div style="font-weight:bold;font-size:12px">${label}</div>
            <div style="font-size:9px;opacity:0.8">${sublabel}</div>
          </div>
          <div style="background:${stemInfo?.bg || '#f8f5ef'};padding:12px 4px;text-align:center;border-bottom:1px dashed #ddd">
            <div style="font-size:24px;font-weight:bold;color:${stemInfo?.color || '#1a2744'}">${stemInfo?.hanja || pillar.stem}</div>
            <div style="font-size:10px;color:#666;margin-top:2px">${pillar.stem}(${stemInfo?.element || ''})</div>
          </div>
          <div style="background:${branchInfo?.bg || '#f8f5ef'};padding:12px 4px;text-align:center">
            <div style="font-size:24px;font-weight:bold;color:${branchInfo?.color || '#1a2744'}">${branchInfo?.hanja || pillar.branch}</div>
            <div style="font-size:10px;color:#666;margin-top:2px">${pillar.branch}(${branchInfo?.element || ''})</div>
          </div>
        </div>
      </td>
    `
  }

  const elements = [
    { name: '목(木)', key: '목', color: '#22c55e' },
    { name: '화(火)', key: '화', color: '#ef4444' },
    { name: '토(土)', key: '토', color: '#f59e0b' },
    { name: '금(金)', key: '금', color: '#94a3b8' },
    { name: '수(水)', key: '수', color: '#3b82f6' },
  ]

  const elementBars = elements.map(elem => {
    const count = elementCount[elem.key as keyof typeof elementCount]
    const percentage = (count / total) * 100
    const status = count >= 3 ? '과다' : count === 0 ? '없음' : '적정'
    const statusColor = count >= 3 ? '#ef4444' : count === 0 ? '#94a3b8' : '#666'
    return `
      <tr>
        <td style="padding:4px 8px;font-size:12px;font-weight:bold;color:${elem.color};width:80px">${elem.name}</td>
        <td style="padding:4px">
          <div style="background:#f1f5f9;border-radius:6px;height:18px;position:relative;overflow:hidden">
            <div style="width:${percentage}%;height:100%;background:${elem.color};border-radius:6px"></div>
            <div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;color:${percentage > 30 ? 'white' : '#1a2744'}">${count}/8 (${percentage.toFixed(0)}%)</div>
          </div>
        </td>
        <td style="padding:4px 8px;font-size:11px;font-weight:bold;color:${statusColor};width:50px;text-align:center">${status}</td>
      </tr>
    `
  }).join('')

  const dayStemInfo = STEM_INFO[sajuData.dayMaster]

  const lacking = Object.entries(elementCount).filter(([, v]) => v === 0).map(([k]) => k).join(', ')
  const overflow = Object.entries(elementCount).filter(([, v]) => v >= 3).map(([k]) => k).join(', ')

  return `
    <div style="margin:20px 0;page-break-inside:avoid">
      <h2 style="color:#1a2744;font-size:20px;border-bottom:2px solid #c9a84c;padding-bottom:10px;margin:0 0 16px">
        🔮 ${customerName}님의 사주 원국 시각화
      </h2>

      <table style="width:100%;border-collapse:separate;border-spacing:4px;margin-bottom:16px">
        <tr>
          ${renderPillar(sajuData.hour, '시주', '자녀·말년')}
          ${renderPillar(sajuData.day, '일주', '본인·배우자', true)}
          ${renderPillar(sajuData.month, '월주', '부모·청년')}
          ${renderPillar(sajuData.year, '년주', '조상·초년')}
        </tr>
      </table>

      <div style="background:#fffbeb;border:1px solid #c9a84c;border-radius:8px;padding:10px;margin-bottom:16px;text-align:center">
        <div style="font-size:12px;color:#666;margin-bottom:2px">⭐ 일간(日干) - 본인을 나타냅니다</div>
        <div style="font-size:18px;font-weight:bold;color:${dayStemInfo?.color || '#1a2744'}">
          ${dayStemInfo?.hanja} (${sajuData.dayMaster}) · ${dayStemInfo?.element}
        </div>
      </div>

      <h3 style="color:#1a2744;font-size:15px;margin:12px 0 8px">📊 오행(五行) 분포</h3>
      <table style="width:100%;border-collapse:collapse">
        ${elementBars}
      </table>

      <div style="background:#f8f5ef;border-left:3px solid #c9a84c;padding:10px;border-radius:6px;font-size:12px;margin-top:12px">
        <strong style="color:#1a2744">💡 오행 균형 진단:</strong>
        ${lacking ? `<div>• <strong style="color:#ef4444">부족:</strong> ${lacking}</div>` : ''}
        ${overflow ? `<div>• <strong style="color:#f59e0b">과다:</strong> ${overflow}</div>` : ''}
        <div>• <strong>일간 오행:</strong> ${dayStemInfo?.element}</div>
      </div>
    </div>
  `
}

export default function PdfChapterSelector({ reportHtml, customer, followups, sajuData, isPremium, isAdmin }: Props) {
  const [show, setShow] = useState(false)
  const canSelectAll = isAdmin || isPremium
  const [selected, setSelected] = useState<Set<string>>(
    new Set(CHAPTERS.filter(c => c.isFree || canSelectAll).map(c => c.id))
  )
  const [includeFollowups, setIncludeFollowups] = useState(false)
  const [includeSajuChart, setIncludeSajuChart] = useState(true)

  function toggle(id: string) {
    const ch = CHAPTERS.find(c => c.id === id)
    if (!ch) return
    if (!ch.isFree && !canSelectAll) {
      alert('🔒 프리미엄 챕터입니다.')
      return
    }
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  function selectAll() {
    setSelected(new Set(CHAPTERS.map(c => c.id)))
  }

  function deselectAll() {
    setSelected(new Set())
  }

  function handleDownload() {
    if (selected.size === 0 && !includeSajuChart) {
      alert('최소 1개 챕터를 선택해주세요')
      return
    }

    const selectedChapters = Array.from(selected)
    
    const sections = reportHtml.split(/(?=<h2)/g).filter((s: string) => s.trim().length > 0)
    
    let filteredHtml = ''
    sections.forEach((section: string) => {
      const titleMatch = section.match(/<h2[^>]*>([^<]+)<\/h2>/i)
      if (!titleMatch) return
      
      const title = titleMatch[1]
      const chapterMatch = title.match(/제\s*(\d+)\s*장/)
      
      if (chapterMatch) {
        const chapterId = 'ch' + chapterMatch[1]
        if (selectedChapters.includes(chapterId)) {
          filteredHtml += section
        }
      }
    })

    let followupsHtml = ''
    if (includeFollowups && followups.length > 0) {
      followupsHtml += '<h2 style="color:#7c3aed;border-bottom:3px solid #7c3aed;padding-bottom:12px;margin-top:48px;font-size:24px">💬 추가 질의 답변</h2>'
      followups.forEach(fup => {
        followupsHtml += `
          <div style="background:#f3e8ff;padding:14px;border-radius:10px;margin:14px 0;font-weight:bold;color:#7c3aed">
            💬 질문: ${fup.question}
          </div>
          <div style="line-height:1.8">${fup.answer_html}</div>
        `
      })
    }

    const today = new Date().toLocaleDateString('ko-KR')
    
    const printWindow = window.open('', '_blank', 'width=900,height=800')
    if (!printWindow) {
      alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.')
      return
    }

    const sajuChartHtml = (includeSajuChart && sajuData) 
      ? generateSajuChartHtml(sajuData, customer?.name || '고객')
      : ''

    const printHtml = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>사주분석_${customer?.name || '보고서'}_${today}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 15mm;
      @top-left { content: ""; }
      @top-center { content: ""; }
      @top-right { content: ""; }
      @bottom-left { content: ""; }
      @bottom-center { content: ""; }
      @bottom-right { content: ""; }
    }
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    body {
      font-family: -apple-system, 'Malgun Gothic', sans-serif;
      line-height: 1.7;
      color: #333;
      margin: 0;
      padding: 0;
      background: white;
    }
    
    .print-header {
      text-align: center;
      padding: 16px 0;
      border-bottom: 2px solid #c9a84c;
      margin-bottom: 12px;
    }
    
    .print-header .icon {
      font-size: 32px;
      margin-bottom: 4px;
    }
    
    .print-header h1 {
      color: #1a2744;
      font-size: 22px;
      margin: 0 0 6px;
      font-weight: bold;
    }
    
    .print-header .date {
      color: #666;
      font-size: 12px;
    }
    
    .print-info {
      margin-top: 12px;
      padding: 10px 14px;
      background: #f8f5ef;
      border-radius: 8px;
      text-align: left;
      font-size: 12px;
      color: #444;
    }
    
    .print-info div {
      margin: 2px 0;
    }
    
    h2 {
      color: #1a2744;
      border-bottom: 2px solid #c9a84c;
      padding-bottom: 10px;
      margin-top: 24px;
      font-size: 20px;
      page-break-after: avoid;
      page-break-inside: avoid;
    }
    
    h3 {
      color: #1a2744;
      border-left: 3px solid #c9a84c;
      padding-left: 10px;
      margin-top: 18px;
      font-size: 16px;
      page-break-after: avoid;
    }
    
    p {
      line-height: 1.8;
      margin-bottom: 12px;
      color: #333;
      font-size: 13px;
    }
    
    strong {
      color: #c9a84c;
      font-weight: bold;
    }
    
    ul, ol {
      line-height: 1.8;
      padding-left: 20px;
      margin-bottom: 12px;
    }
    
    li {
      margin-bottom: 5px;
      font-size: 13px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
    }
    
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: center;
      font-size: 12px;
    }
    
    .print-footer {
      margin-top: 30px;
      padding-top: 14px;
      border-top: 1px solid #c9a84c;
      text-align: center;
      color: #888;
      font-size: 10px;
    }
    
    .print-controls {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #1a2744;
      color: white;
      padding: 14px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 1000;
    }
    
    .print-controls button {
      background: #c9a84c;
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
      font-size: 14px;
      margin: 0 5px;
    }
    
    .content {
      padding-top: 70px;
    }
    
    @media print {
      .print-controls {
        display: none !important;
      }
      
      .content {
        padding-top: 0;
      }
      
      .first-page {
        page-break-after: auto;
      }
    }
  </style>
</head>
<body>
  <div class="print-controls">
    <button onclick="window.print()">📄 PDF로 저장 / 인쇄</button>
    <button onclick="window.close()" style="background:#94a3b8">❌ 닫기</button>
  </div>
  
  <div class="content">
    <div class="first-page">
      <div class="print-header">
        <div class="icon">🔮</div>
        <h1>${customer?.name || '고객'}님 사주 분석 보고서</h1>
        <div class="date">${today} 작성</div>
        <div class="print-info">
          <div><strong>📅 생년월일:</strong> ${customer?.birth_date || '-'} ${customer?.birth_time || ''}</div>
          <div><strong>📍 출생지:</strong> ${customer?.birth_city || '-'}</div>
          <div><strong>👤 성별:</strong> ${customer?.gender === 'male' ? '남성' : '여성'}</div>
          ${customer?.family_info ? `<div><strong>👨‍👩‍👧 가족:</strong> ${customer.family_info}</div>` : ''}
        </div>
      </div>
      
      ${sajuChartHtml}
    </div>
    
    ${filteredHtml}
    ${followupsHtml}
    
    <div class="print-footer">
      본 보고서는 자평명리학을 기반으로 분석한 결과입니다.<br/>
      절대적이지 않을 수 있으니 참고 자료로만 활용하시기 바랍니다.
    </div>
  </div>
</body>
</html>
    `

    printWindow.document.write(printHtml)
    printWindow.document.close()
    
    setShow(false)
  }

  return (
    <>
      <button onClick={() => setShow(true)} style={{
        background: '#dc2626', color: 'white',
        padding: '10px 20px', borderRadius: '10px',
        border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
      }}>
        📄 PDF 다운로드
      </button>

      {show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: 'white', borderRadius: '20px',
            padding: '28px', maxWidth: '600px', width: '100%',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h2 style={{ marginTop: 0, color: '#1a2744' }}>📄 PDF 챕터 선택</h2>

            <div style={{
              background: '#fef3c7', borderLeft: '4px solid #f59e0b',
              padding: '12px', borderRadius: '8px', marginBottom: '12px',
              fontSize: '13px', color: '#92400e',
            }}>
              💡 <strong>PDF 저장 방법:</strong><br/>
              1. 챕터 선택 후 "PDF 다운로드" 클릭<br/>
              2. 새 창이 열리면 "PDF로 저장 / 인쇄" 버튼 클릭<br/>
              3. 인쇄 대화상자에서 "대상" → "PDF로 저장" 선택
            </div>

            {isAdmin && (
              <div style={{
                background: '#eff6ff', borderLeft: '4px solid #3b82f6',
                padding: '12px', borderRadius: '8px', marginBottom: '16px',
                fontSize: '13px', color: '#1e40af',
              }}>
                👑 관리자 모드: 모든 챕터 선택 가능
              </div>
            )}

            {sajuData && (
              <label style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '14px', background: '#fffbeb',
                border: '2px solid #c9a84c',
                borderRadius: '10px', cursor: 'pointer', marginBottom: '16px',
              }}>
                <input type="checkbox" checked={includeSajuChart}
                  onChange={e => setIncludeSajuChart(e.target.checked)}
                  style={{ width: '20px', height: '20px' }} />
                <div>
                  <div style={{ fontSize: '15px', color: '#1a2744', fontWeight: 'bold' }}>
                    🔮 사주 원국 시각화 포함
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                    사주표 + 오행 분포 차트 (첫 페이지에 추가)
                  </div>
                </div>
              </label>
            )}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button onClick={selectAll} style={{
                padding: '6px 12px', background: '#1a2744', color: 'white',
                border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
              }}>전체 선택</button>
              <button onClick={deselectAll} style={{
                padding: '6px 12px', background: '#94a3b8', color: 'white',
                border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
              }}>전체 해제</button>
            </div>

            <div style={{ display: 'grid', gap: '8px', marginBottom: '20px' }}>
              {CHAPTERS.map(ch => {
                const isLocked = !ch.isFree && !canSelectAll
                const isChecked = selected.has(ch.id)
                return (
                  <div key={ch.id} onClick={() => toggle(ch.id)} style={{
                    padding: '12px', border: '2px solid',
                    borderColor: isChecked ? '#1a2744' : '#ddd',
                    background: isLocked ? '#f9fafb' : isChecked ? '#e8edf5' : 'white',
                    borderRadius: '10px', cursor: isLocked ? 'not-allowed' : 'pointer',
                    opacity: isLocked ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', gap: '12px',
                  }}>
                    <input type="checkbox" checked={isChecked} readOnly
                      style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1a2744' }}>
                        {ch.title}
                        {ch.isFree ? (
                          <span style={{
                            marginLeft: '8px', padding: '2px 6px',
                            background: '#22c55e', color: 'white',
                            borderRadius: '4px', fontSize: '10px',
                          }}>✅ 무료</span>
                        ) : (
                          <span style={{
                            marginLeft: '8px', padding: '2px 6px',
                            background: isLocked ? '#94a3b8' : '#c9a84c',
                            color: 'white', borderRadius: '4px', fontSize: '10px',
                          }}>{isLocked ? '🔒 프리미엄' : '💎 프리미엄'}</span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                        {ch.description}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {followups.length > 0 && (
              <label style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px', background: '#f3e8ff',
                borderRadius: '8px', cursor: 'pointer', marginBottom: '16px',
              }}>
                <input type="checkbox" checked={includeFollowups}
                  onChange={e => setIncludeFollowups(e.target.checked)}
                  style={{ width: '18px', height: '18px' }} />
                <span style={{ fontSize: '14px', color: '#7c3aed', fontWeight: 'bold' }}>
                  💬 추가 질의 답변도 포함 ({followups.length}건)
                </span>
              </label>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShow(false)} style={{
                flex: 1, padding: '12px', background: '#f1f5f9',
                border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer',
              }}>취소</button>
              <button onClick={handleDownload} style={{
                flex: 2, padding: '12px', background: '#dc2626',
                color: 'white', border: 'none', borderRadius: '10px',
                fontWeight: 'bold', cursor: 'pointer',
              }}>
                📄 PDF 다운로드 ({selected.size}개)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}