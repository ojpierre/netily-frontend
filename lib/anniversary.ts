// Internetily (Netily) first-anniversary celebration window (East Africa Time).
// The bar and confetti switch themselves off after END; the /one-year page stays.
export const ANNIVERSARY_START = new Date("2026-11-16T00:00:00+03:00")
export const ANNIVERSARY_END = new Date("2026-11-23T23:59:59+03:00")
export const ANNIVERSARY_PATH = "/one-year"

export function isAnniversaryActive(now: Date = new Date()) {
  return now >= ANNIVERSARY_START && now <= ANNIVERSARY_END
}
