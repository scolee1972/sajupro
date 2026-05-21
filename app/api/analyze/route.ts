import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { getSajuText, calculateSaju } from '@/lib/saju'

export const maxDuration = 300

const CATEGORY_KO: Record<string, string> = {
  general: '종합 운세', love: '연애/애정', career: '직장/이직',
  business: '사업/창업', investment: '투자/재테크', study: '학업/진로',
  moving: '이사/방위', family: '가족 관계', compatibility: '궁합',
}

function cleanHtml(html: string): string {
  return html
    .replace(/```html\s*/gi, '').replace(/```\s*/g, '')
    .replace(/^\s*<!DOCTYPE.*?>/gi, '').replace(/^\s*<html.*?>/gi, '')
    .replace(/<\/html>\s*$/gi, '').replace(/^\s*<body.*?>/gi, '')
    .replace(/<\/body>\s*$/gi, '').trim()
}

const HTML_GUIDE = `
HTML 형식:
- h2 (color:#1a2744, border-bottom:3px solid #c9a84c, padding-bottom:12px, margin-top:48px, font-size:24px)
- h3 (color:#1a2744, border-left:4px solid #c9a84c, padding-left:14px, margin-top:32px)
- p (line-height:2, margin-bottom:18px, color:#333)
- strong (color:#c9a84c)
- 박스: div (background:#f8f5ef, border-left:5px solid #c9a84c, padding:20px, border-radius:10px)

출력: HTML만. 마크다운 금지. h2부터 시작.
`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name, gender, phone, email, address, familyInfo,
      marriageDate, divorceDate, spouseBirth, childrenInfo,
      majorEvents, bodyType, healthStatus,
      birthDate, birthTime, birthCity, birthCountry,
      calendarType, leapMonth, category, question
    } = body

    console.log('📥 입력:', { name, birthDate, birthTime, birthCity })

    const saju = calculateSaju(birthDate, birthTime, birthCity, calendarType, leapMonth)
    const sajuText = getSajuText(birthDate, birthTime, birthCity, calendarType, leapMonth)
    console.log('🔮 사주:', saju.year.full, saju.month.full, saju.day.full, saju.hour.full)

    const today = new Date()
    const todayStr = today.toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    })
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() + 1
    const birthYear = parseInt(birthDate.split('-')[0])
    const age = currentYear - birthYear

    const calendarLabel = calendarType === 'lunar'
      ? '음력' + (leapMonth ? ' (윤달)' : '')
      : '양력'

    const dayMaster = saju.dayMaster
    const yearFull = saju.year.full
    const monthFull = saju.month.full
    const dayFull = saju.day.full
    const hourFull = saju.hour.full

    let durationInfo = ''
    if (majorEvents) {
      const startMatches = [...majorEvents.matchAll(/(\d{4})년[^,\n]*?(?:입사|시작|결혼|이사)/g)]
      const endMatches = [...majorEvents.matchAll(/(\d{4})년[^,\n]*?(?:퇴사|이혼|사별|매도|종료)/g)]
      if (startMatches.length > 0 && endMatches.length > 0) {
        durationInfo = `\n⚠️ 기간 계산: "종료년 - 시작년 + 1" 공식 사용`
      }
    }

    const verificationInfo = `
[검증 정보]
${familyInfo ? `- 가족: ${familyInfo}` : ''}
${marriageDate ? `- 결혼일: ${marriageDate}` : ''}
${divorceDate ? `- 이혼/사별일: ${divorceDate}` : ''}
${spouseBirth ? `- 배우자: ${spouseBirth}` : ''}
${childrenInfo ? `- 자녀: ${childrenInfo}` : ''}
${majorEvents ? `- 주요 사건:\n${majorEvents}${durationInfo}` : ''}
[거주지] ${address || '미입력'} (방위 기준)
[건강] ${bodyType ? `체형: ${bodyType}` : ''} ${healthStatus || ''}
`.trim()

    const commonInfo = `
[고객] ${name} / ${gender === 'male' ? '남' : '여'} / 만 ${age}세 (${birthYear}년생)
[생일] ${birthDate} (${calendarLabel}) ${birthTime}
[출생지] ${birthCity}${birthCountry && birthCountry !== '대한민국' ? ` (${birthCountry})` : ''}
[거주지] ${address || '미입력'}
[상담일] ${todayStr} / ${CATEGORY_KO[category] || '종합'}
[질문] ${question || '없음'}

${verificationInfo}

${sajuText}

⭐ 일간 = ${dayMaster}
`

    // ========== Part 1: 사주 원국 + 과거 ==========
    const prompt1 = `당신은 자평명리학 30년 경력의 최고 전문 상담사입니다.

${commonInfo}

다음 2개 장을 모두 작성. 절대 끊지 말 것!

[제1장: 사주 원국 총론]
- 사주 원국 표
- 일간 ${dayMaster}의 성격 (5문단 이상)
- 사주 구조와 특징
- 강점 5가지

[제2장: 과거 시기 검증]
${majorEvents ? `⚠️ 실제 사건: ${majorEvents}\n대운/세운과 연결!` : ''}

만 ${age}세 기준:
▶ 유아기~초등 (1~12세)
▶ 중·고등 (13~18세)
▶ 20대 (19~29세)
${age >= 30 ? '▶ 30대' : ''}
${age >= 40 ? '▶ 40대' : ''}
${age >= 50 ? '▶ 50대' : ''}

${HTML_GUIDE}

⚠️ 1~2장만! 3장은 작성하지 말 것!`

    // ========== Part 2: 육친 관계 (별도 분리!) ==========
    const prompt2 = `당신은 자평명리학 30년 경력의 최고 전문 상담사입니다.

${commonInfo}

[제3장: 육친 관계 심층 분석]

아래 4개의 기둥별 관계를 각각 8문장 이상으로 매우 상세하게 분석하세요.
절대 중간에 끊지 말고 4개 모두 완료하세요!

▶ 년주(${yearFull}): 조상운, 사회적 배경
- 조부모와의 관계
- 가문의 특징
- 유년기 환경
- 본인에게 미치는 영향

▶ 월주(${monthFull}): 부모운, 형제운, 직장
- 아버지와의 관계 (친밀도, 갈등)
- 어머니와의 관계
- 형제자매 관계
- 직장/사회생활 패턴

▶ 일주(${dayFull}): 본인, 배우자
- 본인의 핵심 성격 (장점 5, 단점 3)
- 연애/결혼 스타일
- 배우자의 성향
- 결혼 시기 예측
- 부부 갈등 포인트와 해결

▶ 시주(${hourFull}): 자녀운, 말년운
- 자녀의 성향
- 양육 방식 추천
- 말년(60대 이후) 삶의 질
- 노후 준비 방향

마지막에 "육친 관계 종합 정리"를 5문장 이상으로 작성하세요.

${HTML_GUIDE}

⚠️ 3장만 작성! 4개 기둥 모두 완료 + 종합 정리까지!`

    // ========== Part 3: 건강 + 격국 + 십성 ==========
    const prompt3 = `당신은 자평명리학 30년 경력의 최고 전문 상담사입니다.

${commonInfo}

다음 3개 장을 모두 작성. 절대 끊지 말 것!

[제4장: 건강·체질 심층 분석]
${bodyType ? `⚠️ 실제 체형: ${bodyType} - 우선 반영!` : ''}
▶ 오행 체질 분석
▶ 장기별 강약
▶ 추천 식단 (음식 10가지, 피해야 할 5가지)
▶ 추천 운동 5가지

[제5장: 격국과 용신]
▶ 격국 판단 (7문장 이상)
▶ 용신 (색상, 방위, 직업 7가지)
▶ 기신
⚠️ 방위 = ${address || '미입력'} 기준!

[제6장: 십성 분석]
10가지 모두 (각 4문장): 비견 겁재 식신 상관 편재 정재 편관 정관 편인 정인
마지막에 종합 정리 7문장.

${HTML_GUIDE}

⚠️ 4~6장 모두 완료! 십성 10개 빠짐없이!`

    // ========== Part 4: 대운 + 올해 + 향후 3년 ==========
    const prompt4 = `당신은 자평명리학 30년 경력의 최고 전문 상담사입니다.

${commonInfo}

다음 3개 장을 모두 작성. 절대 끊지 말 것!

[제7장: 대운 흐름 (현재~미래만!)]
⚠️ 과거 대운 금지!
▶ 현재 대운 (만 ${age}세) - 15문장 이상
▶ 다음 대운 (10년 후) - 10문장
▶ 그 다음 대운 (20년 후) - 8문장

[제8장: ${currentYear}년 올해의 운세]
▶ 세운 분석 (7문장)
▶ 월별 운세 (${currentMonth}~12월, 각 5문장)
▶ 핵심 키워드 3가지
▶ 해야 할 것 5가지
▶ 하지 말 것 3가지

[제9장: ${currentYear + 1}~${currentYear + 3}년 향후 3년]
▶ ${currentYear + 1}년 (15문장)
▶ ${currentYear + 2}년 (15문장)
▶ ${currentYear + 3}년 (15문장)
▶ 종합 전략

${HTML_GUIDE}

⚠️ 7~9장 모두 완료!`

    // ========== Part 5: 맞춤 + 인생 로드맵 ==========
    const prompt5 = `당신은 자평명리학 30년 경력의 최고 전문 상담사입니다.

${commonInfo}

다음 2개 장을 모두 작성. 절대 끊지 말 것!

[제10장: ${CATEGORY_KO[category] || '종합'} 맞춤 분석]
▶ 사주에서 본 운
${question ? `▶ 질문: "${question}"` : '▶ 종합 전략'}
▶ 실행 전략 10가지
▶ 주의사항 5가지
(25문장 이상)

[제11장: 인생 로드맵 (만 ${age}세 이후 미래만!)]
⚠️ 과거 절대 다루지 말 것!
${age < 40 ? `
▶ 현재 ~ 40대 (10문장)
▶ 40대 ~ 50대 (10문장)
▶ 50대 ~ 60대 (10문장)
▶ 60대 이후 (10문장)
` : age < 50 ? `
▶ 현재 ~ 50대 (10문장)
▶ 50대 ~ 60대 (10문장)
▶ 60대 ~ 70대 (10문장)
▶ 70대 이후 (10문장)
` : age < 60 ? `
▶ 현재 ~ 60대 (10문장)
▶ 60대 ~ 70대 (10문장)
▶ 70대 ~ 80대 (10문장)
▶ 80대 이후 (10문장)
` : `
▶ 현재 ~ 70대 (10문장)
▶ 70대 ~ 80대 (10문장)
▶ 80대 이후 (10문장)
`}

${HTML_GUIDE}

⚠️ 10~11장 모두 완료!`

    // ========== Part 6: 종합 조언 (별도!) ==========
    const prompt6 = `당신은 자평명리학 30년 경력의 최고 전문 상담사입니다.

${commonInfo}

보고서의 마지막 장입니다. 매우 정성스럽게 완성하세요.

[제12장: 종합 조언과 마무리]

▶ 이 사주의 가장 큰 축복 3가지
각 6문장 이상: 어떤 축복인지, 왜, 어떻게 활용

▶ 주의해야 할 점 3가지
각 6문장 이상: 무엇을, 왜, 어떻게 대처

▶ 핵심 조언 7가지
각 4문장 이상: 무엇을/언제/어떻게/왜

▶ 따뜻한 격려와 응원 메시지
⚠️ 최소 20문장 이상!
⚠️ ${name}님 이름 여러 번 언급!
⚠️ 과거 어려움 인정 + 현재 노력 칭찬 + 미래 희망
⚠️ "응원합니다", "축복합니다", "행복하세요" 마무리!
⚠️ 절대 중간에 끊지 말 것!

${HTML_GUIDE}

⚠️ 12장만! 격려 메시지까지 끝까지!`

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!.trim(),
    })

    const prompts = [prompt1, prompt2, prompt3, prompt4, prompt5, prompt6]
    const partNames = ['1~2장', '3장 육친', '4~6장', '7~9장', '10~11장', '12장 종합']

    console.log('🤖 6개 분석 병렬 시작...')
    const messages = await Promise.all(
      prompts.map((prompt, i) => {
        console.log(`  ${i + 1}/6: ${partNames[i]} 시작`)
        return anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 16000,
          messages: [{ role: 'user', content: prompt }],
        })
      })
    )

    const parts = messages.map((m, i) => {
      const part = cleanHtml(m.content[0].type === 'text' ? m.content[0].text : '')
      console.log(`✅ ${i + 1}/6 완료, 길이:`, part.length)
      return part
    })

    const reportHtml = parts.join('')
    console.log('✅ 전체 보고서 길이:', reportHtml.length)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .insert({
        name, gender, phone,
        email: email || null,
        address: address || null,
        family_info: familyInfo || null,
        marriage_date: marriageDate || null,
        divorce_date: divorceDate || null,
        spouse_birth: spouseBirth || null,
        children_info: childrenInfo || null,
        major_events: majorEvents || null,
        body_type: bodyType || null,
        health_status: healthStatus || null,
        birth_date: birthDate,
        birth_time: birthTime,
        birth_city: birthCity,
        birth_country: birthCountry || '대한민국',
      })
      .select().single()

    if (custErr) throw custErr

    const { data: consultation, error: consultErr } = await supabase
      .from('consultations')
      .insert({
        customer_id: customer?.id,
        customer_name: name,
        category,
        question: question || '',
        report_html: reportHtml,
        saju_data: { ...saju, calendarType, leapMonth },
      })
      .select().single()

    if (consultErr) throw consultErr

    console.log('✅ DB 저장 완료')

    return NextResponse.json({ success: true, consultationId: consultation?.id })

  } catch (error) {
    console.error('❌ 오류:', error)
    return NextResponse.json({ success: false, message: String(error) }, { status: 500 })
  }
}