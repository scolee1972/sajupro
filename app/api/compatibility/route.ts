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
    .replace(/```html\s*/gi, '').replace(/```\s*/g, '')
    .replace(/^\s*<!DOCTYPE.*?>/gi, '').replace(/^\s*<html.*?>/gi, '')
    .replace(/<\/html>\s*$/gi, '').replace(/^\s*<body.*?>/gi, '')
    .replace(/<\/body>\s*$/gi, '').trim()
}

const HTML_GUIDE = `
HTML 형식 가이드:
- 큰제목: h2 태그 (color:#be185d, border-bottom:3px solid #ec4899, padding-bottom:12px, margin-top:48px, font-size:24px)
- 소제목: h3 태그 (color:#1a2744, border-left:4px solid #ec4899, padding-left:14px, margin-top:32px, font-size:18px)
- 단락: p 태그 (line-height:2, margin-bottom:18px, color:#333, font-size:15px)
- 강조: strong 태그 (color:#ec4899)
- 박스: div 태그 (background:#fdf2f8, border-left:5px solid #ec4899, padding:20px, border-radius:10px, line-height:2)

출력 규칙:
- HTML만 출력
- 마크다운 코드블록 금지
- 바로 h2부터 시작
`

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

    const commonInfo = `
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
`

    // ========== Part 1: 두 사람 분석 + 일간 궁합 ==========
    const prompt1 = `당신은 자평명리학 40년 경력의 최고 궁합 전문 상담사입니다.

${commonInfo}

작성할 내용:

[제1장: 두 사람의 사주 요약]
- ${person1.name}님 사주 요약 (5문장 이상)
- ${person2.name}님 사주 요약 (5문장 이상)

[제2장: 사주 원국 비교]
- 두 사람의 사주를 표로 비교
- 핵심 차이점과 공통점

[제3장: 일간 궁합 분석 (${p1DayMaster} ↔ ${p2DayMaster})]
- 일간끼리의 관계 분석 (10문장 이상)
- 생극 관계
- 서로에게 미치는 영향

${HTML_GUIDE}

⚠️ 1~3장만 작성!`

    // ========== Part 2: 오행 + 합충형 ==========
    const prompt2 = `당신은 자평명리학 40년 경력의 최고 궁합 전문 상담사입니다.

${commonInfo}

작성할 내용:

[제4장: 오행 상호 보완성] (10문장 이상)
- 두 사람의 오행 분포
- 부족한 오행 보완 여부
- 과다한 오행의 영향

[제5장: 합·충·형 관계] (10문장 이상)
- 천간합/지지합 분석
- 충/형/파/해 관계
- 실전적 의미

${HTML_GUIDE}

⚠️ 4~5장만 작성!`

    // ========== Part 3: 장점·주의 + 운영전략 ==========
    const prompt3 = `당신은 자평명리학 40년 경력의 최고 궁합 전문 상담사입니다.

${commonInfo}

작성할 내용:

[제6장: 관계의 장점 5가지]
각 장점마다 3문장 이상으로 상세히

[제7장: 주의해야 할 점 3가지]
각 주의점마다 3문장 이상으로 상세히

[제8장: ${RELATIONSHIP_KO[relationship]} 관계 운영 전략]
- 일상 운영 방법 (10문장 이상)
- 갈등 해결 방법
- 관계 강화 방법

${HTML_GUIDE}

⚠️ 6~8장만 작성!`

    // ========== Part 4: 시기별 + 실천조언 + 종합평가 ==========
    const prompt4 = `당신은 자평명리학 40년 경력의 최고 궁합 전문 상담사입니다.

${commonInfo}

작성할 내용:

[제9장: 시기별 흐름 (현재~3년 후)]
- 올해 관계 흐름 (5문장 이상)
- 내년 관계 흐름 (5문장 이상)
- 내후년 관계 흐름 (5문장 이상)
- 향후 3년 종합

[제10장: 실천 조언 5가지]
각 조언마다 4문장 이상으로 구체적으로
- 무엇을, 언제, 어떻게 해야 하는지

[제11장: 종합 평가]
- 궁합 점수 (100점 만점)
- 종합 의견 (10문장 이상)
- 격려 메시지 (5문장 이상)

${HTML_GUIDE}

⚠️ 9~11장 모두 작성! 절대 끊지 말 것!
⚠️ 종합 평가까지 완료!`

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!.trim(),
    })

    console.log('🤖 1/4: 사주 + 일간 궁합')
    const m1 = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt1 }],
    })
    const p1 = cleanHtml(m1.content[0].type === 'text' ? m1.content[0].text : '')
    console.log('✅ 1/4 완료, 길이:', p1.length)

    console.log('🤖 2/4: 오행 + 합충형')
    const m2 = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt2 }],
    })
    const p2 = cleanHtml(m2.content[0].type === 'text' ? m2.content[0].text : '')
    console.log('✅ 2/4 완료, 길이:', p2.length)

    console.log('🤖 3/4: 장점/주의/운영')
    const m3 = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt3 }],
    })
    const p3 = cleanHtml(m3.content[0].type === 'text' ? m3.content[0].text : '')
    console.log('✅ 3/4 완료, 길이:', p3.length)

    console.log('🤖 4/4: 시기/조언/종합')
    const m4 = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt4 }],
    })
    const p4 = cleanHtml(m4.content[0].type === 'text' ? m4.content[0].text : '')
    console.log('✅ 4/4 완료, 길이:', p4.length)

    const reportHtml = p1 + p2 + p3 + p4
    console.log('✅ 전체 길이:', reportHtml.length)

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