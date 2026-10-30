import { Activity, Banknote, CheckCircle2, CircleAlert, RadioTower, Router, Users, Wifi } from "lucide-react"
import Image from "next/image"
import s from "./marketing.module.css"

export type ProductPreviewVariant = "overview" | "billing" | "network" | "operations"

const previewCopy: Record<ProductPreviewVariant, { label: string; title: string; copy: string }> = {
  overview: {
    label: "Product preview",
    title: "See the work, not another feature list.",
    copy: "Payments, subscriber access, router health, and the next action share one operating view. The interface below uses illustrative data to show how the workflow fits together.",
  },
  billing: {
    label: "Billing workspace",
    title: "A payment becomes an account decision.",
    copy: "Review the receipt, the invoice it settled, and the subscriber access it restored without moving between statements, spreadsheets, and router tabs.",
  },
  network: {
    label: "Network workspace",
    title: "The router and subscriber tell the same story.",
    copy: "Keep service state, active sessions, plan policy, and router reachability close enough to diagnose the customer experience quickly.",
  },
  operations: {
    label: "Operator workspace",
    title: "Give the team one clear queue.",
    copy: "Put overdue accounts, support follow-up, subscriber changes, and network exceptions in an ordered view with an obvious next action.",
  },
}

const overviewEvents = [
  ["Payment QJK4X7P2 received", "Amani Fibre · KES 2,500", "now"],
  ["PPPoE access restored", "ACC-0142 · Home 20 Mbps", "12 sec"],
  ["Invoice NET-2041 settled", "Balance KES 0", "12 sec"],
]

const billingRows = [
  ["QJK4X7P2", "ACC-0142", "KES 2,500", "Matched"],
  ["QJL9R2D8", "ACC-0228", "KES 1,800", "Matched"],
  ["QJM2T6A1", "No account", "KES 3,000", "Review"],
]

const networkRows = [
  ["Nairobi POP", "Online", "38 sessions", "42 ms"],
  ["Ruiru Tower", "Online", "21 sessions", "58 ms"],
  ["Estate Hotspot", "Attention", "14 sessions", "2m ago"],
]

const operationsRows = [
  ["Grace period ends today", "7 subscribers", "Review billing"],
  ["Router follow-up", "Estate Hotspot", "Open diagnostics"],
  ["Support waiting", "3 conversations", "Open inbox"],
]

function Status({ children, tone = "ok" }: { children: React.ReactNode; tone?: "ok" | "warn" | "info" }) {
  return <span className={`${s.previewStatus} ${tone === "warn" ? s.previewStatusWarn : tone === "info" ? s.previewStatusInfo : ""}`}>{children}</span>
}

function OverviewPreview() {
  return <>
    <div className={s.previewMetrics} aria-label="Illustrative operating summary">
      <div><span>Collected today</span><strong>KES 24,850</strong><small>18 confirmed payments</small></div>
      <div><span>Active subscribers</span><strong>142</strong><small>PPPoE and hotspot</small></div>
      <div><span>Needs action</span><strong>4</strong><small>Billing and network</small></div>
    </div>
    <div className={s.previewColumns}>
      <section className={s.previewPanel}>
        <div className={s.previewPanelHead}><div><span>Recent activity</span><strong>Payment to access</strong></div><Status>Live</Status></div>
        <div className={s.previewEventList}>{overviewEvents.map(([title, meta, time], index) => <article key={title} style={{ "--preview-index": index } as React.CSSProperties}><span className={s.previewEventIcon}>{index === 0 ? <Banknote /> : index === 1 ? <Wifi /> : <CheckCircle2 />}</span><div><strong>{title}</strong><small>{meta}</small></div><time>{time}</time></article>)}</div>
      </section>
      <section className={s.previewPanel}>
        <div className={s.previewPanelHead}><div><span>What needs action</span><strong>Operator queue</strong></div><Status tone="warn">4 items</Status></div>
        <div className={s.previewDecision}><CircleAlert /><div><strong>Two payments need matching</strong><p>Check account references before access changes.</p></div><span>Review</span></div>
        <div className={s.previewDecision}><Router /><div><strong>Estate Hotspot missed a check-in</strong><p>Last contact two minutes ago.</p></div><span>Diagnose</span></div>
      </section>
    </div>
  </>
}

function BillingPreview() {
  return <>
    <div className={s.previewMetrics}><div><span>Confirmed today</span><strong>KES 24,850</strong><small>Illustrative total</small></div><div><span>Matched</span><strong>18</strong><small>Receipts linked</small></div><div><span>Needs review</span><strong>2</strong><small>No safe account match</small></div></div>
    <section className={s.previewPanel}>
      <div className={s.previewPanelHead}><div><span>M-Pesa receipts</span><strong>Reconciliation queue</strong></div><Status tone="info">Illustrative data</Status></div>
      <div className={s.previewTable}><div className={s.previewTableHead}><span>Receipt</span><span>Account</span><span>Amount</span><span>Status</span></div>{billingRows.map(([receipt, account, amount, status], index) => <div className={s.previewTableRow} key={receipt} style={{ "--preview-index": index } as React.CSSProperties}><strong>{receipt}</strong><span>{account}</span><span>{amount}</span><Status tone={status === "Review" ? "warn" : "ok"}>{status}</Status></div>)}</div>
      <div className={s.previewFlow} aria-label="Payment restoration workflow"><div><Banknote /><span>Payment confirmed</span></div><i /><div><CheckCircle2 /><span>Invoice settled</span></div><i /><div><Wifi /><span>Access restored</span></div></div>
    </section>
  </>
}

function NetworkPreview() {
  return <div className={s.previewColumns}>
    <section className={s.previewPanel}>
      <div className={s.previewPanelHead}><div><span>Network</span><strong>Router reachability</strong></div><Status>2 online</Status></div>
      <div className={s.previewRouterList}>{networkRows.map(([name, status, sessions, latency], index) => <article key={name} style={{ "--preview-index": index } as React.CSSProperties}><span className={s.previewRouterIcon}>{index === 2 ? <RadioTower /> : <Router />}</span><div><strong>{name}</strong><small>{sessions}</small></div><div><Status tone={status === "Attention" ? "warn" : "ok"}>{status}</Status><small>{latency}</small></div></article>)}</div>
    </section>
    <section className={s.previewPanel}>
      <div className={s.previewPanelHead}><div><span>Subscriber session</span><strong>ACC-0142</strong></div><Status>Online</Status></div>
      <dl className={s.previewDefinitionList}><div><dt>Plan</dt><dd>Home 20 Mbps</dd></div><div><dt>Router</dt><dd>Nairobi POP</dd></div><div><dt>Address</dt><dd>10.24.8.42</dd></div><div><dt>Session</dt><dd>01h 18m</dd></div></dl>
      <div className={s.previewTraffic}><div><span>Download</span><strong>18.4 Mbps</strong></div><div><span>Upload</span><strong>6.2 Mbps</strong></div><div className={s.previewTrafficLine}><i /></div></div>
    </section>
  </div>
}

function OperationsPreview() {
  return <section className={s.previewPanel}>
    <div className={s.previewPanelHead}><div><span>Today's work</span><strong>Operator queue</strong></div><Status tone="info">Illustrative data</Status></div>
    <div className={s.previewWorkList}>{operationsRows.map(([title, meta, action], index) => <article key={title} style={{ "--preview-index": index } as React.CSSProperties}><span>{index + 1}</span><div><strong>{title}</strong><small>{meta}</small></div><span className={s.previewWorkAction}>{action}</span></article>)}</div>
    <div className={s.previewTeamLine}><Users /><span>Billing, support, and network teams see the same account state.</span></div>
  </section>
}

export function ProductProof({ variant = "overview" }: { variant?: ProductPreviewVariant }) {
  const copy = previewCopy[variant]
  return <section className={`${s.section} ${s.productProofSection}`} aria-labelledby={`product-proof-${variant}`}>
    <div className={`${s.container} ${s.productProofLayout}`}>
      <div className={s.productProofCopy}><p className={s.eyebrow}>{copy.label}</p><h2 id={`product-proof-${variant}`}>{copy.title}</h2><p>{copy.copy}</p><div className={s.productProofLegend}><Activity /><span>Illustrative product data. The controls mirror real Internetily workflows.</span></div></div>
      <div className={s.productFrame}>
        <div className={s.previewTopbar}><div><Image src="/internetily-icon-32.png" alt="" width={28} height={28} /><strong>Internetily</strong><span>Operator workspace</span></div><div><span className={s.previewSearch}>Search subscribers, routers, payments…</span><b>NT</b></div></div>
        <div className={s.previewBody}>
          <aside className={s.previewSidebar} aria-hidden="true"><span className={s.previewNavActive}>Overview</span><span>Subscribers</span><span>Billing</span><span>Network</span><span>Support</span></aside>
          <div className={s.previewMain}>
            <div className={s.previewTitle}><div><span>Internetily / {copy.label}</span><strong>{variant === "overview" ? "Operations overview" : copy.title}</strong></div><span className={s.previewIllustrative}>Illustrative</span></div>
            {variant === "overview" ? <OverviewPreview /> : variant === "billing" ? <BillingPreview /> : variant === "network" ? <NetworkPreview /> : <OperationsPreview />}
          </div>
        </div>
      </div>
    </div>
  </section>
}
