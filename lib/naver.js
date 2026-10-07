// NAVER API HUB (네이버 클라우드 플랫폼) 연동
// 문서: https://api.ncloud-docs.com/docs/naver-api-hub-search-trend
const BASE = () => process.env.NAVER_API_BASE || 'https://naverapihub.apigw.ntruss.com';
const KEYS = () => ({
  'X-NCP-APIGW-API-KEY-ID': process.env.NAVER_CLIENT_ID,
  'X-NCP-APIGW-API-KEY': process.env.NAVER_CLIENT_SECRET,
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function datalab(body) {
  const res = await fetch(`${BASE()}/search-trend/v1/search`, {
    method: 'POST',
    headers: { ...KEYS(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`검색어트렌드 ${res.status}: ${await res.text()}`);
  await sleep(120);
  return res.json();
}

// 검색 API 경로는 처음 성공한 형식을 기억해서 계속 쓴다.
// .env의 NAVER_SEARCH_PATH 로 직접 지정 가능 (예: /search/v1/{kind})
const CANDIDATES = ['/search/v1/{kind}', '/search/v1/{kind}.json', '/search/{kind}', '/v1/search/{kind}.json'];
let found = null;

async function search(kind, query, display = 30, sort = 'date') {
  const tries = process.env.NAVER_SEARCH_PATH ? [process.env.NAVER_SEARCH_PATH] : found ? [found] : CANDIDATES;
  let last;
  for (const tpl of tries) {
    const url = `${BASE()}${tpl.replace('{kind}', kind)}?query=${encodeURIComponent(query)}&display=${display}&sort=${sort}`;
    const res = await fetch(url, { headers: KEYS() });
    if (res.ok) { found = tpl; await sleep(120); return (await res.json()).items || []; }
    last = `${res.status}: ${(await res.text()).slice(0, 200)}`;
    if (res.status === 401 || res.status === 403) break; // 키 문제면 다른 경로 시도 무의미
  }
  throw new Error(`검색 ${kind} ${last}`);
}

const clean = (s = '') =>
  s.replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .trim();

module.exports = {
  datalab, search, clean,
  hasKeys: () => !!(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET),
  searchPath: () => found,
};
