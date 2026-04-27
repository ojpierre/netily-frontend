// ─── Blog Content Types ────────────────────────────────────────────────────

export type ContentBlock =
  | { type: "h2"; text: string; id: string }
  | { type: "h3"; text: string }
  | { type: "p"; html: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "callout"; variant: "tip" | "info" | "warning"; title: string; text: string }
  | { type: "cta" }
  | { type: "hr" }

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  coverGradient: string
  category: string
  categoryColor: "blue" | "emerald" | "orange" | "purple"
  readTime: number
  publishedAt: string
  updatedAt: string
  author: {
    name: string
    role: string
    initials: string
    avatarBg: string
  }
  tags: string[]
  metaTitle: string
  metaDescription: string
  keywords: string[]
  toc: { id: string; text: string }[]
  content: ContentBlock[]
}

// ─── Blog Posts ────────────────────────────────────────────────────────────

export const blogPosts: BlogPost[] = [
  // ── Article 1: Buyer's Guide ──────────────────────────────────────────────
  {
    slug: "isp-billing-software-kenya-2026",
    title: "ISP Billing Software in Kenya 2026: The Complete Buyer's Guide",
    excerpt:
      "Choosing ISP billing software in Kenya is harder than it looks. Most options weren't built for M-Pesa or MikroTik. This guide compares every serious option and tells you exactly what to look for before you buy.",
    coverGradient: "from-blue-600 via-indigo-600 to-purple-700",
    category: "Buyer's Guide",
    categoryColor: "blue",
    readTime: 9,
    publishedAt: "2026-04-10",
    updatedAt: "2026-04-27",
    author: {
      name: "Peter Junior",
      role: "ISP Software Specialist",
      initials: "PJ",
      avatarBg: "bg-blue-600",
    },
    tags: ["ISP Billing", "Kenya", "MikroTik", "M-Pesa", "Comparison"],
    metaTitle: "Best ISP Billing Software in Kenya 2026: Complete Comparison | Netily",
    metaDescription:
      "The complete buyer's guide to ISP billing software in Kenya. Compare Netily, Splynx, WHMCS, ZAL and manual billing. Find the best ISP management system for your Kenyan or East African ISP.",
    keywords: [
      "isp billing software kenya",
      "best isp billing software in kenya",
      "isp billing software",
      "isp management software kenya",
      "splynx alternative kenya",
      "whmcs isp billing",
      "best isp billing software",
      "isp management system",
    ],
    toc: [
      { id: "what-is-isp-billing-software", text: "What is ISP Billing Software?" },
      { id: "kenyan-isp-requirements", text: "Why Kenya Needs Different ISP Software" },
      { id: "must-have-features", text: "9 Must-Have Features for Kenyan ISPs" },
      { id: "comparison", text: "ISP Billing Software Comparison 2026" },
      { id: "how-to-choose", text: "How to Choose the Right System" },
      { id: "faq", text: "Frequently Asked Questions" },
    ],
    content: [
      {
        type: "p",
        html: "If you run an ISP in Kenya, you've probably searched <strong>\"ISP billing software Kenya\"</strong> and landed on a list of tools built for European or American networks — priced in dollars, with no concept of M-Pesa, and sales teams in time zones that don't care about your 2am support call. This guide cuts through that.",
      },
      {
        type: "p",
        html: "We'll compare every serious ISP billing software option available to Kenyan ISPs in 2026, explain what features actually matter, and help you avoid the expensive mistakes most ISPs make when switching billing systems.",
      },

      // H2: What is ISP billing software?
      { type: "h2", text: "What is ISP Billing Software?", id: "what-is-isp-billing-software" },
      {
        type: "p",
        html: "<strong>ISP billing software</strong> is a platform that automates the core financial and operational workflows of an internet service provider: subscriber onboarding, invoicing, payment collection, internet access control (via MikroTik or RADIUS), and customer self-service.",
      },
      {
        type: "p",
        html: "A modern ISP management system connects directly to your routers, authenticates subscribers via RADIUS, processes payments automatically, and gives your team a single dashboard to manage everything. The goal: your network runs itself, and you focus on growth.",
      },
      {
        type: "ul",
        items: [
          "Subscriber onboarding and lifecycle management",
          "Automated monthly invoice and receipt generation",
          "Payment collection — M-Pesa STK Push, Airtel Money, bank transfer",
          "Router provisioning — create PPPoE accounts, set bandwidth policies, suspend/reactivate automatically",
          "RADIUS authentication for PPPoE and Wi-Fi hotspot networks",
          "Customer self-service portal (pay, check usage, manage account)",
          "SMS and email payment reminders",
          "Revenue analytics and churn reporting",
        ],
      },

      // H2: Why Kenya needs different software
      { type: "h2", text: "Why Kenyan ISPs Need Different ISP Software", id: "kenyan-isp-requirements" },
      {
        type: "p",
        html: "The reality for most Kenyan ISPs is that <strong>over 90% of customer payments arrive via M-Pesa</strong>. International ISP billing platforms treat M-Pesa as an afterthought — if they support it at all — which forces ISPs to manually reconcile M-Pesa statements every day. At 50 subscribers this is inconvenient. At 300 subscribers it's a full-time job.",
      },
      {
        type: "p",
        html: "Similarly, <strong>MikroTik routers power the vast majority of Kenyan ISP infrastructure</strong>. Affordable, flexible, and battle-tested across thousands of East African networks, MikroTik's RouterOS is the backbone of fiber, wireless, and hotspot ISPs across Kenya. Your billing software needs to talk to MikroTik natively via the RouterOS API — not through hacky scripts on the router itself.",
      },
      {
        type: "callout",
        variant: "info",
        title: "The Kenya-specific checklist",
        text: "Before evaluating any ISP billing software, confirm it supports: (1) M-Pesa STK Push — not just paybill, (2) MikroTik RouterOS API integration, (3) KES pricing and local support, (4) automated subscriber suspension and reactivation.",
      },

      // H2: Must-have features
      { type: "h2", text: "9 Must-Have Features for Kenyan ISP Billing Software", id: "must-have-features" },
      {
        type: "ol",
        items: [
          "<strong>M-Pesa STK Push integration</strong> — The subscriber gets a payment prompt on their phone. They pay. Their internet activates within seconds. No manual reconciliation, no statements to download.",
          "<strong>MikroTik RouterOS API integration</strong> — Create PPPoE accounts, set bandwidth policies, suspend and reactivate subscribers automatically directly from the billing dashboard.",
          "<strong>RADIUS authentication</strong> — For PPPoE and hotspot networks. Must support FreeRADIUS or built-in RADIUS server.",
          "<strong>Automated subscriber suspension on expiry</strong> — When a subscription lapses and no payment is received, internet access is suspended automatically, then restored the moment payment is confirmed.",
          "<strong>Customer self-service portal</strong> — Subscribers pay, check data usage, and manage their account without calling your support line. Cuts support costs by 60–80%.",
          "<strong>Automated SMS and email reminders</strong> — Payment reminders 3 days before expiry, on the day, and after expiry. Reduces churn without any manual effort.",
          "<strong>Hotspot / captive portal support</strong> — For Wi-Fi hotspot ISPs. Branded captive portal with M-Pesa payment and session management.",
          "<strong>KES pricing and local support</strong> — Software priced in USD adds currency risk and hidden cost as you scale. Local support means someone answers when your billing goes down at 10pm.",
          "<strong>Multi-router support</strong> — If you have towers or base stations in multiple locations, the software must manage all MikroTik routers from a single dashboard.",
        ],
      },

      // H2: Comparison
      { type: "h2", text: "ISP Billing Software Comparison 2026", id: "comparison" },
      {
        type: "p",
        html: "Here's how the main ISP billing software options compare for Kenyan and East African ISPs:",
      },
      {
        type: "table",
        headers: ["Software", "M-Pesa STK Push", "MikroTik API", "RADIUS", "Pricing", "Best For"],
        rows: [
          ["Netily", "✅ Native", "✅ Native", "✅ Yes", "KES 500/mo + KES 20/user", "Kenyan & East African ISPs"],
          ["Splynx", "❌ No", "✅ Yes", "✅ Yes", "$39–$89/mo USD", "European / large ISPs"],
          ["WHMCS", "❌ No", "⚠️ Plugin only", "⚠️ Plugin", "$15.95–$39.95/mo USD", "Web hosting companies"],
          ["ZAL ISP System", "❌ No", "✅ Yes", "✅ Yes", "Free (self-hosted)", "ISPs with a developer on staff"],
          ["Manual (Excel/M-Pesa)", "—", "—", "—", "Free (high hidden cost)", "Very early-stage ISPs only"],
        ],
      },
      {
        type: "p",
        html: "<strong>The verdict:</strong> Netily is the only option with native M-Pesa STK Push and MikroTik integration, priced in KES. Splynx is excellent for large ISPs but requires a custom M-Pesa integration. ZAL is free but demands significant technical expertise to deploy and maintain.",
      },

      { type: "h3", text: "Splynx vs Netily for Kenyan ISPs" },
      {
        type: "p",
        html: "Splynx is a well-respected European ISP billing platform with excellent MikroTik support and a polished interface. However, <strong>Splynx has no native M-Pesa integration</strong> — you'd need to build or buy a separate M-Pesa plugin. It's also priced in USD ($39–$89/month) which becomes expensive as your subscriber base grows, and their support team is in European time zones. For Kenyan ISPs under 300 subscribers, the total cost of ownership makes Netily the better choice.",
      },

      { type: "h3", text: "WHMCS for ISP Billing: Does It Work?" },
      {
        type: "p",
        html: "WHMCS is web hosting billing software that some ISPs repurpose for subscriber management. <strong>WHMCS is not designed for ISPs</strong>. MikroTik and RADIUS support require paid third-party plugins, M-Pesa integration is not native, and automatic subscriber suspension/reactivation is not built-in. It can be made to work, but at significant added cost and complexity — and you'll spend more time maintaining integrations than running your ISP.",
      },

      { type: "h3", text: "ZAL ISP Management System: The Free Open Source Option" },
      {
        type: "p",
        html: "ZAL ISP Management System is an open-source PHP ISP billing system with MikroTik API support. It's free under its license. However, <strong>ZAL has no M-Pesa integration, requires you to host and maintain your own server, and has limited active development</strong>. For ISPs with a developer on staff who want full infrastructure control, ZAL is a legitimate option. For everyone else, the hidden costs of self-hosting, maintenance, and building M-Pesa integration typically exceed the cost of a commercial platform. We cover this in detail in our <a href='/blog/free-isp-billing-software-kenya' class='text-blue-600 hover:underline font-medium'>free ISP billing software guide</a>.",
      },

      // H2: How to choose
      { type: "h2", text: "How to Choose the Right ISP Billing Software", id: "how-to-choose" },
      { type: "p", html: "Use this five-question decision framework:" },
      {
        type: "ol",
        items: [
          "<strong>Do you have a developer on staff?</strong> If yes, ZAL (self-hosted open source) is worth evaluating. If no, you need a managed SaaS solution that someone else maintains.",
          "<strong>Do your subscribers pay via M-Pesa?</strong> If yes — which is true for 95%+ of Kenyan ISPs — you need native M-Pesa STK Push, not a bolt-on integration.",
          "<strong>Do you use MikroTik routers?</strong> If yes, confirm the software has native RouterOS API support, not just a plugin or script.",
          "<strong>What is your subscriber count today and in 12 months?</strong> Calculate the per-subscriber cost of each option at both numbers to find the real price.",
          "<strong>Do you run Wi-Fi hotspots?</strong> If yes, confirm the billing software includes a branded captive portal with M-Pesa.",
        ],
      },
      {
        type: "callout",
        variant: "tip",
        title: "Start with a 14-day free trial",
        text: "Netily offers a 14-day free trial with no credit card required. You get full access to MikroTik integration, M-Pesa STK Push, subscriber portal, and billing automation before committing to anything.",
      },

      // H2: FAQ
      { type: "h2", text: "Frequently Asked Questions", id: "faq" },
      { type: "h3", text: "What is the best ISP billing software in Kenya?" },
      {
        type: "p",
        html: "For most Kenyan ISPs — especially those running MikroTik infrastructure with M-Pesa-paying subscribers — <strong>Netily</strong> is the best option. It's the only platform built specifically for the Kenyan ISP market with native M-Pesa STK Push and MikroTik API integration, priced in KES with local support.",
      },
      { type: "h3", text: "Is there free ISP billing software for MikroTik?" },
      {
        type: "p",
        html: "Yes — ZAL ISP Management System is a free open-source option with MikroTik API support. However, it requires self-hosting, has no M-Pesa integration, and demands ongoing technical maintenance. Read our <a href='/blog/free-isp-billing-software-kenya' class='text-blue-600 hover:underline font-medium'>complete guide to free ISP billing software</a> for the real cost breakdown.",
      },
      { type: "h3", text: "Can I migrate from manual billing to Netily without downtime?" },
      {
        type: "p",
        html: "Yes. Netily's onboarding process imports your existing subscriber data and connects to your MikroTik routers without network downtime. Most ISPs complete the full migration in under 24 hours during an onboarding call with the Netily team.",
      },

      { type: "hr" },
      { type: "cta" },
    ],
  },

  // ── Article 2: MikroTik + M-Pesa Guide ───────────────────────────────────
  {
    slug: "mikrotik-isp-billing-mpesa-automation",
    title: "MikroTik ISP Billing & M-Pesa Automation: The Complete Guide for Kenyan ISPs",
    excerpt:
      "Most Kenyan ISPs run on MikroTik. Most subscribers pay via M-Pesa. Yet most ISPs still reconcile these manually every day. Here's exactly how to automate the entire billing pipeline — and what it's worth to your business.",
    coverGradient: "from-emerald-500 via-teal-600 to-cyan-700",
    category: "Tutorial",
    categoryColor: "emerald",
    readTime: 8,
    publishedAt: "2026-04-17",
    updatedAt: "2026-04-27",
    author: {
      name: "Peter Junior",
      role: "ISP Software Specialist",
      initials: "PJ",
      avatarBg: "bg-emerald-600",
    },
    tags: ["MikroTik", "M-Pesa", "PPPoE", "Automation", "Tutorial"],
    metaTitle: "MikroTik ISP Billing with M-Pesa Automation: Step-by-Step Guide | Netily",
    metaDescription:
      "Learn how to fully automate MikroTik ISP billing with M-Pesa STK Push. Step-by-step guide for Kenyan ISPs running PPPoE and Hotspot on MikroTik RouterOS. Eliminate manual reconciliation.",
    keywords: [
      "mikrotik isp management software",
      "isp billing software mikrotik",
      "free isp billing software for mikrotik",
      "mikrotik isp billing software",
      "mikrotik isp management",
      "mpesa mikrotik integration",
      "pppoe billing kenya",
      "isp management system with mikrotik api",
    ],
    toc: [
      { id: "mikrotik-kenya", text: "Why MikroTik Dominates Kenyan ISPs" },
      { id: "manual-billing-problem", text: "The Manual Billing Problem" },
      { id: "how-automation-works", text: "How MikroTik + M-Pesa Automation Works" },
      { id: "key-features", text: "Key Features to Look For" },
      { id: "setup-overview", text: "Setup Overview (3 Steps)" },
      { id: "results", text: "Real Results from Automated ISPs" },
    ],
    content: [
      {
        type: "p",
        html: "If you're running an ISP in Kenya, there's a strong chance your network infrastructure runs on <strong>MikroTik routers</strong> and your subscribers pay via <strong>M-Pesa</strong>. What many ISP owners don't realise is that these two systems can be connected in real time — so that when a subscriber pays on M-Pesa, their PPPoE or Hotspot access is provisioned or restored automatically, with zero manual intervention.",
      },
      {
        type: "p",
        html: "This guide explains exactly how that automation works, what to look for in MikroTik ISP management software, and how to set it up for your ISP.",
      },

      // H2: Why MikroTik dominates
      { type: "h2", text: "Why MikroTik Dominates Kenyan ISP Infrastructure", id: "mikrotik-kenya" },
      {
        type: "p",
        html: "MikroTik RouterOS is the de facto standard for ISP infrastructure across Kenya and East Africa. The reasons are straightforward:",
      },
      {
        type: "ul",
        items: [
          "<strong>Cost</strong> — A MikroTik router costs a fraction of equivalent Cisco or Juniper hardware, making it accessible for small and growing ISPs",
          "<strong>Flexibility</strong> — RouterOS supports PPPoE, Hotspot, VLAN, QoS, RADIUS, and bandwidth shaping natively",
          "<strong>Reliability</strong> — MikroTik equipment is proven across thousands of ISP deployments across Kenya, Uganda, Tanzania, and Rwanda",
          "<strong>RouterOS API</strong> — MikroTik exposes a fully-featured remote API that external billing software can use to manage subscribers, bandwidth profiles, and sessions programmatically",
        ],
      },
      {
        type: "p",
        html: "That last point — the RouterOS API — is what makes complete billing automation possible. Any ISP billing software worth using must implement this API natively, not via a script running on the router itself.",
      },

      // H2: Manual billing problem
      { type: "h2", text: "The Manual Billing Problem Facing Kenyan ISPs", id: "manual-billing-problem" },
      {
        type: "p",
        html: "Without automation, the typical Kenyan ISP billing workflow looks like this:",
      },
      {
        type: "ol",
        items: [
          "Subscriber pays via M-Pesa paybill or till number",
          "ISP operator downloads the M-Pesa statement at end of day (or checks WhatsApp)",
          "Operator cross-references payments against the subscriber list in Excel",
          "Operator logs into MikroTik Winbox and manually enables the subscriber's PPPoE account",
          "Operator sends a WhatsApp message to the subscriber confirming activation",
          "Repeat this 50–500 times every month",
        ],
      },
      {
        type: "p",
        html: "This process is <strong>slow, error-prone, and fundamentally unscalable</strong>. It creates two critical problems: subscribers who wait hours for internet restoration after paying, and an operations team spending most of their time on manual tasks instead of growing the business.",
      },
      {
        type: "callout",
        variant: "warning",
        title: "The scaling cliff",
        text: "At 100 subscribers, manual billing is frustrating. At 300 subscribers, it's a full-time job. At 500+ subscribers, it's impossible to manage without dedicated billing staff — unless you automate.",
      },

      // H2: How automation works
      { type: "h2", text: "How MikroTik + M-Pesa Automation Works End-to-End", id: "how-automation-works" },
      {
        type: "p",
        html: "A proper ISP billing software connects M-Pesa and MikroTik into a single real-time pipeline. Here's the complete flow:",
      },
      {
        type: "ol",
        items: [
          "<strong>Payment is initiated</strong> — The subscriber receives an automated M-Pesa STK Push prompt on their phone (sent by the billing system 3 days before expiry) or initiates payment themselves from the customer self-service portal",
          "<strong>M-Pesa STK Push is triggered</strong> — The billing software sends a payment request to the subscriber's phone via Safaricom Daraja API. The subscriber enters their M-Pesa PIN to confirm",
          "<strong>Daraja API callback received</strong> — Within seconds of payment confirmation, Safaricom sends a transaction callback to the billing software with the transaction ID, amount, and MSISDN",
          "<strong>Subscription renewed</strong> — The billing software validates the payment amount, updates the subscriber's expiry date, marks the invoice paid, and generates a receipt",
          "<strong>MikroTik RouterOS API call</strong> — The billing software immediately calls the MikroTik API: if the subscriber was suspended, their PPPoE account is re-enabled with the correct bandwidth profile; if they're new, a fresh PPPoE account is created",
          "<strong>Confirmation SMS sent</strong> — An SMS is automatically dispatched to the subscriber confirming their internet access is active",
        ],
      },
      {
        type: "p",
        html: "The entire pipeline — from M-Pesa payment to internet activation — executes in <strong>under 10 seconds</strong>.",
      },

      // H2: Key features
      { type: "h2", text: "Key Features to Look For in MikroTik ISP Management Software", id: "key-features" },
      {
        type: "table",
        headers: ["Feature", "What to Check"],
        rows: [
          ["MikroTik API integration", "Uses native RouterOS API on port 8728/8729 SSL — not a script on the router"],
          ["PPPoE user management", "Creates, modifies, suspends, and deletes PPPoE accounts automatically via API"],
          ["Bandwidth profile sync", "Pushes QoS speed profiles to MikroTik based on the subscriber's plan tier"],
          ["Hotspot support", "Manages Hotspot users and deploys a branded captive portal with M-Pesa"],
          ["Multiple router support", "Manages multiple MikroTik routers (different towers or zones) from one dashboard"],
          ["M-Pesa STK Push", "Native Daraja API integration — not a third-party plugin or manual paybill"],
          ["Auto-suspend on expiry", "Automatically suspends accounts on expiry and restores on payment"],
          ["Retry logic", "Retries failed M-Pesa STK Push after timeout with sensible backoff"],
        ],
      },

      // H2: Setup overview
      { type: "h2", text: "Setup Overview: Connecting MikroTik to Your ISP Billing System", id: "setup-overview" },
      {
        type: "p",
        html: "Setting up MikroTik integration with a billing platform like Netily is a three-step process:",
      },
      {
        type: "ol",
        items: [
          "<strong>Enable RouterOS API on your MikroTik router</strong> — Go to IP → Services and enable 'api' (port 8728) or 'api-ssl' (port 8729). Create a dedicated API user with read/write permissions. This is a one-time configuration per router.",
          "<strong>Add your router to the billing dashboard</strong> — Enter the router's IP address, API port, and API credentials. The billing software verifies the connection and pulls your existing PPPoE/Hotspot profiles.",
          "<strong>Map plans to bandwidth profiles</strong> — In the billing dashboard, map each subscription plan (e.g., 'Home 10Mbps') to the corresponding MikroTik PPPoE profile. The software uses these mappings when creating or modifying subscriber accounts.",
        ],
      },
      {
        type: "p",
        html: "After setup, <strong>every new subscriber you add in the billing dashboard automatically gets a MikroTik PPPoE account created</strong>. Every payment triggers activation. Every expiry triggers suspension. Your MikroTik routers essentially manage themselves.",
      },
      {
        type: "callout",
        variant: "tip",
        title: "Multiple towers and routers",
        text: "If you have MikroTik routers at multiple towers, buildings, or zones, you can add all of them to your billing dashboard and assign each subscriber to the correct router. The billing software handles each router independently via the same API.",
      },

      // H2: Results
      { type: "h2", text: "Real Results from ISPs Using MikroTik + M-Pesa Automation", id: "results" },
      {
        type: "p",
        html: "ISPs that move from manual billing to automated MikroTik + M-Pesa billing consistently report:",
      },
      {
        type: "ul",
        items: [
          "<strong>80–90% reduction in billing support calls</strong> — Subscribers no longer need to call or WhatsApp to confirm payment and request account reactivation",
          "<strong>Payment confirmation in under 10 seconds</strong> versus 2–24 hours with manual M-Pesa statement reconciliation",
          "<strong>20–35% reduction in subscriber churn</strong> — Automated payment reminders catch subscribers before they disconnect and move to a competitor",
          "<strong>Operations staff freed from billing tasks</strong> — They focus on network maintenance, sales, and customer quality instead of daily billing",
          "<strong>Zero missed or mis-attributed payments</strong> — Every M-Pesa transaction is captured and linked to the correct subscriber automatically",
        ],
      },
      {
        type: "p",
        html: "For a 200-subscriber ISP spending 2 hours/day on manual billing, automation typically saves <strong>700+ staff hours per year</strong> — the equivalent of a part-time employee.",
      },

      { type: "hr" },
      { type: "cta" },
    ],
  },

  // ── Article 3: Free ISP Billing Software ─────────────────────────────────
  {
    slug: "free-isp-billing-software-kenya",
    title: "Free ISP Billing Software in 2026: What Kenyan ISPs Really Need to Know",
    excerpt:
      "Free ISP billing software sounds excellent until you actually run an ISP and discover what 'free' really costs. An honest, detailed breakdown of every free option — and the real numbers you need to make the right decision.",
    coverGradient: "from-orange-500 via-rose-500 to-pink-600",
    category: "Analysis",
    categoryColor: "orange",
    readTime: 7,
    publishedAt: "2026-04-24",
    updatedAt: "2026-04-27",
    author: {
      name: "Peter Junior",
      role: "ISP Software Specialist",
      initials: "PJ",
      avatarBg: "bg-orange-600",
    },
    tags: ["Free Software", "Open Source", "Cost Analysis", "Comparison", "ZAL"],
    metaTitle: "Free ISP Billing Software 2026: The Honest Review for Kenyan ISPs | Netily",
    metaDescription:
      "Is free ISP billing software actually free? We review every free and open source ISP billing option in 2026 — ZAL, FreeRADIUS, homegrown scripts — and calculate the real total cost for Kenyan ISPs.",
    keywords: [
      "free isp billing software",
      "isp billing software free",
      "open source isp billing software",
      "free isp management software",
      "free isp management system",
      "isp billing software open source",
      "isp billing software free download",
      "isp billing software github",
      "zal isp management system",
    ],
    toc: [
      { id: "what-free-exists", text: "Free ISP Billing Software That Actually Exists" },
      { id: "true-cost", text: "The True Cost of Free ISP Software" },
      { id: "feature-gaps", text: "Feature Gaps for Kenyan ISPs" },
      { id: "tco-comparison", text: "Total Cost of Ownership (12 Months)" },
      { id: "when-free-works", text: "When Free ISP Software Makes Sense" },
      { id: "recommendation", text: "The Bottom Line" },
    ],
    content: [
      {
        type: "p",
        html: "<strong>\"Free ISP billing software\"</strong> is one of the most searched terms by ISP owners — and for good reason. ISP software can be expensive, especially when you're starting out or running a lean network. But 'free' in software rarely means what it says, and for ISP billing specifically, the hidden costs can be substantial.",
      },
      {
        type: "p",
        html: "This is an honest, unsponsored breakdown of every free ISP billing software option available in 2026 — what they offer, what they don't, and what they actually cost when you factor in server infrastructure, engineering time, and the features you'll still need to build yourself.",
      },

      // H2: What free actually exists
      { type: "h2", text: "Free ISP Billing Software That Actually Exists in 2026", id: "what-free-exists" },
      {
        type: "p",
        html: "There are four categories of 'free' ISP billing software, and they're very different from each other:",
      },

      { type: "h3", text: "1. ZAL ISP Management System (Open Source)" },
      {
        type: "p",
        html: "<strong>ZAL ISP Management System</strong> is a PHP-based open-source ISP billing system with MikroTik API integration. It supports PPPoE subscriber management, invoice generation, and basic reporting. It's one of the most widely forked ISP billing repositories on GitHub.",
      },
      {
        type: "p",
        html: "<strong>What it includes:</strong> MikroTik API integration, PPPoE subscriber management, basic invoice generation, plan management, and a simple admin dashboard.",
      },
      {
        type: "p",
        html: "<strong>What it doesn't include:</strong> M-Pesa STK Push (or any payment gateway), automated billing/suspension, hotspot captive portal, SMS notifications, customer self-service portal, or commercial support. Active development is slow.",
      },

      { type: "h3", text: "2. FreeRADIUS (Authentication Only — Not a Billing System)" },
      {
        type: "p",
        html: "<strong>FreeRADIUS</strong> is an authentication server, not billing software. It handles the RADIUS protocol that grants or denies internet access to PPPoE and Hotspot subscribers. It's free, open-source, and used by virtually every ISP worldwide. But FreeRADIUS alone provides zero billing functionality — you still need subscriber management, invoicing, and payment processing on top of it.",
      },

      { type: "h3", text: "3. WHMCS (Not Free, Not Designed for ISPs)" },
      {
        type: "p",
        html: "<strong>WHMCS</strong> is a web hosting billing platform sometimes repurposed for ISPs. It is not free — it starts at $15.95/month USD. It is also not designed for ISPs: MikroTik and RADIUS support require paid third-party plugins, and M-Pesa integration is not available. We include it here because it comes up in ISP billing searches, but it's not a genuine option for most Kenyan ISPs.",
      },

      { type: "h3", text: "4. Homegrown Scripts, Excel, and Cobbled-Together Workflows" },
      {
        type: "p",
        html: "Many ISPs build their own billing systems using Python scripts, Google Sheets, M-Pesa API, and MikroTik API calls. This is 'free' in the sense that the software costs nothing. But it requires significant development time, breaks when payment APIs update, and creates a single point of failure — usually the developer who built it.",
      },

      // H2: True cost
      { type: "h2", text: "The True Cost of Free ISP Billing Software", id: "true-cost" },
      {
        type: "p",
        html: "When you choose a self-hosted open-source solution like ZAL, the software license is free — but you need to budget for:",
      },
      {
        type: "ul",
        items: [
          "<strong>VPS or server hosting:</strong> KES 2,000–6,000/month for a reliable server (shared hosting is not appropriate for ISP billing systems that need 24/7 uptime)",
          "<strong>SSL certificate and domain:</strong> KES 1,500–4,000/year",
          "<strong>Setup and configuration time:</strong> 20–40 hours to install, configure, customise, and test — at KES 3,000–6,000/hour for a competent developer = KES 60,000–240,000 one-time",
          "<strong>M-Pesa integration (build your own):</strong> ZAL includes no payment gateway. Implementing Safaricom Daraja API STK Push from scratch: 30–60 hours = KES 90,000–360,000",
          "<strong>Ongoing maintenance:</strong> 5–15 hours/month for updates, security patches, bug fixes, and server maintenance = KES 15,000–90,000/month",
          "<strong>No commercial support:</strong> When billing goes down at 11pm on month-end, there's no support team to call",
        ],
      },

      // H2: Feature gaps
      { type: "h2", text: "Feature Gaps: What Free ISP Billing Software Misses for Kenyan ISPs", id: "feature-gaps" },
      {
        type: "table",
        headers: ["Feature", "ZAL (Free)", "Homegrown Script", "Netily (Paid)"],
        rows: [
          ["M-Pesa STK Push", "❌ Not included", "⚠️ Must build yourself", "✅ Native"],
          ["MikroTik API integration", "✅ Included", "⚠️ Must build yourself", "✅ Native"],
          ["Auto-suspend on expiry", "⚠️ Basic", "⚠️ Must build yourself", "✅ Yes"],
          ["Customer self-service portal", "⚠️ Very basic", "❌ Usually absent", "✅ Full portal"],
          ["Automated SMS notifications", "❌ Not included", "⚠️ Must build yourself", "✅ Included"],
          ["Hotspot captive portal", "❌ Not included", "⚠️ Complex to build", "✅ Branded portal"],
          ["Commercial support", "❌ Community forums only", "❌ Internal only", "✅ Chat + phone"],
          ["Active development", "⚠️ Infrequent", "⚠️ Your engineering team", "✅ Regular releases"],
          ["Setup time", "20–40 hours", "60–120 hours", "1–4 hours"],
          ["KES pricing", "N/A (free)", "N/A (internal)", "✅ Yes"],
        ],
      },

      // H2: TCO comparison
      { type: "h2", text: "Total Cost of Ownership: Free vs Paid (First 12 Months)", id: "tco-comparison" },
      {
        type: "table",
        headers: ["Cost Category", "ZAL (Self-Hosted)", "Netily (100 subscribers)"],
        rows: [
          ["Software license", "KES 0", "KES 6,000 base/year"],
          ["Server/hosting infrastructure", "KES 48,000/year", "KES 0 (included in SaaS)"],
          ["Initial setup & customisation", "KES 150,000 (one-time)", "KES 0 (Netily onboards you)"],
          ["M-Pesa STK Push integration", "KES 200,000 (one-time)", "KES 0 (built-in)"],
          ["Ongoing maintenance (monthly)", "KES 30,000/month = KES 360,000/year", "KES 0"],
          ["Per-subscriber cost (100 users)", "KES 0 (flat)", "KES 24,000/year"],
          ["<strong>Year 1 total (100 subscribers)</strong>", "<strong>KES 758,000+</strong>", "<strong>KES 30,000</strong>"],
          ["<strong>Year 2+ annual total</strong>", "<strong>KES 408,000/year</strong>", "<strong>KES 30,000/year</strong>"],
        ],
      },
      {
        type: "p",
        html: "The numbers are stark. <strong>For a 100-subscriber Kenyan ISP, 'free' ISP billing software costs 25x more in Year 1 than a paid managed platform</strong> — when you account for the engineering work required to deploy, integrate M-Pesa, and maintain the system. The gap narrows at very high subscriber counts, but for most ISPs under 500 subscribers, paid SaaS is significantly cheaper.",
      },

      // H2: When free works
      { type: "h2", text: "When Free ISP Billing Software Actually Makes Sense", id: "when-free-works" },
      { type: "p", html: "Free and open-source ISP billing software makes genuine sense when:" },
      {
        type: "ul",
        items: [
          "<strong>You have a full-time developer on staff</strong> who can build, maintain, and support the system as part of their regular role — not as a side project",
          "<strong>Your subscribers do not use M-Pesa</strong> (rare in Kenya, but possible for enterprise B2B ISPs with bank transfer billing)",
          "<strong>You want complete infrastructure ownership</strong> and accept the engineering cost as a strategic trade-off",
          "<strong>You're operating at very large scale</strong> (1,000+ subscribers) where the per-subscriber cost of SaaS becomes significant relative to a single developer's salary",
          "<strong>You're in a market with no good SaaS option</strong> — which is increasingly rare, especially in East Africa",
        ],
      },
      {
        type: "p",
        html: "For the vast majority of Kenyan ISPs — especially those under 500 subscribers without a dedicated engineering team — free ISP billing software is <strong>not actually cheaper than paid software</strong>. It's just a different way of paying, with worse unit economics.",
      },

      // H2: Recommendation
      { type: "h2", text: "The Bottom Line: Our Recommendation by Subscriber Count", id: "recommendation" },
      {
        type: "ol",
        items: [
          "<strong>Under 200 subscribers:</strong> Use Netily's metered plan (KES 500/month base + KES 20/subscriber). The 14-day free trial gives you full access before committing. Total cost at 100 subscribers: KES 2,500/month.",
          "<strong>200–500 subscribers:</strong> Netily remains the most cost-effective option. At 300 subscribers you're paying KES 6,500/month — still a fraction of what maintaining a self-hosted solution costs.",
          "<strong>500–1,000 subscribers:</strong> Evaluate Netily's Enterprise plan for custom pricing, or Splynx with a custom M-Pesa integration if you need specific enterprise features not available in Netily.",
          "<strong>1,000+ subscribers with a dev team:</strong> A self-hosted solution or custom-built system becomes worth evaluating — the per-subscriber cost of SaaS starts to compete with engineering cost at this scale.",
        ],
      },
      {
        type: "callout",
        variant: "tip",
        title: "The 14-day free trial is your real free tier",
        text: "Netily's 14-day free trial gives you full access to all features — MikroTik integration, M-Pesa STK Push, customer portal, and billing automation — with no credit card required. It's the most cost-effective way to evaluate whether paid ISP billing software is right for your ISP.",
      },

      { type: "hr" },
      { type: "cta" },
    ],
  },
]

// ─── Helpers ───────────────────────────────────────────────────────────────

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug)
}

export function getRelatedPosts(slug: string, count = 2): BlogPost[] {
  return blogPosts.filter((p) => p.slug !== slug).slice(0, count)
}
