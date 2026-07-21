"use client"

import React, { useState } from "react"
import { BookOpen, ChevronDown, Lightbulb, Target, Timer } from "lucide-react"

const TOPICS = [
  {
    icon: Target,
    title: "Who is the ideal Netily customer?",
    content: `The ideal Netily customer is an Internet Service Provider (ISP) operating in Africa — specifically those running:

• **PPPoE Networks**: ISPs using Mikrotik routers for PPPoE authentication who want to automate user provisioning, billing, and bandwidth management.

• **Hotspot Operators**: Businesses running Wi-Fi hotspot services in hotels, restaurants, campuses, or public areas who need voucher management and M-Pesa integration.

• **WISPs (Wireless ISPs)**: Small to medium wireless operators serving residential and business customers who need a complete billing and CRM solution.

**Key pain points they experience:**
- Manual billing and payment collection
- Complex Mikrotik configuration and scripting
- No centralised dashboard for customer management
- Difficulty tracking revenue and usage analytics
- M-Pesa reconciliation nightmares

**How to spot them:**
- They're in ISP or WISP WhatsApp groups
- They post about Mikrotik issues on forums
- They run internet cafes or campus Wi-Fi
- They're looking for "ISP billing software" or "hotspot management"`,
  },
  {
    icon: Timer,
    title: "How the 30-day cookie works.",
    content: `When someone clicks your referral link, we set a **30-day tracking cookie** in their browser. Here's what that means for you:

**The basics:**
- When a prospect clicks your link today, a cookie is stored in their browser
- If they come back and sign up anytime within the next 30 days, you get credit
- Even if they close the tab, browse other sites, and return later — you still get the commission

**Example scenario:**
1. Monday: You share your link in a WhatsApp group
2. Wednesday: An ISP operator clicks it, browses the Netily site, but doesn't sign up yet
3. Next week: They come back directly to netily.co.ke and register
4. ✅ You still earn the referral commission because the cookie hasn't expired

**Important details:**
- The cookie lasts exactly 30 days from the first click
- If another affiliate's link is clicked after yours, their cookie overwrites yours (last-click attribution)
- Cookies work across all pages on netily.co.ke
- Private/incognito browsing won't retain cookies between sessions

**Pro tip:** Follow up with your prospects within the first week. The sooner they sign up, the more likely you are to get credit.`,
  },
  {
    icon: Lightbulb,
    title: "When do I get paid?",
    content: `Netily processes affiliate payouts on a monthly billing cycle. Here's the complete timeline:

**The payout process:**
1. **Referral signs up**: The ISP creates their Netily account through your link
2. **Referral pays**: They complete their first monthly subscription payment
3. **Commission credited**: Your reward is credited to your affiliate balance within 48 hours
4. **Payout processed**: We batch payouts on the **15th of each month**
5. **Funds received**: M-Pesa payouts arrive instantly; bank transfers take 1–3 business days

**Payout methods:**
- **M-Pesa** (recommended): Instant delivery, no fees. Make sure your registered M-Pesa name matches your affiliate account.
- **Bank Transfer**: 1–3 business days. Available for Kenya, Uganda, Tanzania, and Nigeria.

**Minimum payout:**
- KES 500 (or equivalent in your local currency)
- If your balance is below the minimum, it rolls over to the next month

**Payout rates by tier:**
| Tier | Referrals | Reward per ISP |
|------|-----------|---------------|
| Bronze | 0–5 | KES 500 |
| Silver | 6–15 | KES 750 |
| Gold | 16+ | KES 1,000 |

**What doesn't count:**
- ISPs that sign up but never make a payment
- Self-referrals (your own accounts)
- Fraudulent or test signups

**Need help?** Email affiliates@netily.co.ke or use the support chat.`,
  },
]

export default function AffiliateGuidePage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-500">Education</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
          How to Win.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-500">
          Top strategies from our best-performing Netily affiliates.
        </p>
      </div>

      {/* Quick tips banner */}
      <div className="rounded-3xl border border-red-200/60 bg-gradient-to-r from-red-50/80 to-orange-50/60 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-red-700 text-white shadow-md">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900">Quick tips from top earners</h3>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>• Share your link in ISP WhatsApp groups — that&apos;s where 60% of referrals come from</li>
              <li>• Follow up personally within 48 hours of someone clicking your link</li>
              <li>• Use the WhatsApp scripts in the Marketing tab — they&apos;re tested and convert well</li>
              <li>• Add <code className="rounded bg-white/60 px-1 text-xs">?src=whatsapp</code> to track which channel performs best</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Accordion */}
      <div className="space-y-3">
        {TOPICS.map((topic, i) => {
          const isOpen = openIndex === i
          const Icon = topic.icon

          return (
            <div
              key={i}
              className={`rounded-3xl border transition-all duration-300 ${
                isOpen ? "border-red-200/80 bg-white shadow-md" : "border-gray-200/80 bg-white hover:border-gray-300"
              }`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center gap-4 p-6 text-left"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                    isOpen
                      ? "bg-gradient-to-br from-red-600 to-red-700 text-white shadow-md shadow-red-200"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="flex-1 text-lg font-black text-gray-900">{topic.title}</span>
                <ChevronDown
                  className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isOpen && (
                <div className="border-t border-gray-100 px-6 pb-6 pt-4">
                  <div className="prose prose-sm max-w-none text-gray-600 [&_strong]:text-gray-900 [&_li]:my-0.5 leading-relaxed whitespace-pre-line">
                    {topic.content.split("\n").map((line, j) => {
                      if (line.startsWith("**") && line.endsWith("**")) {
                        return <p key={j} className="mt-4 mb-1 font-bold text-gray-900">{line.replace(/\*\*/g, "")}</p>
                      }
                      if (line.startsWith("| ")) {
                        return <p key={j} className="font-mono text-xs">{line}</p>
                      }
                      if (line.startsWith("•") || line.startsWith("- ")) {
                        return <p key={j} className="ml-4">{line}</p>
                      }
                      if (line.match(/^\d+\./)) {
                        return <p key={j} className="ml-4">{line}</p>
                      }
                      if (line.trim() === "") return <br key={j} />
                      return <p key={j}>{line}</p>
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
