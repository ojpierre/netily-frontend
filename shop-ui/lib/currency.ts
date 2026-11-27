export const SHOP_CURRENCY = "KES"

/** Formats shop prices. Kenyan shillings read "KSh 26,000" (the house style); other currencies use their code. */
export function formatShopMoney(value: number | string, currency = SHOP_CURRENCY) {
  const amount = Number(value) || 0
  if (currency === "KES") {
    return `KSh ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(Math.round(amount))}`
  }
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
