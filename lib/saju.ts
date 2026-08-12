// ========== 사주 계산 라이브러리 ==========

import KoreanLunarCalendar from 'korean-lunar-calendar'

const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']
const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']

const CITY_LNG: Record<string, number> = {
  // ========== 한국 - 특별시/광역시 ==========
  '서울': 126.9780,
  '부산': 129.0756,
  '대구': 128.6014,
  '인천': 126.7052,
  '광주': 126.8526,
  '대전': 127.3845,
  '울산': 129.3114,
  '세종': 127.2890,

  // ========== 한국 - 경기도 ==========
  '수원': 127.0286, '고양': 126.8350, '용인': 127.2066, '성남': 127.1266,
  '부천': 126.7660, '안산': 126.8309, '안양': 126.9569, '남양주': 127.2166,
  '화성': 126.8319, '평택': 127.1128, '의정부': 127.0338, '시흥': 126.8032,
  '파주': 126.7789, '김포': 126.7150, '광명': 126.8646, '광주(경기)': 127.2500,
  '군포': 126.9351, '오산': 127.0776, '이천': 127.4351, '양주': 127.0459,
  '안성': 127.2799, '구리': 127.1290, '포천': 127.2000, '의왕': 126.9683,
  '하남': 127.2144, '여주': 127.6394, '동두천': 127.0605, '가평': 127.5099,
  '연천': 127.0748, '양평': 127.4874, '과천': 126.9878,

  // ========== 한국 - 강원도 ==========
  '춘천': 127.7342, '원주': 127.9202, '강릉': 128.8761, '동해': 129.1146,
  '태백': 128.9855, '속초': 128.5911, '삼척': 129.1653, '홍천': 127.8886,
  '횡성': 127.9856, '영월': 128.4614, '평창': 128.3900, '정선': 128.6608,
  '철원': 127.3130, '화천': 127.7080, '양구': 127.9908, '인제': 128.1704,
  '고성(강원)': 128.4676, '양양': 128.6191,

  // ========== 한국 - 충청북도 ==========
  '청주': 127.4890, '충주': 127.9260, '제천': 128.1908, '보은': 127.7297,
  '옥천': 127.5719, '영동': 127.7834, '증평': 127.5813, '진천': 127.4353,
  '괴산': 127.7867, '음성': 127.6864, '단양': 128.3660,

  // ========== 한국 - 충청남도 ==========
  '천안': 127.1139, '공주': 127.1189, '보령': 126.6127, '아산': 126.9997,
  '서산': 126.4501, '논산': 127.0989, '계룡': 127.2489, '당진': 126.6280,
  '금산': 127.4881, '부여': 126.9095, '서천': 126.6912, '청양': 126.8025,
  '홍성': 126.6608, '예산': 126.8447, '태안': 126.2980,

  // ========== 한국 - 전라북도 ==========
  '전주': 127.1480, '군산': 126.7367, '익산': 126.9575, '정읍': 126.8560,
  '남원': 127.3902, '김제': 126.8807, '완주': 127.1621, '진안': 127.4249,
  '무주': 127.6607, '장수': 127.5210, '임실': 127.2894, '순창': 127.1373,
  '고창': 126.7020, '부안': 126.7331,

  // ========== 한국 - 전라남도 ==========
  '목포': 126.3922, '여수': 127.6622, '순천': 127.4872, '나주': 126.7108,
  '광양': 127.6957, '담양': 126.9884, '곡성': 127.2921, '구례': 127.4636,
  '고흥': 127.2853, '보성': 127.0800, '화순': 126.9862, '장흥': 126.9066,
  '강진': 126.7674, '해남': 126.5989, '영암': 126.6969, '무안': 126.4813,
  '함평': 126.5169, '영광': 126.5119, '장성': 126.7845, '완도': 126.7550,
  '진도': 126.2634, '신안': 126.1057,

  // ========== 한국 - 경상북도 ==========
  '포항': 129.3435, '경주': 129.2247, '김천': 128.1136, '안동': 128.7294,
  '구미': 128.3441, '영주': 128.6238, '영천': 128.9384, '상주': 128.1591,
  '문경': 128.1867, '경산': 128.7411, '군위': 128.5730, '의성': 128.6971,
  '청송': 129.0570, '영양': 129.1122, '영덕': 129.3654, '청도': 128.7343,
  '고령': 128.2628, '성주': 128.2830, '칠곡': 128.4014, '예천': 128.4551,
  '봉화': 128.7326, '울진': 129.4005, '울릉': 130.9060,

  // ========== 한국 - 경상남도 ==========
  '창원': 128.6811, '진주': 128.1076, '통영': 128.4331, '사천': 128.0642,
  '김해': 128.8890, '밀양': 128.7469, '거제': 128.6212, '양산': 129.0378,
  '의령': 128.2617, '함안': 128.4064, '창녕': 128.4923, '고성(경남)': 128.3239,
  '남해': 127.8925, '하동': 127.7514, '산청': 127.8734, '함양': 127.7250,
  '거창': 127.9098, '합천': 128.1656,

  // ========== 한국 - 제주도 ==========
  '제주': 126.5312, '서귀포': 126.5601,

  // ========== 일본 ==========
  '도쿄': 139.6917, '요코하마': 139.6425, '오사카': 135.5023, '나고야': 136.9066,
  '삿포로': 141.3469, '고베': 135.1955, '교토': 135.7681, '후쿠오카': 130.4181,
  '히로시마': 132.4553, '센다이': 140.8721, '가와사키': 139.7028, '사이타마': 139.6455,
  '기타큐슈': 130.8752, '치바': 140.1234, '카나자와': 136.6255, '나가사키': 129.8779,
  '오키나와': 127.6809, '나라': 135.8048, '오이타': 131.6127, '가고시마': 130.5581,

  // ========== 중국 ==========
  '베이징': 116.4074, '상하이': 121.4737, '광저우': 113.2644, '선전': 114.0579,
  '충칭': 106.5516, '톈진': 117.2010, '청두': 104.0668, '난징': 118.7969,
  '항저우': 120.1551, '우한': 114.3055, '시안': 108.9402, '쑤저우': 120.5853,
  '샤먼': 118.0894, '창사': 112.9388, '따롄': 121.6147, '칭다오': 120.3826,
  '지난': 116.9970, '선양': 123.4315, '하얼빈': 126.5343, '쿤밍': 102.7333,
  '홍콩': 114.1694, '마카오': 113.5439, '타이베이': 121.5654,
  '가오슝': 120.3010, '타이중': 120.6736,

  // ========== 동남아시아 ==========
  '방콕': 100.5018, '치앙마이': 98.9853, '푸켓': 98.3923,
  '싱가포르': 103.8198,
  '쿠알라룸푸르': 101.6869, '조호르바루': 103.7414, '페낭': 100.3300,
  '자카르타': 106.8451, '수라바야': 112.7521, '발리': 115.0920, '반둥': 107.6098,
  '하노이': 105.8342, '호치민': 106.6597, '다낭': 108.2022, '나짱': 109.1967,
  '마닐라': 120.9842, '세부': 123.8854, '다바오': 125.6144,
  '프놈펜': 104.9160, '시엠립': 103.8480,
  '비엔티안': 102.6331, '루앙프라방': 102.1351,
  '양곤': 96.1735, '만달레이': 96.0891,

  // ========== 인도/중앙아시아 ==========
  '뉴델리': 77.2090, '뭄바이': 72.8777, '벵갈루루': 77.5946, '콜카타': 88.3639,
  '첸나이': 80.2707, '하이데라바드': 78.4867, '푸네': 73.8567,
  '카트만두': 85.3240, '다카': 90.4125, '콜롬보': 79.8612,

  // ========== 미국 ==========
  '뉴욕': -74.0060, '로스앤젤레스': -118.2437, '시카고': -87.6298,
  '샌프란시스코': -122.4194, '시애틀': -122.3321, '워싱턴': -77.0369,
  '보스턴': -71.0589, '휴스턴': -95.3698, '애틀랜타': -84.3880,
  '라스베가스': -115.1398, '마이애미': -80.1918, '덴버': -104.9903,
  '피닉스': -112.0740, '샌디에고': -117.1611, '댈러스': -96.7970,
  '필라델피아': -75.1652, '디트로이트': -83.0458, '미니애폴리스': -93.2650,
  '올랜도': -81.3792, '뉴올리언스': -90.0715, '포틀랜드': -122.6784,
  '하와이(호놀룰루)': -157.8583, '알래스카(앵커리지)': -149.9003,

  // ========== 캐나다 ==========
  '토론토': -79.3832, '밴쿠버': -123.1207, '몬트리올': -73.5673,
  '캘거리': -114.0719, '오타와': -75.6972, '에드먼턴': -113.4938,
  '위니펙': -97.1385, '퀘벡': -71.2080, '핼리팩스': -63.5752,

  // ========== 유럽 ==========
  '런던': -0.1276, '맨체스터': -2.2426, '에든버러': -3.1883, '리버풀': -2.9916,
  '파리': 2.3522, '마르세유': 5.3698, '리옹': 4.8357, '니스': 7.2620,
  '베를린': 13.4050, '뮌헨': 11.5820, '함부르크': 9.9937, '프랑크푸르트': 8.6821,
  '쾰른': 6.9603, '뒤셀도르프': 6.7735,
  '로마': 12.4964, '밀라노': 9.1900, '나폴리': 14.2681, '베네치아': 12.3155,
  '피렌체': 11.2558, '토리노': 7.6869,
  '마드리드': -3.7038, '바르셀로나': 2.1734, '세비야': -5.9845, '발렌시아': -0.3763,
  '암스테르담': 4.9041, '로테르담': 4.4777, '헤이그': 4.3007,
  '비엔나': 16.3738, '잘츠부르크': 13.0550, '인스브루크': 11.4041,
  '취리히': 8.5417, '제네바': 6.1432, '베른': 7.4474, '루체른': 8.3093,
  '브뤼셀': 4.3517, '앤트워프': 4.4025,
  '스톡홀름': 18.0686, '고텐부르크': 11.9746, '말뫼': 13.0038,
  '코펜하겐': 12.5683, '오슬로': 10.7522, '헬싱키': 24.9384,
  '더블린': -6.2603, '리스본': -9.1393, '포르투': -8.6291,
  '아테네': 23.7275, '이스탄불': 28.9784, '앙카라': 32.8541,
  '프라하': 14.4378, '부다페스트': 19.0402, '바르샤바': 21.0122,
  '모스크바': 37.6173, '상트페테르부르크': 30.3609, '블라디보스토크': 131.8815,

  // ========== 호주/뉴질랜드/오세아니아 ==========
  '시드니': 151.2093, '멜버른': 144.9631, '브리즈번': 153.0251,
  '퍼스': 115.8605, '애들레이드': 138.6007, '골드코스트': 153.4000,
  '캔버라': 149.1300, '호바트': 147.3272, '다윈': 130.8456,
  '오클랜드': 174.7645, '웰링턴': 174.7787, '크라이스트처치': 172.6362,
  '괌': 144.7937, '피지(수바)': 178.4419,

  // ========== 중동 ==========
  '두바이': 55.2708, '아부다비': 54.3773, '도하': 51.5310,
  '리야드': 46.6753, '제다': 39.1728, '테헤란': 51.3890,
  '예루살렘': 35.2137, '텔아비브': 34.7818,
  '이스탄불2': 28.9784, '앙카라2': 32.8541,
  '카이로': 31.2357, '알렉산드리아': 29.9187, '베이루트': 35.5018,
  '암만': 35.9284, '바그다드': 44.3661,

  // ========== 남미 ==========
  '상파울루': -46.6333, '리우데자네이루': -43.1729, '브라질리아': -47.9292,
  '살바도르': -38.5108, '벨루오리존치': -43.9378,
  '부에노스아이레스': -58.3816, '코르도바': -64.1888, '멘도사': -68.8272,
  '리마': -77.0428, '쿠스코': -71.9675, '아레키파': -71.5375,
  '보고타': -74.0721, '메데인': -75.5636, '카르타헤나': -75.5144,
  '카라카스': -66.9036, '키토': -78.4678, '라파스': -68.1193,
  '산티아고': -70.6693, '발파라이소': -71.6127,
  '아순시온': -57.5759, '몬테비데오': -56.1645,

  // ========== 아프리카 ==========
  '카이로2': 31.2357,
  '요하네스버그': 28.0473, '케이프타운': 18.4241, '더반': 31.0218,
  '나이로비': 36.8172, '아디스아바바': 38.7578, '카사블랑카': -7.5898,
  '라고스': 3.3792, '아부자': 7.4877, '아크라': -0.1870,
  '다르에스살람': 39.2083, '캄팔라': 32.5825, '루안다': 13.2343,
  '알제': 3.0588, '튀니스': 10.1815, '트리폴리': 13.1913,
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