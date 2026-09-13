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

// ⭐ 명리학 자동 마스터 알고리즘
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

  let yongshin = '목', heeshin = '화', kishin = '토', gushin = '금'
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
    '목': '청록색, 녹색 계열', '화': '붉은색, 주황색, 분홍색 계열',
    '토': '황색, 갈색, 베이지 계열', '금': '흰색, 은색, 회색 계열', '수': '검정색, 남색, 파란색 계열',
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
    elements, dayElement, isStrong, yongshin, heeshin, kishin, gushin,
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
전문가로서의 품격과 깊이를 유지하되, 내담자를 위한 명확하고 단호한 조언을 제공하세요.
`

const HTML_GUIDE = `
HTML 형식 (글꼴 통일 필수):
- h2 (color:#1a2744; border-bottom:2px solid #c9a84c; padding-bottom:10px; margin-top:40px; font-size:22px; font-family:sans-serif; font-weight:bold;)
- h3 (color:#1a2744; border-left:3px solid #c9a84c; padding-left:12px; margin-top:24px; font-size:17px; font-family:sans-serif; font-weight:bold;)
- p (line-height:1.9; margin-bottom:16px; color:#2d2d2d; font-size:15px; font-family:sans-serif;)
- strong (color:#8b6914;)
- 일반 박스: div (background:#faf8f3; border-left:4px solid #c9a84c; padding:18px; border-radius:8px; margin-bottom:16px; font-family:sans-serif;)
- 긍정 박스: div (background:#f0f7f4; border-left:4px solid #5b8a72; padding:18px; border-radius:8px; margin-bottom:16px; font-family:sans-serif;)
- 경고 박스: div (background:#fdf5f1; border-left:4px solid #b8714a; padding:18px; border-radius:8px; margin-bottom:16px; font-family:sans-serif;)

출력: HTML만. 마크다운(\`\`\`) 절대 금지. 바로 h2부터 시작.
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
[검증 및 참고 정보]
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

- 시기 및 의사결정 고정 기준:
  * 최적 추천 연도: ${currentYear}년 하반기(${currentMonth}~11월) 및 ${currentYear + 1}년 상반기(3~5월)
  * 질문 답변 시, 모든 선택지가 제시된 경우 용신 오행(${master.yongshin}, ${master.heeshin})의 기운과 부합하는 순서대로 1순위, 2순위를 정하고 모든 장에서 똑같이 서술하세요!
`

    const commonInfo = `
[고객 프로필]
- 이름: ${name} (${gender === 'male' ? '남성' : '여성'}, 만 ${age}세, ${birthYear}년생)
- 생년월일: ${birthDate} (${calendarLabel}) ${birthTime} (${birthCity})
- 상담일(오늘): ${todayStr} (현재 ${currentYear}년 ${currentMonth}월입니다)
- 상담분야: ${CATEGORY_KO[category] || '종합'}
- 질문: ${question || '없음'}

${verificationInfo}
${MASTER_DIRECTIVE}

[사주 원국]
${sajuText}
⭐ 일간(본인) = ${dayMaster}
`

    // 🚀 초고속 3-파이프라인 병렬 프롬프트 (20초 내 완벽 도출)
    const prompt1 = `당신은 자평명리학 30년 경력의 최고 전문 상담사입니다.
${TONE_GUIDE}
${commonInfo}

다음 3개 장을 순서대로 작성하세요.
[제1장: 사주 원국 총론] (원국 표, 일간 성격 5문단 이상, 강점 5가지 및 보완점 3가지)
[제2장: 과거 시기 검증] (${majorEvents ? `실제사건: ${majorEvents}` : ''} 만 ${age}세 기준 과거 시기별 분석)
[제3장: 육친 관계 심층 분석] (년/월/일/시주 4기둥 각 8문장 이상 + 육친 관계 종합 정리 7문장)

${HTML_GUIDE}
⚠️ 제1장, 제2장, 제3장을 빠짐없이 작성하세요.`

    const prompt2 = `당신은 자평명리학 30년 경력의 최고 전문 상담사입니다.
${TONE_GUIDE}
${commonInfo}

다음 3개 장을 순서대로 작성하세요.
[제4장: 건강·체질 심층 분석] (${bodyType ? `실제 체형:${bodyType}` : ''} 체질분석, 장기강약, 식단 10가지, 운동 5가지)
[제5장: 격국과 용신] (격국 7문장 이상, 용신:${master.yongshin}, 길한 색상:${master.luckyColors}, 방위:${master.luckyDirection}, 숫자:${master.luckyNumbers.join(', ')}, 기신:${master.kishin})
[제6장: 십성 분석] (비견~정인 10가지 십성 빠짐없이 각 4문장 이상 + 십성 종합 정리 7문장 이상)

${HTML_GUIDE}
⚠️ 제4장, 제5장, 제6장을 빠짐없이 작성하세요.`

    const prompt3 = `당신은 자평명리학 30년 경력의 최고 전문 상담사입니다.
${TONE_GUIDE}
${commonInfo}

다음 6개 장을 순서대로 작성하세요.
[제7장: 대운 흐름] (현재 대운 15문장 이상, 미래 대운)
[제8장: ${currentYear}년 올해의 운세] (현재 ${currentMonth}월이므로 남은 달만 분석!)
[제9장: ${currentYear + 1}~${currentYear + 3}년 향후 3년 흐름] (각 연도별 예측)
[제10장: ${CATEGORY_KO[category] || '종합'} 맞춤 분석] (질문 "${question}"에 대한 해법)
[제11장: 인생 로드맵] (현재 이후 미래 과제)
[제12장: 종합 조언] (축복 3가지, 주의점 3가지, 행동강령 7가지, 격려 메시지 20문장 이상으로 ${name}님 이름을 부르며 따뜻하게 완결)

${HTML_GUIDE}
⚠️ 제7장부터 제12장까지 완전히 작성하고 마감하세요.`

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!.trim(),
    })

    const prompts = [prompt1, prompt2, prompt3]
    const partNames = ['1~3장', '4~6장', '7~12장']

    console.log('🤖 3개 파이프라인 초고속 병렬 호출 시작 (예상 20초)...')
    const messages = await Promise.all(
      prompts.map((prompt, i) => {
        console.log(`  ${i + 1}/3: ${partNames[i]} 시작`)
        return anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 4000,
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