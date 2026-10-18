export type PaymentLocale = {
  country: "KE" | "UG"
  currency: string
  dialCode: string
  phonePlaceholder: string
  provider: string
  paymentNumberLabel: string
  showCancellationWarning: boolean
}

export function getPaymentLocale(country?: string | null, currency?: string | null): PaymentLocale {
  if (country?.toUpperCase() === "UG") return {
    country: "UG", currency: currency || "UGX", dialCode: "256",
    phonePlaceholder: "0772 123 456", provider: "Mobile Money",
    paymentNumberLabel: "Mobile Money Number (MTN / Airtel)",
    showCancellationWarning: false,
  }
  return {
    country: "KE", currency: country?.toUpperCase() === "KE" ? (currency || "KES") : "KES", dialCode: "254",
    phonePlaceholder: "0712 345 678", provider: "M-Pesa",
    paymentNumberLabel: "M-Pesa Phone Number", showCancellationWarning: true,
  }
}

export function normalizePaymentPhone(value: string, locale: PaymentLocale): string {
  const digits = value.replace(/\D/g, "")
  if (digits.startsWith(locale.dialCode)) return digits
  if (digits.startsWith("0")) return locale.dialCode + digits.slice(1)
  return locale.dialCode + digits
}

export function isValidPaymentPhone(value: string, locale: PaymentLocale): boolean {
  const digits = normalizePaymentPhone(value, locale)
  return locale.country === "UG"
    ? /^256\d{9}$/.test(digits)
    : /^254[17]\d{8}$/.test(digits)
}

export function formatPaymentAmount(value: number | string, currency: string): string {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return `${currency} ${value}`
  return `${currency} ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: currency === "UGX" ? 0 : 2,
  }).format(amount)}`
}
