// The app's service worker: OneSignal push notifications, plus offline copies of pages people have opened.
// It has to live at the site root with this name, which is where OneSignal looks for it.
try {
  importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
} catch {
  // Offline when the worker updated; push keeps working with the copy already installed.
}

const CACHE = "sbl-v1";
const START = ["/", "/events/", "/places/", "/eats/", "/offline/", "/icons/icon-192.png", "/img/logo-sm.webp"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(START)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  // Pages: always try the network first so listings are fresh; fall back to the saved copy offline.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("/offline/"))),
    );
    return;
  }
  // Images, styles and scripts: use the saved copy if there is one (their URLs change when they change).
  if (/^\/(img|icons|assets)\//.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })),
    );
  }
});
