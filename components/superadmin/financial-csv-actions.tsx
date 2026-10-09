"use client"

import { useRef, useState } from "react"
import { Download, FileUp, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { superadminApi } from "@/lib/superadmin-api"

type Kind = "expenditure" | "expenditure-2" | "sms" | "subscription-payments"
type Preview = { valid?: number; invalid?: number; rows: Array<{ line: number; label: string; errors: string[] }> }

export function FinancialCsvActions({ kind, params = {}, onImported }: { kind: Kind; params?: Record<string, string>; onImported: () => void }) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  async function download(template = false) {
    try {
      await superadminApi.downloadFinancialCsv(kind, template ? { template: "1" } : params)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download failed")
    }
  }

  async function selectFile(next: File | null) {
    setFile(next)
    setPreview(null)
    setConfirmed(false)
    if (!next) return
    if (!next.name.toLowerCase().endsWith(".csv") || next.size > 2 * 1024 * 1024) {
      toast.error("Choose a CSV file smaller than 2 MB")
      return
    }
    setBusy(true)
    try {
      setPreview(await superadminApi.importFinancialCsv(kind, next))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not preview CSV")
    } finally {
      setBusy(false)
    }
  }

  async function importRows() {
    if (!file || !preview || preview.invalid || !confirmed) return
    setBusy(true)
    try {
      const result = await superadminApi.importFinancialCsv(kind, file, true)
      if (result.failed) {
        setPreview({ rows: result.rows, valid: result.imported || 0, invalid: result.failed })
        setConfirmed(false)
        toast.error(`${result.imported || 0} rows imported; ${result.failed} failed. Review the marked rows.`)
        onImported()
        return
      }
      toast.success(`${result.imported || 0} rows imported`)
      setOpen(false)
      setFile(null)
      setPreview(null)
      setConfirmed(false)
      if (input.current) input.current.value = ""
      onImported()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed")
    } finally {
      setBusy(false)
    }
  }

  const effect = kind === "sms"
    ? "Only completed receipts can be imported. New SMS receipts credit tenant wallets. Check the tenant and reference carefully."
    : kind === "subscription-payments"
      ? "Only completed manual-payment receipts can be imported. They update invoices but will not automatically extend access or notify tenants. Review subscriptions after import."
      : "New entries affect only this account's manual expenditure total. Negative amounts are credits."

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => download()} title="Download all matching rows as CSV" className="border-slate-700 text-slate-200">
          <Download className="mr-2 h-4 w-4" /> Download CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} title="Preview and import CSV" className="border-slate-700 text-slate-200">
          <FileUp className="mr-2 h-4 w-4" /> Import CSV
        </Button>
      </div>
      <Dialog open={open} onOpenChange={(value) => { if (!busy) setOpen(value) }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto border-slate-700 bg-slate-900 text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import CSV</DialogTitle>
            <DialogDescription className="text-slate-400">Preview every row before saving. Up to 500 rows, UTF-8 CSV, 2 MB maximum.</DialogDescription>
          </DialogHeader>
          <p className="rounded border border-amber-600/30 bg-amber-500/10 p-3 text-sm text-amber-100">{effect}</p>
          <Button variant="link" className="h-auto w-fit p-0 text-cyan-300" onClick={() => download(true)}>Download CSV template</Button>
          <div className="space-y-2">
            <Label htmlFor={`csv-${kind}`}>CSV file</Label>
            <Input id={`csv-${kind}`} ref={input} type="file" accept=".csv,text/csv" disabled={busy} onChange={(event) => selectFile(event.target.files?.[0] || null)} className="border-slate-700 bg-slate-950 file:text-slate-100" />
          </div>
          {busy && <div className="flex items-center gap-2 text-sm text-slate-300"><Loader2 className="h-4 w-4 animate-spin" /> Checking file...</div>}
          {preview && (
            <div className="space-y-3">
              <p className="text-sm text-slate-200">{preview.valid || 0} ready | {preview.invalid || 0} need attention</p>
              <div className="max-h-60 overflow-y-auto rounded border border-slate-700">
                {preview.rows.map((row) => <div key={row.line} className="flex gap-3 border-b border-slate-800 p-2 text-sm last:border-0">
                  <span className="w-10 shrink-0 text-slate-500">{row.line}</span>
                  <span className="min-w-0 flex-1 truncate" title={row.label}>{row.label}</span>
                  <span className={row.errors.length ? "max-w-[50%] text-red-300" : "text-emerald-300"}>{row.errors.length ? row.errors.join(" ") : "Ready"}</span>
                </div>)}
              </div>
              {!preview.invalid && <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-200">
                <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1" />
                <span>I checked the rows and understand how this import affects the ledger.</span>
              </label>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy} className="border-slate-700">Cancel</Button>
            <Button onClick={importRows} disabled={busy || !preview?.valid || !!preview?.invalid || !confirmed} className="bg-violet-600 text-white hover:bg-violet-500">Import {preview?.valid || 0} rows</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
