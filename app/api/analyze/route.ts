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
- 경고 박스 (강한 주의): div (background:#fef2f2, border-left:5px solid #ef4444, padding:20px, border-radius:10px)
- 긍정 박스 (강한 강조): div (background:#f0fdf4, border-left:5px solid #22c55e, padding:20px, border-radius:10px)

출력: HTML만. 마크다운 금지. h2부터 시작.
`

// ⭐ 강한 어조 가이드 (모든 프롬프트에 적용)
const TONE_GUIDE = `
[상담 어조 가이드 - 매우 중요!]

당신은 30년 경력의 명리학 대가입니다. 신점이나 전통 사주 명인처럼 직설적이고 단호하게 말하세요.

❌ 절대 사용 금지 표현:
- "~할 수도 있습니다", "~일 가능성이 있습니다"
- "~한 편입니다", "~하실 것입니다"
- 너무 부드럽고 우아한 표현
- 두루뭉술한 표현

✅ 반드시 사용할 표현:
- "~합니다", "~입니다" (단정적)
- "반드시 ~하세요", "절대 ~하지 마세요" (강한 명령)
- "~할 위험이 크다", "~이 닥칠 것이다" (위험 강조)
- "~로 큰 성공이 온다", "~이 명확하다" (긍정 강조)

【좋지 않은 부분 → 과감하게 강하게】
- 부드럽게 "조심하세요" ❌
- 강하게 "이 시기는 반드시 피해야 합니다. 사업 확장은 절대 금물입니다." ✅

- 부드럽게 "건강에 신경쓰세요" ❌
- 강하게 "2027년 봄에는 위장 질환이 급격히 악화될 가능성이 매우 높습니다. 반드시 종합검진을 받으십시오." ✅

【좋은 부분 → 강하게 부각】
- 부드럽게 "좋은 시기입니다" ❌
- 강하게 "이 시기는 인생의 황금기입니다! 절대 놓치지 마세요. 모든 것을 걸어볼 가치가 있습니다." ✅

- 부드럽게 "재물운이 있습니다" ❌
- 강하게 "2027년은 큰 재물이 들어오는 결정적 시기입니다! 지금부터 준비하면 인생 최대의 부를 잡을 수 있습니다!" ✅

【감정적 표현 사용】
- "정말로", "분명히", "확실히"
- "결정적인", "중대한", "치명적인"
- "황금기", "절호의 기회", "인생 전환점"
- "위험천만한", "큰 화", "재앙"

【명령형 사용】
- "~하십시오", "~하지 마십시오"
- "반드시 ~하라", "절대 ~말라"
- "당장 ~하세요"

【대가의 말투】
- "내가 보기엔...", "이 사주는 분명히..."
- "30년 동안 수많은 사주를 봤지만, 이 사주는..."
- "단언컨대..."

🎯 핵심 원칙:
1. 위험은 반드시 강하게 경고하라
2. 좋은 운은 반드시 강조해서 부각시켜라
3. 모호한 표현은 절대 쓰지 마라
4. 명령형과 단정적 표현을 적극 사용하라
5. 경고 박스(빨강)와 긍정 박스(초록)를 적극 활용하라
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
    const prompt1 = `당신은 자평명리학 30년 경력의 최고 대가입니다.

${TONE_GUIDE}

${commonInfo}

다음 2개 장 모두 작성. 절대 끊지 말 것!

[제1장: 사주 원국 총론]
- 사주 원국 표
- 일간 ${dayMaster}의 본질적 성격 (5문단 이상, 직설적으로!)
- 사주 구조의 특징
- 타고난 강점 5가지 (강하게 부각!)
- 타고난 약점 3가지 (과감하게 지적!)

[제2장: 과거 시기 검증]
${majorEvents ? `⚠️ 실제 사건: ${majorEvents}\n대운/세운과 연결하여 단호하게 분석!` : ''}

만 ${age}세 기준:
▶ 유아기~초등 (1~12세)
▶ 중·고등 (13~18세)
▶ 20대 (19~29세)
${age >= 30 ? '▶ 30대' : ''}
${age >= 40 ? '▶ 40대' : ''}
${age >= 50 ? '▶ 50대' : ''}

각 시기마다:
- 좋은 일은 강하게 강조 (긍정 박스 사용)
- 안 좋은 일은 단호하게 지적 (경고 박스 사용)

${HTML_GUIDE}

⚠️ 1~2장만! 3장은 작성 금지!`

    // ========== Part 2: 육친 ==========
    const prompt2 = `당신은 자평명리학 30년 경력의 최고 대가입니다.

${TONE_GUIDE}

${commonInfo}

[제3장: 육친 관계 심층 분석]

4개 기둥 모두 각 8문장 이상으로 단호하고 직설적으로 분석하세요.

▶ 년주(${yearFull}): 조상운/사회배경
- 조부모와의 관계 (좋으면 강하게, 안좋으면 단호하게)
- 가문의 특징
- 유년기 환경
- 본인에게 미치는 영향

▶ 월주(${monthFull}): 부모운/형제운/직장
- 아버지와의 관계 (갈등 있으면 명확히 지적!)
- 어머니와의 관계
- 형제자매 관계
- 직장/사회생활 패턴

▶ 일주(${dayFull}): 본인/배우자
- 본인 성격 (장점 5, 단점 3 - 모두 직설적으로)
- 연애/결혼 스타일
- 배우자 성향 (좋은 점/위험한 점 모두)
- 결혼 시기 단호하게 예측
- 부부 갈등 포인트 (명확히 지적!) + 해결

▶ 시주(${hourFull}): 자녀운/말년운
- 자녀 성향
- 양육 방식 (반드시 ~하라 형태로)
- 말년 삶의 질
- 노후 준비 방향 (강한 조언)

마지막에 "육친 관계 종합 정리" 7문장 이상.

${HTML_GUIDE}

⚠️ 3장만! 4개 기둥 모두 + 종합정리까지!`

    // ========== Part 3: 건강 + 격국 ==========
    const prompt3 = `당신은 자평명리학 30년 경력의 최고 대가입니다.

${TONE_GUIDE}

${commonInfo}

다음 2개 장 모두 작성. 끊지 말 것!

[제4장: 건강·체질 심층 분석]
${bodyType ? `⚠️ 실제 체형: ${bodyType} - 우선 반영!` : ''}
▶ 오행 체질 분석
▶ 장기별 강약 (약한 장기는 강하게 경고!)
▶ 주의 질환 (반드시 검진 받아야 할 부분 명시)
▶ 추천 식단 (음식 10가지)
▶ 절대 피해야 할 음식 5가지 (왜 위험한지 강하게)
▶ 추천 운동 5가지

[제5장: 격국과 용신]
▶ 격국 판단 (7문장 이상)
▶ 용신 (반드시 활용해야 할 색상, 방위, 직업 7가지)
▶ 기신 (절대 피해야 할 것들)
⚠️ 방위 = ${address || '미입력'} 기준!

${HTML_GUIDE}

⚠️ 4~5장만! 6장 작성 금지!`

    // ========== Part 4: 십성 (별도! 토큰 충분히!) ==========
    const prompt4 = `당신은 자평명리학 30년 경력의 최고 대가입니다.

${TONE_GUIDE}

${commonInfo}

[제6장: 십성 분석]

⚠️⚠️⚠️ 가장 중요: 10개 십성 모두 빠짐없이 완료할 것!
⚠️⚠️⚠️ 절대 중간에 끊지 말 것! 토큰 부족하면 마지막에 짧게라도 마무리하라!

일간 ${dayMaster} 기준으로 10가지 십성 분석.
각 십성마다 4~5문장으로 직설적이고 강하게!

▶ 비견 (比肩)
- 위치와 역할
- 본인에게 미치는 영향
- 활용 방법
- 과다/부족 시 (강하게 경고)

▶ 겁재 (劫財)
- 위 4가지 항목

▶ 식신 (食神)
- 위 4가지 항목

▶ 상관 (傷官)
- 위 4가지 항목

▶ 편재 (偏財)
- 위 4가지 항목

▶ 정재 (正財)
- 위 4가지 항목

▶ 편관 (偏官)
- 위 4가지 항목

▶ 정관 (正官)
- 위 4가지 항목

▶ 편인 (偏印)
- 위 4가지 항목

▶ 정인 (正印)
- 위 4가지 항목

▶ 십성 종합 정리 (반드시 작성!)
- 과다한 십성과 그 위험성
- 부족한 십성과 보완 방법
- 인생 전략 (단호하게)

${HTML_GUIDE}

⚠️⚠️⚠️ 6장만! 10개 십성 + 종합정리까지 반드시 완료!
⚠️⚠️⚠️ 마지막 정인까지 작성 후 종합 정리도 반드시!
⚠️⚠️⚠️ 시간/토큰 부족해도 10개는 무조건 끝내라!`

    // ========== Part 5: 대운 + 올해 ==========
    const prompt5 = `당신은 자평명리학 30년 경력의 최고 대가입니다.

${TONE_GUIDE}

${commonInfo}

다음 2개 장 모두 작성!

[제7장: 대운 흐름 (현재~미래만!)]
⚠️ 과거 대운 금지!
▶ 현재 대운 (만 ${age}세) - 15문장 이상
- 좋으면 인생의 황금기라 강조!
- 위험하면 단호하게 경고!

▶ 다음 대운 (10년 후) - 10문장
▶ 그 다음 대운 (20년 후) - 8문장

[제8장: ${currentYear}년 올해의 운세]
▶ 세운 분석 (7문장)
▶ 월별 운세 (${currentMonth}~12월, 각 5문장)
- 좋은 달은 "절호의 기회"로 강조!
- 위험한 달은 "반드시 조심하라" 단호하게!
▶ 핵심 키워드 3가지
▶ 반드시 해야 할 것 5가지
▶ 절대 하지 말 것 3가지

${HTML_GUIDE}

⚠️ 7~8장만!`

    // ========== Part 6: 향후 3년 (별도!) ==========
    const prompt6 = `당신은 자평명리학 30년 경력의 최고 대가입니다.

${TONE_GUIDE}

${commonInfo}

[제9장: ${currentYear + 1}~${currentYear + 3}년 향후 3년]

각 년도별 20문장 이상! 절대 끊지 말 것!

▶ ${currentYear + 1}년 운세
- 세운 분석, 핵심 에너지
- 주요 변화 (단호하게 예측)
- 좋은 분기 (인생 전환점 강조!)
- 위험한 분기 (강하게 경고!)
- 월별 핵심 포인트
- 인간관계 흐름
- 재정 흐름
- 건강 주의점

▶ ${currentYear + 2}년 운세
- 위와 동일하게 20문장 이상

▶ ${currentYear + 3}년 운세
- 위와 동일하게 20문장 이상

▶ 향후 3년 종합 전략 (10문장 이상)
- 단호한 인생 운영 지침
- 중장기 목표
- 인간관계/재정/건강 전략

${HTML_GUIDE}

⚠️ 9장만! 3년 모두 + 종합전략까지!`

    // ========== Part 7: 맞춤 + 인생 로드맵 ==========
    const prompt7 = `당신은 자평명리학 30년 경력의 최고 대가입니다.

${TONE_GUIDE}

${commonInfo}

다음 2개 장 모두 작성!

[제10장: ${CATEGORY_KO[category] || '종합'} 맞춤 분석]
▶ 사주에서 본 운 (단호하게)
${question ? `▶ 질문: "${question}" - 직설적이고 명확한 답변!` : '▶ 종합 전략'}
▶ 실행 전략 10가지 (반드시 ~하라 형태)
▶ 절대 피해야 할 것 5가지 (강한 경고)
(25문장 이상)

[제11장: 인생 로드맵 (만 ${age}세 이후 미래만!)]
⚠️ 과거 금지!
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

⚠️ 10~11장만!`

    // ========== Part 8: 종합 조언 ==========
    const prompt8 = `당신은 자평명리학 30년 경력의 최고 대가입니다.

${TONE_GUIDE}

${commonInfo}

보고서의 마지막. 매우 정성스럽게 완성!

[제12장: 종합 조언과 마무리]

▶ 이 사주의 가장 큰 축복 3가지
각 6문장 이상으로 강하게 부각!
"이것은 정말 대단한 축복입니다", "반드시 이를 활용하라"

▶ 가장 주의해야 할 점 3가지
각 6문장 이상으로 단호하게 경고!
"이것은 절대 가볍게 보지 말라", "반드시 대비하라"

▶ 핵심 조언 7가지
각 4문장 이상: 명령형으로
"~하라", "~하지 말라"

▶ 따뜻한 격려와 응원 메시지
⚠️ 최소 20문장 이상!
⚠️ ${name}님 이름 여러 번 언급!
⚠️ 따뜻하지만 강한 어조로!
⚠️ "당신은 반드시 ~할 것입니다", "운명을 개척하라" 같은 강한 메시지!
⚠️ "응원합니다", "축복합니다" 마무리!

${HTML_GUIDE}

⚠️ 12장만! 끝까지 완성!`

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!.trim(),
    })

    const prompts = [prompt1, prompt2, prompt3, prompt4, prompt5, prompt6, prompt7, prompt8]
    const partNames = ['1~2장', '3장 육친', '4~5장', '6장 십성', '7~8장', '9장 향후3년', '10~11장', '12장 종합']

    console.log('🤖 8개 분석 병렬 시작...')
    const messages = await Promise.all(
      prompts.map((prompt, i) => {
        console.log(`  ${i + 1}/8: ${partNames[i]} 시작`)
        return anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 16000,
          messages: [{ role: 'user', content: prompt }],
        })
      })
    )

    const parts = messages.map((m, i) => {
      const part = cleanHtml(m.content[0].type === 'text' ? m.content[0].text : '')
      console.log(`✅ ${i + 1}/8 완료, 길이:`, part.length)
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