"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Instagram, Facebook, Twitter } from "lucide-react"

export function PremiumFooter() {
  const footerLinks = {
    shop: [
      { label: "Routers & Gateways", href: "/shop?cat=Routers+%26+Gateways" },
      { label: "Switches & PoE", href: "/shop?cat=Switches+%26+PoE" },
      { label: "Fiber Optics & OLT", href: "/shop?cat=Fiber+Optics+%26+FTTH" },
      { label: "Structured Cabling", href: "/shop?cat=Structured+Cabling" },
      { label: "Workstations & Tech", href: "/shop?cat=Laptops" },
    ],
    about: [
      { label: "Our Story", href: "/heritage" },
      { label: "B2B Proforma Quotes", href: "/checkout" },
      { label: "Authorized Partner", href: "/heritage" },
      { label: "Admin Console", href: "/admin" },
    ],
    support: [
      { label: "Contact Engineering", href: "/heritage" },
      { label: "Shipping & Tower Dispatch", href: "/account/addresses" },
      { label: "Order Tracking", href: "/account/orders" },
      { label: "Account Settings", href: "/account/profile" },
    ],
  }

  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          {/* Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1"
          >
            <h3 className="font-serif text-xl mb-4">Stay Connected</h3>
            <p className="text-background/60 text-sm mb-6 leading-relaxed">
              Subscribe for inventory restock alerts, firmware advisories, and private enterprise pricing.
            </p>
            <div className="relative">
              <input
                type="email"
                placeholder="Enter your corporate email"
                className="w-full bg-transparent border-0 border-b border-background/30 py-3 text-sm placeholder:text-background/40 focus:outline-none focus:border-background transition-colors"
              />
              <button className="absolute right-0 top-1/2 -translate-y-1/2 text-xs tracking-[0.15em] uppercase hover:opacity-60 transition-opacity">
                Subscribe
              </button>
            </div>
          </motion.div>

          {/* Shop links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h4 className="text-xs tracking-[0.2em] uppercase mb-6 text-background/60">Hardware</h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-background/80 hover:text-background transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* About links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h4 className="text-xs tracking-[0.2em] uppercase mb-6 text-background/60">Company</h4>
            <ul className="space-y-3">
              {footerLinks.about.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-background/80 hover:text-background transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Support links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h4 className="text-xs tracking-[0.2em] uppercase mb-6 text-background/60">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-background/80 hover:text-background transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-background/20 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex flex-col items-center">
              <span className="font-serif text-lg tracking-[0.3em] uppercase leading-none">Netily Shop</span>
              <span className="text-[0.55rem] tracking-[0.2em] uppercase font-light mt-1 text-inherit opacity-60">
                Enterprise & Networking
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <a href="https://instagram.com" className="hover:opacity-60 transition-opacity" aria-label="Instagram">
                <Instagram className="h-4 w-4 stroke-[1.5]" />
              </a>
              <a href="https://facebook.com" className="hover:opacity-60 transition-opacity" aria-label="Facebook">
                <Facebook className="h-4 w-4 stroke-[1.5]" />
              </a>
              <a href="https://twitter.com" className="hover:opacity-60 transition-opacity" aria-label="Twitter">
                <Twitter className="h-4 w-4 stroke-[1.5]" />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-background/50">
            <Link href="/privacy" className="hover:text-background/80 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-background/80 transition-colors">
              Terms of Service
            </Link>
            <span>© 2026 Netily Shop. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
