/* ============================================================
   NODO Shell — Service Worker
   Estrategia:
   - Precache de shell (HTML, CSS, JS, manifest) en install
   - Cache-first para assets versionados; network-first para HTML
   - Cleanup de versiones viejas en activate
   ============================================================ */

const CACHE_VERSION = "nodo-shell-v0.1.0";
const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./styles/tokens.css",
  "./styles/reset.css",
  "./styles/shell.css",
  "./styles/ribbon.css",
  "./styles/workspace.css",
  "./styles/patterns.css",
  "./styles/grid.css",
  "./js/app.js",
  "./js/mock-data.js",
  "./js/modulos.js",
  "./assets/icons/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.addAll(PRECACHE).catch((err) => {
        console.warn("[SW] precache parcial:", err);
      })
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Solo manejamos requests del mismo origen
  if (url.origin !== self.location.origin) return;

  // HTML → network-first (para que cambios de UI se vean rápido cuando hay red)
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  // Assets (CSS/JS/imágenes) → cache-first con revalidación
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// Mensajes desde la app (ej: "skip waiting" para forzar update)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
