export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  {
    timeoutMs = 4000,
    retries = 2,
    retryDelayMs = 350,
  }: { timeoutMs?: number; retries?: number; retryDelayMs?: number } = {}
): Promise<Response> {
  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, { ...options, signal: controller.signal })
      clearTimeout(timer)
      if (!response.ok && response.status >= 500 && attempt < retries) {
        // transient server-side hiccup — retry
        await new Promise((r) => setTimeout(r, retryDelayMs * (attempt + 1)))
        continue
      }
      return response
    } catch (err) {
      clearTimeout(timer)
      lastError = err
      if (attempt < retries) {
        // covers AbortError (timeout) and network-level failures
        // (dropped SYN during the captive-portal → validated-network handoff)
        await new Promise((r) => setTimeout(r, retryDelayMs * (attempt + 1)))
        continue
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Network request failed')
}