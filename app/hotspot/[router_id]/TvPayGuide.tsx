"use client"

import { AlertCircle, CheckCircle2, Loader2, Monitor } from "lucide-react"

export interface TvDevice {
  ip: string
  mac: string
  mac_masked: string
  label: string
}

interface TvPayGuideProps {
  verified: boolean
  mode: "scan" | "manual"
  onModeChange: (m: "scan" | "manual") => void
  scanLoading: boolean
  devices: TvDevice[]
  selected: TvDevice | null
  onScan: () => void
  onSelect: (d: TvDevice) => void
  macInput: string
  onMacInputChange: (v: string) => void
  onConfirmManual: () => void
  lastDigits: string
  onLastDigitsChange: (v: string) => void
  onVerifyDigits: () => void
  error: string | null
  onReset: () => void
  supportPhone?: string
  swahili?: boolean
}

const STEPS = ["Connect TV", "Find TV", "Confirm", "Pay"]

const TV_BRANDS: { name: string; path: string }[] = [
  { name: "Samsung", path: "Settings → General → Network → Network Status → IP Settings. Or: Settings → Support → About This TV." },
  { name: "LG", path: "Settings → All Settings → Network → Wi-Fi Connection → Advanced Wi-Fi Settings." },
  { name: "Android / Google TV (Sony, TCL, Skyworth, Hisense Android)", path: "Settings → System → About → Status → Wi-Fi MAC address. Or: Settings → Network & Internet → your WiFi name." },
  { name: "Hisense (VIDAA) / other", path: "Settings → Network → Network Info. If you can't find it, search \"MAC\" in Settings." },
]

/** "a4cf123fa29b" -> "A4:CF:12:3F:A2:9B" (no trailing colon, so backspace works smoothly) */
export const formatMacInput = (raw: string) =>
  (raw.replace(/[^a-fA-F0-9]/g, "").toUpperCase().slice(0, 12).match(/.{1,2}/g) || []).join(":")

function MaskedMac({ value }: { value: string }) {
  return (
    <span className="font-mono text-sm tracking-wide">
      {value.split(/(\*+)/).map((part, i) =>
        part.includes("*") ? (
          <span key={i} className="rounded bg-amber-200 px-1 font-bold text-amber-900">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

function BrandHelp() {
  return (
    <details className="mt-3 rounded-lg border border-blue-200 bg-white">
      <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-blue-700">
        Where do I find this on my TV?
      </summary>
      <div className="space-y-2 border-t border-blue-100 px-3 py-3 text-xs text-gray-700">
        <p>Look for <b>&quot;Wi-Fi MAC&quot;</b> or <b>&quot;MAC address&quot;</b>. Use the <b>Wi-Fi</b> one, not Ethernet/LAN.</p>
        {TV_BRANDS.map((b) => (
          <p key={b.name}><b>{b.name}:</b> {b.path}</p>
        ))}
        <p className="text-gray-500">Menus differ slightly between models. Searching &quot;MAC&quot; in your TV Settings usually finds it.</p>
      </div>
    </details>
  )
}

export default function TvPayGuide(p: TvPayGuideProps) {
  const sw = (t: string) =>
    p.swahili ? <span className="block text-[11px] text-blue-700/70">{t}</span> : null

  // ── Verified ──
  if (p.verified) {
    const name = p.selected?.label || (p.mode === "manual" ? p.macInput : "Your TV")
    return (
      <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-gray-900">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-800">Your TV is confirmed ✓</p>
            <p className="mt-0.5 text-xs text-green-700">
              {name}. Now choose a TV plan below and pay from your phone. Your TV connects by itself after payment.
            </p>
            {p.swahili && <p className="mt-0.5 text-[11px] text-green-700/80">TV yako imethibitishwa. Chagua kifurushi hapa chini ulipe.</p>}
          </div>
        </div>
        <button type="button" onClick={p.onReset} className="mt-3 text-xs font-medium text-green-800 underline">
          Wrong TV? Change it
        </button>
      </div>
    )
  }

  const current =
    p.mode === "scan" ? (p.selected ? 3 : 2) : p.macInput ? 3 : 2

  return (
    <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-gray-900">
      {/* Progress */}
      <ol className="mb-4 flex items-center justify-between gap-1" aria-label="Steps">
        {STEPS.map((label, i) => {
          const n = i + 1
          const done = n < current
          const active = n === current
          return (
            <li key={label} className="flex flex-1 flex-col items-center gap-1 text-center">
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
                  done ? "bg-green-500 text-white" : active ? "bg-blue-600 text-white" : "bg-white text-gray-400 border border-blue-200"
                }`}
              >
                {done ? "✓" : n}
              </span>
              <span className={`text-[10px] leading-tight ${active ? "font-semibold text-blue-700" : "text-gray-500"}`}>{label}</span>
            </li>
          )
        })}
      </ol>

      {/* Step 1 */}
      <div className="mb-4 rounded-lg border border-blue-200 bg-white p-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Monitor className="h-4 w-4 text-blue-600" /> Step 1: Connect your TV to this WiFi
        </p>
        <p className="mt-1 text-xs text-gray-600">
          Turn on your TV and connect it to <b>this same WiFi</b> (you will see a login page or &quot;no internet&quot; on the TV — that is fine).
        </p>
        {sw("Washa TV yako na uiunganishe kwenye WiFi hii hii.")}
      </div>

      {/* Mode switch */}
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => p.onModeChange("scan")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${p.mode === "scan" ? "bg-blue-600 text-white" : "border border-blue-200 bg-white text-gray-600"}`}
        >
          Find my TV (easy)
        </button>
        <button
          type="button"
          onClick={() => p.onModeChange("manual")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${p.mode === "manual" ? "bg-blue-600 text-white" : "border border-blue-200 bg-white text-gray-600"}`}
        >
          Type MAC address
        </button>
      </div>

      {p.mode === "scan" ? (
        <div>
          <p className="mb-2 text-sm font-semibold">Step 2: Find your TV</p>
          {sw("Hatua 2: Tafuta TV yako")}
          <button
            type="button"
            onClick={p.onScan}
            disabled={p.scanLoading}
            className="mb-3 mt-1 flex w-full items-center justify-center gap-2 rounded-lg border border-blue-300 bg-white py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
          >
            {p.scanLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Looking for your TV…</>
            ) : (
              <><Monitor className="h-4 w-4" /> Tap here to find my TV</>
            )}
          </button>

          {p.devices.length > 0 && (
            <>
              <p className="mb-2 text-xs text-gray-600">Tap your TV. Not sure which one? Pick any, then Step 3 will tell you if it matches.</p>
              <div className="mb-3 max-h-44 space-y-2 overflow-y-auto">
                {p.devices.map((d, i) => (
                  <button
                    key={`${d.mac}-${i}`}
                    type="button"
                    onClick={() => p.onSelect(d)}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                      p.selected?.mac === d.mac ? "border-blue-500 bg-white ring-2 ring-blue-200" : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-800">{d.label || `Device ${i + 1}`}</div>
                    <div className="mt-0.5 text-xs text-gray-500"><MaskedMac value={d.mac_masked || d.mac} /></div>
                  </button>
                ))}
              </div>
            </>
          )}

          {p.selected && (
            <div className="rounded-lg border border-amber-200 bg-white p-3">
              <p className="text-sm font-semibold">Step 3: Confirm it is your TV</p>
              {sw("Hatua 3: Thibitisha ni TV yako")}
              <p className="mt-1 text-xs text-gray-600">
                For safety, part of your TV&apos;s address is hidden: <MaskedMac value={p.selected.mac_masked || p.selected.mac} />
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-gray-700">
                <li>On your TV open <b>Settings → Network</b> and find the <b>Wi-Fi MAC address</b>.</li>
                <li>Type the characters that are <span className="rounded bg-amber-200 px-1 font-bold text-amber-900">hidden</span> here (colons are optional).</li>
              </ol>
              <p className="mt-2 rounded bg-gray-50 px-2 py-1.5 text-[11px] text-gray-500">
                Example only: list shows <span className="font-mono">A4:CF:12:**:**:**</span>, TV shows <span className="font-mono">A4:CF:12:3F:A2:9B</span> → type <span className="font-mono font-bold">3F:A2:9B</span>
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  inputMode="text"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={17}
                  placeholder="Type hidden part"
                  value={p.lastDigits}
                  onChange={(e) => p.onLastDigitsChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && p.onVerifyDigits()}
                  className="min-w-0 flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-center font-mono uppercase text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  type="button"
                  onClick={p.onVerifyDigits}
                  disabled={p.lastDigits.replace(/[^a-fA-F0-9]/g, "").length < 3}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Confirm
                </button>
              </div>
              <BrandHelp />
            </div>
          )}
        </div>
      ) : (
        <div>
          <p className="mb-1 text-sm font-semibold">Step 2: Type your TV&apos;s Wi-Fi MAC address</p>
          {sw("Hatua 2: Andika MAC address ya TV yako")}
          <p className="mb-2 text-xs text-gray-600">It has 12 letters/numbers, like <span className="font-mono">AA:BB:CC:DD:EE:FF</span>. Colons are added for you.</p>
          <input
            type="text"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            placeholder="AA:BB:CC:DD:EE:FF"
            value={p.macInput}
            onChange={(e) => p.onMacInputChange(formatMacInput(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && p.onConfirmManual()}
            className="w-full rounded-lg border border-blue-200 bg-white px-3 py-3 text-center font-mono text-base uppercase text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="button"
            onClick={p.onConfirmManual}
            disabled={p.macInput.replace(/[^a-fA-F0-9]/g, "").length !== 12}
            className="mt-2 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Use this MAC address
          </button>
          <BrandHelp />
        </div>
      )}

      {p.error && (
        <p className="mt-3 flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {p.error}
        </p>
      )}

      <details className="mt-3 rounded-lg border border-blue-200 bg-white">
        <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-gray-700">
          My TV is not showing, or the characters don&apos;t match
        </summary>
        <ul className="list-disc space-y-1.5 border-t border-blue-100 px-6 py-3 text-xs text-gray-700">
          <li>Make sure the TV is connected to <b>this</b> WiFi, then tap find again.</li>
          <li>Use the <b>Wi-Fi</b> MAC address, not Ethernet/LAN.</li>
          <li>Some TVs use a <b>&quot;Private / Random MAC address&quot;</b> setting. Turn it <b>off</b> for this WiFi in your TV&apos;s network settings, reconnect the TV, then try again.</li>
          <li>Still stuck? Use <b>Type MAC address</b> above.</li>
          {p.supportPhone && (
            <li>Need help? Call <a href={`tel:${p.supportPhone}`} className="font-semibold underline">{p.supportPhone}</a>.</li>
          )}
        </ul>
      </details>
    </div>
  )
}