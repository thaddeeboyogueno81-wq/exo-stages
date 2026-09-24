/* Service worker Lify : cache minimal pour le mode hors-ligne (V2)
   Stratégie :
   - navigation : network-first, repli sur la dernière page en cache
   - médias/statiques : cache-first avec purge au-delà de 200 entrées */
const CACHE = 'lify-v1';
const MAX_ENTRIES = 200;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/'])));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

async function trimCache(cache) {
  const keys = await cache.keys();
  if (keys.length > MAX_ENTRIES) {
    await cache.delete(keys[0]);
    await trimCache(cache);
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigation : réseau d'abord, cache en secours (mode faible connexion)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/')))
    );
    return;
  }

  // Ressources : cache d'abord pour rester consultable hors-ligne
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((c) => {
            c.put(request, copy);
            trimCache(c);
          });
        }
        return response;
      });
    })
  );
});
