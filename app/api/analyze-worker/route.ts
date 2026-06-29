import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { getSajuText } from '@/lib/saju'

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
조선시대 사대부의 품격과 현대 전문가의 명확함을 함께 갖춘 분입니다.

【핵심 원칙】
1. 품격을 유지하되 핵심은 단호하게 짚으세요
2. 좋은 부분은 명확하고 따뜻하게 강조
3. 위험한 부분은 점잖되 단호하게 경고
4. 두루뭉술한 표현 지양

✅ 권장 표현:
- "이 사주는 ~한 특성이 명확합니다"
- "반드시 ~를 유념하시기 바랍니다"
- "각별히 ~에 유의하십시오"

❌ 지양:
- "~할 수도 있습니다"
- 너무 부드러운 표현

【표현 사용 제한】
- "제 30년 경력으로..." 는 보고서 전체에서 최대 1~2회만!
- "내 30년 경험으로..." 사용 금지!
`

const NUMBER_GUIDE = `
[오행별 숫자 매칭 표준 - 반드시 준수!]

오행 → 숫자:
- 목(木): 3, 8
- 화(火): 2, 7
- 토(土): 5, 0
- 금(金): 4, 9
- 수(水): 1, 6

용신 오행의 숫자가 가장 길함!
모든 장에서 동일한 숫자를 일관되게 추천!
`

const HTML_GUIDE = `
HTML 형식:
- h2 (color:#1a2744, border-bottom:2px solid #c9a84c, padding-bottom:10px, margin-top:40px, font-size:22px)
- h3 (color:#1a2744, border-left:3px solid #c9a84c, padding-left:12px, margin-top:24px, font-size:17px)
- p (line-height:1.9, margin-bottom:16px, color:#2d2d2d, font-size:15px)
- strong (color:#8b6914)
- 박스: div (background:#faf8f3, border-left:4px solid #c9a84c, padding:18px, border-radius:8px)
- 강조 박스: div (background:#f0f7f4, border-left:4px solid #5b8a72, padding:18px, border-radius:8px)
- 주의 박스: div (background:#fdf5f1, border-left:4px solid #b8714a, padding:18px, border-radius:8px)

출력: HTML만. 마크다운 금지.
`

export async function POST(request: NextRequest) {
  let consultationId = ''

  try {
    const { consultationId: id, body, saju } = await request.json()
    consultationId = id

    console.log('🚀 백그라운드 분석 시작:', consultationId)

    const {
      name, gender, address, familyInfo,
      marriageDate, divorceDate, spouseBirth, childrenInfo,
      majorEvents, bodyType, healthStatus,
      birthDate, birthTime, birthCity, birthCountry,
      calendarType, leapMonth, category, question
    } = body

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 진행률 업데이트 함수
    async function updateProgress(progress: number, status: string = 'processing') {
      await supabase
        .from('consultations')
        .update({ status, progress })
        .eq('id', consultationId)
    }

    await updateProgress(5)

    const sajuText = getSajuText(birthDate, birthTime, birthCity, calendarType, leapMonth)

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
[거주지] ${address || '미입력'}
[건강] ${bodyType ? `체형: ${bodyType}` : ''} ${healthStatus || ''}
`.trim()

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!.trim(),
    })

    await updateProgress(10)

    // ⭐ STEP 1: 핵심 결론 도출 (정확성 보장)
    console.log('🎯 핵심 결론 도출...')
    
    const corePrompt = `당신은 자평명리학 30년 경력의 최고 대가입니다.

다음 사주를 분석하여 핵심 결론을 JSON으로 출력하세요.

${sajuText}

[고객 정보]
- 이름: ${name}
- 성별: ${gender === 'male' ? '남성' : '여성'}
- 만 ${age}세
- 거주지: ${address || '미입력'}
- 상담분야: ${CATEGORY_KO[category] || '종합'}
- 질문: ${question || '없음'}

${verificationInfo}

JSON 형식으로만 출력:

{
  "격국": "이 사주의 격국",
  "용신": "용신 오행 (목/화/토/금/수)",
  "용신_이유": "왜 이 오행이 용신인지 (3문장)",
  "희신": "희신 오행",
  "기신": "기신 오행",
  "구신": "구신 오행",
  "길한_색상": ["색상 2-3가지"],
  "길한_방위": "용신의 방위",
  "길한_숫자": [4개의 숫자],
  "피할_숫자": [4개의 숫자],
  "추천_직업_TOP5": ["직업 5개 순위대로"],
  "현재_대운": "현재 대운",
  "현재_대운_핵심": "핵심 의미 (2문장)",
  "올해_핵심": "${currentYear}년 핵심 (2문장)",
  "질문_답변_요지": "${question ? '질문 답변 요지. 우선순위가 있으면 명확히 (1순위: A, 2순위: B...)' : '종합 운세 요지'}",
  "사주_장점_3가지": ["장점1", "장점2", "장점3"],
  "사주_위험_3가지": ["위험1", "위험2", "위험3"]
}

⚠️ 오행별 숫자: 목(3,8), 화(2,7), 토(5,0), 금(4,9), 수(1,6)
⚠️ JSON만! 다른 설명 금지!`

    const coreMessage = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      messages: [{ role: 'user', content: corePrompt }],
    })

    let coreData: any = {}
    try {
      const coreText = coreMessage.content[0].type === 'text' ? coreMessage.content[0].text : '{}'
      const jsonMatch = coreText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        coreData = JSON.parse(jsonMatch[0])
      }
      console.log('✅ 핵심 결론 완료')
    } catch (e) {
      console.error('핵심 결론 파싱 실패:', e)
    }

    await updateProgress(20)

    const coreReference = `
[⭐ 절대 준수해야 할 핵심 결론!]

격국: ${coreData.격국 || '미정'}
용신: ${coreData.용신 || '미정'}
희신: ${coreData.희신 || '미정'}
기신: ${coreData.기신 || '미정'}
구신: ${coreData.구신 || '미정'}

길한 색상: ${JSON.stringify(coreData.길한_색상 || [])}
길한 방위: ${coreData.길한_방위 || '미정'}
길한 숫자: ${JSON.stringify(coreData.길한_숫자 || [])}
피할 숫자: ${JSON.stringify(coreData.피할_숫자 || [])}

추천 직업: ${JSON.stringify(coreData.추천_직업_TOP5 || [])}
현재 대운: ${coreData.현재_대운 || '미정'}
올해 핵심: ${coreData.올해_핵심 || ''}

질문 답변 요지: ${coreData.질문_답변_요지 || ''}
사주 장점: ${JSON.stringify(coreData.사주_장점_3가지 || [])}
사주 위험: ${JSON.stringify(coreData.사주_위험_3가지 || [])}

⚠️ 모든 장에서 위 정보를 동일하게 사용!
⚠️ 절대 다른 숫자/색상/순위 말하지 마세요!
`

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

${coreReference}
`

    // 8개 프롬프트
    const prompt1 = `당신은 자평명리학 30년 경력의 최고 대가입니다.
${TONE_GUIDE}
${NUMBER_GUIDE}
${commonInfo}

다음 2개 장 모두 작성!

[제1장: 사주 원국 총론]
- 사주 원국 표
- 일간 ${dayMaster}의 본질적 성격 (5문단 이상)
- 사주 구조와 특징
- 타고난 강점 5가지
- 보완 필요 3가지

⚠️ 핵심 결론의 장점 3가지 반드시 포함!

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
⚠️ 1~2장만!`

    const prompt2 = `당신은 자평명리학 30년 경력의 최고 대가입니다.
${TONE_GUIDE}
${commonInfo}

[제3장: 육친 관계 심층 분석]

4개 기둥 각 8문장 이상:
▶ 년주(${yearFull}): 조상운/사회배경
▶ 월주(${monthFull}): 부모운/형제운/직장
▶ 일주(${dayFull}): 본인/배우자
▶ 시주(${hourFull}): 자녀운/말년운

마지막에 "육친 관계 종합 정리" 7문장 이상.

${HTML_GUIDE}
⚠️ 3장만!`

    const prompt3 = `당신은 자평명리학 30년 경력의 최고 대가입니다.
${TONE_GUIDE}
${NUMBER_GUIDE}
${commonInfo}

다음 2개 장 모두 작성!

[제4장: 건강·체질 심층 분석]
${bodyType ? `⚠️ 실제 체형: ${bodyType} 우선 반영!` : ''}
▶ 오행 체질
▶ 장기별 강약
▶ 주의 질환
▶ 추천 식단 (10가지)
▶ 피할 음식 (5가지)
▶ 추천 운동 (5가지)

[제5장: 격국과 용신]
⚠️ 핵심 결론과 100% 일치!

▶ 격국 판단: ${coreData.격국 || ''}
▶ 용신: ${coreData.용신 || ''}
▶ 길한 색상: ${JSON.stringify(coreData.길한_색상 || [])}
▶ 길한 방위: ${coreData.길한_방위 || ''} (거주지 ${address || ''} 기준)
▶ 길한 숫자: ${JSON.stringify(coreData.길한_숫자 || [])}
▶ 추천 직업: ${JSON.stringify(coreData.추천_직업_TOP5 || [])}
▶ 기신: ${coreData.기신 || ''}
▶ 피할 숫자: ${JSON.stringify(coreData.피할_숫자 || [])}

⚠️ 위 정보 그대로 사용!

${HTML_GUIDE}
⚠️ 4~5장만!`

    const prompt4 = `당신은 자평명리학 30년 경력의 최고 대가입니다.
${TONE_GUIDE}
${commonInfo}

[제6장: 십성 분석]

⚠️ 10개 모두 완료!

각 4~5문장:
▶ 비견 ▶ 겁재 ▶ 식신 ▶ 상관 ▶ 편재
▶ 정재 ▶ 편관 ▶ 정관 ▶ 편인 ▶ 정인

▶ 십성 종합 정리 (필수!)

${HTML_GUIDE}
⚠️ 6장만! 10개+종합정리!`

    const prompt5 = `당신은 자평명리학 30년 경력의 최고 대가입니다.
${TONE_GUIDE}
${commonInfo}

다음 2개 장 모두 작성!

[제7장: 대운 흐름 (현재~미래만!)]
⚠️ 현재 대운: ${coreData.현재_대운 || ''}
⚠️ 핵심: ${coreData.현재_대운_핵심 || ''}

▶ 현재 대운 (만 ${age}세) - 15문장
▶ 다음 대운 (10년 후) - 10문장
▶ 그 다음 (20년 후) - 8문장

[제8장: ${currentYear}년 올해 운세]
⚠️ 올해 핵심: ${coreData.올해_핵심 || ''}

▶ 세운 분석 (7문장)
▶ 월별 (${currentMonth}~12월, 각 5문장)
▶ 핵심 키워드 3가지
▶ 해야 할 것 5가지
▶ 하지 말 것 3가지

${HTML_GUIDE}
⚠️ 7~8장만!`

    const prompt6 = `당신은 자평명리학 30년 경력의 최고 대가입니다.
${TONE_GUIDE}
${commonInfo}

[제9장: ${currentYear + 1}~${currentYear + 3}년 향후 3년]

각 년도 20문장 이상!

▶ ${currentYear + 1}년 운세
▶ ${currentYear + 2}년 운세
▶ ${currentYear + 3}년 운세
▶ 향후 3년 종합 전략

${HTML_GUIDE}
⚠️ 9장만!`

    const prompt7 = `당신은 자평명리학 30년 경력의 최고 대가입니다.
${TONE_GUIDE}
${commonInfo}

다음 2개 장 모두 작성!

[제10장: ${CATEGORY_KO[category] || '종합'} 맞춤 분석]

⚠️⚠️⚠️ 매우 중요!
질문 답변 요지: ${coreData.질문_답변_요지 || ''}
⚠️ 위 요지와 100% 일치하게! 우선순위 절대 바꾸지 말 것!

${question ? `질문: "${question}"` : ''}

▶ 사주에서 본 운
▶ 핵심 답변 (위 요지 그대로!)
▶ 시기별 흐름
▶ 실행 전략 10가지
▶ 절대 피할 것 5가지
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

[제12장: 종합 조언과 마무리]

⚠️ 핵심 결론과 일치:
- 사주 장점: ${JSON.stringify(coreData.사주_장점_3가지 || [])}
- 사주 위험: ${JSON.stringify(coreData.사주_위험_3가지 || [])}

▶ 가장 큰 축복 3가지 (각 6문장)
- 위 장점 3가지 그대로!

▶ 가장 주의해야 할 점 3가지 (각 6문장)
- 위 위험 3가지 그대로!

▶ 핵심 조언 7가지 (각 4문장)

▶ 따뜻한 격려와 응원 메시지
⚠️ 최소 20문장 이상!
⚠️ ${name}님 이름 여러 번 언급!
⚠️ "운명을 개척하시기 바랍니다", "축복합니다" 마무리!

${HTML_GUIDE}
⚠️ 12장만! 끝까지 완성!`

    const prompts = [prompt1, prompt2, prompt3, prompt4, prompt5, prompt6, prompt7, prompt8]
    const partNames = ['1~2장', '3장', '4~5장', '6장 십성', '7~8장', '9장', '10~11장', '12장']

    console.log('🤖 8개 병렬 호출 시작...')
    
    // 병렬 호출 + 진행률 업데이트
    let completed = 0
    const messages = await Promise.all(
      prompts.map(async (prompt, i) => {
        const msg = await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 16000,
          messages: [{ role: 'user', content: prompt }],
        })
        completed++
        const progress = 20 + Math.floor((completed / 8) * 75)
        await updateProgress(progress)
        console.log(`✅ ${i + 1}/8 완료 (${partNames[i]})`)
        return msg
      })
    )

    const parts = messages.map((m, i) => {
      const part = cleanHtml(m.content[0].type === 'text' ? m.content[0].text : '')
      return part
    })

    const reportHtml = parts.join('')
    console.log('✅ 전체 길이:', reportHtml.length)

    // 최종 결과 저장
    await supabase
      .from('consultations')
      .update({
        report_html: reportHtml,
        status: 'completed',
        progress: 100,
        saju_data: { ...saju, calendarType, leapMonth, coreData },
      })
      .eq('id', consultationId)

    console.log('✅ 분석 완료!')

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ 백그라운드 오류:', error)
    
    // 오류 시 상태 업데이트
    if (consultationId) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      await supabase
        .from('consultations')
        .update({
          status: 'failed',
          error_message: String(error),
        })
        .eq('id', consultationId)
    }
    
    return NextResponse.json({ success: false }, { status: 500 })
  }
}