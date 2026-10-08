// 네이버 키가 없을 때 화면 확인용으로 쓰는 샘플. 실제 데이터가 아니며 화면에 그렇게 표시된다.
const KEYWORDS = require('./keywords');
const { SEGMENTS } = require('./keywords');
const { metrics } = require('./trends');

function rng(seed) { let s = seed; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }
const hash = (str) => [...str].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 100000, 7);

function series(id, anchor, scale = 70) {
  const r = rng(hash(id));
  const base = anchor ? 100 : 2 + r() * scale;
  const trend = anchor ? 0 : (r() - 0.4) * 0.06;
  return Array.from({ length: 16 }, (_, i) => +(base * (1 + trend * i) * (0.9 + r() * 0.2)).toFixed(1));
}

function build() {
  const weeks = [];
  const d = new Date(); d.setUTCDate(d.getUTCDate() - d.getUTCDay() - 6 - 15 * 7);
  for (let i = 0; i < 16; i++) { weeks.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() + 7); }

  const keywords = KEYWORDS.map((k) => {
    const s = series(k.id, k.anchor);
    const r = rng(hash(k.id + 'seg'));
    const lifts = SEGMENTS.map(() => (k.anchor ? 1 : 0.4 + r() * 1.4));
    const avg = lifts.reduce((a, b) => a + b, 0) / lifts.length;
    const m = metrics(s);
    return {
      id: k.id, name: k.name, category: k.category, anchor: !!k.anchor, series: s, ...m, growth: m.growth4,
      segments: SEGMENTS.map((g, i) => ({ id: g.id, label: g.label, lift: +(lifts[i] / avg).toFixed(2) })),
      posts: [],
      season: (() => { const rr = rng(hash(k.id + 's')); const idx = Array.from({ length: 12 }, () => +(0.7 + rr() * 0.6).toFixed(3)); const c = new Date().getMonth(), n = (c + 1) % 12; return { idx, years: 3, upYears: 2 + (rr() > 0.5 ? 1 : 0), counted: 3, nextLift: +((idx[n] / idx[c] - 1) * 100).toFixed(1) }; })(),
    };
  });
  const c = new Date().getMonth();
  return { updatedAt: new Date().toISOString(), isSample: true, weeks, keywords, season: { month: c + 1, nextMonth: ((c + 1) % 12) + 1, years: [] }, news: [] };
}

module.exports = { build };
