"use client"

import {
  cloneElement,
  isValidElement,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type DragEvent,
  type ReactElement,
  type ReactNode,
} from "react"
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ImagePlus, Link2, Loader2, Plus, Trash2, UploadCloud, X } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { IMAGE_TYPES, MAX_IMAGE_BYTES, errText } from "./types"
import type { ShopAdminApi } from "./api"

import { cn } from "@/lib/utils"

export const cx = (...parts: (string | false | null | undefined)[]) => cn(parts.filter(Boolean) as string[])

export const card = "rounded-2xl border border-slate-800 bg-slate-900/70"
export const inputCls =
  "w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-red-500/60"
export const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"

// ── Buttons ──

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md"
  loading?: boolean
}

export function Btn({ variant = "secondary", size = "md", loading, className, children, disabled, type = "button", ...rest }: BtnProps) {
  const variants = {
    primary: "bg-violet-600 text-white hover:bg-violet-500 shadow-sm shadow-violet-950/40",
    secondary: "border border-slate-700 bg-slate-800/60 text-slate-100 hover:bg-slate-800",
    ghost: "text-slate-300 hover:bg-slate-800 hover:text-white",
    danger: "border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20",
  }
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        focusRing,
        size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
        variants[variant],
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

export function IconBtn({ label, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40",
        focusRing,
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

// ── Form pieces ──

export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
  action,
}: {
  label: string
  hint?: ReactNode
  error?: string | string[]
  required?: boolean
  className?: string
  children: ReactNode
  action?: ReactNode
}) {
  const id = useId()
  const message = Array.isArray(error) ? error.join(" ") : error
  const describedBy = [hint ? `${id}-hint` : "", message ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id,
        "aria-invalid": message ? true : undefined,
        "aria-describedby": describedBy,
      })
    : children
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium text-slate-300">
          {label}
          {required && <span className="ml-0.5 text-violet-400" aria-hidden> *</span>}
        </label>
        {action}
      </div>
      {control}
      {hint && !message && (
        <p id={`${id}-hint`} className="mt-1.5 text-[11px] leading-4 text-slate-500">
          {hint}
        </p>
      )}
      {message && (
        <p id={`${id}-err`} role="alert" className="mt-1.5 text-[11px] leading-4 text-red-400">
          {message}
        </p>
      )}
    </div>
  )
}

export function Switch({ checked, onChange, label, disabled, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean; id?: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        focusRing,
        checked ? "bg-violet-600" : "bg-slate-700",
      )}
    >
      <span className={cx("absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform", checked && "translate-x-4")} />
    </button>
  )
}

/** A bordered row with a title, helper text and a switch. */
export function ToggleRow({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-100">{title}</p>
        <p className="mt-0.5 text-xs leading-4 text-slate-500">{description}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  )
}

const pillTones = {
  green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  red: "border-red-500/30 bg-red-500/10 text-red-300",
  blue: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  slate: "border-slate-700 bg-slate-800/60 text-slate-300",
}
export type Tone = keyof typeof pillTones

export function Pill({ tone = "slate", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium", pillTones[tone], className)}>{children}</span>
}

export function orderTone(status: string): Tone {
  if (status === "paid" || status === "delivered") return "green"
  if (status === "processing" || status === "shipped") return "blue"
  if (status === "failed" || status === "cancelled") return "red"
  if (status === "expired") return "slate"
  return "amber"
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function EmptyState({ icon, title, children, action }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-400">{icon}</div>
      <p className="mt-4 text-sm font-semibold text-white">{title}</p>
      {children && <div className="mt-1.5 max-w-md text-sm leading-6 text-slate-400">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-lg bg-slate-800/70", className)} />
}

export function Pagination({ page, pageCount, total, pageSize, onPage }: { page: number; pageCount: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  if (total === 0) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  return (
    <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-800 px-4 py-3 text-xs text-slate-400 sm:flex-row">
      <span>
        Showing {from}-{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <IconBtn label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </IconBtn>
        <span className="px-2 tabular-nums">
          Page {page} of {pageCount}
        </span>
        <IconBtn label="Next page" disabled={page >= pageCount} onClick={() => onPage(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </IconBtn>
      </div>
    </div>
  )
}

// ── Confirm dialog ──

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  loading,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
  children?: ReactNode
}) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && !loading && onCancel()}>
      <AlertDialogContent className="border-slate-800 bg-slate-900 text-slate-100">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">{title}</AlertDialogTitle>
          {description && <AlertDialogDescription className="text-slate-400">{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} className="border-slate-700 bg-slate-800/60 text-slate-100 hover:bg-slate-800 hover:text-white">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            className={destructive ? "bg-red-600 text-white hover:bg-red-500" : "bg-violet-600 text-white hover:bg-violet-500"}
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ── Image uploader ──

export function ImageUploader({
  api,
  value,
  onChange,
  label,
  hint,
  error,
  aspect = "aspect-square",
  fit = "object-contain",
}: {
  api: ShopAdminApi
  value: string
  onChange: (url: string) => void
  label: string
  hint?: string
  error?: string | string[]
  aspect?: string
  fit?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [problem, setProblem] = useState("")
  const [dragging, setDragging] = useState(false)
  const [showUrl, setShowUrl] = useState(false)
  const [broken, setBroken] = useState(false)
  const uploading = progress !== null
  const message = problem || (Array.isArray(error) ? error.join(" ") : error) || ""

  async function upload(file: File | undefined | null) {
    if (!file) return
    setProblem("")
    if (!IMAGE_TYPES.includes(file.type)) return setProblem("Use a JPEG, PNG or WebP image.")
    if (file.size > MAX_IMAGE_BYTES) return setProblem("Images must be 5 MB or smaller.")
    setProgress(0)
    try {
      const { url } = await api.uploadImage(file, setProgress)
      setBroken(false)
      onChange(url)
    } catch (e) {
      setProblem(errText(e))
    } finally {
      setProgress(null)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (!uploading) void upload(e.dataTransfer.files?.[0])
  }

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-slate-300">{label}</p>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cx(
          "relative overflow-hidden rounded-xl border border-dashed transition-colors",
          aspect,
          dragging ? "border-violet-400 bg-violet-500/10" : "border-slate-700 bg-slate-950/50",
          message && "border-red-500/50",
        )}
      >
        {value && !broken ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={`${label} preview`} onError={() => setBroken(true)} className={cx("h-full w-full bg-white", fit)} />
            <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/80 to-transparent p-2 pt-8">
              <Btn size="sm" variant="secondary" className="flex-1" onClick={() => inputRef.current?.click()} disabled={uploading}>
                Replace
              </Btn>
              <Btn size="sm" variant="danger" onClick={() => { setBroken(false); onChange("") }} disabled={uploading} aria-label={`Remove ${label.toLowerCase()}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </Btn>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cx("flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center text-slate-400 hover:text-slate-200", focusRing)}
          >
            {broken ? <X className="h-6 w-6 text-red-400" /> : <ImagePlus className="h-6 w-6" />}
            <span className="text-xs font-medium">{broken ? "This image could not be loaded" : "Drop a photo or click to upload"}</span>
            <span className="text-[11px] text-slate-500">JPEG, PNG or WebP, up to 5 MB</span>
          </button>
        )}
        {uploading && (
          <div className="absolute inset-0 grid place-items-center bg-slate-950/80" role="status" aria-live="polite">
            <div className="w-3/4 text-center">
              <UploadCloud className="mx-auto h-6 w-6 animate-pulse text-violet-300" />
              <p className="mt-2 text-xs text-slate-200">Uploading {progress}%</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full bg-violet-500 transition-[width]" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        )}
        <input ref={inputRef} type="file" accept={IMAGE_TYPES.join(",")} className="sr-only" tabIndex={-1} aria-label={`Choose ${label.toLowerCase()} file`} onChange={(e) => void upload(e.target.files?.[0])} />
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        {hint ? <p className="text-[11px] leading-4 text-slate-500">{hint}</p> : <span />}
        <button type="button" onClick={() => setShowUrl((s) => !s)} className={cx("inline-flex shrink-0 items-center gap-1 rounded text-[11px] text-slate-400 hover:text-violet-300", focusRing)}>
          <Link2 className="h-3 w-3" /> {showUrl ? "Hide link" : "Use a link"}
        </button>
      </div>
      {showUrl && (
        <input
          value={value}
          onChange={(e) => { setBroken(false); onChange(e.target.value.trim()) }}
          placeholder="https://… or /shop-assets/…"
          aria-label={`${label} link`}
          className={cx(inputCls, "mt-2")}
        />
      )}
      {message && (
        <p role="alert" className="mt-1.5 text-[11px] leading-4 text-red-400">
          {message}
        </p>
      )}
    </div>
  )
}

// ── List editors ──

function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list
  const next = list.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

const rowBtns = (i: number, len: number, move: (to: number) => void, remove: () => void, name: string) => (
  <div className="flex shrink-0 items-center">
    <IconBtn label={`Move ${name} up`} disabled={i === 0} onClick={() => move(i - 1)}>
      <ArrowUp className="h-3.5 w-3.5" />
    </IconBtn>
    <IconBtn label={`Move ${name} down`} disabled={i === len - 1} onClick={() => move(i + 1)}>
      <ArrowDown className="h-3.5 w-3.5" />
    </IconBtn>
    <IconBtn label={`Remove ${name}`} className="hover:text-red-300" onClick={remove}>
      <Trash2 className="h-3.5 w-3.5" />
    </IconBtn>
  </div>
)

export function StringListEditor({ value, onChange, placeholder, addLabel, itemName, max = 100 }: { value: string[]; onChange: (v: string[]) => void; placeholder: string; addLabel: string; itemName: string; max?: number }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const focusLater = (i: number) => setTimeout(() => refs.current[i]?.focus(), 30)
  return (
    <div className="space-y-2">
      {value.map((text, i) => (
        <div key={i} className="flex items-center gap-1">
          <span className="w-5 shrink-0 text-center text-[11px] tabular-nums text-slate-600">{i + 1}</span>
          <input
            ref={(el) => { refs.current[i] = el }}
            value={text}
            onChange={(e) => onChange(value.map((v, j) => (j === i ? e.target.value : v)))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                if (value.length < max) {
                  onChange([...value.slice(0, i + 1), "", ...value.slice(i + 1)])
                  focusLater(i + 1)
                }
              } else if (e.key === "Backspace" && text === "" && value.length > 1) {
                e.preventDefault()
                onChange(value.filter((_, j) => j !== i))
                focusLater(Math.max(0, i - 1))
              }
            }}
            placeholder={placeholder}
            aria-label={`${itemName} ${i + 1}`}
            maxLength={300}
            className={inputCls}
          />
          {rowBtns(i, value.length, (to) => onChange(moveItem(value, i, to)), () => onChange(value.filter((_, j) => j !== i)), `${itemName} ${i + 1}`)}
        </div>
      ))}
      <Btn size="sm" variant="ghost" onClick={() => { onChange([...value, ""]); focusLater(value.length) }} disabled={value.length >= max}>
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </Btn>
    </div>
  )
}

export type KV = { key: string; value: string }

export function KeyValueEditor({ value, onChange, keyPlaceholder, valuePlaceholder, addLabel, suggestions }: { value: KV[]; onChange: (v: KV[]) => void; keyPlaceholder: string; valuePlaceholder: string; addLabel: string; suggestions?: string[] }) {
  const listId = useId()
  return (
    <div className="space-y-2">
      {suggestions && (
        <datalist id={listId}>
          {suggestions.map((s) => <option key={s} value={s} />)}
        </datalist>
      )}
      {value.map((row, i) => {
        const dupe = row.key.trim() !== "" && value.some((r, j) => j !== i && r.key.trim().toLowerCase() === row.key.trim().toLowerCase())
        return (
          <div key={i} className="flex items-center gap-1">
            <div className="grid min-w-0 flex-1 grid-cols-[2fr_3fr] gap-2">
              <input
                value={row.key}
                list={suggestions ? listId : undefined}
                onChange={(e) => onChange(value.map((r, j) => (j === i ? { ...r, key: e.target.value } : r)))}
                placeholder={keyPlaceholder}
                aria-label={`Specification ${i + 1} name`}
                aria-invalid={dupe || undefined}
                maxLength={120}
                className={inputCls}
              />
              <input
                value={row.value}
                onChange={(e) => onChange(value.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)))}
                placeholder={valuePlaceholder}
                aria-label={`Specification ${i + 1} value`}
                maxLength={300}
                className={inputCls}
              />
            </div>
            {rowBtns(i, value.length, (to) => onChange(moveItem(value, i, to)), () => onChange(value.filter((_, j) => j !== i)), `specification ${i + 1}`)}
          </div>
        )
      })}
      {value.some((r, i) => r.key.trim() && value.some((o, j) => j !== i && o.key.trim().toLowerCase() === r.key.trim().toLowerCase())) && (
        <p role="alert" className="text-[11px] text-red-400">Each specification name can only be used once.</p>
      )}
      <Btn size="sm" variant="ghost" onClick={() => onChange([...value, { key: "", value: "" }])} disabled={value.length >= 60}>
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </Btn>
    </div>
  )
}

export function ChipInput({ value, onChange, placeholder, max = 12, label }: { value: string[]; onChange: (v: string[]) => void; placeholder: string; max?: number; label: string }) {
  const [draft, setDraft] = useState("")
  const commit = () => {
    const parts = draft.split(",").map((s) => s.trim()).filter(Boolean)
    if (parts.length) onChange(Array.from(new Set([...value, ...parts])).slice(0, max))
    setDraft("")
  }
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-2 focus-within:border-violet-500/60 focus-within:ring-2 focus-within:ring-violet-500/30">
      <div className="flex flex-wrap gap-1.5">
        {value.map((chip) => (
          <span key={chip} className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 py-0.5 pl-2.5 pr-1 text-xs text-violet-200">
            {chip}
            <button type="button" aria-label={`Remove ${chip}`} onClick={() => onChange(value.filter((c) => c !== chip))} className={cx("grid h-4 w-4 place-items-center rounded-full hover:bg-violet-500/30", focusRing)}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          aria-label={label}
          disabled={value.length >= max}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault()
              commit()
            } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1))
          }}
          onBlur={commit}
          placeholder={value.length ? "" : placeholder}
          className="min-w-[8rem] flex-1 bg-transparent px-1.5 py-1 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
      </div>
    </div>
  )
}
