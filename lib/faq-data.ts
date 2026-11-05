export type FaqCategory = "Network & routers" | "Hotspot & Wi-Fi" | "Billing & payments" | "Customers & support"

export type FaqItem = {
  id: string
  category: FaqCategory
  question: string
  answer: string
  steps?: string[]
  note?: string
  href?: string
}

export const faqItems: FaqItem[] = [
  { id: "internetily-netily", category: "Customers & support", question: "Are Internetily and Netily the same?", answer: "Yes. Internetily and Netily are two names for the same ISP billing and network management platform at netily.co.ke. Both names are current, and your account, payments and routers work the same under either name. Netily is not related to Netlify, the web hosting company.", href: "/" },
  { id: "router-offline-alerts", category: "Network & routers", question: "How can I track MikroTik power outages when I am away?", answer: "Turn on MikroTik router offline and online alerts. Internetily sends an SMS when a connected router changes state.", steps: ["Open Settings, then Notifications.", "Enable MikroTik router offline/online alerts.", "Keep enough SMS units in the tenant wallet."], note: "An alert depends on the router having been provisioned and previously reachable.", href: "/features/router-monitoring" },
  { id: "remote-winbox", category: "Network & routers", question: "How do I open my MikroTik in Winbox when I am not at the site?", answer: "Copy the Winbox remote-access address from the router's Cloud Controller tab and paste it into Winbox.", steps: ["Open the router, then Cloud Controller.", "Under Remote Access, copy the Winbox address.", "Paste it into Winbox Connect To.", "Enter the router username and password, then connect."], note: "The router must be provisioned to Cloud Controller and show Tunnel Up.", href: "/features/mikrotik-provisioning" },
  { id: "hotspot-chat", category: "Customers & support", question: "A customer messaged me from the Wi-Fi login page. Where do I reply?", answer: "Open Tickets, choose Hotspot Chats, open the conversation and send your reply. The reply appears on the customer's login page.", steps: ["Go to Tickets and open Hotspot Chats.", "Open the unread conversation marked with a blue dot.", "Type the reply and press Send.", "Resolve the conversation after the customer is helped."], href: "/features/support-tickets" },
  { id: "smart-tv-plan", category: "Hotspot & Wi-Fi", question: "My customers' Smart TVs cannot use the captive portal. How do I sell them internet?", answer: "Create a TV plan. The customer pays from a phone using the TV's MAC address, and the TV connects automatically.", steps: ["Open Plans, choose Hotspot and select the router.", "Create a Hotspot plan with the required price, time and speed.", "Turn on TV Plan and save."], note: "The TV must already be connected to the Wi-Fi network.", href: "/features/hotspot-billing" },
  { id: "loyalty-points", category: "Hotspot & Wi-Fi", question: "How do I reward returning Wi-Fi customers with loyalty points?", answer: "Enable the Loyalty Program. Customers earn points on Hotspot purchases and redeem configured rewards for free internet time.", steps: ["Open Loyalty, then Settings, and enable the program.", "Choose how customers earn points.", "Open Rewards, add a reward, and set its points cost, free minutes and speed."], note: "A reward needs Free Minutes before it can appear on the Wi-Fi login page.", href: "/features/customer-referrals" },
  { id: "expired-pppoe-payment", category: "Billing & payments", question: "How does an expired PPPoE customer reach the payment page?", answer: "Internetily places the expired session in a restricted renewal network that can reach the payment page. After confirmed payment, the normal RADIUS profile and internet access are restored automatically.", href: "/features/pppoe-billing" },
  { id: "mpesa-reconnect", category: "Billing & payments", question: "What happens after an M-Pesa renewal is confirmed?", answer: "Internetily matches the receipt to the subscriber, records the payment and requests network activation. The subscriber's access is restored without an operator logging into the router.", href: "/features/mpesa-billing" },
  { id: "payment-pin", category: "Billing & payments", question: "Why does Payment Methods ask for a six-digit PIN?", answer: "The tenant-owned PIN protects gateway credentials and settlement changes. A successful check unlocks Payment Methods for 15 minutes in that signed-in session.", steps: ["Open Settings and find Payment Methods PIN.", "Create and confirm a non-sequential six-digit PIN.", "Open Payment Methods; the same session is unlocked immediately."], note: "After five incorrect attempts, access is temporarily locked for 15 minutes." },
]

export const faqCategories: FaqCategory[] = ["Network & routers", "Hotspot & Wi-Fi", "Billing & payments", "Customers & support"]

export function faqMarkdown() {
  return faqItems.map((item) => `## ${item.question}\n${item.answer}\n${item.steps?.map((step, index) => `${index + 1}. ${step}`).join("\n") || ""}\n${item.note ? `Note: ${item.note}` : ""}`).join("\n\n")
}
