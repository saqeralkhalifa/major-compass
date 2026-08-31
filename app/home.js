/* Home screen: language, the resume card, the next deadline, and reminder set-up. */
(function () {
  var A = window.MCAPP;
  var K_CT = 'mc-app-countries', K_NOTIF = 'mc-app-notify';

  /* ---------- language ---------- */
  function resolveLang() {
    try {
      var q = new URLSearchParams(location.search).get('lang');
      if (q === 'ar' || q === 'en') return q;
      var s = localStorage.getItem(A.K_LANG);
      if (s === 'ar' || s === 'en') return s;
    } catch (e) {}
    return (navigator.language || '').slice(0, 2) === 'ar' ? 'ar' : 'en';
  }
  function setLang(l) {
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    try { localStorage.setItem(A.K_LANG, l); } catch (e) {}
    document.querySelectorAll('[data-en]').forEach(function (el) {
      var v = el.getAttribute(l === 'ar' ? 'data-ar' : 'data-en');
      if (v !== null) el.textContent = v;
    });
    document.title = l === 'ar' ? 'بوصلة الشباب' : 'Youth Compass';
    var hl = document.getElementById('heroLang');
    if (hl) hl.textContent = l === 'ar' ? 'EN' : 'ع';
    paintResume(); paintDeadline(); paintChips(); paintNotify();
  }
  window.mcAppSetLang = setLang;
  function L() { return document.documentElement.lang === 'ar' ? 'ar' : 'en'; }
  function t(en, ar) { return L() === 'ar' ? ar : en; }

  /* ---------- data ---------- */
  var MAJORS = {}, DEADLINES = null;

  /* Content lives in data/*.json. The copy inside the app is the floor; a newer
     copy on the site wins, so a corrected deadline reaches a phone without an
     App Store release. Cached in localStorage so it survives being offline. */
  var REMOTE = 'https://saqeralkhalifa.github.io/major-compass/app-data/';
  function load(url) {
    var file = url.split('/').pop();
    var key = 'mc-app-cache-' + file;
    var local = fetch(url).then(function (r) { return r.json(); }).catch(function () { return null; });
    var cached = A.readJSON(key, null);
    var remote = new Promise(function (resolve) {
      var done = false;
      var timer = setTimeout(function () { if (!done) { done = true; resolve(null); } }, 4000);
      fetch(REMOTE + file, { cache: 'no-cache' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          clearTimeout(timer);
          if (!done) { done = true; resolve(j); }
        })
        .catch(function () { clearTimeout(timer); if (!done) { done = true; resolve(null); } });
    });
    return remote.then(function (r) {
      if (r && typeof r === 'object') { A.writeJSON(key, r); return r; }
      if (cached) return cached;
      return local;
    });
  }

  /* ---------- resume card ---------- */
  function paintResume() {
    var list = A.readJSON(A.K_RESULTS, []);
    var el = document.getElementById('resume');
    if (!el || !list.length) return;
    var r = list[0];
    var names = (r.top || []).slice(0, 3).map(function (x) {
      var m = MAJORS[x.id];
      return m ? m[L()] : x.id;
    });
    el.style.display = '';
    document.getElementById('resumeTop').textContent = names.join(t(', ', '، '));
    var d = new Date(r.ts);
    document.getElementById('resumeSub').textContent =
      t('Tap to see all five, and everything you have saved.',
        'اضغط لعرض الخمسة كاملة وكل ما حفظته.') + ' ' +
      d.toLocaleDateString(L() === 'ar' ? 'ar' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  /* ---------- next deadline ---------- */
  function myCountries() {
    var c = A.readJSON(K_CT, []);
    return Array.isArray(c) ? c : [];
  }
  function relevant(item) {
    if (item.ct === 'all') return true;
    var mine = myCountries();
    if (!mine.length) return true;
    return item.ct.split(',').some(function (c) { return mine.indexOf(c) !== -1; });
  }
  function whenOf(item) {
    var now = new Date();
    if (item.date) {
      var d = new Date(item.date + 'T09:00:00');
      return d > now ? d : null;
    }
    if (item.month) {
      var y = now.getFullYear();
      var d2 = new Date(y, item.month - 1, 1, 9, 0, 0);
      if (d2 <= now) d2 = new Date(y + 1, item.month - 1, 1, 9, 0, 0);
      return d2;
    }
    return null;
  }
  function upcoming() {
    if (!DEADLINES) return [];
    return DEADLINES.items
      .filter(relevant)
      .map(function (i) { return { i: i, w: whenOf(i) }; })
      .filter(function (x) { return x.w; })
      .sort(function (a, b) { return a.w - b.w; });
  }
  function paintDeadline() {
    var up = upcoming();
    var el = document.getElementById('nextDeadline');
    if (!el || !up.length) return;
    var x = up[0], c = x.i[L()];
    el.style.display = '';
    el.setAttribute('href', x.i.page || 'internships.html');
    document.getElementById('dlTitle').textContent = c.t;
    document.getElementById('dlBody').textContent = c.b;
    var days = Math.max(0, Math.round((x.w - Date.now()) / 86400000));
    document.getElementById('dlWhen').textContent =
      days === 0 ? t('Today', 'اليوم')
      : days === 1 ? t('Tomorrow', 'غدًا')
      : t('In ' + days + ' days', 'بعد ' + days + ' يومًا');
  }

  /* ---------- country chips ---------- */
  var CTS = [
    { k: 'bh', en: 'Bahrain', ar: 'البحرين' }, { k: 'sa', en: 'Saudi Arabia', ar: 'السعودية' },
    { k: 'ae', en: 'UAE', ar: 'الإمارات' }, { k: 'qa', en: 'Qatar', ar: 'قطر' },
    { k: 'kw', en: 'Kuwait', ar: 'الكويت' }, { k: 'om', en: 'Oman', ar: 'عُمان' }
  ];
  function paintChips() {
    var box = document.getElementById('ctChips');
    if (!box) return;
    var mine = myCountries();
    box.innerHTML = CTS.map(function (c) {
      return '<button class="chip' + (mine.indexOf(c.k) !== -1 ? ' on' : '') + '" data-k="' + c.k + '" type="button">' +
        (L() === 'ar' ? c.ar : c.en) + '</button>';
    }).join('');
    box.querySelectorAll('.chip').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-k'), mine = myCountries(), i = mine.indexOf(k);
        if (i >= 0) mine.splice(i, 1); else mine.push(k);
        A.writeJSON(K_CT, mine);
        paintChips(); paintDeadline();
        if (A.readJSON(K_NOTIF, false)) schedule();
      });
    });
  }

  /* ---------- reminders ---------- */
  function LN() {
    var C = window.Capacitor;
    return (C && C.Plugins && C.Plugins.LocalNotifications) ? C.Plugins.LocalNotifications : null;
  }
  function hash(s) { var h = 0, i; for (i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; } return Math.abs(h) % 2000000000; }
  function schedule() {
    var ln = LN();
    if (!ln || !DEADLINES) return Promise.resolve(0);
    var list = upcoming().slice(0, 40).map(function (x) {
      var c = x.i[L()];
      return { id: hash(x.i.id), title: c.t, body: c.b, schedule: { at: x.w }, extra: { page: x.i.page } };
    });
    return ln.cancel({ notifications: list.map(function (n) { return { id: n.id }; }) })
      .catch(function () {})
      .then(function () { return ln.schedule({ notifications: list }); })
      .then(function () { return list.length; })
      .catch(function () { return 0; });
  }
  function paintNotify() {
    var btn = document.getElementById('notifyBtn'), note = document.getElementById('notifyNote');
    if (!btn) return;
    var on = A.readJSON(K_NOTIF, false);
    btn.textContent = on ? t('Reminders are on', 'التنبيهات مفعّلة') : t('Turn on reminders', 'فعّل التنبيهات');
    btn.style.opacity = on ? '.65' : '1';
    if (!LN()) {
      note.textContent = t('Reminders need the installed app. Everything else works here.',
                           'التنبيهات تحتاج التطبيق المثبّت. بقية المزايا تعمل هنا.');
    } else if (on) {
      note.textContent = t('You can turn these off in your phone settings at any time.',
                           'يمكنك إيقافها من إعدادات هاتفك في أي وقت.');
    } else {
      note.textContent = '';
    }
  }
  function initNotify() {
    var btn = document.getElementById('notifyBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var ln = LN();
      if (!ln) { paintNotify(); return; }
      ln.requestPermissions().then(function (res) {
        if (res && (res.display === 'granted' || res.display === 'prompt')) {
          A.writeJSON(K_NOTIF, true);
          schedule().then(function (n) {
            paintNotify();
            document.getElementById('notifyNote').textContent =
              t(n + ' reminders set.', 'تم ضبط ' + n + ' تنبيهًا.');
          });
        } else {
          document.getElementById('notifyNote').textContent =
            t('Permission was declined. You can enable it in phone settings.',
              'تم رفض الإذن. يمكنك تفعيله من إعدادات الهاتف.');
        }
      }).catch(function () {});
    });
  }

  /* ---------- go ---------- */
  document.getElementById('heroLang').addEventListener('click', function () {
    setLang(L() === 'ar' ? 'en' : 'ar');
  });
  setLang(resolveLang());
  initNotify();
  Promise.all([load('data/majors.json'), load('data/deadlines.json')]).then(function (r) {
    MAJORS = r[0] || {};
    DEADLINES = r[1];
    paintResume(); paintDeadline();
    if (A.readJSON(K_NOTIF, false)) schedule();
  });
})();
