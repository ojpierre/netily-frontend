"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Palette,
  Save,
  Loader2,
  CheckCircle2,
  Phone,
  Megaphone,
  Eye,
  Wifi,
  Globe,
  Moon,
  Sparkles,
  Minimize2,
  Zap,
  Building2,
  Layers,
  Type,
  AlertCircle,
  ImageIcon,
  Upload,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"

// ==========================================
// TEMPLATE DEFINITIONS
// ==========================================

interface TemplateOption {
  id: number
  name: string
  description: string
  icon: React.ReactNode
  preview: {
    bg: string
    card: string
    accent: string
    text: string
  }
}

const TEMPLATES: TemplateOption[] = [
  {
    id: 1,
    name: "Classic",
    description: "Clean white card with blue accent — professional and familiar",
    icon: <Globe className="w-5 h-5" />,
    preview: {
      bg: "bg-gradient-to-br from-blue-50 to-indigo-100",
      card: "bg-white",
      accent: "bg-blue-600",
      text: "text-blue-600",
    },
  },
  {
    id: 2,
    name: "Dark Mode",
    description: "Sleek dark theme with cyan accents — modern & easy on the eyes",
    icon: <Moon className="w-5 h-5" />,
    preview: {
      bg: "bg-gradient-to-br from-gray-900 to-gray-800",
      card: "bg-gray-800",
      accent: "bg-cyan-500",
      text: "text-cyan-400",
    },
  },
  {
    id: 3,
    name: "Gradient",
    description: "Bold gradient background with vibrant colours",
    icon: <Palette className="w-5 h-5" />,
    preview: {
      bg: "bg-gradient-to-br from-purple-600 to-pink-500",
      card: "bg-white/90 backdrop-blur",
      accent: "bg-purple-600",
      text: "text-purple-600",
    },
  },
  {
    id: 4,
    name: "Minimal",
    description: "Ultra-clean layout with generous white-space",
    icon: <Minimize2 className="w-5 h-5" />,
    preview: {
      bg: "bg-gray-50",
      card: "bg-white",
      accent: "bg-gray-900",
      text: "text-gray-900",
    },
  },
  {
    id: 5,
    name: "Vibrant",
    description: "Colourful and playful — perfect for cafés & public spaces",
    icon: <Zap className="w-5 h-5" />,
    preview: {
      bg: "bg-gradient-to-br from-amber-400 to-orange-500",
      card: "bg-white",
      accent: "bg-orange-500",
      text: "text-orange-500",
    },
  },
  {
    id: 6,
    name: "Corporate",
    description: "Professional and muted — ideal for offices & hotels",
    icon: <Building2 className="w-5 h-5" />,
    preview: {
      bg: "bg-gradient-to-br from-slate-100 to-slate-200",
      card: "bg-white",
      accent: "bg-slate-700",
      text: "text-slate-700",
    },
  },
  {
    id: 7,
    name: "Glass",
    description: "Frosted glass-morphism with soft blur effects",
    icon: <Layers className="w-5 h-5" />,
    preview: {
      bg: "bg-gradient-to-br from-teal-400 to-blue-500",
      card: "bg-white/20 backdrop-blur-lg",
      accent: "bg-white",
      text: "text-white",
    },
  },
]

// ==========================================
// PROPS
// ==========================================

interface RouterPortalSettingsTabProps {
  routerId: number
  isDemo?: boolean
}

// ==========================================
// COMPONENT
// ==========================================

export function RouterPortalSettingsTab({ routerId, isDemo = false }: RouterPortalSettingsTabProps) {
  // Form state
  const [templateId, setTemplateId] = useState<number>(1)
  const [hotspotName, setHotspotName] = useState("")
  const [supportPhone, setSupportPhone] = useState("")
  const [announcementText, setAnnouncementText] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>("")
  const [existingLogo, setExistingLogo] = useState<string>("")

  // UI state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  // Original values for dirty-check (ref avoids stale-closure issues)
  const [original, setOriginal] = useState({
    template_id: 1,
    hotspot_name: "",
    support_phone: "",
    announcement_text: "",
  })

  // ── Load current values from router ──
  const loadSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    setLoadFailed(false)
    try {
      const router = await adminApi.getRouter(routerId)
      const values = {
        template_id: router.template_id ?? 1,
        hotspot_name: router.hotspot_name ?? "",
        support_phone: router.support_phone ?? "",
        announcement_text: router.announcement_text ?? "",
      }
      setTemplateId(values.template_id)
      setHotspotName(values.hotspot_name)
      setSupportPhone(values.support_phone)
      setAnnouncementText(values.announcement_text)
      setExistingLogo((router as any).logo || "")
      setOriginal(values)
      setDirty(false)
    } catch (err: any) {
      console.error("[PortalSettings] Load failed:", err)
      setError(err.message || "Failed to load portal settings")
      setLoadFailed(true)
    } finally {
      setLoading(false)
    }
  }, [routerId])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Dirty-check — compares current form values against the loaded originals
  useEffect(() => {
    const isDirty =
      templateId !== original.template_id ||
      hotspotName !== original.hotspot_name ||
      supportPhone !== original.support_phone ||
      announcementText !== original.announcement_text ||
      logoFile !== null
    setDirty(isDirty)
  }, [templateId, hotspotName, supportPhone, announcementText, original, logoFile])

  // ── Save — PATCH only changed fields ──
  const handleSave = async () => {
    if (isDemo) {
      toast.info("Demo mode — changes are not saved")
      return
    }
    setSaving(true)
    setError(null)

    // Build only changed fields to avoid overwriting unrelated Router data
    const payload: Record<string, unknown> = {}
    if (templateId !== original.template_id) payload.template_id = templateId
    if (hotspotName !== original.hotspot_name) payload.hotspot_name = hotspotName
    if (supportPhone !== original.support_phone) payload.support_phone = supportPhone
    if (announcementText !== original.announcement_text) payload.announcement_text = announcementText

    if (Object.keys(payload).length === 0 && !logoFile) {
      toast.info("No changes to save")
      setSaving(false)
      return
    }

    try {
      // If logo file is being uploaded, use FormData for multipart upload
      if (logoFile) {
        const formData = new FormData()
        Object.entries(payload).forEach(([key, value]) => {
          formData.append(key, String(value))
        })
        formData.append('logo', logoFile)
        await adminApi.updateRouterWithFormData(routerId, formData)
      } else {
        console.log("[PortalSettings] Saving payload:", payload, "to router:", routerId)
        await adminApi.updateRouter(routerId, payload as any)
      }
      // Update originals to match current values so dirty resets
      setOriginal({
        template_id: templateId,
        hotspot_name: hotspotName,
        support_phone: supportPhone,
        announcement_text: announcementText,
      })
      setDirty(false)
      if (logoFile) {
        setExistingLogo(logoPreview)
        setLogoFile(null)
        setLogoPreview("")
      }
      toast.success("Portal settings saved successfully")
    } catch (err: any) {
      console.error("[PortalSettings] Save failed:", err)
      const msg = err.message || "Failed to save portal settings"
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  // Currently selected template
  const selectedTemplate = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0]

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold">Captive Portal Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Customise the look and feel of the public WiFi login page for this router
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 animate-pulse">
              Unsaved changes
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? "Hide Preview" : "Preview"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!dirty || saving}
            size="sm"
            className={dirty ? "bg-primary hover:bg-primary/90" : ""}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving ? "Saving…" : dirty ? "Save Changes" : "No Changes"}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isDemo && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Demo Mode</AlertTitle>
          <AlertDescription>
            You are viewing demo data. Changes will not be saved.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ───────────── LEFT COLUMN: Settings ───────────── */}
        <div className="space-y-6">
          {/* Template Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Portal Template
              </CardTitle>
              <CardDescription>
                Choose a visual theme for the captive portal login page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => setTemplateId(tpl.id)}
                    className={`relative rounded-xl border-2 p-0 overflow-hidden transition-all ${
                      templateId === tpl.id
                        ? "border-primary ring-2 ring-primary/20 shadow-lg"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    {/* Mini Preview */}
                    <div className={`${tpl.preview.bg} p-3 aspect-[4/3] flex flex-col items-center justify-center gap-1.5`}>
                      <div className={`${tpl.preview.card} rounded-lg shadow-sm w-full p-2`}>
                        <div className={`${tpl.preview.accent} h-1.5 rounded-full w-3/4 mx-auto mb-1`} />
                        <div className={`${tpl.preview.accent} h-1 rounded-full w-1/2 mx-auto opacity-40`} />
                        <div className="mt-1.5 space-y-0.5">
                          <div className="h-2.5 rounded bg-muted w-full" />
                          <div className="h-2.5 rounded bg-muted w-full" />
                        </div>
                        <div className={`${tpl.preview.accent} h-3 rounded mt-1.5 w-full`} />
                      </div>
                    </div>
                    {/* Label */}
                    <div className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {templateId === tpl.id && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                        <span className="text-xs font-medium">{tpl.name}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {selectedTemplate.description}
              </p>
            </CardContent>
          </Card>

          {/* Branding Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                Branding & Information
              </CardTitle>
              <CardDescription>
                Set the display name, contact info, and optional announcement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hotspot-name">Hotspot Name</Label>
                <Input
                  id="hotspot-name"
                  placeholder="e.g. Coffee House WiFi"
                  value={hotspotName}
                  onChange={(e) => setHotspotName(e.target.value)}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  Displayed as the main heading on the portal. Falls back to the router name if empty.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="support-phone">Support Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="support-phone"
                    className="pl-9"
                    placeholder="e.g. 0712 345 678"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    maxLength={20}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Shown on the portal so users can contact you for help.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="announcement-text">Announcement Banner</Label>
                <Textarea
                  id="announcement-text"
                  placeholder="e.g. Welcome! Enjoy 50% off all plans this weekend."
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  maxLength={255}
                  rows={3}
                />
                <div className="flex justify-between">
                  <p className="text-xs text-muted-foreground">
                    Optional banner displayed above the plan cards. Leave empty to hide.
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {announcementText.length}/255
                  </span>
                </div>
              </div>

              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Portal Logo</Label>
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  {(logoPreview || existingLogo) && (
                    <div className="relative w-20 h-20 rounded-xl border bg-white flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src={logoPreview || existingLogo}
                        alt="Logo preview"
                        className="max-w-full max-h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setLogoFile(null)
                          setLogoPreview("")
                          if (existingLogo) setExistingLogo("")
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex-1">
                    <label
                      htmlFor="logo-upload"
                      className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/20 p-4 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
                    >
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground text-center">
                        {logoPreview || existingLogo ? "Replace logo" : "Upload ISP logo"}
                      </span>
                    </label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("Logo must be smaller than 5 MB")
                          return
                        }
                        setLogoFile(file)
                        setLogoPreview(URL.createObjectURL(file))
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      PNG, JPG, SVG or WebP. Max 5 MB. Displayed on the captive portal header.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ───────────── RIGHT COLUMN: Live Preview ───────────── */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Preview
              </CardTitle>
              <CardDescription>
                How the captive portal will look to your customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PortalPreview
                templateId={templateId}
                hotspotName={hotspotName}
                supportPhone={supportPhone}
                announcementText={announcementText}
              />
            </CardContent>
          </Card>

          {/* Portal URL Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Portal URL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-3 font-mono text-sm break-all">
                {typeof window !== "undefined" ? window.location.origin : ""}/hotspot/{routerId}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                MikroTik Cloud Controller will automatically redirect users to this URL.
                Make sure the router's Cloud Controller is provisioned and connected.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// PORTAL PREVIEW COMPONENT
// ==========================================

function PortalPreview({
  templateId,
  hotspotName,
  supportPhone,
  announcementText,
}: {
  templateId: number
  hotspotName: string
  supportPhone: string
  announcementText: string
}) {
  const template = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0]
  const displayName = hotspotName || "WiFi Hotspot"

  // Template-specific styles
  const styles = getTemplateStyles(templateId)

  return (
    <div className={`rounded-xl overflow-hidden border ${styles.containerBg} transition-all duration-300`} style={{ minHeight: 420 }}>
      <div className="flex flex-col items-center justify-center p-4" style={{ minHeight: 420 }}>
        {/* Mock phone frame */}
        <div className={`w-full max-w-[280px] rounded-2xl shadow-2xl overflow-hidden ${styles.cardBg}`}>
          {/* Header */}
          <div className={`p-4 text-center ${styles.headerBg}`}>
            <Wifi className={`w-8 h-8 mx-auto mb-2 ${styles.headerIcon}`} />
            <h3 className={`text-base font-bold ${styles.headerText}`}>{displayName}</h3>
            {supportPhone && (
              <p className={`text-xs mt-0.5 ${styles.headerSubtext}`}>
                <Phone className="w-3 h-3 inline mr-1" />
                {supportPhone}
              </p>
            )}
          </div>

          {/* Announcement */}
          {announcementText && (
            <div className={`mx-3 mt-3 px-3 py-2 rounded-lg text-xs ${styles.announcementBg}`}>
              <Megaphone className={`w-3 h-3 inline mr-1 ${styles.announcementIcon}`} />
              <span className={styles.announcementText}>{announcementText}</span>
            </div>
          )}

          {/* Mock plans */}
          <div className="p-3 space-y-2">
            <div className={`rounded-lg border-2 p-2.5 ${styles.planSelected}`}>
              <div className="flex justify-between items-center">
                <div>
                  <div className={`text-xs font-semibold ${styles.planTitle}`}>1 Hour</div>
                  <div className={`text-[10px] ${styles.planSub}`}>5Mbps • 500MB</div>
                </div>
                <div className={`text-sm font-bold ${styles.planPrice}`}>KES 20</div>
              </div>
            </div>
            <div className={`rounded-lg border p-2.5 ${styles.planNormal}`}>
              <div className="flex justify-between items-center">
                <div>
                  <div className={`text-xs font-semibold ${styles.planTitle}`}>24 Hours</div>
                  <div className={`text-[10px] ${styles.planSub}`}>10Mbps • 2GB</div>
                </div>
                <div className={`text-sm font-bold ${styles.planPrice}`}>KES 100</div>
              </div>
            </div>

            {/* Mock phone input */}
            <div className={`rounded-lg border px-3 py-2 text-xs ${styles.inputStyles}`}>
              0712 345 678
            </div>

            {/* Mock CTA */}
            <button className={`w-full py-2.5 rounded-lg text-xs font-semibold ${styles.ctaStyles}`}>
              Pay KES 20 with M-Pesa
            </button>
          </div>

          {/* Footer */}
          <div className={`px-3 py-2 text-center ${styles.footer}`}>
            <span className="text-[9px]">Powered by Netily</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// TEMPLATE STYLE MAP
// ==========================================

interface TemplateStyles {
  containerBg: string
  cardBg: string
  headerBg: string
  headerIcon: string
  headerText: string
  headerSubtext: string
  announcementBg: string
  announcementIcon: string
  announcementText: string
  planSelected: string
  planNormal: string
  planTitle: string
  planSub: string
  planPrice: string
  inputStyles: string
  ctaStyles: string
  footer: string
}

function getTemplateStyles(id: number): TemplateStyles {
  switch (id) {
    case 2: // Dark Mode
      return {
        containerBg: "bg-gradient-to-br from-gray-900 to-gray-800",
        cardBg: "bg-gray-900 border border-gray-700",
        headerBg: "bg-gradient-to-r from-cyan-600 to-blue-600",
        headerIcon: "text-white",
        headerText: "text-white",
        headerSubtext: "text-cyan-100",
        announcementBg: "bg-cyan-950/50 border border-cyan-800",
        announcementIcon: "text-cyan-400",
        announcementText: "text-cyan-200",
        planSelected: "border-cyan-500 bg-cyan-950/30 text-white",
        planNormal: "border-gray-700 text-gray-300 hover:border-gray-600",
        planTitle: "text-white",
        planSub: "text-gray-400",
        planPrice: "text-cyan-400",
        inputStyles: "border-gray-700 bg-gray-800 text-gray-300",
        ctaStyles: "bg-cyan-500 text-white hover:bg-cyan-400",
        footer: "text-gray-500",
      }
    case 3: // Gradient
      return {
        containerBg: "bg-gradient-to-br from-purple-600 to-pink-500",
        cardBg: "bg-white/90 backdrop-blur-sm",
        headerBg: "bg-gradient-to-r from-purple-600 to-pink-500",
        headerIcon: "text-white",
        headerText: "text-white",
        headerSubtext: "text-purple-100",
        announcementBg: "bg-purple-50 border border-purple-200",
        announcementIcon: "text-purple-500",
        announcementText: "text-purple-700",
        planSelected: "border-purple-500 bg-purple-50",
        planNormal: "border-gray-200 hover:border-purple-300",
        planTitle: "text-gray-900",
        planSub: "text-gray-500",
        planPrice: "text-purple-600",
        inputStyles: "border-gray-200 bg-white text-gray-700",
        ctaStyles: "bg-gradient-to-r from-purple-600 to-pink-500 text-white",
        footer: "text-gray-400",
      }
    case 4: // Minimal
      return {
        containerBg: "bg-gray-50",
        cardBg: "bg-white shadow-sm",
        headerBg: "bg-white border-b",
        headerIcon: "text-gray-900",
        headerText: "text-gray-900",
        headerSubtext: "text-gray-500",
        announcementBg: "bg-gray-100 border border-gray-200",
        announcementIcon: "text-gray-600",
        announcementText: "text-gray-700",
        planSelected: "border-gray-900 bg-gray-50",
        planNormal: "border-gray-200 hover:border-gray-400",
        planTitle: "text-gray-900",
        planSub: "text-gray-500",
        planPrice: "text-gray-900",
        inputStyles: "border-gray-300 bg-white text-gray-700",
        ctaStyles: "bg-gray-900 text-white hover:bg-gray-800",
        footer: "text-gray-400",
      }
    case 5: // Vibrant
      return {
        containerBg: "bg-gradient-to-br from-amber-400 to-orange-500",
        cardBg: "bg-white shadow-xl",
        headerBg: "bg-gradient-to-r from-amber-500 to-orange-500",
        headerIcon: "text-white",
        headerText: "text-white",
        headerSubtext: "text-amber-100",
        announcementBg: "bg-amber-50 border border-amber-200",
        announcementIcon: "text-amber-600",
        announcementText: "text-amber-700",
        planSelected: "border-orange-500 bg-orange-50",
        planNormal: "border-gray-200 hover:border-orange-300",
        planTitle: "text-gray-900",
        planSub: "text-gray-500",
        planPrice: "text-orange-600",
        inputStyles: "border-gray-200 bg-white text-gray-700",
        ctaStyles: "bg-orange-500 text-white hover:bg-orange-600",
        footer: "text-gray-400",
      }
    case 6: // Corporate
      return {
        containerBg: "bg-gradient-to-br from-slate-100 to-slate-200",
        cardBg: "bg-white shadow-md",
        headerBg: "bg-slate-700",
        headerIcon: "text-white",
        headerText: "text-white",
        headerSubtext: "text-slate-300",
        announcementBg: "bg-slate-50 border border-slate-200",
        announcementIcon: "text-slate-600",
        announcementText: "text-slate-700",
        planSelected: "border-slate-700 bg-slate-50",
        planNormal: "border-gray-200 hover:border-slate-400",
        planTitle: "text-gray-900",
        planSub: "text-gray-500",
        planPrice: "text-slate-700",
        inputStyles: "border-gray-200 bg-white text-gray-700",
        ctaStyles: "bg-slate-700 text-white hover:bg-slate-800",
        footer: "text-gray-400",
      }
    case 7: // Glass
      return {
        containerBg: "bg-gradient-to-br from-teal-400 to-blue-500",
        cardBg: "bg-white/20 backdrop-blur-lg border border-white/30",
        headerBg: "bg-white/10",
        headerIcon: "text-white",
        headerText: "text-white",
        headerSubtext: "text-white/70",
        announcementBg: "bg-white/10 border border-white/20",
        announcementIcon: "text-white/80",
        announcementText: "text-white/90",
        planSelected: "border-white/60 bg-white/20 text-white",
        planNormal: "border-white/20 text-white/90 hover:border-white/40",
        planTitle: "text-white",
        planSub: "text-white/60",
        planPrice: "text-white",
        inputStyles: "border-white/20 bg-white/10 text-white/80 placeholder:text-white/40",
        ctaStyles: "bg-white text-teal-700 font-bold hover:bg-white/90",
        footer: "text-white/40",
      }
    default: // Classic (1)
      return {
        containerBg: "bg-gradient-to-br from-blue-50 to-indigo-100",
        cardBg: "bg-white shadow-xl",
        headerBg: "bg-blue-600",
        headerIcon: "text-white",
        headerText: "text-white",
        headerSubtext: "text-blue-100",
        announcementBg: "bg-blue-50 border border-blue-200",
        announcementIcon: "text-blue-500",
        announcementText: "text-blue-700",
        planSelected: "border-blue-500 bg-blue-50",
        planNormal: "border-gray-200 hover:border-blue-300",
        planTitle: "text-gray-900",
        planSub: "text-gray-500",
        planPrice: "text-blue-600",
        inputStyles: "border-gray-200 bg-white text-gray-700",
        ctaStyles: "bg-blue-600 text-white hover:bg-blue-700",
        footer: "text-gray-400",
      }
  }
}
