// public/sw.js
const CACHE = "netily-shell-v1"

self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) {
  event.waitUntil(self.clients.claim())
})

// Trivial network-first passthrough — installability only needs a fetch handler present
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})