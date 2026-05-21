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
HTML 형식 가이드:
- 큰제목: h2 태그 (color:#1a2744, border-bottom:3px solid #c9a84c, padding-bottom:12px, margin-top:48px, font-size:24px)
- 소제목: h3 태그 (color:#1a2744, border-left:4px solid #c9a84c, padding-left:14px, margin-top:32px, font-size:18px)
- 단락: p 태그 (line-height:2, margin-bottom:18px, color:#333, font-size:15px)
- 강조: strong 태그 (color:#c9a84c)
- 박스: div 태그 (background:#f8f5ef, border-left:5px solid #c9a84c, padding:20px, border-radius:10px, line-height:2)

출력 규칙:
- HTML만 출력
- 마크다운 코드블록 금지
- 바로 h2부터 시작
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
      const starts = startMatches.map(m => parseInt(m[1]))
      const ends = endMatches.map(m => parseInt(m[1]))
      
      if (starts.length > 0 && ends.length > 0) {
        durationInfo = `\n[기간 계산 참고] 시작: ${starts.join(',')}년 / 종료: ${ends.join(',')}년`
      }
    }

    const verificationInfo = `
[과거 검증 정보]
${familyInfo ? `- 가족: ${familyInfo}` : ''}
${marriageDate ? `- 결혼일: ${marriageDate}` : ''}
${divorceDate ? `- 이혼/사별일: ${divorceDate}` : ''}
${spouseBirth ? `- 배우자: ${spouseBirth}` : ''}
${childrenInfo ? `- 자녀: ${childrenInfo}` : ''}
${majorEvents ? `- 주요 사건:\n${majorEvents}${durationInfo}

⚠️ 기간 계산: "종료년 - 시작년 + 1" 공식 사용` : ''}

[현재 거주지]
${address ? `- 주소: ${address}` : ''}
⚠️ 이사/여행 방위 = 현재 주소(${address || '미입력'}) 기준

[건강]
${bodyType ? `- 실제 체형: ${bodyType}` : ''}
${healthStatus ? `- 현재 건강: ${healthStatus}` : ''}
`.trim()

    const commonInfo = `
[고객 정보]
- 이름: ${name}
- 성별: ${gender === 'male' ? '남성' : '여성'}
- 만 ${age}세 (${birthYear}년생)
- 생년월일: ${birthDate} (${calendarLabel})
- 출생시각: ${birthTime}
- 출생지: ${birthCity}${birthCountry && birthCountry !== '대한민국' ? ` (${birthCountry})` : ''}
- 현재 거주지: ${address || '미입력'}

${verificationInfo}

- 상담일: ${todayStr}
- 현재: ${currentYear}년 ${currentMonth}월
- 상담분야: ${CATEGORY_KO[category] || '종합'}
- 질문: ${question || '없음'}

${sajuText}

⭐ 일간 = ${dayMaster}
`

    // ========== Part 1: 사주 원국 + 과거 + 육친 ==========
    const prompt1 = `당신은 자평명리학 40년 경력의 최고 전문 상담사입니다.

${commonInfo}

다음 3개 장을 모두 작성하세요. 절대 중간에 끊지 말 것!

[제1장: 사주 원국 총론]
- 사주 원국 표
- 일간 ${dayMaster}의 성격과 기질 (5문단 이상)
- 사주 구조와 특징
- 타고난 강점 5가지

[제2장: 과거 시기 검증]
${majorEvents ? `⚠️ 실제 사건: ${majorEvents}\n위 사건을 대운/세운과 연결!` : ''}

만 ${age}세 기준 과거:
▶ 유아기~초등 (1~12세)
▶ 중·고등 (13~18세)
▶ 20대 (19~29세)
${age >= 30 ? '▶ 30대' : ''}
${age >= 40 ? '▶ 40대' : ''}
${age >= 50 ? '▶ 50대' : ''}

[제3장: 육친 관계 심층 분석]
각 7문장 이상:
▶ 년주(${yearFull}): 조상/사회배경
▶ 월주(${monthFull}): 부모/형제/직장
▶ 일주(${dayFull}): 본인/배우자
▶ 시주(${hourFull}): 자녀/말년

${HTML_GUIDE}

⚠️ 반드시 1~3장 모두 완료!
⚠️ 각 장 충분히 작성!`

    // ========== Part 2: 건강 + 격국용신 + 십성 ==========
    const prompt2 = `당신은 자평명리학 40년 경력의 최고 전문 상담사입니다.

${commonInfo}

다음 3개 장을 모두 작성하세요. 절대 끊지 말 것!

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
⚠️ 방위 = 현재 주소(${address || '미입력'}) 기준!

[제6장: 십성 분석]
10가지 십성 모두 분석 (각 4문장 이상):
비견, 겁재, 식신, 상관, 편재, 정재, 편관, 정관, 편인, 정인
마지막에 종합 정리 7문장 이상.

${HTML_GUIDE}

⚠️ 반드시 4~6장 모두 완료!
⚠️ 십성 10개 모두 빠짐없이!`

    // ========== Part 3: 대운 + 올해 + 향후 3년 ==========
    const prompt3 = `당신은 자평명리학 40년 경력의 최고 전문 상담사입니다.

${commonInfo}

다음 3개 장을 모두 작성하세요. 절대 끊지 말 것!

[제7장: 대운 흐름 (현재 및 미래만!)]
⚠️ 과거 대운 다루지 말 것!
▶ 현재 대운 (만 ${age}세) - 15문장 이상
▶ 다음 대운 (10년 후) - 10문장 이상
▶ 그 다음 대운 (20년 후) - 8문장 이상

[제8장: ${currentYear}년 올해의 운세]
▶ ${currentYear}년 세운 분석 (7문장 이상)
▶ 월별 운세 (${currentMonth}월~12월, 각 5문장 이상)
▶ 핵심 키워드 3가지
▶ 해야 할 것 5가지
▶ 하지 말아야 할 것 3가지

[제9장: ${currentYear + 1}년~${currentYear + 3}년 향후 3년]
▶ ${currentYear + 1}년 (15문장 이상)
▶ ${currentYear + 2}년 (15문장 이상)
▶ ${currentYear + 3}년 (15문장 이상)
▶ 종합 전략

${HTML_GUIDE}

⚠️ 반드시 7~9장 모두 완료!`

    // ========== Part 4: 맞춤 + 인생 로드맵 ==========
    const prompt4 = `당신은 자평명리학 40년 경력의 최고 전문 상담사입니다.

${commonInfo}

다음 2개 장을 모두 작성하세요. 절대 끊지 말 것!

[제10장: ${CATEGORY_KO[category] || '종합'} 분야 맞춤 분석]
▶ 사주에서 본 운
▶ 시기별 흐름
${question ? `▶ 질문 답변: "${question}"` : '▶ 종합 전략'}
▶ 실행 전략 10가지
▶ 주의사항 5가지
(25문장 이상)

[제11장: 인생 로드맵 (만 ${age}세 이후 미래만!)]
⚠️ 과거는 절대 다루지 말 것!
${age < 40 ? `
▶ 현재 ~ 40대 (10문장 이상)
▶ 40대 ~ 50대 (10문장 이상)
▶ 50대 ~ 60대 (10문장 이상)
▶ 60대 이후 (10문장 이상)
` : age < 50 ? `
▶ 현재 ~ 50대 (10문장 이상)
▶ 50대 ~ 60대 (10문장 이상)
▶ 60대 ~ 70대 (10문장 이상)
▶ 70대 이후 (10문장 이상)
` : age < 60 ? `
▶ 현재 ~ 60대 (10문장 이상)
▶ 60대 ~ 70대 (10문장 이상)
▶ 70대 ~ 80대 (10문장 이상)
▶ 80대 이후 (10문장 이상)
` : `
▶ 현재 ~ 70대 (10문장 이상)
▶ 70대 ~ 80대 (10문장 이상)
▶ 80대 이후 (10문장 이상)
`}

${HTML_GUIDE}

⚠️ 반드시 10~11장 모두 완료!`

    // ========== Part 5: 종합 조언 (별도 분리!) ==========
    const prompt5 = `당신은 자평명리학 40년 경력의 최고 전문 상담사입니다.

${commonInfo}

이 장은 보고서의 마지막 장입니다. 매우 정성스럽고 완성도 있게 작성하세요.

[제12장: 종합 조언과 마무리]

▶ 이 사주의 가장 큰 축복 3가지
각 축복마다 6문장 이상으로 상세하게:
- 어떤 축복인지
- 왜 축복인지
- 어떻게 활용할 수 있는지
- 구체적 예시

▶ 인생에서 가장 주의해야 할 점 3가지
각 주의점마다 6문장 이상으로 상세하게:
- 무엇을 주의해야 하는지
- 왜 그런지
- 어떻게 대처할지
- 구체적 방법

▶ 실행 가능한 핵심 조언 7가지
각 조언마다 4문장 이상:
- 무엇을 / 언제 / 어떻게 / 왜

▶ 따뜻한 격려와 응원 메시지
⚠️ 절대 중간에 끊지 말고 끝까지 작성하세요!
⚠️ 최소 20문장 이상으로 매우 길고 감동적으로!
⚠️ 고객 이름(${name})을 반드시 여러 번 언급!
⚠️ 과거의 어려움을 인정하고, 현재의 노력을 칭찬하고, 미래의 희망을 주세요
⚠️ 마지막 문장은 강한 응원과 축복으로 마무리하세요
⚠️ "응원합니다", "축복합니다", "행복하세요" 같은 마무리 표현 사용
⚠️ 보고서 전체를 마무리하는 따뜻한 결론으로!

${HTML_GUIDE}

⚠️ 12장만 작성! 매우 길고 정성스럽게!
⚠️ 격려 메시지 절대 잘리지 않도록 충분히!
⚠️ 다른 장은 절대 시작하지 말 것!`

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!.trim(),
    })

    const prompts = [prompt1, prompt2, prompt3, prompt4, prompt5]
    const partNames = ['1~3장', '4~6장', '7~9장', '10~11장', '12장 종합']

    console.log('🤖 5개 분석 병렬 시작...')
    const messages = await Promise.all(
      prompts.map((prompt, i) => {
        console.log(`  ${i + 1}/5: ${partNames[i]} 시작`)
        return anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 16000,
          messages: [{ role: 'user', content: prompt }],
        })
      })
    )

    const parts = messages.map((m, i) => {
      const part = cleanHtml(m.content[0].type === 'text' ? m.content[0].text : '')
      console.log(`✅ ${i + 1}/5 완료, 길이:`, part.length)
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