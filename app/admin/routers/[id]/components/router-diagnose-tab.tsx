"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Loader2,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Wrench,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"

interface DiagnosticResult {
  id: string
  label: string
  category: string
  severity: "critical" | "warning"
  status: "pass" | "fail"
  fixable: boolean
}

interface RouterDiagnoseTabProps {
  routerId: number
}

export function RouterDiagnoseTab({ routerId }: RouterDiagnoseTabProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isFixingAll, setIsFixingAll] = useState(false)
  const [fixingId, setFixingId] = useState<string | null>(null)
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [summary, setSummary] = useState({ total: 0, passed: 0, issues: 0 })
  const [connError, setConnError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "issues" | "passed">("issues")

  const runDiagnosis = useCallback(async () => {
    setIsLoading(true)
    setConnError(null)
    try {
      const data = await adminApi.diagnoseRouter(routerId)
      if (data.error) {
        setConnError(data.message || "Could not connect to router")
        setResults([])
      } else {
        setResults(data.results)
        setSummary(data.summary)
      }
    } catch (err: any) {
      setConnError(err.message || "Diagnosis failed")
    } finally {
      setIsLoading(false)
    }
  }, [routerId])

  useEffect(() => {
    runDiagnosis()
  }, [runDiagnosis])

  const handleFixOne = async (checkId: string, label: string) => {
    setFixingId(checkId)
    try {
      const result = await adminApi.fixRouterDiagnostic(routerId, checkId)
      if (result.success) {
        toast.success(`Fixed: ${label}`)
        runDiagnosis()
      } else {
        toast.error(result.error || result.message || "Fix failed")
      }
    } catch (err: any) {
      toast.error(err.message || "Fix failed")
    } finally {
      setFixingId(null)
    }
  }

  const handleFixAll = async () => {
    setIsFixingAll(true)
    try {
      const result = await adminApi.fixAllRouterDiagnostics(routerId)
      if (result.success) {
        toast.success(`Applied ${result.applied.length} fix(es)`)
      } else {
        toast.warning(`Applied ${result.applied.length}, ${result.failed.length} failed`)
      }
      runDiagnosis()
    } catch (err: any) {
      toast.error(err.message || "Fix-all failed")
    } finally {
      setIsFixingAll(false)
    }
  }

  const filtered = results.filter((r) =>
    filter === "all" ? true : filter === "issues" ? r.status === "fail" : r.status === "pass"
  )

  const fixableIssueCount = results.filter((r) => r.status === "fail" && r.fixable).length

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-16 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-slate-500">Comparing live router config to baseline…</p>
        </CardContent>
      </Card>
    )
  }

  if (connError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-destructive/15 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-7 h-7 text-destructive" />
          </div>
          <p className="font-semibold text-foreground mb-1">Diagnosis Failed</p>
          <p className="text-sm text-slate-500 mb-4">{connError}</p>
          <Button onClick={runDiagnosis} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header + Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                {summary.issues === 0 ? (
                  <ShieldCheck className="w-5 h-5 text-success" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-warning" />
                )}
                Router Diagnosis
              </CardTitle>
              <CardDescription>Compare live RouterOS config against the Netily provisioning baseline</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={runDiagnosis}>
                <RefreshCw className="w-4 h-4 mr-2" />Re-run
              </Button>
              {fixableIssueCount > 0 && (
                <Button size="sm" onClick={handleFixAll} disabled={isFixingAll} className="bg-warning hover:bg-orange-600">
                  {isFixingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wrench className="w-4 h-4 mr-2" />}
                  Fix All ({fixableIssueCount})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("issues")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === "issues" ? "bg-destructive text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              Issues {summary.issues}
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === "all" ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              All {summary.total}
            </button>
            <button
              onClick={() => setFilter("passed")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === "passed" ? "bg-success text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              Passed {summary.passed}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-slate-400">
              Nothing to show for this filter.
            </CardContent>
          </Card>
        ) : (
          filtered.map((r) => (
            <div
              key={r.id}
              className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 ${
                r.status === "pass"
                  ? "border-success/20 bg-success/5"
                  : r.severity === "critical"
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-warning/30 bg-warning/5"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {r.status === "pass" ? (
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                ) : r.severity === "critical" ? (
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.label}</p>
                  <p className="text-xs text-slate-400">{r.category}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {r.status === "fail" && r.severity === "critical" && (
                  <Badge variant="outline" className="border-destructive/30 text-destructive text-[10px]">Critical</Badge>
                )}
                {r.status === "pass" ? (
                  <Badge className="bg-success hover:bg-success text-xs">PASSED</Badge>
                ) : r.fixable ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleFixOne(r.id, r.label)}
                    disabled={fixingId === r.id}
                    className="border-warning/40 text-warning hover:bg-warning/10"
                  >
                    {fixingId === r.id ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Wrench className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Fix
                  </Button>
                ) : (
                  <Badge variant="secondary" className="text-xs">Manual fix required</Badge>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}