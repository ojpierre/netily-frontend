// Falling-snow backdrop for the Christmas captive portal themes (23 Advent Calendar,
// 24 Silent Night). Built for cheap phones: three tiled snow layers made of
// radial-gradient dots, moved with transform-only keyframes (no canvas, no JS loop,
// no filter: blur). Each layer falls exactly one tile per cycle, so the loop is seamless.
// Under prefers-reduced-motion the snow stays still.

import { pineRow } from "@/lib/festive-art"

const SNOW_CSS = `
.cp-snow-root{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0}
.cp-snow-sway{position:absolute;inset:0;will-change:transform}
.cp-snow-layer{position:absolute;left:-40px;right:-40px;top:calc(var(--t) * -1);bottom:0;background-size:var(--t) var(--t);will-change:transform}
.cp-snow-far{--t:150px;opacity:.55;background-image:
  radial-gradient(circle at 18px 26px,#fff 0 1.1px,transparent 1.7px),
  radial-gradient(circle at 92px 70px,#fff 0 1px,transparent 1.6px),
  radial-gradient(circle at 128px 12px,#fff 0 1.2px,transparent 1.8px),
  radial-gradient(circle at 54px 118px,#fff 0 1px,transparent 1.6px),
  radial-gradient(circle at 136px 104px,#fff 0 1.1px,transparent 1.7px)}
.cp-snow-mid{--t:230px;opacity:.75;background-image:
  radial-gradient(circle at 30px 40px,#fff 0 1.8px,transparent 2.5px),
  radial-gradient(circle at 160px 96px,#fff 0 1.6px,transparent 2.3px),
  radial-gradient(circle at 96px 186px,#fff 0 2px,transparent 2.7px),
  radial-gradient(circle at 204px 160px,#fff 0 1.5px,transparent 2.2px)}
.cp-snow-near{--t:340px;opacity:.9;background-image:
  radial-gradient(circle at 60px 80px,rgba(255,255,255,.95) 0 2.8px,transparent 3.8px),
  radial-gradient(circle at 250px 210px,rgba(255,255,255,.9) 0 2.4px,transparent 3.4px),
  radial-gradient(circle at 170px 320px,rgba(255,255,255,.85) 0 3.2px,transparent 4.2px)}
.cp-snow-moon{position:absolute;right:-6vmax;top:-6vmax;width:42vmax;height:42vmax;border-radius:9999px;
  background:radial-gradient(circle at 50% 50%,rgba(255,244,214,.95) 0 9%,rgba(255,236,190,.28) 10%,rgba(255,236,190,.08) 30%,transparent 62%)}
.cp-snow-pines{position:absolute;left:0;right:0;bottom:0;width:100%;height:26vh;min-height:150px}
@keyframes cp-snow-fall{to{transform:translate3d(0,var(--t),0)}}
@keyframes cp-snow-sway{0%,100%{transform:translate3d(-10px,0,0)}50%{transform:translate3d(10px,0,0)}}
@media (prefers-reduced-motion:no-preference){
.cp-snow-far{animation:cp-snow-fall 24s linear infinite}
.cp-snow-mid{animation:cp-snow-fall 17s linear infinite}
.cp-snow-near{animation:cp-snow-fall 12s linear infinite}
.cp-snow-sway-a{animation:cp-snow-sway 9s ease-in-out infinite}
.cp-snow-sway-b{animation:cp-snow-sway 13s ease-in-out -4s infinite}
}
`

const BACK_PINES = pineRow(14, 240, 70, 120, 3)
const FRONT_PINES = pineRow(9, 240, 95, 165, 11)

export default function SnowBackdrop({ scenery = "night" }: { scenery?: "night" | "pine" }) {
  const night = scenery === "night"
  return (
    <div className="cp-snow-root" aria-hidden="true">
      <style>{SNOW_CSS}</style>
      {night && <div className="cp-snow-moon" />}
      <div className="cp-snow-sway cp-snow-sway-b">
        <div className="cp-snow-layer cp-snow-far" />
      </div>
      <svg className="cp-snow-pines" viewBox="0 0 1000 240" preserveAspectRatio="xMidYMax slice">
        <path d={BACK_PINES} fill={night ? "#16264d" : "#0a2f23"} opacity={night ? 0.9 : 0.75} />
        <path d={FRONT_PINES} fill={night ? "#0b1631" : "#072419"} />
        {/* snow bank along the bottom edge */}
        <path d="M0 226 C 160 212 320 236 500 222 S 840 210 1000 224 V240 H0Z" fill={night ? "#dfe8f7" : "#e9f3ee"} opacity={0.9} />
      </svg>
      <div className="cp-snow-sway cp-snow-sway-a">
        <div className="cp-snow-layer cp-snow-mid" />
        <div className="cp-snow-layer cp-snow-near" />
      </div>
    </div>
  )
}
