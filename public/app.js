(() => {
  const qs = new URLSearchParams(location.search);
  if (qs.get('embed') === '1') document.body.classList.add('embed');
  if (qs.get('theme')) document.documentElement.dataset.theme = qs.get('theme'); // 앱 테마 강제용

  const $ = (id) => document.getElementById(id);
  const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LOW = 5; // 관심도 5 미만은 표본이 작아 변화율이 크게 튐
  const CHEV = '<svg class="chev" viewBox="0 0 8 14" aria-hidden="true"><path d="M1 1l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  let data, sort = 'growth', cat = '전체', per = 4, showAll = false;
  const SHOW = 10;

  // 웹뷰에서 외부 링크는 앱에 넘긴다 (RN / iOS WKWebView / Android JS 브리지 순)
  function openExternal(url) {
    try {
      if (window.ReactNativeWebView) return window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'openExternal', url }));
      if (window.webkit?.messageHandlers?.openExternal) return window.webkit.messageHandlers.openExternal.postMessage(url);
      if (window.Android?.openExternal) return window.Android.openExternal(url);
    } catch (e) {}
    window.open(url, '_blank', 'noopener');
  }

  function spark(arr, w, h) {
    if (!arr?.length) return '';
    const max = Math.max(...arr), min = Math.min(...arr), span = max - min || 1;
    const pts = arr.map((v, i) => `${(i / (arr.length - 1)) * w},${h - 2 - ((v - min) / span) * (h - 4)}`).join(' ');
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>`;
  }
  // 12개월 막대 (hi: 강조할 달 0~11)
  function bars(idx, w, h, hi) {
    const max = Math.max(...idx), bw = w / 12;
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">${idx.map((v, i) => {
      const bh = Math.max(2, (v / max) * (h - 2));
      return `<rect x="${i * bw + bw * 0.18}" y="${h - bh}" width="${bw * 0.64}" height="${bh}" rx="1.5" class="${i === hi ? 'bhi' : 'b'}"/>`;
    }).join('')}</svg>`;
  }

  const g = (k) => k['growth' + per] ?? (per === 4 ? k.growth : null);
  const dir = (v) => (v == null ? 'flat' : v >= 3 ? 'up' : v <= -3 ? 'down' : 'flat');
  const pct = (v) => (v == null ? '–' : `${v > 0 ? '+' : ''}${v.toFixed(0)}%`);
  const md = (iso) => { const d = new Date(iso); return `${d.getMonth() + 1}월 ${d.getDate()}일`; };
  const perLabel = () => (per === 1 ? '지난주' : `최근 ${per}주`);
  const vsLabel = () => (per === 1 ? '그 전주 대비' : `직전 ${per}주 대비`);
  const idxTxt = (k) => k.index.toFixed(k.index < 10 ? 1 : 0);
  const stamp = (iso) => new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'short', hour: 'numeric', minute: '2-digit' });

  // 정렬: 많이 오른 순은 '일시 급등'과 검색량이 너무 적은 시술을 뒤로 보낸다
  function ranked() {
    const ks = data.keywords.filter((k) => cat === '전체' || k.category === cat);
    if (sort === 'index') return ks.sort((a, b) => b.index - a.index);
    const tier = (k) => (k.index < LOW || g(k) == null ? 2 : per !== 1 && k.spike ? 1 : 0);
    return ks.sort((a, b) => tier(a) - tier(b) || (g(b) ?? -999) - (g(a) ?? -999));
  }

  function render() {
    const last = data.weeks[data.weeks.length - 1];
    const end = new Date(last + 'T00:00:00'); end.setDate(end.getDate() + 6);
    $('stamp').textContent = `${stamp(data.updatedAt)} 업데이트 · ${md(end)}까지 네이버 검색 기준`;
    $('sample').hidden = !data.isSample;
    document.querySelectorAll('[data-sort]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.sort === sort)));
    document.querySelectorAll('[data-per]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.per === per)));

    const cats = ['전체', ...new Set(data.keywords.map((k) => k.category))];
    $('chips').innerHTML = cats.map((c) => `<button aria-pressed="${c === cat}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');

    const list = ranked();
    const top = list[0];

    // 1위: 목록의 첫 줄을 크게
    const lead = sort === 'index' ? `${cat === '전체' ? '' : cat + ' 중 '}가장 많이 찾는 시술`
      : `${perLabel()} ${cat === '전체' ? '' : cat + ' 중 '}가장 많이 찾기 시작한 시술`;
    $('feature').innerHTML = top ? `
      <button class="ftop" data-id="${top.id}">
        <p class="lead"><span class="r1">1</span>${lead}</p>
        <p class="name">${esc(top.name)}</p>
        <div class="row">
          <span class="${dir(g(top))}">${spark(top.series, 300, 52)}</span>
          <span class="pct ${sort === 'index' ? 'plain' : ''}">${sort === 'index' ? idxTxt(top) : pct(g(top))}<small>${sort === 'index' ? '관심도 (보톡스 100)' : vsLabel()}</small></span>
        </div>
        <span class="more">추이 · 관심층 자세히 보기 ${CHEV}</span>
      </button>` : '<p class="empty">해당하는 시술이 없어요.</p>';

    const rest = list.slice(1, showAll ? undefined : SHOW);
    $('list').innerHTML = rest.map((k, i) => {
      const v = g(k);
      return `<li><button class="item" data-id="${k.id}">
        <span class="rank">${i + 2}</span>
        <span class="nm"><b>${esc(k.name)}</b><span>${esc(k.category)}${k.spike && per !== 1 ? ' · <em class="tag">일시 급등</em>' : ''}</span></span>
        <span class="${dir(v)}">${spark(k.series, 64, 26)}</span>
        <span class="chg ${dir(v)}">${sort === 'index' ? idxTxt(k) : pct(v)}<small>${sort === 'index' ? pct(v) : '관심도 ' + idxTxt(k)}</small></span>
        ${CHEV}
      </button></li>`;
    }).join('') + (!showAll && list.length > SHOW ? `<li><button class="moreAll" data-all="1">전체 ${list.length}개 보기</button></li>` : '');
    $('note').textContent = `관심도는 네이버 검색량을 보톡스 = 100으로 맞춘 상대값이에요. 변화율은 ${perLabel()}와 ${per === 1 ? '그 전주' : `그 전 ${per}주`}를 비교했고, 한 주만 튄 '일시 급등'과 검색량이 아주 적은 시술은 뒤쪽에 두었어요.`;
    $('per').hidden = sort === 'index';

    // 시즌: 예년에 다음 달 오르던 시술
    const sz = data.season;
    const sl = data.keywords.filter((k) => k.season && k.season.nextLift != null && k.season.nextLift >= 5 && k.season.upYears >= 2 && k.index >= 1)
      .sort((a, b) => b.season.nextLift - a.season.nextLift).slice(0, 6);
    $('seasonWrap').hidden = !sz || !sl.length;
    if (sz && sl.length) {
      $('seasonTitle').textContent = `${sz.nextMonth}월에 찾는 사람이 늘어나는 시술`;
      $('seasonHint').textContent = `최근 3년 네이버 검색을 보면, 아래 시술들은 매년 ${sz.month}월보다 ${sz.nextMonth}월에 더 많이 검색됐어요. 이벤트와 상담 준비를 미리 해 보세요.`;
      $('season').innerHTML = sl.map((k, i) => `<li><button class="item" data-id="${k.id}">
        <span class="rank">${i + 1}</span>
        <span class="nm"><b>${esc(k.name)}</b><span>${k.season.counted}년 중 ${k.season.upYears}년 상승</span></span>
        <span class="bars">${bars(k.season.idx, 64, 26, sz.nextMonth - 1)}</span>
        <span class="chg up">${pct(k.season.nextLift)}<small>${sz.month}→${sz.nextMonth}월</small></span>
        ${CHEV}
      </button></li>`).join('');
    }

    $('newsWrap').hidden = !data.news?.length;
    $('news').innerHTML = (data.news || []).map((n) => `
      <li><button class="link" data-url="${esc(n.link)}"><b>${esc(n.title)}</b><span>${md(n.date)}</span></button></li>`).join('');
  }

  function openDetail(id, push = true) {
    const k = data.keywords.find((x) => x.id === id);
    if (!k) return;
    const w = data.weeks;
    const segs = k.segments || [];
    const top = [...segs].sort((a, b) => b.lift - a.lift)[0];
    const maxLift = Math.max(...segs.map((s) => s.lift), 1);
    const v = g(k);
    const sz = data.season;

    $('dbody').innerHTML = `
      <div class="dhead"><h2 id="dTitle">${esc(k.name)}</h2><p>${esc(k.category)}</p></div>
      <div class="stats">
        <div><strong class="${dir(v)}">${pct(v)}</strong>${vsLabel()}</div>
        <div><strong>${idxTxt(k)}</strong>관심도 (보톡스 100)</div>
      </div>

      <section class="dsec"><h3>추이</h3>
        <div class="chart ${dir(v)}">${spark(k.series, 320, 150)}
          <div class="axis"><span>${md(w[0])}</span><span>최근 16주</span><span>${md(w[w.length - 1])}</span></div></div>
        ${k.spike && per !== 1 ? '<p class="warn">최근 한 주에만 검색이 몰렸어요. 이슈성 검색일 수 있으니 다음 주 흐름을 같이 보세요.</p>' : ''}
        ${k.index < LOW ? '<p class="warn">검색량이 적은 시술이라 변화율이 크게 흔들릴 수 있어요.</p>' : ''}
      </section>

      ${segs.length ? `<section class="dsec"><h3>관심층</h3>
        <p class="hint">보톡스와 비교해 각 층에서 상대적으로 얼마나 더 찾는지예요. 1.0배가 평균이에요.</p>
        <div class="bars-h">${segs.map((s) => `
          <div class="bar ${s === top && s.lift >= 1.15 ? 'hi' : ''}"><span>${esc(s.label)}</span>
          <span class="track"><span class="fill" style="width:${(s.lift / maxLift) * 100}%"></span></span>
          <em>${s.lift.toFixed(1)}배</em></div>`).join('')}</div></section>` : ''}

      ${k.season && sz ? `<section class="dsec"><h3>예년 월별 패턴</h3>
        <p class="hint">최근 ${k.season.years}년 평균이에요. ${sz.nextMonth}월이 강조돼 있어요.</p>
        <div class="months">${bars(k.season.idx, 320, 90, sz.nextMonth - 1)}
          <div class="axis m">${Array.from({ length: 12 }, (_, i) => `<span>${i + 1}</span>`).join('')}</div></div>
      </section>` : ''}

      ${k.posts?.length ? `<section class="dsec"><h3>최근 블로그·카페 글</h3><ul class="posts">${k.posts.map((p) => `
        <li><button class="link" data-url="${esc(p.link)}"><b>${esc(p.title)}</b><span>${esc(p.source)}${p.date ? ' · ' + esc(p.date) : ''}</span></button></li>`).join('')}</ul></section>` : ''}
    `;
    $('detail').hidden = false;
    $('detail').scrollTop = 0;
    document.body.style.overflow = 'hidden';
    if (push) history.pushState({ id }, '', `#${id}`);
    $('back').focus();
  }

  function closeDetail() {
    $('detail').hidden = true;
    document.body.style.overflow = '';
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-id],[data-url],[data-sort],[data-cat],[data-per],[data-all]');
    if (!t) return;
    if (t.dataset.url) return openExternal(t.dataset.url);
    if (t.dataset.id) return openDetail(t.dataset.id);
    if (t.dataset.all) { showAll = true; return render(); }
    if (t.dataset.per) { per = +t.dataset.per; return render(); }
    if (t.dataset.sort) { sort = t.dataset.sort; showAll = false; return render(); }
    if (t.dataset.cat) { cat = t.dataset.cat; showAll = false; render(); }
  });
  $('back').addEventListener('click', () => history.back());
  window.addEventListener('popstate', () => {
    const id = location.hash.slice(1);
    if (id) openDetail(id, false); else closeDetail();
  });

  async function load() {
    try {
      let res = await fetch('data.json', { cache: 'no-cache' }).catch(() => null);
      if (!res || !res.ok) res = await fetch('/api/dashboard');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '데이터를 불러오지 못했어요.');
      data = json;
      render();
      const id = location.hash.slice(1);
      if (id) openDetail(id, false);
    } catch (e) {
      $('feature').innerHTML = `<p class="empty">${esc(e.message)} 잠시 후 새로고침해 주세요.</p>`;
    }
  }
  load();
})();
