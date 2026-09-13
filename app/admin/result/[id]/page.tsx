'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import SajuChart from '../../../../components/SajuChart'
import PdfChapterSelector from '../../../../components/PdfChapterSelector'
import FollowupSection from '../../../../components/FollowupSection'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function ResultPage() {
  const { id } = useParams()
  const [data, setData] = useState<any>(null)
  const [html, setHtml] = useState('')
  const [step, setStep] = useState(0)
  const isRunning = useRef(false)

  useEffect(() => {
    if (id) loadData()
  }, [id])

  async function loadData() {
    const { data: consult } = await supabase.from('consultations').select('*, customers(*)').eq('id', id).single()
    setData(consult)
    if (consult.report_html) {
        setHtml(consult.report_html)
        setStep(4)
    } else if (!isRunning.current) {
        generateAll(consult)
    }
  }

  async function generateAll(consult: any) {
    isRunning.current = true
    let fullHtml = ''
    for (let i = 1; i <= 4; i++) {
      setStep(i)
      const res = await fetch('/api/generate-part', {
        method: 'POST',
        body: JSON.stringify({ part: i, name: consult.customer_name, ...consult.customers, ...consult.saju_data, question: consult.question })
      })
      const result = await res.json()
      fullHtml += result.html + '<br/>'
      setHtml(fullHtml)
    }
    await supabase.from('consultations').update({ report_html: fullHtml, status: 'completed' }).eq('id', id)
    isRunning.current = false
  }

  if (!data) return <div style={{padding: '100px', textAlign: 'center'}}>로딩 중...</div>

  return (
    <div style={{ padding: '20px', background: '#f1f5f9', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {step < 4 && (
            <div style={{ background: '#1a2744', color: 'white', padding: '15px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' }}>
                🔮 AI가 사주 보고서를 작성 중입니다... ({step}/4 단계 진행 중)
            </div>
        )}
        
        <div style={{ background: '#1a2744', color: 'white', padding: '24px', borderRadius: '16px', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>🔮 {data.customer_name}님 사주 결과</h2>
          <p>{data.customers.birth_date} / {data.category}</p>
        </div>

        {data.saju_data && <SajuChart saju={data.saju_data} name={data.customer_name} />}

        <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', lineHeight: '1.8' }}>
          <div dangerouslySetInnerHTML={{ __html: html }} />
          {step < 4 && <p style={{color: '#888', textAlign: 'center'}}>생각 중...</p>}
        </div>

        {step === 4 && data.customers && (
          <div style={{marginTop: '20px'}}>
            <PdfChapterSelector reportHtml={html} customer={data.customers} followups={[]} sajuData={data.saju_data} isPremium={true} isAdmin={true} />
            <FollowupSection customerId={data.customers.id} customer={data.customers} onSuccess={loadData} />
          </div>
        )}
      </div>
    </div>
  )
}