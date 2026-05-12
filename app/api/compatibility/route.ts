import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { getSajuText, calculateSaju } from '@/lib/saju'

const RELATIONSHIP_KO: Record<string, string> = {
  couple: '연인', married: '부부', family: '가족',
  friend: '친구', colleague: '직장동료', business: '사업파트너',
  parent_child: '부모-자녀', siblings: '형제자매',
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
    const { person1, person2, relationship, question } = body

    console.log('📥 궁합:', person1.name, person2.name)

        const saju1 = calculateSaju(person1.birth_date, person1.birth_time, person1.birth_city, person1.calendar || 'solar', false)
    const saju2 = calculateSaju(person2.birth_date, person2.birth_time, person2.birth_city, person2.calendar || 'solar', false)
    const sajuText1 = getSajuText(person1.birth_date, person1.birth_time, person1.birth_city, person1.calendar || 'solar', false)
    const sajuText2 = getSajuText(person2.birth_date, person2.birth_time, person2.birth_city, person2.calendar || 'solar', false)

    const today = new Date().toLocaleDateString('ko-KR')
    const p1Age = new Date().getFullYear() - parseInt(person1.birth_date.split('-')[0])
    const p2Age = new Date().getFullYear() - parseInt(person2.birth_date.split('-')[0])

    const p1DayMaster = saju1.dayMaster
    const p2DayMaster = saju2.dayMaster

    const prompt = `당신은 자평명리학 40년 경력의 최고 궁합 전문 상담사입니다.
두 사람의 사주를 비교 분석하여 ${RELATIONSHIP_KO[relationship]} 관계 궁합 보고서를 작성하세요.

[첫 번째 사람: ${person1.name}]
- 성별: ${person1.gender === 'male' ? '남성' : '여성'}
- 만 ${p1Age}세
- ${person1.birth_date} ${person1.birth_time} (${person1.birth_city})

${sajuText1}

⭐ ${person1.name}님 일간 = ${p1DayMaster}

[두 번째 사람: ${person2.name}]
- 성별: ${person2.gender === 'male' ? '남성' : '여성'}
- 만 ${p2Age}세
- ${person2.birth_date} ${person2.birth_time} (${person2.birth_city})

${sajuText2}

⭐ ${person2.name}님 일간 = ${p2DayMaster}

[관계] ${RELATIONSHIP_KO[relationship]}
[상담일] ${today}
[고객 질문] ${question || '관계 전반에 대한 궁합 분석'}

보고서 구성 (각 장 7문장 이상):

■ 제1장: 두 사람의 사주 요약
■ 제2장: 사주 원국 비교표
■ 제3장: 일간 궁합 분석 (${p1DayMaster} vs ${p2DayMaster})
■ 제4장: 오행 상호 보완성
■ 제5장: 합·충·형 관계
■ 제6장: 관계의 장점 5가지
■ 제7장: 주의해야 할 점 3가지
■ 제8장: ${RELATIONSHIP_KO[relationship]} 관계 운영 전략
■ 제9장: 시기별 흐름 (현재~3년 후)
■ 제10장: 실천 조언 5가지
■ 제11장: 종합 평가

HTML 형식 가이드:
- 큰제목: h2 태그 (color:#be185d, border-bottom:3px solid #ec4899, padding-bottom:12px, margin-top:48px, font-size:24px)
- 소제목: h3 태그 (color:#1a2744, border-left:4px solid #ec4899, padding-left:14px, margin-top:32px, font-size:18px)
- 단락: p 태그 (line-height:2, margin-bottom:18px, color:#333, font-size:15px)
- 강조: strong 태그 (color:#ec4899)
- 박스: div 태그 (background:#fdf2f8, border-left:5px solid #ec4899, padding:20px, border-radius:10px, line-height:2)

가독성 규칙:
1. 모든 단락은 p 태그로 감싸기
2. 한 단락은 3~5문장 이내

출력 규칙 (필수):
- HTML만 출력
- 마크다운 코드블록 절대 금지
- DOCTYPE, html, body 태그 금지
- 따뜻하고 정성스러운 문체`

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!.trim(),
    })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }],
    })

    const reportHtml = cleanHtml(
      message.content[0].type === 'text' ? message.content[0].text : ''
    )

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase
      .from('compatibility_readings')
      .insert({
        person1_name: person1.name,
        person1_gender: person1.gender,
        person1_birth_date: person1.birth_date,
        person1_birth_time: person1.birth_time,
        person1_birth_city: person1.birth_city,
        person1_calendar: person1.calendar,
        person2_name: person2.name,
        person2_gender: person2.gender,
        person2_birth_date: person2.birth_date,
        person2_birth_time: person2.birth_time,
        person2_birth_city: person2.birth_city,
        person2_calendar: person2.calendar,
        relationship_type: relationship,
        question: question || '',
        report_html: reportHtml,
      })
      .select().single()

    if (error) throw error

    return NextResponse.json({ success: true, id: data?.id })

  } catch (error) {
    console.error('❌ 오류:', error)
    return NextResponse.json({ success: false, message: String(error) }, { status: 500 })
  }
}