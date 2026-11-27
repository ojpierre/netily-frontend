"use client"

import { useMemo, useState } from "react"
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import type { ShopAdminApi } from "./api"
import { errText, fieldErrorsOf, slugify, type AdminCategory, type AdminProduct } from "./types"
import { Btn, ChipInput, ConfirmDialog, EmptyState, Field, IconBtn, ImageUploader, PageHeader, Pill, Skeleton, Switch, ToggleRow, card, cx, inputCls } from "./ui"

type CatForm = { name: string; slug: string; slugTouched: boolean; description: string; image: string; featured_brands: string[]; sort_order: string; is_active: boolean }

const toForm = (c: AdminCategory | null, nextOrder: number): CatForm =>
  c
    ? { name: c.name, slug: c.slug, slugTouched: true, description: c.description || "", image: c.image || "", featured_brands: c.featured_brands || [], sort_order: String(c.sort_order), is_active: c.is_active }
    : { name: "", slug: "", slugTouched: false, description: "", image: "", featured_brands: [], sort_order: String(nextOrder), is_active: true }

function CategoryEditor({ api, category, nextOrder, onSaved, onClose }: { api: ShopAdminApi; category: AdminCategory | null; nextOrder: number; onSaved: (c: AdminCategory) => void; onClose: () => void }) {
  const initial = useMemo(() => toForm(category, nextOrder), [category, nextOrder])
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [banner, setBanner] = useState("")
  const [saving, setSaving] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const dirty = JSON.stringify(form) !== JSON.stringify(initial)
  const set = <K extends keyof CatForm>(k: K, v: CatForm[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => { const { [k as string]: _x, ...rest } = e; return rest })
  }
  const slug = form.slugTouched ? form.slug : slugify(form.name)

  async function save() {
    const problems: Record<string, string[]> = {}
    if (!form.name.trim()) problems.name = ["Enter a category name."]
    const order = Number(form.sort_order)
    if (!Number.isInteger(order) || order < 0) problems.sort_order = ["Enter a whole number, zero or more."]
    setBanner("")
    if (Object.keys(problems).length) return setErrors(problems)
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim(),
        image: form.image.trim(),
        featured_brands: form.featured_brands,
        sort_order: order,
        is_active: form.is_active,
      }
      if (category || form.slugTouched) payload.slug = slug
      const saved = category ? await api.updateCategory(category.id, payload) : await api.createCategory(payload)
      onSaved(saved)
      toast.success(category ? "Category saved" : `${saved.name} created`)
      onClose()
    } catch (e) {
      const fields = fieldErrorsOf(e)
      setErrors(fields)
      setBanner(Object.keys(fields).length ? "Please check the highlighted fields." : errText(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Sheet open onOpenChange={(o) => !o && (dirty && !saving ? setConfirmDiscard(true) : onClose())}>
        <SheetContent side="right" className="w-full gap-0 overflow-hidden border-slate-800 bg-slate-950 p-0 text-slate-100 sm:max-w-lg [&>button]:text-slate-300">
          <header className="border-b border-slate-800 bg-slate-900/80 px-5 py-4 pr-14">
            <SheetTitle className="text-base font-semibold text-white">{category ? "Edit category" : "New category"}</SheetTitle>
            <SheetDescription className="mt-0.5 text-xs text-slate-400">Categories group products on the shop and in the menu.</SheetDescription>
          </header>
          <form id="category-form" noValidate onSubmit={(e) => { e.preventDefault(); void save() }} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            {banner && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{banner}</div>}
            <Field label="Name" required error={errors.name}>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={120} placeholder="Routers and gateways" className={inputCls} />
            </Field>
            <Field label="URL slug" error={errors.slug} hint={category ? "Changing this changes the category link on the shop." : "Created from the name unless you change it."}>
              <input value={slug} onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value), slugTouched: true }))} className={inputCls} />
            </Field>
            <Field label="Description" error={errors.description} hint={`Shown under the category title. ${form.description.length}/320`}>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} maxLength={320} className={cx(inputCls, "resize-y")} />
            </Field>
            <ImageUploader api={api} label="Category image" value={form.image} onChange={(v) => set("image", v)} error={errors.image} aspect="aspect-[16/9]" fit="object-cover" hint="Wide images work best." />
            <Field label="Featured brands" error={errors.featured_brands} hint="Type a brand and press Enter. Up to 12.">
              <ChipInput value={form.featured_brands} onChange={(v) => set("featured_brands", v)} placeholder="MikroTik, Ubiquiti…" label="Featured brands" />
            </Field>
            <Field label="Display order" error={errors.sort_order} hint="Lower numbers appear first." className="max-w-[10rem]">
              <input type="number" min={0} value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} className={inputCls} />
            </Field>
            <ToggleRow title="Live on the shop" description="Hidden categories and their products stay out of the menu." checked={form.is_active} onChange={(v) => set("is_active", v)} />
          </form>
          <footer className="flex justify-end gap-2 border-t border-slate-800 bg-slate-900/90 px-5 py-3">
            <Btn variant="ghost" onClick={() => (dirty ? setConfirmDiscard(true) : onClose())} disabled={saving}>Cancel</Btn>
            <Btn variant="primary" type="submit" form="category-form" loading={saving}>{category ? "Save changes" : "Create category"}</Btn>
          </footer>
        </SheetContent>
      </Sheet>
      <ConfirmDialog open={confirmDiscard} destructive title="Discard your changes?" description="You have unsaved changes that will be lost." confirmLabel="Discard changes" cancelLabel="Keep editing" onConfirm={onClose} onCancel={() => setConfirmDiscard(false)} />
    </>
  )
}

export function CategoriesTab({
  api,
  categories,
  products,
  loading,
  onUpsert,
  onRemove,
}: {
  api: ShopAdminApi
  categories: AdminCategory[]
  products: AdminProduct[]
  loading: boolean
  onUpsert: (c: AdminCategory) => void
  onRemove: (id: number) => void
}) {
  const [editor, setEditor] = useState<{ category: AdminCategory | null } | null>(null)
  const [toDelete, setToDelete] = useState<AdminCategory | null>(null)
  const [deleting, setDeleting] = useState(false)

  const counts = useMemo(() => {
    const m = new Map<number, number>()
    products.forEach((p) => m.set(p.category, (m.get(p.category) ?? 0) + 1))
    return m
  }, [products])

  async function toggle(c: AdminCategory, active: boolean) {
    onUpsert({ ...c, is_active: active })
    try {
      onUpsert(await api.updateCategory(c.id, { is_active: active }))
      toast.success(active ? `${c.name} is live` : `${c.name} is hidden`)
    } catch (e) {
      onUpsert(c)
      toast.error(errText(e))
    }
  }

  async function remove() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.deleteCategory(toDelete.id)
      onRemove(toDelete.id)
      toast.success(`${toDelete.name} deleted`)
      setToDelete(null)
    } catch (e) {
      const status = (e as { status?: number }).status
      toast.error(status === 500 || status === 409 ? `${toDelete.name} still has products. Move or delete them first, or hide the category instead.` : errText(e))
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const deleteCount = toDelete ? counts.get(toDelete.id) ?? 0 : 0

  return (
    <div className="space-y-4">
      <PageHeader title="Categories" description="Group products so customers can browse." actions={<Btn variant="primary" onClick={() => setEditor({ category: null })}><Plus className="h-4 w-4" /> New category</Btn>} />
      <div className={cx(card, "overflow-hidden")}>
        {loading && categories.length === 0 ? (
          <div className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : categories.length === 0 ? (
          <EmptyState icon={<FolderTree className="h-5 w-5" />} title="No categories yet" action={<Btn variant="primary" onClick={() => setEditor({ category: null })}><Plus className="h-4 w-4" /> Create a category</Btn>}>
            Products need a category. Create one, or run <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs">python manage.py import_shop_catalog</code> to load the starter range.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-slate-800/80">
            {categories.map((c) => {
              const n = counts.get(c.id) ?? 0
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-slate-800/30">
                  <div className="grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
                    {c.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <FolderTree className="h-4 w-4 text-slate-600" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 basis-48">
                    <button type="button" onClick={() => setEditor({ category: c })} className="block max-w-full truncate rounded text-left text-sm font-medium text-white hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60">{c.name}</button>
                    <p className="truncate text-xs text-slate-500">/{c.slug} · {n} {n === 1 ? "product" : "products"}</p>
                    {c.featured_brands.length > 0 && <p className="mt-0.5 truncate text-xs text-slate-400">{c.featured_brands.join(", ")}</p>}
                  </div>
                  <Pill tone="slate">Order {c.sort_order}</Pill>
                  <label className="flex items-center gap-2 text-xs text-slate-400">
                    <Switch checked={c.is_active} label={`${c.name} live on shop`} onChange={(v) => void toggle(c, v)} />
                    {c.is_active ? "Live" : "Hidden"}
                  </label>
                  <div className="flex">
                    <IconBtn label={`Edit ${c.name}`} onClick={() => setEditor({ category: c })}><Pencil className="h-4 w-4" /></IconBtn>
                    <IconBtn label={`Delete ${c.name}`} className="hover:text-red-300" onClick={() => setToDelete(c)}><Trash2 className="h-4 w-4" /></IconBtn>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {editor && (
        <CategoryEditor
          key={editor.category?.id ?? "new"}
          api={api}
          category={editor.category}
          nextOrder={(categories.reduce((m, c) => Math.max(m, c.sort_order), 0) || 0) + 10}
          onSaved={onUpsert}
          onClose={() => setEditor(null)}
        />
      )}
      <ConfirmDialog
        open={!!toDelete}
        destructive
        loading={deleting}
        title={deleteCount > 0 ? `${toDelete?.name} cannot be deleted yet` : `Delete ${toDelete?.name ?? "this category"}?`}
        description={deleteCount > 0 ? `It still holds ${deleteCount} ${deleteCount === 1 ? "product" : "products"}. Move or delete them first, or hide the category so it stops showing on the shop.` : "This removes the category for good."}
        confirmLabel={deleteCount > 0 ? "Got it" : "Delete category"}
        onConfirm={() => (deleteCount > 0 ? setToDelete(null) : void remove())}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
