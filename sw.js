const CACHE = 'masarifi-v62',
  FILES = ['./', './index.html', './manifest.json', './cairo.woff2', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

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
    const net = fetch(e.request, { cache: 'no-cache' }).then(n => {
      const ct = n.headers.get('content-type') || '';
      if (!n.ok || !ct.includes('text/html')) return n;
      return n.clone().text().then(t =>
        t.includes('masarifi.')
          ? caches.open(CACHE).then(x => x.put('./index.html', new Response(t, { headers: { 'content-type': 'text/html; charset=utf-8' } })))
          : 0
      ).then(() => n);
    });
    e.waitUntil(net.catch(() => {}));
    e.respondWith(
      Promise.race([net, new Promise(r => setTimeout(() => r(null), 4000))])
        .catch(() => null)
        .then(r => (r && r.ok) ? r :
          caches.match(e.request, { ignoreSearch: true })
            .then(c => c || caches.match('./index.html'))
            .then(c => c || r || Response.error()))
    );
  } else {
    e.respondWith(
      caches.match(e.request, { ignoreSearch: true }).then(cached => {
        const network = fetch(e.request).then(n => {
          if (!n.ok) return n;
          const c = n.clone();
          return caches.open(CACHE).then(x => x.put(e.request, c)).then(() => n);
        });
        if (cached) { e.waitUntil(network.catch(() => {})); return cached; }
        return network;
      })
    );
  }
});
