const { search, clean } = require('./naver');
const KEYWORDS = require('./keywords');
const { NEWS_QUERIES } = KEYWORDS;

// 제목에 미용 시술·장비 관련 단어가 있는 기사만 남긴다
const NEWS_WORDS = ['피부', '미용', '리프팅', '스킨부스터', '시술', '성형', '레이저', '에스테틱', '안티에이징', '탄력', '주름', '보톡스', '보툴리눔', '톡신', '필러', 'HIFU', '고주파', '울쎄라', '써마지',
  ...KEYWORDS.flatMap((k) => [k.name, ...k.terms])];
const relevant = (title) => NEWS_WORDS.some((w) => title.includes(w));

// 시술별 최근 블로그·카페 글
async function getPosts(k) {
  const q = k.terms[0];
  const [blog, cafe] = await Promise.all([
    search('blog', q, 30).catch(() => []),
    search('cafearticle', q, 20).catch(() => []),
  ]);
  const posts = [
    ...blog.map((i) => ({ source: '블로그', title: clean(i.title), text: clean(i.description), link: i.link, date: i.postdate ? `${i.postdate.slice(0, 4)}-${i.postdate.slice(4, 6)}-${i.postdate.slice(6)}` : null })),
    ...cafe.map((i) => ({ source: '카페', title: clean(i.title), text: clean(i.description), link: i.link, date: null })),
  ];
  return posts;
}

async function getNews(extraQueries = []) {
  const seen = new Set();
  const out = [];
  for (const q of [...NEWS_QUERIES, ...extraQueries]) {
    const items = await search('news', q, 10, 'date').catch(() => []);
    for (const i of items) {
      const key = clean(i.title);
      if (seen.has(key) || !relevant(key)) continue;
      seen.add(key);
      out.push({ title: key, text: clean(i.description), link: i.originallink || i.link, date: new Date(i.pubDate).toISOString(), query: q });
    }
  }
  return out.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);
}

module.exports = { getPosts, getNews };
