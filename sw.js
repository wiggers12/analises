const CACHE_NAME = "goathbet-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/img/logo.png",
  "/img/logo-192.png",
  "/img/logo-512.png"
];

// Instala o SW e cacheia os arquivos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Ativa e limpa caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      )
    )
  );
});

// Busca do cache ou rede
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
