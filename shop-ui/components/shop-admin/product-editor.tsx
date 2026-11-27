"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { AlertTriangle, ExternalLink, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import type { ShopAdminApi } from "./api"
import { errText, fieldErrorsOf, ksh, savePercent, slugify, type AdminCategory, type AdminProduct } from "./types"
import { Btn, ConfirmDialog, Field, ImageUploader, KeyValueEditor, StringListEditor, ToggleRow, Pill, cx, inputCls, type KV } from "./ui"

type Form = {
  name: string
  slug: string
  slugTouched: boolean
  brand: string
  category: string
  summary: string
  long_description: string
  price: string
  compare_at_price: string
  track_stock: boolean
  stock_quantity: string
  image: string
  hover_image: string
  details: string[]
  specs: KV[]
  materials: string[]
  care: string[]
  warranty: string
  made_in: string
  is_active: boolean
  is_featured: boolean
  is_trending: boolean
  sort_order: string
}

const SPEC_SUGGESTIONS = ["Processor", "Memory", "Storage", "Ports", "Wireless", "Antenna", "Power", "Dimensions", "Weight", "Operating temperature", "Range", "Speed"]

const blankForm = (category: string): Form => ({
  name: "", slug: "", slugTouched: false, brand: "", category, summary: "", long_description: "",
  price: "", compare_at_price: "", track_stock: true, stock_quantity: "0", image: "", hover_image: "",
  details: [], specs: [], materials: [], care: [], warranty: "", made_in: "",
  is_active: true, is_featured: false, is_trending: false, sort_order: "0",
})

function formFrom(p: AdminProduct, copy: boolean): Form {
  return {
    name: copy ? `${p.name} (copy)` : p.name,
    slug: copy ? "" : p.slug,
    slugTouched: !copy,
    brand: p.brand || "",
    category: String(p.category),
    summary: p.summary || "",
    long_description: p.long_description || "",
    price: p.price != null ? String(Number(p.price)) : "",
    compare_at_price: p.compare_at_price ? String(Number(p.compare_at_price)) : "",
    track_stock: p.track_stock,
    stock_quantity: String(p.stock_quantity ?? 0),
    image: p.image || "",
    hover_image: p.hover_image || "",
    details: [...(p.details || [])],
    specs: Object.entries(p.specs_sheet || {}).map(([key, value]) => ({ key, value: String(value) })),
    materials: [...(p.materials || [])],
    care: [...(p.care || [])],
    warranty: p.warranty || "",
    made_in: p.made_in || "",
    is_active: copy ? false : p.is_active,
    is_featured: copy ? false : p.is_featured,
    is_trending: copy ? false : p.is_trending,
    sort_order: String(p.sort_order ?? 0),
  }
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {description && <p className="mt-0.5 text-xs leading-5 text-slate-400">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

export function ProductCardPreview({ form }: { form: Form }) {
  const price = Number(form.price) || 0
  const compare = Number(form.compare_at_price) || 0
  const pct = savePercent(price, compare)
  const soldOut = form.track_stock && Number(form.stock_quantity) <= 0 && form.name.trim() !== ""
  const hover = form.hover_image || form.image
  return (
    <div className="group overflow-hidden rounded-2xl bg-white text-slate-900 shadow-xl shadow-black/30">
      <div className="relative aspect-[4/5] bg-slate-100">
        {form.image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.image} alt="" className="absolute inset-0 h-full w-full object-contain p-5 transition-opacity duration-300 group-hover:opacity-0" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hover} alt="" className="absolute inset-0 h-full w-full object-contain p-5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </>
        ) : (
          <div className="absolute inset-0 grid place-items-center text-center text-xs text-slate-400">
            <span>No photo yet</span>
          </div>
        )}
        {pct > 0 && <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white">Save {pct}%</span>}
        {soldOut && <span className="absolute right-3 top-3 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white">Sold out</span>}
      </div>
      <div className="space-y-1 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{form.brand || "Brand"}</p>
        <p className="line-clamp-2 text-sm font-semibold leading-5">{form.name || "Product name"}</p>
        {form.summary && <p className="line-clamp-2 text-xs leading-5 text-slate-500">{form.summary}</p>}
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-base font-bold">{price > 0 ? ksh(price) : "KSh 0"}</span>
          {pct > 0 && <span className="text-xs text-slate-400 line-through">{ksh(compare)}</span>}
        </div>
      </div>
    </div>
  )
}

export function ProductEditor({
  api,
  categories,
  brands,
  product,
  template,
  onSaved,
  onClose,
}: {
  api: ShopAdminApi
  categories: AdminCategory[]
  brands: string[]
  /** Product being edited, or null to create a new one. */
  product: AdminProduct | null
  /** When creating, start from this product (Duplicate). */
  template?: AdminProduct | null
  onSaved: (p: AdminProduct) => void
  onClose: () => void
}) {
  const firstCategory = String(categories.find((c) => c.is_active)?.id ?? categories[0]?.id ?? "")
  const initial = useMemo(
    () => (product ? formFrom(product, false) : template ? formFrom(template, true) : blankForm(firstCategory)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const [form, setForm] = useState<Form>(initial)
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial))
  const [editing, setEditing] = useState<string | null>(product?.slug ?? null)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [banner, setBanner] = useState("")
  const [saving, setSaving] = useState<"" | "close" | "another">("")
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [editSlug, setEditSlug] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  const dirty = JSON.stringify(form) !== baseline
  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key as string]) setErrors((e) => { const { [key as string]: _drop, ...rest } = e; return rest })
  }

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = "" }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const requestClose = () => (dirty && !saving ? setConfirmDiscard(true) : onClose())

  const price = Number(form.price)
  const compare = Number(form.compare_at_price)
  const pct = savePercent(price, compare)
  const slug = form.slugTouched || editing ? form.slug : slugify(form.name)

  function validate(): Record<string, string[]> {
    const e: Record<string, string[]> = {}
    if (!form.name.trim()) e.name = ["Enter the product name."]
    if (!form.category) e.category = [categories.length ? "Choose a category." : "Create a category first, then come back."]
    if (!form.price.trim() || !Number.isFinite(price) || price <= 0) e.price = ["Enter a price above zero."]
    if (form.compare_at_price.trim() && (!Number.isFinite(compare) || compare <= price)) e.compare_at_price = ["The old price must be higher than the selling price, or leave it blank."]
    if (form.track_stock) {
      const q = Number(form.stock_quantity)
      if (!Number.isInteger(q) || q < 0) e.stock_quantity = ["Enter a whole number, zero or more."]
    }
    const so = Number(form.sort_order)
    if (!Number.isInteger(so) || so < 0) e.sort_order = ["Enter a whole number, zero or more."]
    if (form.summary.length > 200) e.summary = ["Keep the summary to 200 characters."]
    if (!editing && form.slugTouched && slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) e.slug = ["Use lowercase letters, numbers and hyphens only."]
    const keys = form.specs.map((s) => s.key.trim().toLowerCase()).filter(Boolean)
    if (new Set(keys).size !== keys.length) e.specs_sheet = ["Each specification name can only be used once."]
    return e
  }

  function buildPayload(): Record<string, unknown> {
    const clean = (list: string[]) => list.map((l) => l.trim()).filter(Boolean)
    const specs: Record<string, string> = {}
    form.specs.forEach((s) => { if (s.key.trim() && s.value.trim()) specs[s.key.trim()] = s.value.trim() })
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      category: Number(form.category),
      price: price.toFixed(2),
      compare_at_price: form.compare_at_price.trim() ? compare.toFixed(2) : null,
      currency: "KES",
      summary: form.summary.trim(),
      long_description: form.long_description.trim(),
      image: form.image.trim(),
      hover_image: form.hover_image.trim(),
      details: clean(form.details),
      materials: clean(form.materials),
      care: clean(form.care),
      specs_sheet: specs,
      warranty: form.warranty.trim(),
      made_in: form.made_in.trim(),
      track_stock: form.track_stock,
      stock_quantity: form.track_stock ? Number(form.stock_quantity) : Number(form.stock_quantity) || 0,
      is_active: form.is_active,
      is_featured: form.is_featured,
      is_trending: form.is_trending,
      sort_order: Number(form.sort_order),
    }
    if (!editing) {
      // Only send a slug the admin typed; otherwise the server generates a unique one.
      if (form.slugTouched && slug) payload.slug = slug
      if (template) {
        if (template.sizes) payload.sizes = template.sizes
        if (template.colors) payload.colors = template.colors
      }
    }
    return payload
  }

  function showFirstError() {
    setTimeout(() => {
      const el = bodyRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
      el?.scrollIntoView({ block: "center", behavior: "smooth" })
      el?.focus({ preventScroll: true })
    }, 50)
  }

  async function submit(mode: "close" | "another") {
    const problems = validate()
    setBanner("")
    if (Object.keys(problems).length) {
      setErrors(problems)
      setBanner("Some details need fixing before this product can be saved.")
      showFirstError()
      return
    }
    setErrors({})
    setSaving(mode)
    try {
      const payload = buildPayload()
      const saved = editing ? await api.updateProduct(editing, payload) : await api.createProduct(payload)
      onSaved(saved)
      toast.success(editing ? "Product changes saved" : `${saved.name} added to the shop`)
      if (mode === "another" && !editing) {
        const next = { ...blankForm(form.category), brand: form.brand }
        setForm(next)
        setBaseline(JSON.stringify(next))
        setEditSlug(false)
        bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        onClose()
      }
    } catch (e) {
      const fields = fieldErrorsOf(e)
      setErrors(fields)
      setBanner(Object.keys(fields).length ? "The server could not accept some fields. Check the notes below." : errText(e))
      if (!Object.keys(fields).length) toast.error(errText(e))
      else showFirstError()
    } finally {
      setSaving("")
    }
  }

  const err = (k: string) => errors[k]
  const nErrors = Object.keys(errors).length

  return (
    <>
      <Sheet open onOpenChange={(o) => !o && requestClose()}>
        <SheetContent
          side="right"
          className="w-full gap-0 overflow-hidden border-slate-800 bg-slate-950 p-0 text-slate-100 sm:max-w-5xl [&>button]:right-5 [&>button]:top-5 [&>button]:text-slate-300"
        >
          <header className="border-b border-slate-800 bg-slate-900/80 px-5 py-4 pr-14">
            <SheetTitle className="text-base font-semibold text-white">
              {editing ? "Edit product" : template ? "Duplicate product" : "Add a product"}
            </SheetTitle>
            <SheetDescription className="mt-0.5 text-xs text-slate-400">
              {editing ? "Changes go live on the shop as soon as you save." : "Fill in the essentials first. You can add more detail any time."}
            </SheetDescription>
          </header>

          <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <form
              id="product-form"
              noValidate
              onSubmit={(e) => { e.preventDefault(); void submit("close") }}
              className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_300px]"
            >
              <div className="min-w-0 space-y-5">
                {banner && (
                  <div role="alert" className="flex gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p>{banner}</p>
                      {nErrors > 0 && <p className="mt-0.5 text-xs text-red-300/80">{nErrors} {nErrors === 1 ? "field needs" : "fields need"} attention.</p>}
                    </div>
                  </div>
                )}

                <Section title="Basics" description="What customers see first in the shop and in search results.">
                  <Field label="Product name" required error={err("name")}>
                    <input
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      maxLength={255}
                      placeholder="MikroTik hAP ax3 Wi-Fi 6 router"
                      className={inputCls}
                    />
                  </Field>
                  {!editing ? (
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span>Web address:</span>
                        <code className="rounded bg-slate-900 px-1.5 py-0.5 text-slate-300">/shop/product/{slug || "…"}</code>
                        <button type="button" onClick={() => setEditSlug((s) => !s)} className="inline-flex items-center gap-1 rounded text-violet-300 hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60">
                          <Pencil className="h-3 w-3" /> {editSlug ? "Done" : "Edit"}
                        </button>
                      </div>
                      {editSlug && (
                        <Field label="URL slug" error={err("slug")} hint="Lowercase letters, numbers and hyphens. Leave blank to generate one from the name." className="mt-2">
                          <input value={form.slug || slug} onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value), slugTouched: true }))} className={inputCls} />
                        </Field>
                      )}
                      {err("slug") && !editSlug && <p role="alert" className="mt-1 text-[11px] text-red-400">{err("slug")}</p>}
                    </div>
                  ) : (
                    <p className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      Web address: <code className="rounded bg-slate-900 px-1.5 py-0.5 text-slate-300">/shop/product/{editing}</code>
                      <span className="text-slate-600">(fixed so existing links keep working)</span>
                    </p>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Brand" error={err("brand")}>
                      <input value={form.brand} onChange={(e) => set("brand", e.target.value)} list="shop-brands" maxLength={120} placeholder="MikroTik" className={inputCls} />
                    </Field>
                    <datalist id="shop-brands">{brands.map((b) => <option key={b} value={b} />)}</datalist>
                    <Field label="Category" required error={err("category")}>
                      <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
                        <option value="">Choose a category</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}{c.is_active ? "" : " (hidden)"}</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field
                    label="Short summary"
                    error={err("summary")}
                    hint="One line shown on product cards and in search results."
                    action={<span className={cx("text-[11px] tabular-nums", form.summary.length > 200 ? "text-red-400" : form.summary.length > 180 ? "text-amber-300" : "text-slate-500")}>{form.summary.length}/200</span>}
                  >
                    <input value={form.summary} onChange={(e) => set("summary", e.target.value)} placeholder="Dual-band Wi-Fi 6 router for homes and small offices" className={inputCls} />
                  </Field>
                  <Field label="Description" error={err("long_description")} hint="Explain what it does and who it is for. Plain text.">
                    <textarea value={form.long_description} onChange={(e) => set("long_description", e.target.value)} rows={5} className={cx(inputCls, "resize-y")} />
                  </Field>
                </Section>

                <Section title="Pricing" description="All prices are in Kenyan shillings (KES).">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Selling price (KSh)" required error={err("price")}>
                      <input type="number" inputMode="decimal" min={0} step="1" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="26000" className={inputCls} />
                    </Field>
                    <Field label="Old price (KSh)" error={err("compare_at_price")} hint="Optional. Shown crossed out to highlight a saving.">
                      <input type="number" inputMode="decimal" min={0} step="1" value={form.compare_at_price} onChange={(e) => set("compare_at_price", e.target.value)} placeholder="32000" className={inputCls} />
                    </Field>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    {pct > 0 ? (
                      <>
                        <Pill tone="green">Save {pct}%</Pill>
                        <span>Customers see {ksh(price)} with {ksh(compare)} crossed out.</span>
                      </>
                    ) : (
                      <span>Customers see {price > 0 ? ksh(price) : "the selling price"}.</span>
                    )}
                    <Pill tone="slate" className="ml-auto">Currency: KES</Pill>
                  </div>
                </Section>

                <Section title="Inventory">
                  <ToggleRow title="Track stock" description="Turn on to count units. Orders reduce the quantity and the shop shows Sold out at zero." checked={form.track_stock} onChange={(v) => set("track_stock", v)} />
                  {form.track_stock ? (
                    <Field label="Quantity in stock" error={err("stock_quantity")} className="max-w-xs">
                      <input type="number" inputMode="numeric" min={0} step="1" value={form.stock_quantity} onChange={(e) => set("stock_quantity", e.target.value)} className={inputCls} />
                    </Field>
                  ) : (
                    <p className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs text-slate-400">Shown as available to order. Customers can always add it to their cart.</p>
                  )}
                </Section>

                <Section title="Photos" description="A clear photo on a plain background sells best. Square images work well.">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <ImageUploader api={api} label="Main photo" value={form.image} onChange={(v) => set("image", v)} error={err("image")} hint="Shown on cards and the product page." />
                    <ImageUploader api={api} label="Hover photo" value={form.hover_image} onChange={(v) => set("hover_image", v)} error={err("hover_image")} hint="Optional. Shown when someone hovers over the card." />
                  </div>
                </Section>

                <Section title="Key features" description="Short bullet points, for example &quot;Wi-Fi 6 with 4 spatial streams&quot;. Press Enter to add the next one.">
                  <StringListEditor value={form.details} onChange={(v) => set("details", v)} placeholder="Add a feature" addLabel="Add feature" itemName="Feature" />
                  {err("details") && <p role="alert" className="text-[11px] text-red-400">{err("details")}</p>}
                </Section>

                <Section title="Specifications" description="Name and value pairs shown in the specification table, for example Ports: 5 x Gigabit.">
                  <KeyValueEditor value={form.specs} onChange={(v) => set("specs", v)} keyPlaceholder="Name, e.g. Ports" valuePlaceholder="Value, e.g. 5 x Gigabit Ethernet" addLabel="Add specification" suggestions={SPEC_SUGGESTIONS} />
                  {err("specs_sheet") && <p role="alert" className="text-[11px] text-red-400">{err("specs_sheet")}</p>}
                </Section>

                <Section title="In the box" description="What the customer receives with their order.">
                  <StringListEditor value={form.materials} onChange={(v) => set("materials", v)} placeholder="Add an item" addLabel="Add item" itemName="Box item" />
                </Section>

                <Section title="Support, warranty and origin">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Warranty" error={err("warranty")} hint="For example, 1-year warranty.">
                      <input value={form.warranty} onChange={(e) => set("warranty", e.target.value)} maxLength={120} className={inputCls} />
                    </Field>
                    <Field label="Made in" error={err("made_in")} hint="Optional.">
                      <input value={form.made_in} onChange={(e) => set("made_in", e.target.value)} maxLength={120} className={inputCls} />
                    </Field>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-slate-300">Support and warranty notes</p>
                    <StringListEditor value={form.care} onChange={(v) => set("care", v)} placeholder="For example, Free setup help by phone" addLabel="Add note" itemName="Support note" />
                  </div>
                </Section>

                <Section title="Visibility" description="Control where this product appears on the shop.">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ToggleRow title="Live on the shop" description="Turn off to hide it without deleting." checked={form.is_active} onChange={(v) => set("is_active", v)} />
                    <ToggleRow title="Featured" description="Highlighted on the shop home page." checked={form.is_featured} onChange={(v) => set("is_featured", v)} />
                    <ToggleRow title="Trending" description="Adds a Trending label and lists it in Trending." checked={form.is_trending} onChange={(v) => set("is_trending", v)} />
                  </div>
                  <Field label="Display order" error={err("sort_order")} hint="Lower numbers appear first. Products with the same number are sorted by name." className="max-w-xs">
                    <input type="number" inputMode="numeric" min={0} step="1" value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} className={inputCls} />
                  </Field>
                </Section>
              </div>

              <aside className="order-first lg:order-none">
                <div className="space-y-3 lg:sticky lg:top-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Live preview</p>
                  <div className="mx-auto max-w-[260px] lg:max-w-none">
                    <ProductCardPreview form={form} />
                  </div>
                  {!form.is_active && <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">Hidden from customers while Live is off.</p>}
                  <p className="text-[11px] leading-4 text-slate-500">An approximate view of the product card. Hover to see the second photo.</p>
                  {editing && (
                    <a href={`/shop/product/${editing}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-violet-300 hover:text-violet-200">
                      View on the shop <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </aside>
            </form>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 bg-slate-900/90 px-4 py-3 sm:px-5">
            <span className="text-xs text-slate-500">{dirty ? "Unsaved changes" : "No changes yet"}</span>
            <div className="flex flex-wrap justify-end gap-2">
              <Btn variant="ghost" onClick={requestClose} disabled={!!saving}>Cancel</Btn>
              {!editing && (
                <Btn variant="secondary" onClick={() => void submit("another")} loading={saving === "another"} disabled={!!saving}>
                  Save and add another
                </Btn>
              )}
              <Btn variant="primary" onClick={() => void submit("close")} loading={saving === "close"} disabled={!!saving}>
                {editing ? "Save changes" : "Save product"}
              </Btn>
            </div>
          </footer>
        </SheetContent>
      </Sheet>
      <ConfirmDialog
        open={confirmDiscard}
        title="Discard your changes?"
        description="You have unsaved changes. If you close now, they will be lost."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        destructive
        onConfirm={onClose}
        onCancel={() => setConfirmDiscard(false)}
      />
    </>
  )
}
