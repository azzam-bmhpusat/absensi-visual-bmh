// Service worker minimal: membuat aplikasi bisa di-install dan menampilkan halaman offline.
// Hanya halaman offline dan aset pendukungnya yang disimpan di cache perangkat.
// Navigasi tetap lewat jaringan; halaman aplikasi maupun respons Supabase/API tidak di-cache.
const CACHE = "bmh-offline-v3";
const OFFLINE_URL = "/offline.html";
const OFFLINE_ASSETS = ["/logo-rakernas-nav.png", "/icons/icon-192.png"];
const PRECACHE = [OFFLINE_URL, ...OFFLINE_ASSETS];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (new URL(request.url).origin !== self.location.origin) return;

  if (OFFLINE_ASSETS.includes(new URL(request.url).pathname)) {
    event.respondWith(
      caches.open(CACHE).then((cache) => cache.match(request).then((res) => res || fetch(request)))
    );
    return;
  }

  if (request.mode !== "navigate") return;

  event.respondWith(
    fetch(request).catch(() => caches.match(OFFLINE_URL).then((res) => res || Response.error()))
  );
});
