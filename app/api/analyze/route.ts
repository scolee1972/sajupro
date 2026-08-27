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

// ⭐ 기존의 품격 있고 완성도 높은 어조 유지
const TONE_GUIDE = `
[상담 어조 가이드]
당신은 자평명리학 30년 경력의 최고 전문 상담사입니다.
전문가로서의 품격과 깊이를 유지하되, 내담자를 위한 명확하고 실질적인 조언을 제공하세요.
모호한 표현("~할 수도 있습니다")을 지양하고, 확신에 찬 어조("~합니다", "~하시기 바랍니다")를 사용하세요.
`

// ⭐ 글꼴 깨짐 방지를 위해 모든 태그에 font-family 명시적 강제 부여
const HTML_GUIDE = `
HTML 형식 가이드 (반드시 준수할 것):
- 큰제목: <h2 style="color:#1a2744; border-bottom:2px solid #c9a84c; padding-bottom:10px; margin-top:40px; font-size:22px; font-family:sans-serif; font-weight:bold;">제목</h2>
- 소제목: <h3 style="color:#1a2744; border-left:4px solid #c9a84c; padding-left:12px; margin-top:24px; font-size:17px; font-family:sans-serif; font-weight:bold;">제목</h3>
- 단락: <p style="line-height:1.9; margin-bottom:16px; color:#2d2d2d; font-size:15px; font-family:sans-serif;">내용</p>
- 강조: <strong style="color:#c9a84c;">내용</strong>
- 일반 박스: <div style="background:#faf8f3; border-left:4px solid #c9a84c; padding:18px; border-radius:8px; margin-bottom:16px; font-family:sans-serif; line-height:1.8; font-size:15px; color:#2d2d2d;">내용</div>
- 긍정 박스: <div style="background:#f0f7f4; border-left:4px solid #5b8a72; padding:18px; border-radius:8px; margin-bottom:16px; font-family:sans-serif; line-height:1.8; font-size:15px; color:#2d2d2d;">내용</div>
- 주의 박스: <div style="background:#fdf5f1; border-left:4px solid #b8714a; padding:18px; border-radius:8px; margin-bottom:16px; font-family:sans-serif; line-height:1.8; font-size:15px; color:#2d2d2d;">내용</div>
- 목록: <ul style="line-height:1.9; font-family:sans-serif; font-size:15px; color:#2d2d2d; margin-bottom:16px;"><li style="margin-bottom:8px;">항목</li></ul>

출력 규칙:
- HTML만 출력하세요. 마크다운(\`\`\`) 절대 금지.
- 모든 텍스트는 반드시 위에서 제공한 <p>, <div>, <ul> 등의 태그 안에 넣어서 글꼴이 변하지 않도록 하세요.
- 바로 <h2> 태그부터 시작하세요.
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
[검증 및 참고 정보]
${familyInfo ? `- 가족: ${familyInfo}` : ''}
${marriageDate ? `- 결혼일: ${marriageDate}` : ''}
${divorceDate ? `- 이혼/사별일: ${divorceDate}` : ''}
${spouseBirth ? `- 배우자: ${spouseBirth}` : ''}
${childrenInfo ? `- 자녀: ${childrenInfo}` : ''}
${majorEvents ? `- 주요 사건:\n${majorEvents}${durationInfo}` : ''}
[거주지] ${address || '미입력'} (이사/방위 추천 시 기준점)
[건강/체형] ${bodyType ? `체형: ${bodyType}` : ''} / ${healthStatus || '특이사항 없음'}
`.trim()

    const commonInfo = `
[고객 프로필]
- 이름: ${name} (${gender === 'male' ? '남성' : '여성'}, 만 ${age}세, ${birthYear}년생)
- 생년월일: ${birthDate} (${calendarLabel})
- 출생시각: ${birthTime}
- 출생지: ${birthCity}${birthCountry && birthCountry !== '대한민국' ? ` (${birthCountry})` : ''}

[상담 환경]
- 상담일(오늘): ${todayStr} (현재 ${currentYear}년 ${currentMonth}월입니다)
- 상담분야: ${CATEGORY_KO[category] || '종합'}
- 질문: ${question || '없음'}

${verificationInfo}

[사주 원국]
${sajuText}
⭐ 일간(본인) = ${dayMaster}
`

    const prompt1 = `당신은 자평명리학 30년 경력의 최고 전문 상담사입니다.
${TONE_GUIDE}
${commonInfo}

[제1장: 사주 원국 총론]
- 일간 ${dayMaster}의 본질적 성격과 기질 (5문단 이상)
- 사주의 전체적인 구조와 특징
- 타고난 강점 5가지 및 보완점 3가지

[제2장: 과거 시기 검증]
${majorEvents ? `⚠️ 실제 사건: ${majorEvents}\n이 사건들을 대운/세운과 연결하여 해석하세요.` : ''}
만 ${age}세 기준, 과거에 겪었을 일들을 분석하세요:
▶ 유아기~초등 (1~12세)
▶ 중·고등 (13~18세)
▶ 20대 (19~29세)
${age >= 30 ? '▶ 30대' : ''}
${age >= 40 ? '▶ 40대' : ''}
${age >= 50 ? '▶ 50대' : ''}

${HTML_GUIDE}
⚠️ 1~2장만 작성하세요.`

    const prompt2 = `당신은 자평명리학 30년 경력의 최고 전문 상담사입니다.
${TONE_GUIDE}
${commonInfo}

[제3장: 육친 관계 심층 분석]
각 기둥별 인간관계를 상세히(각 8문장 이상) 분석하세요.
▶ 년주(${yearFull}): 조상운/사회배경 (조부모, 유년기 환경)
▶ 월주(${monthFull}): 부모운/형제운/직장 (부모님과의 관계, 직장 패턴)
▶ 일주(${dayFull}): 본인/배우자 (연애 스타일, 배우자 성향, 부부 관계)
▶ 시주(${hourFull}): 자녀운/말년운 (자녀 성향, 노후 삶)

마지막에 "육친 관계 종합 정리" 7문장 이상.

${HTML_GUIDE}
⚠️ 3장만 작성하세요.`

    const prompt3 = `당신은 자평명리학 30년 경력의 최고 전문 상담사입니다.
${TONE_GUIDE}
${commonInfo}

[제4장: 건강·체질 심층 분석]
${bodyType ? `⚠️ 실제 체형(${bodyType})을 바탕으로 분석하세요.` : ''}
▶ 오행 체질 분석 및 장기별 강약
▶ 추천 식단 (음식 10가지, 피해야 할 음식 5가지)
▶ 추천 운동 5가지

[제5장: 격국과 용신]
▶ 격국 판단 (7문장 이상)
▶ 용신 (색상, 방위, 직업 7가지 추천)
▶ 기신 (피해야 할 것들)

${HTML_GUIDE}
⚠️ 4~5장만 작성하세요.`

    const prompt4 = `당신은 자평명리학 30년 경력의 최고 전문 상담사입니다.
${TONE_GUIDE}
${commonInfo}

[제6장: 십성 분석]
10가지 십성의 득실을 분석하세요 (각 4문장 이상).
비견, 겁재, 식신, 상관, 편재, 정재, 편관, 정관, 편인, 정인
마지막에 십성 종합 정리(7문장 이상)를 반드시 작성하세요.

${HTML_GUIDE}
⚠️ 6장만 작성하세요. 10개 십성을 빠짐없이 완료하세요.`

    const prompt5 = `당신은 자평명리학 30년 경력의 최고 전문 상담사입니다.
${TONE_GUIDE}
${commonInfo}

[제7장: 대운 흐름 (현재~미래)]
▶ 현재 대운 (만 ${age}세) - 15문장 이상
▶ 다음 대운 (10년 후) - 10문장 이상
▶ 그 다음 대운 (20년 후) - 8문장 이상

[제8장: ${currentYear}년 올해의 운세]
⚠️ 중요: 현재는 ${currentYear}년 ${currentMonth}월입니다!
⚠️ 이미 지나간 1월부터 ${currentMonth - 1}월까지는 과거이므로 절대 "이때 ~하세요"라고 미래처럼 조언하지 마세요.
⚠️ 오직 ${currentMonth}월부터 12월까지만 예측하고 조언하세요!

▶ 세운 분석: 올해의 흐름 (7문장 이상)
▶ 월별 운세: ${currentMonth}월부터 12월까지 각 월별 분석
▶ 올해 반드시 해야 할 것 5가지
▶ 올해 절대 하지 말아야 할 것 3가지

${HTML_GUIDE}
⚠️ 7~8장만 작성하세요.`

    const prompt6 = `당신은 자평명리학 30년 경력의 최고 전문 상담사입니다.
${TONE_GUIDE}
${commonInfo}

[제9장: ${currentYear + 1}~${currentYear + 3}년 향후 3년 흐름]
각 연도별로 상세히(각 20문장 이상) 예측하세요.

▶ ${currentYear + 1}년 운세
▶ ${currentYear + 2}년 운세
▶ ${currentYear + 3}년 운세
▶ 3년 종합 생존/도약 전략 (10문장 이상)

${HTML_GUIDE}
⚠️ 9장만 작성하세요.`

    const prompt7 = `당신은 자평명리학 30년 경력의 최고 전문 상담사입니다.
${TONE_GUIDE}
${commonInfo}

[제10장: ${CATEGORY_KO[category] || '종합'} 분야 맞춤 심층 분석]
${question ? `⚠️ 내담자의 질문: "${question}"\n이 질문에 대해 모호하게 답하지 말고 명확한 해법을 제시하세요.` : '▶ 이 분야에 대한 종합 전략'}
▶ 실행 전략 10가지
▶ 주의사항 5가지

[제11장: 인생 로드맵 (만 ${age}세 이후 미래만!)]
⚠️ 현재 나이 이후의 미래만 작성하세요.
${age < 40 ? '▶ 현재~40대 ▶ 40~50대 ▶ 50~60대 ▶ 60대 이후' : 
  age < 50 ? '▶ 현재~50대 ▶ 50~60대 ▶ 60~70대 ▶ 70대 이후' : 
  age < 60 ? '▶ 현재~60대 ▶ 60~70대 ▶ 70~80대 ▶ 80대 이후' : 
  '▶ 현재~70대 ▶ 70~80대 ▶ 80대 이후'}
각 시기별 핵심 과제 명시.

${HTML_GUIDE}
⚠️ 10~11장만 작성하세요.`

    const prompt8 = `당신은 자평명리학 30년 경력의 최고 전문 상담사입니다.
${TONE_GUIDE}
${commonInfo}

[제12장: 종합 조언과 마무리]
▶ 인생의 가장 큰 축복 3가지 (반드시 쟁취할 것)
▶ 가장 주의해야 할 점 3가지 (피해야 할 것)
▶ 지금 당장 실천해야 할 7가지 행동 강령
▶ 따뜻한 격려와 응원 메시지 (최소 20문장 이상, ${name}님의 이름을 부르며 따뜻하게 마무리하세요)

${HTML_GUIDE}
⚠️ 12장만 작성하세요. 절대 중간에 끊기지 않게 끝까지 완성하세요.`

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!.trim(),
    })

    const prompts = [prompt1, prompt2, prompt3, prompt4, prompt5, prompt6, prompt7, prompt8]
    const partNames = ['1~2장', '3장 육친', '4~5장', '6장 십성', '7~8장(올해운세)', '9장 향후3년', '10~11장', '12장 종합']

    console.log('🤖 8개 병렬 호출 시작...')
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

    // ⭐ 핵심 수정: status를 'completed'로, progress를 100으로 저장하여 멈춤 방지!
    const { data: consultation, error: consultErr } = await supabase
      .from('consultations')
      .insert({
        customer_id: customer?.id,
        customer_name: name,
        category,
        question: question || '',
        report_html: reportHtml,
        saju_data: { ...saju, calendarType, leapMonth },
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