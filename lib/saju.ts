// ========== 사주 계산 라이브러리 ==========

import KoreanLunarCalendar from 'korean-lunar-calendar'

const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']
const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']

const CITY_LNG: Record<string, number> = {
  // 한국
  '서울': 126.978, '부산': 129.076, '대구': 128.601,
  '인천': 126.705, '광주': 126.853, '대전': 127.385,
  '울산': 129.311, '세종': 127.289, '수원': 127.029,
  '제주': 126.531, '춘천': 127.734, '강릉': 128.876,
  '전주': 127.148, '청주': 127.489, '창원': 128.681,
  '포항': 129.344, '목포': 126.392, '여수': 127.662,
  '안동': 128.729, '진주': 128.108,
  
  // 일본
  '도쿄': 139.692, '오사카': 135.502, '교토': 135.768,
  '나고야': 136.907, '삿포로': 141.347, '후쿠오카': 130.418,
  
  // 중국
  '베이징': 116.407, '상하이': 121.474, '광저우': 113.265,
  '선전': 114.058, '청두': 104.066, '시안': 108.948,
  '홍콩': 114.169, '타이베이': 121.565,
  
  // 동남아
  '방콕': 100.501, '싱가포르': 103.819, '쿠알라룸푸르': 101.687,
  '자카르타': 106.845, '하노이': 105.804, '호치민': 106.660,
  '마닐라': 120.984, '프놈펜': 104.916,
  
  // 미국 (주요 도시)
  '뉴욕': -74.006, '로스앤젤레스': -118.244, '시카고': -87.630,
  '샌프란시스코': -122.419, '시애틀': -122.332, '워싱턴': -77.037,
  '보스턴': -71.058, '휴스턴': -95.370, '애틀랜타': -84.388,
  '라스베가스': -115.139, '하와이': -157.858,
  
  // 캐나다
  '토론토': -79.383, '밴쿠버': -123.121, '몬트리올': -73.567,
  '캘거리': -114.071,
  
  // 유럽
  '런던': -0.128, '파리': 2.349, '베를린': 13.405,
  '로마': 12.496, '마드리드': -3.703, '암스테르담': 4.900,
  '비엔나': 16.373, '취리히': 8.541, '스톡홀름': 18.069,
  '모스크바': 37.617, '이스탄불': 28.978,
  
  // 호주/뉴질랜드
  '시드니': 151.209, '멜버른': 144.963, '브리즈번': 153.025,
  '오클랜드': 174.764,
  
  // 중동
  '두바이': 55.296, '도하': 51.531, '리야드': 46.738,
  '이스탄불2': 28.978, '테헤란': 51.389,
  
  // 인도/중앙아
  '뉴델리': 77.209, '뭄바이': 72.877, '벵갈루루': 77.594,
  
  // 남미
  '상파울루': -46.633, '리우데자네이루': -43.196,
  '부에노스아이레스': -58.382, '리마': -77.043,
  
  // 아프리카
  '카이로': 31.235, '요하네스버그': 28.034, '나이로비': 36.821,
}

// ========== 음력 → 양력 변환 ==========
export function lunarToSolar(year: number, month: number, day: number, isLeapMonth: boolean = false): {
  year: number
  month: number
  day: number
} {
  try {
    const calendar = new KoreanLunarCalendar()
    calendar.setLunarDate(year, month, day, isLeapMonth)
    const solar = calendar.getSolarCalendar()
    return {
      year: solar.year,
      month: solar.month,
      day: solar.day,
    }
  } catch (err) {
    console.error('음력 변환 오류:', err)
    return { year, month, day }
  }
}

// ========== 절기 데이터 ==========
const SOLAR_TERMS: Record<number, Record<number, { day: number; hour: number; minute: number }>> = {
  1970: { 2:{day:4,hour:13,minute:46}, 3:{day:6,hour:7,minute:59}, 4:{day:5,hour:12,minute:45}, 5:{day:6,hour:6,minute:34}, 6:{day:6,hour:10,minute:52}, 7:{day:7,hour:21,minute:11}, 8:{day:8,hour:6,minute:54}, 9:{day:8,hour:9,minute:38}, 10:{day:9,hour:0,minute:2}, 11:{day:8,hour:2,minute:58}, 12:{day:7,hour:19,minute:38}, 1:{day:6,hour:6,minute:49} },
  1971: { 2:{day:4,hour:19,minute:26}, 3:{day:6,hour:13,minute:35}, 4:{day:5,hour:18,minute:36}, 5:{day:6,hour:12,minute:8}, 6:{day:6,hour:16,minute:29}, 7:{day:8,hour:2,minute:51}, 8:{day:8,hour:12,minute:40}, 9:{day:8,hour:15,minute:30}, 10:{day:9,hour:5,minute:59}, 11:{day:8,hour:8,minute:57}, 12:{day:8,hour:1,minute:36}, 1:{day:6,hour:12,minute:45} },
  1972: { 2:{day:5,hour:1,minute:20}, 3:{day:5,hour:19,minute:28}, 4:{day:5,hour:0,minute:29}, 5:{day:5,hour:18,minute:1}, 6:{day:5,hour:22,minute:22}, 7:{day:7,hour:8,minute:43}, 8:{day:7,hour:18,minute:29}, 9:{day:7,hour:21,minute:15}, 10:{day:8,hour:11,minute:42}, 11:{day:7,hour:14,minute:40}, 12:{day:7,hour:7,minute:19}, 1:{day:5,hour:18,minute:26} },
  1973: { 2:{day:4,hour:7,minute:4}, 3:{day:6,hour:1,minute:13}, 4:{day:5,hour:6,minute:14}, 5:{day:5,hour:23,minute:47}, 6:{day:6,hour:4,minute:7}, 7:{day:7,hour:14,minute:27}, 8:{day:8,hour:0,minute:13}, 9:{day:8,hour:3,minute:0}, 10:{day:8,hour:17,minute:28}, 11:{day:7,hour:20,minute:28}, 12:{day:7,hour:13,minute:11}, 1:{day:6,hour:0,minute:20} },
  1974: { 2:{day:4,hour:12,minute:59}, 3:{day:6,hour:7,minute:7}, 4:{day:5,hour:12,minute:5}, 5:{day:6,hour:5,minute:34}, 6:{day:6,hour:9,minute:52}, 7:{day:7,hour:20,minute:11}, 8:{day:8,hour:5,minute:57}, 9:{day:8,hour:8,minute:45}, 10:{day:8,hour:23,minute:15}, 11:{day:8,hour:2,minute:18}, 12:{day:7,hour:19,minute:5}, 1:{day:6,hour:6,minute:18} },
  1975: { 2:{day:4,hour:18,minute:59}, 3:{day:6,hour:13,minute:6}, 4:{day:5,hour:18,minute:2}, 5:{day:6,hour:11,minute:27}, 6:{day:6,hour:15,minute:42}, 7:{day:8,hour:1,minute:59}, 8:{day:8,hour:11,minute:45}, 9:{day:8,hour:14,minute:33}, 10:{day:9,hour:5,minute:2}, 11:{day:8,hour:8,minute:3}, 12:{day:8,hour:0,minute:46}, 1:{day:6,hour:11,minute:58} },
  1976: { 2:{day:5,hour:0,minute:40}, 3:{day:5,hour:18,minute:48}, 4:{day:4,hour:23,minute:47}, 5:{day:5,hour:17,minute:14}, 6:{day:5,hour:21,minute:31}, 7:{day:7,hour:7,minute:51}, 8:{day:7,hour:17,minute:39}, 9:{day:7,hour:20,minute:28}, 10:{day:8,hour:11,minute:0}, 11:{day:7,hour:14,minute:0}, 12:{day:7,hour:6,minute:41}, 1:{day:5,hour:17,minute:51} },
  1977: { 2:{day:4,hour:6,minute:34}, 3:{day:6,hour:0,minute:44}, 4:{day:5,hour:5,minute:46}, 5:{day:5,hour:23,minute:16}, 6:{day:6,hour:3,minute:33}, 7:{day:7,hour:13,minute:48}, 8:{day:7,hour:23,minute:30}, 9:{day:8,hour:2,minute:16}, 10:{day:8,hour:16,minute:44}, 11:{day:7,hour:19,minute:46}, 12:{day:7,hour:12,minute:31}, 1:{day:5,hour:23,minute:44} },
  1978: { 2:{day:4,hour:12,minute:27}, 3:{day:6,hour:6,minute:37}, 4:{day:5,hour:11,minute:39}, 5:{day:6,hour:5,minute:9}, 6:{day:6,hour:9,minute:23}, 7:{day:7,hour:19,minute:37}, 8:{day:8,hour:5,minute:18}, 9:{day:8,hour:8,minute:3}, 10:{day:8,hour:22,minute:31}, 11:{day:8,hour:1,minute:34}, 12:{day:7,hour:18,minute:20}, 1:{day:6,hour:5,minute:32} },
  1979: { 2:{day:4,hour:18,minute:13}, 3:{day:6,hour:12,minute:20}, 4:{day:5,hour:17,minute:18}, 5:{day:6,hour:10,minute:47}, 6:{day:6,hour:15,minute:5}, 7:{day:8,hour:1,minute:25}, 8:{day:8,hour:11,minute:11}, 9:{day:8,hour:13,minute:0}, 10:{day:9,hour:4,minute:30}, 11:{day:8,hour:7,minute:33}, 12:{day:8,hour:0,minute:18}, 1:{day:6,hour:11,minute:29} },
  1980: { 2:{day:5,hour:0,minute:10}, 3:{day:5,hour:18,minute:17}, 4:{day:4,hour:23,minute:15}, 5:{day:5,hour:16,minute:45}, 6:{day:5,hour:21,minute:4}, 7:{day:7,hour:7,minute:24}, 8:{day:7,hour:17,minute:9}, 9:{day:7,hour:19,minute:54}, 10:{day:8,hour:10,minute:19}, 11:{day:7,hour:13,minute:19}, 12:{day:7,hour:6,minute:2}, 1:{day:5,hour:17,minute:13} },
}

// ========== 시간 보정 ==========
export function correctTime(hour: number, minute: number, city: string) {
  const lng = CITY_LNG[city] || 126.978
  const correctionMinutes = (lng - 135) * 4
  let total = hour * 60 + minute + correctionMinutes
  if (total < 0) total += 1440
  if (total >= 1440) total -= 1440
  return {
    hour: Math.floor(total / 60),
    minute: Math.round(total % 60),
    correction: Math.round(correctionMinutes),
  }
}

// ========== 시지 계산 ==========
export function getTimeBranch(hour: number, minute: number): string {
  const t = hour * 60 + minute
  if (t >= 1380) return '자'
  if (t < 60) return '자'
  if (t < 180) return '축'
  if (t < 300) return '인'
  if (t < 420) return '묘'
  if (t < 540) return '진'
  if (t < 660) return '사'
  if (t < 780) return '오'
  if (t < 900) return '미'
  if (t < 1020) return '신'
  if (t < 1140) return '유'
  if (t < 1260) return '술'
  return '해'
}

// ========== 절기 기준 월/년 조정 ==========
function getAdjustedYearMonth(year: number, month: number, day: number, hour: number, minute: number) {
  const termData = SOLAR_TERMS[year]
  
  let actualMonth = month
  let actualYear = year
  
  if (termData) {
    const currentTerm = termData[month]
    
    if (currentTerm) {
      const isBeforeTerm = 
        day < currentTerm.day ||
        (day === currentTerm.day && hour < currentTerm.hour) ||
        (day === currentTerm.day && hour === currentTerm.hour && minute < currentTerm.minute)
      
      if (isBeforeTerm) {
        actualMonth = month - 1
        if (actualMonth === 0) {
          actualMonth = 12
          actualYear = year - 1
        }
      }
    }
    
    const lichun = termData[2]
    if (lichun) {
      const beforeLichun = month === 1 || (month === 2 && (
        day < lichun.day ||
        (day === lichun.day && hour < lichun.hour) ||
        (day === lichun.day && hour === lichun.hour && minute < lichun.minute)
      ))
      if (beforeLichun) {
        actualYear = year - 1
      }
    }
  } else {
    if (day < 6) {
      actualMonth = month - 1
      if (actualMonth === 0) {
        actualMonth = 12
        actualYear = year - 1
      }
    }
    if (month === 1 || (month === 2 && day < 4)) {
      actualYear = year - 1
    }
  }
  
  return { actualYear, actualMonth }
}

// ========== 년주 ==========
export function getYearPillar(year: number, month: number, day: number, hour: number, minute: number) {
  const { actualYear } = getAdjustedYearMonth(year, month, day, hour, minute)
  const stemIdx = ((actualYear - 4) % 10 + 10) % 10
  const branchIdx = ((actualYear - 4) % 12 + 12) % 12
  return {
    stem: STEMS[stemIdx],
    branch: BRANCHES[branchIdx],
    full: STEMS[stemIdx] + BRANCHES[branchIdx],
  }
}

// ========== 월주 ==========
export function getMonthPillar(year: number, month: number, day: number, hour: number, minute: number, yearStem: string) {
  const { actualMonth } = getAdjustedYearMonth(year, month, day, hour, minute)
  
  const monthBranchByMonth = ['', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해', '자']
  const monthBranch = monthBranchByMonth[actualMonth]
  
  const branchOrder: Record<string, number> = {
    '인': 0, '묘': 1, '진': 2, '사': 3, '오': 4, '미': 5,
    '신': 6, '유': 7, '술': 8, '해': 9, '자': 10, '축': 11,
  }
  
  const yearStemIdx = STEMS.indexOf(yearStem)
  const monthStemStart: Record<number, number> = {
    0: 2, 5: 2, 1: 4, 6: 4, 2: 6, 7: 6, 3: 8, 8: 8, 4: 0, 9: 0,
  }
  
  const startStem = monthStemStart[yearStemIdx] ?? 0
  const offset = branchOrder[monthBranch] ?? 0
  const stemIdx = (startStem + offset) % 10
  
  return {
    stem: STEMS[stemIdx],
    branch: monthBranch,
    full: STEMS[stemIdx] + monthBranch,
  }
}

// ========== 일주 ==========
export function getDayPillar(year: number, month: number, day: number, hour: number) {
  let adjYear = year, adjMonth = month, adjDay = day
  if (hour >= 23) {
    const next = new Date(year, month - 1, day + 1)
    adjYear = next.getFullYear()
    adjMonth = next.getMonth() + 1
    adjDay = next.getDate()
  }
  
  const baseDate = new Date(1972, 7, 25)
  const targetDate = new Date(adjYear, adjMonth - 1, adjDay)
  
  const diffMs = targetDate.getTime() - baseDate.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  const stemIdx = ((4 + diffDays) % 10 + 10) % 10
  const branchIdx = ((0 + diffDays) % 12 + 12) % 12
  
  return {
    stem: STEMS[stemIdx],
    branch: BRANCHES[branchIdx],
    full: STEMS[stemIdx] + BRANCHES[branchIdx],
  }
}

// ========== 시주 ==========
export function getHourPillar(hour: number, minute: number, dayStem: string) {
  const hourBranch = getTimeBranch(hour, minute)
  
  const dayStemIdx = STEMS.indexOf(dayStem)
  const hourStemStart: Record<number, number> = {
    0: 0, 5: 0, 1: 2, 6: 2, 2: 4, 7: 4, 3: 6, 8: 6, 4: 8, 9: 8,
  }
  
  const startStem = hourStemStart[dayStemIdx] ?? 0
  const branchIdx = BRANCHES.indexOf(hourBranch)
  const stemIdx = (startStem + branchIdx) % 10
  
  return {
    stem: STEMS[stemIdx],
    branch: hourBranch,
    full: STEMS[stemIdx] + hourBranch,
  }
}

// ========== 전체 사주 계산 (음력 자동 변환 추가!) ==========
export function calculateSaju(
  birthDate: string,
  birthTime: string,
  birthCity: string,
  calendarType: string = 'solar',
  isLeapMonth: boolean = false
) {
  const [yearStr, monthStr, dayStr] = birthDate.split('-')
  const [hourStr, minuteStr] = birthTime.split(':')
  
  let year = parseInt(yearStr)
  let month = parseInt(monthStr)
  let day = parseInt(dayStr)
  const hour = parseInt(hourStr)
  const minute = parseInt(minuteStr)
  
  // ⭐ 음력이면 양력으로 변환!
  if (calendarType === 'lunar') {
    console.log(`📅 음력 입력: ${year}-${month}-${day} (윤달: ${isLeapMonth})`)
    const solar = lunarToSolar(year, month, day, isLeapMonth)
    year = solar.year
    month = solar.month
    day = solar.day
    console.log(`📅 양력 변환: ${year}-${month}-${day}`)
  }
  
  // 시간 보정
  const corrected = correctTime(hour, minute, birthCity)
  
  // 사주 계산
  const yearPillar = getYearPillar(year, month, day, corrected.hour, corrected.minute)
  const monthPillar = getMonthPillar(year, month, day, corrected.hour, corrected.minute, yearPillar.stem)
  const dayPillar = getDayPillar(year, month, day, corrected.hour)
  const hourPillar = getHourPillar(corrected.hour, corrected.minute, dayPillar.stem)
  
  return {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
    dayMaster: dayPillar.stem,
    correction: corrected,
    rawTime: { hour, minute },
    convertedDate: calendarType === 'lunar' ? `${year}-${month}-${day}` : null,
  }
}

// ========== 오행 정보 ==========
const STEM_ELEMENTS: Record<string, { element: string; yinyang: string }> = {
  '갑': { element: '목', yinyang: '양' }, '을': { element: '목', yinyang: '음' },
  '병': { element: '화', yinyang: '양' }, '정': { element: '화', yinyang: '음' },
  '무': { element: '토', yinyang: '양' }, '기': { element: '토', yinyang: '음' },
  '경': { element: '금', yinyang: '양' }, '신': { element: '금', yinyang: '음' },
  '임': { element: '수', yinyang: '양' }, '계': { element: '수', yinyang: '음' },
}

const BRANCH_ELEMENTS: Record<string, { element: string; yinyang: string }> = {
  '자': { element: '수', yinyang: '양' }, '축': { element: '토', yinyang: '음' },
  '인': { element: '목', yinyang: '양' }, '묘': { element: '목', yinyang: '음' },
  '진': { element: '토', yinyang: '양' }, '사': { element: '화', yinyang: '음' },
  '오': { element: '화', yinyang: '양' }, '미': { element: '토', yinyang: '음' },
  '신': { element: '금', yinyang: '양' }, '유': { element: '금', yinyang: '음' },
  '술': { element: '토', yinyang: '양' }, '해': { element: '수', yinyang: '음' },
}

export function getElementInfo(stem: string, branch: string) {
  return {
    stem: STEM_ELEMENTS[stem],
    branch: BRANCH_ELEMENTS[branch],
  }
}

// ========== 사주 텍스트 (음력 변환 정보 포함) ==========
export function getSajuText(
  birthDate: string,
  birthTime: string,
  birthCity: string,
  calendarType: string = 'solar',
  isLeapMonth: boolean = false
): string {
  const saju = calculateSaju(birthDate, birthTime, birthCity, calendarType, isLeapMonth)
  const yearElem = getElementInfo(saju.year.stem, saju.year.branch)
  const monthElem = getElementInfo(saju.month.stem, saju.month.branch)
  const dayElem = getElementInfo(saju.day.stem, saju.day.branch)
  const hourElem = getElementInfo(saju.hour.stem, saju.hour.branch)
  
  const lunarNote = saju.convertedDate
    ? `\n- 음력 ${birthDate} → 양력 ${saju.convertedDate} 변환 후 계산`
    : ''
  
  return `
[사주 원국]
- 년주: ${saju.year.full} (${yearElem.stem.element}${yearElem.stem.yinyang}/${yearElem.branch.element}${yearElem.branch.yinyang})
- 월주: ${saju.month.full} (${monthElem.stem.element}${monthElem.stem.yinyang}/${monthElem.branch.element}${monthElem.branch.yinyang})
- 일주: ${saju.day.full} (${dayElem.stem.element}${dayElem.stem.yinyang}/${dayElem.branch.element}${dayElem.branch.yinyang}) ⭐ 일간 = ${saju.day.stem}
- 시주: ${saju.hour.full} (${hourElem.stem.element}${hourElem.stem.yinyang}/${hourElem.branch.element}${hourElem.branch.yinyang})

[핵심]
- 일간(日干): ${saju.day.stem}(${dayElem.stem.element} ${dayElem.stem.yinyang})  ← 본인을 나타냄
- 일지(日支): ${saju.day.branch}(${dayElem.branch.element} ${dayElem.branch.yinyang})  ← 배우자궁
- 입력시각: ${String(saju.rawTime.hour).padStart(2,'0')}:${String(saju.rawTime.minute).padStart(2,'0')}
- 시간 보정: ${saju.correction.correction}분 (보정 후 ${String(saju.correction.hour).padStart(2,'0')}:${String(saju.correction.minute).padStart(2,'0')})${lunarNote}
`.trim()
}