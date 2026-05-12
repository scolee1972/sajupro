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
  { id: 'ch9', title: '제9장: 향후 2년 운세', description: '내년~내후년 흐름', isFree: false },
  { id: 'ch10', title: '제10장: 맞춤 분야 분석', description: '관심 분야 심층', isFree: true },
  { id: 'ch11', title: '제11장: 인생 로드맵', description: '40대~노년 설계', isFree: false },
  { id: 'ch12', title: '제12장: 종합 조언', description: '핵심 조언과 격려', isFree: true },
]

interface Props {
  reportHtml: string
  customer: any
  followups: any[]
  isPremium: boolean
  isAdmin: boolean
}

export default function PdfChapterSelector({ reportHtml, customer, followups, isPremium, isAdmin }: Props) {
  const [show, setShow] = useState(false)
  const canSelectAll = isAdmin || isPremium
  const [selected, setSelected] = useState<Set<string>>(
    new Set(CHAPTERS.filter(c => c.isFree || canSelectAll).map(c => c.id))
  )
  const [includeFollowups, setIncludeFollowups] = useState(false)

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
    if (selected.size === 0) {
      alert('최소 1개 챕터를 선택해주세요')
      return
    }

    const selectedChapters = Array.from(selected)
    
    // 보고서 HTML 파싱
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

    // 추가 질의 포함
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
    
    // 새 창에서 인쇄용 페이지 열기
    const printWindow = window.open('', '_blank', 'width=900,height=800')
    if (!printWindow) {
      alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.')
      return
    }

    const printHtml = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>사주분석_${customer?.name || '보고서'}_${today}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Malgun Gothic', '맑은 고딕', sans-serif;
      line-height: 1.8;
      color: #333;
      margin: 0;
      padding: 0;
      background: white;
    }
    
    .print-header {
      text-align: center;
      padding: 30px 0;
      border-bottom: 3px solid #c9a84c;
      margin-bottom: 30px;
      page-break-after: avoid;
    }
    
    .print-header h1 {
      color: #1a2744;
      font-size: 28px;
      margin: 0 0 12px;
      font-weight: bold;
    }
    
    .print-header .date {
      color: #666;
      font-size: 14px;
    }
    
    .print-info {
      margin-top: 20px;
      padding: 16px;
      background: #f8f5ef;
      border-radius: 10px;
      text-align: left;
      font-size: 13px;
      color: #444;
    }
    
    .print-info div {
      margin: 4px 0;
    }
    
    h2 {
      color: #1a2744;
      border-bottom: 3px solid #c9a84c;
      padding-bottom: 12px;
      margin-top: 40px;
      font-size: 22px;
      page-break-before: auto;
      page-break-after: avoid;
    }
    
    h3 {
      color: #1a2744;
      border-left: 4px solid #c9a84c;
      padding-left: 14px;
      margin-top: 28px;
      font-size: 18px;
      page-break-after: avoid;
    }
    
    p {
      line-height: 1.9;
      margin-bottom: 16px;
      color: #333;
      font-size: 14px;
    }
    
    strong {
      color: #c9a84c;
      font-weight: bold;
    }
    
    ul, ol {
      line-height: 1.9;
      padding-left: 24px;
      margin-bottom: 16px;
    }
    
    li {
      margin-bottom: 8px;
      font-size: 14px;
    }
    
    div {
      page-break-inside: avoid;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      page-break-inside: avoid;
    }
    
    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: center;
      font-size: 13px;
    }
    
    .print-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #c9a84c;
      text-align: center;
      color: #888;
      font-size: 11px;
    }
    
    .print-controls {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #1a2744;
      color: white;
      padding: 16px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 1000;
    }
    
    .print-controls button {
      background: #c9a84c;
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      font-size: 15px;
      margin: 0 5px;
    }
    
    .print-controls button:hover {
      background: #b8973b;
    }
    
    .print-controls .info {
      display: inline-block;
      margin-right: 20px;
      font-size: 14px;
    }
    
    .content {
      padding-top: 80px;
    }
    
    @media print {
      .print-controls {
        display: none !important;
      }
      
      .content {
        padding-top: 0;
      }
    }
  </style>
</head>
<body>
  <div class="print-controls">
    <span class="info">💡 PDF로 저장하려면 "PDF로 저장" 버튼을 누르세요</span>
    <button onclick="window.print()">📄 PDF로 저장 / 인쇄</button>
    <button onclick="window.close()" style="background:#94a3b8">❌ 닫기</button>
  </div>
  
  <div class="content">
    <div class="print-header">
      <div style="font-size:50px">🔮</div>
      <h1>${customer?.name || '고객'}님 사주 분석 보고서</h1>
      <div class="date">${today} 작성</div>
      <div class="print-info">
        <div><strong>📅 생년월일:</strong> ${customer?.birth_date || '-'} ${customer?.birth_time || ''}</div>
        <div><strong>📍 출생지:</strong> ${customer?.birth_city || '-'}</div>
        <div><strong>👤 성별:</strong> ${customer?.gender === 'male' ? '남성' : '여성'}</div>
        ${customer?.family_info ? `<div><strong>👨‍👩‍👧 가족:</strong> ${customer.family_info}</div>` : ''}
      </div>
    </div>
    
    ${filteredHtml}
    ${followupsHtml}
    
    <div class="print-footer">
      본 보고서는 자평명리학 기반 AI 분석 결과로 참고 자료로 활용하시기 바랍니다.
    </div>
  </div>

  <script>
    // 페이지 로드 후 자동으로 인쇄 대화상자 열기 (선택사항)
    // window.onload = function() {
    //   setTimeout(() => window.print(), 500);
    // }
  </script>
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
              3. 인쇄 대화상자에서 <strong>"대상" → "PDF로 저장"</strong> 선택<br/>
              4. "저장" 클릭
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