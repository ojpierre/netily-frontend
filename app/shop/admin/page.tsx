import Image from "next/image"
import Link from "next/link"
import {
  BarChart3,
  Boxes,
  ChevronRight,
  ClipboardList,
  DollarSign,
  Home,
  LayoutDashboard,
  PackagePlus,
  Search,
  Settings,
  ShoppingBag,
  Truck,
  Users,
} from "lucide-react"

const navItems = [
  [LayoutDashboard, "Overview", "Active"],
  [Boxes, "Products", "128 items"],
  [ClipboardList, "Orders", "24 open"],
  [Truck, "Fulfilment", "6 today"],
  [Users, "Customers", "Quotes"],
  [BarChart3, "Reports", "Revenue"],
  [Settings, "Settings", "Store"],
]

const cards = [
  ["Revenue", "KES 842,500", "+12.4%", DollarSign],
  ["Open orders", "24", "8 urgent", ClipboardList],
  ["Low stock", "11", "Needs action", Boxes],
  ["Quote requests", "37", "This week", Users],
]

const inventory = [
  ["MikroTik CCR2004", "Routers & Gateways", "18", "KES 64,500", "Healthy"],
  ["PoE Switch 24-Port", "Switches & PoE", "7", "KES 48,900", "Low stock"],
  ["Fusion Splicer Kit", "Fiber Tools", "3", "KES 145,000", "Reorder"],
  ["Cat6A Outdoor Cable", "Cabling", "42", "KES 19,500", "Healthy"],
]

const orders = [
  ["NET-SHOP-1042", "Green Network", "Router + PoE Switch", "KES 113,400", "Packing"],
  ["NET-SHOP-1041", "Aplinknet", "Fusion Splicer", "KES 145,000", "Awaiting payment"],
  ["NET-SHOP-1040", "VW ICT Centre", "Wireless Backhaul", "KES 78,000", "Dispatch"],
]

export default function ShopAdminPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-slate-200 bg-slate-950 px-4 py-5 text-white lg:block">
          <Link href="/shop" className="flex min-h-12 items-center gap-3 rounded-2xl px-2">
            <Image src="/internetily-white-logo-320.webp" alt="Internetily" width={150} height={42} className="h-10 w-auto object-contain" />
          </Link>
          <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Shop admin</p>
            <p className="mt-2 text-sm leading-6 text-white/65">Manage catalog, stock, orders, requests, and fulfilment from one operational workspace.</p>
          </div>
          <nav className="mt-6 space-y-1">
            {navItems.map(([Icon, label, meta], index) => (
              <button key={String(label)} className={`flex min-h-12 w-full items-center justify-between rounded-2xl px-3 text-left text-sm font-bold transition ${index === 0 ? "bg-white text-slate-950" : "text-white/72 hover:bg-white/10 hover:text-white"}`}>
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {label as string}
                </span>
                <span className={`text-[10px] uppercase tracking-wide ${index === 0 ? "text-slate-500" : "text-white/40"}`}>{meta as string}</span>
              </button>
            ))}
          </nav>
          <Link href="/" className="absolute bottom-5 left-4 right-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/10 text-sm font-bold text-white/75 transition hover:bg-white/10 hover:text-white">
            <Home className="h-4 w-4" />
            Back to Internetily
          </Link>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/94 backdrop-blur-xl">
            <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Internetily Shop</p>
                <h1 className="text-2xl font-black tracking-tight text-slate-950">Admin dashboard</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden min-h-12 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500 md:flex">
                  <Search className="h-4 w-4" />
                  Search orders, stock, customers
                </div>
                <button className="inline-flex min-h-12 items-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-bold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800">
                  <PackagePlus className="h-4 w-4" />
                  Add product
                </button>
              </div>
            </div>
          </header>

          <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map(([label, value, meta, Icon]) => (
                <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label as string}</p>
                      <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{value as string}</p>
                    </div>
                    <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-4 text-sm font-bold text-emerald-600">{meta as string}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-950">Inventory control</h2>
                    <p className="mt-1 text-sm text-slate-500">Live frontend mockup ready for backend stock sync.</p>
                  </div>
                  <button className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-bold text-slate-700">
                    Export
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                        <th className="py-3 pr-4">Product</th>
                        <th className="py-3 pr-4">Category</th>
                        <th className="py-3 pr-4">Stock</th>
                        <th className="py-3 pr-4">Price</th>
                        <th className="py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((row) => (
                        <tr key={row[0]} className="border-b border-slate-100 last:border-0">
                          {row.map((cell, index) => (
                            <td key={cell} className={`py-4 pr-4 ${index === 0 ? "font-black text-slate-950" : "text-slate-600"}`}>
                              {index === 4 ? (
                                <span className={`rounded-full px-3 py-1 text-xs font-black ${cell === "Healthy" ? "bg-emerald-50 text-emerald-700" : cell === "Low stock" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                                  {cell}
                                </span>
                              ) : cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-950">Order queue</h2>
                    <p className="mt-1 text-sm text-slate-500">Procurement tasks that need action.</p>
                  </div>
                  <ShoppingBag className="h-6 w-6 text-cyan-700" />
                </div>
                <div className="mt-5 space-y-3">
                  {orders.map(([id, customer, item, amount, status]) => (
                    <div key={id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-950">{id}</p>
                          <p className="mt-1 text-sm text-slate-600">{customer} - {item}</p>
                        </div>
                        <p className="text-sm font-black text-cyan-700">{amount}</p>
                      </div>
                      <p className="mt-3 w-fit rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700">{status}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Setup roadmap</p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Ready for backend connection</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    The admin surface now has the right frontend structure: sidebar navigation, product controls, order queue, metrics, and stock table. Backend APIs can plug into these regions without redesigning the interface.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {["Products API", "Orders API", "Stock movements"].map((item) => (
                    <div key={item} className="rounded-2xl bg-slate-950 p-4 text-white">
                      <p className="text-sm font-black">{item}</p>
                      <p className="mt-2 text-xs leading-5 text-white/60">Frontend slot prepared</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}
