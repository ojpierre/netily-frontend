import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Headphones,
  PackageCheck,
  Router,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Truck,
} from "lucide-react"

const products = [
  {
    name: "MikroTik CCR2004 Core Router",
    category: "Routers & Gateways",
    price: "KES 64,500",
    image: "/shop/products/mikrotik_router.jpg",
    badge: "ISP Core",
    note: "BGP, CGNAT, PPPoE concentration, and high-throughput routing.",
  },
  {
    name: "24-Port Gigabit PoE Switch",
    category: "Switches & PoE",
    price: "KES 48,900",
    image: "/shop/products/poe_switch.jpg",
    badge: "Tower Ready",
    note: "Power APs, cameras, and cabinet devices from one clean rack unit.",
  },
  {
    name: "60GHz Wireless Backhaul Dish",
    category: "Wireless Backhaul",
    price: "KES 78,000",
    image: "/shop/products/wireless_dish.jpg",
    badge: "Long Range",
    note: "Multi-gigabit point-to-point links with resilient backup planning.",
  },
  {
    name: "Fiber Fusion Splicer Kit",
    category: "Fiber Tools",
    price: "KES 145,000",
    image: "/shop/products/fusion_splicer.jpg",
    badge: "FTTH",
    note: "Field-ready splicing for fast repairs, installations, and expansion.",
  },
  {
    name: "Outdoor Cat6A Cable Drum",
    category: "Cabling",
    price: "KES 19,500",
    image: "/shop/products/cat6a_cable.jpg",
    badge: "Bulk",
    note: "Durable cable for last-mile installs, cabinet runs, and AP drops.",
  },
  {
    name: "12U Wall Mount Server Rack",
    category: "Racks & Power",
    price: "KES 26,800",
    image: "/shop/products/server_rack.jpg",
    badge: "Cabinet",
    note: "Cleaner POPs, safer power layout, and easier onsite maintenance.",
  },
]

const categories = ["All", "Routers", "Switches", "Fiber", "Wireless", "Cabling", "Power"]

const stats = [
  ["48h", "dispatch guidance"],
  ["2 yr", "selected warranties"],
  ["24/7", "deployment support"],
]

function ShopHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/94 text-slate-950 shadow-sm shadow-slate-950/5 backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-h-12 items-center gap-3" aria-label="Internetily home">
          <Image
            src="/internetily-logo-320.webp"
            alt="Internetily"
            width={150}
            height={42}
            priority
            className="h-10 w-auto object-contain"
          />
          <span className="hidden border-l border-slate-200 pl-3 text-sm font-semibold text-slate-600 sm:inline">
            Shop
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-700 lg:flex">
          <a href="#catalog" className="transition hover:text-slate-950">Catalog</a>
          <a href="#support" className="transition hover:text-slate-950">Procurement</a>
          <Link href="/shop/admin" className="transition hover:text-slate-950">Shop admin</Link>
        </nav>

        <div className="flex items-center gap-2">
          <button className="hidden min-h-12 items-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:inline-flex">
            <Search className="h-4 w-4" />
            Search
          </button>
          <button className="inline-flex min-h-12 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-bold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800">
            <ShoppingBag className="h-4 w-4" />
            Cart
          </button>
        </div>
      </div>
    </header>
  )
}

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <ShopHeader />

      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(14,165,233,0.16),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(245,158,11,0.16),transparent_28%)]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <div className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-[0.22em] text-slate-600 shadow-sm">
              <Sparkles className="h-4 w-4 text-amber-500" />
              ISP procurement by Internetily
            </div>
            <h1 className="mt-8 max-w-3xl text-5xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Network hardware for serious ISP builds.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Routers, switches, fiber tools, cabinets, cabling, and wireless equipment selected for WISPs, hotspot operators, and growing fiber teams.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="#catalog" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-6 text-sm font-bold text-white shadow-xl shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-slate-800">
                Browse hardware
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#support" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 text-sm font-bold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50">
                Request sourcing help
                <Headphones className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {stats.map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-2xl font-black text-slate-950">{value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-cyan-200/50 via-white to-amber-200/60 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-3 shadow-2xl shadow-slate-950/25">
              <div className="grid gap-3 sm:grid-cols-2">
                {products.slice(0, 4).map((product, index) => (
                  <div key={product.name} className={`overflow-hidden rounded-[1.35rem] bg-white ${index === 0 ? "sm:col-span-2" : ""}`}>
                    <div className={index === 0 ? "relative h-64" : "relative h-44"}>
                      <Image src={product.image} alt={product.name} fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" />
                      <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-slate-900 backdrop-blur">
                        {product.badge}
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{product.category}</p>
                      <h2 className="mt-1 text-base font-black text-slate-950">{product.name}</h2>
                      <p className="mt-2 text-sm font-bold text-cyan-700">{product.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="catalog" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-700">Catalog</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">ISP-ready equipment</h2>
            <p className="mt-3 max-w-2xl text-slate-600">
              Start with the essentials, then let the shop admin team add pricing, stock, orders, and sourcing requests as the store matures.
            </p>
          </div>
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 text-sm font-bold text-slate-800 shadow-sm transition hover:border-slate-400">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
        </div>

        <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
          {categories.map((category, index) => (
            <button key={category} className={`min-h-11 shrink-0 rounded-full px-5 text-sm font-bold ${index === 0 ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>
              {category}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <article key={product.name} className="group overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-950/10">
              <div className="relative h-64 overflow-hidden bg-slate-100">
                <Image src={product.image} alt={product.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-slate-900 backdrop-blur">
                  {product.badge}
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">{product.category}</p>
                  <p className="text-sm font-black text-cyan-700">{product.price}</p>
                </div>
                <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">{product.name}</h3>
                <p className="mt-3 min-h-14 text-sm leading-6 text-slate-600">{product.note}</p>
                <button className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-slate-950 text-sm font-bold text-white transition hover:bg-slate-800">
                  View details
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="support" className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-3 lg:px-8">
          {[
            [ShieldCheck, "Verified supply", "Products can be tagged by warranty, condition, supplier, and deployment readiness."],
            [Truck, "Delivery workflow", "Track requested quotes, packing, dispatch, installation notes, and after-sales support."],
            [PackageCheck, "Admin control", "Use the shop admin surface to manage products, orders, stock levels, and customer requests."],
          ].map(([Icon, title, body]) => (
            <div key={String(title)} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
              <Icon className="h-7 w-7 text-cyan-700" />
              <h3 className="mt-5 text-xl font-black text-slate-950">{title as string}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{body as string}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">
          <Image src="/internetily-white-logo-320.webp" alt="Internetily" width={150} height={42} className="h-10 w-auto object-contain" />
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-white/70">
            <Link href="/">Homepage</Link>
            <Link href="/shop/admin">Shop admin</Link>
            <Link href="/#contact">Contact</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
