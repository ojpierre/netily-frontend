"use client"

// Live Preview that embeds this router's real captive portal (/hotspot/<id>?embed=preview)
// in a phone frame. Unsaved settings are posted into the iframe as they change, so every
// theme, layout, font, logo and announcement looks exactly as customers will see it.
// The portal's embed mode never opens payment, so tapping plans here is safe.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { ExternalLink, Loader2, RotateCw } from "lucide-react"
import { PORTAL_PREVIEW_MESSAGE, PORTAL_PREVIEW_READY } from "@/app/hotspot/[router_id]/preview-protocol"

const PHONE_W = 390
const PHONE_H = 780
const BEZEL = 10

export function LivePortalFrame({
  routerId,
  encodedTemplateId,
  hotspotName,
  supportPhone,
  announcementText,
  logoSrc,
  hidePlanSpeed,
  portalFont,
}: {
  routerId: number
  /** Template id with the plan-layout offset applied (+100 list, +200 grid), as saved */
  encodedTemplateId: number
  hotspotName: string
  supportPhone: string
  announcementText: string
  logoSrc: string | null
  hidePlanSpeed: boolean
  portalFont: string
}) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.8)
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const src = `/hotspot/${routerId}?embed=preview`

  const config = useMemo(() => {
    const c: Record<string, unknown> = {
      template_id: encodedTemplateId,
      support_phone: supportPhone,
      announcement_text: announcementText,
      router_logo_url: logoSrc,
      hide_plan_speed: hidePlanSpeed,
      portal_font: portalFont,
    }
    // An empty name falls back to the router name on the server; keep the saved one then
    if (hotspotName.trim()) c.hotspot_name = hotspotName
    return c
  }, [encodedTemplateId, hotspotName, supportPhone, announcementText, logoSrc, hidePlanSpeed, portalFont])

  const send = useCallback(() => {
    frameRef.current?.contentWindow?.postMessage({ type: PORTAL_PREVIEW_MESSAGE, config }, window.location.origin)
  }, [config])

  // Push every change; also answer the portal's "ready" ping after (re)loads
  useEffect(() => { send() }, [send])
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return
      if ((event.data as { type?: string } | null)?.type === PORTAL_PREVIEW_READY) {
        send()
        setLoading(false)
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [send])

  // Fit the phone to the card width
  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) return
    const fit = () => setScale(Math.min(1, (box.clientWidth - 8) / (PHONE_W + BEZEL * 2)))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(box)
    return () => ro.disconnect()
  }, [])

  const outerW = (PHONE_W + BEZEL * 2) * scale
  const outerH = (PHONE_H + BEZEL * 2) * scale

  return (
    <div className="space-y-3">
      <div ref={boxRef} className="flex justify-center rounded-xl border bg-muted/40 py-4">
        <div style={{ width: outerW, height: outerH }} className="relative">
          <div
            className="absolute left-0 top-0 origin-top-left overflow-hidden rounded-[2.75rem] bg-zinc-900 shadow-2xl"
            style={{ width: PHONE_W + BEZEL * 2, height: PHONE_H + BEZEL * 2, padding: BEZEL, transform: `scale(${scale})` }}
          >
            <div className="relative h-full w-full overflow-hidden rounded-[2.1rem] bg-white">
              <iframe
                key={reloadKey}
                ref={frameRef}
                src={src}
                title="Captive portal live preview"
                className="h-full w-full border-0"
                onLoad={() => { send(); setLoading(false) }}
              />
              {loading && (
                <div className="absolute inset-0 grid place-items-center bg-background/80">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>This router&apos;s real portal and plans. Tapping a plan here never charges anyone.</span>
        <span className="flex items-center gap-3">
          <button type="button" onClick={() => { setLoading(true); setReloadKey((k) => k + 1) }} className="inline-flex items-center gap-1 hover:text-foreground">
            <RotateCw className="h-3.5 w-3.5" /> Reload
          </button>
          <a href={`/hotspot/${routerId}?preview_template=${encodedTemplateId}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
            <ExternalLink className="h-3.5 w-3.5" /> Full screen
          </a>
        </span>
      </div>
    </div>
  )
}
