"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Search, ShoppingBag, Menu, X, User } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { MiniCart } from "./mini-cart"
import { useCart } from "@/lib/cart-context"

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
    }
  }

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/heritage", label: "About" },
  ]

  // When scrolled: dark text on white bg. When at top: white text on transparent bg.
  const navItemColor = isScrolled ? "text-foreground" : "text-white"
  const navItemHoverColor = isScrolled ? "text-foreground/60 hover:text-foreground" : "text-white/70 hover:text-white"
  const iconColor = isScrolled ? "text-foreground" : "text-white"
  const logoColor = isScrolled ? "text-foreground" : "text-white"

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-border"
            : "bg-transparent"
        }`}
        style={isScrolled ? { boxShadow: "0 4px 24px rgba(0,0,0,0.08)" } : {}}
      >
        <nav className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 lg:h-20 items-center justify-between">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`lg:hidden p-2 -ml-2 transition-colors duration-500 ${iconColor}`}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-5 w-5 stroke-[1.5]" /> : <Menu className="h-5 w-5 stroke-[1.5]" />}
            </button>

            {/* Desktop navigation */}
            <div className="hidden lg:flex items-center gap-12">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm tracking-[0.2em] uppercase transition-colors duration-500 ${
                    pathname === link.href ? navItemColor : navItemHoverColor
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Logo — centered luxury editorial */}
            <Link
              href="/"
              className={`absolute left-1/2 -translate-x-1/2 flex flex-col items-center transition-colors duration-500 ${logoColor}`}
            >
              <span className="font-serif text-xl lg:text-2xl tracking-[0.3em] uppercase leading-none">Netily Shop</span>
              <span className="text-[0.6rem] tracking-[0.2em] uppercase font-light mt-1 text-inherit opacity-80">
                Enterprise & Networking
              </span>
            </Link>

            {/* Right icons */}
            <div className="flex items-center gap-2 lg:gap-4">
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
                        className={`w-full bg-transparent border-b text-sm py-1 pr-2 outline-none transition-colors duration-500 ${
                          isScrolled
                            ? "border-foreground/30 text-foreground placeholder:text-foreground/50"
                            : "border-white/30 text-white placeholder:text-white/50"
                        }`}
                      />
                    </motion.form>
                  )}
                </AnimatePresence>
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  aria-label="Search"
                  className={`p-2 transition-colors duration-500 ${iconColor}`}
                >
                  {isSearchOpen ? <X className="h-5 w-5 stroke-[1.5]" /> : <Search className="h-5 w-5 stroke-[1.5]" />}
                </button>
              </div>

              {/* Account Dropdown */}
              <div ref={accountMenuRef} className="relative">
                <button
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  aria-label="Account"
                  className={`p-2 hidden sm:block transition-colors duration-500 ${iconColor}`}
                >
                  <User className="h-5 w-5 stroke-[1.5]" />
                </button>

                <AnimatePresence>
                  {isAccountMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-background border border-border shadow-xl p-2 z-50"
                    >
                      <div className="px-3 py-2 border-b border-border/60 mb-1">
                        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Signed in as</p>
                        <p className="text-sm font-semibold truncate">ISP Engineer</p>
                      </div>
                      <Link
                        href="/account/profile"
                        className="block px-3 py-2 text-xs uppercase tracking-[0.15em] hover:bg-muted transition-colors"
                      >
                        My Account
                      </Link>
                      <Link
                        href="/account/orders"
                        className="block px-3 py-2 text-xs uppercase tracking-[0.15em] hover:bg-muted transition-colors"
                      >
                        Orders & Invoices
                      </Link>
                      <Link
                        href="/account/addresses"
                        className="block px-3 py-2 text-xs uppercase tracking-[0.15em] hover:bg-muted transition-colors"
                      >
                        NOC & Sites
                      </Link>
                      <Link
                        href="/admin"
                        className="block px-3 py-2 text-xs uppercase tracking-[0.15em] text-foreground font-semibold hover:bg-muted transition-colors"
                      >
                        Admin Console
                      </Link>
                      <div className="border-t border-border/60 my-1 pt-1">
                        <Link
                          href="/login"
                          className="block px-3 py-2 text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Switch User / Demo
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Shopping Bag Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                aria-label="Shopping cart"
                className={`p-2 -mr-2 relative transition-colors duration-500 ${iconColor}`}
              >
                <ShoppingBag className="h-5 w-5 stroke-[1.5]" />
                {itemCount > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 h-4 w-4 text-[10px] flex items-center justify-center transition-colors duration-500 rounded-none ${
                      isScrolled ? "bg-foreground text-background" : "bg-white text-foreground"
                    }`}
                  >
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </nav>
      </motion.header>

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
                <div className="border-t border-border pt-6 mt-2">
                  <p className="text-xs text-muted-foreground tracking-[0.15em] uppercase mb-4">Account</p>
                  <Link
                    href="/account/profile"
                    className="block text-sm tracking-[0.15em] uppercase transition-colors text-foreground/60 hover:text-foreground mb-3"
                  >
                    Profile & NOC
                  </Link>
                  <Link
                    href="/account/orders"
                    className="block text-sm tracking-[0.15em] uppercase transition-colors text-foreground/60 hover:text-foreground mb-3"
                  >
                    Orders & Invoices
                  </Link>
                  <Link
                    href="/admin"
                    className="block text-sm tracking-[0.15em] uppercase transition-colors text-foreground font-semibold"
                  >
                    Admin Console
                  </Link>
                </div>
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
