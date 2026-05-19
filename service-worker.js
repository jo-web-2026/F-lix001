const CACHE_NAME = "felix-study-v6";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.webmanifest",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg",
  "./assets/felix/hero-felix.png",
  "./assets/felix/timer-peek-felix.png",
  "./assets/felix/badge-bronze-felix.png",
  "./assets/felix/badge-silver-felix.png",
  "./assets/felix/badge-gold-felix.png",
  "./assets/felix/streak-felix.png",
  "./assets/felix/motivation-felix.png",
  "./assets/felix/share-felix.png",
  "./assets/felix/sleepy-felix.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
