import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, Check, Clock, CreditCard, Globe, Router, ShieldCheck, TrendingUp, Wifi } from "lucide-react"

type SolutionConfig = {
  title: string
  description: string
  eyebrow: string
  regionLabel?: string
  currency?: string
  currencySymbol?: string
  hero: string
  summary: string
  bullets: string[]
  paymentGateways?: string[]
  marketNotes?: string[]
  localUseCases?: string[]
  proofStats?: string[]
  outcomePillars?: Array<{
    title: string
    context: string
    bullets: string[]
    result: string
  }>
  technicalStack?: string[]
  pricingNotes?: string[]
  onboardingSteps?: string[]
  closingUseCases?: string[]
  seoTitle: string
  seoDescription: string
}

const DEFAULT_PROOF_STATS = [
  "Built around ISP billing, hotspot, PPPoE, and MikroTik workflows",
  "Supports local payment planning, staff roles, leads, and support work",
  "Useful for small ISPs, WISPs, estates, campuses, and managed Wi-Fi teams",
]

const DEFAULT_OUTCOME_PILLARS = [
  {
    title: "Billing feels less manual",
    context: "Most growing ISPs lose time reconciling payments, checking expired customers, and chasing renewals.",
    bullets: ["Track plans, invoices, payments, and subscriber status together", "Keep payment follow-up close to customer records", "Use reminders and dashboards to spot gaps earlier"],
    result: "Your team spends less time hunting for billing context.",
  },
  {
    title: "Router work stays connected",
    context: "Billing software only helps if the network team can trust what happens after a customer pays.",
    bullets: ["MikroTik-aware PPPoE and hotspot workflows", "Router, customer, and plan visibility in one place", "Cleaner handoff between billing, support, and network work"],
    result: "Customer access and billing status stay easier to reconcile.",
  },
  {
    title: "Growth is easier to follow",
    context: "Leads, support issues, referrals, and renewals should not live in separate chats and spreadsheets.",
    bullets: ["Capture enquiries from public pages", "Use staff permissions for cleaner team control", "Review customer, revenue, and usage trends from dashboards"],
    result: "Sales, support, and finance can work from the same source of truth.",
  },
]

const DEFAULT_TECHNICAL_STACK = ["MikroTik RouterOS API", "PPPoE subscriber workflows", "Hotspot captive portals", "RADIUS-ready operations", "Payment webhooks and transaction references", "Staff permissions and audit-friendly dashboards"]

const DEFAULT_PRICING_NOTES = [
  "Free trial available before activation",
  "KES 500 activation after trial on the metered plan",
  "Usage-based billing can be estimated in the buyer's regional currency",
]

const DEFAULT_ONBOARDING_STEPS = [
  "Day 1: confirm plans, billing cycle, staff roles, and payment workflow",
  "Day 2: connect router, portal, and customer operating details",
  "Day 3: test payment, access, support, and renewal flows",
  "Week 1: review live usage, fix edge cases, and train the team",
]

const SOLUTIONS: Record<string, SolutionConfig> = {
  "isp-billing-software-kenya": {
    title: "ISP Billing Software Kenya",
    description: "Billing software for Kenyan fiber and broadband ISPs with M-Pesa collections, automated invoicing, and subscriber lifecycle workflows.",
    eyebrow: "Fiber and broadband operations",
    hero: "Run Kenyan ISP billing from payment collection to subscriber state changes without juggling disconnected tools.",
    summary: "Netily helps fiber and fixed broadband operators manage recurring plans, payment events, invoices, suspensions, and reconnections in one platform built for local ISP operations.",
    bullets: [
      "Automate M-Pesa collections and recurring billing cycles",
      "Keep subscriber, invoice, and service status in one workflow",
      "Reduce manual reconnection and follow-up work for your team",
    ],
    seoTitle: "ISP Billing Software Kenya | Netily",
    seoDescription: "Netily is ISP billing software for Kenya with M-Pesa automation, invoicing, subscriber management, and operational workflows for growing ISPs.",
  },
  "hotspot-billing-software-kenya": {
    title: "Hotspot Billing Software Kenya",
    description: "Manage captive portals, hotspot sessions, micropayments, and vouchers with a workflow shaped for Kenyan Wi-Fi operators.",
    eyebrow: "Hotspot providers",
    hero: "Launch branded hotspot billing with payment collection, user sessions, and access control in one place.",
    summary: "Netily gives hotspot operators a cleaner way to run Wi-Fi access sales, branded captive portals, session control, and customer communication without piecing together multiple systems.",
    bullets: [
      "Branded captive portal workflows for hotspot access",
      "Voucher, session, and user-state management in one tool",
      "Payment-aware hotspot operations for day-to-day control",
    ],
    seoTitle: "Hotspot Billing Software Kenya | Netily",
    seoDescription: "Netily helps Kenyan hotspot operators manage captive portals, vouchers, session control, and payment-linked hotspot billing workflows.",
  },
  "mikrotik-billing-software": {
    title: "MikroTik Billing Software",
    description: "MikroTik-aware billing and subscriber operations for PPPoE, hotspot, and router-linked internet service workflows.",
    eyebrow: "MikroTik workflows",
    hero: "Bring MikroTik provisioning, billing, and subscriber management into one operating layer.",
    summary: "Netily is designed for operators who rely on MikroTik for PPPoE or hotspot delivery and want payment events, provisioning logic, and customer service flow to stay aligned.",
    bullets: [
      "PPPoE and hotspot workflows built with MikroTik operations in mind",
      "Fewer manual subscriber state changes after payment updates",
      "Operational visibility across routers, sessions, and collections",
    ],
    seoTitle: "MikroTik Billing Software | Netily",
    seoDescription: "Netily offers MikroTik billing software for PPPoE and hotspot operators with subscriber automation, billing workflows, and operational visibility.",
  },
  "mpesa-isp-billing": {
    title: "M-Pesa ISP Billing",
    description: "M-Pesa-first ISP billing for operators who want a tighter payment-to-service workflow across subscriber operations.",
    eyebrow: "Mobile money billing",
    hero: "Collect payments through M-Pesa and keep service activation close to the actual billing event.",
    summary: "Netily is built for East African ISPs that need M-Pesa-linked billing operations, payment-aware follow-up, and cleaner visibility into collection and service status.",
    bullets: [
      "Payment collection workflows designed around M-Pesa habits",
      "Reduce lag between payment confirmation and subscriber action",
      "Track collections in the same system as ISP operations",
    ],
    seoTitle: "M-Pesa ISP Billing Software | Netily",
    seoDescription: "Netily gives Kenyan and East African ISPs an M-Pesa-first billing workflow for collections, subscriber status, and operational follow-up.",
  },
  "isp-billing-software-uganda": {
    title: "ISP Billing Software Uganda",
    description: "ISP billing and management workflows for Ugandan fiber, wireless, and hotspot operators using MTN MoMo, Airtel Money, card, and mobile-money collection flows.",
    eyebrow: "Uganda ISP growth",
    regionLabel: "Uganda",
    currency: "UGX",
    currencySymbol: "USh",
    hero: "Run billing, subscribers, staff roles, reminders, and network-linked operations from one ISP platform shaped for Ugandan operators.",
    summary: "Netily helps Ugandan ISPs organize subscriber billing, payment follow-up, MikroTik operations, support tickets, staff permissions, and lead conversion without stitching together spreadsheets and disconnected tools. It is a practical fit for Kampala, Wakiso, Entebbe, Jinja, Mbarara, Gulu, and regional WISPs that need cleaner collection visibility.",
    bullets: [
      "Manage PPPoE, hotspot, and subscriber lifecycle workflows",
      "Track leads, support, reminders, and billing activity in one place",
      "Support MTN MoMo, Airtel Money, cards, and gateway-led mobile-money reconciliation planning",
    ],
    paymentGateways: ["MTN MoMo", "Airtel Money Uganda", "Flutterwave Uganda Mobile Money", "Pesapal", "Card and bank transfer workflows"],
    marketNotes: [
      "Use mobile-money-first payment prompts for residential broadband customers who already pay utilities from a phone.",
      "Keep payment status, reconnection work, and support follow-up close together so field teams do not depend on manual chat screenshots.",
      "Plan gateways around settlement needs, webhook availability, reversal handling, and how quickly paid customers should regain access.",
    ],
    localUseCases: ["Kampala apartment ISPs", "Wakiso WISPs", "Campus Wi-Fi", "Estate broadband", "Public hotspot operators"],
    seoTitle: "ISP Billing Software Uganda | MTN MoMo, Airtel Money & MikroTik | Netily",
    seoDescription: "Netily helps Ugandan ISPs manage billing, MTN MoMo and Airtel Money workflows, MikroTik, hotspot operations, staff roles, support, and growth leads.",
  },
  "isp-billing-software-tanzania": {
    title: "ISP Billing Software Tanzania",
    description: "ISP management software for Tanzanian WISPs, fiber operators, hotspot providers, and growing internet businesses using M-Pesa, Tigo Pesa, Airtel Money, cards, and mobile money gateways.",
    eyebrow: "Tanzania ISP operations",
    regionLabel: "Tanzania",
    currency: "TZS",
    currencySymbol: "TSh",
    hero: "Bring billing, customers, routers, hotspot access, and team workflows into one platform for Tanzanian ISP growth.",
    summary: "Netily supports Tanzanian ISPs with a practical operating layer for recurring billing, MikroTik-aware subscriber workflows, customer support, staff permissions, dashboard visibility, and sales lead handling. It works well for Dar es Salaam, Arusha, Mwanza, Dodoma, Zanzibar, Moshi, and regional broadband teams comparing mobile-money-friendly ISP software.",
    bullets: [
      "Unify customers, payments, support, and router-linked operations",
      "Use staff roles and dashboards to keep teams accountable",
      "Plan collections around M-Pesa, Airtel Money, Tigo Pesa, cards, and regional gateway options",
    ],
    paymentGateways: ["Vodacom M-Pesa Tanzania", "Airtel Money Tanzania", "Tigo Pesa", "Flutterwave Tanzania Mobile Money", "Pesapal", "Visa and Mastercard cards"],
    marketNotes: [
      "Match payment prompts to local wallet habits so customers can pay from the channel they already trust.",
      "Keep hotspot revenue, PPPoE subscriptions, invoices, and customer state changes visible from one operating dashboard.",
      "Use gateway webhooks and transaction references to reduce manual reconciliation after busy evening and weekend payment periods.",
    ],
    localUseCases: ["Dar es Salaam fiber ISPs", "Arusha WISPs", "Zanzibar hospitality Wi-Fi", "Mwanza estates", "Campus and hostel hotspot billing"],
    seoTitle: "ISP Billing Software Tanzania | M-Pesa, Tigo Pesa, Airtel Money & MikroTik | Netily",
    seoDescription: "Netily is ISP billing software for Tanzania with M-Pesa, Tigo Pesa, Airtel Money planning, subscriber management, MikroTik, hotspot billing, support, and lead capture.",
  },
  "isp-billing-software-south-africa": {
    title: "ISP Billing Software South Africa",
    description: "ISP billing and subscriber management software for South African fiber, WISP, hotspot, estate, and managed Wi-Fi operators using EFT, cards, QR, and gateway payment flows.",
    eyebrow: "South Africa ISP operations",
    regionLabel: "South Africa",
    currency: "ZAR",
    currencySymbol: "R",
    hero: "Give South African ISPs a cleaner operating layer for billing, subscribers, routers, support, payments, and recurring service visibility.",
    summary: "Netily helps South African ISPs and managed Wi-Fi teams organize customer records, billing cycles, MikroTik-linked operations, hotspot access, staff roles, and support follow-up. It is positioned for operators serving Johannesburg, Pretoria, Cape Town, Durban, Gqeberha, Bloemfontein, estates, student accommodation, and regional WISPs.",
    bullets: [
      "Manage PPPoE, hotspot, invoices, payments, support, and staff access from one dashboard",
      "Plan payment workflows around Instant EFT, PayShap, cards, QR payments, and bank transfer reconciliation",
      "Keep enterprise, estate, campus, and public Wi-Fi operations visible as subscriber counts grow",
    ],
    paymentGateways: ["Payfast by Network", "Ozow Pay by Bank", "Peach Payments", "PayShap Request", "Cards, Instant EFT, QR, and bank transfer workflows"],
    marketNotes: [
      "South African customers often expect card, EFT, QR, and bank-backed options, so gateway choice should match both online checkout and reconciliation needs.",
      "Estate and campus operators benefit from separating subscriber status, invoice state, support requests, and router actions without creating more spreadsheets.",
      "For larger ISPs, gateway reporting, settlement exports, refunds, and audit trails matter as much as the checkout screen.",
    ],
    localUseCases: ["Johannesburg WISPs", "Cape Town managed Wi-Fi", "Durban apartment internet", "Estate broadband", "Student accommodation networks"],
    seoTitle: "ISP Billing Software South Africa | Payfast, Ozow, EFT & MikroTik | Netily",
    seoDescription: "Netily helps South African ISPs manage billing, subscribers, MikroTik, hotspot access, support, staff roles, and payment workflows for Payfast, Ozow, EFT, cards, and QR.",
  },
  "isp-billing-software-united-kingdom": {
    title: "ISP Billing Software United Kingdom",
    description: "ISP billing and operations software for UK altnets, WISPs, managed Wi-Fi providers, estates, campuses, and local broadband operators.",
    eyebrow: "UK altnet and WISP operations",
    regionLabel: "United Kingdom",
    currency: "GBP",
    currencySymbol: "£",
    hero: "Run UK ISP billing, customers, support, routers, and renewals from one practical operating platform.",
    summary: "Internetily helps UK altnets, WISPs, fibre operators, estate networks, student accommodation providers, and managed Wi-Fi teams keep billing, subscriber status, support work, and MikroTik-linked operations easier to follow.",
    bullets: [
      "Organise recurring broadband plans, renewals, customer records, and team work",
      "Plan payment collection around Direct Debit, card, bank transfer, and Stripe workflows",
      "Keep customer support, lead follow-up, and router-linked actions visible as the network grows",
    ],
    paymentGateways: ["GoCardless Direct Debit", "Stripe", "PayPal", "Worldpay", "Open Banking and bank transfer workflows"],
    marketNotes: [
      "UK buyers usually care about predictable direct debit collection, clean invoices, and simple customer communication.",
      "Altnets and WISPs need billing software that does not make network teams jump between spreadsheets, router notes, and support chats.",
      "For managed Wi-Fi and accommodation networks, fast plan changes and clear support visibility matter as much as payment collection.",
    ],
    localUseCases: ["UK altnets", "Rural WISPs", "Student accommodation Wi-Fi", "Estate broadband", "Managed business Wi-Fi"],
    seoTitle: "ISP Billing Software UK | Direct Debit, Stripe, MikroTik & WISPs | Internetily",
    seoDescription: "Internetily helps UK altnets, WISPs, fibre providers, estates, and managed Wi-Fi teams manage ISP billing, Direct Debit, Stripe, MikroTik workflows, support, and renewals.",
  },
  "isp-billing-software-usa": {
    title: "ISP Billing Software USA",
    description: "ISP billing and management software for American WISPs, fiber providers, MDUs, campgrounds, rural broadband teams, and hotspot operators.",
    eyebrow: "USA WISP and fiber operations",
    regionLabel: "United States",
    currency: "USD",
    currencySymbol: "$",
    hero: "Give US WISPs and local broadband teams a cleaner way to run billing, subscribers, support, and network-linked operations.",
    summary: "Internetily is a practical ISP operating layer for US WISPs, fiber providers, MDUs, RV parks, campgrounds, hospitality networks, and managed Wi-Fi teams that want billing, customer records, support, and router-aware workflows in one place.",
    bullets: [
      "Track recurring subscriptions, hotspot plans, support requests, and customer status together",
      "Plan payments around cards, ACH, Stripe, PayPal, and gateway webhooks",
      "Give owners, support, and network staff clearer visibility without adding another spreadsheet",
    ],
    paymentGateways: ["Stripe", "ACH bank payments", "Authorize.net", "PayPal", "Square", "Card and bank transfer workflows"],
    marketNotes: [
      "US operators often compare several ISP platforms, so clarity on billing, support, permissions, and router workflows matters early.",
      "WISPs and rural broadband teams need simple operational visibility without forcing every workflow into enterprise-heavy software.",
      "MDUs, campgrounds, and hospitality operators benefit from hotspot and recurring subscriber workflows living together.",
    ],
    localUseCases: ["Rural WISPs", "Fiber providers", "MDU broadband", "RV park Wi-Fi", "Hotel and campground hotspots"],
    seoTitle: "ISP Billing Software USA | WISP, Fiber, ACH, Stripe & MikroTik | Internetily",
    seoDescription: "Internetily helps US WISPs, fiber ISPs, MDUs, campgrounds, and hotspot operators manage billing, ACH, Stripe, MikroTik workflows, support, subscribers, and renewals.",
  },
  "isp-billing-software-australia": {
    title: "ISP Billing Software Australia",
    description: "ISP billing and subscriber management software for Australian WISPs, regional broadband operators, managed Wi-Fi providers, and hotspot teams.",
    eyebrow: "Australia ISP operations",
    regionLabel: "Australia",
    currency: "AUD",
    currencySymbol: "A$",
    hero: "Run Australian ISP billing, subscribers, support, and access workflows with less manual follow-up.",
    summary: "Internetily helps Australian WISPs, regional broadband providers, managed Wi-Fi operators, accommodation networks, and hotspot teams keep payment collection, subscriber state, support requests, and MikroTik workflows in one system.",
    bullets: [
      "Manage recurring plans, hotspot sales, customer support, and team permissions",
      "Plan payment workflows around BECS Direct Debit, cards, Stripe, GoCardless, and bank transfer",
      "Keep router-linked operations and billing context close enough for fast daily decisions",
    ],
    paymentGateways: ["Stripe", "BECS Direct Debit", "GoCardless", "Pin Payments", "PayPal", "Card and bank transfer workflows"],
    marketNotes: [
      "Australian regional and fixed wireless teams need dependable billing visibility without a heavy implementation project.",
      "Direct debit, card collection, invoice clarity, and settlement reporting are important for recurring residential broadband.",
      "Managed Wi-Fi operators need hotspot, voucher, and support workflows that are simple for non-technical staff to run.",
    ],
    localUseCases: ["Regional WISPs", "Managed apartment Wi-Fi", "Holiday park hotspots", "Student housing networks", "Small fiber operators"],
    seoTitle: "ISP Billing Software Australia | WISP, BECS, Stripe & MikroTik | Internetily",
    seoDescription: "Internetily helps Australian WISPs, regional ISPs, managed Wi-Fi providers, and hotspot teams manage billing, BECS, Stripe, MikroTik workflows, support, and renewals.",
  },
  "isp-billing-software-new-zealand": {
    title: "ISP Billing Software New Zealand",
    description: "ISP billing and operations software for New Zealand WISPs, regional broadband providers, managed Wi-Fi teams, and hotspot operators.",
    eyebrow: "New Zealand ISP operations",
    regionLabel: "New Zealand",
    currency: "NZD",
    currencySymbol: "NZ$",
    hero: "Help New Zealand broadband and managed Wi-Fi teams keep billing, customers, support, and access control in one place.",
    summary: "Internetily supports New Zealand WISPs, regional broadband operators, accommodation Wi-Fi teams, campuses, and hotspot providers with simpler billing, customer records, support visibility, and MikroTik-aware workflows.",
    bullets: [
      "Run recurring broadband and hotspot workflows from one dashboard",
      "Plan payment collection around cards, account-to-account payments, Stripe, Windcave, and bank transfer",
      "Keep subscriber state, support issues, and router-linked operations easier to reconcile",
    ],
    paymentGateways: ["Stripe", "Windcave", "Account-to-account payment workflows", "PayPal", "Card and bank transfer workflows"],
    marketNotes: [
      "New Zealand operators often need lean software that supports small teams, regional coverage, and practical customer follow-up.",
      "Card, bank transfer, and account-to-account workflows should be planned around reconciliation and customer communication.",
      "For accommodation, campus, and hotspot networks, support visibility and simple plan controls help reduce daily admin.",
    ],
    localUseCases: ["Regional WISPs", "Accommodation Wi-Fi", "Campus networks", "Rural broadband", "Hotspot operators"],
    seoTitle: "ISP Billing Software New Zealand | WISP, Stripe, Windcave & MikroTik | Internetily",
    seoDescription: "Internetily helps New Zealand WISPs, regional broadband teams, managed Wi-Fi providers, and hotspot operators manage billing, Stripe, Windcave, MikroTik, support, and renewals.",
  },
  "isp-billing-software-rwanda": {
    title: "ISP Billing Software Rwanda",
    description: "ISP billing and customer management platform for Rwandan broadband, WISP, campus WiFi, and hotspot operators.",
    eyebrow: "Rwanda ISP management",
    hero: "Give your Rwanda ISP a cleaner system for billing, subscriber access, staff work, support, and growth follow-up.",
    summary: "Netily helps Rwandan ISPs manage customer records, billing cycles, MikroTik-linked operations, hotspot workflows, support tickets, staff permissions, and lead conversion from one hosted system.",
    bullets: [
      "Track billing cycles, customers, routers, and support together",
      "Improve operations with role-based team controls",
      "Capture and qualify leads from organic search and referrals",
    ],
    seoTitle: "ISP Billing Software Rwanda | Netily",
    seoDescription: "Netily helps Rwanda ISPs manage billing, subscriber workflows, MikroTik operations, hotspot access, support tickets, staff roles, and growth leads.",
  },
  "isp-billing-software-burundi": {
    title: "ISP Billing Software Burundi",
    description: "ISP management software for Burundi internet operators who need billing, subscribers, routers, support, and growth workflows.",
    eyebrow: "Burundi ISP growth",
    hero: "A modern ISP operating platform for Burundi teams managing subscribers, billing, support, routers, and customer growth.",
    summary: "Netily gives Burundi ISPs a single place to organize plans, customers, recurring billing activity, MikroTik-aware operations, hotspot access, staff permissions, and sales enquiries.",
    bullets: [
      "Manage ISP customers, plans, billing cycles, and support activity",
      "Keep router-linked subscriber actions closer to payment status",
      "Create a clearer path from lead enquiry to active customer",
    ],
    seoTitle: "ISP Billing Software Burundi | Netily",
    seoDescription: "Netily provides ISP billing software for Burundi with customer management, billing workflows, MikroTik operations, hotspot access, staff roles, and lead capture.",
  },
  "isp-billing-software-south-sudan": {
    title: "ISP Billing Software South Sudan",
    description: "ISP billing and operations software for South Sudan broadband, WISP, hotspot, and community internet providers.",
    eyebrow: "South Sudan ISP operations",
    hero: "Manage billing, subscribers, routers, support, and staff operations as your South Sudan ISP grows.",
    summary: "Netily helps South Sudan ISPs move from manual billing and scattered follow-up into a more organized system for customers, plans, support tickets, staff permissions, and MikroTik-aware workflows.",
    bullets: [
      "Coordinate customers, plans, billing activity, and support follow-up",
      "Use operational dashboards to reduce manual blind spots",
      "Build lead generation pages that convert search traffic into demos",
    ],
    seoTitle: "ISP Billing Software South Sudan | Netily",
    seoDescription: "Netily helps South Sudan ISPs manage billing, customers, MikroTik workflows, hotspot operations, support tickets, staff roles, and growth leads.",
  },
  "isp-billing-software-nairobi": {
    title: "ISP Billing Software Nairobi",
    description: "ISP billing and WiFi management for Nairobi enterprise ISPs, co-working spaces, hotels, apartments, estates, campuses, and office networks.",
    eyebrow: "Nairobi enterprise ISP growth",
    hero: "Manage Nairobi ISP billing, enterprise WiFi, co-working access, hotel internet, staff roles, and customer support from one operating system.",
    summary: "Netily helps Nairobi operators serve enterprise ISPs, co-working spaces, hotels, apartments, malls, student hostels, and residential estates with M-Pesa-first billing, MikroTik workflows, hotspot access, customer portals, reminders, and support tickets.",
    bullets: [
      "Enterprise ISP billing for Nairobi offices, estates, schools, and managed WiFi teams",
      "Co-working and hotel WiFi workflows with hotspot access, vouchers, and support visibility",
      "Lead capture and follow-up for Nairobi buyers comparing ISP software and WiFi billing tools",
    ],
    seoTitle: "ISP Billing Software Nairobi | Enterprise ISPs, Hotels & Co-working | Netily",
    seoDescription: "Netily helps Nairobi enterprise ISPs, hotels, co-working spaces, apartments, estates, and campuses manage billing, M-Pesa payments, MikroTik, hotspot access, and support.",
  },
  "isp-billing-software-mombasa": {
    title: "ISP Billing Software Mombasa",
    description: "ISP billing and hotspot management for Mombasa tourist hotels, beach resorts, apartments, restaurants, public WiFi, and coastal WISPs.",
    eyebrow: "Mombasa hotel and resort WiFi",
    hero: "Run Mombasa ISP billing, resort WiFi, hotel captive portals, apartment internet, and coastal hotspot operations in one place.",
    summary: "Netily helps Mombasa and coastal operators manage tourist hotels, beach resorts, apartments, restaurants, public hotspots, and WISP subscribers with billing cycles, M-Pesa payments, MikroTik workflows, vouchers, reminders, and support tickets.",
    bullets: [
      "Hotel and beach resort WiFi billing with captive portal and voucher workflows",
      "Apartment and residential internet billing for coastal property operators",
      "M-Pesa-first collections and support workflows for Mombasa ISPs and hotspot teams",
    ],
    seoTitle: "ISP Billing Software Mombasa | Hotels, Beach Resorts & Apartments | Netily",
    seoDescription: "Netily helps Mombasa hotels, beach resorts, apartments, coastal WISPs, and hotspot operators manage ISP billing, M-Pesa payments, MikroTik, vouchers, and support.",
  },
  "isp-billing-software-kisumu": {
    title: "ISP Billing Software Kisumu",
    description: "ISP billing software for Kisumu regional WISPs, student hostels, campuses, estates, hotspots, and Lake Victoria broadband operators.",
    eyebrow: "Kisumu WISP and hostel internet",
    hero: "Support Kisumu WISPs, student hostels, estates, and campus WiFi with cleaner billing, access control, and customer follow-up.",
    summary: "Netily helps Kisumu ISPs and Lake Region operators manage regional WISP customers, student hostels, campus WiFi, apartment internet, hotspot access, payment reminders, support tickets, and MikroTik-linked subscriber workflows.",
    bullets: [
      "Regional WISP billing for Kisumu, Lake Victoria towns, and nearby counties",
      "Student hostel and campus WiFi billing with vouchers, self-service, and support visibility",
      "Router-linked subscriber workflows for PPPoE, hotspot, and recurring internet plans",
    ],
    seoTitle: "ISP Billing Software Kisumu | WISPs, Student Hostels & Campus WiFi | Netily",
    seoDescription: "Netily helps Kisumu WISPs, student hostels, campuses, estates, and hotspot operators manage billing, M-Pesa payments, MikroTik, vouchers, and support.",
  },
  "isp-billing-software-eldoret": {
    title: "ISP Billing Software Eldoret",
    description: "ISP billing and network operations for Eldoret agricultural businesses, retail chains, estates, WISPs, and growing broadband operators.",
    eyebrow: "Eldoret agriculture and retail networks",
    hero: "Manage Eldoret ISP billing, agricultural business connectivity, retail chain WiFi, estates, routers, and support from one platform.",
    summary: "Netily helps Eldoret and North Rift internet operators serve agricultural businesses, retail chains, residential estates, hostels, WISPs, and branch networks with recurring billing, M-Pesa collections, MikroTik workflows, support tickets, and staff permissions.",
    bullets: [
      "Billing workflows for agricultural businesses, branch networks, and rural broadband teams",
      "Retail chain WiFi and customer access management with support and reminders",
      "MikroTik-aware operations for Eldoret WISPs and North Rift ISP teams",
    ],
    seoTitle: "ISP Billing Software Eldoret | Agriculture, Retail Chains & WISPs | Netily",
    seoDescription: "Netily helps Eldoret agricultural businesses, retail chains, WISPs, estates, and broadband operators manage ISP billing, M-Pesa, MikroTik, support, and staff roles.",
  },
  "isp-billing-software-nakuru": {
    title: "ISP Billing Software Nakuru",
    description: "ISP billing software for Nakuru shopping malls, residential complexes, apartments, estates, hotspots, and broadband operators.",
    eyebrow: "Nakuru malls and residential internet",
    hero: "Run Nakuru ISP billing for shopping malls, residential complexes, apartments, estates, hotspots, and growing broadband teams.",
    summary: "Netily helps Nakuru operators manage shopping mall WiFi, residential complex internet, estate networks, apartment billing, hotspots, customer support, reminders, staff roles, and MikroTik-linked subscriber workflows.",
    bullets: [
      "Shopping mall and retail WiFi billing with hotspot and support workflows",
      "Residential complex, apartment, and estate internet billing for recurring subscribers",
      "M-Pesa collections, PPPoE workflows, customer portals, and operational dashboards",
    ],
    seoTitle: "ISP Billing Software Nakuru | Malls, Residential Complexes & Estates | Netily",
    seoDescription: "Netily helps Nakuru malls, residential complexes, apartments, estates, hotspots, and ISPs manage billing, M-Pesa payments, MikroTik, support, and roles.",
  },
  "isp-billing-software-kenya-counties": {
    title: "ISP Billing Software for All Kenya Counties",
    description: "ISP billing and WiFi management for operators serving all 47 counties in Kenya, from major cities to rural WISPs and community networks.",
    eyebrow: "Serving ISPs in all counties",
    hero: "Serve ISP customers across every Kenyan county with one billing, payments, router, hotspot, and support platform.",
    summary: "Netily supports ISPs, WISPs, hotspot operators, hotels, estates, campuses, malls, retail chains, and community networks across all Kenya counties, including Nairobi, Mombasa, Kisumu, Nakuru, Uasin Gishu, Kiambu, Machakos, Kajiado, Kilifi, Meru, Nyeri, Kakamega, Kisii, Bungoma, Kericho, and more.",
    bullets: [
      "County-wide ISP billing for urban, peri-urban, rural, and community internet providers",
      "M-Pesa-first billing, MikroTik workflows, hotspot access, support tickets, and staff roles",
      "Organic lead-generation pages for local searches across Kenya counties and commercial verticals",
    ],
    seoTitle: "ISP Billing Software for All Kenya Counties | Netily",
    seoDescription: "Netily serves ISPs in all Kenya counties with billing, M-Pesa payments, MikroTik workflows, hotspot access, support tickets, staff roles, and lead generation.",
  },
}

export function generateStaticParams() {
  return Object.keys(SOLUTIONS).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const solution = SOLUTIONS[slug]
  if (!solution) {
    return {
      title: "Netily Solutions",
    }
  }

  return {
    title: solution.seoTitle,
    description: solution.seoDescription,
    keywords: [
      solution.title,
      solution.seoTitle,
      "Internetily",
      "Netily",
      "ISP billing software 2026",
      "ISP management software",
      "MikroTik billing software",
      "WISP billing software",
      "hotspot billing software",
      ...(solution.paymentGateways || []),
      ...(solution.localUseCases || []),
    ],
    alternates: {
      canonical: `https://netily.co.ke/solutions/${slug}`,
    },
    openGraph: {
      title: solution.seoTitle,
      description: solution.seoDescription,
      url: `https://netily.co.ke/solutions/${slug}`,
    },
  }
}

export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const solution = SOLUTIONS[slug]

  if (!solution) {
    return (
      <main className="public-site min-h-screen bg-zinc-950 px-4 py-24 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Not found</p>
          <h1 className="mt-4 text-4xl font-normal">Solution page unavailable</h1>
          <Link href="/" className="mt-8 inline-flex items-center gap-2 text-amber-300">
            Back to homepage
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    )
  }

  const iconMap = {
    "Fiber and broadband operations": Wifi,
    "Hotspot providers": Globe,
    "MikroTik workflows": Router,
    "Mobile money billing": TrendingUp,
  } as const

  const HeroIcon = iconMap[solution.eyebrow as keyof typeof iconMap] || Wifi
  const proofStats = solution.proofStats || DEFAULT_PROOF_STATS
  const outcomePillars = solution.outcomePillars || DEFAULT_OUTCOME_PILLARS
  const technicalStack = solution.technicalStack || DEFAULT_TECHNICAL_STACK
  const pricingNotes = solution.pricingNotes || DEFAULT_PRICING_NOTES
  const onboardingSteps = solution.onboardingSteps || DEFAULT_ONBOARDING_STEPS
  const closingUseCases = solution.closingUseCases || solution.localUseCases || ["PPPoE billing", "Hotspot access", "Subscriber renewals"]
  const areaName = solution.regionLabel || solution.title.replace("ISP Billing Software ", "") || "your market"
  const solutionSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: solution.title,
    alternateName: `${solution.title} by Internetily / Netily`,
    serviceType: "ISP billing software and ISP management platform",
    url: `https://netily.co.ke/solutions/${slug}`,
    description: solution.seoDescription,
    provider: {
      "@type": "Organization",
      name: "Internetily",
      alternateName: "Netily",
      url: "https://netily.co.ke",
    },
    areaServed: areaName,
    availableChannel: (solution.paymentGateways || []).map((gateway) => ({
      "@type": "ServiceChannel",
      name: gateway,
    })),
    audience: {
      "@type": "Audience",
      audienceType: "ISPs, WISPs, hotspot operators, fiber providers, MikroTik teams, and managed Wi-Fi businesses",
    },
  }

  return (
    <main className="public-site min-h-screen bg-zinc-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(solutionSchema) }}
      />
      <section className="relative overflow-hidden border-b border-zinc-800 px-4 py-20 sm:px-6 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><filter id=%22noise%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 result=%22noise%22 /></filter><rect width=%22100%22 height=%22100%22 filter=%22url(%23noise)%22 fill=%22%23ffffff%22/></svg>')",
          }}
        />
        <div className="relative mx-auto max-w-6xl">
          <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-amber-300 hover:text-white">
            Back to Internetily
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200">
                <HeroIcon className="h-4 w-4" />
                {solution.eyebrow}
              </div>
              <h1 className="mt-6 max-w-4xl text-4xl font-normal tracking-tight md:text-6xl">
                {solution.title}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-zinc-400">
                {solution.hero}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/#contact"
                  className="inline-flex items-center gap-2 bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200"
                >
                  Talk to Internetily
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/#pricing"
                  className="inline-flex items-center gap-2 border border-zinc-700 px-6 py-3 text-sm font-semibold text-amber-300 transition-colors hover:border-amber-400"
                >
                  View pricing
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="border border-zinc-800 bg-zinc-900 p-4 shadow-2xl">
              <div className="border border-zinc-800 bg-zinc-950">
                <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Live dashboard</p>
                    <p className="mt-1 text-sm font-semibold text-white">{areaName} operations</p>
                  </div>
                  {solution.currency ? (
                    <span className="border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
                      {solution.currencySymbol} {solution.currency}
                    </span>
                  ) : null}
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-3">
                  {["Subscribers", "Collections", "Support"].map((label, index) => (
                    <div key={label} className="border border-zinc-800 bg-zinc-900 p-4">
                      <p className="text-xs text-zinc-500">{label}</p>
                      <p className="mt-3 text-2xl font-semibold text-white">{["1,248", "96%", "18"][index]}</p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 border-t border-zinc-800 p-4 md:grid-cols-2">
                  {solution.bullets.slice(0, 2).map((item) => (
                    <div key={item} className="flex items-start gap-3 border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-800 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-3 md:grid-cols-3">
          {proofStats.map((proof) => (
            <div key={proof} className="border border-zinc-800 bg-zinc-900/70 p-5 text-sm leading-6 text-zinc-300">
              {proof}
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-zinc-800 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-200">What changes after setup</p>
            <h2 className="mt-4 text-3xl font-normal tracking-tight text-white md:text-5xl">A calmer way to run daily ISP work.</h2>
            <p className="mt-4 text-base leading-7 text-zinc-400">{solution.summary}</p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {outcomePillars.map((pillar, index) => (
              <div key={pillar.title} className="flex flex-col border border-zinc-800 bg-zinc-900">
                <div className="border-b border-zinc-800 p-6">
                  <p className="text-sm text-amber-300">0{index + 1}</p>
                  <h3 className="mt-3 text-xl font-semibold text-white">{pillar.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">{pillar.context}</p>
                </div>
                <div className="flex-1 space-y-3 p-6">
                  {pillar.bullets.map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm text-zinc-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-amber-500/20 bg-amber-500/10 p-5 text-sm font-medium leading-6 text-amber-100">
                  Result: {pillar.result}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-800 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
          <div className="border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-amber-300" />
              <p className="text-sm font-semibold text-white">Payment rails for {areaName}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(solution.paymentGateways || ["M-Pesa", "Cards", "Bank transfer", "Payment reference reconciliation"]).map((gateway) => (
                <span key={gateway} className="border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-100">
                  {gateway}
                </span>
              ))}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-900/80 p-6">
            <p className="text-sm font-semibold text-white">Local billing details to plan for</p>
            <div className="mt-4 grid gap-3">
              {(solution.marketNotes || [
                "Keep payments, customer records, and service state changes close together.",
                "Use clear roles so finance, support, and network staff only touch the work they should.",
                "Track leads and renewals from the same system that handles active subscribers.",
              ]).map((note) => (
                <p key={note} className="text-sm leading-6 text-zinc-400">
                  {note}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-800 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
          <div className="border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center gap-3">
              <Router className="h-5 w-5 text-amber-300" />
              <p className="text-sm font-semibold text-white">Technical fit</p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {technicalStack.map((item) => (
                <div key={item} className="border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-300" />
              <p className="text-sm font-semibold text-white">Good fit for</p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(solution.localUseCases || closingUseCases).map((useCase) => (
                <div key={useCase} className="border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-300">
                  {useCase}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-800 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-200">Pricing clarity</p>
            <h2 className="mt-4 text-3xl font-normal tracking-tight text-white">Start lean, then scale with usage.</h2>
            <div className="mt-6 space-y-3">
              {pricingNotes.map((note) => (
                <div key={note} className="flex items-start gap-3 text-sm leading-6 text-zinc-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <span>{note}</span>
                </div>
              ))}
            </div>
            {solution.currency ? (
              <p className="mt-5 border border-zinc-800 bg-zinc-950/70 p-4 text-sm leading-6 text-zinc-400">
                Estimates can be viewed in {solution.currency}. Final billing is handled in KES unless a custom regional arrangement is agreed.
              </p>
            ) : null}
          </div>
          <div className="border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-300" />
              <p className="text-sm font-semibold text-white">A simple onboarding path</p>
            </div>
            <div className="mt-5 grid gap-3">
              {onboardingSteps.map((step, index) => (
                <div key={step} className="grid gap-3 border border-zinc-800 bg-zinc-950/70 p-4 sm:grid-cols-[48px_1fr] sm:items-center">
                  <span className="text-sm font-semibold text-amber-300">0{index + 1}</span>
                  <p className="text-sm leading-6 text-zinc-300">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl border border-amber-500/20 bg-amber-500/10 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-200">Built for {areaName}</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-normal tracking-tight text-white md:text-5xl">
            See how Internetily works for an ISP like yours.
          </h2>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-300">
            Internetily, formerly Netily, helps teams looking for {solution.title.toLowerCase()}, MikroTik billing software, WISP billing software, hotspot billing, payment reconciliation, subscriber management, staff controls, lead capture, and regional ISP automation.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {closingUseCases.slice(0, 5).map((useCase) => (
              <span key={useCase} className="border border-amber-500/25 bg-zinc-950/40 px-3 py-1.5 text-xs font-medium text-amber-100">
                {useCase}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200"
            >
              Talk to Internetily
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-2 text-sm font-semibold text-amber-300"
            >
              View pricing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
