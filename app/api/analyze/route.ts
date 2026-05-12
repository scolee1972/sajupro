import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { getSajuText, calculateSaju } from '@/lib/saju'

const CATEGORY_KO: Record<string, string> = {
  general: '종합 운세', love: '연애/애정', career: '직장/이직',
  business: '사업/창업', investment: '투자/재테크', study: '학업/진로',
  moving: '이사/방위', family: '가족 관계', compatibility: '궁합',
}

function cleanHtml(html: string): string {
  return html
    .replace(/```html\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/^\s*<!DOCTYPE.*?>/gi, '')
    .replace(/^\s*<html.*?>/gi, '')
    .replace(/<\/html>\s*$/gi, '')
    .replace(/^\s*<body.*?>/gi, '')
    .replace(/<\/body>\s*$/gi, '')
    .trim()
}

const HTML_GUIDE = `
HTML 형식 가이드:
- 큰제목: h2 태그 사용 (color:#1a2744, border-bottom:3px solid #c9a84c, padding-bottom:12px, margin-top:48px, font-size:24px)
- 소제목: h3 태그 사용 (color:#1a2744, border-left:4px solid #c9a84c, padding-left:14px, margin-top:32px, font-size:18px)
- 단락: p 태그 사용 (line-height:2, margin-bottom:18px, color:#333, font-size:15px)
- 강조: strong 태그 사용 (color:#c9a84c)
- 박스: div 태그 사용 (background:#f8f5ef, border-left:5px solid #c9a84c, padding:20px, border-radius:10px, line-height:2)
- 목록: ul/li 태그 사용 (line-height:2)

가독성 규칙:
1. 모든 단락은 p 태그로 감싸기
2. 한 단락은 3~5문장 이내
3. 중요 내용은 박스로 강조

출력 규칙 (필수):
- HTML만 출력
- 마크다운 코드블록 절대 금지
- DOCTYPE, html, body 태그 금지
- 바로 h2부터 시작
`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name, gender, phone, email, address, familyInfo,
      birthDate, birthTime, birthCity,
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

    const familyContext = familyInfo ? `\n[가족 관계 정보]\n${familyInfo}\n` : ''

    const commonInfo = `
[고객 정보]
- 이름: ${name}
- 성별: ${gender === 'male' ? '남성' : '여성'}
- 만 나이: ${age}세 (${birthYear}년생)
- 생년월일: ${birthDate} (${calendarLabel})
- 출생시각: ${birthTime}
- 출생지: ${birthCity}
${familyContext}
- 상담일: ${todayStr}
- 현재: ${currentYear}년 ${currentMonth}월
- 상담분야: ${CATEGORY_KO[category] || '종합'}
- 질문: ${question || '없음'}

${sajuText}

⭐ 일간(日干) = ${dayMaster}
절대 다른 천간을 일간으로 사용하지 마세요!
`

    // ========== Part 1: 사주 원국 + 과거 ==========
    const prompt1 = `당신은 자평명리학 40년 경력의 최고 전문 상담사입니다.

${commonInfo}

작성할 내용:

[제1장: 사주 원국 총론]
- 사주 원국 표 (시주/일주/월주/년주 4개 기둥)
- 일간 ${dayMaster}의 본질적 성격과 기질 (5문단 이상)
- 이 사주의 전체적인 구조와 특징
- 타고난 강점 5가지
- 인생의 전반적인 테마

[제2장: 과거 시기 검증]
대운/세운으로 추정한 과거 사건 (만 ${age}세 기준 과거):

- 유아기~초등학교 (1~12세)
- 중·고등학교 (13~18세)
- 20대 (19~29세)
${age >= 30 ? '- 30대 (30~39세)' : ''}
${age >= 40 ? '- 40대 (40~49세)' : ''}
${age >= 50 ? '- 50대 (50~59세)' : ''}

각 시기마다 구체적 연도와 사건 예측!
${familyInfo ? '가족 관계 정보를 참고하여 더 정확하게 분석하세요.' : ''}

${HTML_GUIDE}

⚠️ 1~2장만 작성!
⚠️ 마크다운 코드블록 금지!
⚠️ 바로 h2부터 시작!`

    // ========== Part 2: 육친 관계 ==========
    const prompt2 = `당신은 자평명리학 40년 경력의 최고 전문 상담사입니다.

${commonInfo}

작성할 내용:

[제3장: 육친 관계 심층 분석]

각 관계별로 매우 상세하게 (각 7문장 이상):

▶ 년주(年柱) = ${yearFull}: 조상운, 사회적 배경
- 조부모/외조부모와의 관계
- 가문의 특징과 사회적 배경
- 유년기 환경
- 본인에게 미치는 영향

▶ 월주(月柱) = ${monthFull}: 부모운, 형제운, 직장
- 아버지와의 관계
- 어머니와의 관계
- 형제자매 관계
- 직장/사회생활 패턴
${familyInfo ? '\n* 고객의 실제 가족 관계 정보를 반영하여 분석하세요.' : ''}

▶ 일주(日柱) = ${dayFull}: 본인, 배우자
- 본인의 핵심 성격 (장점 5가지, 단점 3가지)
- 연애/결혼 스타일
- 배우자의 성향
- 결혼 시기 예측
- 부부 사이 갈등 포인트와 해결 방법

▶ 시주(時柱) = ${hourFull}: 자녀운, 말년운
- 자녀의 성향과 관계
- 자녀에게 좋은 교육/양육 방식
- 말년(60대 이후)의 삶의 질
- 노후 준비 방향

${HTML_GUIDE}

⚠️ 3장만 작성!
⚠️ 마크다운 코드블록 금지!
⚠️ 바로 h2부터 시작!`

    // ========== Part 3: 건강·체질 ==========
    const prompt3 = `당신은 자평명리학 40년 경력의 최고 전문 상담사입니다.

${commonInfo}

작성할 내용:

[제4장: 건강·체질 심층 분석]

▶ 오행 체질 분석 (일간 ${dayMaster} 기준)
- 체질 유형과 특성 (5문장 이상)
- 체형, 피부, 외모 특징

▶ 장기별 강약 분석
- 강한 장기와 약한 장기
- 주의 질환 (구체적으로)
- 시기별 건강 주의 포인트

▶ 체질별 추천 식단
- 보강 음식 10가지 (식재료명 + 효과)
- 피해야 할 음식 5가지 (이유)
- 아침/점심/저녁 추천 식단 예시
- 계절별 음식 (봄/여름/가을/겨울)

▶ 체질별 운동/활동 추천
- 맞는 운동 5가지
- 피해야 할 운동/활동
- 일상 생활 습관 (수면, 스트레스 관리)

${HTML_GUIDE}

⚠️ 4장만 작성!
⚠️ 마크다운 코드블록 금지!
⚠️ 바로 h2부터 시작!`

    // ========== Part 4: 격국·용신 (분리) ==========
    const prompt4 = `당신은 자평명리학 40년 경력의 최고 전문 상담사입니다.

${commonInfo}

작성할 내용 (매우 상세하게):

[제5장: 격국과 용신]

▶ 격국 판단
- 어떤 격국인지, 왜 그런지 (7문장 이상)
- 격국의 특성과 의미
- 격국에 따른 인생 운영 방식

▶ 용신 (가장 필요한 오행)
- 어떤 오행이 용신인지, 왜 (5문장 이상)
- 색상 추천: 옷, 소품, 인테리어
- 방위 추천: 이사/여행 방향
- 행운의 숫자
- 적합한 직업 7가지 이상
- 좋은 배우자 사주 특징

▶ 기신 (피해야 할 오행)
- 어떤 오행이 기신인지, 왜 (5문장 이상)
- 피해야 할 색상, 방위, 환경
- 주의해야 할 직업

${HTML_GUIDE}

⚠️ 5장만 작성!
⚠️ 마크다운 코드블록 금지!
⚠️ 바로 h2부터 시작!`

    // ========== Part 5: 십성 (별도 분리!) ==========
    const prompt5 = `당신은 자평명리학 40년 경력의 최고 전문 상담사입니다.

${commonInfo}

작성할 내용:

[제6장: 십성 분석]

일간 ${dayMaster} 기준으로 10가지 십성을 모두 분석하세요.
각 십성마다 반드시 4문장 이상 작성하세요.
중간에 끊지 말고 10가지 모두 완료하세요.

▶ 비견 (比肩)
- 사주에서의 위치와 역할
- 본인에게 미치는 영향
- 활용 방법
- 과다/부족 시 주의점

▶ 겁재 (劫財)
- 사주에서의 위치와 역할
- 본인에게 미치는 영향
- 활용 방법
- 과다/부족 시 주의점

▶ 식신 (食神)
- 사주에서의 위치와 역할
- 본인에게 미치는 영향
- 활용 방법
- 과다/부족 시 주의점

▶ 상관 (傷官)
- 사주에서의 위치와 역할
- 본인에게 미치는 영향
- 활용 방법
- 과다/부족 시 주의점

▶ 편재 (偏財)
- 사주에서의 위치와 역할
- 본인에게 미치는 영향
- 활용 방법
- 과다/부족 시 주의점

▶ 정재 (正財)
- 사주에서의 위치와 역할
- 본인에게 미치는 영향
- 활용 방법
- 과다/부족 시 주의점

▶ 편관 (偏官)
- 사주에서의 위치와 역할
- 본인에게 미치는 영향
- 활용 방법
- 과다/부족 시 주의점

▶ 정관 (正官)
- 사주에서의 위치와 역할
- 본인에게 미치는 영향
- 활용 방법
- 과다/부족 시 주의점

▶ 편인 (偏印)
- 사주에서의 위치와 역할
- 본인에게 미치는 영향
- 활용 방법
- 과다/부족 시 주의점

▶ 정인 (正印)
- 사주에서의 위치와 역할
- 본인에게 미치는 영향
- 활용 방법
- 과다/부족 시 주의점

마지막에 "십성 종합 정리"를 7문장 이상으로 마무리하세요.

${HTML_GUIDE}

⚠️ 6장만 작성! 10개 십성 모두 완료!
⚠️ 마크다운 코드블록 금지!
⚠️ 바로 h2부터 시작!`

    // ========== Part 6: 대운 (현재~미래) ==========
    const prompt6 = `당신은 자평명리학 40년 경력의 최고 전문 상담사입니다.

${commonInfo}

작성할 내용:

[제7장: 대운 흐름 (현재 및 미래 중심)]

⚠️ 매우 중요: 과거 대운은 다루지 마세요! 과거는 이미 제2장에서 다뤘습니다.
⚠️ 반드시 현재 대운부터 시작해서 미래 대운만 분석하세요.

▶ 현재 대운 (만 ${age}세 / ${currentYear}년 기준)
- 현재 어떤 대운에 있는지 (천간/지지)
- 이 대운의 핵심 의미와 특징
- 일간 ${dayMaster}와의 관계
- 이 대운에서 강해지는 영역
- 이 대운에서 약해지는 영역
- 현재 시점의 중요 포인트
- 이 대운에서 반드시 해야 할 것 5가지
- 이 대운에서 피해야 할 것 3가지
(15문장 이상)

▶ 다음 대운 (10년 후)
- 다음에 올 대운 (천간/지지)
- 핵심 변화와 의미
- 인생 흐름의 변화
- 준비해야 할 것
- 기대할 수 있는 것
(10문장 이상)

▶ 그 다음 대운 (20년 후)
- 그 다음 대운 (천간/지지)
- 노년기 진입 시 흐름
- 인생 후반의 색채
(8문장 이상)

▶ 인생 전체 대운 흐름
- 지금부터 80세까지의 큰 흐름
- 가장 좋은 대운 시기
- 가장 조심해야 할 대운 시기

${HTML_GUIDE}

⚠️ 7장만 작성!
⚠️ 과거 대운은 다루지 말 것!
⚠️ 마크다운 코드블록 금지!
⚠️ 바로 h2부터 시작!`

    // ========== Part 7: 올해 운세 ==========
    const prompt7 = `당신은 자평명리학 40년 경력의 최고 전문 상담사입니다.

${commonInfo}

작성할 내용:

[제8장: ${currentYear}년 올해의 운세 (올해만 집중!)]

⚠️ 이번 장에서는 ${currentYear}년만 다룹니다.

▶ ${currentYear}년 세운 분석
- 올해 세운 (천간/지지) 분석
- 일간 ${dayMaster}와의 관계
- 올해의 핵심 에너지
(7문장 이상)

▶ 월별 운세 흐름 (${currentMonth}월 ~ 12월)
각 월마다:
- 그 달의 운세 (좋음/평범/주의)
- 핵심 키워드
- 추천 활동
- 주의사항
(각 월마다 5문장 이상)

▶ 올해 핵심 키워드 3가지
▶ 올해 반드시 해야 할 것 5가지
▶ 올해 하지 말아야 할 것 3가지
▶ 올해 좋은 달 / 주의할 달 정리

${HTML_GUIDE}

⚠️ 8장만 작성! 올해(${currentYear}년)만!
⚠️ 마크다운 코드블록 금지!
⚠️ 바로 h2부터 시작!`

    // ========== Part 8: 내년+내후년 ==========
    const prompt8 = `당신은 자평명리학 40년 경력의 최고 전문 상담사입니다.

${commonInfo}

작성할 내용:

[제9장: ${currentYear + 1}년~${currentYear + 2}년 향후 운세]

▶ ${currentYear + 1}년 운세 전망
- ${currentYear + 1}년 세운 분석 (천간/지지)
- 핵심 에너지와 흐름
- 주요 변화 예측
- 좋은 분기 / 주의할 분기
- 추천 활동
- 피해야 할 것
(15문장 이상)

▶ ${currentYear + 2}년 운세 전망
- ${currentYear + 2}년 세운 분석 (천간/지지)
- 핵심 에너지와 흐름
- 주요 변화 예측
- 좋은 분기 / 주의할 분기
- 추천 활동
- 피해야 할 것
(15문장 이상)

▶ 향후 2년간 종합 전략
- 어떤 흐름으로 인생을 운영해야 하는지
- 중장기 목표 설정 가이드
- 인간관계 전략
- 재정/사업 전략
- 건강 관리 전략

${HTML_GUIDE}

⚠️ 9장만 작성!
⚠️ 마크다운 코드블록 금지!
⚠️ 바로 h2부터 시작!`

    // ========== Part 9: 맞춤 분석 ==========
    const prompt9 = `당신은 자평명리학 40년 경력의 최고 전문 상담사입니다.

${commonInfo}

작성할 내용:

[제10장: ${CATEGORY_KO[category] || '종합'} 분야 맞춤 심층 분석]

고객의 상담 분야인 "${CATEGORY_KO[category] || '종합'}"에 대한 매우 깊이 있는 분석:

▶ 사주에서 본 ${CATEGORY_KO[category] || '종합'} 운
- 이 사주가 해당 분야에서 어떤 특성을 가지는지
- 강점과 약점

▶ 시기별 흐름
- 현재 시점의 운세
- 향후 1~3년 흐름
- 구체적 시기 명시

${question ? `▶ 고객 질문 답변: "${question}"
- 사주 근거를 명시한 구체적 답변
- 시기별 (연운/월운) 분석
- 실행 전략 7가지` : '▶ 종합 전략'}

▶ 실행 가능한 구체적 전략 10가지

▶ 주의사항 5가지

(전체 25문장 이상)

${HTML_GUIDE}

⚠️ 10장만 작성!
⚠️ 마크다운 코드블록 금지!
⚠️ 바로 h2부터 시작!`

    // ========== Part 10: 인생 로드맵 + 종합 조언 ==========
    const prompt10 = `당신은 자평명리학 40년 경력의 최고 전문 상담사입니다.

${commonInfo}

작성할 내용:

[제11장: 인생 로드맵]

▶ 현재 ~ 40대
- 이 시기의 핵심 과제 (7문장 이상)
- 집중해야 할 것
- 피해야 할 것

▶ 40대 ~ 50대
- 인생 전환점 (7문장 이상)
- 준비해야 할 것
- 기회 영역

▶ 50대 ~ 60대
- 안정과 도약의 시기 (7문장 이상)
- 사회적 역할
- 가족 관계 운영

▶ 60대 이후
- 노후 설계 (7문장 이상)
- 가족과 건강
- 정신적 풍요

[제12장: 종합 조언과 마무리]

▶ 이 사주의 가장 큰 축복 3가지
- 각각 5문장 이상으로 상세하게

▶ 인생에서 가장 주의해야 할 점 3가지
- 각각 5문장 이상으로 상세하게

▶ 실행 가능한 핵심 조언 7가지
- 각 조언별 구체적 방법 제시

▶ 따뜻한 격려와 응원 메시지
- 감동적이고 진심 어린 메시지 (10문장 이상)
- 고객의 인생을 응원하는 마음
- 사주의 가능성을 강조

${HTML_GUIDE}

⚠️ 11~12장 모두 작성!
⚠️ 마크다운 코드블록 금지!
⚠️ 바로 h2부터 시작!`

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!.trim(),
    })

    // 10번 호출
    console.log('🤖 1/10: 사주 원국 + 과거')
    const m1 = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt1 }],
    })
    const part1 = cleanHtml(m1.content[0].type === 'text' ? m1.content[0].text : '')
    console.log('✅ 1/10 완료, 길이:', part1.length)

    console.log('🤖 2/10: 육친 관계')
    const m2 = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt2 }],
    })
    const part2 = cleanHtml(m2.content[0].type === 'text' ? m2.content[0].text : '')
    console.log('✅ 2/10 완료, 길이:', part2.length)

    console.log('🤖 3/10: 건강·체질')
    const m3 = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt3 }],
    })
    const part3 = cleanHtml(m3.content[0].type === 'text' ? m3.content[0].text : '')
    console.log('✅ 3/10 완료, 길이:', part3.length)

    console.log('🤖 4/10: 격국·용신')
    const m4 = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt4 }],
    })
    const part4 = cleanHtml(m4.content[0].type === 'text' ? m4.content[0].text : '')
    console.log('✅ 4/10 완료, 길이:', part4.length)

    console.log('🤖 5/10: 십성 (10가지)')
    const m5 = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt5 }],
    })
    const part5 = cleanHtml(m5.content[0].type === 'text' ? m5.content[0].text : '')
    console.log('✅ 5/10 완료, 길이:', part5.length)

    console.log('🤖 6/10: 대운 흐름')
    const m6 = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt6 }],
    })
    const part6 = cleanHtml(m6.content[0].type === 'text' ? m6.content[0].text : '')
    console.log('✅ 6/10 완료, 길이:', part6.length)

    console.log('🤖 7/10: 올해 운세')
    const m7 = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt7 }],
    })
    const part7 = cleanHtml(m7.content[0].type === 'text' ? m7.content[0].text : '')
    console.log('✅ 7/10 완료, 길이:', part7.length)

    console.log('🤖 8/10: 내년~내후년')
    const m8 = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt8 }],
    })
    const part8 = cleanHtml(m8.content[0].type === 'text' ? m8.content[0].text : '')
    console.log('✅ 8/10 완료, 길이:', part8.length)

    console.log('🤖 9/10: 맞춤 분석')
    const m9 = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt9 }],
    })
    const part9 = cleanHtml(m9.content[0].type === 'text' ? m9.content[0].text : '')
    console.log('✅ 9/10 완료, 길이:', part9.length)

    console.log('🤖 10/10: 인생 로드맵 + 종합')
    const m10 = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt10 }],
    })
    const part10 = cleanHtml(m10.content[0].type === 'text' ? m10.content[0].text : '')
    console.log('✅ 10/10 완료, 길이:', part10.length)

    const reportHtml = part1 + part2 + part3 + part4 + part5 + part6 + part7 + part8 + part9 + part10
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
        birth_date: birthDate,
        birth_time: birthTime,
        birth_city: birthCity,
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
        saju_data: saju,
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