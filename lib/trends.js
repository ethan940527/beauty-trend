const { datalab } = require('./naver');
const KEYWORDS = require('./keywords');
const { SEGMENTS } = require('./keywords');

const WEEKS = 16;
const fmt = (d) => d.toISOString().slice(0, 10);

// 완결된 주만 쓰기 위해 "오늘(KST) 이전의 가장 최근 일요일"을 끝으로 잡는다.
function weekRange() {
  const now = new Date(Date.now() + 9 * 3600e3);
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dow = today.getUTCDay(); // 0=일
  const end = new Date(today); end.setUTCDate(today.getUTCDate() - (dow === 0 ? 7 : dow));
  const start = new Date(end); start.setUTCDate(end.getUTCDate() - WEEKS * 7 + 1);
  return { startDate: fmt(start), endDate: fmt(end) };
}

function weekList(startDate) {
  const out = [];
  const d = new Date(startDate + 'T00:00:00Z');
  for (let i = 0; i < WEEKS; i++) { out.push(fmt(d)); d.setUTCDate(d.getUTCDate() + 7); }
  return out;
}

const chunk = (arr, n) => arr.reduce((a, x, i) => (i % n ? a[a.length - 1].push(x) : a.push([x]), a), []);
const median = (a) => { if (!a.length) return 0; const b = [...a].sort((x, y) => x - y); const m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

// 키워드 전체의 주간 시계열을 "기준 시술 기간 평균 = 100" 척도로 가져온다.
async function fetchScaled(filters = {}) {
  const anchor = KEYWORDS.find((k) => k.anchor);
  const others = KEYWORDS.filter((k) => !k.anchor);
  const { startDate, endDate } = weekRange();
  const weeks = weekList(startDate);
  const out = {};

  for (const batch of chunk(others, 4)) {
    const groups = [anchor, ...batch].map((k) => ({ groupName: k.id, keywords: k.terms }));
    const res = await datalab({ startDate, endDate, timeUnit: 'week', keywordGroups: groups, ...filters });
    const byId = {};
    for (const r of res.results) {
      const m = Object.fromEntries(r.data.map((p) => [p.period, p.ratio]));
      byId[r.title] = weeks.map((w) => m[w] || 0);
    }
    const base = mean(byId[anchor.id]) || 1;
    for (const k of [anchor, ...batch]) out[k.id] = byId[k.id].map((v) => +(v / base * 100).toFixed(2));
  }
  return { weeks, series: out };
}

async function getTrends() {
  const { weeks, series } = await fetchScaled();

  // 관심층: 구간마다 (시술 / 보톡스) 비율을 구하고, 구간 평균 대비 몇 배인지로 표현
  const segRaw = {};
  for (const seg of SEGMENTS) {
    const f = { gender: seg.gender };
    if (seg.ages) f.ages = seg.ages;
    try {
      const { series: s } = await fetchScaled(f);
      for (const [id, arr] of Object.entries(s)) {
        (segRaw[id] ||= {})[seg.id] = mean(arr.slice(-8));
      }
    } catch (e) { console.warn('관심층 구간 실패', seg.id, e.message); }
  }

  const keywords = KEYWORDS.map((k) => {
    const s = series[k.id] || [];
    const recent = mean(s.slice(-4));
    const prev = mean(s.slice(-8, -4));
    // 한 주만 튄 경우: 최근 4주 중 최고치가 평소(직전 8주 중앙값)의 2배 이상인데,
    // 그 한 주를 빼면 거의 안 올랐다면 '일시 급등'으로 본다.
    const last4 = s.slice(-4);
    const peak = Math.max(...last4);
    const base = median(s.slice(-12, -4));
    const restAvg = (last4.reduce((a, b) => a + b, 0) - peak) / 3;
    const spike = base > 0 && peak >= base * 2 && restAvg < prev * 1.25;
    const raw = segRaw[k.id] || {};
    const avg = mean(Object.values(raw)) || 1;
    const segments = SEGMENTS.filter((g) => raw[g.id] != null)
      .map((g) => ({ id: g.id, label: g.label, lift: +(raw[g.id] / avg).toFixed(2) }));
    return {
      id: k.id, name: k.name, category: k.category, anchor: !!k.anchor,
      series: s,
      index: +recent.toFixed(1),
      growth: prev > 0 ? +((recent / prev - 1) * 100).toFixed(1) : null,
      segments,
      spike,
    };
  });
  return { weeks, keywords };
}

module.exports = { getTrends };
