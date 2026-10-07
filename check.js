// 키와 연결 상태 점검: npm run check
require('dotenv').config();
const { datalab, search, hasKeys, searchPath } = require('./lib/naver');

(async () => {
  if (!hasKeys()) { console.log('❌ .env 파일에 NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 이 비어 있어요.'); return; }
  const end = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const start = new Date(Date.now() - 60 * 864e5).toISOString().slice(0, 10);
  try {
    const r = await datalab({ startDate: start, endDate: end, timeUnit: 'week', keywordGroups: [{ groupName: '보톡스', keywords: ['보톡스'] }] });
    console.log(`✅ 검색어트렌드 연결 성공 (데이터 ${r.results?.[0]?.data?.length ?? 0}주치)`);
  } catch (e) { console.log('❌ 검색어트렌드 실패 →', e.message); }
  for (const kind of ['blog', 'cafearticle', 'news']) {
    try {
      const items = await search(kind, '보톡스', 3);
      console.log(`✅ ${kind} 검색 연결 성공 (${items.length}건, 경로 ${searchPath()})`);
    } catch (e) { console.log(`❌ ${kind} 검색 실패 →`, e.message); }
  }
})();
