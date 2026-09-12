import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { getSajuText, calculateSaju } from '@/lib/saju'

export const maxDuration = 60

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

// ⭐ 코드 기반 명리학 알고리즘 (0초 완성)
function analyzeSajuMaster(saju: any) {
  const STEM_ELEMENT: Record<string, string> = {
    '갑': '목', '을': '목', '병': '화', '정': '화', '무': '토',
    '기': '토', '경': '금', '신': '금', '임': '수', '계': '수',
  }
  const BRANCH_ELEMENT: Record<string, string> = {
    '자': '수', '축': '토', '인': '목', '묘': '목', '진': '토', '사': '화',
    '오': '화', '미': '토', '신': '금', '유': '금', '술': '토', '해': '수',
  }

  const elements = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 }
  if (saju) {
    ;[saju.year, saju.month, saju.day, saju.hour].forEach((p: any) => {
      if (p?.stem && STEM_ELEMENT[p.stem]) elements[STEM_ELEMENT[p.stem] as keyof typeof elements]++
      if (p?.branch && BRANCH_ELEMENT[p.branch]) elements[BRANCH_ELEMENT[p.branch] as keyof typeof elements]++
    })
  }

  const dayElement = (saju?.dayMaster && STEM_ELEMENT[saju.dayMaster]) ? STEM_ELEMENT[saju.dayMaster] : '토'
  const sameCount = elements[dayElement as keyof typeof elements] || 0
  const supportElemMap: Record<string, string> = { '목': '수', '화': '목', '토': '화', '금': '토', '수': '금' }
  const supportElem = supportElemMap[dayElement] || '화'
  const supportCount = elements[supportElem as keyof typeof elements] || 0
  const totalSupport = sameCount + supportCount

  const isStrong = totalSupport >= 3

  let yongshin = '목'
  let heeshin = '화'
  let kishin = '토'
  let gushin = '금'

  if (isStrong) {
    if (dayElement === '목') { yongshin = '금'; heeshin = '토'; kishin = '수'; gushin = '목' }
    else if (dayElement === '화') { yongshin = '수'; heeshin = '금'; kishin = '목'; gushin = '화' }
    else if (dayElement === '토') { yongshin = '목'; heeshin = '수'; kishin = '화'; gushin = '토' }
    else if (dayElement === '금') { yongshin = '화'; heeshin = '목'; kishin = '토'; gushin = '금' }
    else { yongshin = '토'; heeshin = '화'; kishin = '금'; gushin = '수' }
  } else {
    if (dayElement === '목') { yongshin = '수'; heeshin = '목'; kishin = '금'; gushin = '토' }
    else if (dayElement === '화') { yongshin = '목'; heeshin = '화'; kishin = '수'; gushin = '금' }
    else if (dayElement === '토') { yongshin = '화'; heeshin = '토'; kishin = '목'; gushin = '수' }
    else if (dayElement === '금') { yongshin = '토'; heeshin = '금'; kishin = '화'; gushin = '목' }
    else { yongshin = '금'; heeshin = '수'; kishin = '토'; gushin = '화' }
  }

  const COLOR_MAP: Record<string, string> = {
    '목': '청록색, 녹색 계열',
    '화': '붉은색, 주황색, 분홍색 계열',
    '토': '황색, 갈색, 베이지 계열',
    '금': '흰색, 은색, 회색 계열',
    '수': '검정색, 남색, 파란색 계열',
  }
  const DIR_MAP: Record<string, string> = {
    '목': '동쪽, 동남쪽', '화': '남쪽, 남동쪽', '토': '중앙, 주변 인근지역', '금': '서쪽, 서북쪽', '수': '북쪽, 북서쪽',
  }
  const AVOID_DIR_MAP: Record<string, string> = {
    '목': '서쪽, 서북쪽', '화': '북쪽, 북서쪽', '토': '동쪽, 동북쪽', '금': '남쪽, 남동쪽', '수': '중앙',
  }
  const NUMBER_MAP: Record<string, number[]> = {
    '목': [3, 8], '화': [2, 7], '토': [5, 0], '금': [4, 9], '수': [1, 6],
  }

  return {
    elements,
    dayElement,
    isStrong,
    yongshin,
    heeshin,
    kishin,
    gushin,
    luckyColors: COLOR_MAP[yongshin] || '녹색 계열',
    luckyDirection: DIR_MAP[yongshin] || '동쪽, 남쪽',
    avoidDirection: AVOID_DIR_MAP[kishin] || '북쪽, 서쪽',
    luckyNumbers: [...(NUMBER_MAP[yongshin] || [3, 8]), ...(NUMBER_MAP[heeshin] || [2, 7])],
    avoidNumbers: [...(NUMBER_MAP[kishin] || [5, 0]), ...(NUMBER_MAP[gushin] || [4, 9])],
  }
}

const TONE_GUIDE = `
[상담 어조 가이드]
당신은 자평명리학 30년 경력의 최고 전문 상담사입니다.
품격과 깊이를 유지하되 내담자를 위한 명확하고 단호한 조언을 제공하세요.
"~할 수도 있습니다" 같은 모호한 표현을 금지하고, 명확히 지시하세요.
`

const HTML_GUIDE = `
HTML 형식:
- h2 (color:#1a2744; border-bottom:2px solid #c9a84c; padding-bottom:10px; margin-top:40px; font-size:22px; font-family:sans-serif; font-weight:bold;)
- h3 (color:#1a2744; border-left:3px solid #c9a84c; padding-left:12px; margin-top:24px; font-size:17px; font-family:sans-serif; font-weight:bold;)
- p (line-height:1.9; margin-bottom:16px; color:#2d2d2d; font-size:15px; font-family:sans-serif;)
- strong (color:#8b6914;)
- 일반 박스: div (background:#faf8f3; border-left:4px solid #c9a84c; padding:18px; border-radius:8px; margin-bottom:16px; font-family:sans-serif;)
- 긍정 박스: div (background:#f0f7f4; border-left:4px solid #5b8a72; padding:18px; border-radius:8px; margin-bottom:16px; font-family:sans-serif;)
- 경고 박스: div (background:#fdf5f1; border-left:4px solid #b8714a; padding:18px; border-radius:8px; margin-bottom:16px; font-family:sans-serif;)

출력: HTML만. 마크다운(\`\`\`) 금지. h2부터 시작.
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

    console.log('📥 입력 받음:', { name, birthDate, birthTime })

    const saju = calculateSaju(birthDate, birthTime, birthCity, calendarType, leapMonth)
    const sajuText = getSajuText(birthDate, birthTime, birthCity, calendarType, leapMonth)
    const master = analyzeSajuMaster(saju)

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
${marriageDate ? `- 결혼일: ${marriageDate}` : ''}
${divorceDate ? `- 이혼/사별일: ${divorceDate}` : ''}
${spouseBirth ? `- 배우자: ${spouseBirth}` : ''}
${childrenInfo ? `- 자녀: ${childrenInfo}` : ''}
${majorEvents ? `- 주요 사건:\n${majorEvents}${durationInfo}` : ''}
[거주지] ${address || '미입력'} (방위 추천 시 기준점!)
[건강/체형] ${bodyType ? `체형: ${bodyType}` : ''} / ${healthStatus || '특이사항 없음'}
`.trim()

    const MASTER_DIRECTIVE = `
[⭐⭐⭐ 통일 마스터 지침 ⭐⭐⭐]
- 용신: ${master.yongshin} | 희신: ${master.heeshin} | 기신: ${master.kishin}
- 길한 색상: ${master.luckyColors}
- 길한 방위: ${master.luckyDirection} (현재 거주지: ${address || '미입력'} 기준)
- 피해야 할 방위: ${master.avoidDirection}
- 길한 숫자: ${master.luckyNumbers.join(', ')} (목=3,8 / 화=2,7 / 토=5,0 / 금=4,9 / 수=1,6)
- 피해야 할 숫자: ${master.avoidNumbers.join(', ')}
- 질문 결론: 모든 장(7~12장)에서 최적 연도(${currentYear}년 하반기 및 ${currentYear + 1}년 상반기)와 용신 방향을 똑같이 서술하세요!
`

    const commonInfo = `
[고객 프로필]
- 이름: ${name} (${gender === 'male' ? '남성' : '여성'}, 만 ${age}세, ${birthYear}년생)
- 생년월일: ${birthDate} (${calendarLabel}) ${birthTime} (${birthCity})
- 상담일: ${todayStr} (현재 ${currentYear}년 ${currentMonth}월입니다)
- 상담분야: ${CATEGORY_KO[category] || '종합'}
- 질문: ${question || '없음'}

${verificationInfo}
${MASTER_DIRECTIVE}

[사주 원국]
${sajuText}
⭐ 일간(본인) = ${dayMaster}
`

    // 🚀 4개로 슬림화된 초고속 초정밀 병렬 프롬프트
    const prompt1 = `당신은 자평명리학 30년 경력의 최고 대가입니다.
${TONE_GUIDE}
${commonInfo}

다음 3개 장을 순서대로 모두 작성하세요.

[제1장: 사주 원국 총론]
- 사주 원국 표
- 일간 ${dayMaster}의 성격과 기질 (5문단 이상)
- 사주 구조와 특징, 타고난 강점 5가지 및 보완점 3가지

[제2장: 과거 시기 검증]
${majorEvents ? `⚠️ 실제 사건: ${majorEvents}\n이 사건들을 대운/세운과 연결하여 해석하세요.` : ''}
만 ${age}세 기준, 과거 시기별(1~12세, 13~18세, 20대, 30대, 40대 등) 길흉 사건 검증 분석.

[제3장: 육친 관계 심층 분석]
▶ 년주(${saju.year.full}): 조상/부모대
▶ 월주(${saju.month.full}): 부모/형제/직장
▶ 일주(${saju.day.full}): 본인/배우자
▶ 시주(${saju.hour.full}): 자녀/말년
마지막에 "육친 관계 종합 정리" 7문장 이상.

${HTML_GUIDE}
⚠️ 제1장, 제2장, 제3장을 빠짐없이 완벽히 작성하세요.`

    const prompt2 = `당신은 자평명리학 30년 경력의 최고 대가입니다.
${TONE_GUIDE}
${commonInfo}

다음 3개 장을 순서대로 모두 작성하세요.

[제4장: 건강·체질 심층 분석]
${bodyType ? `⚠️ 실제 체형(${bodyType})을 바탕으로 분석하세요.` : ''}
▶ 오행 체질 분석 및 장기별 강약
▶ 추천 식단 (음식 10가지, 피해야 할 음식 5가지)
▶ 추천 운동 5가지

[제5장: 격국과 용신]
▶ 격국 판단
▶ 용신: ${master.yongshin} (길한 색상: ${master.luckyColors}, 방위: ${master.luckyDirection}, 숫자: ${master.luckyNumbers.join(', ')})
▶ 기신: ${master.kishin} (피할 숫자: ${master.avoidNumbers.join(', ')})

[제6장: 십성 분석]
비견, 겁재, 식신, 상관, 편재, 정재, 편관, 정관, 편인, 정인 10가지 십성을 빠짐없이 모두 분석하세요 (각 4문장 이상).
마지막에 "십성 종합 정리" 7문장 이상을 반드시 작성하세요.

${HTML_GUIDE}
⚠️ 제4장, 제5장, 제6장을 빠짐없이 완벽히 작성하세요.`

    const prompt3 = `당신은 자평명리학 30년 경력의 최고 대가입니다.
${TONE_GUIDE}
${commonInfo}

다음 3개 장을 순서대로 모두 작성하세요.

[제7장: 대운 흐름 (현재~미래)]
▶ 현재 대운 (만 ${age}세) - 15문장 이상
▶ 다음 대운 (10년 후) - 10문장 이상
▶ 그 다음 대운 (20년 후) - 8문장 이상

[제8장: ${currentYear}년 올해의 운세]
⚠️ 중요: 현재는 ${currentYear}년 ${currentMonth}월입니다!
⚠️ 이미 지나간 1월부터 ${currentMonth - 1}월까지는 과거이므로 절대 미래처럼 조언하지 마세요!
▶ 세운 분석: 올해의 흐름
▶ 월별 운세: 현재월(${currentMonth}월)부터 12월까지 각 월별 분석
▶ 올해 반드시 해야 할 것 5가지 / 피해야 할 것 3가지

[제9장: ${currentYear + 1}~${currentYear + 3}년 향후 3년 흐름]
▶ ${currentYear + 1}년 운세 ▶ ${currentYear + 2}년 운세 ▶ ${currentYear + 3}년 운세
▶ 3년 종합 생존/도약 전략

${HTML_GUIDE}
⚠️ 제7장, 제8장, 제9장을 빠짐없이 완벽히 작성하세요.`

    const prompt4 = `당신은 자평명리학 30년 경력의 최고 대가입니다.
${TONE_GUIDE}
${commonInfo}

다음 3개 장을 순서대로 모두 작성하세요.

[제10장: ${CATEGORY_KO[category] || '종합'} 분야 맞춤 심층 분석]
⚠️ 고객 질문: "${question}"
⚠️ 마스터 지침의 핵심 결론과 100% 일치하게 명확히 답하세요!
▶ 사주에서 본 운 및 핵심 답변, 시기별 흐름, 실행 전략 10가지, 주의사항 5가지

[제11장: 인생 로드맵 (만 ${age}세 이후 미래만!)]
현재 나이 이후의 미래 4개 구간에 대한 핵심 과제 작성.

[제12장: 종합 조언과 마무리]
▶ 인생의 가장 큰 축복 3가지
▶ 가장 주의해야 할 점 3가지
▶ 지금 당장 실천해야 할 7가지 행동 강령
▶ 따뜻한 격려와 응원 메시지 (최소 20문장 이상, ${name}님의 이름을 부르며 명확하게 완결짓고 끝내세요)

${HTML_GUIDE}
⚠️ 제10장, 제11장, 제12장을 끝까지 작성하고 완결짓고 마치세요.`

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!.trim(),
    })

    const prompts = [prompt1, prompt2, prompt3, prompt4]
    const partNames = ['1~3장', '4~6장', '7~9장', '10~12장']

    console.log('🤖 4개 초고속 병렬 호출 시작 (예상 20~25초)...')
    const messages = await Promise.all(
      prompts.map((prompt, i) => {
        console.log(`  ${i + 1}/4: ${partNames[i]} 시작`)
        return anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 4000, // ⭐ 4000으로 조정하여 빠른 응답 도출 (20초 완성)
          messages: [{ role: 'user', content: prompt }],
        })
      })
    )

    const parts = messages.map((m) => cleanHtml(m.content[0].type === 'text' ? m.content[0].text : ''))
    const reportHtml = parts.join('')
    console.log('✅ 전체 보고서 생성 완료 (길이:', reportHtml.length, ')')

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
        saju_data: { ...saju, calendarType, leapMonth },
        status: 'completed',
        progress: 100,
      })
      .select().single()

    if (consultErr) throw consultErr

    return NextResponse.json({ success: true, consultationId: consultation?.id })

  } catch (error: any) {
    console.error('❌ 오류 발생 상세:', error)
    const errorMsg = typeof error === 'string' ? error : error?.message || (typeof error === 'object' ? JSON.stringify(error) : '알 수 없는 서버 오류')
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 })
  }
}