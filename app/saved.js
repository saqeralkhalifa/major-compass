/* Saved screen: quiz result history and the cross-tool shortlist. */
(function () {
  var A = window.MCAPP, MAJORS = {};
  function L() { return document.documentElement.lang === 'ar' ? 'ar' : 'en'; }
  function t(en, ar) { return L() === 'ar' ? ar : en; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  function setLang(l) {
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    try { localStorage.setItem(A.K_LANG, l); } catch (e) {}
    document.querySelectorAll('[data-en]').forEach(function (el) {
      el.textContent = el.getAttribute(l === 'ar' ? 'data-ar' : 'data-en');
    });
    document.title = l === 'ar' ? 'المحفوظات' : 'Saved';
    render();
  }
  window.mcAppSetLang = setLang;
  function resolveLang() {
    try {
      var q = new URLSearchParams(location.search).get('lang');
      if (q === 'ar' || q === 'en') return q;
      var s = localStorage.getItem(A.K_LANG);
      if (s === 'ar' || s === 'en') return s;
    } catch (e) {}
    return (navigator.language || '').slice(0, 2) === 'ar' ? 'ar' : 'en';
  }

  var DB = {
    medical: { en: 'no blood or medical work', ar: 'لا دم ولا عمل طبي' },
    math: { en: 'no heavy maths', ar: 'لا رياضيات ثقيلة' },
    speaking: { en: 'no constant public speaking', ar: 'لا حديث أمام الناس باستمرار' },
    routine: { en: 'no repetitive routine', ar: 'لا روتين متكرر' },
    physical: { en: 'no physically demanding work', ar: 'لا عمل بدني شاق' }
  };

  function name(id) { var m = MAJORS[id]; return m ? m[L()] : id; }

  function renderResults() {
    var box = document.getElementById('results');
    var list = A.readJSON(A.K_RESULTS, []);
    if (!Array.isArray(list) || !list.length) {
      box.innerHTML = '<div class="card empty">' +
        t('You have not finished the quiz yet. It takes about seven minutes.',
          'لم تُكمل الاختبار بعد. يستغرق نحو سبع دقائق.') +
        ' <a href="quiz.html">' + t('Start it', 'ابدأه') + '</a>.</div>';
      return;
    }
    box.innerHTML = list.map(function (r, idx) {
      var d = new Date(r.ts);
      var rows = (r.top || []).map(function (x) {
        return '<div class="row">' +
          '<div class="nm"><a href="explore.html#' + esc(x.id) + '">' + esc(name(x.id)) + '</a></div>' +
          '<div class="bar"><i style="width:' + Math.max(4, Math.min(100, x.pct)) + '%"></i></div>' +
          '<div class="pct">' + x.pct + '%</div></div>';
      }).join('');
      var avoid = r.avoid && r.avoid !== 'none' && DB[r.avoid]
        ? '<div class="when" style="margin-top:10px">' + t('You ruled out: ', 'استبعدت: ') + DB[r.avoid][L()] + '</div>' : '';
      return '<div class="card">' +
        '<div class="when">' + d.toLocaleDateString(L() === 'ar' ? 'ar' : 'en-GB',
          { day: 'numeric', month: 'long', year: 'numeric' }) +
        (r.code ? '  ·  ' + esc(r.code) : '') + '</div>' +
        rows + avoid +
        '<div class="acts">' +
          '<button class="btn" data-share="' + idx + '" type="button">' + t('Share', 'مشاركة') + '</button>' +
          '<a class="btn ghost" href="entry.html">' + t('Entry requirements', 'شروط القبول') + '</a>' +
          '<button class="btn ghost" data-del="' + idx + '" type="button">' + t('Delete', 'حذف') + '</button>' +
        '</div></div>';
    }).join('');

    box.querySelectorAll('[data-del]').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = +b.getAttribute('data-del'), l = A.readJSON(A.K_RESULTS, []);
        l.splice(i, 1); A.writeJSON(A.K_RESULTS, l); render();
      });
    });
    box.querySelectorAll('[data-share]').forEach(function (b) {
      b.addEventListener('click', function () {
        var r = A.readJSON(A.K_RESULTS, [])[+b.getAttribute('data-share')];
        if (!r) return;
        var names = (r.top || []).slice(0, 3).map(function (x) { return name(x.id); });
        var txt = t('My top three majors on Major Compass: ', 'أفضل ثلاثة تخصصات لي على بوصلة التخصص: ') +
          names.join(t(', ', '، ')) + '. https://saqeralkhalifa.github.io/major-compass/';
        if (navigator.share) { navigator.share({ text: txt }).catch(function () {}); }
        else if (navigator.clipboard) {
          navigator.clipboard.writeText(txt).then(function () {
            b.textContent = t('Copied', 'نُسخ');
            setTimeout(function () { b.textContent = t('Share', 'مشاركة'); }, 1600);
          });
        }
      });
    });
  }

  function renderShortlist() {
    var box = document.getElementById('shortlist');
    var list = A.readJSON(A.K_SHORTLIST, []);
    if (!Array.isArray(list) || !list.length) {
      box.innerHTML = '<div class="card empty">' +
        t('Nothing saved yet. Tap the bookmark in the top bar on any page to keep it here.',
          'لا شيء محفوظ بعد. اضغط علامة الحفظ في الشريط العلوي في أي صفحة لتحتفظ بها هنا.') + '</div>';
      return;
    }
    box.innerHTML = '<div class="card">' + list.map(function (x, i) {
      return '<div class="item"><div class="lb"><a href="' + esc(x.url) + '">' + esc(x.label) + '</a>' +
        '<small>' + esc((x.page || '').replace('.html', '')) + '</small></div>' +
        '<button class="x" data-rm="' + i + '" type="button" aria-label="' + t('Remove', 'إزالة') + '">×</button></div>';
    }).join('') + '</div>';
    box.querySelectorAll('[data-rm]').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = +b.getAttribute('data-rm'), l = A.readJSON(A.K_SHORTLIST, []);
        l.splice(i, 1); A.writeJSON(A.K_SHORTLIST, l); render();
      });
    });
  }

  function render() { renderResults(); renderShortlist(); }

  setLang(resolveLang());
  fetch('data/majors.json').then(function (r) { return r.json(); })
    .then(function (m) { MAJORS = m || {}; render(); })
    .catch(function () { render(); });
})();
