// Animated backdrop for the "Aurora Drift" captive portal theme (template 19).
// Cheap by design for low-end phones: 3 blobs + 1 star layer, radial-gradient fills
// (no filter: blur), CSS transform-only keyframes, no JS loop, no canvas.
// Animation only runs when the user has NOT asked for reduced motion.
const AURORA_CSS = `
.cp-aurora-root{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0}
.cp-aurora-blob{position:absolute;border-radius:9999px;opacity:.55;will-change:transform}
.cp-aurora-blob-a{width:90vmax;height:90vmax;left:-35vmax;top:-30vmax;background:radial-gradient(circle,rgba(45,212,191,.55) 0%,rgba(45,212,191,0) 62%)}
.cp-aurora-blob-b{width:80vmax;height:80vmax;right:-30vmax;top:10vh;background:radial-gradient(circle,rgba(139,92,246,.5) 0%,rgba(139,92,246,0) 62%)}
.cp-aurora-blob-c{width:85vmax;height:85vmax;left:-10vmax;bottom:-45vmax;background:radial-gradient(circle,rgba(59,130,246,.5) 0%,rgba(59,130,246,0) 62%)}
.cp-aurora-stars{position:absolute;inset:0;opacity:.5;
background-image:radial-gradient(1px 1px at 20px 30px,#fff,transparent),radial-gradient(1px 1px at 120px 80px,#cbd5e1,transparent),radial-gradient(1.5px 1.5px at 210px 150px,#fff,transparent),radial-gradient(1px 1px at 60px 190px,#e2e8f0,transparent);
background-size:240px 240px}
@keyframes cp-aurora-drift-a{0%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(14vmax,10vmax,0) scale(1.1)}100%{transform:translate3d(0,0,0) scale(1)}}
@keyframes cp-aurora-drift-b{0%{transform:translate3d(0,0,0) scale(1.05)}50%{transform:translate3d(-16vmax,8vmax,0) scale(.95)}100%{transform:translate3d(0,0,0) scale(1.05)}}
@keyframes cp-aurora-drift-c{0%{transform:translate3d(0,0,0)}50%{transform:translate3d(12vmax,-12vmax,0) scale(1.08)}100%{transform:translate3d(0,0,0)}}
@media (prefers-reduced-motion:no-preference){
.cp-aurora-blob-a{animation:cp-aurora-drift-a 48s ease-in-out infinite}
.cp-aurora-blob-b{animation:cp-aurora-drift-b 62s ease-in-out infinite}
.cp-aurora-blob-c{animation:cp-aurora-drift-c 74s ease-in-out infinite}
}
@media (prefers-reduced-motion:reduce){
.cp-aurora-blob{animation:none!important}
}
`

export default function AuroraBackdrop() {
  return (
    <div className="cp-aurora-root" aria-hidden="true">
      <style>{AURORA_CSS}</style>
      <div className="cp-aurora-blob cp-aurora-blob-a" />
      <div className="cp-aurora-blob cp-aurora-blob-b" />
      <div className="cp-aurora-blob cp-aurora-blob-c" />
      <div className="cp-aurora-stars" />
    </div>
  )
}
