"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Search, ShoppingBag, Menu, X, MapPin, Phone } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { MiniCart } from "./mini-cart"
import { useCart } from "@/shop-ui/lib/cart-context"

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { itemCount } = useCart()

  useEffect(() => {
    setIsMenuOpen(false)
    setIsAccountMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false)
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setIsAccountMenuOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false)
        setIsAccountMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isSearchOpen])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/shop/catalog?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
    }
  }

  const navLinks = [
    { href: "/shop/catalog", label: "All products" },
    { href: "/shop/catalog?cat=Fiber+Optics+%26+OLT", label: "Fiber" },
    { href: "/shop/catalog?cat=Routers+%26+Gateways", label: "Routers" },
    { href: "/shop/catalog?cat=Wireless+%26+Backhaul", label: "Wireless" },
    { href: "/shop/track", label: "Track order" },
  ]

  const navItemColor = "text-foreground"
  const navItemHoverColor = "text-foreground/60 hover:text-foreground"
  const iconColor = "text-foreground"
  const logoColor = "text-foreground"

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/70 bg-white/[0.96] text-foreground shadow-[0_4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md">
        <div className="hidden border-b border-border/70 bg-[#06183b] text-white lg:block">
          <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-8 text-[11px]">
            <span className="flex items-center gap-2 text-white/70"><MapPin className="h-3 w-3" />Network equipment for Kenya and regional projects</span>
            <div className="flex items-center gap-5"><a href="tel:+254100034307" className="flex items-center gap-1.5"><Phone className="h-3 w-3" />0100 034 307</a><Link href="/shop/track">Track an order</Link></div>
          </div>
        </div>
        <nav className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 lg:h-[72px] items-center justify-between">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`lg:hidden p-2 -ml-2 transition-colors duration-500 ${iconColor}`}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-5 w-5 stroke-[1.5]" /> : <Menu className="h-5 w-5 stroke-[1.5]" />}
            </button>

            {/* Desktop navigation */}
            <div className="hidden lg:order-2 lg:flex lg:flex-1 items-center justify-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs tracking-[0.14em] uppercase transition-colors duration-500 ${
                    pathname === link.href ? navItemColor : navItemHoverColor
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Logo â€” centered luxury editorial */}
            <Link
              href="/shop"
              className={`absolute left-1/2 flex -translate-x-1/2 items-center transition-colors duration-500 lg:static lg:order-1 lg:mr-8 lg:translate-x-0 ${logoColor}`}
            >
              <Image
                src="/internetily-logo-320.webp"
                alt="Internetily Shop"
                width={220}
                height={66}
                priority
                className="h-10 w-auto object-contain lg:h-12"
              />
            </Link>

            {/* Right icons */}
            <div className="flex items-center gap-2 lg:order-3 lg:gap-4">
              <div ref={searchContainerRef} className="relative hidden sm:flex items-center">
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.form
                      onSubmit={handleSearchSubmit}
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 220, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search devices..."
                        className="w-full bg-transparent border-b border-foreground/30 py-1 pr-2 text-sm text-foreground outline-none transition-colors duration-500 placeholder:text-foreground/50"
                      />
                    </motion.form>
                  )}
                </AnimatePresence>
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  aria-label="Search"
                  className={`p-2 transition-colors duration-500 ${iconColor}`}
                >
                  {isSearchOpen ? <X className="h-5 w-5 stroke-[1.5]" /> : <Search className="h-5 w-5 stroke-[1.5]"/>}
                </button>
              </div>

              <button
                onClick={() => setIsCartOpen(true)}
                aria-label="Shopping cart"
                className={`p-2 -mr-2 relative transition-colors duration-500 ${iconColor}`}
              >
                <ShoppingBag className="h-5 w-5 stroke-[1.5]" />
                {itemCount > 0 && (
                  <span
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[10px] text-background transition-colors duration-500"
                  >
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-foreground/20 z-40 lg:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            {/* Menu panel */}
            <motion.div
              initial={{ opacity: 0, x: "-100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "-100%" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 w-[280px] z-50 bg-background border-r border-border lg:hidden"
            >
              <div className="flex items-center justify-between h-16 px-6 border-b border-border">
                <span className="font-serif text-lg tracking-[0.2em] uppercase">Menu</span>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 -mr-2" aria-label="Close menu">
                  <X className="h-5 w-5 stroke-[1.5]" />
                </button>
              </div>
              <nav className="px-6 py-8 flex flex-col gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-lg tracking-[0.15em] uppercase transition-colors ${
                      pathname === link.href ? "text-foreground" : "text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mini cart */}
      <MiniCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  )
}
