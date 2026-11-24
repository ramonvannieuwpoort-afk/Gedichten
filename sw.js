// Service worker voor Gedichten: zorgt dat de site ook opent als de wifi even weg is.
// De pagina zelf wordt altijd eerst via internet opgehaald (zodat updates meteen
// doorkomen) en alleen uit de opslag gehaald als er geen verbinding is.
// Gedichten en aantekeningen bewaart de site zelf; die gaan hier niet doorheen.
// Lettertypes van Google worden ook bewaard, zodat de tekst meteen en offline goed staat.
// v6: ook de recepten (map recepten/). Elke pagina wordt onder zijn eigen adres bewaard,
// zodat de gedichten en de recepten elkaar offline niet kunnen vervangen.

const CACHE = 'gedichten-v7';
const FONT_CACHE = 'gedichten-lettertypes-v1';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './apple-touch-icon.png', './icon-192.png', './icon-512.png',
  './briefje.html', './manifest-briefje.webmanifest', './briefje-icon.png', './briefje-192.png', './briefje-512.png',
  './recepten/', './recepten/index.html', './recepten/manifest.webmanifest', './recepten/apple-touch-icon.png', './recepten/icon-192.png', './recepten/icon-512.png'];

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
      .then(keys => Promise.all(keys.filter(key => key !== CACHE && key !== FONT_CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.hostname === 'fonts.gstatic.com') {
    // Lettertypebestanden veranderen nooit: bewaarde versie gebruiken.
    event.respondWith(
      caches.open(FONT_CACHE).then(cache => cache.match(request).then(cached => cached || fetch(request).then(response => {
        if (response.ok) cache.put(request, response.clone());
        return response;
      })))
    );
    return;
  }
  if (url.hostname === 'fonts.googleapis.com') {
    // Lijstje met lettertypes: bewaarde versie meteen, op de achtergrond verversen.
    event.respondWith(
      caches.open(FONT_CACHE).then(cache => cache.match(request).then(cached => {
        const fresh = fetch(request).then(response => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        }).catch(() => cached || Response.error());
        return cached || fresh;
      }))
    );
    return;
  }
  if (url.origin !== self.location.origin) return; // Google Apps Script e.d. niet aanraken

  const isPage = request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');

  if (isPage) {
    // Eerst internet, anders de bewaarde versie. Elke pagina heeft een eigen plek in de opslag
    // (gedichten, briefje-scherm, recepten), zodat ze elkaar niet overschrijven.
    const key = url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname;
    const reserve = url.pathname.indexOf('/recepten/') !== -1 ? './recepten/index.html' : './index.html';
    // 'no-cache': altijd bij GitHub navragen of er een nieuwere versie is, niet de
    // browsergeheugen-kopie van tot 10 minuten oud gebruiken.
    event.respondWith(
      fetch(new Request(request.url, { cache: 'no-cache', credentials: 'same-origin' }))
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(key, copy));
          }
          return response;
        })
        .catch(() => caches.match(key).then(cached => cached || caches.match(reserve)).then(cached => cached || caches.match('./')))
    );
    return;
  }

  if (url.pathname.endsWith('.json') && !url.pathname.endsWith('.webmanifest')) {
    // Reeksen (bijv. Song of Myself): eerst internet, anders de bewaarde versie.
    const key = url.pathname;
    event.respondWith(
      fetch(new Request(request.url, { cache: 'no-cache', credentials: 'same-origin' }))
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(key, copy));
          }
          return response;
        })
        .catch(() => caches.match(key))
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
