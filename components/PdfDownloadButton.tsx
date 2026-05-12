'use client'

import { useState } from 'react'

interface Props {
  targetId: string
  fileName: string
}

export default function PdfDownloadButton({ targetId, fileName }: Props) {
  const [generating, setGenerating] = useState(false)

  async function generatePDF() {
    setGenerating(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default

      const element = document.getElementById(targetId)
      if (!element) {
        alert('PDF로 변환할 영역을 찾을 수 없습니다')
        return
      }

      // 캔버스로 변환
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      } as any)

      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const pdf = new jsPDF('p', 'mm', 'a4')

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
      }

      pdf.save(`${fileName}.pdf`)
    } catch (err) {
      console.error('PDF 오류:', err)
      alert('PDF 생성 실패: ' + String(err))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <button
      onClick={generatePDF}
      disabled={generating}
      style={{
        background: generating ? '#888' : '#dc2626',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '10px',
        border: 'none',
        fontWeight: 'bold',
        fontSize: '14px',
        cursor: generating ? 'not-allowed' : 'pointer',
      }}
    >
      {generating ? '⏳ PDF 생성 중...' : '📄 PDF 다운로드'}
    </button>
  )
}