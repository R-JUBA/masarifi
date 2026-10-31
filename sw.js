const CACHE='masarifi-v19',FILES=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];

self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>Promise.all(FILES.map(f=>fetch(new Request(f,{cache:'reload'})).then(r=>r.ok?c.put(f,r):null).catch(()=>null)))).then(()=>self.skipWaiting())));

self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(a=>Promise.all(a.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
  
  // استراتيجية Network-First لصفحة الـ HTML لضمان التحديث المستمر
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request,{cache:'no-cache'}).then(n=>{
      if(n.ok){const c=n.clone();caches.open(CACHE).then(x=>x.put(e.request,c))}
      return n;
    }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
  } 
  // استراتيجية Cache-First لبقية الملفات (الأيقونات) لفتح فوري وبدون إنترنت
  else {
    e.respondWith(caches.match(e.request).then(cached=>{
      const network = fetch(e.request).then(n=>{
        if(n.ok){const c=n.clone();caches.open(CACHE).then(x=>x.put(e.request,c))}
        return n;
      });
      return cached || network;
    }));
  }
});
