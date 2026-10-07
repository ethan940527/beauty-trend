// 추적할 시술 목록. terms는 네이버 검색어 묶음(같은 시술의 다른 표기).
// anchor: 모든 수치의 기준점. 데이터랩은 요청마다 0~100으로 따로 정규화하기 때문에
// 매 요청에 기준 시술을 끼워 넣고 "기준 시술 평균 = 100"으로 다시 맞춘다.
module.exports = [
  { id: 'botox', name: '보톡스', category: '주사', terms: ['보톡스'], anchor: true },
  { id: 'filler', name: '필러', category: '주사', terms: ['필러시술', '필러가격', '코필러', '입술필러', '이마필러', '턱필러'] },
  { id: 'contour', name: '윤곽주사', category: '주사', terms: ['윤곽주사'] },
  { id: 'fatdissolve', name: '지방분해주사', category: '주사', terms: ['지방분해주사'] },
  { id: 'skinbooster', name: '스킨부스터', category: '스킨부스터', terms: ['스킨부스터'] },
  { id: 'rejuran', name: '리쥬란', category: '스킨부스터', terms: ['리쥬란', '리쥬란힐러'] },
  { id: 'juvelook', name: '쥬베룩', category: '스킨부스터', terms: ['쥬베룩'] },
  { id: 'skinbotox', name: '스킨보톡스', category: '스킨부스터', terms: ['스킨보톡스'] },
  { id: 'exosome', name: '엑소좀', category: '스킨부스터', terms: ['엑소좀주사', '엑소좀시술'] },
  { id: 'mulgwang', name: '물광주사', category: '스킨부스터', terms: ['물광주사'] },
  { id: 'ulthera', name: '울쎄라', category: '리프팅', terms: ['울쎄라'] },
  { id: 'thermage', name: '써마지', category: '리프팅', terms: ['써마지', '써마지FLX'] },
  { id: 'shurink', name: '슈링크', category: '리프팅', terms: ['슈링크', '슈링크유니버스'] },
  { id: 'onda', name: '온다리프팅', category: '리프팅', terms: ['온다리프팅'] },
  { id: 'inmode', name: '인모드', category: '리프팅', terms: ['인모드'] },
  { id: 'titanium', name: '티타늄리프팅', category: '리프팅', terms: ['티타늄리프팅'] },
  { id: 'oligio', name: '올리지오', category: '리프팅', terms: ['올리지오'] },
  { id: 'thread', name: '실리프팅', category: '리프팅', terms: ['실리프팅'] },
  { id: 'pico', name: '피코토닝', category: '색소·레이저', terms: ['피코토닝', '피코슈어'] },
  { id: 'lasertoning', name: '레이저토닝', category: '색소·레이저', terms: ['레이저토닝'] },
  { id: 'excelv', name: '엑셀V', category: '색소·레이저', terms: ['엑셀브이', '엑셀V'] },
  { id: 'potenza', name: '포텐자', category: '여드름·모공', terms: ['포텐자'] },
  { id: 'secret', name: '시크릿 레이저', category: '여드름·모공', terms: ['시크릿레이저'] },
  { id: 'agnes', name: '아그네스', category: '여드름·모공', terms: ['아그네스시술', '아그네스여드름'] },
  { id: 'hairremoval', name: '레이저 제모', category: '제모·바디', terms: ['레이저제모', '겨드랑이제모'] },
  { id: 'bodybotox', name: '바디보톡스', category: '제모·바디', terms: ['바디보톡스', '승모근보톡스'] },
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
