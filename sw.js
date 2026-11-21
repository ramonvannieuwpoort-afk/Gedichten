// Service worker voor Gedichten: zorgt dat de site ook opent als de wifi even weg is.
// De pagina zelf wordt altijd eerst via internet opgehaald (zodat updates meteen
// doorkomen) en alleen uit de opslag gehaald als er geen verbinding is.
// Gedichten en aantekeningen bewaart de site zelf; die gaan hier niet doorheen.

const CACHE = 'gedichten-v2';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './apple-touch-icon.png', './icon-192.png', './icon-512.png',
  './briefje.html', './manifest-briefje.webmanifest', './briefje-icon.png', './briefje-192.png', './briefje-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.all(ASSETS.map(url => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Google e.d. niet aanraken

  const isPage = request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');

  if (isPage) {
    // Eerst internet, anders de bewaarde versie (de gedichten of het briefje-scherm).
    const key = url.pathname.endsWith('briefje.html') ? './briefje.html' : './index.html';
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(key, copy));
          }
          return response;
        })
        .catch(() => caches.match(key).then(cached => cached || caches.match('./')))
    );
    return;
  }

  // Icoontjes e.d.: eerst de bewaarde versie, anders internet.
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
      }
      return response;
    }))
  );
});
