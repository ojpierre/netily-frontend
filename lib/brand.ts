/**
 * One source of truth for how the brand is named in titles, metadata and
 * structured data. Internetily and Netily are the same product and both names
 * are current — never describe Netily as a "former" or "legacy" name.
 */
export const SITE_URL = "https://netily.co.ke"
export const BRAND_NAME = "Internetily"
export const BRAND_ALIAS = "Netily"
export const BRAND_PAIR = `${BRAND_NAME} (${BRAND_ALIAS})`

/** Names Google and AI systems should treat as this organisation/site. */
export const BRAND_ALTERNATE_NAMES = [BRAND_ALIAS, BRAND_PAIR, "Netily ISP Billing", "netily.co.ke"]

/** Public profiles that confirm the brand entity (schema.org sameAs). */
// Add LinkedIn, Facebook, X, YouTube and Crunchbase URLs here as they are confirmed.
export const BRAND_PROFILES = [
  "https://g.page/r/CXBirwJlXb_0EAI",
  "https://www.trustpilot.com/review/netily.co.ke",
]

export const PARENT_ORGANIZATION = { "@type": "Organization", name: "Mjengo Corporate", url: "https://mjengocorporate.com/" }

const TITLE_LIMIT = 60
const BRAND_SUFFIX = /\s*[|·–-]\s*(?:Internetily|Netily)(?:\s*(?:\(Netily\)|&\s*Netily|\/\s*Netily))?\s*$/i

/** Remove any trailing "| Internetily" / "| Netily" style suffix. */
export function stripBrand(title: string) {
  let value = title.trim()
  while (BRAND_SUFFIX.test(value)) value = value.replace(BRAND_SUFFIX, "").trim()
  return value
}

/**
 * Append the brand exactly once. Uses "Internetily (Netily)" so both names
 * appear in results, and falls back to the shorter "Netily" when the full
 * pair would push the title past what Google shows.
 */
export function brandTitle(title: string) {
  const base = stripBrand(title)
  const full = `${base} | ${BRAND_PAIR}`
  if (full.length <= TITLE_LIMIT) return full
  return `${base} | ${BRAND_ALIAS}`
}
