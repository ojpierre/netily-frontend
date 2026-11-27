"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { notFound, useRouter } from "next/navigation"
import { Check, ChevronRight, Minus, MessageCircle, Plus, ShieldCheck, ShoppingBag, Smartphone, Truck, Users } from "lucide-react"
import { toast } from "sonner"
import { Navigation } from "@/shop-ui/components/navigation"
import { PremiumFooter } from "@/shop-ui/components/premium-footer"
import { ProductGallery } from "@/shop-ui/components/product-gallery"
import { ProductDetailsAccordion } from "@/shop-ui/components/product-details-accordion"
import { RelatedProducts } from "@/shop-ui/components/related-products"
import type { Product } from "@/shop-ui/lib/products"
import { shopApi } from "@/shop-ui/lib/shop-api"
import { featuredCatalog } from "@/shop-ui/lib/featured-catalog"
import { useCart } from "@/shop-ui/lib/cart-context"
import { useShopSettings } from "@/shop-ui/lib/use-shop-settings"
import { formatShopMoney } from "@/shop-ui/lib/currency"
import { availability, categoryHref, HEADING_FONT, isOnSale, saveAmount, savePercent, SITE_URL, whatsappLink } from "@/shop-ui/lib/shop-helpers"

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms)
    promise.then(
      (v) => { clearTimeout(t); resolve(v) },
      (e) => { clearTimeout(t); reject(e) },
    )
  })
}

function sameCategory(all: Product[], p: Product, limit = 4) {
  return all
    .filter((x) => x.id !== p.id && (x.categorySlug ? x.categorySlug === p.categorySlug : x.category === p.category))
    .sort((a, b) => Number(!!b.isFeatured) - Number(!!a.isFeatured))
    .slice(0, limit)
}

export function ProductPageClient({ id }: { id: string }) {
  const router = useRouter()
  const { addItem } = useCart()
  const settings = useShopSettings()
  const [product, setProduct] = useState<Product | null | undefined>(undefined) // undefined = loading, null = 404
  const [related, setRelated] = useState<Product[]>([])
  const [loadError, setLoadError] = useState(false)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [selectedStorage, setSelectedStorage] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  useEffect(() => {
    let cancelled = false
    setProduct(undefined)
    setLoadError(false)
    setRelated([])
    setQty(1)
    const fallback = featuredCatalog.find((x) => x.id === id) || null
    withTimeout(shopApi.getProduct(id), 7000)
      .catch((e) => {
        // A slow or unreachable API should not leave the page blank when we have the starter listing.
        if (fallback) return fallback
        throw e
      })
      .then(async (p) => {
        if (cancelled) return
        setProduct(p)
        if (!p) return
        let rel: Product[] = []
        try {
          rel = await withTimeout(shopApi.getRelatedProducts(id, 4), 5000)
        } catch {
          /* fall back below */
        }
        if (!rel.length) {
          try {
            const live = await withTimeout(shopApi.getProducts({ page_size: "200" }), 5000)
            rel = sameCategory(live.results, p)
          } catch {
            /* use the bundled range */
          }
        }
        if (!rel.length) rel = sameCategory(featuredCatalog, p)
        if (!cancelled) setRelated(rel)
      })
      .catch(() => !cancelled && setLoadError(true))
    return () => {
      cancelled = true
    }
  }, [id])

  const jsonLd = useMemo(() => {
    if (!product) return null
    const stock = availability(product)
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.summary || product.description || product.longDescription,
      sku: product.id,
      ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
      ...(product.image ? { image: product.image } : {}),
      offers: {
        "@type": "Offer",
        price: product.price,
        priceCurrency: product.currency || "KES",
        availability: stock.inStock ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
        url: `${SITE_URL}/shop/product/${product.id}`,
      },
    }
  }, [product])

  const shell = (children: React.ReactNode) => (
    <main className="min-h-screen bg-white text-[#17252d]">
      <Navigation />
      {children}
      <PremiumFooter />
    </main>
  )

  if (loadError) {
    return shell(
      <div className="mx-auto max-w-xl px-4 pb-24 pt-[160px] text-center">
        <h1 className={`${HEADING_FONT} text-2xl font-semibold`}>We could not load this product</h1>
        <p className="mt-2 text-sm text-[#56656f]">Check your connection and refresh the page, or browse the full range.</p>
        <Link href="/shop/catalog" className="mt-6 inline-flex h-11 items-center rounded-lg bg-[#0874cf] px-5 text-sm font-semibold text-white">Browse equipment</Link>
      </div>,
    )
  }
  if (product === undefined) {
    return shell(
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-[130px] sm:px-6 lg:px-8" aria-busy="true">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="aspect-[4/3] animate-pulse rounded-2xl bg-[#eef3f5] motion-reduce:animate-none" />
          <div className="space-y-4">
            <div className="h-4 w-24 rounded bg-[#eef3f5]" />
            <div className="h-9 w-3/4 rounded bg-[#eef3f5]" />
            <div className="h-5 w-full rounded bg-[#f3f7f8]" />
            <div className="h-10 w-40 rounded bg-[#eef3f5]" />
          </div>
        </div>
      </div>,
    )
  }
  if (product === null) notFound()

  const p = product
  const stock = availability(p)
  const onSale = isOnSale(p)
  const specs = Object.entries(p.specsSheet || {}).filter(([, v]) => v)
  const effectiveStorage = selectedStorage || p.sizes.find((s) => s.available)?.size || p.sizes[0]?.size || "Standard"
  const effectiveColor = selectedColor || p.colors.find((c) => c.available)?.name || p.colors[0]?.name || "Default"
  const productUrl = `${SITE_URL}/shop/product/${p.id}`
  const fee = settings?.default_shipping_fee ?? 0
  const free = settings?.free_shipping_threshold ?? null

  function addToCart() {
    for (let i = 0; i < qty; i++) {
      addItem({
        id: p.id,
        name: p.name,
        price: p.price,
        currency: p.currency,
        image: p.image,
        category: p.category,
        selectedStorage: effectiveStorage,
        selectedColor: effectiveColor,
      })
    }
  }
  function handleAdd() {
    addToCart()
    toast.success(`${qty > 1 ? `${qty} added` : "Added"} to cart: ${p.name}`)
    setAdded(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setAdded(false), 1800)
  }
  function handleBuyNow() {
    addToCart()
    router.push("/shop/checkout")
  }

  const deliveryLine =
    fee > 0
      ? `Delivery from ${formatShopMoney(fee)}${free ? `, free over ${formatShopMoney(free)}` : ""}. Timing depends on the item and your destination.`
      : free
        ? `Free delivery over ${formatShopMoney(free)}. Timing depends on the item and your destination.`
        : "We dispatch once stock and payment are confirmed. Timing depends on the item and your destination."

  const infoCards = [
    { icon: Smartphone, title: "Pay with M-Pesa", copy: "Approve one prompt on your phone. The full amount shows before you pay." },
    { icon: Truck, title: "Delivery across Kenya", copy: deliveryLine },
    { icon: ShieldCheck, title: p.warranty || "Warranty", copy: "Cover follows the manufacturer or supplier terms on your invoice. Keep the serial number." },
    { icon: Users, title: "Bulk and ISP orders", copy: "Buying several? Send your parts list for a quote and a compatibility check." },
  ]

  const accordion = [
    { title: "In the box", content: p.materials },
    { title: "Delivery and returns", content: [deliveryLine, "Check the packaging on arrival and keep boxes, serial labels and the invoice until the equipment is tested.", "Returns depend on item condition, warranty status and supplier rules."] },
    { title: "Warranty and support", content: [p.warranty || "Warranty terms are shown on your invoice.", ...p.care, "Keep your invoice and serial number to make a claim."] },
  ]

  const waText = `Hi Internetily, I would like to ask about the ${p.name} (${productUrl}).`

  return shell(
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}

      <div className="mx-auto max-w-7xl px-4 pb-4 pt-[96px] sm:px-6 lg:px-8 lg:pt-[104px]">
        <nav aria-label="Breadcrumb" className="pt-5">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-[#56656f]">
            <li><Link href="/shop" className="hover:text-[#0874cf]">Shop</Link></li>
            <li aria-hidden="true"><ChevronRight className="h-3 w-3" /></li>
            <li>
              <Link href={p.categorySlug ? categoryHref(p.categorySlug) : `/shop/catalog?cat=${encodeURIComponent(p.category)}`} className="hover:text-[#0874cf]">
                {p.category}
              </Link>
            </li>
            <li aria-hidden="true"><ChevronRight className="h-3 w-3" /></li>
            <li className="min-w-0 truncate font-medium text-[#17252d]" aria-current="page">{p.name}</li>
          </ol>
        </nav>
      </div>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <div className="min-w-0 lg:sticky lg:top-[128px] lg:self-start">
            <ProductGallery product={p} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {p.brand && (
                <Link href={`/shop/catalog?brand=${encodeURIComponent(p.brand)}`} className="rounded-full bg-[#eaf4fc] px-3 py-1 text-xs font-semibold text-[#075faa] hover:bg-[#d9ebf9]">
                  {p.brand}
                </Link>
              )}
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${stock.inStock ? "bg-[#e6f6f0] text-[#168564]" : "bg-[#f3f7f8] text-[#56656f]"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${stock.inStock ? "bg-[#22a67d]" : "bg-[#9aa8b0]"}`} aria-hidden="true" />
                {stock.label}
              </span>
            </div>
            <h1 className={`${HEADING_FONT} mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl`}>{p.name}</h1>
            {(p.summary || p.description) && <p className="mt-3 text-base leading-7 text-[#56656f]">{p.summary || p.description}</p>}

            <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className={`${HEADING_FONT} text-3xl font-semibold tabular-nums`}>{formatShopMoney(p.price, p.currency)}</p>
              {onSale && (
                <>
                  <p className="text-base tabular-nums text-[#56656f] line-through">{formatShopMoney(p.compareAtPrice as number, p.currency)}</p>
                  <span className="rounded-full bg-[#22a67d] px-2.5 py-1 text-xs font-semibold text-white">Save {savePercent(p)}%</span>
                </>
              )}
            </div>
            {onSale && <p className="mt-1 text-sm font-medium tabular-nums text-[#168564]">You save {formatShopMoney(saveAmount(p), p.currency)}</p>}
            {!stock.inStock && <p className="mt-2 text-sm text-[#56656f]">Not on the shelf right now. Order it and we will confirm the lead time with you.</p>}

            {p.colors.length > 0 && (
              <fieldset className="mt-6">
                <legend className="text-sm font-semibold">Colour: <span className="font-normal text-[#56656f]">{effectiveColor}</span></legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {p.colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      disabled={!c.available}
                      onClick={() => setSelectedColor(c.name)}
                      aria-pressed={effectiveColor === c.name}
                      className={`h-10 rounded-lg border px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#0874cf] disabled:opacity-40 ${effectiveColor === c.name ? "border-[#0874cf] bg-[#eaf4fc] text-[#075faa]" : "border-[#dce4e8] hover:border-[#9db3bf]"}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
            {p.sizes.length > 0 && (
              <fieldset className="mt-6">
                <legend className="text-sm font-semibold">Option: <span className="font-normal text-[#56656f]">{effectiveStorage}</span></legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {p.sizes.map((s) => (
                    <button
                      key={s.size}
                      type="button"
                      disabled={!s.available}
                      onClick={() => setSelectedStorage(s.size)}
                      aria-pressed={effectiveStorage === s.size}
                      className={`h-10 rounded-lg border px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#0874cf] disabled:opacity-40 ${effectiveStorage === s.size ? "border-[#0874cf] bg-[#eaf4fc] text-[#075faa]" : "border-[#dce4e8] hover:border-[#9db3bf]"}`}
                    >
                      {s.size}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="flex h-12 items-center rounded-lg border border-[#dce4e8]" role="group" aria-label="Quantity">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity" className="grid h-12 w-11 place-items-center rounded-l-lg outline-none hover:bg-[#f3f7f8] focus-visible:ring-2 focus-visible:ring-[#0874cf] disabled:opacity-40">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-semibold tabular-nums" aria-live="polite">{qty}</span>
                <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} aria-label="Increase quantity" className="grid h-12 w-11 place-items-center rounded-r-lg outline-none hover:bg-[#f3f7f8] focus-visible:ring-2 focus-visible:ring-[#0874cf]">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={handleAdd}
                className={`inline-flex h-12 min-w-[10rem] flex-1 items-center justify-center gap-2 rounded-lg px-6 text-sm font-semibold text-white outline-none transition focus-visible:ring-2 focus-visible:ring-[#0874cf] focus-visible:ring-offset-2 ${added ? "bg-[#22a67d]" : "bg-[#0874cf] hover:bg-[#075faa]"}`}
              >
                {added ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingBag className="h-4 w-4" aria-hidden="true" />}
                {added ? "Added to cart" : "Add to cart"}
              </button>
            </div>
            <button
              type="button"
              onClick={handleBuyNow}
              className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-lg border border-[#17252d] bg-[#17252d] px-6 text-sm font-semibold text-white outline-none transition hover:bg-[#0f1a20] focus-visible:ring-2 focus-visible:ring-[#0874cf] focus-visible:ring-offset-2"
            >
              Buy now
            </button>
            <a
              href={whatsappLink(settings?.whatsapp_number, waText)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#dce4e8] bg-white px-6 text-sm font-semibold outline-none transition hover:border-[#0874cf] hover:text-[#0874cf] focus-visible:ring-2 focus-visible:ring-[#0874cf]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Ask about this on WhatsApp
            </a>
            {settings && settings.allow_checkout === false && settings.checkout_notice && (
              <p className="mt-3 rounded-lg bg-[#fdf8ea] px-4 py-3 text-sm text-[#7a5a0a]">{settings.checkout_notice}</p>
            )}

            {p.details.length > 0 && (
              <div className="mt-9">
                <h2 className={`${HEADING_FONT} text-lg font-semibold`}>Key features</h2>
                <ul className="mt-3 space-y-2.5">
                  {p.details.map((d) => (
                    <li key={d} className="flex gap-3 text-[15px] leading-6">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#22a67d]" aria-hidden="true" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8">
              <ProductDetailsAccordion items={accordion} defaultOpen={null} />
            </div>
          </div>
        </div>
      </section>

      {(specs.length > 0 || p.longDescription) && (
        <section className="border-t border-[#dce4e8]">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:px-8">
            {p.longDescription && (
              <div>
                <h2 className={`${HEADING_FONT} text-2xl font-semibold tracking-tight`}>About this product</h2>
                <p className="mt-4 text-[15px] leading-7 text-[#56656f]">{p.longDescription}</p>
              </div>
            )}
            {specs.length > 0 && (
              <div className={p.longDescription ? "" : "lg:col-span-2"}>
                <h2 className={`${HEADING_FONT} text-2xl font-semibold tracking-tight`}>Specifications</h2>
                <dl className="mt-4 overflow-hidden rounded-xl border border-[#dce4e8]">
                  {specs.map(([k, v], i) => (
                    <div key={k} className={`grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 px-4 py-3 text-sm ${i % 2 === 0 ? "bg-[#f3f7f8]" : "bg-white"}`}>
                      <dt className="text-[#56656f]">{k}</dt>
                      <dd className="font-medium tabular-nums">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="border-t border-[#dce4e8]" aria-label="Ordering information">
        <ul className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {infoCards.map(({ icon: Icon, title, copy }) => (
            <li key={title} className="rounded-xl border border-[#dce4e8] bg-white p-5">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#eaf4fc] text-[#0874cf]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className={`${HEADING_FONT} mt-4 text-base font-semibold`}>{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-[#56656f]">{copy}</p>
            </li>
          ))}
        </ul>
      </section>

      <RelatedProducts products={related} />
    </>,
  )
}
