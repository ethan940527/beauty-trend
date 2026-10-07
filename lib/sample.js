// 네이버 키가 없을 때 화면 확인용으로 쓰는 샘플. 실제 데이터가 아니며 화면에 그렇게 표시된다.
const KEYWORDS = require('./keywords');
const { SEGMENTS } = require('./keywords');

function rng(seed) { let s = seed; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }
const hash = (str) => [...str].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 100000, 7);

function build() {
  const weeks = [];
  const d = new Date(); d.setUTCDate(d.getUTCDate() - d.getUTCDay() - 6 - 15 * 7);
  for (let i = 0; i < 16; i++) { weeks.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() + 7); }

  const keywords = KEYWORDS.map((k) => {
    const r = rng(hash(k.id));
    const base = k.anchor ? 100 : 6 + r() * 70;
    const trend = k.anchor ? 0 : (r() - 0.4) * 0.06;
    const series = weeks.map((_, i) => +(base * (1 + trend * i) * (0.9 + r() * 0.2)).toFixed(1));
    const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
    const recent = mean(series.slice(-4)), prev = mean(series.slice(-8, -4));
    const lifts = SEGMENTS.map(() => (k.anchor ? 1 : 0.4 + r() * 1.4));
    const avg = mean(lifts);
    return {
      id: k.id, name: k.name, category: k.category, anchor: !!k.anchor, series,
      index: +recent.toFixed(1), growth: +((recent / prev - 1) * 100).toFixed(1),
      segments: SEGMENTS.map((g, i) => ({ id: g.id, label: g.label, lift: +(lifts[i] / avg).toFixed(2) })),
      spike: false,
      posts: [],
    };
  });
  return { updatedAt: new Date().toISOString(), isSample: true, weeks, keywords, news: [] };
}

module.exports = { build };
