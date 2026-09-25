"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { PremiumFooter } from "@/components/premium-footer"
import Link from "next/link"
import { ArrowRight, ShieldCheck, Cable, Headphones, Award, Server } from "lucide-react"
import { Button } from "@/components/ui/button"

const timeline = [
  {
    year: "2018",
    title: "Founded in Nairobi",
    description:
      "Netily Shop was established by network engineers who experienced firsthand the delays, counterfeit copper, and grey-market risks that plagued African telecom and ISP infrastructure projects.",
  },
  {
    year: "2020",
    title: "Authorized Partner Alliances",
    description:
      "Secured direct authorized procurement channels for MikroTik, Ubiquiti, and tier-1 fiber manufacturers, guaranteeing 100% genuine factory hardware with valid warranties.",
  },
  {
    year: "2022",
    title: "Testing & Cabling Verification Lab",
    description:
      "Established our regional laboratory for Fluke DTX certification of Cat6A cabling and OTDR optical testing, setting the benchmark for pure electrolytic copper across East Africa.",
  },
  {
    year: "2024",
    title: "500+ ISPs & WISPs Supplied",
    description:
      "Crossed over 500 active network operators, telecom contractors, and datacenters supplied across Kenya, Uganda, Tanzania, and Rwanda.",
  },
  {
    year: "Present",
    title: "Next-Gen Enterprise Tech",
    description:
      "Expanding from core carrier routing into high-performance engineering workstations, Apple Silicon developer setups, and datacenter rack architecture.",
  },
]

const values = [
  {
    icon: ShieldCheck,
    title: "100% Genuine Certified Hardware",
    description:
      "We source directly from manufacturer production lines. Every MikroTik router, Ubiquiti radio, and VSOL OLT carries traceable factory serials and full distributor warranties.",
    image: "/products/mikrotik_router.jpg",
  },
  {
    icon: Cable,
    title: "100% Solid Bare Copper Promise",
    description:
      "We strictly ban Copper Clad Aluminum (CCA). Our Cat6 and Cat6A cables are made from pure annealed electrolytic copper, ensuring zero signal degradation and safe 90W PoE power.",
    image: "/products/cat6a_cable.jpg",
  },
  {
    icon: Headphones,
    title: "Engineer-to-Engineer Support",
    description:
      "Speak directly to MikroTik and Cisco certified network engineers who understand BGP routing tables, VLAN tagging, OLT configurations, and optical power budget planning.",
    image: "/products/server_rack.jpg",
  },
]

export function HeritagePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navigation />

      {/* Hero Banner */}
      <section className="relative h-[65vh] min-h-[480px] flex items-center justify-center overflow-hidden bg-foreground">
        <div className="absolute inset-0">
          <Image
            src="/heritage_bg.png"
            alt="Netily Shop Heritage and Engineering"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/35 to-foreground/75" />
        </div>

        <motion.div
          className="relative z-10 text-center text-white px-6 max-w-3xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="text-xs tracking-[0.4em] uppercase text-white/70 mb-4 block">
            Our Story • Netily Shop
          </span>
          <h1 className="font-serif text-5xl md:text-7xl mb-6 text-white leading-tight">
            Built for High Performance
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-xl mx-auto leading-relaxed">
            Delivering the authentic network infrastructure, optical fiber, and high-performance hardware that powers modern African connectivity.
          </p>
        </motion.div>
      </section>

      {/* Introduction Quote */}
      <section className="py-20 lg:py-28 max-w-4xl mx-auto px-6 text-center">
        <motion.blockquote
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <p className="font-serif text-2xl lg:text-4xl text-foreground leading-relaxed text-balance">
            "When an ISP deploys a core router or terminates 500 fiber drops, there is zero room for counterfeit copper or questionable firmware. We built Netily Shop to be the trusted partner we wished we had in the field."
          </p>
          <cite className="block text-xs tracking-[0.2em] uppercase text-muted-foreground not-italic">
            — Netily Engineering Directorate
          </cite>
        </motion.blockquote>
      </section>

      {/* Values Grid */}
      <section className="py-20 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-3 block">
              Our Commitments
            </span>
            <h2 className="font-serif text-3xl md:text-5xl mb-4">Why Engineers Trust Netily</h2>
            <p className="text-muted-foreground text-sm tracking-wide max-w-md mx-auto">
              Precision engineering, certified authentic hardware, and relentless focus on quality.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((v, i) => (
              <div
                key={i}
                className="border border-border bg-background p-6 space-y-4 hover:border-foreground/40 transition-colors"
              >
                <div className="relative aspect-[4/3] w-full bg-muted border border-border overflow-hidden">
                  <Image src={v.image} alt={v.title} fill className="object-cover" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-xl">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-24 max-w-4xl mx-auto px-6">
        <div className="text-center mb-20">
          <span className="text-xs tracking-[0.4em] uppercase text-muted-foreground mb-3 block">
            Our Journey
          </span>
          <h2 className="font-serif text-3xl md:text-5xl mb-4">Milestones & Growth</h2>
        </div>

        <div className="space-y-12">
          {timeline.map((item) => (
            <div
              key={item.year}
              className="flex flex-col md:flex-row gap-6 md:gap-12 pb-10 border-b border-border/60 last:border-b-0"
            >
              <div className="md:w-32 flex-shrink-0">
                <span className="font-serif text-4xl text-muted-foreground/60">{item.year}</span>
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-serif text-2xl">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Box */}
      <section className="py-20 bg-muted/40 border-t border-border">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <span className="text-xs tracking-[0.4em] uppercase text-muted-foreground block">
            Start Your Deployment
          </span>
          <h2 className="font-serif text-3xl md:text-5xl">
            Upgrade Your Network Backbone Today
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
            Browse our full warehouse inventory with same-day regional dispatch and official manufacturer warranties.
          </p>
          <div className="pt-4">
            <Link href="/shop">
              <Button
                size="lg"
                className="bg-foreground text-background hover:bg-foreground/90 px-10 py-6 text-sm tracking-[0.2em] uppercase rounded-none"
              >
                Browse Equipment Collection
                <ArrowRight className="ml-3 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PremiumFooter />
    </main>
  )
}

export default HeritagePage
