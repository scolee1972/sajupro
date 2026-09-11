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

const TONE_GUIDE = `
[상담 어조 가이드]
당신은 30년 경력의 명리학 대가입니다.
조선시대 사대부의 품격과 현대 전문가의 단호함을 함께 갖춘 분입니다.

✅ 권장 표현: "~한 특성이 명확합니다", "반드시 ~를 유념하시기 바랍니다", "각별히 ~에 유의하십시오"
❌ 지양 표현: "~할 수도 있습니다", "~일 가능성이 있습니다", 너무 부드러운 표현
⚠️ "제 30년 경력으로...", "단언컨대..." 와 같은 표현은 전체에서 1회만 사용하세요!
`

const HTML_GUIDE = `
HTML 형식:
- h2 (color:#1a2744, border-bottom:2px solid #c9a84c, padding-bottom:10px, margin-top:40px, font-size:22px)
- h3 (color:#1a2744, border-left:3px solid #c9a84c, padding-left:12px, margin-top:24px, font-size:17px)
- p (line-height:1.9, margin-bottom:16px, color:#2d2d2d, font-size:15px)
- strong (color:#8b6914)
- 일반 박스: div (background:#faf8f3, border-left:4px solid #c9a84c, padding:18px, border-radius:8px)
- 강조 박스: div (background:#f0f7f4, border-left:4px solid #5b8a72, padding:18px, border-radius:8px)
- 주의 박스: div (background:#fdf5f1, border-left:4px solid #b8714a, padding:18px, border-radius:8px)

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

    const today = new Date()
    const todayStr = today.toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    })
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() + 1
    const birthYear = parseInt(birthDate.split('-')[0])
    const age = currentYear - birthYear

    const calendarLabel = calendarType === 'lunar' ? '음력' + (leapMonth ? ' (윤달)' : '') : '양력'
    const dayMaster = saju.dayMaster

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
${majorEvents ? `- 주요 사건:\n${majorEvents}${durationInfo}` : ''}
[거주지] ${address || '미입력'} (방위 기준)
[건강] ${bodyType ? `체형: ${bodyType}` : ''} ${healthStatus || ''}
`.trim()

    const commonInfo = `
[고객] ${name} / ${gender === 'male' ? '남' : '여'} / 만 ${age}세 (${birthYear}년생)
[생일] ${birthDate} (${calendarLabel}) ${birthTime}
[출생지] ${birthCity}${birthCountry && birthCountry !== '대한민국' ? ` (${birthCountry})` : ''}
[거주지] ${address || '미입력'}
[상담일] ${todayStr} / 현재 ${currentYear}년 ${currentMonth}월
[상담분야] ${CATEGORY_KO[category] || '종합'}
[질문] ${question || '없음'}

${verificationInfo}

${sajuText}
⭐ 일간 = ${dayMaster}
`

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!.trim(),
    })

    // ============================================================================
    // ⭐ STEP 1: 마스터 플래너 (모든 장에서 일관되게 사용할 절대 기준 마련)
    // ============================================================================
    console.log('🎯 1단계: 마스터 플래너 지침 도출 시작...')
    
    const masterPrompt = `당신은 사주 명리학 대가입니다.
아래 고객의 사주와 '질문'을 분석하여, 앞으로 작성될 모든 상담 보고서의 뼈대가 될 '핵심 지침'을 결정하세요.

${commonInfo}

반드시 JSON 형식으로만 아래 양식에 맞춰 출력하세요. 다른 설명은 금지합니다.

{
  "용신": "오행 1개",
  "희신": "오행 1개",
  "기신": "오행 1개",
  "최적의_연도": "질문 해결이나 운이 가장 크게 트이는 특정 연도 1~2개 (예: 2026년, 2027년)",
  "최적의_월": "위 연도 중 가장 좋은 구체적인 달 (예: 9~10월)",
  "절대_피해야할_연도": "가장 흉한 연도",
  "길한_방위": "현재 거주지(${address || '미입력'}) 기준 가장 좋은 방향 1~2개",
  "흉한_방위": "절대 가지 말아야 할 방향",
  "질문에_대한_명확한_결론": "고객의 질문에 대한 아주 명확하고 단호한 결론 (3문장 이내. 예: 사업은 2027년에 해라, 이사는 남쪽으로 가라 등. 1순위, 2순위 명시)"
}
`

    const masterMessage = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      messages: [{ role: 'user', content: masterPrompt }],
    })

    let masterData: any = {}
    try {
      const masterText = masterMessage.content[0].type === 'text' ? masterMessage.content[0].text : '{}'
      const jsonMatch = masterText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        masterData = JSON.parse(jsonMatch[0])
      }
      console.log('✅ 마스터 지침 도출 완료:', masterData)
    } catch (e) {
      console.error('마스터 지침 파싱 실패:', e)
    }

    // 모든 프롬프트에 강제로 주입할 절대 규칙
    const MASTER_GUIDELINE = `
【⭐⭐⭐ 모든 분석에 적용할 절대 일관성 지침 ⭐⭐⭐】
당신은 독립적으로 글을 쓰지만, 다른 장들과 내용이 충돌하면 안 됩니다.
반드시 아래의 '마스터 지침'을 100% 반영하여 글을 쓰세요! 임의로 시기나 방향을 바꾸지 마세요!

▶ 용신/희신/기신: ${masterData.용신} / ${masterData.희신} / ${masterData.기신}
▶ 최적의 연도: ${masterData.최적의_연도 || '내년'}
▶ 최적의 월: ${masterData.최적의_월 || '가을'}
▶ 피해야 할 연도: ${masterData.절대_피해야할_연도 || '미정'}
▶ 길한 방위: ${masterData.길한_방위 || '남쪽'}
▶ 흉한 방위: ${masterData.흉한_방위 || '북쪽'}
▶ 고객 질문에 대한 공식 결론: ${masterData.질문에_대한_명확한_결론 || '현재 흐름 유지'}

⚠️ 대운, 세운, 맞춤 분석 등 시기와 방향을 언급할 때 **반드시 위 정보와 일치**하게 서술하세요!
`

    // ============================================================================
    // ⭐ STEP 2: 8개 장 병렬 생성 (마스터 지침 포함)
    // ============================================================================
    const prompt1 = `당신은 자평명리학 30년 경력의 최고 대가입니다.
${TONE_GUIDE}
${MASTER_GUIDELINE}
${commonInfo}

[제1장: 사주 원국 총론]
- 사주 원국 표
- 일간 ${dayMaster}의 성격 (5문단 이상)
- 사주 구조와 특징, 강점 5가지, 보완점 3가지

[제2장: 과거 시기 검증]
${majorEvents ? `⚠️ 실제 사건: ${majorEvents}\n대운/세운과 연결!` : ''}
▶ 유아기~초등 ▶ 중·고등 ▶ 20대 ${age >= 30 ? '▶ 30대' : ''} ${age >= 40 ? '▶ 40대' : ''} ${age >= 50 ? '▶ 50대' : ''}

${HTML_GUIDE}
⚠️ 1~2장만 작성!`

    const prompt2 = `당신은 자평명리학 30년 경력의 최고 대가입니다.
${TONE_GUIDE}
${MASTER_GUIDELINE}
${commonInfo}

[제3장: 육친 관계 심층 분석]
각 기둥 8문장 이상.
▶ 년주(${yearFull}): 조상운/사회배경
▶ 월주(${monthFull}): 부모운/형제운/직장
▶ 일주(${dayFull}): 본인/배우자
▶ 시주(${hourFull}): 자녀운/말년운
마지막 종합 정리 7문장.

${HTML_GUIDE}
⚠️ 3장만 작성!`

    const prompt3 = `당신은 자평명리학 30년 경력의 최고 대가입니다.
${TONE_GUIDE}
${MASTER_GUIDELINE}
${commonInfo}

[제4장: 건강·체질 심층 분석]
${bodyType ? `⚠️ 실제 체형: ${bodyType}` : ''}
▶ 체질 분석, 장기 강약, 식단 10가지, 피할 음식 5가지, 운동 5가지

[제5장: 격국과 용신]
▶ 격국 판단 (7문장 이상)
▶ 용신 (색상, 방위, 직업 7가지)
▶ 기신
⚠️ 방위와 용신은 [절대 일관성 지침]의 내용을 반드시 따를 것!

${HTML_GUIDE}
⚠️ 4~5장만 작성!`

    const prompt4 = `당신은 자평명리학 30년 경력의 최고 대가입니다.
${TONE_GUIDE}
${MASTER_GUIDELINE}
${commonInfo}

[제6장: 십성 분석]
비견, 겁재, 식신, 상관, 편재, 정재, 편관, 정관, 편인, 정인
10가지 모두 분석 (각 4문장). 마지막에 십성 종합 정리.

${HTML_GUIDE}
⚠️ 6장만 작성! 10개 모두 완료!`

    const prompt5 = `당신은 자평명리학 30년 경력의 최고 대가입니다.
${TONE_GUIDE}
${MASTER_GUIDELINE}
${commonInfo}

[제7장: 대운 흐름 (현재~미래만!)]
▶ 현재 대운 (만 ${age}세) - 15문장 이상
▶ 다음 대운 (10년 후) - 10문장 이상
▶ 그 다음 대운 (20년 후) - 8문장 이상
⚠️ 대운 흐름을 평가할 때 [절대 일관성 지침]의 길흉 연도와 연결하여 설명할 것!

[제8장: ${currentYear}년 올해의 운세]
⚠️ 현재는 ${currentMonth}월입니다. 지나간 달은 미래처럼 쓰지 마세요.
▶ 세운 분석 (7문장)
▶ 월별 운세 (${currentMonth}월~12월, 각 5문장)
▶ 핵심 키워드 3가지, 해야 할 것 5가지, 하지 말 것 3가지

${HTML_GUIDE}
⚠️ 7~8장만 작성!`

    const prompt6 = `당신은 자평명리학 30년 경력의 최고 대가입니다.
${TONE_GUIDE}
${MASTER_GUIDELINE}
${commonInfo}

[제9장: ${currentYear + 1}~${currentYear + 3}년 향후 3년 흐름]
각 연도별 20문장 이상!
▶ ${currentYear + 1}년 운세
▶ ${currentYear + 2}년 운세
▶ ${currentYear + 3}년 운세
▶ 3년 종합 전략
⚠️ 특정 연도를 평가할 때 반드시 [절대 일관성 지침]의 '최적의 연도'와 '피해야 할 연도'를 기준으로 서술할 것!

${HTML_GUIDE}
⚠️ 9장만 작성!`

    const prompt7 = `당신은 자평명리학 30년 경력의 최고 대가입니다.
${TONE_GUIDE}
${MASTER_GUIDELINE}
${commonInfo}

[제10장: ${CATEGORY_KO[category] || '종합'} 분야 맞춤 심층 분석]
⚠️ 고객 질문: "${question}"
⚠️ [절대 일관성 지침]에 적힌 "고객 질문에 대한 공식 결론"을 바탕으로 25문장 이상 상세하게 살을 붙여 설명하세요! 
임의로 결론이나 시기를 바꾸면 절대 안 됩니다.

▶ 사주에서 본 운
▶ 핵심 답변 (지침 기반)
▶ 시기별 흐름
▶ 실행 전략 10가지
▶ 절대 피해야 할 것 5가지

[제11장: 인생 로드맵 (만 ${age}세 이후 미래만!)]
▶ 4개 시기로 나누어 작성 (현재~10년 뒤, 그 이후 순차적으로)

${HTML_GUIDE}
⚠️ 10~11장만 작성!`

    const prompt8 = `당신은 자평명리학 30년 경력의 최고 전문 상담사입니다.
${TONE_GUIDE}
${MASTER_GUIDELINE}
${commonInfo}

[제12장: 종합 조언과 마무리]
▶ 인생의 가장 큰 축복 3가지
▶ 가장 주의해야 할 점 3가지
▶ 지금 당장 실천해야 할 7가지 행동 강령
▶ 따뜻한 격려와 응원 메시지 (최소 20문장 이상, ${name}님의 이름을 부르며 따뜻하게 마무리하세요)

${HTML_GUIDE}
⚠️ 12장만 작성. 절대 끊기지 않게 끝까지 완성하세요.`

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!.trim(),
    })

    const prompts = [prompt1, prompt2, prompt3, prompt4, prompt5, prompt6, prompt7, prompt8]
    const partNames = ['1~2장', '3장 육친', '4~5장', '6장 십성', '7~8장(대운,올해)', '9장 향후3년', '10~11장(맞춤,로드맵)', '12장 종합']

    console.log('🤖 2단계: 8개 병렬 호출 시작...')
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

    const parts = messages.map((m) => {
      return cleanHtml(m.content[0].type === 'text' ? m.content[0].text : '')
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
        name, gender, phone, email: email || null, address: address || null,
        family_info: familyInfo || null, marriage_date: marriageDate || null,
        divorce_date: divorceDate || null, spouse_birth: spouseBirth || null,
        children_info: childrenInfo || null, major_events: majorEvents || null,
        body_type: bodyType || null, health_status: healthStatus || null,
        birth_date: birthDate, birth_time: birthTime, birth_city: birthCity,
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
        saju_data: { ...saju, calendarType, leapMonth, masterData }, // 마스터 데이터도 저장
        status: 'completed',
        progress: 100,
      })
      .select().single()

    if (consultErr) throw consultErr

    return NextResponse.json({ success: true, consultationId: consultation?.id })

  } catch (error) {
    console.error('❌ 오류:', error)
    return NextResponse.json({ success: false, message: String(error) }, { status: 500 })
  }
}