"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react"
import { academyCourses, type AcademyCourse } from "@/lib/academy-data"
import { ShoppingCart, Check } from "lucide-react"
import Link from "next/link"

const STORAGE_KEY = "internetily-academy-cart-v1"
type CartContext = {
  courses: AcademyCourse[]
  ready: boolean
  add: (slug: string) => void
  remove: (slug: string) => void
  clear: () => void
}
const Cart = createContext<CartContext | null>(null)

export function AcademyCartProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([])
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const read = () => {
      try {
        const saved: unknown = JSON.parse(
          localStorage.getItem(STORAGE_KEY) || "[]"
        )
        setSlugs(
          Array.isArray(saved)
            ? [
                ...new Set(
                  saved.filter(
                    (slug): slug is string =>
                      typeof slug === "string" &&
                      academyCourses.some((course) => course.slug === slug)
                  )
                )
              ]
            : []
        )
      } catch {
        setSlugs([])
      }
    }
    read()
    setReady(true)
    const sync = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) read()
    }
    window.addEventListener("storage", sync)
    return () => window.removeEventListener("storage", sync)
  }, [])
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs))
      } catch {
        /* Keep the cart usable when storage is blocked. */
      }
    }
  }, [ready, slugs])
  const add = useCallback(
    (slug: string) =>
      setSlugs((items) => (items.includes(slug) ? items : [...items, slug])),
    []
  )
  const remove = useCallback(
    (slug: string) =>
      setSlugs((items) => items.filter((item) => item !== slug)),
    []
  )
  const clear = useCallback(() => setSlugs([]), [])
  return (
    <Cart.Provider
      value={{
        courses: academyCourses.filter((course) => slugs.includes(course.slug)),
        ready,
        add,
        remove,
        clear
      }}
    >
      {children}
    </Cart.Provider>
  )
}

export function useAcademyCart() {
  const cart = useContext(Cart)
  if (!cart) throw new Error("Academy cart provider is required")
  return cart
}

export function coursePrice(course: AcademyCourse) {
  return Number(course.price.replace(/[^0-9.]/g, ""))
}
export function formatCoursePrice(amount: number) {
  return `KES ${amount.toLocaleString("en-KE")}`
}

export function AddCourseButton({ slug }: { slug: string }) {
  const { courses, ready, add } = useAcademyCart()
  const added = courses.some((course) => course.slug === slug)
  if (added)
    return (
      <Link className="academy-button secondary" href="/academy/cart">
        <Check size={16} />
        <span>View cart</span>
      </Link>
    )
  return (
    <button
      type="button"
      disabled={!ready}
      className="academy-button"
      onClick={() => add(slug)}
      aria-label="Add course to cart"
    >
      <ShoppingCart size={16} />
      <span>Add to cart</span>
    </button>
  )
}
