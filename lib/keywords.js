// 추적할 시술 목록. terms는 네이버 검색어 묶음(같은 시술의 다른 표기).
// anchor: 모든 수치의 기준점. 데이터랩은 요청마다 0~100으로 따로 정규화하기 때문에
// 매 요청에 기준 시술을 끼워 넣고 "기준 시술 평균 = 100"으로 다시 맞춘다.
module.exports = [
  // 주사·쁘띠
  { id: 'botox', name: '보톡스', category: '주사·쁘띠', terms: ['보톡스'], anchor: true },
  { id: 'filler', name: '필러', category: '주사·쁘띠', terms: ['필러시술', '필러가격', '코필러', '입술필러', '이마필러', '턱필러'] },
  { id: 'jawbotox', name: '사각턱보톡스', category: '주사·쁘띠', terms: ['사각턱보톡스', '턱보톡스'] },
  { id: 'contour', name: '윤곽주사', category: '주사·쁘띠', terms: ['윤곽주사'] },
  { id: 'fatdissolve', name: '지방분해주사', category: '주사·쁘띠', terms: ['지방분해주사'] },
  { id: 'sculptra', name: '스컬트라', category: '주사·쁘띠', terms: ['스컬트라'] },
  { id: 'ellanse', name: '엘란쎄', category: '주사·쁘띠', terms: ['엘란쎄'] },
  { id: 'radiesse', name: '레디어스', category: '주사·쁘띠', terms: ['레디어스'] },
  { id: 'rituo', name: '리투오', category: '주사·쁘띠', terms: ['리투오'] },
  // 스킨부스터
  { id: 'skinbooster', name: '스킨부스터', category: '스킨부스터', terms: ['스킨부스터'] },
  { id: 'rejuran', name: '리쥬란', category: '스킨부스터', terms: ['리쥬란', '리쥬란힐러'] },
  { id: 'juvelook', name: '쥬베룩', category: '스킨부스터', terms: ['쥬베룩', '쥬베룩볼륨'] },
  { id: 'skinbotox', name: '스킨보톡스', category: '스킨부스터', terms: ['스킨보톡스'] },
  { id: 'exosome', name: '엑소좀', category: '스킨부스터', terms: ['엑소좀주사', '엑소좀시술'] },
  { id: 'mulgwang', name: '물광주사', category: '스킨부스터', terms: ['물광주사'] },
  { id: 'salmon', name: '연어주사(PN)', category: '스킨부스터', terms: ['연어주사', 'PN주사'] },
  { id: 'pdrn', name: 'PDRN', category: '스킨부스터', terms: ['PDRN주사', 'PDRN시술'] },
  { id: 'chanel', name: '샤넬주사', category: '스킨부스터', terms: ['샤넬주사'] },
  { id: 'profhilo', name: '프로파일로', category: '스킨부스터', terms: ['프로파일로'] },
  { id: 'skinvive', name: '스킨바이브', category: '스킨부스터', terms: ['스킨바이브'] },
  { id: 'celldm', name: '셀르디엠', category: '스킨부스터', terms: ['셀르디엠'] },
  { id: 'lilyid', name: '릴리이드', category: '스킨부스터', terms: ['릴리이드'] },
  // 리프팅
  { id: 'ulthera', name: '울쎄라', category: '리프팅', terms: ['울쎄라'] },
  { id: 'thermage', name: '써마지', category: '리프팅', terms: ['써마지', '써마지FLX'] },
  { id: 'shurink', name: '슈링크', category: '리프팅', terms: ['슈링크', '슈링크유니버스'] },
  { id: 'onda', name: '온다리프팅', category: '리프팅', terms: ['온다리프팅'] },
  { id: 'inmode', name: '인모드', category: '리프팅', terms: ['인모드'] },
  { id: 'titanium', name: '티타늄리프팅', category: '리프팅', terms: ['티타늄리프팅'] },
  { id: 'oligio', name: '올리지오', category: '리프팅', terms: ['올리지오'] },
  { id: 'volnewmer', name: '볼뉴머', category: '리프팅', terms: ['볼뉴머'] },
  { id: 'tensurma', name: '텐써마', category: '리프팅', terms: ['텐써마'] },
  { id: 'density', name: '덴서티', category: '리프팅', terms: ['덴서티리프팅'] },
  { id: 'sofwave', name: '소프웨이브', category: '리프팅', terms: ['소프웨이브'] },
  { id: 'ultraformer', name: '울트라포머', category: '리프팅', terms: ['울트라포머'] },
  { id: 'linearz', name: '리니어지', category: '리프팅', terms: ['리니어지'] },
  { id: 'xerf', name: '세르프', category: '리프팅', terms: ['세르프리프팅', '세르프'] },
  { id: 'tuneface', name: '튠페이스', category: '리프팅', terms: ['튠페이스'] },
  { id: 'vro', name: '브이로', category: '리프팅', terms: ['브이로리프팅'] },
  { id: 'doublo', name: '더블로', category: '리프팅', terms: ['더블로리프팅'] },
  { id: 'thread', name: '실리프팅', category: '리프팅', terms: ['실리프팅'] },
  { id: 'mint', name: '민트실', category: '리프팅', terms: ['민트실'] },
  // 색소·레이저
  { id: 'pico', name: '피코토닝', category: '색소·레이저', terms: ['피코토닝', '피코슈어'] },
  { id: 'lasertoning', name: '레이저토닝', category: '색소·레이저', terms: ['레이저토닝'] },
  { id: 'excelv', name: '엑셀V', category: '색소·레이저', terms: ['엑셀브이', '엑셀V'] },
  { id: 'clarity', name: '클라리티', category: '색소·레이저', terms: ['클라리티레이저'] },
  { id: 'revlite', name: '레블라이트', category: '색소·레이저', terms: ['레블라이트'] },
  { id: 'ipl', name: 'IPL', category: '색소·레이저', terms: ['IPL시술', 'IPL레이저'] },
  { id: 'melasma', name: '기미레이저', category: '색소·레이저', terms: ['기미레이저'] },
  { id: 'fraxel', name: '프락셀', category: '색소·레이저', terms: ['프락셀'] },
  { id: 'co2', name: 'CO2레이저', category: '색소·레이저', terms: ['CO2레이저'] },
  { id: 'vbeam', name: '브이빔', category: '색소·레이저', terms: ['브이빔'] },
  // 여드름·모공
  { id: 'potenza', name: '포텐자', category: '여드름·모공', terms: ['포텐자'] },
  { id: 'secret', name: '시크릿 레이저', category: '여드름·모공', terms: ['시크릿레이저'] },
  { id: 'agnes', name: '아그네스', category: '여드름·모공', terms: ['아그네스시술', '아그네스여드름'] },
  { id: 'sylfirm', name: '실펌', category: '여드름·모공', terms: ['실펌'] },
  { id: 'aquapeel', name: '아쿠아필', category: '여드름·모공', terms: ['아쿠아필'] },
  { id: 'lalapeel', name: '라라필', category: '여드름·모공', terms: ['라라필'] },
  // 제모·바디
  { id: 'hairremoval', name: '레이저 제모', category: '제모·바디', terms: ['레이저제모', '겨드랑이제모'] },
  { id: 'gentlemax', name: '젠틀맥스', category: '제모·바디', terms: ['젠틀맥스'] },
  { id: 'bodybotox', name: '바디보톡스', category: '제모·바디', terms: ['바디보톡스', '승모근보톡스'] },
  { id: 'carboxy', name: '카복시', category: '제모·바디', terms: ['카복시주사', '카복시테라피'] },
  { id: 'coolsculpt', name: '쿨스컬프팅', category: '제모·바디', terms: ['쿨스컬프팅'] },
];

// 관심층 비교용 구간 (데이터랩 ages 코드: 3=19~24, 4=25~29 ... 11=60+)
module.exports.SEGMENTS = [
  { id: 'f20', label: '여성 20대', gender: 'f', ages: ['3', '4'] },
  { id: 'f30', label: '여성 30대', gender: 'f', ages: ['5', '6'] },
  { id: 'f40', label: '여성 40대', gender: 'f', ages: ['7', '8'] },
  { id: 'f50', label: '여성 50대+', gender: 'f', ages: ['9', '10', '11'] },
  { id: 'm', label: '남성 전체', gender: 'm', ages: null },
];

// 업계 뉴스 고정 검색어
module.exports.NEWS_QUERIES = ['피부과 신규 장비', '미용 의료기기 허가', '스킨부스터 출시', '리프팅 장비 출시'];
