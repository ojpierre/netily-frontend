import Link from "next/link"
import { Navigation } from "@/shop-ui/components/navigation"
import { PremiumFooter } from "@/shop-ui/components/premium-footer"

const policies: Record<string, { title: string; intro: string; sections: Array<{ heading: string; body: string }> }> = {
  privacy: {
    title: "Shopping Privacy Policy",
    intro: "How Internetily Shop handles information used for product enquiries, orders, delivery, and customer support.",
    sections: [
      { heading: "Information we collect", body: "We collect the contact, delivery, billing, and order details needed to process hardware requests, proforma quotes, dispatch, warranty support, and account communication." },
      { heading: "How we use it", body: "We use shopping information to confirm availability, prepare invoices, coordinate delivery, support warranty claims, prevent fraud, and improve the store experience." },
      { heading: "Sharing", body: "We only share order details with service providers needed to complete the purchase, such as delivery partners, payment processors, or support teams handling the order." },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    intro: "How the shop uses browser storage and cookies to make browsing, cart, and preference flows work smoothly.",
    sections: [
      { heading: "Essential storage", body: "The shop may use local browser storage for cart items, catalog previews, admin demo entries, and product preferences required for the storefront to work." },
      { heading: "Analytics and improvement", body: "Where analytics are enabled, they help us understand which products, categories, and pages are useful so we can improve stock planning and page quality." },
      { heading: "Managing preferences", body: "You can clear cookies and local storage in your browser settings. Some shop features, such as cart persistence, may reset after clearing storage." },
    ],
  },
  "shipping-returns": {
    title: "Shipping & Returns",
    intro: "Plain guidance for dispatch, delivery checks, and return handling for networking and technology hardware.",
    sections: [
      { heading: "Dispatch", body: "Orders are prepared after availability and payment confirmation. Delivery timelines depend on stock location, item size, destination, and carrier route." },
      { heading: "Receiving hardware", body: "Inspect packaging on arrival before installation. Keep boxes, accessories, serial labels, and invoices until the equipment has been tested and accepted." },
      { heading: "Returns", body: "Return eligibility depends on item condition, warranty status, supplier rules, and whether the product has been installed, configured, opened, or damaged." },
    ],
  },
  warranty: {
    title: "Warranty Policy",
    intro: "How warranty support works for routers, switches, fiber equipment, cabling tools, and related shop products.",
    sections: [
      { heading: "Coverage", body: "Warranty coverage follows the applicable manufacturer, supplier, or Netily verification terms shown on the product record or invoice." },
      { heading: "What to keep", body: "Keep your invoice, serial number, packaging where possible, and clear photos or diagnostic notes when reporting a fault." },
      { heading: "Exclusions", body: "Warranty may not cover power surges, water damage, physical damage, unsupported firmware changes, poor installation, misuse, or consumable wear." },
    ],
  },
  terms: {
    title: "Terms of Sale",
    intro: "The basic terms that apply when buying or requesting ecommerce hardware through Internetily Shop.",
    sections: [
      { heading: "Product availability", body: "Catalog items may change based on stock, supplier availability, pricing updates, and regional delivery limitations." },
      { heading: "Pricing and quotes", body: "Displayed prices guide purchase planning. Final proforma invoices may include taxes, freight, installation accessories, forex changes, or bundle adjustments." },
      { heading: "Use of products", body: "Customers are responsible for correct installation, licensing, power protection, safe mounting, and compliance with local network regulations." },
    ],
  },
}

export function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }))
}

export default async function ShopPolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const policy = policies[slug] || policies.privacy

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navigation />
      <section className="mx-auto max-w-4xl px-6 pb-16 pt-32 lg:px-8">
        <Link href="/shop" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1b5eff]">
          Back to shop
        </Link>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.02em] md:text-5xl">{policy.title}</h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">{policy.intro}</p>
        <div className="mt-10 space-y-5">
          {policy.sections.map((section) => (
            <article key={section.heading} className="border border-border bg-white p-6">
              <h2 className="text-lg font-semibold">{section.heading}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{section.body}</p>
            </article>
          ))}
        </div>
      </section>
      <PremiumFooter />
    </main>
  )
}
