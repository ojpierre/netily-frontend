"use client"

import { useState, type ReactNode } from "react"
import { AlertTriangle, CheckCircle2, ExternalLink, Save } from "lucide-react"
import { toast } from "sonner"
import type { ShopSettings } from "@/lib/superadmin-api"
import type { ShopAdminApi } from "./api"
import { errText, fieldErrorsOf } from "./types"
import { Btn, Field, ImageUploader, PageHeader, Skeleton, ToggleRow, card, cx, inputCls } from "./ui"

function Block({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className={cx(card, "p-4 sm:p-5")}>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {description && <p className="mt-0.5 text-xs leading-5 text-slate-400">{description}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

export function StorefrontSettingsTab({ api, settings, onSaved, loading }: { api: ShopAdminApi; settings: ShopSettings | null; onSaved: (s: ShopSettings) => void; loading: boolean }) {
  if (loading || !settings) return <div className="space-y-4"><Skeleton className="h-16" /><Skeleton className="h-72" /><Skeleton className="h-60" /></div>
  return <SettingsForm api={api} settings={settings} onSaved={onSaved} />
}

function SettingsForm({ api, settings, onSaved }: { api: ShopAdminApi; settings: ShopSettings; onSaved: (s: ShopSettings) => void }) {
  const [form, setForm] = useState<ShopSettings>(settings)
  const [baseline, setBaseline] = useState(JSON.stringify(settings))
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [banner, setBanner] = useState("")
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const dirty = JSON.stringify(form) !== baseline

  const set = <K extends keyof ShopSettings>(k: K, v: ShopSettings[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    setSavedAt(null)
    setErrors((e) => { const { [k as string]: _x, ...rest } = e; return rest })
  }
  const text = (k: keyof ShopSettings, props: { max?: number; placeholder?: string; type?: string } = {}) => (
    <input type={props.type ?? "text"} value={String(form[k] ?? "")} maxLength={props.max} placeholder={props.placeholder} onChange={(e) => set(k, e.target.value as never)} className={inputCls} />
  )

  async function save() {
    const problems: Record<string, string[]> = {}
    const fee = Number(form.default_shipping_fee || 0)
    if (!Number.isFinite(fee) || fee < 0) problems.default_shipping_fee = ["Enter an amount of zero or more."]
    const freeFrom = form.free_shipping_threshold
    if (freeFrom !== "" && freeFrom != null && (!Number.isFinite(Number(freeFrom)) || Number(freeFrom) < 0)) problems.free_shipping_threshold = ["Enter an amount of zero or more, or leave blank."]
    for (const k of ["hero_primary_href", "hero_secondary_href"] as const) {
      const v = String(form[k] || "").trim()
      if (v && !/^(\/|https?:\/\/)/.test(v)) problems[k] = ["Use a path starting with / or a full http(s) link."]
    }
    setBanner("")
    if (Object.keys(problems).length) { setErrors(problems); setBanner("Please fix the highlighted fields."); return }
    setSaving(true)
    try {
      const { updated_at: _ignored, ...rest } = form
      const updated = await api.updateSettings({
        ...rest,
        default_shipping_fee: fee,
        free_shipping_threshold: freeFrom === "" || freeFrom == null ? null : Number(freeFrom),
      })
      setErrors({})
      setBaseline(JSON.stringify({ ...form }))
      setSavedAt(Date.now())
      onSaved(updated)
      toast.success("Storefront settings published")
    } catch (e) {
      const fields = fieldErrorsOf(e)
      setErrors(fields)
      setBanner(Object.keys(fields).length ? "The server could not accept some fields. Check the notes below." : errText(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form noValidate onSubmit={(e) => { e.preventDefault(); void save() }} className="space-y-5">
      <PageHeader
        title="Storefront"
        description="The home page banner, contact details, delivery and checkout settings."
        actions={
          <>
            <a href="/shop" target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-4 text-sm font-medium text-slate-100 hover:bg-slate-800">
              <ExternalLink className="h-4 w-4" /> View shop
            </a>
            <Btn variant="primary" type="submit" loading={saving} disabled={!dirty}><Save className="h-4 w-4" /> Publish changes</Btn>
          </>
        }
      />
      <div aria-live="polite">
        {banner && <div role="alert" className="flex gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{banner}</div>}
        {!banner && savedAt && !dirty && <div className="flex gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />Saved. Your changes are live on the shop.</div>}
        {!banner && dirty && <p className="text-xs text-amber-300">You have unsaved changes.</p>}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Block title="Announcement bar" description="A short message shown at the very top of every shop page. Leave blank to hide it.">
            <Field label="Announcement" error={errors.announcement_text} className="sm:col-span-2" hint={`${form.announcement_text.length}/240`}>{text("announcement_text", { max: 240, placeholder: "Free delivery in Nairobi on orders over KSh 10,000" })}</Field>
          </Block>

          <Block title="Home page banner" description="The first thing customers see on the shop home page.">
            <Field label="Small heading above the title" error={errors.hero_eyebrow}>{text("hero_eyebrow", { max: 120 })}</Field>
            <Field label="Store name" error={errors.store_name}>{text("store_name", { max: 120 })}</Field>
            <Field label="Headline" error={errors.hero_title} className="sm:col-span-2">{text("hero_title", { max: 180 })}</Field>
            <Field label="Description" error={errors.hero_description} className="sm:col-span-2" hint={`${form.hero_description.length}/500`}>
              <textarea rows={3} maxLength={500} value={form.hero_description} onChange={(e) => set("hero_description", e.target.value)} className={cx(inputCls, "resize-y")} />
            </Field>
            <div className="sm:col-span-2">
              <ImageUploader api={api} label="Banner image" value={form.hero_image} onChange={(v) => set("hero_image", v)} error={errors.hero_image} aspect="aspect-[16/7]" fit="object-cover" hint="A wide photo, at least 1600 px across, works best." />
            </div>
            <Field label="Main button text" error={errors.hero_primary_label}>{text("hero_primary_label", { max: 60 })}</Field>
            <Field label="Main button link" error={errors.hero_primary_href} hint="For example /shop/catalog or a full link.">{text("hero_primary_href", { placeholder: "/shop/catalog" })}</Field>
            <Field label="Second button text" error={errors.hero_secondary_label}>{text("hero_secondary_label", { max: 60 })}</Field>
            <Field label="Second button link" error={errors.hero_secondary_href}>{text("hero_secondary_href")}</Field>
          </Block>

          <Block title="Contact details" description="Shown in the shop footer and on the help page.">
            <Field label="Support email" error={errors.support_email}>{text("support_email", { type: "email" })}</Field>
            <Field label="Support phone" error={errors.support_phone}>{text("support_phone", { type: "tel", placeholder: "0712 345 678" })}</Field>
            <Field label="WhatsApp number" error={errors.whatsapp_number} hint="Include the country code, for example 254712345678.">{text("whatsapp_number", { type: "tel" })}</Field>
          </Block>

          <Block title="Delivery and checkout">
            <Field label="Delivery fee (KSh)" error={errors.default_shipping_fee}>
              <input type="number" min={0} step="1" inputMode="numeric" value={form.default_shipping_fee ?? ""} onChange={(e) => set("default_shipping_fee", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Free delivery from (KSh)" error={errors.free_shipping_threshold} hint="Leave blank to always charge the delivery fee.">
              <input type="number" min={0} step="1" inputMode="numeric" value={form.free_shipping_threshold ?? ""} onChange={(e) => set("free_shipping_threshold", e.target.value)} className={inputCls} />
            </Field>
            <div className="sm:col-span-2">
              <ToggleRow title="Checkout is open" description="Turn off to pause orders, for example during stocktake. Customers can still browse." checked={form.allow_checkout} onChange={(v) => set("allow_checkout", v)} />
            </div>
            <Field label="Message when checkout is paused" error={errors.checkout_notice} className="sm:col-span-2" hint="Shown to customers at checkout while it is closed.">{text("checkout_notice", { max: 300, placeholder: "We are not taking orders right now. Please check back soon." })}</Field>
          </Block>
        </div>

        <aside className="h-fit space-y-3 xl:sticky xl:top-28">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Banner preview</p>
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#06183b] text-white shadow-xl shadow-black/30">
            {form.announcement_text && <p className="bg-white/10 px-4 py-2 text-center text-[11px]">{form.announcement_text}</p>}
            <div className="relative aspect-[4/3] bg-[#0b2452]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {form.hero_image && <img src={form.hero_image} alt="" className="h-full w-full object-cover opacity-55" />}
              <div className="absolute inset-0 bg-gradient-to-t from-[#06183b] via-[#06183b]/60 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-200">{form.hero_eyebrow || "Small heading"}</p>
                <h3 className="mt-2 text-xl font-semibold leading-tight">{form.hero_title || "Your headline"}</h3>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm leading-6 text-white/70">{form.hero_description || "A short description of the offer."}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold">{form.hero_primary_label || "Main button"}</span>
                {form.hero_secondary_label && <span className="rounded-lg border border-white/30 px-3 py-2 text-xs font-semibold">{form.hero_secondary_label}</span>}
              </div>
            </div>
          </div>
          {!form.allow_checkout && <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">Checkout is paused. Customers will see: {form.checkout_notice || "no message set"}</p>}
        </aside>
      </div>
    </form>
  )
}
