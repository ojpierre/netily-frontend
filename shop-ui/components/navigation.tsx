"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { ChevronDown, MessageCircle, Phone, Search, ShoppingBag, Menu, X } from "lucide-react"
import { MiniCart } from "./mini-cart"
import { CategoryGlyph } from "./product-art"
import { useCart } from "@/shop-ui/lib/cart-context"
import { featuredCategories } from "@/shop-ui/lib/featured-catalog"
import { useShopSettings } from "@/shop-ui/lib/use-shop-settings"
import { categoryHref, HEADING_FONT, whatsappLink } from "@/shop-ui/lib/shop-helpers"

const DEFAULT_ANNOUNCEMENT = "Pay with M-Pesa. Genuine MikroTik, Ubiquiti, TP-Link and VSOL gear for Kenyan networks."

function formatPhone(raw: string) {
  return raw.replace(/^\+?254/, "0").replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3")
}

export function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [query, setQuery] = useState("")
  const megaRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mobileSearchRef = useRef<HTMLInputElement>(null)
  const drawerCloseRef = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { itemCount } = useCart()
  const settings = useShopSettings()

  const announcement = settings?.announcement_text?.trim() || DEFAULT_ANNOUNCEMENT
  const phoneRaw = (settings?.support_phone || "0100034307").replace(/\s/g, "")
  const waNumber = settings?.whatsapp_number || "254100034307"

  useEffect(() => {
    setMenuOpen(false)
    setMegaOpen(false)
    setSearchOpen(false)
  }, [pathname])

  useEffect(() => {
    if (searchOpen) mobileSearchRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    if (menuOpen) drawerCloseRef.current?.focus()
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [menuOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false)
        setMegaOpen(false)
        setSearchOpen(false)
      }
    }
    const onDown = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) setMegaOpen(false)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onDown)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onDown)
    }
  }, [])

  const openMega = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setMegaOpen(true)
  }, [])
  const scheduleCloseMega = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setMegaOpen(false), 140)
  }, [])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    router.push(`/shop/catalog?q=${encodeURIComponent(q)}`)
    setSearchOpen(false)
    setMenuOpen(false)
  }

  const links = [
    { href: "/shop/catalog?sale=1", label: "Deals" },
    { href: "/shop/how-to-order", label: "How to order" },
    { href: "/shop/track", label: "Track order" },
  ]

  const linkClass =
    "rounded-lg px-3 py-2 text-sm font-medium text-[#17252d] outline-none transition hover:bg-[#f3f7f8] hover:text-[#0874cf] focus-visible:ring-2 focus-visible:ring-[#0874cf]"
  const helpMessage = "Hi Internetily, I need help choosing network equipment."

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#dce4e8] bg-white/95 backdrop-blur-md">
        {/* Announcement */}
        <div className="bg-[#17252d] text-white">
          <div className="mx-auto flex h-8 max-w-7xl items-center justify-between gap-4 px-4 text-xs sm:px-6 lg:px-8">
            <p className="min-w-0 truncate text-white/85">{announcement}</p>
            <div className="hidden shrink-0 items-center gap-5 md:flex">
              <a href={`tel:${phoneRaw}`} className="flex items-center gap-1.5 text-white/80 hover:text-white">
                <Phone className="h-3 w-3" aria-hidden="true" />
                {formatPhone(phoneRaw)}
              </a>
              <a href={whatsappLink(waNumber)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-white/80 hover:text-white">
                <MessageCircle className="h-3 w-3" aria-hidden="true" />
                WhatsApp an engineer
              </a>
            </div>
          </div>
        </div>

        <nav aria-label="Shop" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-2 lg:h-[72px] lg:gap-4">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="-ml-2 grid h-10 w-10 place-items-center rounded-lg text-[#17252d] outline-none hover:bg-[#f3f7f8] focus-visible:ring-2 focus-visible:ring-[#0874cf] lg:hidden"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="shop-mobile-menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link href="/shop" className="flex shrink-0 items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#0874cf]">
              <span className="relative block h-11 w-[140px] shrink-0 overflow-hidden">
                <Image
                  src="/internetily-logo-320.webp"
                  alt="Internetily Shop"
                  width={320}
                  height={320}
                  priority
                  className="absolute max-w-none"
                  style={{ width: 190, height: 190, left: -23, top: -119 }}
                />
              </span>
            </Link>

            {/* Desktop links */}
            <div className="ml-2 hidden items-center gap-1 lg:flex">
              <div ref={megaRef} className="relative" onMouseEnter={openMega} onMouseLeave={scheduleCloseMega}>
                <button
                  type="button"
                  onClick={() => setMegaOpen((v) => !v)}
                  aria-expanded={megaOpen}
                  aria-controls="shop-mega-menu"
                  className={`${linkClass} flex items-center gap-1`}
                >
                  Products
                  <ChevronDown className={`h-4 w-4 transition-transform motion-reduce:transition-none ${megaOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
                {megaOpen && (
                  <div id="shop-mega-menu" className="absolute left-0 top-full z-50 w-[720px] pt-2" onMouseEnter={openMega} onMouseLeave={scheduleCloseMega}>
                    <div className="rounded-2xl border border-[#dce4e8] bg-white p-3 shadow-[0_24px_60px_-20px_rgba(23,37,45,0.3)]">
                      <ul className="grid grid-cols-2 gap-1">
                        {featuredCategories.map((c) => (
                          <li key={c.slug}>
                            <Link
                              href={categoryHref(c.slug)}
                              onClick={() => setMegaOpen(false)}
                              className="flex items-center gap-3 rounded-xl p-2.5 outline-none transition hover:bg-[#f3f7f8] focus-visible:ring-2 focus-visible:ring-[#0874cf]"
                            >
                              <CategoryGlyph slug={c.slug} name={c.name} className="h-12 w-12 shrink-0" />
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold text-[#17252d]">{c.name}</span>
                                <span className="line-clamp-1 text-xs text-[#56656f]">{c.featured_brands?.slice(0, 3).join(", ")}</span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2 flex items-center justify-between rounded-xl bg-[#f3f7f8] px-4 py-3 text-sm">
                        <span className="text-[#56656f]">Not sure what you need?</span>
                        <Link href="/shop/catalog" onClick={() => setMegaOpen(false)} className="font-semibold text-[#0874cf] hover:text-[#075faa]">
                          Browse all equipment
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {links.map((l) => (
                <Link key={l.href} href={l.href} className={linkClass}>
                  {l.label}
                </Link>
              ))}
            </div>

            {/* Desktop search */}
            <form onSubmit={submitSearch} role="search" className="ml-auto hidden max-w-sm flex-1 lg:block">
              <label htmlFor="shop-search" className="sr-only">
                Search equipment
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#56656f]" aria-hidden="true" />
                <input
                  id="shop-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search routers, OLTs, Starlink..."
                  className="h-10 w-full rounded-lg border border-[#dce4e8] bg-[#f3f7f8] pl-9 pr-3 text-sm text-[#17252d] outline-none transition placeholder:text-[#7a8a94] focus:border-[#0874cf] focus:bg-white focus:ring-2 focus:ring-[#0874cf]/20"
                />
              </div>
            </form>

            <div className="ml-auto flex items-center gap-1 lg:ml-0">
              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                aria-label="Search"
                aria-expanded={searchOpen}
                className="grid h-10 w-10 place-items-center rounded-lg text-[#17252d] outline-none hover:bg-[#f3f7f8] focus-visible:ring-2 focus-visible:ring-[#0874cf] lg:hidden"
              >
                <Search className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                aria-label={`Open cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
                className="relative grid h-10 w-10 place-items-center rounded-lg text-[#17252d] outline-none hover:bg-[#f3f7f8] focus-visible:ring-2 focus-visible:ring-[#0874cf]"
              >
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#0874cf] px-1 text-[10px] font-semibold leading-none text-white">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </button>
              <a
                href={whatsappLink(waNumber, helpMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 hidden h-10 items-center gap-2 rounded-lg bg-[#0874cf] px-4 text-sm font-semibold text-white outline-none transition hover:bg-[#075faa] focus-visible:ring-2 focus-visible:ring-[#0874cf] focus-visible:ring-offset-2 xl:inline-flex"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Ask on WhatsApp
              </a>
            </div>
          </div>

          {/* Mobile / tablet search row */}
          {searchOpen && (
            <form onSubmit={submitSearch} role="search" className="pb-3 lg:hidden">
              <label htmlFor="shop-search-mobile" className="sr-only">
                Search equipment
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#56656f]" aria-hidden="true" />
                <input
                  ref={mobileSearchRef}
                  id="shop-search-mobile"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search routers, OLTs, Starlink..."
                  className="h-11 w-full rounded-lg border border-[#dce4e8] bg-[#f3f7f8] pl-9 pr-3 text-base text-[#17252d] outline-none placeholder:text-[#7a8a94] focus:border-[#0874cf] focus:bg-white focus:ring-2 focus:ring-[#0874cf]/20"
                />
              </div>
            </form>
          )}
        </nav>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Shop menu" id="shop-mobile-menu">
          <div className="absolute inset-0 bg-[#17252d]/50" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 flex w-[min(86vw,340px)] flex-col bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-[#dce4e8] px-4">
              <span className={`${HEADING_FONT} text-base font-semibold text-[#17252d]`}>Menu</span>
              <button
                ref={drawerCloseRef}
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="-mr-2 grid h-10 w-10 place-items-center rounded-lg outline-none hover:bg-[#f3f7f8] focus-visible:ring-2 focus-visible:ring-[#0874cf]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <form onSubmit={submitSearch} role="search">
                <label htmlFor="shop-search-drawer" className="sr-only">
                  Search equipment
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#56656f]" aria-hidden="true" />
                  <input
                    id="shop-search-drawer"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search equipment"
                    className="h-11 w-full rounded-lg border border-[#dce4e8] bg-[#f3f7f8] pl-9 pr-3 text-base outline-none focus:border-[#0874cf] focus:bg-white focus:ring-2 focus:ring-[#0874cf]/20"
                  />
                </div>
              </form>
              <p className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#56656f]">Shop by category</p>
              <ul>
                {featuredCategories.map((c) => (
                  <li key={c.slug}>
                    <Link href={categoryHref(c.slug)} className="flex items-center gap-3 rounded-xl px-1 py-2 outline-none hover:bg-[#f3f7f8] focus-visible:ring-2 focus-visible:ring-[#0874cf]">
                      <CategoryGlyph slug={c.slug} name={c.name} className="h-10 w-10 shrink-0" />
                      <span className="text-sm font-medium text-[#17252d]">{c.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="mt-5 border-t border-[#dce4e8] pt-3">
                <li>
                  <Link href="/shop/catalog" className="block rounded-lg px-1 py-2.5 text-sm font-medium text-[#17252d]">
                    All products
                  </Link>
                </li>
                {links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="block rounded-lg px-1 py-2.5 text-sm font-medium text-[#17252d]">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2 border-t border-[#dce4e8] p-4">
              <a
                href={whatsappLink(waNumber, helpMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0874cf] text-sm font-semibold text-white"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Ask on WhatsApp
              </a>
              <a href={`tel:${phoneRaw}`} className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#dce4e8] text-sm font-semibold text-[#17252d]">
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call {formatPhone(phoneRaw)}
              </a>
            </div>
          </div>
        </div>
      )}

      <MiniCart isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
