"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, CircleDollarSign, Headphones, PackageCheck, Search, ShieldCheck, ShoppingBag, Wifi } from "lucide-react"
import { defaultOfferSlides, type Product } from "@/shop-ui/lib/products"
import { useShopCatalog } from "@/shop-ui/lib/use-shop-catalog"

function price(value: number) { return `$${Number(value).toLocaleString()} USD` }

function ProductTile({ product }: { product: Product }) {
  return <Link href={`/shop/product/${product.id}`} className="group min-w-0 border border-border bg-white p-3 transition hover:border-[#1b5eff]/55 hover:shadow-lg">
    <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
      <Image src={product.image || "/placeholder.svg"} alt={product.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
      {product.inStock === false && <span className="absolute left-2 top-2 rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-red-600">Out of stock</span>}
    </div>
    <div className="pt-3"><p className="text-[10px] font-semibold uppercase text-[#1b5eff]">{product.brand || product.category}</p><h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-5">{product.name}</h3><div className="mt-3 flex items-center justify-between border-t border-border pt-3"><span className="text-sm font-semibold">{price(product.price)}</span><ArrowRight className="h-4 w-4 text-[#1b5eff] transition group-hover:translate-x-1" /></div></div>
  </Link>
}

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
    const rows = products.filter((item) => item.isFeatured)
    return (rows.length ? rows : products).slice(0, 5)
  }, [products])
  const categoryRows = useMemo(() => categories.map((category) => ({ ...category, products: products.filter((item) => item.category === category.name).slice(0, 5) })).filter((row) => row.products.length >= 2).slice(0, 3), [categories, products])
  const brands = useMemo(() => Array.from(new Set(products.map((item) => item.brand).filter(Boolean))).slice(0, 8) as string[], [products])
  const categoryTiles = useMemo(() => categories.slice(0, 8).map((category) => ({ ...category, image: products.find((item) => item.category === category.name)?.image || "/placeholder.svg" })), [categories, products])

  return <>
    <section className="relative mt-16 min-h-[380px] overflow-hidden bg-[#06183b] text-white lg:mt-[104px] lg:min-h-[420px]">
      <AnimatePresence mode="wait" initial={false}><motion.div key={active.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .55 }} className="absolute inset-0"><Image src={active.image} alt="" fill priority sizes="100vw" className="object-cover object-center" /><div className="absolute inset-0 bg-gradient-to-r from-[#06183b] via-[#06183b]/85 to-[#06183b]/20" /></motion.div></AnimatePresence>
      <div className="relative mx-auto flex min-h-[380px] max-w-7xl items-center px-6 py-14 lg:min-h-[420px] lg:px-8"><motion.div key={`${active.id}-copy`} initial={false} animate={{ opacity: 1, y: 0 }} className="max-w-xl"><p className="text-xs font-semibold uppercase text-[#8bb4ff]">{active.eyebrow}</p><h1 className="mt-3 text-4xl font-semibold leading-tight md:text-5xl">{active.title}</h1><p className="mt-4 max-w-lg text-sm leading-6 text-white/75">{active.description}</p><div className="mt-7 flex flex-wrap gap-3"><Link href={active.href} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#1b5eff] px-5 text-sm font-semibold text-white">{active.ctaLabel}<ArrowRight className="h-4 w-4" /></Link><a href="https://wa.me/254100034307" className="inline-flex h-11 items-center rounded-lg border border-white/35 px-5 text-sm font-semibold">Talk to sales</a></div></motion.div></div>
      <div className="absolute bottom-5 left-6 right-6 flex items-center justify-end gap-2 lg:left-auto lg:right-12"><button onClick={() => setSlide((slide - 1 + offers.length) % offers.length)} aria-label="Previous offer" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/25 bg-black/20"><ChevronLeft className="h-4 w-4" /></button><span className="min-w-12 text-center text-xs">{slide + 1} / {offers.length}</span><button onClick={() => setSlide((slide + 1) % offers.length)} aria-label="Next offer" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/25 bg-black/20"><ChevronRight className="h-4 w-4" /></button></div>
    </section>

    <section className="border-b border-border bg-background py-8"><div className="mx-auto max-w-7xl px-6 lg:px-8"><div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-semibold uppercase text-[#1b5eff]">Browse quickly</p><h2 className="mt-1 text-2xl font-semibold">Shop by category</h2></div><Link href="/shop/catalog" className="text-sm font-semibold text-[#1b5eff]">View all products</Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">{categoryTiles.map((category) => <Link key={category.slug} href={`/shop/catalog?cat=${encodeURIComponent(category.name)}`} className="group text-center"><div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-white"><Image src={category.image} alt="" fill sizes="160px" className="object-contain p-3 transition group-hover:scale-105" /></div><p className="mt-2 text-xs font-medium leading-4">{category.name}</p></Link>)}</div></div></section>

    <section className="bg-[#f5f8ff] py-5"><div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-6 lg:grid-cols-4 lg:px-8">{[
      [CircleDollarSign, "M-Pesa checkout", "Pay securely by STK Push"], [PackageCheck, "Stock checked", "Validated before checkout"], [ShieldCheck, "Warranty details", "Clear coverage per product"], [Headphones, "Buying support", "Help with compatibility"],
    ].map(([Icon, title, copy]) => { const Component = Icon as typeof ShieldCheck; return <div key={String(title)} className="flex items-center gap-3"><Component className="h-5 w-5 shrink-0 text-[#1b5eff]" /><div><p className="text-xs font-semibold">{String(title)}</p><p className="text-[11px] text-muted-foreground">{String(copy)}</p></div></div> })}</div></section>

    <section className="bg-background py-12"><div className="mx-auto max-w-7xl px-6 lg:px-8"><SectionTitle eyebrow="Popular now" title="Featured network equipment" href="/shop/catalog" />{loading ? <StoreSkeleton /> : error ? <StoreError message={error} /> : <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">{featured.map((product) => <ProductTile key={product.id} product={product} />)}</div>}</div></section>

    <section className="bg-[#1b5eff] text-white"><div className="mx-auto grid max-w-7xl items-center gap-6 px-6 py-10 md:grid-cols-[1fr_auto] lg:px-8"><div><p className="text-xs font-semibold uppercase text-white/70">Hardware meets operations</p><h2 className="mt-2 max-w-2xl text-2xl font-semibold md:text-3xl">Run the subscribers, billing, routers, and payments behind your network.</h2></div><Link href="/" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-[#12336e]">Explore Internetily<ArrowRight className="h-4 w-4" /></Link></div></section>

    {categoryRows.map((row) => <section key={row.slug} className="border-b border-border bg-background py-12"><div className="mx-auto max-w-7xl px-6 lg:px-8"><SectionTitle eyebrow="Curated category" title={row.name} href={`/shop/catalog?cat=${encodeURIComponent(row.name)}`} /><div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">{row.products.map((product) => <ProductTile key={product.id} product={product} />)}</div></div></section>)}

    <section className="bg-[#f6f7f9] py-12"><div className="mx-auto max-w-7xl px-6 lg:px-8"><SectionTitle eyebrow="Not sure where to start?" title="Shop by what you need to build" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[
      [Wifi, "Reliable home and office Wi-Fi", "routers access points"], [BadgeCheck, "A new ISP starter setup", "mikrotik router switch"], [PackageCheck, "Fibre installation essentials", "fiber gpon olt"], [ShieldCheck, "Power backup for network gear", "power ups backup"], [Search, "Outdoor and long-range links", "wireless backhaul"], [ShoppingBag, "Apartment and estate coverage", "access point switch"],
    ].map(([Icon, title, query]) => { const Component = Icon as typeof Wifi; return <Link key={String(title)} href={`/shop/catalog?q=${encodeURIComponent(String(query))}`} className="flex items-center gap-4 rounded-lg border border-border bg-white p-5 transition hover:border-[#1b5eff]/50"><span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#eef4ff] text-[#1b5eff]"><Component className="h-5 w-5" /></span><span className="flex-1 text-sm font-semibold">{String(title)}</span><ArrowRight className="h-4 w-4 text-muted-foreground" /></Link> })}</div></div></section>

    <section className="bg-background py-12"><div className="mx-auto max-w-7xl px-6 lg:px-8"><SectionTitle eyebrow="Practical guidance" title="Buy equipment with fewer expensive guesses" /><div className="grid gap-4 md:grid-cols-3">{[
      ["Choosing the right router", "Match throughput, subscriber count, VPN load, and future growth before buying."], ["Fibre rollout checklist", "Plan OLT capacity, split ratios, optics, drop cable, tools, and spares together."], ["Keeping a network online", "Size backup power around routers, ONTs, switches, radios, and realistic outage time."],
    ].map(([title, copy], index) => <article key={title} className="border-l-2 border-[#1b5eff] bg-[#f6f8fc] p-6"><span className="text-xs font-semibold text-[#1b5eff]">Guide 0{index + 1}</span><h3 className="mt-3 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p><a href="mailto:netilysupport@gmail.com?subject=Equipment%20advice" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#1b5eff]">Ask our team<ArrowRight className="h-4 w-4" /></a></article>)}</div></div></section>

    <section className="border-y border-border bg-[#eef4ff] py-9"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 md:flex-row md:items-center md:justify-between lg:px-8"><div><h2 className="text-2xl font-semibold">Need help matching equipment?</h2><p className="mt-1 text-sm text-muted-foreground">Tell us what you are building and what hardware you already have.</p></div><div className="flex flex-wrap gap-3"><a href="https://wa.me/254100034307" className="inline-flex h-11 items-center rounded-lg bg-[#1b5eff] px-5 text-sm font-semibold text-white">Chat on WhatsApp</a><a href="tel:+254100034307" className="inline-flex h-11 items-center rounded-lg border border-[#1b5eff] px-5 text-sm font-semibold text-[#1b5eff]">Call sales</a></div></div></section>

    {brands.length > 0 && <section className="bg-background py-9"><div className="mx-auto max-w-7xl px-6 lg:px-8"><p className="mb-4 text-center text-xs font-semibold uppercase text-muted-foreground">Brands in the live catalog</p><div className="flex flex-wrap justify-center gap-2">{brands.map((brand) => <Link key={brand} href={`/shop/catalog?q=${encodeURIComponent(brand)}`} className="rounded-lg border border-border bg-white px-5 py-3 text-sm font-semibold">{brand}</Link>)}</div></div></section>}
  </>
}

function SectionTitle({ eyebrow, title, href }: { eyebrow: string; title: string; href?: string }) {
  return <div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase text-[#1b5eff]">{eyebrow}</p><h2 className="mt-1 text-2xl font-semibold md:text-3xl">{title}</h2></div>{href && <Link href={href} className="hidden items-center gap-1 text-sm font-semibold text-[#1b5eff] sm:flex">View all<ArrowRight className="h-4 w-4" /></Link>}</div>
}
function StoreSkeleton() { return <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="aspect-[3/4] animate-pulse rounded-lg bg-muted" />)}</div> }
function StoreError({ message }: { message: string }) { return <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">{message}</div> }
