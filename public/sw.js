const CACHE = "netily-shell-v2"

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)
  const isSameOrigin = url.origin === self.location.origin

  if (event.request.method !== "GET" || !isSameOrigin) {
    return
  }

  if (
    url.pathname === "/netilysystempayment" ||
    url.pathname.startsWith("/api/netily-system-payment")
  ) {
    return
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request)),
  )
})
