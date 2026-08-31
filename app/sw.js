/* Major Compass service worker.
   The whole app is precached so it opens with no network. Content under data/
   is network-first, so a corrected deadline reaches the phone without a release. */
const CACHE = 'mc-app-yc20260831a';
const SHELL = [
  "ai.html",
  "alternatives.html",
  "gigs.html",
  "investors.html",
  "work.html",
  "app-early.js",
  "app.css",
  "app.js",
  "cv.html",
  "data/deadlines.json",
  "data/majors.json",
  "data/scholarship-months.json",
  "entry.html",
  "explore.html",
  "fonts.css",
  "fonts/eb-garamond-latin-400-italic.woff2",
  "fonts/eb-garamond-latin-400-normal.woff2",
  "fonts/eb-garamond-latin-500-normal.woff2",
  "fonts/eb-garamond-latin-600-normal.woff2",
  "fonts/ibm-plex-mono-latin-400-normal.woff2",
  "fonts/ibm-plex-mono-latin-500-normal.woff2",
  "fonts/noto-naskh-arabic-arabic-400-normal.woff2",
  "fonts/noto-naskh-arabic-arabic-600-normal.woff2",
  "fonts/noto-naskh-arabic-arabic-700-normal.woff2",
  "home.js",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png",
  "icons/icon-192.png",
  "icons/icon-512-maskable.png",
  "icons/icon-512.png",
  "index.html",
  "internships.html",
  "manifest.json",
  "manifest.webmanifest",
  "parents.html",
  "quiz.html",
  "routes.html",
  "saved.html",
  "saved.js",
  "scholarships.html",
  "theme.css"
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;           // analytics and the site itself go to the network
  if (url.pathname.indexOf('/data/') !== -1) {          // content: fresh if possible, cached if not
    e.respondWith(
      fetch(req).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return r;
      }).catch(() => caches.match(req))
    );
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req)));   // shell: cache first
});
