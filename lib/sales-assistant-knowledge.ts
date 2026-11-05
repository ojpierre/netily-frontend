/**
 * Curated product knowledge for the public homepage assistant.
 *
 * Every answer leads with what Internetily (Netily) does for the visitor's need.
 * Keep claims to what the product ships and what public pages state; when
 * something depends on equipment, provider approval or plan, say so plainly.
 */

export type SalesTopic = {
  id: string
  /** Lower-case words or phrases; any match scores the topic. */
  keywords: string[]
  answer: string
  link?: { href: string; label: string }
  followUps: string[]
}

export const PRICING = {
  monthlyMinimum: 500,
  perPppoe: 25,
  hotspotPercent: 3,
  activation: 500,
  trialDays: 2,
}

export const SALES_TOPICS: SalesTopic[] = [
  {
    id: "mpesa",
    keywords: ["mpesa", "m-pesa", "stk", "paybill", "till", "daraja", "payment", "pay", "paid", "paying", "collect", "reconcil", "match"],
    answer: "Yes, that's exactly what Internetily is built for. Customers pay by **M-Pesa STK Push**, Paybill or Till, and each payment is matched to the right subscriber automatically. Once it's confirmed, their access is restored without anyone opening the router, and the receipt and invoice update on their own.",
    link: { href: "/features/mpesa-billing", label: "See M-Pesa billing" },
    followUps: ["Do customers reconnect automatically after paying?", "Can I use my own Paybill or Till?", "What does it cost?"],
  },
  {
    id: "reconnect",
    keywords: ["reconnect", "auto", "automatic", "expire", "expiry", "suspend", "disconnect", "cut off", "unblock", "restore", "renew"],
    answer: "It does. When a package expires, Internetily pauses access automatically, and the moment the customer pays it's switched back on, no manual unblocking. Expired **PPPoE** customers are even redirected to a renewal page so they can pay without calling you.",
    link: { href: "/features/pppoe-billing", label: "See auto-reconnection" },
    followUps: ["How do expired customers reach the payment page?", "Does this work for hotspot too?", "Can customers get SMS reminders before expiry?"],
  },
  {
    id: "pppoe",
    keywords: ["pppoe", "radius", "freeradius", "home internet", "monthly", "fibre", "fiber", "ftth", "subscriber"],
    answer: "Great fit. Internetily runs **PPPoE subscribers** through RADIUS: each customer gets their plan, speed and validity, renewals are tracked, and access follows payment automatically. You keep one subscriber record with invoices, payments, sessions and support history together.",
    link: { href: "/features/pppoe-billing", label: "See PPPoE billing" },
    followUps: ["Can I set monthly or fixed-duration plans?", "Does it work with MikroTik?", "Can I import my existing subscribers?"],
  },
  {
    id: "hotspot",
    keywords: ["hotspot", "captive", "portal", "wifi", "wi-fi", "voucher", "session", "pay as you go", "minutes", "hours", "tv", "smart tv"],
    answer: "Yes. Internetily gives you a branded **captive portal** where customers pick a package, pay and get online in one flow. You can sell vouchers through agents, let returning customers reconnect while their time is still valid, and even let a Smart TV get access while the customer pays from their phone.",
    link: { href: "/features/hotspot-billing", label: "See hotspot billing" },
    followUps: ["Can I sell vouchers through agents?", "Can a TV buy a hotspot plan?", "How is hotspot priced?"],
  },
  {
    id: "mikrotik",
    keywords: ["mikrotik", "routeros", "router", "winbox", "provision", "script", "public ip", "vpn", "tunnel", "nas"],
    answer: "Absolutely. You connect a **MikroTik** once with a provisioning script, and Internetily manages subscriber access, PPPoE profiles and hotspot sessions from there. No public IP is required in most setups, you can still open the router in Winbox remotely, and you'll get an SMS if a router goes offline.",
    link: { href: "/features/mikrotik-provisioning", label: "See MikroTik provisioning" },
    followUps: ["Do I need a public IP?", "Can I still use Winbox?", "Will I be alerted if a router goes offline?"],
  },
  {
    id: "vendors",
    keywords: ["ubiquiti", "tp-link", "tplink", "tenda", "cambium", "huawei", "starlink", "other router", "brand"],
    answer: "Good news: Internetily works with the equipment ISPs already run, including MikroTik, Ubiquiti, TP-Link, Tenda, Cambium, Huawei and Starlink-backed sites. The team will confirm the right connection method for your exact setup during onboarding.",
    link: { href: "/integrations", label: "See integrations" },
    followUps: ["Does it work with MikroTik?", "Can I manage customer routers remotely?", "How do I get started?"],
  },
  {
    id: "tr069",
    keywords: ["tr-069", "tr069", "tr69", "cwmp", "acs", "cpe", "onu", "ont", "olt", "customer router", "remote device"],
    answer: "Yes. Internetily includes a hosted **TR-069 ACS**, so customer routers and ONTs show up in your dashboard next to the subscriber. You can change Wi-Fi names and passwords, refresh device data, reboot or factory reset remotely, which saves a lot of site visits.",
    link: { href: "/features/tr069-device-management", label: "See TR-069 management" },
    followUps: ["Which devices work with TR-069?", "Do you support OLT management?", "How do I get started?"],
  },
  {
    id: "sms",
    keywords: ["sms", "text", "reminder", "notify", "notification", "message", "alert", "bulk"],
    answer: "Yes, and you don't even need your own SMS provider to start. Internetily's **inbuilt SMS** sends welcome messages, payment confirmations and expiry reminders automatically, and you can run campaigns to groups of customers. You can also connect your own gateway if you prefer.",
    link: { href: "/features/sms-reminders", label: "See SMS reminders" },
    followUps: ["Can I send reminders before a package expires?", "Can I use my own SMS provider?", "Can I message only active customers?"],
  },
  {
    id: "portal",
    keywords: ["self service", "self-service", "customer portal", "subscriber portal", "customer login", "customers pay themselves", "dashboard for customers"],
    answer: "Yes. Every subscriber gets a **self-service portal** where they can see their package, pay, renew and check their history, which takes a big load off your support line.",
    link: { href: "/features/subscriber-portal", label: "See the subscriber portal" },
    followUps: ["Can customers pay from the portal?", "Do you have support tickets?", "What does it cost?"],
  },
  {
    id: "billing",
    keywords: ["invoice", "billing", "receipt", "balance", "cycle", "recurring", "wallet", "accounting"],
    answer: "Internetily handles the full billing cycle for you: **recurring invoices**, receipts, balances and customer wallets, all tied to payments as they arrive. Your team sees exactly who is current, overdue or about to expire.",
    link: { href: "/features/recurring-invoicing", label: "See invoicing" },
    followUps: ["Does it reconcile M-Pesa payments?", "What reports can I see?", "Can I import my existing customers?"],
  },
  {
    id: "reports",
    keywords: ["report", "revenue", "analytics", "dashboard", "insight", "profit", "per router", "collections"],
    answer: "Yes. You get **revenue and collections reports** in one dashboard, including revenue per router across hotspot and PPPoE, so you can compare locations and see what's growing.",
    link: { href: "/features/revenue-reporting", label: "See revenue reporting" },
    followUps: ["Can I see revenue per router?", "Can my accountant get access?", "What does it cost?"],
  },
  {
    id: "staff",
    keywords: ["staff", "team", "role", "roles", "permission", "technician", "accountant", "branch", "multi", "audit", "agent"],
    answer: "Yes. You can add your team with **role-based access**, so technicians, accountants and support staff only see what they need, and every action is logged. Multi-branch operators can run several locations from one workspace.",
    link: { href: "/features/staff-roles", label: "See staff roles" },
    followUps: ["Can I run multiple branches?", "Is my data kept separate from other ISPs?", "How do I get started?"],
  },
  {
    id: "support",
    keywords: ["ticket", "support", "complaint", "helpdesk", "chat", "whatsapp"],
    answer: "Internetily includes **support tickets**, and customers can even message you straight from the hotspot login page; you reply from the admin workspace. And for you as an ISP, our team supports you on WhatsApp too.",
    link: { href: "/features/support-tickets", label: "See support tickets" },
    followUps: ["Can hotspot customers message me?", "Do you help with onboarding?", "How do I get started?"],
  },
  {
    id: "pricing",
    keywords: ["price", "pricing", "cost", "how much", "fee", "charge", "kes", "ksh", "expensive", "cheap", "afford"],
    answer: `Pricing grows with you: **KSh ${PRICING.monthlyMinimum} per month minimum**, then **KSh ${PRICING.perPppoe} per billable PPPoE subscriber** and **${PRICING.hotspotPercent}% of confirmed hotspot revenue**, with unlimited routers. There's a one-time KSh ${PRICING.activation} activation after the trial. Tell me your subscriber count and I'll estimate your monthly cost.`,
    link: { href: "/pricing", label: "See pricing" },
    followUps: ["Estimate for 200 PPPoE subscribers", "Is there a free trial?", "Are there setup fees?"],
  },
  {
    id: "trial",
    keywords: ["trial", "free", "try", "demo", "test", "start", "sign up", "signup", "register", "get started", "onboard", "setup", "set up"],
    answer: `You can try it free: the trial runs for **${PRICING.trialDays} days** with no credit card, and our team helps you connect M-Pesa, your router and your first subscribers. You can also explore the read-only demo workspace any time.`,
    link: { href: "https://demo.netily.co.ke/admin/login", label: "Open the demo" },
    followUps: ["What do I need to get started?", "Can I import my existing subscribers?", "What does it cost after the trial?"],
  },
  {
    id: "migration",
    keywords: ["import", "migrate", "migration", "switch", "move", "existing", "spreadsheet", "excel", "splynx", "other system", "current system"],
    answer: "Switching is easier than most ISPs expect. You can **bulk import** your existing subscribers, and our team works with you to set up M-Pesa, connect MikroTik and check the full payment-to-connection flow before you go live.",
    link: { href: "/alternatives", label: "Compare alternatives" },
    followUps: ["How long does setup take?", "Is there a free trial?", "Does it work with MikroTik?"],
  },
  {
    id: "markets",
    keywords: ["kenya", "uganda", "tanzania", "rwanda", "nigeria", "south africa", "country", "momo", "mtn", "airtel", "flutterwave", "currency", "outside kenya"],
    answer: "Internetily serves ISPs across **Kenya, Uganda, Tanzania** and beyond. In Kenya it's M-Pesa native; in Uganda customers can pay with **MTN MoMo or Airtel Money** through iotec, and other enabled markets use regional options including Flutterwave-backed flows.",
    link: { href: "/countries", label: "See supported countries" },
    followUps: ["Does it support MTN MoMo?", "What does it cost?", "Is there a free trial?"],
  },
  {
    id: "security",
    keywords: ["secure", "security", "safe", "data", "privacy", "isolat", "pin", "backup", "compliance"],
    answer: "Security is built in. Each ISP's workspace is kept separate, staff access is role-based and audited, and your payment settings can be locked behind a PIN. Payment credentials stay on the server, never in the browser.",
    link: { href: "/privacy", label: "Read our privacy policy" },
    followUps: ["Can I control what staff can see?", "How do payments stay secure?", "How do I get started?"],
  },
  {
    id: "brand",
    keywords: ["netily", "internetily", "netlify", "same company", "who are you", "what is internetily", "about"],
    answer: "**Internetily, also known as Netily**, is ISP billing and network management software built for internet providers in Kenya, Uganda, Tanzania and beyond. It brings payments, routers, subscribers, SMS and support into one connected workflow. (And no, we're not Netlify, the web hosting company.)",
    link: { href: "/features", label: "Explore features" },
    followUps: ["What problems does it solve?", "What does it cost?", "Is there a free trial?"],
  },
]

export const DEFAULT_FOLLOW_UPS = [
  "Auto-reconnect customers after M-Pesa payment",
  "Sell hotspot packages and vouchers",
  "What does it cost?",
]

const GREETING = /^(hi|hey|hello|habari|niaje|good (morning|afternoon|evening)|mambo|sasa)\b/i
const THANKS = /\b(thanks|thank you|asante|cool|great|nice|awesome)\b/i

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

// Phrases match anywhere; short words must match whole ("fee" not in "coffee");
// longer words match as a word start ("reconcil" in "reconciliation").
const keywordPatterns = new Map<string, RegExp>()
function keywordMatches(keyword: string, text: string) {
  if (keyword.includes(" ")) return text.includes(keyword)
  let pattern = keywordPatterns.get(keyword)
  if (!pattern) {
    pattern = new RegExp(keyword.length <= 4 ? `\\b${escape(keyword)}\\b` : `\\b${escape(keyword)}`)
    keywordPatterns.set(keyword, pattern)
  }
  return pattern.test(text)
}

function score(topic: SalesTopic, text: string) {
  return topic.keywords.reduce((total, keyword) => total + (keywordMatches(keyword, text) ? (keyword.includes(" ") ? 3 : 2) : 0), 0)
}

export function rankTopics(message: string) {
  const text = ` ${message.toLowerCase()} `
  return SALES_TOPICS
    .map((topic) => ({ topic, score: score(topic, text) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
}

export function matchTopics(message: string, limit = 2) {
  return rankTopics(message).slice(0, limit).map((entry) => entry.topic)
}

function parseAmount(raw: string) {
  const value = Number(raw.replace(/[,\s]/g, "").replace(/k$/i, ""))
  return /k$/i.test(raw.trim()) ? value * 1000 : value
}

const PRICE_INTENT = /\b(cost|costs|price|pricing|how much|estimate|charge|fees?|ksh|kes|bill me|monthly bill|afford)\b/i

/**
 * True when the visitor wants a price: they ask about cost, or they are
 * answering the assistant's own "tell me your subscriber count" prompt.
 */
export function wantsEstimate(message: string, history: { role: string; text: string }[] = []) {
  if (PRICE_INTENT.test(message)) return true
  const lastAssistant = [...history].reverse().find((turn) => turn.role === "assistant")
  return Boolean(lastAssistant && /estimate|subscriber count/i.test(lastAssistant.text) && /\d/.test(message))
}

/** Rough monthly estimate when the visitor mentions subscriber numbers or hotspot revenue. */
export function estimateFromMessage(message: string, history: { role: string; text: string }[] = []) {
  if (!wantsEstimate(message, history)) return null
  const text = message.toLowerCase()
  const subscribers = text.match(/(\d[\d,]*)\s*(?:pppoe|home|monthly|subscribers?|customers?|clients?|users?)/)
  const hotspot = text.match(/hotspot[^\d]{0,30}(\d[\d,]*\s*k?)|(\d[\d,]*\s*k?)\s*(?:kes|ksh)?\s*(?:of\s+)?hotspot/)
  const pppoeCount = subscribers ? parseAmount(subscribers[1]) : 0
  const hotspotRevenue = hotspot ? parseAmount(hotspot[1] || hotspot[2]) : 0
  if (!pppoeCount && !hotspotRevenue) return null
  const usage = pppoeCount * PRICING.perPppoe + hotspotRevenue * (PRICING.hotspotPercent / 100)
  const total = Math.max(PRICING.monthlyMinimum, Math.round(usage))
  const parts = [
    pppoeCount ? `${pppoeCount.toLocaleString("en-KE")} PPPoE subscribers × KSh ${PRICING.perPppoe} = KSh ${(pppoeCount * PRICING.perPppoe).toLocaleString("en-KE")}` : "",
    hotspotRevenue ? `${PRICING.hotspotPercent}% of KSh ${hotspotRevenue.toLocaleString("en-KE")} hotspot revenue = KSh ${Math.round(hotspotRevenue * PRICING.hotspotPercent / 100).toLocaleString("en-KE")}` : "",
  ].filter(Boolean)
  return `Here's a quick estimate:\n\n${parts.map((part) => `- ${part}`).join("\n")}\n\nThat's about **KSh ${total.toLocaleString("en-KE")} per month**${usage < PRICING.monthlyMinimum ? ` (the KSh ${PRICING.monthlyMinimum} minimum applies)` : ""}, with unlimited routers. The pricing calculator gives the exact figure.`
}

/** Built-in reply used when no AI provider is configured or it fails. */
export function localReply(message: string, history: { role: string; text: string }[] = []) {
  const trimmed = message.trim()
  const estimate = estimateFromMessage(trimmed, history)
  if (estimate) {
    return { answer: estimate, topics: [SALES_TOPICS.find((topic) => topic.id === "pricing")!] }
  }
  const ranked = rankTopics(trimmed)
  if (ranked.length) {
    const [first, second] = ranked
    // Only combine two answers when the question clearly covers both.
    const combine = second && second.score >= 4
    const answer = combine
      ? `${first.topic.answer}\n\n${second.topic.answer.replace(/^(Yes[.,]?|Great fit\.|Absolutely\.|Good news:|It does\.)\s*/i, "")}`
      : first.topic.answer
    return { answer, topics: combine ? [first.topic, second.topic] : [first.topic] }
  }
  if (GREETING.test(trimmed)) {
    return {
      answer: "Hi! 👋 I'm the Internetily assistant. Tell me what you want your ISP system to do, for example *auto-reconnect customers after M-Pesa payment* or *sell hotspot vouchers*, and I'll show you how Internetily handles it.",
      topics: [],
    }
  }
  if (THANKS.test(trimmed) && history.length) {
    return { answer: "You're welcome! Anything else you'd like your ISP system to handle? When you're ready, you can start a free trial and we'll set it up with you.", topics: [] }
  }
  return {
    answer: "Good question, and the kind of thing our team loves to walk through with you. Internetily brings **M-Pesa billing, MikroTik and RADIUS access, hotspot portals, SMS and support** into one workflow, so most ISP tasks run on their own. Could you tell me a little more about your network, like roughly how many subscribers you have and whether you run PPPoE, hotspot or both?",
    topics: [],
  }
}

/** Plain-text knowledge for the AI provider prompt. */
export function knowledgeText() {
  return [
    `Pricing: KSh ${PRICING.monthlyMinimum}/month minimum; KSh ${PRICING.perPppoe} per billable PPPoE subscriber; ${PRICING.hotspotPercent}% of confirmed hotspot revenue; unlimited routers; one-time KSh ${PRICING.activation} activation after the trial; custom pricing for large deployments.`,
    `Trial: ${PRICING.trialDays} days, no credit card. A read-only demo workspace is at https://demo.netily.co.ke/admin/login.`,
    ...SALES_TOPICS.map((topic) => `${topic.id}: ${topic.answer.replace(/\*\*/g, "")}`),
  ].join("\n")
}
