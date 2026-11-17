// 電波がない場所でも開けるようにするための仕組み
// アプリ本体と問題データ：まずネットから最新を取りにいき、つながらなければ保存しておいた版を使う
// 文字（フォント）：一度取ったら保存した版を使う
const CACHE = "rekishi-drill-v1";
const SHELL = ["./", "index.html", "data.json", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("index.html")))
    );
  } else if (url.hostname.endsWith("googleapis.com") || url.hostname.endsWith("gstatic.com")) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }))
    );
  }
});
