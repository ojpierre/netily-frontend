"use client"

export type LearnerSession = { name: string; email: string }
export type AcademyPreviewOrder = {
  id: string
  email: string
  courses: string[]
  total: number
  createdAt: string
  status: "pending" | "completed" | "failed" | "cancelled"
  buyer?: {
    name: string
    email: string
    contact: string
    country: string
    company: string
    mpesaPhone: string
  }
}
const SESSION = "internetily-academy-preview-session"
const ORDERS = "internetily-academy-preview-orders"
export function readLearner(): LearnerSession | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(SESSION) || "null")
    return typeof value?.email === "string" && typeof value?.name === "string"
      ? value
      : null
  } catch {
    return null
  }
}
export function saveLearner(session: LearnerSession) {
  sessionStorage.setItem(SESSION, JSON.stringify(session))
}
export function logoutLearner() {
  sessionStorage.removeItem(SESSION)
}
export function safeAcademyNext(value: string | null) {
  return value &&
    /^\/academy\/(?:checkout|cart|account|courses(?:\/[a-z0-9-]+)?|learn\/[a-z0-9-]+)(?:[?#]|$)/.test(
      value
    ) &&
    !value.includes("\\")
    ? value
    : "/academy/account"
}
export function readPreviewOrders(): AcademyPreviewOrder[] {
  try {
    const value = JSON.parse(localStorage.getItem(ORDERS) || "[]")
    return Array.isArray(value)
      ? value.filter(
          (order) =>
            typeof order?.id === "string" &&
            Array.isArray(order?.courses) &&
            order.courses.every((slug: unknown) => typeof slug === "string") &&
            typeof order?.email === "string" &&
            Number.isFinite(order?.total) &&
            order.total >= 0 &&
            ["pending", "completed", "failed", "cancelled"].includes(
              order.status
            ) &&
            Number.isFinite(Date.parse(order.createdAt))
        )
      : []
  } catch {
    return []
  }
}
export function savePreviewOrder(order: AcademyPreviewOrder) {
  const orders = readPreviewOrders().filter((item) => item.id !== order.id)
  localStorage.setItem(ORDERS, JSON.stringify([order, ...orders].slice(0, 100)))
}
export function normalizeMpesaPhone(value: string) {
  const digits = value.replace(/[\s+()-]/g, "")
  const phone = /^0[17]\d{8}$/.test(digits)
    ? "254" + digits.slice(1)
    : /^[17]\d{8}$/.test(digits)
      ? "254" + digits
      : digits
  return /^254[17]\d{8}$/.test(phone) ? phone : null
}
