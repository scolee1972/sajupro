import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { getSajuText, calculateSaju } from '@/lib/saju'

const CATEGORY_KO: Record<string, string> = {
  general: '종합 운세', love: '연애/애정', career: '직장/이직',
  business: '사업/창업', investment: '투자/재테크', study: '학업/진로',
  moving: '이사/방위', family: '가족 관계', compatibility: '궁합',
}

function cleanHtml(html: string): string {
  return html
    .replace(/```html\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/^\s*<!DOCTYPE.*?>/gi, '')
    .replace(/^\s*<html.*?>/gi, '')
    .replace(/<\/html>\s*$/gi, '')
    .replace(/^\s*<body.*?>/gi, '')
    .replace(/<\/body>\s*$/gi, '')
    .trim()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, customer, category, question } = body

    console.log('📥 추가 질의:', { question })

    const saju = calculateSaju(customer.birth_date, customer.birth_time, customer.birth_city)
    const sajuText = getSajuText(customer.birth_date, customer.birth_time, customer.birth_city)

    const today = new Date()
    const todayStr = today.toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    })
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() + 1
    const birthYear = parseInt(customer.birth_date.split('-')[0])
    const age = currentYear - birthYear

    const dayMaster = saju.dayMaster

    const prompt = `당신은 자평명리학 40년 경력의 최고 전문 상담사입니다.
고객의 사주를 바탕으로, 아래 질문에 매우 구체적이고 상세한 답변을 HTML로 작성하세요.

[고객 정보]
- 이름: ${customer.name}
- 성별: ${customer.gender === 'male' ? '남성' : '여성'}
- 만 나이: ${age}세
- 생년월일: ${customer.birth_date}
- 출생시각: ${customer.birth_time}
- 출생지: ${customer.birth_city}

${sajuText}

⭐ 일간 = ${dayMaster}

[상담 정보]
- 상담일: ${todayStr}
- 현재: ${currentYear}년 ${currentMonth}월
- 상담분야: ${CATEGORY_KO[category] || '종합'}
- 고객 질문: ${question}

[답변 작성 규칙]
1. 질문에 직접 답변
2. 구체적 시기 명시 (연운/월운/주간운)
   예: "${currentYear}년 8~9월경", "${currentYear + 1}년 3월 둘째 주"
3. 사주 구조 근거 명시
4. 실행 가능한 구체적 조언 5가지 이상

[답변 구성]
■ 핵심 답변 (3~5문장)
■ 사주 분석 근거
■ 시기별 상세 분석 (연운/월운/주간운)
■ 실천 전략 5가지 이상
■ 주의사항
■ 최종 조언

HTML 형식 가이드:
- 소제목: h3 태그 (color:#1a2744, border-left:4px solid #c9a84c, padding-left:14px, margin-top:32px, font-size:18px)
- 단락: p 태그 (line-height:2, margin-bottom:18px, color:#333, font-size:15px)
- 강조: strong 태그 (color:#c9a84c)
- 박스: div 태그 (background:#f8f5ef, border-left:5px solid #c9a84c, padding:20px, border-radius:10px, line-height:2)
- 목록: ul/li 태그

가독성 규칙:
1. 모든 단락은 p 태그로 감싸기
2. 한 단락은 3~5문장 이내

출력 규칙 (필수):
- HTML만 출력
- 마크다운 코드블록 절대 금지
- DOCTYPE, html, body 태그 금지
- 바로 h3부터 시작`

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!.trim(),
    })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    })

    const answerHtml = cleanHtml(
      message.content[0].type === 'text' ? message.content[0].text : ''
    )

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase
      .from('followup_questions')
      .insert({
        customer_id: customerId,
        category,
        question,
        answer_html: answerHtml,
      })
      .select().single()

    if (error) throw error

    return NextResponse.json({ success: true, followupId: data?.id })

  } catch (error) {
    console.error('❌ 오류:', error)
    return NextResponse.json({ success: false, message: String(error) }, { status: 500 })
  }
}