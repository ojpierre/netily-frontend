import type { BlogPost } from "./blog-data"

// Guides written Nov 2026 for high-intent ISP and hotspot searches in East Africa:
// starting a hotspot business, MikroTik PPPoE with RADIUS, M-Pesa payments that do not
// reconnect, selling vouchers through agents, and public IPs / CGNAT.

const author = {
  name: "Internetily Editorial Team",
  role: "ISP Network Operations",
  initials: "IN",
  avatarBg: "bg-blue-600",
}

const published = "2026-11-26"

export const tractionGuides: BlogPost[] = [
  {
  slug: "start-wifi-hotspot-business-kenya-2026",
  title: "How to Start a WiFi Hotspot Business in Kenya (2026): Costs, Equipment and Profit",
  excerpt:
    "A practical guide to starting a paid WiFi hotspot in Kenya: where to set up, what the equipment costs in KSh, how to price packages, and a worked monthly profit and break-even example.",
  coverGradient: "from-orange-500 to-amber-600",
  coverImage: "/academy/hotspot-wifi.webp",
  coverImageAlt: "A MikroTik-powered WiFi hotspot access point mounted on a pole in a Kenyan residential estate",
  category: "Business Growth",
  categoryColor: "orange",
  readTime: 9,
  publishedAt: published,
  updatedAt: published,
  author,
  tags: ["WiFi hotspot business", "Kenya", "Startup costs", "MikroTik", "M-Pesa", "Hotspot pricing"],
  metaTitle: "How to Start a WiFi Hotspot Business in Kenya (2026)",
  metaDescription:
    "How to start a wifi hotspot business in Kenya: startup costs in KSh, equipment list, licensing, package pricing and a worked monthly profit example.",
  keywords: [
    "how to start a wifi hotspot business in kenya",
    "wifi hotspot business startup cost kenya",
    "is wifi hotspot business profitable in kenya",
    "equipment needed for wifi hotspot business",
    "CA licence for wifi hotspot kenya",
    "best location for wifi hotspot business",
    "how much does it cost to start a hotspot business in kenya",
    "mikrotik hotspot setup for business kenya",
    "how to sell wifi by the hour with mpesa",
    "wifi hotspot business plan kenya",
  ],
  spatialCoverage: ["Kenya"],
  sources: [
    { title: "Communications Authority of Kenya", url: "https://www.ca.go.ke/", publisher: "Communications Authority of Kenya" },
    { title: "RouterOS documentation", url: "https://help.mikrotik.com/docs/", publisher: "MikroTik" },
    { title: "Daraja developer portal (M-Pesa APIs)", url: "https://developer.safaricom.co.ke/", publisher: "Safaricom" },
  ],
  faqs: [
    {
      question: "How much does it cost to start a wifi hotspot business in Kenya?",
      answer:
        "Expect roughly KSh 27,000 to KSh 130,000 for a first site. The low end is one MikroTik router, one access point, an existing fibre line and a small UPS. The high end adds several outdoor access points, a wireless backhaul link and bigger power backup. Prices vary by dealer and by how much cabling and mounting your site needs.",
    },
    {
      question: "Is a wifi hotspot business profitable in Kenya?",
      answer:
        "It can be, but only where enough people pay every day. In the worked example in this article, 60 paying sessions a day at an average of KSh 20 leaves about KSh 21,000 a month after costs. At 25 sessions a day the same site barely breaks even. Location and backhaul cost decide the result more than the equipment does.",
    },
    {
      question: "Do I need a licence from the Communications Authority to run a wifi hotspot in Kenya?",
      answer:
        "It depends on what you offer and how. Selling internet access to the public is a regulated activity, and the rules and categories change. Check the current requirements with the Communications Authority of Kenya (ca.go.ke) before you sell, and read our licensing framework guide for the structure.",
    },
    {
      question: "What equipment do I need for a wifi hotspot business?",
      answer:
        "You need a router that runs the hotspot (a MikroTik hEX or hAP class device is common), one or more outdoor access points, an internet backhaul such as business fibre or a wireless link, a UPS or battery backup, PoE injectors, outdoor-rated cable and mounting hardware. You also need billing software to take M-Pesa payments and grant access.",
    },
    {
      question: "What is the best location for a wifi hotspot business in Kenya?",
      answer:
        "The best locations are dense places where many people wait or live without good home internet: rental estates, student hostels, markets and matatu stages. Pick a site where people spend hours, not minutes, where you can mount an access point high, and where you can get reliable power and backhaul.",
    },
    {
      question: "How should I price wifi hotspot packages in Kenya?",
      answer:
        "Use a short ladder of time-based packages, for example KSh 10 for one hour, KSh 20 for three hours, KSh 50 for a day and KSh 250 for a week. Cheap entry packages bring in first-time users, and day or week packages raise your average spend. Adjust prices after watching what your first 30 days of sales show.",
    },
  ],
  toc: [
    { id: "short-answer", text: "How do you start a wifi hotspot business in Kenya?" },
    { id: "choose-location", text: "What is the best location for a wifi hotspot business?" },
    { id: "test-demand", text: "How do you test demand before buying equipment?" },
    { id: "licensing", text: "Do you need a CA licence for a wifi hotspot in Kenya?" },
    { id: "equipment-and-startup-cost", text: "Equipment needed and wifi hotspot business startup cost in Kenya" },
    { id: "backhaul", text: "Which backhaul should you use?" },
    { id: "package-pricing", text: "How should you price hotspot packages?" },
    { id: "getting-paid", text: "How do you get paid?" },
    { id: "profit-example", text: "Is a wifi hotspot business profitable in Kenya? A worked example" },
    { id: "first-30-days", text: "Your first 30 days checklist" },
    { id: "mistakes", text: "Mistakes that kill hotspot businesses" },
    { id: "faq", text: "Frequently asked questions" },
  ],
  content: [
    { type: "h2", id: "short-answer", text: "How do you start a wifi hotspot business in Kenya?" },
    {
      type: "p",
      html: "<strong>To start a WiFi hotspot business in Kenya, choose a dense location, test demand cheaply, then buy a MikroTik router, outdoor access points, backhaul and a UPS. Budget about KSh 27,000 to KSh 130,000, sell time-based packages through M-Pesa, and confirm licensing with the Communications Authority.</strong>",
    },
    {
      type: "p",
      html: "A wifi hotspot business sells internet access by time or data to people who do not have, or do not want, a monthly contract. In Kenya that means students, tenants, traders and people waiting for transport. They pay KSh 10 to KSh 250 at a time from their phones. The model is simple. What goes wrong is the location, the backhaul and the numbers, so this guide spends its time there.",
    },
    {
      type: "h2",
      id: "choose-location",
      text: "What is the best location for a wifi hotspot business?",
    },
    {
      type: "p",
      html: "The best location for a wifi hotspot business is one where many people spend hours, own smartphones, and have no cheap alternative. Compare the four common choices:",
    },
    {
      type: "table",
      headers: ["Location", "Why it works", "Main risk"],
      rows: [
        ["Rental estates", "Tenants use data daily and will pay weekly. Repeat customers.", "Landlord permission, and tenants who share one password."],
        ["Student hostels", "Heavy evening use, strong week and month demand.", "Heavy video use fills your backhaul. Empty during holidays."],
        ["Markets", "Many traders, long hours, steady foot traffic.", "Spread-out stalls need more access points. Security of equipment."],
        ["Matatu stages", "Constant flow of waiting passengers.", "Short stays mean hour packages only. Power and theft."],
      ],
    },
    {
      type: "p",
      html: "Estates and hostels give you repeat customers. Stages and markets give you volume but a lower average spend. Whichever you pick, ask three questions before you spend a shilling: can you mount an access point high with a clear view of the crowd, can you get stable power, and can you get a backhaul line to that spot?",
    },
    {
      type: "h2",
      id: "test-demand",
      text: "How do you test demand before buying equipment?",
    },
    {
      type: "ol",
      items: [
        "Stand at the site at peak hours (evening for estates and hostels, morning and evening for stages) and count people who are on their phones for more than 30 minutes.",
        "Ask 20 people what they spend on data bundles each week and what annoys them about it. Their weekly bundle spend sets your price ceiling.",
        "Check what already exists. A free WiFi from a shop or a cheap fibre package changes your price.",
        "Run a one-week pilot with one router and one access point you already own or can borrow, selling a single package such as KSh 20 for three hours.",
        "Count paid sessions per day. If you cannot get close to 30 a day in the pilot, do not buy the full kit.",
      ],
    },
    {
      type: "callout",
      variant: "tip",
      title: "Do the demand test first",
      text: "A week of counting and a small pilot costs far less than discovering, after buying KSh 80,000 of equipment, that your site only has 15 paying users a day.",
    },
    {
      type: "h2",
      id: "licensing",
      text: "Do you need a CA licence for a wifi hotspot in Kenya?",
    },
    {
      type: "p",
      html: "The Communications Authority of Kenya (CA) regulates providers of internet and telecommunications services. Whether a small hotspot needs a licence, and which category, depends on what you sell and how you deliver it. Rules and fees change, so we do not quote any here. Read our guide to the <a href=\"/blog/kenya-isp-licensing-framework-2026\">Kenya ISP licensing framework</a>, then confirm the current requirements directly with the CA at ca.go.ke before you start selling.",
    },
    {
      type: "p",
      html: "Also get written permission from the property owner or landlord. It protects your equipment and your right to stay on the site.",
    },
    {
      type: "h2",
      id: "equipment-and-startup-cost",
      text: "Equipment needed and wifi hotspot business startup cost in Kenya",
    },
    {
      type: "p",
      html: "The table shows the equipment needed for a wifi hotspot business and an indicative price range for each part. These are planning ranges, not quotes. Ask two or three dealers for current prices before you commit.",
    },
    {
      type: "table",
      headers: ["Item", "Indicative cost (KSh)", "What drives the range"],
      rows: [
        ["Router (MikroTik hEX / hAP class)", "7,000 – 15,000", "Number of ports, wireless built in or not, CPU speed for more users"],
        ["Outdoor access points (1 to 2)", "6,000 – 30,000", "Coverage area, 2.4 GHz only or dual band, how many you need"],
        ["Backhaul equipment and install", "0 – 40,000", "Fibre often has a low install fee. A wireless link needs a pair of radios and a mast"],
        ["UPS or battery backup", "6,000 – 20,000", "How many hours of backup you want, and whether it powers APs only or the whole setup"],
        ["Cabling, connectors, PoE injectors", "3,000 – 8,000", "Cable length, outdoor-rated cable, number of access points"],
        ["Mounting, pole, weatherproof box, earthing", "3,000 – 10,000", "Pole height, roof or wall mount, lightning risk at the site"],
        ["Signage and posters", "2,000 – 5,000", "Size and number of locations"],
        ["<strong>Total</strong>", "<strong>27,000 – 128,000</strong>", "A small one-AP site sits near the bottom"],
      ],
    },
    {
      type: "p",
      html: "A router running MikroTik RouterOS v7 does the hotspot work: it holds the captive portal and hands out access. Our <a href=\"/blog/wifi-hotspot-billing-system-cost-kenya\">wifi hotspot billing system cost guide</a> covers the software side. Do not forget the monthly costs: backhaul, power, and the share you pay a landlord or shop owner.",
    },
    {
      type: "h2",
      id: "backhaul",
      text: "Which backhaul should you use?",
    },
    {
      type: "p",
      html: "Backhaul is the internet line feeding your hotspot. It is your biggest monthly cost and the thing customers notice first when it fails. The options:",
    },
    {
      type: "table",
      headers: ["Option", "Best for", "Watch out for"],
      rows: [
        ["Business fibre", "Estates, hostels, markets with fibre access", "Pick a business plan, not a home plan, so your terms of use allow resale"],
        ["Wireless link from an ISP or WISP", "Sites with no fibre but line of sight to a tower", "Rain and obstructions affect the link. Needs a mast"],
        ["4G/5G router", "Pilots and very small sites", "Data caps and slow speeds when many users connect"],
        ["Two links with failover", "Sites that cannot afford downtime", "Higher monthly cost. See our <a href=\"/blog/mikrotik-load-balancing-failover-isp\">load balancing and failover guide</a>"],
      ],
    },
    {
      type: "p",
      html: "As a rough guide, plan for 0.5 to 1 Mbps per concurrent active user and you will be close. Check the contract of any home line you plan to resell. Many home plans forbid it.",
    },
    {
      type: "h2",
      id: "package-pricing",
      text: "How should you price hotspot packages?",
    },
    {
      type: "p",
      html: "Sell time, not megabytes, unless you have a reason not to. Time is easy to explain on a poster. A short ladder works best: a cheap first purchase, then bigger packages with a lower cost per hour. These are examples, not recommended prices for your site:",
    },
    {
      type: "table",
      headers: ["Package", "Price (KSh)", "Who buys it"],
      rows: [
        ["1 hour", "10", "First-timers and people waiting for a matatu"],
        ["3 hours", "20", "An evening of browsing and social media"],
        ["1 day (24 hours)", "50", "Students and traders who work online all day"],
        ["1 week", "250", "Regular tenants who would otherwise buy bundles"],
      ],
    },
    {
      type: "p",
      html: "The first package gets people through the door. The day and week packages raise your average spend and reduce the number of tiny M-Pesa payments. Set a speed limit per user so one person watching video does not use the whole link. If your site is busy only at certain hours, you can limit some plans to time windows. Internetily supports hotspot plans with time-of-day windows per day of the week.",
    },
    {
      type: "h2",
      id: "getting-paid",
      text: "How do you get paid?",
    },
    {
      type: "p",
      html: "Customers connect to your WiFi, a captive portal opens, they pick a package and pay by M-Pesa STK Push. Payment confirms, access is granted within seconds, with no staff member involved. Two ways work well together:",
    },
    {
      type: "ul",
      items: [
        "<strong>M-Pesa captive portal.</strong> Customers pay from the portal to your own Till, Paybill or bank. Internetily (Netily) supports STK Push with your own Daraja keys, or Till and Paybill without any API keys, and customers can reconnect with their phone number.",
        "<strong>Vouchers through shops.</strong> A kiosk or shop near the site sells printed or SMS vouchers and keeps a commission. It reaches people without data to open the portal or who prefer cash. See our <a href=\"/solutions/hotspot-billing-software-kenya\">hotspot billing software for Kenya</a> page for how vouchers and agents work.",
      ],
    },
    {
      type: "p",
      html: "Use your own Till or Paybill so money settles to you. Then reconcile it weekly against your portal reports.",
    },
    {
      type: "h2",
      id: "profit-example",
      text: "Is a wifi hotspot business profitable in Kenya? A worked example",
    },
    {
      type: "p",
      html: "Here is one example. Every number is an assumption for illustration, not a promise. Replace each one with your own figures.",
    },
    {
      type: "h3",
      text: "Assumptions",
    },
    {
      type: "ul",
      items: [
        "Startup cost: KSh 45,000 (mid-range kit, fibre backhaul).",
        "60 paying sessions a day, average spend KSh 20, 30 days a month.",
        "Business fibre: KSh 6,500 a month (varies by speed and provider).",
        "Billing software: 3% of hotspot revenue at Internetily rates, with a KSh 500 monthly minimum.",
        "M-Pesa charges: about KSh 200 a month. Check the current Safaricom tariff for your Till or Paybill, as rates change.",
        "Power: KSh 1,500 a month.",
        "Vouchers: 30% of sales go through shops at a 10% commission.",
        "Site owner or landlord share: KSh 3,000 a month.",
        "Repairs and replacement reserve: KSh 1,500 a month.",
      ],
    },
    {
      type: "table",
      headers: ["Line", "Good site (60 sessions/day)", "Weak site (25 sessions/day)"],
      rows: [
        ["Monthly revenue", "KSh 36,000", "KSh 15,000"],
        ["Backhaul", "KSh 6,500", "KSh 6,500"],
        ["Billing (3%, KSh 500 minimum)", "KSh 1,080", "KSh 500"],
        ["M-Pesa charges", "KSh 200", "KSh 83"],
        ["Power", "KSh 1,500", "KSh 1,500"],
        ["Voucher commission", "KSh 1,080", "KSh 450"],
        ["Site owner share", "KSh 3,000", "KSh 3,000"],
        ["Repairs reserve", "KSh 1,500", "KSh 1,500"],
        ["<strong>Total costs</strong>", "<strong>KSh 14,860</strong>", "<strong>KSh 13,533</strong>"],
        ["<strong>Monthly profit</strong>", "<strong>KSh 21,140</strong>", "<strong>KSh 1,467</strong>"],
        ["<strong>Break-even on KSh 45,000</strong>", "<strong>about 2.1 months</strong>", "<strong>about 31 months</strong>"],
      ],
    },
    {
      type: "p",
      html: "The lesson is in the second column. Most costs are fixed, so profit depends on volume. A site with 60 daily sessions pays back in about two months. A site with 25 takes more than two and a half years, if the equipment survives that long. This is why the demand test comes before the purchase.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Not a forecast",
      text: "These figures are an illustration built on stated assumptions. Real sites vary widely. Do not borrow money against this example. Run your own numbers with your quoted backhaul price and your pilot's actual session count.",
    },
    {
      type: "p",
      html: "To check what the billing share would be for your own volume, use the <a href=\"/pricing#calculator\">pricing calculator</a>.",
    },
    {
      type: "h2",
      id: "first-30-days",
      text: "Your first 30 days checklist",
    },
    {
      type: "ol",
      items: [
        "<strong>Week 1:</strong> Count foot traffic, interview 20 potential customers, agree terms with the site owner in writing, and request backhaul quotes.",
        "<strong>Week 1:</strong> Run the pilot with a single package. Record paid sessions per day.",
        "<strong>Week 2:</strong> If the pilot passes, buy the kit. Mount access points as high as practical, put the router and UPS in a locked, ventilated box, and earth everything.",
        "<strong>Week 2:</strong> Set up the hotspot, captive portal and M-Pesa payments. Test a purchase end to end from a customer phone.",
        "<strong>Week 3:</strong> Launch with posters at eye level, and recruit one or two shop vendors for vouchers.",
        "<strong>Week 3:</strong> Watch the backhaul graph at the busiest hour. If the link is full, add a speed cap per user before adding bandwidth.",
        "<strong>Week 4:</strong> Review which packages sell. Drop the one nobody buys, adjust prices, and reconcile M-Pesa receipts against portal reports.",
        "<strong>Week 4:</strong> Calculate your real monthly profit with actual costs and compare it to the example above.",
      ],
    },
    {
      type: "h2",
      id: "mistakes",
      text: "Mistakes that kill hotspot businesses",
    },
    {
      type: "ul",
      items: [
        "<strong>Buying kit before testing demand.</strong> The most common and most expensive mistake.",
        "<strong>Too little backhaul.</strong> Fifty users on a 5 Mbps line all get a bad experience, stop paying, and tell their friends.",
        "<strong>No power backup.</strong> Power cuts at peak hours are lost sales and angry customers. A UPS pays for itself.",
        "<strong>Open equipment.</strong> Routers and APs in reach of the public get stolen or unplugged. Mount high and lock the box.",
        "<strong>No speed limit per user.</strong> One person downloading a large file slows everyone else.",
        "<strong>Default router passwords.</strong> Change them and restrict admin access. See our <a href=\"/blog/isp-cybersecurity-mikrotik-mpesa-data-2026\">ISP cybersecurity guide</a>.",
        "<strong>Manual payment checking.</strong> Writing down M-Pesa codes by hand does not scale past 20 customers. Automate confirmation and access.",
        "<strong>Skipping the licensing check.</strong> Confirm the requirements with the Communications Authority before you sell.",
      ],
    },
    {
      type: "p",
      html: "If you plan to grow beyond one site into home internet, read <a href=\"/blog/starting-small-as-an-isp-guide\">starting small as an ISP</a>. For the billing side of a hotspot, Internetily handles M-Pesa payments, packages, vouchers and automatic access for KSh 500 a month minimum plus 3% of confirmed hotspot revenue, with a 2-day free trial and no credit card.",
    },
    {
      type: "h2",
      id: "faq",
      text: "Frequently asked questions",
    },
    { type: "cta" },
  ],
},

  {
  slug: "mikrotik-pppoe-server-radius-setup-routeros-v7",
  title: `MikroTik PPPoE Server with RADIUS: Step-by-Step Setup for ISPs (RouterOS v7)`,
  excerpt: `A working MikroTik PPPoE server setup with RADIUS on RouterOS v7: pool, profile, server, RADIUS client, accounting, rate-limit attributes, suspension and troubleshooting, with the exact commands.`,
  coverGradient: "from-blue-600 to-indigo-700",
  coverImage: "/academy/isp-operations.webp",
  coverImageAlt: `MikroTik router and rack equipment in an ISP network room running PPPoE with RADIUS`,
  category: "Network Operations",
  categoryColor: "blue",
  readTime: 9,
  publishedAt: published,
  updatedAt: published,
  author,
  tags: ["MikroTik", "PPPoE", "RADIUS", "FreeRADIUS", "RouterOS v7", "ISP setup"],
  metaTitle: `MikroTik PPPoE Server Setup with RADIUS (RouterOS v7)`,
  metaDescription: `MikroTik PPPoE server setup with RADIUS on RouterOS v7: exact commands, rate-limit attributes, interim updates, suspending expired users and a fix-it table.`,
  keywords: [
    "mikrotik pppoe server setup with radius",
    "mikrotik pppoe radius configuration",
    "routeros v7 pppoe server",
    "freeradius mikrotik pppoe",
    "mikrotik radius rate limit attribute",
    "pppoe server mikrotik step by step",
    "mikrotik pppoe interim update",
    "how to configure radius on mikrotik for pppoe",
    "mikrotik radius not authenticating pppoe users",
    "mikrotik pppoe radius disconnect expired users",
  ],
  spatialCoverage: ["Kenya", "Uganda", "Tanzania"],
  sources: [
    { title: "RouterOS documentation (PPPoE, PPP AAA, RADIUS)", url: "https://help.mikrotik.com/docs/", publisher: "MikroTik" },
    { title: "RFC 2865: Remote Authentication Dial In User Service (RADIUS)", url: "https://www.rfc-editor.org/rfc/rfc2865", publisher: "IETF" },
    { title: "RFC 2866: RADIUS Accounting", url: "https://www.rfc-editor.org/rfc/rfc2866", publisher: "IETF" },
  ],
  faqs: [
    {
      question: `How do I set up a MikroTik PPPoE server with RADIUS?`,
      answer: `Create an IP pool and a PPP profile, add a PPPoE server on the customer-facing interface, add your RADIUS server with /radius add service=ppp, then run /ppp aaa set use-radius=yes accounting=yes interim-update=5m. Finally allow RADIUS Change of Authorization with /radius incoming set accept=yes. Test with a user defined in RADIUS and check /ppp active print.`,
    },
    {
      question: `What is the MikroTik RADIUS rate limit attribute?`,
      answer: `It is Mikrotik-Rate-Limit, a vendor-specific attribute that sets the speed of a PPPoE session. The format is rx/tx, for example 10M/10M, and rx and tx are from the router's side: rx is the client's upload and tx is the client's download. Optional burst values can follow the base rates.`,
    },
    {
      question: `What does interim-update do on a MikroTik PPPoE server?`,
      answer: `It makes the router send an Accounting-Request (Interim-Update) to RADIUS at a fixed interval while a session is up. RADIUS then holds current byte counters and a fresh session record, even if the router reboots or loses power mid-session. Five minutes (5m) is a sensible starting point.`,
    },
    {
      question: `Why is my MikroTik not authenticating PPPoE users with RADIUS?`,
      answer: `The usual causes are a wrong shared secret, the RADIUS server not listing the router's source IP as a client, a firewall blocking UDP 1812 and 1813, or use-radius not being enabled in /ppp aaa. Check /log print where topics~"radius" first. A timeout means the packet never arrived or was never answered; a reject means the server saw it and said no.`,
    },
    {
      question: `Should I use PAP, CHAP or MS-CHAPv2 for PPPoE with RADIUS?`,
      answer: `Enable all three on the PPPoE server (pap,chap,mschap2) and let the customer's router negotiate. CHAP and MS-CHAPv2 do not send the password in clear text over the access network. PAP only works if your RADIUS server holds the password in clear text, which FreeRADIUS can do but is a trade-off.`,
    },
    {
      question: `How do I disconnect an expired PPPoE user on MikroTik with RADIUS?`,
      answer: `Two parts are needed. Stop future logins by rejecting the user in RADIUS or placing them in a restricted pool, and kick the live session using a RADIUS Disconnect-Request, which requires /radius incoming set accept=yes on the router. Without the second part, an expired user stays online until they next reconnect.`,
    },
  ],
  toc: [
    { id: "short-answer", text: `How do you set up a MikroTik PPPoE server with RADIUS?` },
    { id: "why-radius", text: `Why use RADIUS instead of local PPP secrets?` },
    { id: "prerequisites", text: `Prerequisites before you start` },
    { id: "steps", text: `MikroTik PPPoE RADIUS configuration, step by step` },
    { id: "attributes", text: `RADIUS attributes that control a PPPoE session` },
    { id: "suspend-expired", text: `How to suspend expired PPPoE users` },
    { id: "mtu-mss", text: `MTU, MRU and MSS clamping` },
    { id: "testing", text: `Testing and troubleshooting` },
    { id: "automation", text: `Doing this without hand-typing it on every router` },
    { id: "faq", text: `Frequently asked questions` },
  ],
  content: [
    { type: "h2", id: "short-answer", text: `How do you set up a MikroTik PPPoE server with RADIUS?` },
    {
      type: "p",
      html: `<strong>A MikroTik PPPoE server setup with RADIUS takes seven steps on RouterOS v7: create an IP pool, create a PPP profile, add the PPPoE server on the customer-facing interface, add the RADIUS client, enable RADIUS and accounting in /ppp aaa, accept incoming Change of Authorization requests, then test with one real user. RADIUS then decides who may log in, at what speed, and for how long.</strong>`,
    },
    {
      type: "p",
      html: `The commands are below, in the order to type them. Every command is RouterOS v7 syntax. Change the names, interface and addresses to match your network.`,
    },

    { type: "h2", id: "why-radius", text: `Why use RADIUS instead of local PPP secrets?` },
    {
      type: "p",
      html: `A local PPP secret lives on one router: username, password, profile. That is fine for 30 customers on one box. It stops working when you add a second router, because you now edit the same customer in two places, and nothing records how many bytes or minutes each customer used.`,
    },
    {
      type: "p",
      html: `RADIUS (Remote Authentication Dial In User Service, defined in <a href="https://www.rfc-editor.org/rfc/rfc2865" target="_blank" rel="noopener noreferrer">RFC 2865</a>) moves that decision to one server. Accounting (<a href="https://www.rfc-editor.org/rfc/rfc2866" target="_blank" rel="noopener noreferrer">RFC 2866</a>) records every session.`,
    },
    {
      type: "table",
      headers: [`Question`, `Local /ppp secret`, `RADIUS (FreeRADIUS)`],
      rows: [
        [`Where are users stored?`, `On each router`, `One database, shared by all routers`],
        [`Change a customer's speed`, `Edit the secret or profile on the router`, `Change one RADIUS attribute; applies at next login or by CoA`],
        [`Usage and session history`, `Only what you poll from the router`, `Accounting records for every session`],
        [`Suspend a customer who has not paid`, `Disable the secret by hand or by script`, `Reject in RADIUS, or send a disconnect`],
        [`Adding a second router`, `Copy every secret`, `Add the router as a RADIUS client`],
        [`Extra moving parts`, `None`, `A RADIUS server that must stay reachable`],
      ],
    },
    {
      type: "callout",
      variant: "info",
      title: `When not to bother`,
      text: `If you have one router, under about 50 customers, and you bill by hand, local secrets are simpler and have nothing to go down. RADIUS pays off when you have several routers, automated billing, or any need to cut off non-payers without logging in to a router.`,
    },

    { type: "h2", id: "prerequisites", text: `Prerequisites before you start` },
    {
      type: "ul",
      items: [
        `A MikroTik router on <strong>RouterOS v7</strong> (check with <code>/system resource print</code>).`,
        `A RADIUS server. <strong>FreeRADIUS</strong> is the common free choice and already ships the MikroTik vendor dictionary, so Mikrotik-Rate-Limit works out of the box.`,
        `A <strong>shared secret</strong>: a long random string, identical on the router and in the RADIUS server's client entry for that router. Do not reuse it across routers.`,
        `A network path from router to RADIUS server over UDP 1812 (authentication) and 1813 (accounting). If the server is in the cloud, use a VPN or management tunnel rather than exposing RADIUS to the internet. Our <a href="/blog/isp-cybersecurity-mikrotik-mpesa-data-2026">ISP security guide</a> explains why.`,
        `The router's <strong>tunnel or management IP</strong>, because that is the address the RADIUS server will see and must list as a client.`,
      ],
    },

    { type: "h2", id: "steps", text: `MikroTik PPPoE RADIUS configuration, step by step` },
    {
      type: "p",
      html: `Type these in order. The example uses the pool 10.10.0.0/20 for customers, a bridge called <code>bridge-customers</code>, and a RADIUS server at 10.99.0.1 reached through a tunnel on which the router is 10.99.0.2.`,
    },
    {
      type: "ol",
      items: [
        `<strong>Create the IP pool.</strong> <code>/ip pool add name=pppoe-pool ranges=10.10.0.2-10.10.15.254</code>`,
        `<strong>Create the PPP profile.</strong> <code>/ppp profile add name=pppoe-radius local-address=10.10.0.1 remote-address=pppoe-pool dns-server=1.1.1.1,8.8.8.8 only-one=yes change-tcp-mss=yes</code>. <code>only-one=yes</code> stops one account being logged in twice. <code>change-tcp-mss=yes</code> is the MSS clamp covered below.`,
        `<strong>Add the PPPoE server</strong> on the interface or bridge that faces customers, never on the WAN: <code>/interface pppoe-server server add service-name=internetily interface=bridge-customers default-profile=pppoe-radius authentication=pap,chap,mschap2 one-session-per-host=yes disabled=no</code>`,
        `<strong>Add the RADIUS client.</strong> <code>/radius add service=ppp address=10.99.0.1 secret=YourLongRandomSecret src-address=10.99.0.2 timeout=3s</code>. Setting <code>src-address</code> makes the router always send from the IP the server knows, which matters when the router has several addresses or sits behind NAT.`,
        `<strong>Turn on RADIUS for PPP and accounting.</strong> <code>/ppp aaa set use-radius=yes accounting=yes interim-update=5m</code>. This is the mikrotik pppoe interim update setting: the router reports each live session to RADIUS every five minutes.`,
        `<strong>Accept Change of Authorization and Disconnect requests.</strong> <code>/radius incoming set accept=yes</code>. The default port is 3799. This lets the server change or drop a session that is already connected.`,
        `<strong>Test with one customer</strong> defined in RADIUS (see Testing below), and only then move real customers over.`,
      ],
    },
    {
      type: "callout",
      variant: "warning",
      title: `Keep a way back in`,
      text: `If RADIUS is unreachable, PPPoE logins fail and customers drop at next reconnect. Keep one local /ppp secret for your own test account, and make sure your Winbox or SSH access to the router does not depend on RADIUS.`,
    },

    { type: "h2", id: "attributes", text: `RADIUS attributes that control a PPPoE session` },
    {
      type: "p",
      html: `When FreeRADIUS accepts a user, it returns attributes in the Access-Accept. The router applies them to that session. These are the ones an ISP uses daily, and the mikrotik radius rate limit attribute is the most important.`,
    },
    {
      type: "table",
      headers: [`Attribute`, `What it does`, `Example`],
      rows: [
        [`Mikrotik-Rate-Limit`, `Sets session speed as rx/tx, optionally with burst values. rx and tx are from the router's side: rx is the client's upload, tx is the client's download.`, `10M/10M (10 Mbps up, 10 Mbps down). 5M/20M is 5 up, 20 down.`],
        [`Framed-IP-Address`, `Gives this user a fixed IP address instead of one from the pool. Useful for customers who need a static IP.`, `10.10.5.20`],
        [`Framed-Pool`, `Names the router IP pool to draw the address from. Lets you place expired or special users in a different pool.`, `pppoe-pool`],
        [`Session-Timeout`, `Maximum session length in seconds. The router disconnects the user when it expires, and the customer redials.`, `86400 (24 hours)`],
        [`Acct-Interim-Interval`, `Asks the router to send interim accounting at this interval, in seconds, overriding the router default.`, `300`],
      ],
    },
    {
      type: "callout",
      variant: "tip",
      title: `Remember: rx/tx is the router's view`,
      text: `The most common mistake is writing a plan of 10 Mbps down and 2 Mbps up as 10M/2M. That gives the customer 10 Mbps up and only 2 Mbps down. In Mikrotik-Rate-Limit the first number is what the customer uploads and the second is what the customer downloads, so that plan is 2M/10M. Test one account with a speed test before you apply a pattern to hundreds.`,
    },

    { type: "h2", id: "suspend-expired", text: `How to suspend expired PPPoE users` },
    {
      type: "p",
      html: `There are two ways to handle a customer whose plan has run out. Both are normal; choose by what you want the customer to see.`,
    },
    {
      type: "table",
      headers: [`Method`, `How it works`, `Customer experience`, `Best for`],
      rows: [
        [`Reject at authentication`, `RADIUS returns Access-Reject for the user`, `PPPoE fails. Their router shows a login error and there is no internet at all`, `Simple, strict cut-off; no extra router config`],
        [`Redirect pool or address list`, `RADIUS accepts but puts the user in a restricted pool (Framed-Pool) or address list; a firewall rule allows only your payment page and DNS`, `Connected, but every site lands on a pay-now page`, `Fewer support calls: customers see why and can pay`],
      ],
    },
    {
      type: "p",
      html: `Whichever you choose, also send a Disconnect-Request so the live session ends at once. That is why step 6 enabled <code>/radius incoming</code>. Otherwise the customer keeps browsing until their next redial. The reverse also matters: once they pay, you want the session restored without them touching their router. Our guide on <a href="/blog/automate-wisp-billing-mpesa-auto-disconnect">automating WISP billing with M-Pesa and auto-disconnect</a> covers that flow.`,
    },

    { type: "h2", id: "mtu-mss", text: `MTU, MRU and MSS clamping` },
    {
      type: "p",
      html: `PPPoE adds 8 bytes of header, so a standard 1500-byte Ethernet frame leaves 1492 bytes for the PPP payload. Many ISPs set <strong>1480</strong> for headroom, and it is safe to do so. Set it on the server: <code>/interface pppoe-server server set [find service-name=internetily] max-mtu=1480 max-mru=1480</code>`,
    },
    {
      type: "p",
      html: `Then rely on <code>change-tcp-mss=yes</code> in the profile, which you already set in step 2. It rewrites the TCP maximum segment size so large downloads do not stall. The classic symptom of getting this wrong is that small pages and chat apps work while some HTTPS sites, uploads or video calls hang.`,
    },

    { type: "h2", id: "testing", text: `Testing and troubleshooting` },
    {
      type: "p",
      html: `First make RADIUS events visible: <code>/system logging add topics=radius,debug action=memory</code>. Then run these checks in order.`,
    },
    {
      type: "ul",
      items: [
        `<code>/radius monitor 0</code> shows request, accept, reject and timeout counters for the first RADIUS entry. Rising timeouts mean packets are not getting through.`,
        `<code>/log print where topics~"radius"</code> shows the actual failure reason for each login attempt.`,
        `<code>/ppp active print</code> lists connected sessions with caller ID, address and uptime. Your test user should appear here.`,
      ],
    },
    {
      type: "table",
      headers: [`Symptom`, `Likely cause`, `Fix`],
      rows: [
        [`Log shows timeout, no reply`, `Server unreachable, or firewall blocking UDP 1812/1813`, `Allow 1812 and 1813 UDP from the router IP; test the tunnel with a ping`],
        [`Server logs a client it does not know, or the reply is dropped`, `Wrong src-address, or the router is behind NAT so the server sees a different IP`, `Set src-address to the tunnel IP and add exactly that IP as the RADIUS client`],
        [`Access-Reject for every user, "Message-Authenticator invalid" or similar in server log`, `Shared secret mismatch`, `Re-enter the secret on both ends; watch for trailing spaces and copy-paste errors`],
        [`Users are accepted but speed is not limited`, `Mikrotik-Rate-Limit missing from reply, or the vendor dictionary not loaded`, `Run FreeRADIUS in debug mode (freeradius -X) and read the reply attributes`],
        [`Intermittent failures, expired certificates or odd timestamps`, `Router clock wrong`, `Set NTP: <code>/system ntp client set enabled=yes</code> and a server address, then check <code>/system clock print</code>`],
        [`Customer expired but still online`, `No Disconnect-Request sent, or <code>/radius incoming</code> not accepted`, `Enable incoming, allow UDP 3799 from the RADIUS server to the router`],
      ],
    },
    {
      type: "p",
      html: `If load is a concern too, see <a href="/blog/mikrotik-load-balancing-failover-isp">MikroTik load balancing and failover for ISPs</a>, because a PPPoE server on a router with a flapping uplink will make customers redial constantly.`,
    },

    { type: "h2", id: "automation", text: `Doing this without hand-typing it on every router` },
    {
      type: "p",
      html: `Everything above works, and you should understand it before you automate it. The cost shows up at the second router, and again at the fortieth customer who pays after hours. You must keep the secret consistent, keep every router's profile identical, and update RADIUS when a payment arrives.`,
    },
    {
      type: "p",
      html: `Internetily (Netily) does this for you. It provisions the MikroTik router, runs FreeRADIUS authentication and accounting, and updates RADIUS state when a payment is confirmed, so a paid subscriber is reconnected automatically. Pricing is KSh 25 per billable PPPoE subscriber with a KSh 500 monthly minimum, and you can try it free for 2 days with no credit card. See the <a href="/features">features</a> and <a href="/pricing">pricing</a> pages, or read <a href="/blog/mikrotik-isp-billing-mpesa-automation">how MikroTik billing and M-Pesa automation fit together</a>.`,
    },
    {
      type: "callout",
      variant: "tip",
      title: `Learn the manual way first`,
      text: `Even if you automate, build one test router by hand using the commands above. When something breaks at 9pm, you will know whether the fault is the router, the tunnel or the RADIUS server.`,
    },

    { type: "h2", id: "faq", text: `Frequently asked questions` },
    { type: "cta" },
  ],
},

  {
  slug: "mpesa-paid-but-not-connected-isp-fix",
  title: "Paid by M-Pesa but Not Connected? 9 Causes and Fixes for ISPs and Hotspots",
  excerpt:
    "A customer says they paid via M-Pesa but the internet is not connected. Here are the nine causes we see in the field, how to confirm each one, and how to fix it without guessing.",
  coverGradient: "from-emerald-600 to-teal-700",
  coverImage: "/academy/isp-operations.webp",
  coverImageAlt: "ISP operations desk checking M-Pesa payments against subscriber accounts",
  category: "Billing & Payments",
  categoryColor: "emerald",
  readTime: 9,
  publishedAt: published,
  updatedAt: published,
  author,
  tags: ["M-Pesa", "STK Push", "Daraja", "Payment reconciliation", "Automatic reconnection", "Hotspot"],
  metaTitle: "Paid via M-Pesa but Internet Not Connected: 9 Fixes",
  metaDescription:
    "Paid via M-Pesa but internet not connected? Nine causes ISPs and hotspot owners meet, with how to confirm each one, fix it, and stop it coming back.",
  keywords: [
    "paid via mpesa but internet not connected",
    "mpesa payment not reflecting internet",
    "mpesa stk push callback not received",
    "wifi paid but no internet",
    "automatic reconnection after mpesa payment",
    "daraja callback url not working",
    "how to reconcile mpesa payments isp",
    "customer paid mpesa but wifi not working",
    "mpesa paybill wrong account number isp",
    "hotspot paid but not connected mikrotik",
  ],
  spatialCoverage: ["Kenya"],
  sources: [
    { title: "Daraja developer portal (M-Pesa Express / STK Push, C2B)", url: "https://developer.safaricom.co.ke/", publisher: "Safaricom" },
    { title: "RouterOS documentation", url: "https://help.mikrotik.com/docs/", publisher: "MikroTik" },
    { title: "FreeRADIUS documentation", url: "https://www.freeradius.org/documentation/", publisher: "FreeRADIUS Project" },
  ],
  faqs: [
    {
      question: "Why did the customer pay via M-Pesa but the internet is not connected?",
      answer:
        "Because the payment and the access change are two separate steps, and one of them failed. Usually the Safaricom confirmation never reached your system, it could not be matched to an account, or the router or RADIUS was not told to reconnect the customer. Check the callback log first, then the account match, then the session.",
    },
    {
      question: "Why is my M-Pesa STK Push callback not being received?",
      answer:
        "The most common reason is that the CallBackURL you registered with the Daraja request is not publicly reachable over HTTPS. Firewalls, expired certificates, a server that is down, or a URL pointing to a local or test address will all stop the callback. Check your web server logs for the incoming POST from Safaricom.",
    },
    {
      question: "How do I reconcile M-Pesa payments for my ISP?",
      answer:
        "Export your M-Pesa statement from the Till or Paybill portal and compare each transaction code, amount, phone number and account reference against the payments recorded in your billing system. Anything on the statement but missing in billing is an unmatched payment that needs to be assigned to a subscriber by hand.",
    },
    {
      question: "Can an ISP reconnect a customer automatically after an M-Pesa payment?",
      answer:
        "Yes. When the confirmed payment arrives, the billing system updates the subscriber account and then tells RADIUS or the MikroTik router to restore access. For a customer who already has an old session open, the system also needs to disconnect that session so the device re-authenticates with the new status.",
    },
    {
      question: "What does ResultCode 1032 mean in an STK Push callback?",
      answer:
        "ResultCode 1032 means the customer cancelled the STK Push prompt on their phone, so no money moved. ResultCode 0 means success, and 1037 means the prompt timed out or the phone could not be reached. Only ResultCode 0 should ever credit an account.",
    },
    {
      question: "Why does a hotspot customer pay but still see the login page?",
      answer:
        "Often the customer is on a different device or the phone has switched to a randomised MAC address, so the voucher or session was created for an address the router no longer recognises. Reconnecting by phone number on the captive portal, or ending the stale session, normally fixes it.",
    },
  ],
  toc: [
    { id: "short-answer", text: "Short answer: why a paid customer is still offline" },
    { id: "payment-to-access-chain", text: "How an M-Pesa payment becomes internet access" },
    { id: "nine-causes", text: "The 9 causes and how to fix each" },
    { id: "diagnostic-table", text: "Diagnostic table: symptom to cause" },
    { id: "support-script", text: "Support script for your staff" },
    { id: "reconcile-mpesa-payments", text: "How to reconcile M-Pesa payments for your ISP" },
    { id: "prevention-checklist", text: "Prevention checklist" },
    { id: "where-internetily-fits", text: "Where Internetily fits" },
    { id: "faq", text: "Frequently asked questions" },
  ],
  content: [
    { type: "h2", id: "short-answer", text: "Short answer: why a paid customer is still offline" },
    {
      type: "p",
      html: "<strong>When a customer paid via M-Pesa but the internet is not connected, one link in the payment chain has broken: Safaricom's confirmation never reached your callback URL, the payment could not be matched to an account, the amount was too low, or the router or RADIUS was never told to reconnect the customer. Find which link failed, then fix that link, not the customer's phone.</strong>",
    },
    {
      type: "p",
      html: "If you run a small ISP or hotspot in Kenya, you get this call every week. The customer has an M-Pesa message with a transaction code. You have a screen that says nothing. Both are telling the truth, and the gap between them is what this article is about. It is written for you, the operator, with a short box near the end on what to say to the customer.",
    },
    { type: "h2", id: "payment-to-access-chain", text: "How an M-Pesa payment becomes internet access" },
    {
      type: "p",
      html: "Whether you use STK Push through Safaricom Daraja or a Paybill or Till, the same chain runs every time. A failure at any step looks identical to the customer: they paid and nothing happened.",
    },
    {
      type: "ol",
      items: [
        "<strong>STK Push request.</strong> Your system calls the Daraja STK Push (M-Pesa Express) API with the phone number, amount, an account reference and a <code>CallBackURL</code>.",
        "<strong>Customer enters their PIN.</strong> The prompt appears on their phone. They can approve, cancel, or ignore it.",
        "<strong>Safaricom processes the result.</strong> M-Pesa debits the customer and credits your Till or Paybill, or records a failure.",
        "<strong>Callback to your URL.</strong> Safaricom sends an HTTP POST to your <code>CallBackURL</code> with a result. <code>ResultCode</code> 0 is success, 1032 is cancelled by the user, 1037 is a timeout or unreachable phone.",
        "<strong>Match to an account.</strong> Your system links the transaction to a subscriber using the account reference, phone number or the checkout request ID.",
        "<strong>Billing update.</strong> The subscriber's expiry date or balance is changed, once.",
        "<strong>RADIUS or router change.</strong> The subscriber's status is set to active in FreeRADIUS, or the MikroTik user, queue or address-list entry is updated.",
        "<strong>Session reconnects.</strong> The customer's existing session is ended so the device re-authenticates and gets online.",
      ],
    },
    {
      type: "p",
      html: "With Paybill or Till payments entered by hand, steps 1 to 3 happen on the customer's handset using <em>Lipa na M-Pesa</em>, and your system learns of the payment through a confirmation URL instead of an STK callback. Steps 5 to 8 are the same. Most failures are in steps 4, 5 and 8.",
    },
    { type: "h2", id: "nine-causes", text: "The 9 causes and how to fix each" },
    { type: "h3", text: "1. Callback URL unreachable or not HTTPS" },
    {
      type: "p",
      html: "<strong>Symptom:</strong> The customer has an M-Pesa receipt. Your system has no record of the payment at all. <strong>Confirm:</strong> Check your web server access log for a POST from Safaricom around the payment time. No request means it never arrived. Also call your own callback URL from a phone on mobile data, not your office Wi-Fi, to see whether it is public. <strong>Fix:</strong> Use a public HTTPS address with a valid, unexpired certificate. Do not point <code>CallBackURL</code> at a local, test or private address. Make sure the firewall and any reverse proxy allow the POST through. If you are not sure whether the transaction succeeded, Daraja also provides an STK Push query so you can ask Safaricom for the status instead of waiting.",
    },
    { type: "h3", text: "2. Wrong account reference on a Paybill" },
    {
      type: "p",
      html: "<strong>Symptom:</strong> Money is on your statement, but billing shows an unmatched payment or credits the wrong person. <strong>Confirm:</strong> Look up the M-Pesa transaction code on your statement and read the account number the customer typed. Typos, spaces and a missing leading zero are the usual culprits. <strong>Fix:</strong> Assign the payment to the right subscriber by hand, and reconnect them. To prevent it, give each customer a short account number and prefer STK Push, where the reference is filled in for them.",
    },
    { type: "h3", text: "3. Payment to a Till with no reference" },
    {
      type: "p",
      html: "<strong>Symptom:</strong> A payment arrives with a phone number and name but no account reference. <strong>Confirm:</strong> Buy Goods payments to a Till carry no account field. <strong>Fix:</strong> Match on phone number if it is registered against exactly one subscriber. If a phone number is shared by several accounts, ask the customer which account it was for. Tell customers on a Till to pay from the number on their account.",
    },
    { type: "h3", text: "4. Customer paid less than the package price" },
    {
      type: "p",
      html: "<strong>Symptom:</strong> The payment is recorded but the account stays expired or suspended. <strong>Confirm:</strong> Compare the amount paid with the package price. KSh 1,900 against a KSh 2,000 package is a common cause. <strong>Fix:</strong> Decide your policy and apply it consistently: carry the partial amount as credit and ask for the balance, or activate a shorter period. Tell the customer the exact shortfall. Do not activate a full month on a short payment because they are chasing you on WhatsApp.",
    },
    { type: "h3", text: "5. Duplicate or retried callbacks" },
    {
      type: "p",
      html: "<strong>Symptom:</strong> One payment, two credits. Or the customer is extended twice, or an SMS goes out twice. <strong>Confirm:</strong> Look for two callback records with the same <code>MpesaReceiptNumber</code> or <code>CheckoutRequestID</code>. Callbacks can arrive more than once, for example if your server answers slowly or errors. <strong>Fix:</strong> Make crediting idempotent. Store the receipt number with a unique constraint, and ignore any callback for a receipt you have already processed. Always return a quick success response to Safaricom, and do the heavy work afterwards.",
    },
    { type: "h3", text: "6. Payment confirmed but the router is unreachable" },
    {
      type: "p",
      html: "<strong>Symptom:</strong> Billing shows the customer as paid and active, but they are still blocked. Other customers on the same site are also offline or locked. <strong>Confirm:</strong> Check whether the router is online in your monitoring. If the VPN or tunnel between your billing system and the MikroTik is down, the change could not be pushed. <strong>Fix:</strong> Restore the tunnel, then re-sync the pending changes. The order matters: fix the link first, otherwise you will push each change twice. Read more about <a href='/blog/automate-wisp-billing-mpesa-auto-disconnect'>automating billing and auto-disconnect on MikroTik</a>.",
    },
    { type: "h3", text: "7. RADIUS accepted, but the old session is still active" },
    {
      type: "p",
      html: "<strong>Symptom:</strong> The account is active in RADIUS, yet the device is still throttled, blocked or on a walled-garden page. Restarting the router or toggling Wi-Fi fixes it. <strong>Confirm:</strong> Check for a session that started before the payment. RADIUS only checks status at authentication, so a session opened while the account was expired stays in that state. <strong>Fix:</strong> End the old session so the device re-authenticates. For PPPoE on RouterOS v7:",
    },
    {
      type: "ul",
      items: [
        "<code>/ppp active remove [find name=\"customer1\"]</code>",
        "<code>/ip hotspot active remove [find user=\"customer1\"]</code> for hotspot users",
        "For automatic disconnects, enable incoming RADIUS requests with <code>/radius incoming set accept=yes port=3799</code> and have the RADIUS server send a Disconnect or CoA (Change of Authorization) message when the payment lands.",
      ],
    },
    { type: "h3", text: "8. Hotspot MAC randomisation or a different device" },
    {
      type: "p",
      html: "<strong>Symptom:</strong> A hotspot customer paid, but the login page still appears. <strong>Confirm:</strong> Modern Android and iOS phones may use a private or randomised Wi-Fi address per network, and sometimes rotate it. If the session was tied to the old MAC, the router treats the phone as a new device. The customer may also simply be on a second phone or laptop. <strong>Fix:</strong> Let the customer reconnect with the phone number they paid with, rather than relying on the MAC alone. Ask them to turn off the private address for your network, or accept that a package is per login, not per device, and say so on the portal.",
    },
    { type: "h3", text: "9. Customer paid from another phone number" },
    {
      type: "p",
      html: "<strong>Symptom:</strong> A relative or employer paid, and the number on the payment is not on any account. <strong>Confirm:</strong> Search the statement by transaction code, then ask the customer who paid. <strong>Fix:</strong> Assign the payment to the correct subscriber. For STK Push, the prompt goes to whichever number was entered, so confirm the phone on the checkout page matches the paying handset. Keep the payer's number on the payment record for later.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Never credit on a screenshot",
      text: "Customers sometimes show a forged or edited M-Pesa message. Confirm the transaction code against your own statement or the callback record before you activate anything by hand.",
    },
    { type: "h2", id: "diagnostic-table", text: "Diagnostic table: symptom to cause" },
    {
      type: "table",
      headers: ["What you see", "Likely cause", "First check"],
      rows: [
        ["No payment record in billing, customer has receipt", "Callback URL unreachable or not HTTPS", "Web server log for Safaricom POST"],
        ["Payment shown as unmatched", "Wrong Paybill account reference", "Account number on M-Pesa statement"],
        ["Payment has no account reference", "Till payment", "Match by phone number"],
        ["Payment recorded, account still expired", "Underpayment", "Amount against package price"],
        ["Two credits for one receipt", "Duplicate callback", "Receipt number uniqueness"],
        ["Active in billing, blocked on the network", "Router unreachable or old session", "Router online status, active sessions"],
        ["Active in RADIUS, works after a Wi-Fi restart", "Stale session needs disconnect or CoA", "Session start time against payment time"],
        ["Hotspot paid, login page still shows", "MAC randomisation or different device", "MAC on payment against MAC now connecting"],
        ["Payment from unknown number", "Paid from another phone", "Transaction code on statement"],
      ],
    },
    { type: "h2", id: "support-script", text: "Support script for your staff" },
    {
      type: "p",
      html: "Give your support staff the same five steps every time, so no one guesses.",
    },
    {
      type: "ol",
      items: [
        "Ask for the <strong>M-Pesa transaction code</strong>, the amount, and the phone number that paid. Not a screenshot.",
        "Search the code in your billing system and on the Till or Paybill statement. If it is on the statement but not in billing, it is an unmatched payment: assign it.",
        "Check the amount against the package price. If short, tell the customer the exact balance.",
        "If the payment is credited and the account is active, end the customer's active session so the device logs in again.",
        "Write down the cause in the ticket. Three tickets with the same cause is a fault in your setup, not bad luck.",
      ],
    },
    {
      type: "callout",
      variant: "info",
      title: "What to tell the customer",
      text: "Say: We can see your payment code and we are checking it now. Please switch Wi-Fi off and on, or restart your phone. If it still does not connect in five minutes, reply with the M-Pesa code and the number you paid from. Never ask for their M-Pesa PIN.",
    },
    { type: "h2", id: "reconcile-mpesa-payments", text: "How to reconcile M-Pesa payments for your ISP" },
    {
      type: "p",
      html: "Reconciliation means proving that every shilling on your M-Pesa statement is matched to a subscriber payment in your billing system, and the other way round. Do it daily if you have more than a few dozen customers, and weekly at the very least.",
    },
    {
      type: "ul",
      items: [
        "Export the day's statement from your Till or Paybill portal.",
        "Compare transaction code, amount, phone number and account reference with the payments in billing.",
        "List anything on the statement but not in billing: these are your unmatched payments and the most likely source of angry calls.",
        "List anything in billing but not on the statement: these are manual credits or errors and need an explanation.",
        "Total both sides. The difference should be zero, or explained.",
      ],
    },
    {
      type: "p",
      html: "Our guide on <a href='/blog/mikrotik-isp-billing-mpesa-automation'>MikroTik ISP billing with M-Pesa automation</a> shows how the pieces fit together if you are still building your setup.",
    },
    { type: "h2", id: "prevention-checklist", text: "Prevention checklist" },
    {
      type: "ul",
      items: [
        "Callback URL is public, HTTPS, with a valid certificate that renews itself.",
        "You alert someone if no callback has arrived for an unusually long time during working hours.",
        "Receipt numbers are unique in your database, so repeat callbacks do nothing.",
        "Only <code>ResultCode</code> 0 credits an account. 1032 and 1037 are logged as failed attempts.",
        "Every customer has a short, unique account number printed on their invoice or SMS.",
        "Partial payments follow one written policy.",
        "Payment success triggers a session disconnect or CoA, not only a database update.",
        "Router and tunnel health are monitored, and pending changes retry when a router returns.",
        "Hotspot customers can reconnect with their phone number.",
        "Statement reconciliation is done on a schedule, by a named person.",
      ],
    },
    { type: "h2", id: "where-internetily-fits", text: "Where Internetily fits" },
    {
      type: "p",
      html: "Doing all of this yourself is possible. Many operators do it with a mix of scripts and spreadsheets. It works until the day the person who wrote the scripts is away.",
    },
    {
      type: "p",
      html: "Internetily (Netily) is built around the chain above. It accepts M-Pesa through STK Push with your own Daraja keys, or through your own Till or Paybill, and the money settles into your account. It verifies callbacks, and repeated callbacks do not double-credit. A confirmed payment updates the subscriber and restores access automatically. Your support team can see the payment status on the subscriber record without asking you. On the hotspot captive portal, customers can reconnect with their phone number, which solves case 8 without a support call. See <a href='/features'>features</a> and <a href='/solutions/hotspot-billing-software-kenya'>hotspot billing for Kenya</a>.",
    },
    {
      type: "p",
      html: "It will not fix a customer who pays the wrong amount to the wrong number, and a router that is physically off stays off. If you have fewer than ten customers and a spare afternoon each week, a manual process can be enough. For the pricing, see <a href='/pricing'>pricing</a>; the free trial is 2 days with no credit card.",
    },
    { type: "h2", id: "faq", text: "Frequently asked questions" },
    { type: "cta" },
  ],
},

  {
  slug: "sell-wifi-vouchers-shops-agents-kenya",
  title: "How to Sell WiFi Vouchers Through Shops and Agents in Kenya (Without Losing Money)",
  excerpt:
    "A practical guide to selling WiFi vouchers through agents in Kenya: denominations, 10-20% commission models, code printing, fraud control and a weekly reconciliation routine.",
  coverGradient: "from-purple-600 to-fuchsia-700",
  coverImage: "/academy/hotspot-wifi.webp",
  coverImageAlt: "Hotspot WiFi access point serving customers near a shop in Kenya",
  category: "Hotspot & Vouchers",
  categoryColor: "purple",
  readTime: 8,
  publishedAt: published,
  updatedAt: published,
  author,
  tags: ["WiFi vouchers", "Hotspot agents", "MikroTik hotspot", "Agent commission", "Kenya hotspot business"],
  metaTitle: "Sell WiFi Vouchers Through Agents in Kenya: Full Guide",
  metaDescription:
    "How to sell wifi vouchers through agents in Kenya: pick denominations, set 10-20% commission, print safe codes, stop fraud and reconcile every week.",
  keywords: [
    "sell wifi vouchers through agents",
    "wifi voucher business kenya",
    "hotspot voucher reseller commission",
    "mikrotik hotspot vouchers printing",
    "how to generate hotspot vouchers",
    "voucher vs mpesa hotspot login",
    "wifi voucher agent commission kenya",
    "how to start a wifi voucher business in kenya",
    "how to create hotspot vouchers in mikrotik",
    "how much commission should a wifi voucher agent get",
  ],
  spatialCoverage: ["Kenya"],
  sources: [
    { title: "RouterOS documentation: HotSpot", url: "https://help.mikrotik.com/docs/", publisher: "MikroTik" },
  ],
  faqs: [
    {
      question: "Do WiFi vouchers still make sense when everyone has M-Pesa?",
      answer:
        "Yes, in many locations. Vouchers work for customers who have cash but no M-Pesa balance, for students and children, and for people on phones that struggle to open a payment portal. They also give a shop a reason to stock your product. Offer both: M-Pesa on the portal for most people, vouchers for everyone else.",
    },
    {
      question: "How much commission should a WiFi voucher agent get in Kenya?",
      answer:
        "A common range is 10% to 20% off the face value, depending on volume and who carries the risk. Agents who prepay and sell a lot earn the higher end, because they take the risk off you; agents who take slips on credit get the lower end. Pick a rate that leaves the agent at least a few hundred shillings a week, or they will stop pushing your slips.",
    },
    {
      question: "How do I generate hotspot vouchers in MikroTik?",
      answer:
        "In RouterOS you create hotspot users (code as the name, optional password) with a user profile and a limit-uptime or limit-bytes-total. You can add them with /ip hotspot user add, or use the User Manager or an external RADIUS system for large batches. Tag each batch in the comment field so you can track it later.",
    },
    {
      question: "How do I stop customers sharing one WiFi voucher code?",
      answer:
        "Set shared-users=1 on the hotspot user profile so a code works on only one device at a time. Use a limit-uptime so a shared code burns down its time quickly. For stronger control, keep the codes in a system that can bind a code to the first device that uses it.",
    },
    {
      question: "Should WiFi vouchers expire from first use or from purchase?",
      answer:
        "Both are used, and you should choose per product. Validity from first use is fairer to customers, while expiry from the print date protects you from unsold stock sitting around. A good compromise is a short time-to-redeem window (for example 60 days) plus validity that starts at first login.",
    },
    {
      question: "How often should I reconcile agents selling my vouchers?",
      answer:
        "Weekly is the practical minimum for small agents, and daily for busy shops. Compare the codes issued, the codes redeemed on the router, the cash or M-Pesa the agent paid, and the unsold slips physically counted. Any gap is either theft, a lost slip or a recording error, and it is much easier to trace within a week.",
    },
  ],
  toc: [
    { id: "short-answer", text: "How do you sell WiFi vouchers through agents?" },
    { id: "why-vouchers-still-matter", text: "Why vouchers still matter when M-Pesa exists" },
    { id: "denominations-and-validity", text: "Choosing denominations and validity" },
    { id: "agent-commission-models", text: "Agent commission models that keep you profitable" },
    { id: "generating-and-printing", text: "How to generate and print hotspot vouchers" },
    { id: "fraud-and-leakage", text: "Controlling fraud and leakage" },
    { id: "agent-onboarding", text: "Agent onboarding checklist" },
    { id: "weekly-reconciliation", text: "A weekly reconciliation routine" },
    { id: "marketing-the-network", text: "Marketing your agent network" },
    { id: "where-internetily-fits", text: "Where Internetily fits" },
    { id: "faq", text: "Frequently asked questions" },
  ],
  content: [
    { type: "h2", id: "short-answer", text: "How do you sell WiFi vouchers through agents?" },
    {
      type: "p",
      html: "<strong>To sell wifi vouchers through agents, generate numbered batches of single-use codes, give each agent a batch at a 10-20% discount or on prepaid float, print the codes on slips with instructions and a support number, and reconcile issued, redeemed and unsold codes every week. The control comes from batch IDs, one device per code and expiry on unsold stock.</strong>",
    },
    {
      type: "p",
      html: "That is the whole system. The rest of this guide explains each part so you do not lose money to lost slips, shared codes or agents who sell your stock and keep the cash. It is written for a small hotspot owner running MikroTik routers, but the numbers and routines apply to any setup.",
    },
    { type: "h2", id: "why-vouchers-still-matter", text: "Why vouchers still matter when M-Pesa exists" },
    {
      type: "p",
      html: "If your portal already takes M-Pesa, a voucher can look like extra work. In the field, it still earns its place for five reasons.",
    },
    {
      type: "ul",
      items: [
        "<strong>Cash customers.</strong> Many people carry cash and keep little M-Pesa float. A KSh 20 slip bought with a coin is easier than topping up first.",
        "<strong>Students and children.</strong> They often use a parent's or a friend's phone, or have no M-Pesa registration at all.",
        "<strong>Phones that cope badly with portals.</strong> Older handsets can fail to open the captive portal or the STK Push prompt. Typing a short code is simpler.",
        "<strong>Shop foot traffic.</strong> A shop that sells your slips puts your brand where people already stand with money in hand, and the owner has a reason to recommend your WiFi.",
        "<strong>Areas with weak signal.</strong> STK Push needs a network connection to deliver the prompt. A customer can buy a slip first and connect later.",
      ],
    },
    {
      type: "p",
      html: "Neither option wins everywhere. This is how they compare in practice for <strong>voucher vs M-Pesa hotspot login</strong>.",
    },
    {
      type: "table",
      headers: ["Factor", "Voucher", "M-Pesa on the portal"],
      rows: [
        ["Who it suits", "Cash users, students, people without M-Pesa float", "Most adults with a registered line"],
        ["Where it is sold", "Shops, kiosks, agents, your own counter", "Anywhere in range, any hour"],
        ["Your cost to sell", "Agent commission (commonly 10-20%)", "Payment fees plus your platform fees"],
        ["Staff effort", "Printing, distribution, reconciliation", "Almost none once configured"],
        ["Fraud risk", "Lost slips, code sharing, agent theft", "Low, since each payment is confirmed"],
        ["Cash timing", "After agent pays you", "Immediate, to your Till or Paybill"],
      ],
    },
    {
      type: "callout",
      variant: "info",
      title: "When not to bother with vouchers",
      text: "If your hotspot is in a single building with a receptionist and most users have M-Pesa, vouchers add work for little gain. Start with portal payments and add agents only when you have a place where a shop can sell for you.",
    },
    { type: "h2", id: "denominations-and-validity", text: "Choosing denominations and validity" },
    {
      type: "p",
      html: "Keep the range small. Three or four denominations cover most demand. A common spread is KSh 10 for a short session, KSh 20 for a few hours, KSh 50 for a day and KSh 200 for a week. Your own prices depend on your bandwidth cost and local competition, so treat these as a starting point to test, not a recommendation.",
    },
    { type: "h3", text: "Time-based or data-based?" },
    {
      type: "p",
      html: "<strong>Time-based vouchers</strong> (for example 2 hours) are easy for customers to understand and simple to enforce with <code>limit-uptime</code> on MikroTik. <strong>Data-based vouchers</strong> (for example 500 MB) use <code>limit-bytes-total</code> and suit heavy users, but customers often burn a bundle on background updates and then complain. For a busy public hotspot, time-based with a speed limit per profile is usually easier to support.",
    },
    { type: "h3", text: "Uptime versus validity from first use" },
    {
      type: "p",
      html: "These two are often confused. <strong>Uptime</strong> is the active connected time a code allows, counted only while the user is logged in. <strong>Validity</strong> is the calendar window in which the code can be used at all. A 2-hour code with 24-hour validity from first use means the customer can spend those 2 hours at any point in the day after first login, but the code is dead after 24 hours, even if time remains.",
    },
    {
      type: "p",
      html: "For MikroTik, uptime limits are native. Calendar expiry from first use is usually added with a script or by a RADIUS system. Decide this before you print slips, because the wording on the slip must match the behaviour.",
    },
    { type: "h2", id: "agent-commission-models", text: "Agent commission models that keep you profitable" },
    {
      type: "p",
      html: "There are three common ways to pay an agent for <strong>wifi voucher agent commission in Kenya</strong>. Each moves risk to a different person.",
    },
    {
      type: "table",
      headers: ["Model", "How it works", "Who carries the risk", "Best for"],
      rows: [
        ["Discount on wholesale batch", "Agent pays KSh 1,700 for a batch with KSh 2,000 face value (15% off)", "Agent, once paid", "Trusted shops with steady foot traffic"],
        ["Prepaid float", "Agent deposits money first; codes are released against the balance", "You are protected; agent locks up cash", "New or unknown agents"],
        ["Commission per sale", "You hand over slips on credit; agent pays face value less commission after selling", "You, until the agent pays", "Long-standing agents with a good record"],
      ],
    },
    {
      type: "p",
      html: "Many operators land on a range of 10-20% off face value. The reasoning is simple. Below about 10%, a shop earns too little to give your slips counter space. Above about 20%, your margin on a low-denomination slip disappears once you count bandwidth, printing and your own time. Where you sit in the range should follow volume and risk: a higher percentage for agents who prepay and sell a lot, a lower one for agents on credit.",
    },
    {
      type: "p",
      html: "Check the arithmetic before you promise a rate. A batch of 100 slips at KSh 20 is KSh 2,000 face value. At 15%, the agent pays KSh 1,700 and earns KSh 300 if every slip sells. If an agent sells 300 slips a month, that is about KSh 900 a month, which may not be worth the shop's effort. A very small agent needs a higher percentage or a bonus tier. See also <a href=\"/blog/wifi-hotspot-billing-system-cost-kenya\">what a hotspot billing system costs in Kenya</a> when you work out your own margin.",
    },
    { type: "h2", id: "generating-and-printing", text: "How to generate and print hotspot vouchers" },
    { type: "h3", text: "Code length and character set" },
    {
      type: "p",
      html: "Make codes easy to read and hard to guess. Use uppercase letters and digits, and drop the characters people mix up: <code>0</code> and <code>O</code>, <code>1</code> and <code>I</code>. That leaves 32 symbols, such as <code>23456789ABCDEFGHJKLMNPQRSTUVWXYZ</code>. At 6 characters, that is 32<sup>6</sup>, or about 1.07 billion combinations, which makes guessing impractical against a few thousand live codes.",
    },
    { type: "h3", text: "How to create hotspot vouchers in MikroTik" },
    {
      type: "p",
      html: "In RouterOS v7, define a user profile and then add users. Check the exact parameters in the official MikroTik hotspot documentation for your version.",
    },
    {
      type: "ol",
      items: [
        "Create a profile that allows one device per code: <code>/ip hotspot user profile add name=ksh20-2h shared-users=1 rate-limit=2M/2M</code>",
        "Add a code with a time limit and a batch tag: <code>/ip hotspot user add name=K7M2QX password=K7M2QX profile=ksh20-2h limit-uptime=2h comment=B0412-A03</code>",
        "Repeat for the whole batch. For hundreds of codes, use a script, or a billing system that creates and tracks batches for you. Typing them one by one is how mistakes happen.",
        "Test two codes from each batch yourself before you hand anything out.",
      ],
    },
    { type: "h3", text: "Batch IDs and slips" },
    {
      type: "p",
      html: "Give every batch an ID such as <code>B0412-A03</code> (batch 412, agent 3) and put it on the slip, in the router comment and on your sheet. When something goes wrong, the batch ID tells you whose slip it was. Print on slips with the code in large type, the denomination, the validity in plain words, the portal name to connect to, and your support number. Add one line on how to use it: connect to the WiFi, open any page, enter the code. Slips without instructions come back as support calls.",
    },
    { type: "h2", id: "fraud-and-leakage", text: "Controlling fraud and leakage" },
    {
      type: "p",
      html: "Most losses are small and repeated, not dramatic. These controls handle the common ones.",
    },
    {
      type: "ul",
      items: [
        "<strong>Code sharing.</strong> Set <code>shared-users=1</code> so one code runs on one device at a time, and keep a time limit so shared codes burn out.",
        "<strong>Photo of unsold slips.</strong> At every handover, the agent sends a dated photo of the remaining slips to a WhatsApp group. It costs nothing and discourages quiet resale.",
        "<strong>Voids.</strong> If a slip is damaged or wrongly printed, record it as void against the batch ID, and disable the code on the router.",
        "<strong>Batch reconciliation.</strong> Issued minus redeemed minus unsold must equal what the agent paid for. See the weekly routine below.",
        "<strong>Expiry of unsold stock.</strong> Set codes to become invalid after a redeem-by date, such as 60 days. This stops old stock from circulating and from being sold twice.",
        "<strong>Recall on exit.</strong> When an agent stops, collect the unsold slips, count them and disable those codes the same day.",
      ],
    },
    {
      type: "callout",
      variant: "warning",
      title: "Do not hand over a full month of stock at once",
      text: "Give new agents one small batch, such as 50 to 100 slips, and release the next only after the first is paid for. Trust grows with a record, not with a handshake.",
    },
    { type: "h2", id: "agent-onboarding", text: "Agent onboarding checklist" },
    {
      type: "ol",
      items: [
        "Record the agent's full name, ID number, phone number and shop location.",
        "Agree the commission model and rate in writing, even as a WhatsApp message both sides confirm.",
        "Choose the payment method: prepaid float, or payment on a fixed weekly day to your Till or Paybill.",
        "Hand over the first batch with the batch ID noted, and count the slips together.",
        "Show how a slip works and let the agent test one on their own phone.",
        "Give them a poster and the support number, and add them to the agents' WhatsApp group.",
        "Explain what happens if slips are lost: the agent pays the discounted price for every slip not returned.",
        "Book the first reconciliation date before they leave.",
      ],
    },
    { type: "h2", id: "weekly-reconciliation", text: "A weekly reconciliation routine" },
    {
      type: "p",
      html: "Set one day each week, such as Monday morning, and run the same five steps for every agent: pull the redeemed-code list from the router or billing system, count the unsold slips with the agent or via photo, compare against the batch sheet, collect or confirm payment, and note any differences. Here is a worked example with illustrative numbers.",
    },
    {
      type: "table",
      headers: ["Agent / Batch", "Issued", "Redeemed", "Unsold counted", "Void", "Gap", "Amount due (KSh 20, 15% off)"],
      rows: [
        ["A03 / B0412", "100", "74", "24", "1", "1", "KSh 1,258 (74 x 17)"],
        ["A05 / B0413", "100", "90", "10", "0", "0", "KSh 1,530 (90 x 17)"],
        ["A07 / B0414", "50", "31", "12", "0", "7", "KSh 527 for redeemed; investigate 7"],
      ],
    },
    {
      type: "p",
      html: "A gap of one slip needs a note. A gap of seven slips needs a conversation, and the agent should not get the next batch until it is settled. Any code that shows as redeemed but unpaid means the agent owes you, since the customer already used it. For a deeper look at running a small operation, see <a href=\"/blog/starting-small-as-an-isp-guide\">starting small as an ISP</a>.",
    },
    { type: "h2", id: "marketing-the-network", text: "Marketing your agent network" },
    {
      type: "ul",
      items: [
        "<strong>Point-of-sale poster.</strong> A single A4 or A3 sheet at the till: network name, price list in large numbers, three steps to connect, support number.",
        "<strong>Agent WhatsApp group.</strong> Announce new batches, price changes and downtime. Agents who know about an outage stop selling dead slips and avoid angry customers.",
        "<strong>Customer broadcast.</strong> A WhatsApp status or SMS that says where to buy a slip near them.",
        "<strong>Agent leaderboard.</strong> A small monthly bonus to the top seller costs less than raising commission for everyone.",
      ],
    },
    { type: "h2", id: "where-internetily-fits", text: "Where Internetily fits" },
    {
      type: "p",
      html: "Internetily (Netily) is cloud ISP billing and network management for hotspot and ISP operators in Kenya, Uganda and Tanzania. For this use case it gives you vouchers and agents alongside M-Pesa on the same captive portal, so a customer can either type a code or pay by M-Pesa from the portal. You can also limit hotspot plans to time-of-day windows per day of week, for example cheaper late-night packages, and review revenue in reports. See the <a href=\"/solutions/hotspot-billing-software-kenya\">hotspot billing software for Kenya</a> and <a href=\"/features\">features</a> pages for details.",
    },
    {
      type: "p",
      html: "On cost, Internetily charges 3% of confirmed hotspot revenue, with a KSh 500 monthly minimum. See <a href=\"/pricing\">pricing</a> and run your own numbers in the <a href=\"/pricing#calculator\">calculator</a>. If you only have one router and a handful of customers, a manual MikroTik setup with the commands above may be enough.",
    },
    { type: "h2", id: "faq", text: "Frequently asked questions" },
    { type: "cta" },
  ],
},

  {
  slug: "public-ip-addresses-cgnat-small-isp",
  title: "How Many Public IP Addresses Does a Small ISP Need? CGNAT, Pricing and Setup",
  excerpt:
    "Most small ISPs start with a /29 or /28 and put residential customers behind CGNAT. Here is the sizing maths, where to get IPv4, how to set up CGNAT on MikroTik RouterOS v7, and how to charge for a public IP.",
  coverGradient: "from-blue-600 to-indigo-700",
  coverImage: "/academy/wisp-backhaul.webp",
  coverImageAlt: "ISP backhaul equipment carrying customer traffic that shares public IP addresses through CGNAT",
  category: "Network Operations",
  categoryColor: "blue",
  readTime: 9,
  publishedAt: published,
  updatedAt: published,
  author,
  tags: ["CGNAT", "Public IP", "MikroTik", "IPv4", "IPv6", "Static IP"],
  metaTitle: "How Many Public IPs Does an ISP Need? CGNAT Guide",
  metaDescription:
    "How many public IP addresses does an ISP need? Sizing table, CGNAT on MikroTik RouterOS v7, where to get IPv4 in Kenya, and how to charge for static IPs.",
  keywords: [
    "how many public ip addresses does an isp need",
    "cgnat for small isp",
    "cgnat mikrotik",
    "100.64.0.0/10 shared address space",
    "get ipv4 addresses from afrinic",
    "sell public ip to customers",
    "ipv6 for isps kenya",
    "how many customers per public ip cgnat",
    "mikrotik cgnat src-nat range routeros v7",
    "static ip for pppoe customer mikrotik radius",
    "how to buy ipv4 addresses in kenya",
  ],
  spatialCoverage: ["Kenya", "Uganda", "Tanzania"],
  sources: [
    { title: "RFC 6598: IANA-Reserved IPv4 Prefix for Shared Address Space", url: "https://www.rfc-editor.org/rfc/rfc6598", publisher: "IETF" },
    { title: "AFRINIC: number resources and policies", url: "https://afrinic.net/", publisher: "AFRINIC" },
    { title: "RouterOS documentation: NAT", url: "https://help.mikrotik.com/docs/", publisher: "MikroTik" },
  ],
  faqs: [
    {
      question: "How many public IP addresses does an ISP need?",
      answer:
        "A small ISP can start with a /29 or /28 (6 to 14 usable addresses) and serve hundreds of subscribers behind CGNAT. One public IP serves roughly 16 to 64 subscribers depending on how many ports you allow each one. Add more addresses as concurrent users grow, and for customers who need inbound access.",
    },
    {
      question: "What is CGNAT and does a small ISP need it?",
      answer:
        "CGNAT (carrier-grade NAT) is NAT run by the ISP, so many customers share one public IPv4 address. Most small ISPs that cannot get enough IPv4 space need it, because buying one public IP per customer is rarely affordable. Customers get private addresses from 100.64.0.0/10 and your router translates them to a shared public address.",
    },
    {
      question: "What is the 100.64.0.0/10 address range?",
      answer:
        "100.64.0.0/10 is the IPv4 shared address space reserved by RFC 6598 for carrier-grade NAT. It holds about 4.19 million addresses and is not routable on the public internet. Using it for the customer side of CGNAT avoids clashes with the 192.168.x.x and 10.x.x.x ranges that customers use at home.",
    },
    {
      question: "How do I get IPv4 addresses from AFRINIC?",
      answer:
        "You apply for AFRINIC membership and request resources under its current policy, but the free IPv4 pool is largely exhausted and AFRINIC is in a soft-landing phase with small, limited allocations. Check afrinic.net for the current rules. In practice most small ISPs get a routed block from their upstream provider or lease or transfer addresses instead.",
    },
    {
      question: "How much should I charge a customer for a static public IP?",
      answer:
        "Charge at least what the address costs you per month, plus the support it creates. Many ISPs charge a flat monthly add-on on top of the normal plan. The right figure depends on what your upstream or lessor charges you, so work it out from your own cost and add a margin.",
    },
    {
      question: "Does CGNAT break CCTV remote viewing and gaming?",
      answer:
        "Yes, for anything that needs inbound connections. Port forwarding does not work behind CGNAT, so DVR remote viewing, home servers and some game hosting fail. Fix it by giving those customers a dedicated public IP, or by using a cloud or relay feature in the device.",
    },
    {
      question: "Do I need to keep CGNAT logs?",
      answer:
        "Yes, plan to. With many customers sharing one public IP, the only way to identify who used it at a given time is to record the private address, public address, port range and timestamps. Check your licence conditions and our security guide for what to retain, and do not guess a retention period.",
    },
  ],
  toc: [
    { id: "short-answer", text: "How many public IP addresses does an ISP need?" },
    { id: "sizing-table", text: "Sizing table: subscribers to public IPs" },
    { id: "where-to-get-ipv4", text: "Where to get IPv4 addresses (including AFRINIC)" },
    { id: "who-needs-public-ip", text: "Who needs a dedicated public IP, and how to charge for it" },
    { id: "cgnat-mikrotik", text: "CGNAT on MikroTik RouterOS v7" },
    { id: "what-breaks", text: "What breaks behind CGNAT, and the fixes" },
    { id: "ipv6", text: "IPv6 for ISPs: the long-term answer" },
    { id: "internetily-public-ip", text: "Selling public IPs with Internetily" },
    { id: "faq", text: "Frequently asked questions" },
  ],
  content: [
    { type: "h2", id: "short-answer", text: "How many public IP addresses does an ISP need?" },
    {
      type: "p",
      html: `<strong>Most small ISPs need only a /29 or /28 (6 to 14 usable addresses) from their upstream to start, and put residential subscribers behind CGNAT using 100.64.0.0/10 per RFC 6598. One public IP can serve roughly 16 to 64 subscribers; buy or lease extra addresses only for customers who need inbound access.</strong>`,
    },
    {
      type: "p",
      html: `If you are asking how many public IP addresses an ISP needs, the honest answer is "fewer than you fear". A public IPv4 address is not a connection. It is a door, and a door can have 65,535 ports on it. Your job is to share those ports fairly between customers and to keep a record of who had which ones.`,
    },
    {
      type: "p",
      html: `<strong>CGNAT</strong> (carrier-grade NAT) means your router, not the customer's, does the address translation. The customer's router gets a private address from <code>100.64.0.0/10</code>, and your MikroTik translates it to a shared public address. If you are still planning your first sites, read <a href="/blog/starting-small-as-an-isp-guide">starting small as an ISP</a> first.`,
    },

    { type: "h2", id: "sizing-table", text: "Sizing table: subscribers to public IPs" },
    {
      type: "p",
      html: `The port-block maths is simple. A public IP has 65,535 ports, and roughly the first 1,024 are best left alone, so about 64,000 are usable. Give each active subscriber 1,000 to 4,000 ports and one public IP serves about 16 to 64 of them. A typical browsing household with phones, a smart TV and a few laptops opens hundreds of connections at once, so 2,000 ports (32 subscribers per IP) is a sensible starting point.`,
    },
    {
      type: "table",
      headers: ["Subscribers", "Public IPs at 32:1", "Suggested block", "Usable addresses"],
      rows: [
        ["100", "4", "/29", "6"],
        ["250", "8", "/28", "14"],
        ["500", "16", "/27", "30"],
        ["1,000", "32", "/26", "62"],
        ["2,500", "80", "/25", "126"],
        ["5,000", "160", "/24", "254"],
      ],
    },
    {
      type: "callout",
      variant: "info",
      title: "An engineering rule of thumb, not a standard",
      text: "These figures assume every subscriber is online at once, which they are not. Real peak concurrency is lower, so the table is conservative. Heavy users (streaming, torrents, many cameras) open far more connections, so measure your own connection counts on a busy evening before you trim. The suggested block also leaves room for dedicated-IP customers and your own infrastructure.",
    },

    { type: "h2", id: "where-to-get-ipv4", text: "Where to get IPv4 addresses (including AFRINIC)" },
    {
      type: "p",
      html: `There are three realistic routes, in order of how most small ISPs actually do it:`,
    },
    {
      type: "ol",
      items: [
        `<strong>Your upstream provider.</strong> Ask for a routed /29 or /28 on your transit link. It is the fastest route and needs no paperwork with a registry. The catch is that the addresses belong to them, so renumbering is painful if you change provider.`,
        `<strong>AFRINIC membership.</strong> AFRINIC is the regional internet registry for Africa. To <a href="https://afrinic.net/" target="_blank" rel="noopener noreferrer">get IPv4 addresses from AFRINIC</a> you become a member and apply under its current policy. In general terms, the free IPv4 pool is largely exhausted and AFRINIC allocates small amounts under a soft-landing policy, so expect limits and waiting. Check the site for current rules, because they change.`,
        `<strong>Leasing or transfer markets.</strong> You can lease addresses from a holder or buy through a transfer. Prices vary widely by block size, term and the reputation of the addresses, and they change over time, so get written quotes from several sellers. Check the addresses are not on spam blocklists before you commit.`,
      ],
    },
    {
      type: "p",
      html: `Whichever route you take, ask for the block to be <em>routed</em> to your WAN address, not on-link. A routed block lets you carve it up as you like behind your MikroTik.`,
    },

    { type: "h2", id: "who-needs-public-ip", text: "Who needs a dedicated public IP, and how to charge for it" },
    {
      type: "p",
      html: `Very few residential customers need one. The ones who do usually want to connect <em>in</em> to something at their premises:`,
    },
    {
      type: "ul",
      items: [
        `<strong>CCTV and DVR remote viewing</strong>, where the owner wants to open the live view from a phone.`,
        `<strong>VPN servers</strong> for a business that connects staff to the office.`,
        `<strong>Gamers with strict NAT</strong> who cannot host or join lobbies.`,
        `<strong>Businesses hosting</strong> a web server, mail server, POS back-end or access control system on site.`,
      ],
    },
    {
      type: "p",
      html: `This is a product, not a favour. A dedicated public IP costs you a scarce address and extra support, so sell it as a monthly extra on top of the normal plan (see <a href="/pricing">pricing</a> for how Internetily bills PPPoE plans). Price it from your own cost per address plus a margin; an example figure is meaningless because your cost depends on how you source the block. State the rules in your terms: one address per account, no resale, and the customer secures their own device.`,
    },
    {
      type: "callout",
      variant: "tip",
      title: "Keep the sellable IPs separate",
      text: "Keep your CGNAT pool and your dedicated-IP pool in different parts of your block. If a dedicated customer's camera gets abused and the address lands on a blocklist, it must not take down the shared addresses that hundreds of subscribers use.",
    },

    { type: "h2", id: "cgnat-mikrotik", text: "CGNAT on MikroTik RouterOS v7" },
    {
      type: "p",
      html: `<strong>100.64.0.0/10 shared address space</strong> is defined by <a href="https://www.rfc-editor.org/rfc/rfc6598" target="_blank" rel="noopener noreferrer">RFC 6598</a> for exactly this job. Do not use ordinary private ranges for the customer side, because customers already use 192.168.x.x and 10.x.x.x behind their own routers and the overlap causes confusing faults. These steps assume PPPoE; adapt the interfaces for hotspot or static setups. The examples use <code>203.0.113.8/29</code>, a documentation range, so swap in your own block.`,
    },
    { type: "h3", text: "Step 1: Create the shared-address pool and PPPoE profile" },
    {
      type: "ul",
      items: [
        `<code>/ip pool add name=cgnat-pool ranges=100.64.0.10-100.64.3.254</code>`,
        `<code>/ppp profile add name=cgnat local-address=100.64.0.1 remote-address=cgnat-pool</code>`,
      ],
    },
    { type: "h3", text: "Step 2: Map customer blocks to public addresses" },
    {
      type: "p",
      html: `A single rule with a <code>to-addresses</code> range works, but it does not tell you which public IP a given customer will use. A simpler design for record keeping is one rule per slice of the pool, so each slice always maps to the same public IP. Use <code>out-interface-list</code>, not an interface name, so it survives link changes:`,
    },
    {
      type: "ul",
      items: [
        `<code>/interface list add name=WAN</code>`,
        `<code>/interface list member add list=WAN interface=ether1</code>`,
        `<code>/ip firewall nat add chain=srcnat src-address=100.64.0.0/27 out-interface-list=WAN action=src-nat to-addresses=203.0.113.9 comment="CGNAT slice 1"</code>`,
        `<code>/ip firewall nat add chain=srcnat src-address=100.64.0.32/27 out-interface-list=WAN action=src-nat to-addresses=203.0.113.10 comment="CGNAT slice 2"</code>`,
        `<code>/ip firewall nat add chain=srcnat src-address=100.64.0.64/27 out-interface-list=WAN action=src-nat to-addresses=203.0.113.11 comment="CGNAT slice 3"</code>`,
      ],
    },
    {
      type: "p",
      html: `Each /27 slice holds 32 addresses, which matches the 32:1 ratio. Add one rule per slice as you grow, or put several public IPs in the <code>to-addresses</code> range to cover a bigger slice. For a one-to-one mapping between two equal-sized ranges, <code>action=netmap</code> also works. A plain <code>action=masquerade</code> is fine for a first site with a single public address, but it follows the WAN interface address and gives you no control over which public IP is used.`,
    },
    { type: "h3", text: "Step 3: Limit connections per subscriber" },
    {
      type: "p",
      html: `RouterOS does not give you fixed port blocks per subscriber, so protect the shared port space with a per-address connection cap. In <code>connection-limit=value,netmask</code>, a /32 netmask means the limit applies per source address:`,
    },
    {
      type: "ul",
      items: [
        `<code>/ip firewall filter add chain=forward src-address=100.64.0.0/10 protocol=tcp connection-state=new connection-limit=2000,32 action=drop comment="CGNAT per-sub cap"</code>`,
      ],
    },
    {
      type: "p",
      html: `Place it after your established/related accept rule and before other accept rules, then tune the number against what your busiest customers really use. Too low and video calls fail; too high and one infected PC can exhaust a whole public IP.`,
    },
    { type: "h3", text: "Step 4: Keep logs so you can answer a request" },
    {
      type: "p",
      html: `When police or the regulator ask who used a public IP at a certain time, "it was shared" is not an answer. Send session records to a remote syslog server or flow collector. The simplest start is logging from the NAT rules to a remote action, but this is heavy on a busy router, so test the load first:`,
    },
    {
      type: "ul",
      items: [
        `<code>/system logging action add name=remote target=remote remote=10.10.10.5 remote-port=514</code>`,
        `<code>/system logging add topics=firewall action=remote</code>`,
        `<code>/ip firewall nat set [find comment="CGNAT slice 1"] log=yes log-prefix="CGNAT1 "</code>`,
      ],
    },
    {
      type: "p",
      html: `Also keep RADIUS accounting records, which tie a username to its 100.64.x.x address and session times. Together the two let you trace public IP, port and time back to a subscriber. For what to keep and for how long, follow your licence conditions and our <a href="/blog/isp-cybersecurity-mikrotik-mpesa-data-2026">ISP cybersecurity guide</a>; we will not invent a retention period here. See also the <a href="/blog/kenya-isp-licensing-framework-2026">Kenya licensing framework</a>. MikroTik documents NAT actions on <a href="https://help.mikrotik.com/docs/" target="_blank" rel="noopener noreferrer">help.mikrotik.com</a>.`,
    },

    { type: "h2", id: "what-breaks", text: "What breaks behind CGNAT, and the fixes" },
    {
      type: "table",
      headers: ["What breaks", "Why", "Fix"],
      rows: [
        ["CCTV and DVR remote viewing", "No inbound port forwarding", "Dedicated public IP, or the device's cloud/relay feature"],
        ["Self-hosted VPN server", "No inbound connection reaches it", "Dedicated public IP, or a small cloud server that both ends connect out to"],
        ["Strict NAT in games", "Peer-to-peer needs inbound traffic", "Dedicated IP, or IPv6 where the game supports it"],
        ["Captchas and IP bans", "Hundreds of users share one reputation", "Spread users across more IPs; watch for abuse and block it quickly"],
        ["Torrent seeding, SIP phones", "Inbound ports and long-lived sessions", "Dedicated IP; raise NAT timeouts for SIP"],
        ["Some banking and geo checks", "Shared address looks unusual", "Ask the customer to retry on a dedicated IP"],
      ],
    },
    {
      type: "p",
      html: `The most common support call is the CCTV one. Tell customers about it at signup and offer the add-on there. It is much better than a refund request three weeks later.`,
    },

    { type: "h2", id: "ipv6", text: "IPv6 for ISPs: the long-term answer" },
    {
      type: "p",
      html: `CGNAT only stretches IPv4. IPv6 removes the shortage, and every customer gets a real, routable address with no port sharing. Run <strong>dual-stack</strong>: customers keep IPv4 (behind CGNAT) and also receive IPv6. Delegate a <strong>/56</strong> to each customer by DHCPv6 prefix delegation (a /64 is the minimum if you must be frugal), so their router can number every LAN. You need an IPv6 block from your upstream or AFRINIC first. If you are weighing IPv6 for ISPs in Kenya, the practical question is whether your customers' devices and routers support it. Many do, so test on a few staff accounts before rolling out.`,
    },
    {
      type: "ul",
      items: [
        `<code>/ipv6 pool add name=pd-pool prefix=2001:db8:100::/40 prefix-length=56</code>`,
        `<code>/ipv6 dhcp-server add name=pd-server interface=bridge-lan address-pool=pd-pool lease-time=1d</code>`,
      ],
    },
    {
      type: "p",
      html: `The prefix above is a documentation range. On PPPoE networks the DHCPv6 server binds to the PPP interface, so test your exact design in a lab before production.`,
    },

    { type: "h2", id: "internetily-public-ip", text: "Selling public IPs with Internetily" },
    {
      type: "p",
      html: `Internetily (Netily) runs FreeRADIUS authentication for your PPPoE subscribers, so giving a customer a fixed public address means returning a <code>Framed-IP-Address</code> for their username. The customer always gets the same address, and everyone else stays on CGNAT. Put static-IP customers on their own plan, priced at the normal plan plus your address fee, so the extra charge is billed every month without a spreadsheet. Pricing is KSh 25 per billable PPPoE subscriber per month (KSh 500 monthly minimum), and <a href="/pricing#calculator">the calculator</a> shows your total.`,
    },
    {
      type: "p",
      html: `If you buy transit from more than one upstream, you will also want your shared addresses to survive a link failure. Internetily includes <a href="/features/load-balancing-failover">MikroTik load balancing and automatic failover</a> across 2 to 6 links on every plan. Read the <a href="/blog/mikrotik-load-balancing-failover-isp">load balancing guide</a> first, because NAT rules need to be written with failover in mind.`,
    },

    { type: "h2", id: "faq", text: "Frequently asked questions" },
    { type: "cta" },
  ],
},
]
