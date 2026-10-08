const fs = require('fs');
const path = require('path');
const KEYWORDS = require('./keywords');
const { getTrends } = require('./trends');
const { getPosts, getNews } = require('./buzz');
const { discover } = require('./discover');

const CACHE = path.join(__dirname, '..', 'data', 'cache.json');
let running = null;

function readCache() {
  try { return JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch { return null; }
}

// GitHub Actions에서는 이전 결과를 배포된 사이트에서 가져온다 (새로 포착된 날짜 기록 유지용)
async function readPrev() {
  const local = readCache();
  if (local) return local;
  const repo = process.env.GITHUB_REPOSITORY; // "아이디/저장소"
  if (!repo) return null;
  const [owner, name] = repo.split('/');
  try {
    const res = await fetch(`https://${owner}.github.io/${name}/data.json`, { cache: 'no-store' });
    return res.ok ? await res.json() : null;
  } catch { return null; }
}

async function doRefresh() {
  const prev = await readPrev();
  const started = Date.now();
  console.log('[refresh] 시작');

  const { weeks, keywords } = await getTrends();

  for (const k of keywords) {
    const def = KEYWORDS.find((d) => d.id === k.id);
    const old = prev?.keywords?.find((o) => o.id === k.id);
    try {
      const posts = await getPosts(def);
      k.posts = posts.filter((p) => p.date).slice(0, 6).concat(posts.filter((p) => !p.date).slice(0, 2));
    } catch (e) {
      console.warn('[글 수집 실패]', k.name, e.message);
      k.posts = old?.posts || [];
    }
  }

  let discovered = prev?.discovered || [], seen = prev?.seen || {}, scanned = 0;
  try {
    const d = await discover(seen);
    discovered = d.items; seen = d.seen; scanned = d.scanned;
    console.log(`[discover] 글 ${scanned}건에서 후보 ${discovered.length}개`);
  } catch (e) { console.warn('[discover 실패]', e.message); }

  const rising = keywords.filter((k) => k.index >= 5 && k.growth != null && !k.spike).sort((a, b) => b.growth - a.growth).slice(0, 3);
  const news = await getNews(rising.map((k) => `${k.name} 장비`)).catch(() => prev?.news || []);

  const cache = { updatedAt: new Date().toISOString(), isSample: false, weeks, keywords, discovered, seen, scanned, news };
  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  fs.writeFileSync(CACHE, JSON.stringify(cache));
  console.log(`[refresh] 완료 ${((Date.now() - started) / 1000).toFixed(0)}초`);
  return cache;
}

function refresh() {
  if (!running) running = doRefresh().finally(() => { running = null; });
  return running;
}

module.exports = { refresh, readCache, isRunning: () => !!running };
