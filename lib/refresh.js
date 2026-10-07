const fs = require('fs');
const path = require('path');
const KEYWORDS = require('./keywords');
const { getTrends } = require('./trends');
const { getPosts, getNews } = require('./buzz');

const CACHE = path.join(__dirname, '..', 'data', 'cache.json');
let running = null;

function readCache() {
  try { return JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch { return null; }
}

async function doRefresh() {
  const prev = readCache();
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

  const rising = keywords.filter((k) => k.index >= 5 && k.growth != null && !k.spike).sort((a, b) => b.growth - a.growth).slice(0, 3);
  const news = await getNews(rising.map((k) => `${k.name} 장비`)).catch(() => prev?.news || []);

  const cache = { updatedAt: new Date().toISOString(), isSample: false, weeks, keywords, news };
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
