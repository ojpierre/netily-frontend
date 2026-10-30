import type { Product } from "./products"

// Curated starter inventory for the storefront. These products remain available
// while the catalog API is being populated, and supplement API inventory when it
// is available. The image URLs are stable Unsplash CDN assets rather than search
// endpoints, so the storefront still has polished product imagery in mock mode.
const image = (id: string, fit = "fit=crop") => `https://images.unsplash.com/${id}?auto=format&${fit}&w=1200&q=85`

export const featuredCatalog: Product[] = [
  {
    id: "mikrotik-rb5009ug-s-in", name: "MikroTik RB5009UG+S+IN", price: 38_500, currency: "KES", category: "Routers & Gateways", categorySlug: "routers-gateways", brand: "MikroTik", inStock: true, isFeatured: true, warranty: "2-year warranty",
    image: image("photo-1558494949-ef010cbdcc31"), hoverImage: image("photo-1558494949-ef010cbdcc31", "fit=crop"), description: "Compact 2.5GbE edge router with 10G SFP+ uplink for growing offices and ISP distribution sites.", longDescription: "A practical RouterOS v7 edge platform for small POPs, branches, labs, and subscriber aggregation. Its compact metal chassis makes it easy to deploy where rack space is tight.", materials: [], care: [], sizes: [], colors: [], details: ["7x Gigabit Ethernet", "1x 2.5GbE", "1x 10G SFP+", "RouterOS v7"], madeIn: "Latvia",
  },
  {
    id: "ubiquiti-u7-pro", name: "Ubiquiti UniFi U7 Pro Wi-Fi 7 Access Point", price: 29_900, currency: "KES", category: "Wireless & Access Points", categorySlug: "wireless-access-points", brand: "Ubiquiti", inStock: true, isFeatured: true, warranty: "1-year warranty",
    image: image("photo-1544197150-b99a580bb7a8"), hoverImage: image("photo-1544197150-b99a580bb7a8"), description: "Tri-band Wi-Fi 7 access point with 2.5GbE uplink for high-density offices, hotels, and campuses.", longDescription: "Bring modern Wi-Fi 7 capacity to managed networks with a clean ceiling-mounted design and central UniFi management.", materials: [], care: [], sizes: [], colors: [], details: ["Wi-Fi 7 tri-band", "2.5GbE uplink", "PoE+ powered", "UniFi management"], madeIn: "United States",
  },
  {
    id: "tp-link-omada-eap650", name: "TP-Link Omada EAP650 AX3000", price: 18_900, currency: "KES", category: "Wireless & Access Points", categorySlug: "wireless-access-points", brand: "TP-Link", inStock: true, isFeatured: true, warranty: "2-year warranty",
    image: image("photo-1551703599-6b3e8379aa8f"), hoverImage: image("photo-1551703599-6b3e8379aa8f"), description: "Reliable Wi-Fi 6 business access point with Omada cloud management and PoE+ deployment.", longDescription: "A strong value choice for schools, clinics, offices, and hospitality deployments that need centralised, scalable Wi-Fi.", materials: [], care: [], sizes: [], colors: [], details: ["Wi-Fi 6 AX3000", "2x2 MU-MIMO", "Gigabit PoE+", "Omada SDN"], madeIn: "China",
  },
  {
    id: "mikrotik-crs328-24p-4s", name: "MikroTik CRS328-24P-4S+RM", price: 72_500, currency: "KES", category: "Switches & PoE", categorySlug: "switches-poe", brand: "MikroTik", inStock: true, isFeatured: true, warranty: "2-year warranty",
    image: image("photo-1518770660439-4636190af475"), hoverImage: image("photo-1518770660439-4636190af475"), description: "24-port Gigabit PoE+ switch with 4x 10G SFP+ uplinks and a generous 450W PoE budget.", longDescription: "Designed for WISP towers, cameras, access points, and fibre uplinks where power and aggregation need to live in one rack unit.", materials: [], care: [], sizes: [], colors: [], details: ["24x Gigabit PoE", "4x 10G SFP+", "450W PoE budget", "1U rackmount"], madeIn: "Latvia",
  },
  {
    id: "ubiquiti-unifi-cloud-gateway-ultra", name: "UniFi Cloud Gateway Ultra", price: 24_500, currency: "KES", category: "Routers & Gateways", categorySlug: "routers-gateways", brand: "Ubiquiti", inStock: true, isFeatured: true, warranty: "1-year warranty",
    image: image("photo-1551808525-51a94da548ce"), hoverImage: image("photo-1551808525-51a94da548ce"), description: "Compact UniFi gateway with cloud management, VPN, firewalling, and multi-site visibility.", longDescription: "An approachable gateway for small businesses, branches, and installers who want a managed UniFi stack without a separate controller.", materials: [], care: [], sizes: [], colors: [], details: ["Cloud-managed UniFi", "Multi-gig routing", "VPN and firewall", "IDS/IPS ready"], madeIn: "United States",
  },
  {
    id: "netily-cat6a-drum", name: "Netily Cat6A Outdoor Cable — 305m Drum", price: 34_900, currency: "KES", category: "Structured Cabling", categorySlug: "structured-cabling", brand: "Netily", inStock: true, isFeatured: false, warranty: "1-year warranty",
    image: image("photo-1558618666-fcd25c85cd64"), hoverImage: image("photo-1558618666-fcd25c85cd64"), description: "Shielded, UV-resistant Cat6A cable for outdoor runs, towers, and high-throughput structured cabling.", longDescription: "A field-ready 305 metre drum for reliable copper runs where weather exposure and future 10GbE capacity matter.", materials: [], care: [], sizes: [], colors: [], details: ["305m drum", "Cat6A S/FTP", "UV-resistant jacket", "10GbE capable"], madeIn: "Kenya",
  },
  {
    id: "10g-sfp-lr-pair", name: "10G SFP+ LR Optical Transceivers — Pair", price: 12_900, currency: "KES", category: "Fiber Optics & OLT", categorySlug: "fiber-optics-olt", brand: "Netily", inStock: true, isFeatured: false, warranty: "1-year warranty",
    image: image("photo-1516321318423-f06f85e504b3"), hoverImage: image("photo-1516321318423-f06f85e504b3"), description: "Matched single-mode 10GBASE-LR optics for up to 10km fibre links between core and distribution sites.", longDescription: "Keep spare optics on hand for core upgrades and emergency link restoration. Compatible with common SFP+ network platforms.", materials: [], care: [], sizes: [], colors: [], details: ["10Gbps", "1310nm single-mode", "Up to 10km", "LC duplex"], madeIn: "Taiwan",
  },
  {
    id: "vsol-gpon-olt-8-port", name: "VSOL 8-Port GPON OLT", price: 89_500, currency: "KES", category: "Fiber Optics & OLT", categorySlug: "fiber-optics-olt", brand: "VSOL", inStock: true, isFeatured: true, warranty: "2-year warranty",
    image: image("photo-1558494949-ef010cbdcc31"), hoverImage: image("photo-1558494949-ef010cbdcc31"), description: "8-port GPON OLT for compact FTTH rollouts, apartments, estates, and neighbourhood POPs.", longDescription: "A scalable starting point for fibre operators moving beyond wireless access, with room to grow subscribers while keeping the POP compact.", materials: [], care: [], sizes: [], colors: [], details: ["8 GPON ports", "1U rackmount", "VLAN and QoS", "FTTH ready"], madeIn: "China",
  },
  {
    id: "signal-fire-ai-9-splicer", name: "Signal Fire AI-9 Fusion Splicer", price: 149_000, currency: "KES", category: "Tools & Test Equipment", categorySlug: "tools-test-equipment", brand: "Signal Fire", inStock: true, isFeatured: false, warranty: "1-year warranty",
    image: image("photo-1581091226825-a6a2a5aee158"), hoverImage: image("photo-1581091226825-a6a2a5aee158"), description: "Field-ready fusion splicer for fibre technicians, maintenance teams, and FTTH deployment crews.", longDescription: "A practical splicing station for teams that need to repair and commission fibre links on site with confidence.", materials: [], care: [], sizes: [], colors: [], details: ["6-motor alignment", "Fast splice cycle", "Built-in battery", "Field toolkit"], madeIn: "China",
  },
  {
    id: "apc-easy-ups-1500va", name: "APC Easy UPS 1500VA", price: 31_500, currency: "KES", category: "Power & Protection", categorySlug: "power-protection", brand: "APC", inStock: true, isFeatured: false, warranty: "2-year warranty",
    image: image("photo-1558008258-3256797b43f3"), hoverImage: image("photo-1558008258-3256797b43f3"), description: "Reliable line-interactive backup power for routers, switches, fibre equipment, and small NOCs.", longDescription: "Protect network uptime from short outages and unstable mains power with a right-sized UPS for edge rooms and offices.", materials: [], care: [], sizes: [], colors: [], details: ["1500VA capacity", "AVR voltage regulation", "Surge protection", "LCD status display"], madeIn: "Philippines",
  },
  {
    id: "samsung-galaxy-a56-5g", name: "Samsung Galaxy A56 5G", price: 59_999, currency: "KES", category: "Smartphones", categorySlug: "smartphones", brand: "Samsung", inStock: true, isFeatured: true, warranty: "1-year warranty",
    image: image("photo-1511707171634-5f897ff02aa9"), hoverImage: image("photo-1511707171634-5f897ff02aa9"), description: "Premium mid-range 5G phone with a bright AMOLED display, dependable cameras, and long battery life.", longDescription: "A strong everyday business and personal device for customers who want modern connectivity without flagship pricing.", materials: [], care: [], sizes: [], colors: [], details: ["5G connectivity", "AMOLED display", "50MP camera", "5,000mAh battery"], madeIn: "Vietnam",
  },
  {
    id: "iphone-17e", name: "Apple iPhone 17e", price: 104_999, currency: "KES", category: "Smartphones", categorySlug: "smartphones", brand: "Apple", inStock: true, isFeatured: true, warranty: "1-year Apple warranty",
    image: image("photo-1591337676887-a217a6970a8a"), hoverImage: image("photo-1591337676887-a217a6970a8a"), description: "Efficient iPhone experience with current-generation connectivity, strong security, and long software support.", longDescription: "A compact premium phone for customers invested in the Apple ecosystem and secure device management.", materials: [], care: [], sizes: [], colors: [], details: ["5G connectivity", "Face ID", "USB-C", "Apple ecosystem"], madeIn: "China",
  },
  {
    id: "samsung-galaxy-s26", name: "Samsung Galaxy S26", price: 109_999, currency: "KES", category: "Smartphones", categorySlug: "smartphones", brand: "Samsung", inStock: true, isFeatured: true, warranty: "1-year warranty",
    image: image("photo-1565849904461-04a58ad377e0"), hoverImage: image("photo-1565849904461-04a58ad377e0"), description: "Current-generation Galaxy flagship with Galaxy AI, 5G performance, and a bright high-refresh display.", longDescription: "A premium Android option for customers who want flagship performance, strong cameras, long-term software support, and modern AI features.", materials: [], care: [], sizes: [], colors: [], details: ["Galaxy AI features", "5G connectivity", "High-refresh AMOLED", "USB-C fast charging"], madeIn: "Vietnam",
  },
  {
    id: "macbook-air-m5-13", name: "MacBook Air 13-inch — M5", price: 189_000, currency: "KES", category: "Laptops", categorySlug: "laptops", brand: "Apple", inStock: true, isFeatured: true, warranty: "1-year Apple warranty",
    image: image("photo-1517336714739-489689fd1ca8"), hoverImage: image("photo-1517336714739-489689fd1ca8"), description: "Lightweight Apple silicon laptop for consultants, developers, students, and mobile teams.", longDescription: "A quiet, portable workstation with excellent battery life for work that moves between the office, site, and home.", materials: [], care: [], sizes: [], colors: [], details: ["Apple silicon", "13-inch display", "All-day battery", "Wi-Fi 7 ready"], madeIn: "China",
  },
  {
    id: "lenovo-thinkpad-e14-gen7", name: "Lenovo ThinkPad E14 Gen 7", price: 124_500, currency: "KES", category: "Laptops", categorySlug: "laptops", brand: "Lenovo", inStock: true, isFeatured: true, warranty: "1-year warranty",
    image: image("photo-1496181133206-80ce9b88a853"), hoverImage: image("photo-1496181133206-80ce9b88a853"), description: "Business laptop with a practical keyboard, strong connectivity, and the durability teams expect from ThinkPad.", longDescription: "A dependable daily driver for operations teams, field engineers, and small businesses that value serviceability and a comfortable keyboard.", materials: [], care: [], sizes: [], colors: [], details: ["14-inch display", "16GB RAM", "512GB SSD", "Windows 11 Pro"], madeIn: "China",
  },
]

export const featuredCategories = Array.from(new Map(featuredCatalog.map((product) => [product.category, { name: product.category, slug: product.categorySlug || product.category.toLowerCase().replace(/[^a-z0-9]+/g, "-") }])).values())
