const CACHE = 'masarifi-v31',
  FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e =>
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(
        FILES.map(f =>
          fetch(new Request(f, { cache: 'reload' }))
            .then(r => {
              if (!r.ok) throw new Error(f);
              return c.put(f, r);
            })
            .catch(err => {
              if (f === './' || f === './index.html') throw err;
            })
        )
      )
    ).then(() => self.skipWaiting())
  )
);

self.addEventListener('activate', e =>
  e.waitUntil(
    caches.keys()
      .then(a => Promise.all(a.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
);

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' })
        .then(n => {
          if (n.ok) {
            const c = n.clone();
            caches.open(CACHE).then(x => x.put('./index.html', c));
          }
          return n;
        })
        .catch(() =>
          caches.match(e.request, { ignoreSearch: true })
            .then(r => r || caches.match('./index.html'))
        )
    );
  } else {
    e.respondWith(
      caches.match(e.request, { ignoreSearch: true }).then(cached => {
        const network = fetch(e.request)
          .then(n => {
            if (n.ok) {
              const c = n.clone();
              caches.open(CACHE).then(x => x.put(e.request, c));
            }
            return n;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
