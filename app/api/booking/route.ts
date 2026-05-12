import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { getSajuText, calculateSaju } from '@/lib/saju'

const CATEGORY_KO: Record<string, string> = {
  general: '종합 운세', love: '연애/애정', career: '직장/이직',
  business: '사업/창업', investment: '투자/재테크', study: '학업/진로',
  moving: '이사/방위', family: '가족 관계', compatibility: '궁합',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📥 예약 접수:', body.customer_name)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 1. 예약 저장
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        customer_email: body.customer_email,
        gender: body.gender,
        birth_date: body.birth_date,
        birth_time: body.birth_time,
        birth_city: body.birth_city,
        calendar_type: body.calendar_type,
        booking_date: body.booking_date,
        booking_time: body.booking_time,
        consultation_type: body.consultation_type,
        category: body.category,
        question: body.question,
        amount: body.amount,
        payment_status: body.payment_status,
        payment_method: body.payment_method,
        payment_id: body.payment_id,
        status: body.status,
        paid_at: body.payment_status === 'paid' ? new Date().toISOString() : null,
      })
      .select().single()

    if (bookingError) throw bookingError
    console.log('✅ 예약 저장:', booking.id)

    // 2. 결제 완료된 경우 → 자동으로 사주 분석 진행
    if (body.payment_status === 'paid') {
      try {
        // 사주 계산
        const saju = calculateSaju(body.birth_date, body.birth_time, body.birth_city)
        const sajuText = getSajuText(body.birth_date, body.birth_time, body.birth_city)

        const today = new Date()
        const todayStr = today.toLocaleDateString('ko-KR', {
          year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
        })
        const currentYear = today.getFullYear()
        const birthYear = parseInt(body.birth_date.split('-')[0])
        const age = currentYear - birthYear

        const prompt = `당신은 자평명리학 최고 수준의 전문 상담사입니다.
${body.customer_name}님의 사주를 매우 상세히 분석하여 HTML로 작성해주세요.

【고객 정보】
- 이름: ${body.customer_name}
- 성별: ${body.gender === 'male' ? '남성' : '여성'}
- 만 나이: ${age}세
- 생년월일: ${body.birth_date}
- 출생시각: ${body.birth_time}
- 출생지: ${body.birth_city}
- 상담일: ${todayStr}
- 상담분야: ${CATEGORY_KO[body.category] || '종합'}
- 질문: ${body.question || '없음'}

${sajuText}

⭐ 일간(日干) = ${saju.dayMaster}

【보고서 구성 - 모두 포함】
① 사주 핵심 요약
② 사주 원국 표
③ 오행 분포 분석
④ 육친 관계 (조상/부모/형제/배우자/자녀)
⑤ 건강·체질 분석 (오행 체질, 음식, 운동)
⑥ 격국과 용신
⑦ 십성 분석
⑧ 대운 흐름
⑨ ${currentYear}년 운세 (월별)
⑩ ${CATEGORY_KO[body.category] || '종합'} 맞춤 분석
⑪ 향후 3년 전략
⑫ 종합 조언

【HTML 형식】
- <h2 style="color:#1a2744;border-bottom:3px solid #c9a84c;padding-bottom:10px;margin-top:40px">제목</h2>
- <h3 style="color:#1a2744;border-left:4px solid #c9a84c;padding-left:12px">소제목</h3>
- <strong style="color:#c9a84c">강조</strong>
- <div style="background:#f8f5ef;border-left:5px solid #c9a84c;padding:18px;border-radius:10px;margin:18px 0">박스</div>

따뜻하고 전문적인 문체로 HTML만 출력하세요.`

        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!.trim() })
        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 16000,
          messages: [{ role: 'user', content: prompt }],
        })

        const reportHtml = message.content[0].type === 'text' ? message.content[0].text : ''

        // 고객 저장
        const { data: customer } = await supabase
          .from('customers')
          .insert({
            name: body.customer_name,
            gender: body.gender,
            phone: body.customer_phone,
            birth_date: body.birth_date,
            birth_time: body.birth_time,
            birth_city: body.birth_city,
          })
          .select().single()

        // 상담 저장
        const { data: consultation } = await supabase
          .from('consultations')
          .insert({
            customer_id: customer?.id,
            customer_name: body.customer_name,
            category: body.category,
            question: body.question,
            report_html: reportHtml,
            saju_data: saju,
          })
          .select().single()

        // 예약에 consultation_id 연결
        if (consultation?.id) {
          await supabase
            .from('bookings')
            .update({ consultation_id: consultation.id })
            .eq('id', booking.id)
        }

        console.log('✅ 분석 완료')
      } catch (err) {
        console.error('분석 오류:', err)
      }
    }

    return NextResponse.json({ success: true, bookingId: booking.id })

  } catch (error) {
    console.error('❌ 오류:', error)
    return NextResponse.json({ success: false, message: String(error) }, { status: 500 })
  }
}