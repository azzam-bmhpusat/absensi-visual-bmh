// Service worker minimal: membuat aplikasi bisa di-install dan menampilkan halaman offline.
// Sengaja TIDAK meng-cache halaman maupun respons Supabase/API: hanya navigasi yang gagal
// karena jaringan yang dijawab dengan /offline.html dari cache.
const CACHE = "bmh-offline-v2";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png"];

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
  if (request.method !== "GET" || request.mode !== "navigate") return;
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request).catch(() => caches.match(OFFLINE_URL).then((res) => res || Response.error()))
  );
});
