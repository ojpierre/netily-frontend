"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Check, MessageCircle, Search, SlidersHorizontal, X } from "lucide-react"
import type { Product } from "@/shop-ui/lib/products"
import { useShopCatalog } from "@/shop-ui/lib/use-shop-catalog"
import { featuredCategories } from "@/shop-ui/lib/featured-catalog"
import { formatShopMoney } from "@/shop-ui/lib/currency"
import { HEADING_FONT, isOnSale, productInCategory, resolveCategory, whatsappLink } from "@/shop-ui/lib/shop-helpers"
import { useShopSettings } from "@/shop-ui/lib/use-shop-settings"
import { ProductCard, ProductCardSkeleton } from "./product-card"

type Sort = "featured" | "price-asc" | "price-desc" | "name"
const SORTS: { value: Sort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name: A to Z" },
]
const PAGE_SIZE = 24

interface Filters {
  cat: string | null // resolved slug
  brand: string | null
  q: string
  sale: boolean
  min: number | null
  max: number | null
  sort: Sort
}

const num = (v: string | null) => {
  if (v === null || v.trim() === "") return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : null
}

export function ShopCatalogExperience() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { products, categories, loading } = useShopCatalog()
  const settings = useShopSettings()
  const cats = categories.length ? categories : featuredCategories

  const resolvedCat = useMemo(() => resolveCategory(searchParams.get("cat"), cats), [searchParams, cats])
  const brandParam = searchParams.get("brand")
  const filters: Filters = useMemo(() => {
    const sortParam = searchParams.get("sort") as Sort | null
    return {
      cat: resolvedCat?.slug ?? null,
      brand: brandParam,
      q: searchParams.get("q") || "",
      sale: searchParams.get("sale") === "1" || searchParams.get("onSale") === "true",
      min: num(searchParams.get("min")),
      max: num(searchParams.get("max")),
      sort: SORTS.some((s) => s.value === sortParam) ? (sortParam as Sort) : "featured",
    }
  }, [searchParams, resolvedCat, brandParam])

  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString())
      next.delete("onSale")
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") next.delete(k)
        else next.set(k, v)
      }
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  // Local text state for the debounced inputs.
  const [qInput, setQInput] = useState(filters.q)
  const [minInput, setMinInput] = useState(filters.min?.toString() ?? "")
  const [maxInput, setMaxInput] = useState(filters.max?.toString() ?? "")
  useEffect(() => setQInput(filters.q), [filters.q])
  useEffect(() => setMinInput(filters.min?.toString() ?? ""), [filters.min])
  useEffect(() => setMaxInput(filters.max?.toString() ?? ""), [filters.max])

  const paramsRef = useRef(setParams)
  paramsRef.current = setParams
  useEffect(() => {
    if (qInput.trim() === filters.q.trim()) return
    const t = setTimeout(() => paramsRef.current({ q: qInput.trim() || null }), 300)
    return () => clearTimeout(t)
  }, [qInput, filters.q])
  useEffect(() => {
    const a = num(minInput)
    const b = num(maxInput)
    if (a === filters.min && b === filters.max) return
    const t = setTimeout(() => paramsRef.current({ min: a === null ? null : String(a), max: b === null ? null : String(b) }), 500)
    return () => clearTimeout(t)
  }, [minInput, maxInput, filters.min, filters.max])

  const [visible, setVisible] = useState(PAGE_SIZE)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const filterKey = JSON.stringify(filters)
  useEffect(() => setVisible(PAGE_SIZE), [filterKey])

  const match = useCallback(
    (p: Product, skip?: "cat" | "brand") => {
      if (skip !== "cat" && filters.cat) {
        const c = cats.find((x) => x.slug === filters.cat)
        if (c && !productInCategory(p, c)) return false
      }
      if (skip !== "brand" && filters.brand && (p.brand || "").toLowerCase() !== filters.brand.toLowerCase()) return false
      if (filters.sale && !isOnSale(p)) return false
      if (filters.min !== null && p.price < filters.min) return false
      if (filters.max !== null && p.price > filters.max) return false
      const q = filters.q.trim().toLowerCase()
      if (q) {
        const hay = `${p.name} ${p.brand || ""} ${p.category} ${p.summary || ""} ${p.description} ${Object.values(p.specsSheet || {}).join(" ")}`.toLowerCase()
        if (!q.split(/\s+/).every((t) => hay.includes(t))) return false
      }
      return true
    },
    [filters, cats],
  )

  const results = useMemo(() => {
    const list = products.filter((p) => match(p))
    const idx = new Map(products.map((p, i) => [p.id, i]))
    const by: Record<Sort, (a: Product, b: Product) => number> = {
      featured: (a, b) =>
        Number(!!b.isFeatured) - Number(!!a.isFeatured) || Number(!!b.isTrending) - Number(!!a.isTrending) || (idx.get(a.id)! - idx.get(b.id)!),
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      name: (a, b) => a.name.localeCompare(b.name),
    }
    return list.sort(by[filters.sort])
  }, [products, match, filters.sort])

  const catCounts = useMemo(() => {
    const m: Record<string, number> = {}
    const base = products.filter((p) => match(p, "cat"))
    for (const c of cats) m[c.slug] = base.filter((p) => productInCategory(p, c)).length
    return { m, total: base.length }
  }, [products, match, cats])

  const brandCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of products.filter((x) => match(x, "brand"))) if (p.brand) m.set(p.brand, (m.get(p.brand) || 0) + 1)
    // Always list every brand so a zero-count brand is still reachable.
    for (const p of products) if (p.brand && !m.has(p.brand)) m.set(p.brand, 0)
    return Array.from(m, ([brand, count]) => ({ brand, count })).sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand))
  }, [products, match])

  const priceBounds = useMemo(() => {
    const prices = products.map((p) => p.price)
    return prices.length ? { lo: Math.min(...prices), hi: Math.max(...prices) } : null
  }, [products])

  const activeCat = filters.cat ? cats.find((c) => c.slug === filters.cat) : null
  const chips: { key: string; label: string; clear: Record<string, string | null> }[] = []
  if (activeCat) chips.push({ key: "cat", label: activeCat.name, clear: { cat: null } })
  if (filters.brand) chips.push({ key: "brand", label: filters.brand, clear: { brand: null } })
  if (filters.q.trim()) chips.push({ key: "q", label: `"${filters.q.trim()}"`, clear: { q: null } })
  if (filters.sale) chips.push({ key: "sale", label: "On sale", clear: { sale: null } })
  if (filters.min !== null || filters.max !== null) {
    const lo = filters.min !== null ? formatShopMoney(filters.min) : "Any"
    const hi = filters.max !== null ? formatShopMoney(filters.max) : "any"
    chips.push({ key: "price", label: `${lo} to ${hi}`, clear: { min: null, max: null } })
  }
  const clearAll = () => setParams({ cat: null, brand: null, q: null, sale: null, min: null, max: null })

  const title = activeCat
    ? activeCat.name
    : filters.sale
      ? "Deals"
      : filters.brand
        ? filters.brand
        : filters.q.trim()
          ? `Results for "${filters.q.trim()}"`
          : "All network equipment"
  const intro = activeCat?.description || (filters.sale ? "Items priced below their usual price. The saving shows on each product." : "Routers, Wi-Fi, fibre, power and tools for Kenyan networks. Filter by what you need, or ask us to check your list.")

  const filterPanel = (
    <FilterPanel
      cats={cats}
      catCounts={catCounts}
      activeCat={filters.cat}
      brandCounts={brandCounts}
      activeBrand={filters.brand}
      sale={filters.sale}
      minInput={minInput}
      maxInput={maxInput}
      setMinInput={setMinInput}
      setMaxInput={setMaxInput}
      priceBounds={priceBounds}
      onCat={(slug) => setParams({ cat: slug })}
      onBrand={(b) => setParams({ brand: b })}
      onSale={(v) => setParams({ sale: v ? "1" : null })}
    />
  )

  const shown = results.slice(0, visible)

  return (
    <div className="bg-white pt-[96px] text-[#17252d] lg:pt-[104px]">
      <section className="border-b border-[#dce4e8] bg-[#f3f7f8]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-xs text-[#56656f]">
            <ol className="flex items-center gap-1.5">
              <li><Link href="/shop" className="hover:text-[#0874cf]">Shop</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/shop/catalog" className={activeCat ? "hover:text-[#0874cf]" : "font-medium text-[#17252d]"}>All products</Link></li>
              {activeCat && (
                <>
                  <li aria-hidden="true">/</li>
                  <li className="font-medium text-[#17252d]" aria-current="page">{activeCat.name}</li>
                </>
              )}
            </ol>
          </nav>
          <h1 className={`${HEADING_FONT} mt-3 text-3xl font-semibold tracking-tight sm:text-4xl`}>{title}</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-7 text-[#56656f]">{intro}</p>

          <ul className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" aria-label="Quick category filter">
            <li className="shrink-0">
              <CategoryPill active={!filters.cat} onClick={() => setParams({ cat: null })} label="All" />
            </li>
            {cats.map((c) => (
              <li key={c.slug} className="shrink-0">
                <CategoryPill active={filters.cat === c.slug} onClick={() => setParams({ cat: c.slug })} label={c.name} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[260px_1fr] lg:gap-10 lg:px-8">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-[120px] max-h-[calc(100vh-140px)] overflow-y-auto pr-2">{filterPanel}</div>
        </aside>

        <div className="min-w-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 flex-1 basis-56">
              <label htmlFor="catalog-search" className="sr-only">Search the catalogue</label>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#56656f]" aria-hidden="true" />
              <input
                id="catalog-search"
                type="search"
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="Search by name, brand or spec"
                className="h-11 w-full rounded-lg border border-[#dce4e8] bg-white pl-9 pr-3 text-base text-[#17252d] outline-none transition placeholder:text-[#7a8a94] focus:border-[#0874cf] focus:ring-2 focus:ring-[#0874cf]/20 sm:text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#dce4e8] bg-white px-4 text-sm font-semibold outline-none hover:border-[#0874cf] focus-visible:ring-2 focus-visible:ring-[#0874cf] lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Filters{chips.length > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#0874cf] px-1 text-[11px] text-white">{chips.length}</span>}
            </button>
            <div>
              <label htmlFor="catalog-sort" className="sr-only">Sort by</label>
              <select
                id="catalog-sort"
                value={filters.sort}
                onChange={(e) => setParams({ sort: e.target.value === "featured" ? null : e.target.value })}
                className="h-11 rounded-lg border border-[#dce4e8] bg-white px-3 text-sm font-medium outline-none focus:border-[#0874cf] focus:ring-2 focus:ring-[#0874cf]/20"
              >
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <p className="mr-1 text-sm text-[#56656f]" role="status" aria-live="polite">
              {loading ? "Loading products..." : <><strong className="tabular-nums text-[#17252d]">{results.length}</strong> {results.length === 1 ? "product" : "products"}</>}
            </p>
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setParams(c.clear)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#0874cf]/30 bg-[#eaf4fc] py-1 pl-3 pr-2 text-xs font-semibold text-[#075faa] outline-none hover:bg-[#d9ebf9] focus-visible:ring-2 focus-visible:ring-[#0874cf]"
                aria-label={`Remove filter ${c.label}`}
              >
                {c.label}
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ))}
            {chips.length > 1 && (
              <button type="button" onClick={clearAll} className="rounded-md px-2 py-1 text-xs font-semibold text-[#56656f] underline-offset-4 hover:text-[#17252d] hover:underline">
                Clear all
              </button>
            )}
          </div>

          {/* Results */}
          <div className="mt-5">
            {loading ? (
              <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <li key={i}><ProductCardSkeleton /></li>
                ))}
              </ul>
            ) : results.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#c5d1d7] bg-[#f3f7f8] px-6 py-14 text-center">
                <h2 className={`${HEADING_FONT} text-xl font-semibold`}>Nothing matches those filters</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#56656f]">
                  Try removing a filter, or tell us what you are trying to build. We can often point you to the right part, or source it.
                </p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <button type="button" onClick={clearAll} className="inline-flex h-11 items-center rounded-lg border border-[#dce4e8] bg-white px-5 text-sm font-semibold hover:border-[#0874cf]">
                    Clear all filters
                  </button>
                  <a
                    href={whatsappLink(settings?.whatsapp_number, `Hi Internetily, I am looking for ${filters.q.trim() || activeCat?.name || "network equipment"}. Can you help?`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0874cf] px-5 text-sm font-semibold text-white hover:bg-[#075faa]"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    Ask us on WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              <>
                <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-3">
                  {shown.map((p, i) => (
                    <li key={p.id} className="min-w-0">
                      <ProductCard product={p} priority={i < 3} />
                    </li>
                  ))}
                </ul>
                {results.length > shown.length && (
                  <div className="mt-8 text-center">
                    <button
                      type="button"
                      onClick={() => setVisible((v) => v + PAGE_SIZE)}
                      className="inline-flex h-11 items-center rounded-lg border border-[#dce4e8] bg-white px-6 text-sm font-semibold outline-none hover:border-[#0874cf] hover:text-[#0874cf] focus-visible:ring-2 focus-visible:ring-[#0874cf]"
                    >
                      Show more ({results.length - shown.length} left)
                    </button>
                  </div>
                )}
                <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-xl border border-[#dce4e8] bg-[#f3f7f8] p-5 sm:flex-row sm:items-center">
                  <p className="text-sm leading-6 text-[#56656f]">
                    <strong className="text-[#17252d]">Cannot see what you need?</strong> We can quote parts that are not listed.
                  </p>
                  <a
                    href={whatsappLink(settings?.whatsapp_number, "Hi Internetily, I am looking for equipment that is not on the shop. Can you quote it?")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#0874cf] px-4 text-sm font-semibold text-white hover:bg-[#075faa]"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    Ask on WhatsApp
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {drawerOpen && (
        <FilterDrawer onClose={() => setDrawerOpen(false)} count={results.length} onClear={clearAll} canClear={chips.length > 0}>
          {filterPanel}
        </FilterDrawer>
      )}
    </div>
  )
}

function CategoryPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-[#0874cf] ${
        active ? "border-[#0874cf] bg-[#0874cf] text-white" : "border-[#dce4e8] bg-white text-[#17252d] hover:border-[#0874cf] hover:text-[#0874cf]"
      }`}
    >
      {label}
    </button>
  )
}

function FilterDrawer({
  children,
  onClose,
  count,
  onClear,
  canClear,
}: {
  children: React.ReactNode
  onClose: () => void
  count: number
  onClear: () => void
  canClear: boolean
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Filter products">
      <div className="absolute inset-0 bg-[#17252d]/50" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#dce4e8] px-5 py-4">
          <h2 className={`${HEADING_FONT} text-lg font-semibold`}>Filters</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close filters" className="-mr-2 grid h-10 w-10 place-items-center rounded-lg hover:bg-[#f3f7f8] focus-visible:ring-2 focus-visible:ring-[#0874cf]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        <div className="flex gap-3 border-t border-[#dce4e8] px-5 py-4">
          {canClear && (
            <button type="button" onClick={onClear} className="h-12 rounded-lg border border-[#dce4e8] px-5 text-sm font-semibold">
              Clear all
            </button>
          )}
          <button type="button" onClick={onClose} className="h-12 flex-1 rounded-lg bg-[#0874cf] text-sm font-semibold text-white hover:bg-[#075faa]">
            Show {count} {count === 1 ? "product" : "products"}
          </button>
        </div>
      </div>
    </div>
  )
}

function FilterPanel(props: {
  cats: { name: string; slug: string }[]
  catCounts: { m: Record<string, number>; total: number }
  activeCat: string | null
  brandCounts: { brand: string; count: number }[]
  activeBrand: string | null
  sale: boolean
  minInput: string
  maxInput: string
  setMinInput: (v: string) => void
  setMaxInput: (v: string) => void
  priceBounds: { lo: number; hi: number } | null
  onCat: (slug: string | null) => void
  onBrand: (b: string | null) => void
  onSale: (v: boolean) => void
}) {
  const head = "text-[11px] font-semibold uppercase tracking-[0.12em] text-[#56656f]"
  const row = (active: boolean) =>
    `flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[#0874cf] ${
      active ? "bg-[#eaf4fc] font-semibold text-[#075faa]" : "text-[#17252d] hover:bg-[#f3f7f8]"
    }`
  const [showAllBrands, setShowAllBrands] = useState(false)
  const brands = showAllBrands ? props.brandCounts : props.brandCounts.slice(0, 8)
  return (
    <div className="space-y-7">
      <fieldset>
        <legend className={head}>Category</legend>
        <div className="mt-2 space-y-0.5">
          <button type="button" onClick={() => props.onCat(null)} aria-pressed={!props.activeCat} className={row(!props.activeCat)}>
            <span>All categories</span>
            <span className="text-xs tabular-nums text-[#56656f]">{props.catCounts.total}</span>
          </button>
          {props.cats.map((c) => (
            <button key={c.slug} type="button" onClick={() => props.onCat(c.slug)} aria-pressed={props.activeCat === c.slug} className={row(props.activeCat === c.slug)}>
              <span>{c.name}</span>
              <span className="text-xs tabular-nums text-[#56656f]">{props.catCounts.m[c.slug] ?? 0}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={head}>Brand</legend>
        <div className="mt-2 space-y-0.5">
          {brands.map((b) => (
            <button
              key={b.brand}
              type="button"
              onClick={() => props.onBrand(props.activeBrand?.toLowerCase() === b.brand.toLowerCase() ? null : b.brand)}
              aria-pressed={props.activeBrand?.toLowerCase() === b.brand.toLowerCase()}
              className={row(props.activeBrand?.toLowerCase() === b.brand.toLowerCase())}
            >
              <span className="flex items-center gap-2">
                {props.activeBrand?.toLowerCase() === b.brand.toLowerCase() && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                {b.brand}
              </span>
              <span className="text-xs tabular-nums text-[#56656f]">{b.count}</span>
            </button>
          ))}
        </div>
        {props.brandCounts.length > 8 && (
          <button type="button" onClick={() => setShowAllBrands((v) => !v)} className="mt-1 px-3 py-1.5 text-sm font-semibold text-[#0874cf] hover:text-[#075faa]">
            {showAllBrands ? "Show fewer brands" : `Show all ${props.brandCounts.length} brands`}
          </button>
        )}
      </fieldset>

      <fieldset>
        <legend className={head}>Price (KSh)</legend>
        <div className="mt-2 flex items-center gap-2">
          <label className="sr-only" htmlFor="price-min">Minimum price</label>
          <input
            id="price-min"
            inputMode="numeric"
            type="number"
            min={0}
            value={props.minInput}
            onChange={(e) => props.setMinInput(e.target.value)}
            placeholder={props.priceBounds ? String(props.priceBounds.lo) : "Min"}
            className="h-10 w-full min-w-0 rounded-lg border border-[#dce4e8] px-3 text-base tabular-nums outline-none focus:border-[#0874cf] focus:ring-2 focus:ring-[#0874cf]/20 sm:text-sm"
          />
          <span className="text-[#56656f]" aria-hidden="true">to</span>
          <label className="sr-only" htmlFor="price-max">Maximum price</label>
          <input
            id="price-max"
            inputMode="numeric"
            type="number"
            min={0}
            value={props.maxInput}
            onChange={(e) => props.setMaxInput(e.target.value)}
            placeholder={props.priceBounds ? String(props.priceBounds.hi) : "Max"}
            className="h-10 w-full min-w-0 rounded-lg border border-[#dce4e8] px-3 text-base tabular-nums outline-none focus:border-[#0874cf] focus:ring-2 focus:ring-[#0874cf]/20 sm:text-sm"
          />
        </div>
      </fieldset>

      <div>
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#dce4e8] px-3 py-3 text-sm font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#0874cf]">
          <span>On sale only</span>
          <input type="checkbox" checked={props.sale} onChange={(e) => props.onSale(e.target.checked)} className="h-4 w-4 accent-[#0874cf]" />
        </label>
      </div>
    </div>
  )
}
