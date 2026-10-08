(() => {
  const qs = new URLSearchParams(location.search);
  if (qs.get('embed') === '1') document.body.classList.add('embed');
  if (qs.get('theme')) document.documentElement.dataset.theme = qs.get('theme'); // 앱 테마 강제용

  const $ = (id) => document.getElementById(id);
  const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LOW = 5; // 관심도 5 미만은 표본이 작아 변화율이 크게 튐
  const CHEV = '<svg class="chev" viewBox="0 0 8 14" aria-hidden="true"><path d="M1 1l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  let data, sort = 'growth', cat = '전체', per = 4;

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
  const g = (k) => k['growth' + per] ?? (per === 4 ? k.growth : null);
  const dir = (v) => (v == null ? 'flat' : v >= 3 ? 'up' : v <= -3 ? 'down' : 'flat');
  const pct = (v) => (v == null ? '–' : `${v > 0 ? '+' : ''}${v.toFixed(0)}%`);
  const md = (iso) => { const d = new Date(iso); return `${d.getMonth() + 1}월 ${d.getDate()}일`; };
  const perLabel = () => (per === 1 ? '지난주' : `최근 ${per}주`);
  const vsLabel = () => (per === 1 ? '그 전주 대비' : `직전 ${per}주 대비`);
  const stamp = (iso) => new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'short', hour: 'numeric', minute: '2-digit' });
  const isNew = (k) => k.firstSeen && (Date.now() - new Date(k.firstSeen + 'T00:00:00+09:00')) < 14 * 864e5;
  const all = () => [...data.keywords, ...(data.discovered || [])];

  function row(k, i, sub) {
    const v = g(k);
    return `<li><button class="item" data-id="${esc(k.id)}">
      <span class="rank">${i + 1}</span>
      <span class="nm"><b>${esc(k.name)}${isNew(k) ? ' <em class="new">NEW</em>' : ''}</b><span>${sub}</span></span>
      <span class="${dir(v)}">${spark(k.series, 64, 26)}</span>
      <span class="chg ${dir(v)}">${sort === 'index' && !k.discovered ? k.index.toFixed(0) : pct(v)}<small>${sort === 'index' && !k.discovered ? pct(v) : '관심도 ' + k.index.toFixed(k.index < 10 ? 1 : 0)}</small></span>
      ${CHEV}
    </button></li>`;
  }

  function render() {
    const ks = data.keywords;
    const last = data.weeks[data.weeks.length - 1];
    const end = new Date(last + 'T00:00:00'); end.setDate(end.getDate() + 6);
    $('stamp').textContent = `${stamp(data.updatedAt)} 업데이트 · ${md(end)}까지 네이버 검색 기준`;
    $('sample').hidden = !data.isSample;
    document.querySelectorAll('[data-per]').forEach((b) => b.setAttribute('aria-selected', String(+b.dataset.per === per)));

    // 히어로: 선택한 기간에 가장 많이 오른 시술 (지난주 기준이 아니면 일시 급등 제외)
    const top = ks.filter((k) => k.index >= LOW && g(k) != null && (per === 1 || !k.spike)).sort((a, b) => g(b) - g(a))[0];
    $('hero').innerHTML = top ? `
      <button data-id="${top.id}">
        <p class="lead">${perLabel()} 가장 많이 찾기 시작한 시술</p>
        <p class="name">${esc(top.name)}</p>
        <div class="row">
          <span class="${dir(g(top))}">${spark(top.series, 300, 56)}</span>
          <span class="pct">${pct(g(top))}<small>${vsLabel()}</small></span>
        </div>
        <span class="more">흐름·관심층 자세히 보기 ${CHEV}</span>
      </button>` : '';

    // 새로 포착된 키워드
    const disc = (data.discovered || []).filter((k) => g(k) != null).sort((a, b) => (isNew(b) - isNew(a)) || (g(b) - g(a))).slice(0, 8);
    $('discWrap').hidden = !disc.length;
    $('discHint').textContent = `최근 블로그·카페 글${data.scanned ? ` ${data.scanned.toLocaleString()}건` : ''}에서 자주 등장한, 위 목록에 없는 시술·장비 이름이에요. 자동으로 찾아낸 것이라 시술명이 아닌 단어가 섞일 수 있어요.`;
    $('disc').innerHTML = disc.map((k, i) => row(k, i, `글 ${k.mentions}건에서 언급`)).join('');

    // 카테고리 칩
    const cats = ['전체', ...new Set(ks.map((k) => k.category))];
    $('chips').innerHTML = cats.map((c) => `<button aria-pressed="${c === cat}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');

    // 주요 시술 목록
    const list = ks.filter((k) => cat === '전체' || k.category === cat)
      .sort((a, b) => sort === 'index' ? b.index - a.index
        : ((b.index >= LOW) - (a.index >= LOW)) || ((g(b) ?? -999) - (g(a) ?? -999)));
    $('list').innerHTML = list.map((k, i) => row(k, i, `${esc(k.category)}${k.spike && per !== 1 ? ' · <em class="tag">일시 급등</em>' : ''}`)).join('');
    $('note').textContent = `관심도는 네이버 검색량을 보톡스 = 100으로 맞춘 상대값이에요. 변화율은 ${perLabel()}와 ${per === 1 ? '그 전주' : `그 전 ${per}주`}를 비교했어요.`;

    // 뉴스
    $('newsWrap').hidden = !data.news?.length;
    $('news').innerHTML = (data.news || []).map((n) => `
      <li><button class="link" data-url="${esc(n.link)}"><b>${esc(n.title)}</b><span>${md(n.date)}</span></button></li>`).join('');
  }

  function openDetail(id, push = true) {
    const k = all().find((x) => x.id === id);
    if (!k) return;
    const w = data.weeks;
    const segs = k.segments || [];
    const top = [...segs].sort((a, b) => b.lift - a.lift)[0];
    const maxLift = Math.max(...segs.map((s) => s.lift), 1);
    const v = g(k);

    $('dbody').innerHTML = `
      <div class="dhead"><h2 id="dTitle">${esc(k.name)}</h2><p>${esc(k.category)}${k.firstSeen ? ` · ${md(k.firstSeen)} 처음 포착` : ''}</p></div>
      <div class="stats">
        <div><strong class="${dir(v)}">${pct(v)}</strong>${vsLabel()}</div>
        <div><strong>${k.index.toFixed(k.index < 10 ? 1 : 0)}</strong>관심도 (보톡스 100)</div>
        ${k.mentions ? `<div><strong>${k.mentions}</strong>최근 글 언급</div>` : ''}
      </div>
      <div class="chart ${dir(v)}">${spark(k.series, 320, 150)}
        <div class="axis"><span>${md(w[0])}</span><span>최근 16주</span><span>${md(w[w.length - 1])}</span></div></div>
      ${k.discovered ? '<p class="warn">글에서 자동으로 찾아낸 단어예요. 시술·장비 이름이 맞는지 아래 글로 확인해 주세요.</p>' : ''}
      ${k.spike && per !== 1 ? '<p class="warn">최근 한 주에만 검색이 몰렸어요. 이슈성 검색일 수 있으니 다음 주 흐름을 같이 보세요.</p>' : ''}
      ${k.index < LOW && !k.discovered ? '<p class="warn">검색량이 적은 시술이라 변화율이 크게 흔들릴 수 있어요.</p>' : ''}

      ${segs.length ? `<section class="dsec"><h3>누가 더 찾나</h3>
        <p class="hint">보톡스와 비교해 각 층에서 상대적으로 얼마나 더 찾는지예요. 1.0배가 평균이에요.</p>
        <div class="bars">${segs.map((s) => `
          <div class="bar ${s === top && s.lift >= 1.15 ? 'hi' : ''}"><span>${esc(s.label)}</span>
          <span class="track"><span class="fill" style="width:${(s.lift / maxLift) * 100}%"></span></span>
          <em>${s.lift.toFixed(1)}배</em></div>`).join('')}</div></section>` : ''}

      ${k.posts?.length ? `<section class="dsec"><h3>${k.discovered ? '이 키워드가 나온 글' : '최근 블로그·카페 글'}</h3><ul class="posts">${k.posts.map((p) => `
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
    const t = e.target.closest('[data-id],[data-url],[data-sort],[data-cat],[data-per]');
    if (!t) return;
    if (t.dataset.url) return openExternal(t.dataset.url);
    if (t.dataset.id) return openDetail(t.dataset.id);
    if (t.dataset.per) { per = +t.dataset.per; return render(); }
    if (t.dataset.sort) {
      sort = t.dataset.sort;
      document.querySelectorAll('[data-sort]').forEach((b) => b.setAttribute('aria-selected', String(b === t)));
      return render();
    }
    if (t.dataset.cat) { cat = t.dataset.cat; render(); }
  });
  $('back').addEventListener('click', () => history.back());
  // 안드로이드 하드웨어 뒤로가기 → 상세 닫힘
  window.addEventListener('popstate', () => {
    const id = decodeURIComponent(location.hash.slice(1));
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
      const id = decodeURIComponent(location.hash.slice(1));
      if (id) openDetail(id, false);
    } catch (e) {
      $('hero').innerHTML = `<p class="empty">${esc(e.message)} 잠시 후 새로고침해 주세요.</p>`;
    }
  }
  load();
})();
