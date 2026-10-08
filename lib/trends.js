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
const ANCHOR = KEYWORDS.find((k) => k.anchor);

// 임의의 키워드 묶음을 "보톡스 기간 평균 = 100" 척도로 가져온다. items: [{id, terms}]
async function fetchScaledFor(items, filters = {}) {
  const { startDate, endDate } = weekRange();
  const weeks = weekList(startDate);
  const out = {};
  for (const batch of chunk(items.filter((k) => k.id !== ANCHOR.id), 4)) {
    const groups = [ANCHOR, ...batch].map((k) => ({ groupName: k.id, keywords: k.terms }));
    const res = await datalab({ startDate, endDate, timeUnit: 'week', keywordGroups: groups, ...filters });
    const byId = {};
    for (const r of res.results) {
      const m = Object.fromEntries(r.data.map((p) => [p.period, p.ratio]));
      byId[r.title] = weeks.map((w) => m[w] || 0);
    }
    const base = mean(byId[ANCHOR.id]) || 1;
    for (const k of [ANCHOR, ...batch]) out[k.id] = byId[k.id].map((v) => +(v / base * 100).toFixed(2));
  }
  return { weeks, series: out };
}

const change = (a, b) => (b > 0 ? +((a / b - 1) * 100).toFixed(1) : null);

// 시계열 하나로 기간별 변화율과 '일시 급등' 여부를 계산
function metrics(s) {
  const recent4 = mean(s.slice(-4)), prev4 = mean(s.slice(-8, -4));
  const last4 = s.slice(-4);
  const peak = Math.max(...last4);
  const base = median(s.slice(-12, -4));
  const restAvg = (last4.reduce((a, b) => a + b, 0) - peak) / 3;
  return {
    index: +recent4.toFixed(1),
    growth1: change(s[s.length - 1], s[s.length - 2]),        // 지난주 vs 그 전주
    growth4: change(recent4, prev4),                          // 최근 4주 vs 직전 4주
    growth8: change(mean(s.slice(-8)), mean(s.slice(-16, -8))), // 최근 8주 vs 직전 8주
    spike: base > 0 && peak >= base * 2 && restAvg < prev4 * 1.25,
  };
}

async function getTrends() {
  const { weeks, series } = await fetchScaledFor(KEYWORDS);

  // 관심층: 구간마다 (시술 / 보톡스) 비율을 구하고, 구간 평균 대비 몇 배인지로 표현
  const segRaw = {};
  for (const seg of SEGMENTS) {
    const f = { gender: seg.gender };
    if (seg.ages) f.ages = seg.ages;
    try {
      const { series: s } = await fetchScaledFor(KEYWORDS, f);
      for (const [id, arr] of Object.entries(s)) (segRaw[id] ||= {})[seg.id] = mean(arr.slice(-8));
    } catch (e) { console.warn('관심층 구간 실패', seg.id, e.message); }
  }

  const keywords = KEYWORDS.map((k) => {
    const s = series[k.id] || [];
    const raw = segRaw[k.id] || {};
    const avg = mean(Object.values(raw)) || 1;
    const segments = SEGMENTS.filter((g) => raw[g.id] != null)
      .map((g) => ({ id: g.id, label: g.label, lift: +(raw[g.id] / avg).toFixed(2) }));
    const m = metrics(s);
    return { id: k.id, name: k.name, category: k.category, anchor: !!k.anchor, series: s, ...m, growth: m.growth4, segments };
  });
  return { weeks, keywords };
}

// ── 시즌 패턴: 최근 3개 완결 연도의 월별 검색량으로 '예년엔 다음 달에 오르던 시술'을 찾는다
async function getSeasonality(items = KEYWORDS) {
  const now = new Date(Date.now() + 9 * 3600e3);
  const y = now.getUTCFullYear(), cur = now.getUTCMonth(); // 0~11
  const next = (cur + 1) % 12;
  const years = [y - 3, y - 2, y - 1];
  const lastDay = new Date(Date.UTC(y, cur, 0)); // 지난달 말일
  const startDate = `${years[0]}-01-01`, endDate = fmt(lastDay);
  const out = {};
  for (const batch of chunk(items, 5)) {
    const groups = batch.map((k) => ({ groupName: k.id, keywords: k.terms }));
    let res;
    try { res = await datalab({ startDate, endDate, timeUnit: 'month', keywordGroups: groups }); } catch (e) { console.warn('시즌 실패', e.message); continue; }
    for (const r of res.results) {
      const m = Object.fromEntries(r.data.map((p) => [p.period.slice(0, 7), p.ratio]));
      const v = (yy, mm) => m[`${yy}-${String(mm + 1).padStart(2, '0')}`] ?? 0;
      const norms = [];
      let up = 0, counted = 0;
      for (const yy of years) {
        const arr = Array.from({ length: 12 }, (_, i) => v(yy, i));
        const avg = mean(arr);
        if (avg <= 0) continue;
        norms.push(arr.map((x) => x / avg));
        const a = v(yy, cur), b = next === 0 ? v(yy + 1, 0) : v(yy, next);
        if (a > 0 && b > 0) { counted++; if (b > a) up++; }
      }
      if (norms.length < 2) continue;
      const idx = Array.from({ length: 12 }, (_, i) => +mean(norms.map((n) => n[i])).toFixed(3));
      out[r.title] = {
        idx, years: norms.length, upYears: up, counted,
        nextLift: idx[cur] > 0 ? +((idx[next] / idx[cur] - 1) * 100).toFixed(1) : null,
      };
    }
  }
  return { month: cur + 1, nextMonth: next + 1, years, byId: out };
}

module.exports = { getTrends, getSeasonality, fetchScaledFor, metrics };
