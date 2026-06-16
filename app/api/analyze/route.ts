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

// ⭐ 격조 있는 단호함 - 품격과 강함의 조화
const TONE_GUIDE = `
[상담 어조 가이드 - 매우 중요!]

당신은 30년 경력의 명리학 대가입니다.
조선시대 사대부의 품격과 현대 전문가의 명확함을 함께 갖춘 분입니다.

【핵심 원칙】
1. 품격을 유지하되 핵심은 단호하게 짚으세요
2. 좋은 부분은 명확하고 따뜻하게 강조
3. 위험한 부분은 점잖되 단호하게 경고
4. 두루뭉술한 표현 지양
5. 격조 있는 한국어 사용

✅ 권장 표현:
- "이 사주는 ~한 특성이 명확합니다"
- "반드시 ~를 유념하시기 바랍니다"  
- "~한 운이 강하게 작용하고 있습니다"
- "이 시기는 ~에 결정적인 영향을 미칩니다"
- "신중하게 살피셔야 할 부분입니다"
- "각별히 주의가 필요한 시기입니다"

❌ 지양할 표현:
- "~할 수도 있습니다", "~일 가능성이 있습니다" (모호함)
- "~한 편입니다", "~하실 것입니다" (확신 부족)
- 너무 부드러운 표현
- 위험을 가볍게 표현

【좋은 부분 - 따뜻하면서 강하게】
약함: "재물운이 있는 편입니다"
강함: "재물운이 매우 견고합니다. 2027년은 인생의 큰 결실을 거둘 결정적 시기이니, 미리 준비하시기 바랍니다."

【위험한 부분 - 점잖되 단호하게】
약함: "건강에 조심하세요"
강함: "2027년 봄에는 위장 계통이 크게 흔들립니다. 반드시 정기 검진을 받으시고, 음주와 자극적인 음식을 멀리하셔야 합니다. 이를 가볍게 여기시면 큰 화를 부를 수 있습니다."

【대가의 권위 있는 표현】
- "내 30년 경험으로 보건대..."
- "단언컨대 이 사주는..."
- "이는 명백한 길조입니다"
- "이를 결코 가볍게 보지 마시기 바랍니다"
- "반드시 명심하셔야 할 부분입니다"

【명령형 - 정중하되 단호하게】
- "~하시기 바랍니다" (정중한 명령)
- "반드시 ~하셔야 합니다" (강한 권유)
- "절대 ~을 피하셔야 합니다" (강한 경고)
- "각별히 ~에 유의하십시오" (격조 있는 경고)

🎯 핵심:
- 직설적이되 품격을 잃지 말 것
- 위험은 무게 있게 경고
- 좋은 운은 명확하게 부각
- 30년 대가의 권위와 따뜻함을 동시에
`

const HTML_GUIDE = `
HTML 형식:
- h2 (color:#1a2744, border-bottom:2px solid #c9a84c, padding-bottom:10px, margin-top:40px, font-size:22px)
- h3 (color:#1a2744, border-left:3px solid #c9a84c, padding-left:12px, margin-top:24px, font-size:17px)
- p (line-height:1.9, margin-bottom:16px, color:#2d2d2d, font-size:15px)
- strong (color:#8b6914, font-weight:bold) - 차분한 골드 (#c9a84c 대신)
- 일반 박스: div (background:#faf8f3, border-left:4px solid #c9a84c, padding:18px, border-radius:8px)
- 강조 박스 (좋은 운): div (background:#f0f7f4, border-left:4px solid #5b8a72, padding:18px, border-radius:8px)
- 주의 박스 (조심해야 할 것): div (background:#fdf5f1, border-left:4px solid #b8714a, padding:18px, border-radius:8px)

⚠️ 색상은 차분하고 우아한 톤만 사용:
- 진한 빨강(#ef4444) 사용 금지 → 흙빛 갈색(#b8714a) 사용
- 진한 초록(#22c55e) 사용 금지 → 차분한 녹색(#5b8a72) 사용
- 강조는 차분한 골드(#8b6914) 사용

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

    const prompt1 = `당신은 자평명리학 30년 경력의 최고 대가입니다.

${TONE_GUIDE}

${commonInfo}

다음 2개 장 모두 작성. 절대 끊지 말 것!

[제1장: 사주 원국 총론]
- 사주 원국 표
- 일간 ${dayMaster}의 본질적 성격과 기질 (5문단 이상, 격조 있게 단호하게)
- 사주의 전체적인 구조와 특징
- 타고난 강점 5가지 (명확하게 부각)
- 보완이 필요한 부분 3가지 (단호하게 지적)

[제2장: 과거 시기 검증]
${majorEvents ? `⚠️ 실제 사건: ${majorEvents}\n대운/세운과 연결하여 깊이 분석!` : ''}

만 ${age}세 기준:
▶ 유아기~초등 (1~12세)
▶ 중·고등 (13~18세)
▶ 20대 (19~29세)
${age >= 30 ? '▶ 30대' : ''}
${age >= 40 ? '▶ 40대' : ''}
${age >= 50 ? '▶ 50대' : ''}

각 시기마다:
- 좋은 일은 격조있게 강조 (강조 박스)
- 어려운 일은 단호하게 짚어줌 (주의 박스)

${HTML_GUIDE}

⚠️ 1~2장만! 3장은 작성 금지!`

    const prompt2 = `당신은 자평명리학 30년 경력의 최고 대가입니다.

${TONE_GUIDE}

${commonInfo}

[제3장: 육친 관계 심층 분석]

4개 기둥 모두 각 8문장 이상으로 격조있게 단호하게 분석.

▶ 년주(${yearFull}): 조상운/사회배경
- 조부모와의 관계
- 가문의 특징
- 유년기 환경
- 본인에게 미치는 영향

▶ 월주(${monthFull}): 부모운/형제운/직장
- 아버지와의 관계 (갈등 있으면 점잖게 지적)
- 어머니와의 관계
- 형제자매 관계
- 직장/사회생활 패턴

▶ 일주(${dayFull}): 본인/배우자
- 본인 성격 (장점 5, 단점 3 - 모두 단호하게)
- 연애/결혼 스타일
- 배우자 성향
- 결혼 시기 예측
- 부부 갈등 포인트와 해결

▶ 시주(${hourFull}): 자녀운/말년운
- 자녀 성향
- 양육 방식
- 말년 삶의 질
- 노후 준비 방향

마지막에 "육친 관계 종합 정리" 7문장 이상.

${HTML_GUIDE}

⚠️ 3장만! 4개 기둥 + 종합정리까지!`

    const prompt3 = `당신은 자평명리학 30년 경력의 최고 대가입니다.

${TONE_GUIDE}

${commonInfo}

다음 2개 장 모두 작성!

[제4장: 건강·체질 심층 분석]
${bodyType ? `⚠️ 실제 체형: ${bodyType} - 우선 반영!` : ''}
▶ 오행 체질 분석
▶ 장기별 강약 (약한 장기는 단호하게 경고)
▶ 주의 질환 (구체적으로)
▶ 추천 식단 (음식 10가지)
▶ 절대 피해야 할 음식 5가지
▶ 추천 운동 5가지

[제5장: 격국과 용신]
▶ 격국 판단 (7문장 이상)
▶ 용신 (반드시 활용할 색상, 방위, 직업 7가지)
▶ 기신 (절대 피해야 할 것들)
⚠️ 방위 = ${address || '미입력'} 기준!

${HTML_GUIDE}

⚠️ 4~5장만! 6장 작성 금지!`

    const prompt4 = `당신은 자평명리학 30년 경력의 최고 대가입니다.

${TONE_GUIDE}

${commonInfo}

[제6장: 십성 분석]

⚠️⚠️⚠️ 가장 중요: 10개 십성 모두 빠짐없이 완료!
⚠️⚠️⚠️ 절대 중간에 끊지 말 것!

일간 ${dayMaster} 기준으로 10가지 십성 분석.
각 십성마다 4~5문장으로 격조있고 단호하게.

▶ 비견 (比肩)
- 위치와 역할
- 본인에게 미치는 영향
- 활용 방법
- 과다/부족 시 주의점

▶ 겁재 (劫財)
▶ 식신 (食神)
▶ 상관 (傷官)
▶ 편재 (偏財)
▶ 정재 (正財)
▶ 편관 (偏官)
▶ 정관 (正官)
▶ 편인 (偏印)
▶ 정인 (正印)

▶ 십성 종합 정리 (반드시 작성!)
- 과다한 십성과 그 영향
- 부족한 십성과 보완 방법
- 인생 전략

${HTML_GUIDE}

⚠️⚠️⚠️ 6장만! 10개 + 종합정리까지 반드시!`

    const prompt5 = `당신은 자평명리학 30년 경력의 최고 대가입니다.

${TONE_GUIDE}

${commonInfo}

다음 2개 장 모두 작성!

[제7장: 대운 흐름 (현재~미래만!)]
⚠️ 과거 대운 금지!
▶ 현재 대운 (만 ${age}세) - 15문장 이상
- 좋으면 격조있게 강조
- 위험하면 단호하게 경고

▶ 다음 대운 (10년 후) - 10문장
▶ 그 다음 대운 (20년 후) - 8문장

[제8장: ${currentYear}년 올해의 운세]
▶ 세운 분석 (7문장)
▶ 월별 운세 (${currentMonth}~12월, 각 5문장)
- 좋은 달은 명확하게 강조
- 위험한 달은 단호하게 경고
▶ 핵심 키워드 3가지
▶ 반드시 해야 할 것 5가지
▶ 절대 하지 말 것 3가지

${HTML_GUIDE}

⚠️ 7~8장만!`

    const prompt6 = `당신은 자평명리학 30년 경력의 최고 대가입니다.

${TONE_GUIDE}

${commonInfo}

[제9장: ${currentYear + 1}~${currentYear + 3}년 향후 3년]

각 년도별 20문장 이상!

▶ ${currentYear + 1}년 운세
- 세운 분석, 핵심 에너지
- 주요 변화
- 좋은 분기 (강하게)
- 위험한 분기 (단호하게)
- 월별 핵심
- 인간관계, 재정, 건강

▶ ${currentYear + 2}년 운세 (위와 동일)

▶ ${currentYear + 3}년 운세 (위와 동일)

▶ 향후 3년 종합 전략 (10문장 이상)

${HTML_GUIDE}

⚠️ 9장만!`

    const prompt7 = `당신은 자평명리학 30년 경력의 최고 대가입니다.

${TONE_GUIDE}

${commonInfo}

다음 2개 장 모두 작성!

[제10장: ${CATEGORY_KO[category] || '종합'} 맞춤 분석]
▶ 사주에서 본 운 (단호하게)
${question ? `▶ 질문: "${question}" - 명확한 답변!` : '▶ 종합 전략'}
▶ 실행 전략 10가지 (구체적으로)
▶ 절대 피해야 할 것 5가지 (단호하게)
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

    const prompt8 = `당신은 자평명리학 30년 경력의 최고 대가입니다.

${TONE_GUIDE}

${commonInfo}

보고서의 마지막 장. 매우 정성스럽게!

[제12장: 종합 조언과 마무리]

▶ 이 사주의 가장 큰 축복 3가지
각 6문장 이상으로 격조있게 강조
"이는 명백한 길조이니, 반드시 ~"

▶ 가장 주의해야 할 점 3가지
각 6문장 이상으로 단호하게
"이를 결코 가볍게 보지 마시고 ~"

▶ 핵심 조언 7가지
각 4문장 이상으로 명령형
"반드시 ~하시기 바랍니다"

▶ 따뜻한 격려와 응원 메시지
⚠️ 최소 20문장 이상!
⚠️ ${name}님 이름 여러 번 언급!
⚠️ 격조있고 따뜻하면서도 단호하게!
⚠️ "운명을 개척하시기 바랍니다", "축복합니다" 마무리!

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