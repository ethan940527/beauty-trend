// 목록에 없는 '새로 뜨는' 시술·장비 이름을 블로그·카페 글에서 자동으로 찾아낸다.
// 1) 시술 관련 검색어로 최근 글을 대량 수집
// 2) "OO리프팅", "OO 시술/후기/가격" 같은 패턴으로 후보 단어 추출
// 3) 이미 추적 중인 시술, 지역명, 병원명, 일반 단어는 제외
// 4) 많이 언급된 후보만 네이버 검색량으로 다시 확인
const { search, clean } = require('./naver');
const { fetchScaledFor, metrics } = require('./trends');
const KEYWORDS = require('./keywords');

const QUERIES = ['피부과 시술 후기', '요즘 피부시술', '신상 피부시술', '리프팅 시술 후기', '스킨부스터 후기', '피부 레이저 후기', '피부과 신장비', '쁘띠성형 후기'];

const SUFFIX = /([가-힣A-Za-z0-9]{1,8}(?:리프팅|레이저|주사|부스터|토닝|필러|힐러|필링|톡스))/g;
const BEFORE = /(?:^|[\s[(/,·|"'“‘<])([가-힣A-Za-z][가-힣A-Za-z0-9]{1,9})\s?(?=시술|후기|가격|효과|부작용|통증|유지기간|전후|비용)/g;

const STOP = new Set(`피부 얼굴 시술 후기 가격 효과 부작용 통증 병원 피부과 성형 성형외과 의원 클리닉 추천 솔직 리얼 내돈내산 내돈 첫 첫번째 회차 전후 비교 관리 이벤트 할인 상담 원장 원장님
레이저 리프팅 주사 부스터 토닝 필러 보톡스 스킨부스터 쁘띠 쁘띠성형 안티에이징 탄력 주름 모공 여드름 기미 잡티 색소 흉터 홍조 제모 눈밑 이마 턱 볼 팔자 눈가 목 입술 코 앞턱 사각턱 얼굴형 윤곽
다이어트 지방 바디 팔뚝 허벅지 종아리 승모근 겨드랑이 받은 받고 했어요 하고 받기 시작 처음 요즘 신상 최신 인기 유명 최고 저렴 비용 가성비 정품 정량 당일 다음날 일주일 한달 개월 유지 기간 진짜 정말 너무 그냥 완전
남자 여자 엄마 직장인 체험 방문 예약 상세 정리 총정리 종류 차이 장단점 주기 횟수 이유 방법 꿀팁 실제 직접 내가 제가 저의 우리 같이 함께 후기글 블로그 카페 리뷰 시술후 시술전 피부관리 피부시술 레이저시술
강남 강남역 신사 압구정 청담 홍대 신촌 잠실 부산 대구 인천 광주 대전 울산 수원 분당 판교 일산 부평 서면 명동 건대 강서 목동 노원 송파 마포 용산 종로 서울 경기 동탄 천안 청주 전주 창원 제주
피부레이저 얼굴리프팅 보톡스주사 리프팅레이저 물광 피부톤 피부결 재생 미백 각질 수분 진정 보습 화이트닝 안면 눈 두피 탈모 모발 헤어`.split(/\s+/).filter(Boolean));

const GENERIC = new Set(['필러', '보톡스', '스킨부스터', '레이저토닝', '실리프팅', '윤곽주사', '물광주사', '레이저 제모', '바디보톡스', '스킨보톡스', '지방분해주사']);
const norm = (s) => s.toLowerCase().replace(/\s+/g, '');
const KNOWN = KEYWORDS.flatMap((k) => [k.name, ...k.terms]).map(norm);
const KNOWN_PREFIX = KNOWN.filter((t) => t.length >= 3 && !GENERIC.has(t));

function isKnown(t) {
  return KNOWN.includes(t) || KNOWN_PREFIX.some((k) => t.startsWith(k));
}
function isBad(t) {
  if (t.length < 2 || STOP.has(t)) return true;
  if (/^\d|\d{2,}/.test(t)) return true;
  if (/(의원|병원|피부과|클리닉|성형|센터|원장|후기|추천|가격)/.test(t)) return true;
  if (/(역|구|시|군)$/.test(t) && t.length <= 4) return true;
  // 조사·어미로 끝나는 말(솔직한, 엄마랑, 처음으로 …)
  if (/(한|랑|하고|에서|으로|에게|까지|부터|처럼|같은|했던|받은|하는|해서|라서|였던|은|는|을|를|도|와|과|의)$/.test(t)) return true;
  return false;
}

async function collect() {
  const posts = new Map();
  for (const q of QUERIES) {
    for (const kind of ['blog', 'cafearticle']) {
      const items = await search(kind, q, 100).catch(() => []);
      for (const i of items) {
        if (posts.has(i.link)) continue;
        posts.set(i.link, {
          source: kind === 'blog' ? '블로그' : '카페',
          title: clean(i.title), text: clean(i.description), link: i.link,
          date: i.postdate ? `${i.postdate.slice(0, 4)}-${i.postdate.slice(4, 6)}-${i.postdate.slice(6)}` : null,
        });
      }
    }
  }
  return [...posts.values()];
}

function extract(posts) {
  const found = new Map(); // term -> {count, posts[]}
  for (const p of posts) {
    const body = `${p.title} ${p.text}`;
    const terms = new Set();
    for (const m of body.matchAll(SUFFIX)) terms.add(norm(m[1]));
    for (const m of body.matchAll(BEFORE)) terms.add(norm(m[1]));
    for (const t of terms) {
      if (isBad(t) || isKnown(t)) continue;
      const e = found.get(t) || { count: 0, posts: [] };
      e.count++;
      if (e.posts.length < 4) e.posts.push(p);
      found.set(t, e);
    }
  }
  return found;
}

async function discover(prevSeen = {}) {
  const posts = await collect();
  const found = extract(posts);
  const cands = [...found.entries()].filter(([, e]) => e.count >= 3).sort((a, b) => b[1].count - a[1].count).slice(0, 20);
  if (!cands.length) return { items: [], seen: prevSeen, scanned: posts.length };

  const items = cands.map(([t], i) => ({ id: `new${i}`, terms: [t] }));
  const { series } = await fetchScaledFor(items);

  const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  const seen = { ...prevSeen };
  // 첫 실행 때 잡힌 단어들은 '원래 있던 것'으로 기록해 NEW 표시를 붙이지 않는다
  const bootstrap = !Object.keys(prevSeen).length;
  const out = [];
  cands.forEach(([t, e], i) => {
    const s = series[`new${i}`] || [];
    const m = metrics(s);
    if (!(m.index >= 0.5)) return; // 검색이 거의 없는 단어는 제외
    seen[t] = { first: seen[t]?.first || (bootstrap ? 'base' : today), last: today };
    out.push({
      id: `d_${encodeURIComponent(t)}`, name: t, category: '새로 포착', discovered: true,
      series: s, ...m, growth: m.growth4, segments: [],
      mentions: e.count, firstSeen: seen[t].first === 'base' ? null : seen[t].first,
      posts: e.posts.map(({ source, title, link, date }) => ({ source, title, link, date })),
    });
  });
  // 120일 넘게 안 보인 단어는 기록에서 정리
  const cutoff = new Date(Date.now() - 120 * 864e5).toISOString().slice(0, 10);
  for (const [t, v] of Object.entries(seen)) if (v.last < cutoff) delete seen[t];

  return { items: out, seen, scanned: posts.length };
}

module.exports = { discover, extract };
