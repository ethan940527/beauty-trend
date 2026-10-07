require('dotenv').config();
const express = require('express');
const path = require('path');
const { refresh, readCache, isRunning } = require('./lib/refresh');
const { hasKeys } = require('./lib/naver');
const sample = require('./lib/sample');

const app = express();
const DAY = 24 * 3600e3;

app.use(express.static(path.join(__dirname, 'public'), { maxAge: 0, etag: true }));

app.get('/api/dashboard', (req, res) => {
  const cache = readCache();
  if (cache) return res.set('Cache-Control', 'no-cache').json({ ...cache, refreshing: isRunning() });
  if (!hasKeys()) return res.json(sample.build());
  res.status(503).json({ error: '첫 데이터를 모으는 중입니다. 몇 분 뒤 다시 열어주세요.', refreshing: isRunning() });
});

app.post('/api/refresh', (req, res) => {
  if (!process.env.ADMIN_TOKEN || req.get('x-admin-token') !== process.env.ADMIN_TOKEN) return res.status(401).json({ error: '토큰이 맞지 않습니다.' });
  if (!hasKeys()) return res.status(400).json({ error: '네이버 API 키가 없습니다.' });
  refresh().catch((e) => console.error(e));
  res.json({ ok: true, message: '갱신을 시작했습니다.' });
});

// 하루 한 번 자동 갱신 (캐시가 23시간 넘으면)
function tick() {
  if (!hasKeys()) return;
  const c = readCache();
  if (!c || Date.now() - new Date(c.updatedAt).getTime() > DAY - 3600e3) refresh().catch((e) => console.error('[refresh 실패]', e.message));
}
setInterval(tick, 3600e3);
tick();

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`http://localhost:${port}  (${hasKeys() ? '실데이터' : '샘플 모드: .env에 네이버 키를 넣으면 실데이터'})`));
