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

const TONE_GUIDE = `
[상담 어조 가이드]

당신은 '20년 넘게 명리학을 깊이 연구한 대기업 임원 출신의 명리 전략가'입니다. 
당신의 분석은 시중의 가벼운 운세와는 차원이 다릅니다. 비즈니스 현장에서의 의사결정 경험과 명리학의 데이터 분석을 결합하여, 고객에게 가장 전략적이고 실질적인 조언을 제공합니다.

[핵심 경력 규칙 - 엄격 준수]
1. 절대 "30년 경력" 또는 "30년 경력의 명리학자"라는 표현을 사용하지 마십시오.
2. 반드시 "20년 연구 경력" 또는 "대기업 임원 출신의 통찰"이라고 표현하십시오.
3. 오행(나무, 불, 흙, 쇠, 물)을 작성할 때는 괄호 안에 한자가 유실되지 않도록 반드시 명시하십시오. 예: 목(木), 화(火), 토(土), 금(金), 수(水). 절대로 '수()'나 '목()'처럼 괄호 안을 비워두면 안 됩니다.
4. 어조는 단정하고 명확하며 결단력 있는 비즈니스 리더의 톤앤매너를 유지하십시오.

✅ 권장 표현:
- "이 사주는 ~한 특성이 명확합니다"
- "반드시 ~를 유념하시기 바랍니다"
- "각별히 ~에 유의하십시오"

❌ 지양:
- "~할 수도 있습니다"
- 너무 부드러운 표현
`

const HTML_GUIDE = `
HTML 형식:
- h2 (color:#1a2744, border-bottom:2px solid #c9a84c, padding-bottom:10px, margin-top:40px, font-size:22px)
- h3 (color:#1a2744, border-left:3px solid #c9a84c, padding-left:12px, margin-top:24px, font-size:17px)
- p (line-height:1.9, margin-bottom:16px, color:#2d2d2d, font-size:15px)
- strong (color:#8b6914, font-weight:bold) - 차분한 골드
- 일반 박스: div (background:#faf8f3, border-left:4px solid #c9a84c, padding:18px, border-radius:8px)
- 강조 박스 (좋은 운): div (background:#f0f7f4, border-left:4px solid #5b8a72, padding:18px, border-radius:8px)
- 주의 박스 (조심): div (background:#fdf5f1, border-left:4px solid #b8714a, padding:18px, border-radius:8px)

출력: HTML만. 마크다운 금지. h2부터 시작.
`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { person1, person2, relationship, question } = body

    console.log('📥 궁합:', person1.name, person2.name)

    const saju1 = calculateSaju(person1.birth_date, person1.birth_time, person1.birth_city, person1.calendar || 'solar', person1.leapMonth || false)
    const saju2 = calculateSaju(person2.birth_date, person2.birth_time, person2.birth_city, person2.calendar || 'solar', person2.leapMonth || false)
    const sajuText1 = getSajuText(person1.birth_date, person1.birth_time, person1.birth_city, person1.calendar || 'solar', person1.leapMonth || false)
    const sajuText2 = getSajuText(person2.birth_date, person2.birth_time, person2.birth_city, person2.calendar || 'solar', person2.leapMonth || false)

    const today = new Date().toLocaleDateString('ko-KR')
    const p1Age = new Date().getFullYear() - parseInt(person1.birth_date.split('-')[0])
    const p2Age = new Date().getFullYear() - parseInt(person2.birth_date.split('-')[0])

    const p1DayMaster = saju1.dayMaster
    const p2DayMaster = saju2.dayMaster

    const commonInfo = `
[첫 번째 사람: ${person1.name}]
- 성별: ${person1.gender === 'male' ? '남성' : '여성'}
- 만 ${p1Age}세
- 생년월일: ${person1.birth_date} (${person1.calendar === 'lunar' ? '음력' : '양력'})
- 출생시각: ${person1.birth_time}
- 출생지: ${person1.birth_city}

${sajuText1}

⭐ ${person1.name}님 일간 = ${p1DayMaster}

[두 번째 사람: ${person2.name}]
- 성별: ${person2.gender === 'male' ? '남성' : '여성'}
- 만 ${p2Age}세
- 생년월일: ${person2.birth_date} (${person2.calendar === 'lunar' ? '음력' : '양력'})
- 출생시각: ${person2.birth_time}
- 출생지: ${person2.birth_city}

${sajuText2}

⭐ ${person2.name}님 일간 = ${p2DayMaster}

[관계] ${RELATIONSHIP_KO[relationship]}
[상담일] ${today}
[고객 질문] ${question || '관계 전반에 대한 궁합 분석'}
`

    const prompt1 = `20년 넘게 명리학을 깊이 연구한 대기업 임원 출신의 명리 전략가.

${TONE_GUIDE}

${commonInfo}

작성할 내용 (3개 장 모두 완료):

[제1장: 두 사람의 사주 요약]
- ${person1.name}님 사주 요약 (5문장 이상, 단호하게)
- ${person2.name}님 사주 요약 (5문장 이상, 단호하게)

[제2장: 사주 원국 비교]
- 두 사람의 사주를 표로 비교
- 핵심 차이점과 공통점 (명확하게)

[제3장: 일간 궁합 분석 (${p1DayMaster} ↔ ${p2DayMaster})]
- 일간끼리의 관계 분석 (10문장 이상)
- 생극 관계 (단호하게 설명)
- 서로에게 미치는 영향

${HTML_GUIDE}

⚠️ 1~3장만 작성!`

    const prompt2 = `20년 넘게 명리학을 깊이 연구한 대기업 임원 출신의 명리 전략가.

${TONE_GUIDE}

${commonInfo}

작성할 내용:

[제4장: 오행 상호 보완성] (10문장 이상)
- 두 사람의 오행 분포
- 부족한 오행 보완 여부
- 과다한 오행의 영향

[제5장: 합·충·형 관계] (10문장 이상)
- 천간합/지지합
- 충/형/파/해
- 실전적 의미 (강하게)

${HTML_GUIDE}

⚠️ 4~5장만!`

    const prompt3 = `20년 넘게 명리학을 깊이 연구한 대기업 임원 출신의 명리 전략가.

${TONE_GUIDE}

${commonInfo}

작성할 내용:

[제6장: 관계의 장점 5가지]
각 장점마다 4문장 이상, 강하게 부각

[제7장: 반드시 주의해야 할 점 3가지]
각 주의점마다 4문장 이상, 단호하게 경고

[제8장: ${RELATIONSHIP_KO[relationship]} 관계 운영 전략]
- 일상 운영 방법 (10문장 이상)
- 갈등 해결 방법 (구체적으로)
- 관계 강화 방법

${HTML_GUIDE}

⚠️ 6~8장만!`

    const prompt4 = `20년 넘게 명리학을 깊이 연구한 대기업 임원 출신의 명리 전략가.

${TONE_GUIDE}

${commonInfo}

작성할 내용:

[제9장: 시기별 흐름 (현재~3년 후)]
- 올해 관계 흐름 (5문장 이상)
- 내년 관계 흐름 (5문장 이상)
- 내후년 관계 흐름 (5문장 이상)
- 향후 3년 종합

[제10장: 실천 조언 5가지]
각 조언마다 4문장 이상으로 구체적으로

[제11장: 종합 평가]
- 궁합 점수 (100점 만점)
- 종합 의견 (10문장 이상, "20년 연구와 비즈니스 현장 경험을 바탕으로 내린 결론"임을 반드시 명시)
- 응원 메시지 (5문장 이상, 따뜻하지만 단호하게)

${HTML_GUIDE}

⚠️ 9~11장 모두 완료!`

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!.trim(),
    })

    console.log('🤖 궁합 4개 분석 병렬 시작...')
    const messages = await Promise.all([
      anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 16000,
        messages: [{ role: 'user', content: prompt1 }],
      }),
      anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 16000,
        messages: [{ role: 'user', content: prompt2 }],
      }),
      anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 16000,
        messages: [{ role: 'user', content: prompt3 }],
      }),
      anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 16000,
        messages: [{ role: 'user', content: prompt4 }],
      }),
    ])

    const parts = messages.map((m, i) => {
      const part = cleanHtml(m.content[0].type === 'text' ? m.content[0].text : '')
      console.log(`✅ ${i + 1}/4 완료, 길이:`, part.length)
      return part
    })

    let reportHtml = parts.join('\n\n')
    
    // [핵심 추가] AI가 오행 괄호를 비워두고 출력했을 때를 대비한 강제 한자 보충 (안전장치)
    reportHtml = reportHtml
      .replace(/목\s*\(\s*\)/g, '목(木)')
      .replace(/화\s*\(\s*\)/g, '화(火)')
      .replace(/토\s*\(\s*\)/g, '토(土)')
      .replace(/금\s*\(\s*\)/g, '금(金)')
      .replace(/수\s*\(\s*\)/g, '수(水)')

    console.log('✅ 전체 길이:', reportHtml.length)

    // RLS 권한 우회를 위해 서버 전용 서비스 롤 키(SUPABASE_SERVICE_ROLE_KEY) 사용
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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