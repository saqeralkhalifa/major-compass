/* Runs in <head>, before the page's own scripts.
   Two jobs: mark the document as app-mode before first paint so the website
   header never flashes, and tap the quiz's results POST so a student's result
   is kept on the device. */
(function () {
  document.documentElement.classList.add('mcapp');

  var K_RESULTS = 'mc-app-results';
  var FORM_HOST = 'docs.google.com/forms';
  var FORM_ENTRY = 'entry.156577286';

  function readJSON(k, fallback) {
    try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function writeJSON(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; }
  }

  function saveResult(payload) {
    if (!payload || !payload.top || !payload.top.length) return;
    var list = readJSON(K_RESULTS, []);
    if (!Array.isArray(list)) list = [];
    var rec = {
      ts: Date.now(),
      lang: payload.lang || 'en',
      code: payload.code || '',
      top: payload.top.slice(0, 5),
      puzzles: payload.puzzles,
      years: payload.years,
      avoid: payload.avoid,
      market: payload.market || ''
    };
    // guard against a double-fire writing the same result twice
    var last = list[0];
    if (last && last.code === rec.code && (rec.ts - last.ts) < 20000) return;
    list.unshift(rec);
    writeJSON(K_RESULTS, list.slice(0, 25));
  }

  function extract(body) {
    try {
      if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) {
        var raw = body.get(FORM_ENTRY);
        if (raw) return JSON.parse(raw);
      }
      if (typeof body === 'string' && body.indexOf(FORM_ENTRY) !== -1) {
        var p = new URLSearchParams(body).get(FORM_ENTRY);
        if (p) return JSON.parse(p);
      }
    } catch (e) {}
    return null;
  }

  if (window.fetch) {
    var orig = window.fetch;
    window.fetch = function (input, init) {
      try {
        var url = (typeof input === 'string') ? input : (input && input.url) || '';
        if (url.indexOf(FORM_HOST) !== -1 && init && init.body) {
          var payload = extract(init.body);
          if (payload) saveResult(payload);
        }
      } catch (e) {}
      return orig.apply(this, arguments);
    };
  }

  window.MCAPP = {
    K_RESULTS: K_RESULTS,
    K_SHORTLIST: 'mc-app-shortlist',
    K_LANG: 'mc-lang',
    readJSON: readJSON,
    writeJSON: writeJSON,
    saveResult: saveResult
  };
})();
