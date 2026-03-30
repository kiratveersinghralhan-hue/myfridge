const CACHE_NAME = "myfridge-final-v301";
const ASSETS = [
  "./index.html",
  "./dashboard.html",
  "./account.html",
  "./settings.html",
  "./style.css?v=301",
  "./common.js?v=301",
  "./auth.js?v=301",
  "./dashboard.js?v=301",
  "./account.js?v=301",
  "./settings.js?v=301",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        return response;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
