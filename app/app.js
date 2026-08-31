/* Major Compass app chrome: top bar, bottom tabs, shortlist, external links,
   offline banner, service worker. Loaded at the end of <body> on every page,
   after the page's own scripts have defined their language toggle. */
(function () {
  var A = window.MCAPP || {};
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  var PAGES = {
    'index.html':        { en: 'Youth Compass',          ar: 'بوصلة الشباب',            tab: 'home',  chrome: false },
    'saved.html':        { en: 'Saved',                   ar: 'المحفوظات',              tab: 'saved', star: false },
    'quiz.html':         { en: 'The Quiz',                ar: 'الاختبار',                tab: 'quiz'  },
    'explore.html':      { en: 'Every Major',             ar: 'كل التخصصات',            tab: 'explore' },
    'entry.html':        { en: 'Entry Requirements',      ar: 'شروط القبول',            tab: 'explore' },
    'scholarships.html': { en: 'Scholarships',            ar: 'المنح والتمويل',         tab: 'explore' },
    'parents.html':      { en: 'For Parents',             ar: 'لأولياء الأمور',         tab: 'explore' },
    'ai.html':           { en: 'AI and Your Major',       ar: 'الذكاء الاصطناعي',       tab: 'explore' },
    'routes.html':       { en: 'Dealbreakers',            ar: 'ماذا يغلق كل شرط',       tab: 'explore' },
    'alternatives.html': { en: 'Without a Degree',        ar: 'بدون شهادة',              tab: 'explore' },
    'internships.html':  { en: 'Internships',             ar: 'فرص التدريب',            tab: 'jobs'  },
    'cv.html':           { en: 'Build a CV',              ar: 'السيرة الذاتية',          tab: 'jobs'  },
    'work.html':         { en: 'Work and Funding',        ar: 'العمل والتمويل',          tab: 'jobs'  },
    'gigs.html':         { en: 'Gigs and Flexible Work',  ar: 'الأعمال القصيرة',         tab: 'jobs'  },
    'investors.html':    { en: 'Ideas Seeking Investors', ar: 'أفكار تبحث عن مستثمرين',  tab: 'jobs'  }
  };
  var meta = PAGES[here] || { en: document.title, ar: document.title, tab: '' };

  var LOCAL = Object.keys(PAGES);
  function isLocal(href) {
    if (!href) return false;
    if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return false;
    if (/^https?:\/\//i.test(href)) return false;
    var f = href.split('?')[0].split('#')[0].split('/').pop().toLowerCase();
    return LOCAL.indexOf(f) !== -1 || f === '';
  }

  function lang() {
    return document.documentElement.lang === 'ar' ? 'ar' : 'en';
  }
  function t(en, ar) { return lang() === 'ar' ? ar : en; }

  /* ---------- icons ---------- */
  var ICON = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    quiz: '<path d="M9 11l2.5 2.5L16 8"/><rect x="3.5" y="3.5" width="17" height="17" rx="3"/>',
    explore: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.9-3.9"/>',
    jobs: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7"/>',
    saved: '<path d="M6 4h12v16l-6-4-6 4z"/>',
    star: '<path d="M6 4h12v16l-6-4-6 4z"/>',
    back: '<path d="M15 5l-7 7 7 7"/>'
  };
  function svg(d, cls) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" class="' + (cls || '') + '">' + d + '</svg>';
  }

  /* ---------- toast ---------- */
  var toastEl;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'mcapp-toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.classList.remove('show'); }, 1900);
  }

  /* ---------- shortlist ---------- */
  function shortlist() {
    var l = A.readJSON ? A.readJSON(A.K_SHORTLIST, []) : [];
    return Array.isArray(l) ? l : [];
  }
  function currentItem() {
    var hash = (location.hash || '').replace('#', '');
    var label = '';
    if (hash) {
      var el = document.getElementById(hash);
      if (el) {
        var h = el.querySelector('h1,h2,h3,h4,.mhead,.mname,strong');
        label = ((h && h.textContent) || el.textContent || '').trim().split('\n')[0].slice(0, 90);
      }
    }
    if (!label) label = (document.title || here).split('|')[0].trim();
    return { id: here + (hash ? '#' + hash : ''), url: here + (hash ? '#' + hash : ''), label: label, page: here };
  }
  function inList(id) {
    return shortlist().some(function (x) { return x.id === id; });
  }
  function toggleStar() {
    var item = currentItem();
    var list = shortlist();
    var i = -1;
    list.forEach(function (x, n) { if (x.id === item.id) i = n; });
    if (i >= 0) {
      list.splice(i, 1);
      toast(t('Removed from Saved', 'أُزيل من المحفوظات'));
    } else {
      item.ts = Date.now();
      list.unshift(item);
      toast(t('Saved', 'حُفظ'));
    }
    A.writeJSON(A.K_SHORTLIST, list.slice(0, 200));
    paintStar();
  }
  var starBtn;
  function paintStar() {
    if (!starBtn) return;
    var on = inList(currentItem().id);
    starBtn.classList.toggle('on', on);
    starBtn.setAttribute('aria-label', on ? t('Remove from saved', 'إزالة من المحفوظات') : t('Save', 'حفظ'));
  }

  /* ---------- language ---------- */
  function toggleLang() {
    var own = document.getElementById('langToggle');
    if (own) { own.click(); }
    else if (window.mcAppSetLang) { window.mcAppSetLang(lang() === 'ar' ? 'en' : 'ar'); }
    setTimeout(paintChrome, 60);
  }

  /* ---------- chrome ---------- */
  var topEl, tabsEl, titleEl, langBtn, backBtn;
  function buildChrome() {
    if (meta.chrome === false && here === 'index.html') {
      document.documentElement.classList.add('mcapp-nochrome');
    } else {
      topEl = document.createElement('div');
      topEl.className = 'mcapp-top';
      topEl.innerHTML =
        '<button class="mcapp-back" type="button" aria-label="Back">' + svg(ICON.back) + '</button>' +
        '<div class="mcapp-title"></div>' +
        (meta.star === false ? '' : '<button class="mcapp-star" type="button">' + svg(ICON.star) + '</button>') +
        '<button class="mcapp-lang" type="button"></button>';
      document.body.appendChild(topEl);
      var off = document.createElement('div');
      off.className = 'mcapp-offline';
      off.textContent = t('Offline. Showing the copy saved on this phone.', 'بدون اتصال. تُعرض النسخة المحفوظة على الجهاز.');
      document.body.appendChild(off);

      titleEl = topEl.querySelector('.mcapp-title');
      langBtn = topEl.querySelector('.mcapp-lang');
      backBtn = topEl.querySelector('.mcapp-back');
      starBtn = topEl.querySelector('.mcapp-star');
      backBtn.addEventListener('click', function () {
        if (history.length > 1) history.back(); else location.href = 'index.html';
      });
      langBtn.addEventListener('click', toggleLang);
      if (starBtn) starBtn.addEventListener('click', toggleStar);
    }

    tabsEl = document.createElement('nav');
    tabsEl.className = 'mcapp-tabs';
    var TABS = [
      { k: 'home',    href: 'index.html',       en: 'Home',        ar: 'الرئيسية', i: ICON.home },
      { k: 'quiz',    href: 'quiz.html',        en: 'Quiz',        ar: 'الاختبار', i: ICON.quiz },
      { k: 'explore', href: 'explore.html',     en: 'Explore',     ar: 'استكشف',  i: ICON.explore },
      { k: 'jobs',    href: 'work.html',        en: 'Work',        ar: 'العمل',   i: ICON.jobs },
      { k: 'saved',   href: 'saved.html',       en: 'Saved',       ar: 'المحفوظات', i: ICON.saved }
    ];
    tabsEl.innerHTML = TABS.map(function (x) {
      return '<a href="' + x.href + '" data-k="' + x.k + '" class="' + (x.k === meta.tab ? 'on' : '') + '">' +
        svg(x.i) + '<span data-en="' + x.en + '" data-ar="' + x.ar + '"></span></a>';
    }).join('');
    document.body.appendChild(tabsEl);
  }

  function paintChrome() {
    var l = lang();
    if (titleEl) titleEl.textContent = meta[l] || meta.en;
    if (langBtn) langBtn.textContent = l === 'ar' ? 'EN' : 'ع';
    if (tabsEl) {
      tabsEl.querySelectorAll('span[data-en]').forEach(function (s) {
        s.textContent = s.getAttribute(l === 'ar' ? 'data-ar' : 'data-en');
      });
    }
    paintStar();
  }

  /* ---------- external links open outside the app ---------- */
  function openExternal(url) {
    try {
      var C = window.Capacitor;
      if (C && C.Plugins && C.Plugins.Browser) { C.Plugins.Browser.open({ url: url }); return; }
    } catch (e) {}
    window.open(url, '_blank', 'noopener');
  }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || isLocal(href)) return;
    if (/^https?:\/\//i.test(href)) {
      e.preventDefault();
      openExternal(href);
    }
  }, true);

  /* ---------- offline state ---------- */
  function net() {
    document.documentElement.classList.toggle('mcapp-isoffline', navigator.onLine === false);
  }
  window.addEventListener('online', net);
  window.addEventListener('offline', net);

  /* ---------- go ---------- */
  buildChrome();
  paintChrome();
  net();
  window.addEventListener('hashchange', paintStar);
  new MutationObserver(paintChrome).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  /* service worker only in the browser build; the native build ships the files */
  if ('serviceWorker' in navigator && !window.Capacitor && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
