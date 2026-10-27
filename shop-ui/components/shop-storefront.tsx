"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, BadgeCheck, Cable, ChevronLeft, ChevronRight, Headphones, PackageCheck, RadioTower, Router, Search, ShieldCheck, ShoppingBag, Sparkles, Wifi, Wrench } from "lucide-react"
import { defaultOfferSlides, type Product } from "@/shop-ui/lib/products"
import { useShopCatalog } from "@/shop-ui/lib/use-shop-catalog"
import { formatShopMoney } from "@/shop-ui/lib/currency"

function ProductTile({ product }: { product: Product }) {
  return (
    <Link href={`/shop/product/${product.id}`} className="group min-w-0 overflow-hidden rounded-lg border border-border bg-white transition duration-300 hover:-translate-y-1 hover:border-[#1b5eff]/50 hover:shadow-[0_18px_45px_rgba(17,45,96,0.12)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f2f5f9]">
        <Image src={product.image || "/placeholder.svg"} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-contain p-4 transition duration-500 group-hover:scale-[1.06]" />
        {product.inStock === false ? <span className="absolute left-3 top-3 rounded-md bg-white px-2.5 py-1 text-[10px] font-semibold text-red-600 shadow-sm">Out of stock</span> : <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 shadow-sm">Ready to order</span>}
      </div>
      <div className="p-4">
        <p className="text-[10px] font-semibold uppercase text-[#1b5eff]">{product.brand || product.category}</p>
        <h3 className="mt-1 line-clamp-2 min-h-12 text-base font-semibold leading-6">{product.name}</h3>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3"><span className="text-base font-semibold">{formatShopMoney(product.price, product.currency)}</span><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#eef4ff] text-[#1b5eff] transition group-hover:bg-[#1b5eff] group-hover:text-white"><ArrowRight className="h-4 w-4" /></span></div>
      </div>
    </Link>
  )
}

const buildJourneys = [
  { icon: RadioTower, kicker: "Starting or expanding a WISP", title: "Build a link that stays up when customers need it most.", copy: "Backhaul radios, routers, PoE switching, and clean power for the next tower or relay site.", image: "/shop-assets/products/wireless_dish.jpg", href: "/shop/catalog?q=wireless%20backhaul%20router%20power" },
  { icon: Cable, kicker: "Rolling out fibre", title: "Plan the whole fibre run, not just the first box.", copy: "OLT and ONT equipment, drop cable, optics, splicing tools, and the spares field teams reach for.", image: "/shop-assets/products/fusion_splicer.jpg", href: "/shop/catalog?q=fiber%20gpon%20olt%20splicer" },
  { icon: Router, kicker: "Upgrading the network core", title: "Give growing subscriber traffic somewhere to breathe.", copy: "MikroTik routing, switching, racks, and accessories sized for PPPoE, hotspot, and branch aggregation.", image: "/shop-assets/products/mikrotik_router.jpg", href: "/shop/catalog?q=mikrotik%20router%20switch%20rack" },
]

export function ShopStorefront() {
  const { products, categories, loading, error } = useShopCatalog()
  const [slide, setSlide] = useState(0)
  const offers = defaultOfferSlides

  useEffect(() => {
    if (offers.length < 2) return
    const timer = window.setInterval(() => setSlide((value) => (value + 1) % offers.length), 6500)
    return () => window.clearInterval(timer)
  }, [offers.length])

  const active = offers[slide]
  const featured = useMemo(() => {
    const selected = products.filter((item) => item.isFeatured)
    return (selected.length ? selected : products).slice(0, 4)
  }, [products])
  const categoryTiles = useMemo(() => categories.slice(0, 8).map((category) => ({ ...category, image: products.find((item) => item.category === category.name)?.image || "/placeholder.svg", count: products.filter((item) => item.category === category.name).length })), [categories, products])
  const brands = useMemo(() => Array.from(new Set(products.map((item) => item.brand).filter(Boolean))).slice(0, 8) as string[], [products])

  return (
    <>
      <section className="relative mt-16 min-h-[390px] overflow-hidden bg-[#06183b] text-white lg:mt-[104px] lg:min-h-[430px]">
        <AnimatePresence mode="wait" initial={false}><motion.div key={active.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.55 }} className="absolute inset-0"><Image src={active.image} alt="" fill priority sizes="100vw" className="object-cover object-center" /><div className="absolute inset-0 bg-gradient-to-r from-[#06183b] via-[#06183b]/88 to-[#06183b]/15" /></motion.div></AnimatePresence>
        <div className="relative mx-auto flex min-h-[390px] max-w-7xl items-center px-6 py-14 lg:min-h-[430px] lg:px-8"><motion.div key={`${active.id}-copy`} initial={false} animate={{ opacity: 1, y: 0 }} className="max-w-2xl"><p className="flex items-center gap-2 text-xs font-semibold uppercase text-[#a8c5ff]"><Sparkles className="h-4 w-4" />{active.eyebrow}</p><h1 className="mt-3 max-w-xl text-4xl font-semibold leading-tight md:text-5xl">{active.title}</h1><div className="mt-7 flex flex-wrap gap-3"><Link href={active.href} className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#1b5eff] px-6 text-sm font-semibold text-white transition hover:bg-[#104bd7]">{active.ctaLabel}<ArrowRight className="h-4 w-4" /></Link><a href="https://wa.me/254100034307" className="inline-flex h-12 items-center rounded-lg border border-white/35 bg-black/10 px-6 text-sm font-semibold backdrop-blur-sm transition hover:bg-white hover:text-[#06183b]">Ask before you buy</a></div></motion.div></div>
        <div className="absolute bottom-5 left-6 right-6 flex items-center justify-end gap-2 lg:right-12"><button onClick={() => setSlide((slide - 1 + offers.length) % offers.length)} aria-label="Previous offer" className="grid h-10 w-10 place-items-center rounded-lg border border-white/25 bg-black/25 backdrop-blur-sm"><ChevronLeft className="h-5 w-5" /></button><span className="min-w-14 text-center text-xs font-semibold">{slide + 1} / {offers.length}</span><button onClick={() => setSlide((slide + 1) % offers.length)} aria-label="Next offer" className="grid h-10 w-10 place-items-center rounded-lg border border-white/25 bg-black/25 backdrop-blur-sm"><ChevronRight className="h-5 w-5" /></button></div>
      </section>

      <section className="border-b border-border bg-white"><div className="mx-auto grid max-w-7xl grid-cols-2 px-6 lg:grid-cols-4 lg:px-8">{[
        [PackageCheck, "Stock checked", "Confirmed before dispatch"], [ShieldCheck, "Clear warranty", "Coverage shown per item"], [Headphones, "Real buying help", "Ask about compatibility"], [BadgeCheck, "M-Pesa checkout", "Fast STK Push payment"],
      ].map(([Icon, title, copy]) => { const Component = Icon as typeof ShieldCheck; return <div key={String(title)} className="flex min-h-32 min-w-0 flex-col items-start gap-2 border-r border-border px-3 py-5 last:border-r-0 sm:px-5 lg:min-h-28 lg:flex-row lg:items-center lg:gap-4 lg:px-5 lg:first:pl-0 lg:last:pr-0"><Component className="h-8 w-8 shrink-0 text-[#1b5eff]" /><div className="min-w-0"><p className="text-sm font-semibold leading-5">{String(title)}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{String(copy)}</p></div></div> })}</div></section>

      <section className="bg-[#f5f8ff] py-14 md:py-16"><div className="mx-auto max-w-7xl px-6 lg:px-8"><SectionTitle eyebrow="Start with the job" title="What are you building next?" copy="Choose the job in front of you. We will take you to the hardware that belongs together." /><div className="grid gap-5 lg:grid-cols-3">{buildJourneys.map((journey, index) => { const Icon = journey.icon; return <motion.div key={journey.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ delay: index * 0.08 }}><Link href={journey.href} className="group block h-full overflow-hidden rounded-lg border border-[#cfdaee] bg-white shadow-[0_12px_35px_rgba(26,57,110,0.07)]"><div className="relative aspect-[16/10] overflow-hidden bg-[#eaf0f8]"><Image src={journey.image} alt="" fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" /><span className="absolute left-4 top-4 grid h-14 w-14 place-items-center rounded-lg bg-white text-[#1b5eff] shadow-lg"><Icon className="h-7 w-7" /></span></div><div className="p-6"><p className="text-xs font-semibold uppercase text-[#1b5eff]">{journey.kicker}</p><h3 className="mt-2 text-xl font-semibold leading-7">{journey.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{journey.copy}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#1b5eff]">See the right equipment<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></div></Link></motion.div> })}</div></div></section>

      <section className="bg-background py-14 md:py-16"><div className="mx-auto max-w-7xl px-6 lg:px-8"><SectionTitle eyebrow="Browse the shelves" title="Shop by category" href="/shop/catalog" />{categoryTiles.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{categoryTiles.map((category) => <Link key={category.slug} href={`/shop/catalog?cat=${encodeURIComponent(category.name)}`} className="group flex min-h-40 items-center overflow-hidden rounded-lg border border-border bg-white p-4 transition hover:border-[#1b5eff]/50 hover:shadow-lg"><div className="relative h-28 w-28 shrink-0"><Image src={category.image} alt="" fill sizes="112px" className="object-contain p-2 transition group-hover:scale-105" /></div><div className="min-w-0 pl-3"><p className="text-base font-semibold leading-5">{category.name}</p><p className="mt-2 text-xs text-muted-foreground">{category.count} {category.count === 1 ? "item" : "items"}</p><ArrowRight className="mt-4 h-5 w-5 text-[#1b5eff] transition group-hover:translate-x-1" /></div></Link>)}</div> : loading ? <CategorySkeleton /> : <StoreError message={error || "Categories are not available right now."} />}</div></section>

      <section className="border-y border-border bg-[#071a3d] py-14 text-white md:py-16"><div className="mx-auto max-w-7xl px-6 lg:px-8"><SectionTitle eyebrow="Popular with operators" title="Equipment people are looking at now" href="/shop/catalog" dark />{loading ? <StoreSkeleton /> : error ? <StoreError message={error} /> : <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{featured.map((product) => <ProductTile key={product.id} product={product} />)}</div>}</div></section>

      <section className="bg-white py-14 md:py-20"><div className="mx-auto grid max-w-7xl items-center gap-10 px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8"><div className="relative min-h-[360px] overflow-hidden rounded-lg bg-[#eaf0f8] md:min-h-[470px]"><Image src="/shop-assets/shop_hero.png" alt="Network equipment prepared for installation" fill sizes="(max-width: 1024px) 100vw, 52vw" className="object-cover" /><div className="absolute bottom-5 left-5 right-5 rounded-lg bg-white/95 p-4 shadow-xl backdrop-blur"><p className="text-sm font-semibold">Buying for a real installation?</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Send the topology, expected users, and equipment you already own. We will help spot mismatches before dispatch.</p></div></div><div><p className="text-xs font-semibold uppercase text-[#1b5eff]">Less guesswork in the field</p><h2 className="mt-2 max-w-xl text-3xl font-semibold leading-tight md:text-4xl">A cart should make sense when the installer opens it.</h2><p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">Network purchases are connected decisions. The right router still needs the right power, optics, cabling, mounting, and capacity. Ask us to check the combination before you pay.</p><div className="mt-7 grid gap-4 sm:grid-cols-2">{[
        [Wrench, "Compatibility check", "Confirm ports, optics, power, and RouterOS fit."], [Wifi, "Capacity check", "Match hardware to users, traffic, and growth."], [ShoppingBag, "One sensible order", "Group the main equipment, tools, and spares."], [Search, "Hard-to-find gear", "Tell us what is missing from the catalog."],
      ].map(([Icon, title, copy]) => { const Component = Icon as typeof Wrench; return <div key={String(title)} className="flex gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#eef4ff] text-[#1b5eff]"><Component className="h-6 w-6" /></span><div><p className="text-sm font-semibold">{String(title)}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{String(copy)}</p></div></div> })}</div><div className="mt-8 flex flex-wrap gap-3"><a href="https://wa.me/254100034307" className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#1b5eff] px-6 text-sm font-semibold text-white">Ask on WhatsApp<ArrowRight className="h-4 w-4" /></a><Link href="/shop/catalog" className="inline-flex h-12 items-center rounded-lg border border-border px-6 text-sm font-semibold">Browse everything</Link></div></div></div></section>

      <section className="bg-[#1b5eff] text-white"><div className="mx-auto grid max-w-7xl items-center gap-6 px-6 py-11 md:grid-cols-[1fr_auto] lg:px-8"><div><p className="text-xs font-semibold uppercase text-white/70">Hardware meets operations</p><h2 className="mt-2 max-w-2xl text-2xl font-semibold md:text-3xl">Run the subscribers, billing, routers, and payments behind your network.</h2></div><Link href="/" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-[#12336e]">Explore Internetily<ArrowRight className="h-4 w-4" /></Link></div></section>

      {brands.length > 0 && <section className="bg-background py-10"><div className="mx-auto max-w-7xl px-6 lg:px-8"><p className="mb-5 text-center text-xs font-semibold uppercase text-muted-foreground">Find familiar network brands</p><div className="flex flex-wrap justify-center gap-3">{brands.map((brand) => <Link key={brand} href={`/shop/catalog?q=${encodeURIComponent(brand)}`} className="rounded-lg border border-border bg-white px-6 py-3 text-sm font-semibold transition hover:border-[#1b5eff]/50 hover:text-[#1b5eff]">{brand}</Link>)}</div></div></section>}
    </>
  )
}

function SectionTitle({ eyebrow, title, copy, href, dark = false }: { eyebrow: string; title: string; copy?: string; href?: string; dark?: boolean }) {
  return <div className="mb-7 flex items-end justify-between gap-5"><div><p className={`text-xs font-semibold uppercase ${dark ? "text-[#a8c5ff]" : "text-[#1b5eff]"}`}>{eyebrow}</p><h2 className="mt-1 max-w-2xl text-2xl font-semibold md:text-3xl">{title}</h2>{copy && <p className={`mt-2 max-w-2xl text-sm leading-6 ${dark ? "text-white/65" : "text-muted-foreground"}`}>{copy}</p>}</div>{href && <Link href={href} className={`hidden items-center gap-1 text-sm font-semibold sm:flex ${dark ? "text-white" : "text-[#1b5eff]"}`}>View all<ArrowRight className="h-4 w-4" /></Link>}</div>
}

function StoreSkeleton() { return <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="aspect-[3/4] animate-pulse rounded-lg bg-white/10" />)}</div> }
function CategorySkeleton() { return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-40 animate-pulse rounded-lg bg-muted" />)}</div> }
function StoreError({ message }: { message: string }) { return <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">{message}</div> }
