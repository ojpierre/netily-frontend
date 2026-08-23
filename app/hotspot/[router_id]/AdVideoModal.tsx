"use client"

import { useEffect, useRef } from "react"
import { AlertCircle, Clock, Loader2 } from "lucide-react"
import type { HotspotAd } from "./HotspotPortalClient"  // ← changed from "./page"

function AutoCompleteImage({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const t = setTimeout(onComplete, 5000)
    return () => clearTimeout(t)
  }, [onComplete])
  return null
}

interface AdVideoModalProps {
  availableAd: HotspotAd | null
  adVideoCountdown: number
  adCompleted: boolean
  adGranting: boolean
  adError: string | null
  videoRef: React.RefObject<HTMLVideoElement | null>
  onVideoLoaded: () => void
  onVideoTimeUpdate: () => void
  onComplete: () => void
  onClose: () => void
}

export default function AdVideoModal({
  availableAd,
  adVideoCountdown,
  adCompleted,
  adGranting,
  adError,
  videoRef,
  onVideoLoaded,
  onVideoTimeUpdate,
  onComplete,
  onClose,
}: AdVideoModalProps) {
  if (!availableAd) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black">
      {/* Full-screen unskippable player */}
      <div className="relative w-full h-full flex flex-col items-center justify-center">

        {/* Video */}
        {availableAd.media_type === 'VIDEO' ? (
          <video
            ref={videoRef}
            src={availableAd.media_url}
            preload="auto"
            className="w-full h-full object-contain max-h-[80vh]"
            autoPlay
            playsInline
            muted={false}
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            onLoadedMetadata={onVideoLoaded}
            onTimeUpdate={onVideoTimeUpdate}
            onEnded={onComplete}
          />
        ) : (
          // Image ad with auto-complete after 5 seconds
          <div className="relative w-full max-w-lg">
            <img src={availableAd.media_url} alt={availableAd.name} className="w-full rounded-xl" />
            <AutoCompleteImage onComplete={onComplete} />
          </div>
        )}

        {/* Countdown overlay — top-right */}
        {!adCompleted && (
          <div className="absolute top-4 right-4 bg-black/70 text-white text-sm font-semibold px-3 py-1.5 rounded-full flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {adVideoCountdown > 0 ? `${adVideoCountdown}s` : 'Almost done...'}
          </div>
        )}

        {/* Granting overlay */}
        {adGranting && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-green-400" />
            <p className="text-white text-lg font-semibold">Unlocking your free access...</p>
          </div>
        )}

        {/* Error */}
        {adError && (
          <div className="absolute bottom-8 left-4 right-4 bg-red-900/90 border border-red-500 text-white rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">{adError}</p>
              <button onClick={onComplete} className="text-xs underline mt-1">Try again</button>
            </div>
          </div>
        )}

        {/* Skip button only after video ends (before granting) */}
        {adCompleted && !adGranting && !adError && (
          <div className="absolute bottom-8 left-4 right-4 text-center">
            <p className="text-white text-sm opacity-70">Activating your free internet...</p>
          </div>
        )}

        {/* "No thanks" — only before video starts */}
        {adVideoCountdown === 0 && !adCompleted && (
          <button
            onClick={onClose}
            className="absolute top-4 left-4 text-white/50 hover:text-white text-xs px-2 py-1 rounded"
          >
            ✕ No thanks
          </button>
        )}
      </div>
    </div>
  )
}