(() => {
  const qs = new URLSearchParams(location.search);
  if (qs.get('embed') === '1') document.body.classList.add('embed');
  if (qs.get('theme')) document.documentElement.dataset.theme = qs.get('theme'); // 앱 테마 강제용

  const $ = (id) => document.getElementById(id);
  const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LOW = 5; // 관심도 5 미만은 표본이 작아 변화율이 크게 튐
  let data, sort = 'growth', cat = '전체';

  // 웹뷰에서 외부 링크는 앱에 넘긴다 (RN / iOS WKWebView / Android JS 브리지 순)
  function openExternal(url) {
    try {
      if (window.ReactNativeWebView) return window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'openExternal', url }));
      if (window.webkit?.messageHandlers?.openExternal) return window.webkit.messageHandlers.openExternal.postMessage(url);
      if (window.Android?.openExternal) return window.Android.openExternal(url);
    } catch (e) {}
    window.open(url, '_blank', 'noopener');
  }

  function spark(arr, w, h, cls) {
    const max = Math.max(...arr), min = Math.min(...arr), span = max - min || 1;
    const pts = arr.map((v, i) => `${(i / (arr.length - 1)) * w},${h - 2 - ((v - min) / span) * (h - 4)}`).join(' ');
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="1.6" vector-effect="non-scaling-stroke" class="${cls}"/></svg>`;
  }
  const dir = (g) => (g == null ? 'flat' : g >= 3 ? 'up' : g <= -3 ? 'down' : 'flat');
  const pct = (g) => (g == null ? '–' : `${g > 0 ? '+' : ''}${g.toFixed(0)}%`);
  const md = (iso) => { const d = new Date(iso); return `${d.getMonth() + 1}월 ${d.getDate()}일`; };

  function render() {
    const ks = data.keywords;
    const last = data.weeks[data.weeks.length - 1];
    const end = new Date(last + 'T00:00:00'); end.setDate(end.getDate() + 6);
    $('period').textContent = `${md(end)}까지 네이버 검색 기준 · ${md(data.updatedAt)} 업데이트`;
    $('sample').hidden = !data.isSample;

    // 히어로
    const top = ks.filter((k) => k.index >= LOW && k.growth != null && !k.spike).sort((a, b) => b.growth - a.growth)[0];
    $('hero').innerHTML = top ? `
      <button data-id="${top.id}">
        <p class="lead">최근 4주 동안 가장 많이 찾기 시작한 시술</p>
        <p class="name">${esc(top.name)}</p>
        <div class="row">
          <span class="${dir(top.growth)}">${spark(top.series, 300, 56, '')}</span>
          <span class="pct">${pct(top.growth)}<small>직전 4주 대비</small></span>
        </div>
        <span class="more">자세히 보기</span>
      </button>` : '';

    // 카테고리 칩
    const cats = ['전체', ...new Set(ks.map((k) => k.category))];
    $('chips').innerHTML = cats.map((c) => `<button aria-pressed="${c === cat}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');

    // 목록
    const list = ks.filter((k) => cat === '전체' || k.category === cat)
      .sort((a, b) => sort === 'index' ? b.index - a.index
        : ((b.index >= LOW) - (a.index >= LOW)) || ((b.growth ?? -999) - (a.growth ?? -999)));
    $('list').innerHTML = list.map((k, i) => `
      <li><button class="item" data-id="${k.id}">
        <span class="rank">${i + 1}</span>
        <span class="nm"><b>${esc(k.name)}</b><span>${esc(k.category)}${k.spike ? ' · <em class="tag">일시 급등</em>' : ''}</span></span>
        <span class="${dir(k.growth)}">${spark(k.series, 72, 26, '')}</span>
        <span class="chg ${dir(k.growth)}">${sort === 'index' ? k.index.toFixed(0) : pct(k.growth)}<small>${sort === 'index' ? pct(k.growth) : '관심도 ' + k.index.toFixed(0)}</small></span>
      </button></li>`).join('');

    // 뉴스
    $('newsWrap').hidden = !data.news?.length;
    $('news').innerHTML = (data.news || []).map((n) => `
      <li><button class="link" data-url="${esc(n.link)}"><b>${esc(n.title)}</b><span>${md(n.date)}</span></button></li>`).join('');
  }

  function openDetail(id, push = true) {
    const k = data.keywords.find((x) => x.id === id);
    if (!k) return;
    const w = data.weeks;
    const top = [...(k.segments || [])].sort((a, b) => b.lift - a.lift)[0];
    const maxLift = Math.max(...(k.segments || []).map((s) => s.lift), 1);

    $('dbody').innerHTML = `
      <div class="dhead"><h2 id="dTitle">${esc(k.name)}</h2><p>${esc(k.category)}</p></div>
      <div class="stats">
        <div><strong class="${dir(k.growth)}">${pct(k.growth)}</strong>직전 4주 대비</div>
        <div><strong>${k.index.toFixed(0)}</strong>관심도 (보톡스 100)</div>
      </div>
      <div class="chart ${dir(k.growth)}">${spark(k.series, 320, 150, '')}
        <div class="axis"><span>${md(w[0])}</span><span>최근 16주</span><span>${md(w[w.length - 1])}</span></div></div>
      ${k.spike ? '<p class="warn">최근 한 주에만 검색이 몰렸어요. 이슈성 검색일 수 있으니 다음 주 흐름을 같이 보세요.</p>' : ''}
      ${k.index < LOW ? '<p class="warn">검색량이 적은 시술이라 변화율이 크게 흔들릴 수 있어요.</p>' : ''}

      ${k.segments?.length ? `<section class="dsec"><h3>누가 더 찾나</h3>
        <p class="hint">보톡스와 비교해 각 층에서 상대적으로 얼마나 더 찾는지예요. 1.0배가 평균이에요.</p>
        <div class="bars">${k.segments.map((s) => `
          <div class="bar ${s === top && s.lift >= 1.15 ? 'hi' : ''}"><span>${esc(s.label)}</span>
          <span class="track"><span class="fill" style="width:${(s.lift / maxLift) * 100}%"></span></span>
          <em>${s.lift.toFixed(1)}배</em></div>`).join('')}</div></section>` : ''}


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

  // 이벤트
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-id],[data-url],[data-sort],[data-cat]');
    if (!t) return;
    if (t.dataset.url) return openExternal(t.dataset.url);
    if (t.dataset.id) return openDetail(t.dataset.id);
    if (t.dataset.sort) {
      sort = t.dataset.sort;
      document.querySelectorAll('[data-sort]').forEach((b) => b.setAttribute('aria-selected', b === t));
      return render();
    }
    if (t.dataset.cat) { cat = t.dataset.cat; render(); }
  });
  $('back').addEventListener('click', () => history.back());
  // 안드로이드 하드웨어 뒤로가기 → 상세 닫힘
  window.addEventListener('popstate', () => {
    const id = location.hash.slice(1);
    if (id) openDetail(id, false); else closeDetail();
  });

  async function load() {
    try {
      // 배포 사이트는 data.json, 내 컴퓨터(npm start)는 /api/dashboard
      let res = await fetch('data.json', { cache: 'no-cache' }).catch(() => null);
      if (!res || !res.ok) res = await fetch('/api/dashboard');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '데이터를 불러오지 못했어요.');
      data = json;
      render();
      const id = location.hash.slice(1);
      if (id) openDetail(id, false);
    } catch (e) {
      $('hero').innerHTML = `<p class="empty">${esc(e.message)} 잠시 후 새로고침해 주세요.</p>`;
    }
  }
  load();
})();
