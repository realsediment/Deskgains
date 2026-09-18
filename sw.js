/* DeskGains service worker: offline cache + notification button handling. */
const CACHE = 'deskgains-v1';
const ASSETS = ['./', 'index.html', 'styles.css', 'data.js', 'app.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/badge.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* Network first so edits show up, cache as the offline fallback. */
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => {
    const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); return res;
  }).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
});

self.addEventListener('notificationclick', e => {
  const n = e.notification, d = n.data || {}, action = e.action || 'open';
  n.close();
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const msg = { type: 'notif', action, key: d.key, i: d.i, id: d.id, kind: d.kind };
    if (list.length) {
      const c = list[0];
      if (action === 'open') { try { await c.focus(); } catch (err) { /* ignore */ } }
      c.postMessage(msg);
    } else {
      const q = new URLSearchParams({ a: action, k: d.key || '', i: d.i == null ? '' : d.i, id: d.id || '', kind: d.kind || '' });
      await self.clients.openWindow('./index.html?' + q.toString());
    }
  })());
});
