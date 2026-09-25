"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"

const slides = [
  {
    id: "routing",
    eyebrow: "Netily Carrier-Grade Hardware",
    title: "The Future of\nNetwork Routing",
    description:
      "MikroTik Cloud Core 100G and 10G architectures engineered for high-throughput wire-speed BGP, CGNAT, and uncompromising uptime.",
    image: "/netily_hero_bg.jpg",
    primaryCta: { label: "Explore Routers", href: "/shop?cat=Routers+%26+Gateways" },
    secondaryCta: { label: "Our Story", href: "/heritage" },
  },
  {
    id: "fiber",
    eyebrow: "FTTH & Telecom Optics",
    title: "Precision GPON\nInfrastructure",
    description:
      "Enterprise OLTs, 6-motor core-alignment fusion splicers, and industrial 10G SFP+ transceivers for carrier-scale fiber deployment.",
    image: "/products/fusion_splicer.jpg",
    primaryCta: { label: "Fiber & FTTH", href: "/shop?cat=Fiber+Optics+%26+FTTH" },
    secondaryCta: { label: "View Catalog", href: "/shop" },
  },
  {
    id: "cabling",
    eyebrow: "Structured Cabling & Datacenter",
    title: "100% Pure Bare\nCopper Cabling",
    description:
      "Fluke DTX-certified 23AWG Cat6A UV-resistant outdoor cable drums, server racks, and high-density keystone patch panels.",
    image: "/products/cat6a_cable.jpg",
    primaryCta: { label: "Shop Cabling", href: "/shop?cat=Structured+Cabling" },
    secondaryCta: { label: "View All Gear", href: "/shop" },
  },
  {
    id: "workstations",
    eyebrow: "Pro Engineering Hardware",
    title: "High-Performance\nWorkstations",
    description:
      "Apple Silicon M3 Max, 5K Studio Displays, and mechanical engineering essentials curated for top telecom systems architects.",
    image: "/hero_bg.png",
    primaryCta: { label: "Shop Devices", href: "/shop" },
    secondaryCta: { label: "Our Heritage", href: "/heritage" },
  },
]

export function HeroSection() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [])

  const slide = slides[current]

  return (
    <section className="relative min-h-screen flex items-end overflow-hidden bg-foreground">
      {/* Background carousel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          {/* Exact Andalusia luxury gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/50 via-foreground/30 to-foreground/75" />
        </motion.div>
      </AnimatePresence>

      {/* Content overlay */}
      <div className="relative z-10 w-full p-8 lg:p-20 pb-28 lg:pb-36 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <motion.span
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-white/70 text-xs tracking-[0.4em] uppercase mb-6 block"
            >
              {slide.eyebrow}
            </motion.span>

            <h1 className="font-serif text-5xl md:text-6xl lg:text-8xl text-white leading-[1.05] mb-6 text-balance whitespace-pre-line">
              {slide.title}
            </h1>

            <p className="text-white/80 text-base lg:text-xl tracking-wide mb-10 max-w-xl leading-relaxed">
              {slide.description}
            </p>

            <div className="flex flex-wrap gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link href={slide.primaryCta.href}>
                  <Button
                    size="lg"
                    className="bg-white text-foreground hover:bg-white/90 px-10 py-6 text-sm tracking-[0.2em] uppercase rounded-none group"
                  >
                    {slide.primaryCta.label}
                    <ArrowRight className="ml-3 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link href={slide.secondaryCta.href}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent border border-white text-white hover:bg-white/10 px-10 py-6 text-sm tracking-[0.2em] uppercase rounded-none"
                  >
                    {slide.secondaryCta.label}
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide Navigation Controls & Indicators */}
      <div className="absolute bottom-8 right-8 lg:right-20 z-20 flex items-center gap-6">
        <div className="flex items-center gap-2">
          {slides.map((s, index) => (
            <button
              key={s.id}
              onClick={() => setCurrent(index)}
              aria-label={`Go to slide ${index + 1}`}
              className="py-2 focus:outline-none"
            >
              <div
                className={`h-[2px] transition-all duration-500 ${
                  current === index ? "w-10 bg-white" : "w-4 bg-white/40 hover:bg-white/70"
                }`}
              />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 border-l border-white/20 pl-6">
          <button
            onClick={() => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)}
            aria-label="Previous slide"
            className="p-2 text-white/60 hover:text-white transition-colors focus:outline-none"
          >
            <ChevronLeft className="w-5 h-5 stroke-[1.5]" />
          </button>
          <button
            onClick={() => setCurrent((prev) => (prev + 1) % slides.length)}
            aria-label="Next slide"
            className="p-2 text-white/60 hover:text-white transition-colors focus:outline-none"
          >
            <ChevronRight className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block z-10 pointer-events-none"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="w-[1px] h-12 bg-white/50"
        />
      </motion.div>
    </section>
  )
}
