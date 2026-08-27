const CACHE = "netily-shell-v2"

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)
  if (
    url.pathname === "/netilysystempayment" ||
    url.pathname.startsWith("/api/netily-system-payment") ||
    url.hostname === "api.netily.co.ke"
  ) {
    event.respondWith(fetch(event.request))
    return
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request)),
  )
})
