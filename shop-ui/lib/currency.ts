export const SHOP_CURRENCY = "KES"

export function formatShopMoney(value: number | string, currency = SHOP_CURRENCY) {
  const amount = Number(value) || 0
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: currency === "KES" ? 0 : 2,
    maximumFractionDigits: currency === "KES" ? 0 : 2,
  }).format(amount)
}
