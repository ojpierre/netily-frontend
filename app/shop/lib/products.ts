export interface Product {
  id: string
  name: string
  price: number
  category: string
  brand?: string
  inStock?: boolean
  warranty?: string
  specsSheet?: Record<string, string>
  image: string
  hoverImage: string
  description: string
  longDescription: string
  materials: string[]
  care: string[]
  sizes: { size: string; available: boolean }[]
  colors: { name: string; hex: string; available: boolean }[]
  details: string[]
  madeIn: string
}

export const products: Product[] = [
  // ── NETWORKING & ISP INFRASTRUCTURE (PRIMARY) ─────────────────────────────
  {
    id: "mikrotik-ccr2004-16g-2s",
    name: "MikroTik Cloud Core Router CCR2004-16G-2S+PC",
    price: 495,
    category: "Routers & Gateways",
    brand: "MikroTik",
    inStock: true,
    warranty: "2-Year Official Netily Warranty",
    specsSheet: {
      "CPU Architecture": "ARM 64bit AL32400 Quad-Core 1.7GHz",
      "RAM": "4GB DDR4",
      "Ethernet Ports": "16x 10/100/1000 Mbps Gigabit RJ45",
      "SFP+ Ports": "2x 10Gbps SFP+ Optical Cages",
      "Throughput": "Up to 15 Gbps wire-speed forwarding",
      "Operating System": "MikroTik RouterOS v7 Level 6",
      "Power Supply": "Dual Redundant AC (100–240V) Passive Cooling",
      "Mounting": "1U Rackmount Brackets Included"
    },
    image: "/products/mikrotik_router.jpg",
    hoverImage: "/products/mikrotik_router.jpg",
    description: "16x Gigabit ports, 2x 10G SFP+ cages, Annapurna Labs Alpine Quad-Core CPU, RouterOS v7 Level 6.",
    longDescription:
      "The CCR2004-16G-2S+PC is the workhorse of modern ISP edge networks and multi-gigabit routing. Powered by the Annapurna Labs Alpine AL32400 Quad-Core 64-bit CPU running at 1.7GHz and equipped with 4GB DDR4 RAM, it handles BGP routing tables, CGNAT, high-throughput PPPoE server concentration, and complex packet filtering with ease. Comes with dual redundant internal power supplies and silent heatsink cooling.",
    materials: [
      "1U Rackmount Brackets & Screw Kit",
      "Dual IEC AC Power Cables",
      "Fastening set for 19\" rack enclosure",
      "Netily Certified QC & Test Certificate"
    ],
    care: [
      "Operating temperature: -20°C to +60°C",
      "Dual redundant hot-failover power input supported",
      "RouterOS v7 Level 6 perpetual license with lifetime upgrades"
    ],
    sizes: [
      { size: "Standard 1U Rackmount", available: true },
      { size: "With Pre-Configured ISP Template", available: true }
    ],
    colors: [
      { name: "Matte Black Industrial", hex: "#1C1C1E", available: true }
    ],
    details: [
      "Annapurna Labs Alpine AL32400 Quad-Core 1.7GHz with 4GB DDR4 RAM",
      "16x 10/100/1000 Mbps Gigabit Ethernet ports + 2x 10Gbps SFP+ cages",
      "Wire-speed BGP routing, CGNAT, bandwidth queuing, and PPPoE server",
      "Dual redundant AC power supplies with automatic failover",
      "Heatsink-based silent operation with emergency backup fan",
      "RouterOS v7 Level 6 full license included"
    ],
    madeIn: "Latvia (European Union)"
  },
  {
    id: "mikrotik-ccr2116-12g-4s",
    name: "MikroTik Cloud Core Router CCR2116-12G-4S+",
    price: 995,
    category: "Routers & Gateways",
    brand: "MikroTik",
    inStock: true,
    warranty: "2-Year Official Netily Warranty",
    specsSheet: {
      "CPU Architecture": "Amazon Annapurna Alpine AL73400 16-Core 2.0GHz",
      "RAM": "16GB DDR4 ECC",
      "Ethernet Ports": "13x Gigabit Ethernet RJ45",
      "SFP+ Ports": "4x 10Gbps SFP+ Cages",
      "Throughput": "Up to 50 Gbps wire-speed BGP routing",
      "Operating System": "RouterOS v7 Level 6",
      "Storage": "128MB NAND + M.2 PCIe slot for SSD",
      "Power": "Dual Redundant Hot-Swappable 100-240V PSU"
    },
    image: "/products/mikrotik_router.jpg",
    hoverImage: "/products/mikrotik_router.jpg",
    description: "16-Core 2.0GHz Amazon Annapurna CPU, 4x 10G SFP+, 16GB RAM for tier-1 BGP, CGNAT, and high-density ISP cores.",
    longDescription:
      "Forget CPU limitations in 10G networking. The CCR2116-12G-4S+ combines sixteen high-frequency 2GHz 64-bit ARM cores with 16GB DDR4 ECC RAM and four 10G SFP+ ports. Each port group is connected to a dedicated Marvell switch-chip directly routed to the CPU, delivering jaw-dropping single-core BGP calculation speed and over 50 Gbps overall routing capacity. Built for regional ISPs, internet exchange points (IXPs), and tier-1 data centers.",
    materials: [
      "1U Rackmount Chassis Brackets",
      "Dual Heavy-Duty AC Power Cords",
      "M.2 SSD Mounting Standoffs",
      "Console Cable (RJ45 to DB9)"
    ],
    care: [
      "Dual hot-swap redundant power units",
      "Supports BGP full routing tables across multiple transit providers",
      "2-Year manufacturer warranty included"
    ],
    sizes: [
      { size: "16GB RAM / 4x 10G SFP+", available: true },
      { size: "Bundle with 4x 10G Transceivers", available: true }
    ],
    colors: [
      { name: "Server Room Black", hex: "#111111", available: true }
    ],
    details: [
      "Amazon Annapurna Labs Alpine AL73400 16-Core 2.0GHz 64-bit ARM CPU",
      "16GB DDR4 ECC RAM for handling full BGP tables without latency",
      "4x 10G SFP+ optical ports and 13x Gigabit RJ45 Ethernet ports",
      "Hardware-offloaded Layer 3 routing via Marvell switch chips",
      "Dual hot-swappable AC power supplies for zero downtime",
      "PCIe M.2 slot for onboard caching or containerized network services"
    ],
    madeIn: "Latvia (European Union)"
  },
  {
    id: "mikrotik-crs328-24p-4s",
    name: "MikroTik Cloud Router Switch CRS328-24P-4S+RM",
    price: 479,
    category: "Switches & PoE",
    brand: "MikroTik",
    inStock: true,
    warranty: "2-Year Official Netily Warranty",
    specsSheet: {
      "Ports": "24x Gigabit RJ45 with PoE-out + 4x 10G SFP+",
      "PoE Output": "802.3af/at & Passive 24V (Auto-sensing)",
      "PoE Budget": "450W Dedicated Output Power",
      "Power Supply": "500W Internal Power Supply (100–240V)",
      "Switching Capacity": "128 Gbps non-blocking",
      "Operating System": "Dual Boot: RouterOS v7 or SwOS",
      "Form Factor": "1U Rackmount"
    },
    image: "/products/poe_switch.jpg",
    hoverImage: "/products/poe_switch.jpg",
    description: "24x Gigabit PoE-out ports (802.3af/at + 24V Passive), 4x 10G SFP+ cages, 500W internal PSU for WISP towers & APs.",
    longDescription:
      "The CRS328-24P-4S+RM is the undisputed champion switch for wireless ISP base stations, tower cabinets, and enterprise campus networks. With 24 Gigabit Ethernet ports that auto-detect and deliver both standard 802.3af/at PoE+ and 24V Passive PoE, it can simultaneously power wireless sector dishes, PTZ security cameras, and Wi-Fi 6 access points with a massive 450W power budget. Four 10G SFP+ cages ensure high-speed optical fiber uplink to your core router.",
    materials: [
      "1U Rackmount Brackets",
      "Heavy-duty IEC Power Cable",
      "Grounding screw & rubber feet kit"
    ],
    care: [
      "Operating temperature: -20°C to +60°C",
      "Auto-detects voltage requirements per port to prevent device damage",
      "Supports Dual Boot between RouterOS and SwOS"
    ],
    sizes: [
      { size: "24-Port PoE / 450W Budget", available: true },
      { size: "Bundle with 4x SFP+ 10G Modules", available: true }
    ],
    colors: [
      { name: "Industrial White & Steel", hex: "#E5E5EA", available: true }
    ],
    details: [
      "24x Gigabit Ethernet ports with independent PoE-out voltage management",
      "4x 10Gbps SFP+ cages for high-bandwidth fiber backhaul aggregation",
      "Massive 450W PoE budget with internal 500W power supply",
      "Non-blocking Layer 2 switching capacity of 128 Gbps",
      "VLAN tagging, port isolation, link aggregation (LACP), and ACLs",
      "Dual Boot: choose fast SwOS or full RouterOS v7 routing features"
    ],
    madeIn: "Latvia (European Union)"
  },
  {
    id: "mikrotik-rb5009",
    name: "MikroTik RB5009UG+S+IN Heavy-Duty Router",
    price: 219,
    category: "Routers & Gateways",
    brand: "MikroTik",
    inStock: true,
    warranty: "2-Year Official Netily Warranty",
    specsSheet: {
      "CPU": "Marvell Armada 88F7040 Quad-Core 1.4GHz",
      "RAM": "1GB DDR4 + 1GB NAND",
      "Ports": "7x 1G RJ45 + 1x 2.5G RJ45 + 1x 10G SFP+",
      "Power Inputs": "PoE-in (802.3af/at), DC Jack, 2-Pin Terminal",
      "Chassis": "Rugged all-metal heat-dissipating enclosure",
      "Form Factor": "Ultra-compact (4 fit into 1U rack slot)"
    },
    image: "/products/mikrotik_router.jpg",
    hoverImage: "/products/mikrotik_router.jpg",
    description: "7x Gigabit, 1x 2.5G Ethernet, 1x 10G SFP+, Marvell Quad-Core CPU, ultra-compact metal chassis.",
    longDescription:
      "The RB5009UG+S+IN is the ultimate compact heavy-duty router for SMBs, ISP remote distribution hubs, and power lab installations. It features a versatile port configuration: seven 1G Ethernet ports, one 2.5G Ethernet port for high-speed fiber CPE termination, and a full 10G SFP+ cage. Powered by a Marvell Armada Quad-Core 1.4GHz processor, it delivers incredible throughput in a rugged metal shell that functions as a massive heatsink.",
    materials: [
      "Fastening set with wall anchors",
      "24V 1.5A Power Adapter",
      "Heavy-duty metal rack ears"
    ],
    care: [
      "Passive heatsink cooling for 100% silent continuous operation",
      "Accepts 24V–57V PoE-in on Port 1 or terminal block"
    ],
    sizes: [
      { size: "Standard Desktop/Rackmount", available: true },
      { size: "Dual-Unit 1U Rackmount Kit", available: true }
    ],
    colors: [
      { name: "Stealth Black Metal", hex: "#1C1C1E", available: true }
    ],
    details: [
      "Marvell Armada Quad-Core 1.4GHz ARMv8 CPU with 1GB DDR4 RAM",
      "1x 2.5GbE RJ45 + 7x 1GbE RJ45 + 1x 10G SFP+ cages",
      "Full wire-speed switching with hardware VLAN filtering",
      "Triple redundant power input: PoE-in, DC Jack, and 2-pin industrial block",
      "Ultra-compact form factor: up to 4 units can fit in 1U space",
      "Full RouterOS v7 Level 5 license included"
    ],
    madeIn: "Latvia (European Union)"
  },
  {
    id: "ubiquiti-udm-se",
    name: "Ubiquiti UniFi Dream Machine Special Edition (UDM-SE)",
    price: 549,
    category: "Routers & Gateways",
    brand: "Ubiquiti",
    inStock: true,
    warranty: "1-Year Netily Official Warranty",
    specsSheet: {
      "Processor": "Quad-Core ARM Cortex-A57 at 1.7 GHz",
      "Memory": "4GB DDR4",
      "WAN Ports": "1x 2.5GbE RJ45 + 1x 10G SFP+",
      "LAN Ports": "8x GbE RJ45 (2x PoE+, 6x PoE) + 1x 10G SFP+",
      "IDS/IPS Throughput": "3.5 Gbps with full DPI and threat protection",
      "Storage": "128GB internal SSD + 3.5\" HDD bay",
      "Display": "1.3\" Touchscreen LCM for real-time status"
    },
    image: "/products/poe_switch.jpg",
    hoverImage: "/products/poe_switch.jpg",
    description: "All-in-one 10G enterprise gateway, 2.5GbE WAN, 8-port PoE switch, integrated UniFi OS controller.",
    longDescription:
      "The UniFi Dream Machine Special Edition (UDM-SE) is the premier enterprise networking gateway combining firewall, 10G router, PoE switch, and unified management controller into a single 1U device. Features dual WAN ports (2.5GbE and 10G SFP+) with automated failover, eight PoE-enabled Gigabit ports, and 3.5 Gbps intrusion detection/prevention throughput with zero performance degradation.",
    materials: [
      "1U Rackmount Brackets and Screws",
      "Rubber footpads for desktop placement",
      "Heavy-duty power cord"
    ],
    care: [
      "Integrated UniFi Network, Protect, Access, and Talk controller",
      "Supports 3.5\" SATA HDD up to 16TB for surveillance NVR recording"
    ],
    sizes: [
      { size: "Base 128GB SSD", available: true },
      { size: "With 4TB Surveillance HDD", available: true },
      { size: "With 8TB Surveillance HDD", available: true }
    ],
    colors: [
      { name: "UniFi Silver Aluminum", hex: "#C8C9CC", available: true }
    ],
    details: [
      "Quad-Core ARM Cortex-A57 at 1.7 GHz with 4GB DDR4 RAM",
      "Integrated 8-port Gigabit PoE switch (2x PoE+ 802.3at, 6x PoE 802.3af)",
      "2.5GbE RJ45 WAN and 10G SFP+ LAN / WAN connectivity",
      "Built-in UniFi OS with remote cloud access and zero licensing fees",
      "3.5 Gbps Threat Management (IDS/IPS) inspection engine",
      "1.3\" LCM touch screen for instant port status and traffic metrics"
    ],
    madeIn: "Designed by Ubiquiti in Utah, USA"
  },
  {
    id: "ubiquiti-uisp-wave-pro",
    name: "Ubiquiti UISP Wave Pro 60GHz PtP Backhaul Radio",
    price: 599,
    category: "Wireless & Backhaul",
    brand: "Ubiquiti",
    inStock: true,
    warranty: "2-Year Netily Official Warranty",
    specsSheet: {
      "Operating Frequency": "60GHz (57–71GHz) + 5GHz Backup",
      "Max Throughput": "5.4 Gbps aggregate (2.7 Gbps full duplex)",
      "Maximum Range": "15km+ with automatic 5GHz failover",
      "Antenna Gain": "46 dBi dish antenna",
      "Ports": "1x 2.5GbE RJ45 + 1x 10G SFP+ cage",
      "Weatherproofing": "IP67 weatherproof aluminum body",
      "GPS Sync": "Integrated GPS receiver for co-location"
    },
    image: "/products/wireless_dish.jpg",
    hoverImage: "/products/wireless_dish.jpg",
    description: "5.4 Gbps aggregate throughput, 15km+ link distance with 5GHz integrated backup radio.",
    longDescription:
      "Deliver multi-gigabit wireless internet without digging trenches. The UISP Wave Pro operates on the interference-free 60GHz band, providing up to 5.4 Gbps aggregate throughput over links exceeding 15 kilometers. Equipped with high-gain 46 dBi dish reflector, a 2.5GbE PoE port, a 10G SFP+ optical port, and an integrated 5GHz backup radio with seamless automatic failover during intense tropical rain events.",
    materials: [
      "46 dBi Parabolic Reflector Dish",
      "High-precision fine-elevation pole mount bracket",
      "48V 0.65A Gigabit PoE Injector",
      "Weatherproof cable gland kit"
    ],
    care: [
      "IP67 environmental rating for hurricane-force wind and heavy rain",
      "Align using built-in Bluetooth and UISP Mobile App signal tool"
    ],
    sizes: [
      { size: "Single Radio Unit", available: true },
      { size: "Paired Complete PtP Link (2 Units)", available: true }
    ],
    colors: [
      { name: "UV-Resistant Weatherproof White", hex: "#F8F9FA", available: true }
    ],
    details: [
      "5.4 Gbps aggregate throughput (2.7 Gbps full duplex) over 60GHz spectrum",
      "Long-distance capability: up to 15km+ with precision beam steering",
      "Automatic 5GHz backup radio for 99.999% link uptime during heavy precipitation",
      "10G SFP+ port for direct optical tower connection without bottleneck",
      "Integrated GPS synchronization to eliminate tower co-location interference",
      "Bluetooth management radio for rapid smartphone antenna aiming"
    ],
    madeIn: "Designed by Ubiquiti in Utah, USA"
  },
  {
    id: "vsol-8port-gpon-olt",
    name: "VSOL 8-Port Carrier-Grade GPON OLT (V1600G1-B)",
    price: 1250,
    category: "Fiber Optics & OLT",
    brand: "VSOL",
    inStock: true,
    warranty: "2-Year Official Netily Warranty",
    specsSheet: {
      "PON Ports": "8x GPON Ports (ITU-T G.984.x compliant)",
      "Split Ratio": "1:128 (Supports up to 1,024 subscriber ONUs)",
      "Uplink Ports": "4x Gigabit GE SFP + 2x 10GE SFP+ Optical",
      "Power Supply": "Dual Hot-Swappable Redundant AC (220V) + DC (48V)",
      "Switching Capacity": "128 Gbps non-blocking backplane",
      "Management": "CLI, SNMP, Web GUI, EMS / OMCI central platform",
      "Form Factor": "1U 19-inch standard rackmount"
    },
    image: "/products/poe_switch.jpg",
    hoverImage: "/products/poe_switch.jpg",
    description: "Carrier-class 8 GPON ports (1:128 split, 1024 ONTs), 4x GE SFP + 2x 10G SFP+ uplinks, dual AC/DC PSU.",
    longDescription:
      "The backbone of modern Fiber-To-The-Home (FTTH) ISP rollouts. The VSOL V1600G1-B GPON OLT delivers 8 carrier-grade GPON ports, each supporting a 1:128 optical split ratio to terminate up to 1,024 subscriber ONTs. Equipped with dual 10G SFP+ uplinks, full Dynamic Bandwidth Allocation (DBA), automatic ONT registration, and dual hot-swappable AC+DC redundant power supplies to guarantee uninterruptible internet distribution.",
    materials: [
      "8x Class C++ GPON SFP Optical Transceiver Modules Included",
      "Dual AC Power Cords & 48V DC Terminal Connector",
      "1U Rackmount Brackets and grounding wire",
      "Console RS232 Cable"
    ],
    care: [
      "Dual hot-swap AC/DC power failover ensures 24/7 uptime",
      "Class C++ SFP modules provide +32dB optical power budget for up to 20km links",
      "Pre-configured OMCI auto-provisioning script available upon request"
    ],
    sizes: [
      { size: "8-Port OLT with 8x C++ Modules", available: true },
      { size: "Turnkey FTTH Starter Bundle (OLT + 50 ONTs)", available: true }
    ],
    colors: [
      { name: "Telco Metallic Gray", hex: "#4A4D52", available: true }
    ],
    details: [
      "8x GPON ports capable of powering 1,024 subscriber households simultaneously",
      "Dual 10G SFP+ uplinks for connecting straight to core BGP routers",
      "Includes 8x high-power Class C++ GPON optical modules in the box",
      "Dual redundant hot-swappable AC (220V) and DC (-48V) power modules",
      "Hardware QoS, Dynamic Bandwidth Allocation (DBA), and rogue ONU isolation",
      "Comprehensive Web management, CLI, and Netily EMS central management"
    ],
    madeIn: "Shenzhen (Telecom Grade)"
  },
  {
    id: "netily-pro-gpon-ont-wifi6",
    name: "Netily Pro AX3000 Wi-Fi 6 GPON ONT / ONU Terminal",
    price: 58,
    category: "Fiber Optics & OLT",
    brand: "Netily Pro",
    inStock: true,
    warranty: "2-Year Netily Replacement Warranty",
    specsSheet: {
      "Optical Interface": "1x SC/APC GPON Class B+/C+ port",
      "Wi-Fi Speed": "AX3000 (2402 Mbps 5GHz + 574 Mbps 2.4GHz)",
      "LAN Ports": "4x 10/100/1000 Mbps Gigabit RJ45",
      "VoIP Phone": "1x RJ11 FXS Voice Phone Port",
      "USB": "1x USB 3.0 Media Sharing Port",
      "Antennas": "4x 5dBi external omnidirectional high-gain antennas",
      "Provisioning": "OMCI, TR-069, Netily Cloud ACS auto-config"
    },
    image: "/products/poe_switch.jpg",
    hoverImage: "/products/poe_switch.jpg",
    description: "Subscriber-end fiber ONT with dual-band AX3000 Wi-Fi 6, 4x Gigabit LAN, 1x FXS VoIP phone port.",
    longDescription:
      "Deliver premium Wi-Fi 6 gigabit speeds to your fiber subscribers. The Netily Pro AX3000 GPON ONT integrates a high-sensitivity SC/APC optical receiver with cutting-edge 160MHz Wi-Fi 6 technology, delivering real-world wireless speeds up to 2.4 Gbps. Equipped with 4 Gigabit Ethernet ports for IPTV and PCs, a VoIP FXS port, and full TR-069 / OMCI auto-provisioning for zero-touch subscriber deployment.",
    materials: [
      "12V 1.5A Power Adapter",
      "1.5m Cat6 RJ45 Patch Cord",
      "Quick Installation Guide & Subscriber QR Code"
    ],
    care: [
      "High optical sensitivity: -28dBm for stable long-distance drops",
      "Supports EasyMesh multi-AP whole-home roaming"
    ],
    sizes: [
      { size: "Single Unit (Retail Pack)", available: true },
      { size: "Carton of 20 Units (ISP Bulk Tier)", available: true },
      { size: "Master Case of 50 Units (ISP Wholesale)", available: true }
    ],
    colors: [
      { name: "Clean Matte White", hex: "#FAFAFA", available: true }
    ],
    details: [
      "Blazing Wi-Fi 6 AX3000 with 1024-QAM and 160MHz channel bandwidth",
      "4x Gigabit LAN ports for wired computers, gaming consoles, and IPTV boxes",
      "1x SC/APC optical port compatible with VSOL, Huawei, and ZTE OLTs",
      "1x FXS telephone port for landline VoIP service over SIP protocol",
      "TR-069 & OMCI support for remote ISP diagnostics, speed tests, and Wi-Fi resets",
      "EasyMesh compliant for seamless wireless extender pairing"
    ],
    madeIn: "Taiwan"
  },
  {
    id: "signal-fire-ai9-splicer",
    name: "Signal Fire AI-9 6-Motor Optical Fiber Fusion Splicer",
    price: 890,
    category: "Fiber Optics & OLT",
    brand: "Signal Fire",
    inStock: true,
    warranty: "3-Year Manufacturer Warranty",
    specsSheet: {
      "Alignment": "6-Motor Core-to-Core Active Alignment",
      "Splice Time": "5 Seconds Ultra-Fast Splicing",
      "Heating Time": "15 Seconds Rapid Heating Oven",
      "Built-in Instruments": "Optical Power Meter (-70 to +10 dBm) & VFL (15mW)",
      "Screen": "5-Inch 800x480 High-Res LCD (300x zoom)",
      "Battery": "7800mAh Li-ion (approx. 240 splice/heat cycles)",
      "Electrodes": "Long-life electrodes rated for 3,000+ arcs"
    },
    image: "/products/fusion_splicer.jpg",
    hoverImage: "/products/fusion_splicer.jpg",
    description: "Core alignment 6-motor fusion splicer, 5-second splice, 15-second heating, built-in VFL and OPM.",
    longDescription:
      "The undisputed field tool for fiber optic technicians and ISP engineering crews. The Signal Fire AI-9 features 6-motor core-to-core alignment with industrial-grade micro-steppers for ultra-low splice loss (<0.02dB on SM fiber). Integrates an optical power meter, visual fault locator, 5-second lightning splice time, and comes inside a rugged, weather-sealed field toolkit that doubles as a technician work seat.",
    materials: [
      "Signal Fire AI-9 Fusion Splicer Unit",
      "High-Precision S09 Optical Fiber Cleaver",
      "Kevlar Miller Fiber Stripper & Drop Cable Stripper",
      "Spare Electrodes Pair (Rated for 3,000 arcs)",
      "Heavy-Duty Field Tool Case with Integrated Work Stool",
      "Rechargeable 7800mAh Battery & AC Charger"
    ],
    care: [
      "Dust and moisture resistant IP52 rating",
      "Calibrate automatically before large splicing runs via mobile app"
    ],
    sizes: [
      { size: "Complete Master Field Toolkit", available: true },
      { size: "Toolkit + Extra 7800mAh Battery", available: true }
    ],
    colors: [
      { name: "Safety Orange & Industrial Gray", hex: "#E85D04", available: true }
    ],
    details: [
      "Industrial 6-motor core alignment system with 300x fiber core magnification",
      "5-second fusion splicing and 15-second automatic heating tube shrink",
      "Integrated 850–1625nm Optical Power Meter & 15mW Visual Fault Locator",
      "7800mAh high-capacity battery provides up to 240 continuous splices and heat cycles",
      "Heavy-duty impact-resistant flight case converts into an ergonomic technician workstation",
      "Smart Bluetooth diagnostics and firmware updates via mobile companion app"
    ],
    madeIn: "Assembled with German & Japanese Components"
  },
  {
    id: "netily-cat6a-outdoor-305m",
    name: "Netily Pro Cat6A Shielded S/FTP Outdoor UV Cable (305m Drum)",
    price: 265,
    category: "Cabling & Infrastructure",
    brand: "Netily Pro",
    inStock: true,
    warranty: "25-Year System Warranty",
    specsSheet: {
      "Conductor": "23 AWG 100% Solid Pure Annealed Bare Copper",
      "Shielding": "S/FTP (Foil Shielded Pairs + Tinned Copper Outer Braid)",
      "Bandwidth": "Tested to 500MHz (Supports 10GBASE-T up to 100m)",
      "Jacket": "Heavy-Duty UV-Resistant Water-Block Polyethylene (PE)",
      "Length": "305 Metres (1,000 Feet) Drum",
      "PoE Rating": "PoE++ 802.3bt Type 4 (Up to 90W) certified"
    },
    image: "/products/cat6a_cable.jpg",
    hoverImage: "/products/cat6a_cable.jpg",
    description: "23 AWG 100% Solid Bare Copper, 500MHz 10Gbps transmission, double shielded, UV-resistant PE jacket.",
    longDescription:
      "Engineered specifically for harsh outdoor telecom tower runs, inter-building links, and high-interference industrial environments. Netily Pro Cat6A S/FTP utilizes 23 AWG solid bare copper conductors with double shielding—each twisted pair is wrapped in aluminum foil, surrounded by an overall tinned copper braid and wrapped in a sunlight-resistant, waterproof dual-layer PE jacket.",
    materials: [
      "Heavy-duty wooden reel spool with steel reinforcement core",
      "Metre-by-metre sequential countdown length markings",
      "Internal water-blocking gel tape"
    ],
    care: [
      "UV-rated for 20+ years of direct sunlight and extreme African climate exposure",
      "Pure solid copper ensures zero signal drop and full 90W PoE power delivery"
    ],
    sizes: [
      { size: "305m Wooden Drum", available: true },
      { size: "500m Wooden Drum", available: true },
      { size: "Bundle: 305m Cable + 100x Shielded RJ45 Plugs", available: true }
    ],
    colors: [
      { name: "UV Weatherproof Matte Black", hex: "#1A1A1A", available: true }
    ],
    details: [
      "100% pure electrolytic solid bare copper — zero CCA (Copper Clad Aluminum)",
      "Double shielding (S/FTP) completely eliminates Alien Crosstalk and EMI interference",
      "Certified for 10 Gigabit Ethernet (10GBASE-T) at full 100m channel lengths",
      "Supports IEEE 802.3bt PoE++ up to 90W without conductor overheating",
      "Heavy-gauge UV-stabilized outdoor jacket with water-blocking protection",
      "Sequential metre markings from 001m to 305m for accurate cable accounting"
    ],
    madeIn: "Certified ISO9001 Facility"
  },
  {
    id: "netily-cat6-utp-305m",
    name: "Netily Pro Cat6 UTP 100% Solid Copper Bulk Cable (305m Box)",
    price: 145,
    category: "Cabling & Infrastructure",
    brand: "Netily Pro",
    inStock: true,
    warranty: "25-Year Performance Warranty",
    specsSheet: {
      "Conductor": "24 AWG 100% Solid Bare Copper",
      "Design": "UTP (Unshielded Twisted Pair) with internal PE spline",
      "Bandwidth": "Tested to 250MHz (ANSI/TIA-568-C.2)",
      "Jacket": "Flame-Retardant Low Smoke Zero Halogen (LSZH) / PVC",
      "Length": "305 Metres (1,000 Feet) Reelex Pull Box"
    },
    image: "/products/cat6a_cable.jpg",
    hoverImage: "/products/cat6a_cable.jpg",
    description: "24 AWG solid bare copper, 250MHz certified, easy-pull tangle-free reel box for structured indoor cabling.",
    longDescription:
      "The premier choice for indoor structured horizontal cabling in commercial offices, data centers, and residential apartments. Features 24 AWG 100% solid copper conductors with a central polyethylene cross-spline that maintains pair separation and eliminates internal near-end crosstalk (NEXT). Packaged in an easy-pull tangle-free Reelex box for effortless single-technician pulls.",
    materials: [
      "Heavy-duty double-wall corrugated pull box with smooth payout guide",
      "Reverse metre countdown markers (305m down to 0m)"
    ],
    care: [
      "Suitable for indoor conduit, ceiling trays, and riser installations",
      "Complies with ANSI/TIA-568.2-D and ISO/IEC 11801 standards"
    ],
    sizes: [
      { size: "305m Pull-Box", available: true },
      { size: "Bulk Pallet (24 Boxes)", available: true }
    ],
    colors: [
      { name: "Royal Telecom Blue", hex: "#1D4ED8", available: true },
      { name: "Clean Office Gray", hex: "#9CA3AF", available: true },
      { name: "Safety Violet (LSZH)", hex: "#7C3AED", available: true }
    ],
    details: [
      "24 AWG pure solid copper conductors for optimal gigabit transmission",
      "Cross-spline polyethylene separator maintains strict pair geometry",
      "250MHz bandwidth verified for Gigabit Ethernet (1000BASE-T)",
      "Patented Reelex payout tube prevents twists, kinks, and cable snagging",
      "Low Smoke Zero Halogen (LSZH) jacket for enhanced building fire safety",
      "Accurate reverse metre markings eliminate cable wastage on job sites"
    ],
    madeIn: "Certified ISO9001 Facility"
  },
  {
    id: "keystone-patch-panel-24p",
    name: "24-Port 1U Cat6A Shielded Modular Keystone Patch Panel",
    price: 89,
    category: "Cabling & Infrastructure",
    brand: "Netily Pro",
    inStock: true,
    warranty: "Lifetime Warranty",
    specsSheet: {
      "Standard": "19-inch 1U Rackmount Format",
      "Port Count": "24 Ports with Included Cat6A Keystone Jacks",
      "Material": "1.5mm Heavy-Duty SPCC Cold Rolled Steel",
      "Shielding": "360-Degree Die-Cast Zinc Keystone Shielding + Ground Wire",
      "Termination": "Toolless 180-Degree 110/Krone Compatible"
    },
    image: "/products/poe_switch.jpg",
    hoverImage: "/products/poe_switch.jpg",
    description: "Heavy-duty SPCC steel, includes 24 toolless shielded keystone jacks, rear cable management bar.",
    longDescription:
      "Clean up your rack and maximize 10G signal integrity. This 1U 24-port Cat6A modular patch panel comes loaded with 24 high-performance die-cast zinc alloy shielded keystone jacks. Features a rear cable management bracket with cable tie anchors and a pre-connected green ground wire for discharging electrostatic buildup.",
    materials: [
      "1U 19-inch SPCC Steel Patch Panel Frame",
      "24x Toolless Shielded Cat6A Keystone Jacks",
      "Detachable rear cable support bar with 24 cable ties",
      "M6 rackmount cage nuts and grounding hardware"
    ],
    care: [
      "Keystone jacks require no punchdown tool — simply clamp shut",
      "Supports PoE, PoE+, and 4PPoE up to 90W"
    ],
    sizes: [
      { size: "24-Port 1U (Complete with Keystones)", available: true },
      { size: "48-Port 2U Version", available: true }
    ],
    colors: [
      { name: "Matte Black Powder Coat", hex: "#1C1C1E", available: true }
    ],
    details: [
      "Heavy-duty 1.5mm SPCC cold-rolled steel construction that never flexes",
      "Includes 24 toolless die-cast zinc Cat6A keystone jacks (500MHz certified)",
      "Rear cable management bar relieves strain on incoming bundle cables",
      "Numbered front ports with writable white identification labels",
      "Integrated earth grounding lead for complete static and lightning drain",
      "Standard 19-inch rack format fits all server and telecom cabinets"
    ],
    madeIn: "Taiwan"
  },
  {
    id: "sfp-plus-10g-lr-10km",
    name: "10G SFP+ Optical Transceiver Module (10GBASE-LR 1310nm 10km)",
    price: 42,
    category: "Fiber Optics & OLT",
    brand: "Netily Pro",
    inStock: true,
    warranty: "3-Year Advanced Replacement",
    specsSheet: {
      "Data Rate": "10.3125 Gbps (10GBASE-LR / LW)",
      "Wavelength": "1310nm DFB Laser Transmitter",
      "Distance": "Up to 10 Kilometres over 9/125µm Single-Mode Fiber",
      "Connector": "Duplex LC Optical Interface",
      "Diagnostics": "DDM / DOM Real-Time Digital Monitoring",
      "Power": "Ultra-low power consumption (<1.0W)"
    },
    image: "/products/poe_switch.jpg",
    hoverImage: "/products/poe_switch.jpg",
    description: "Single-mode LC duplex 10G optical transceiver, 10km link distance, DDM/DOM diagnostics.",
    longDescription:
      "Reliable, high-density 10G optical interconnect for MikroTik, Ubiquiti, Cisco, and Huawei switches and routers. Built with an uncooled 1310nm DFB laser and high-sensitivity PIN photodetector, delivering reliable 10 Gigabit data transmission over single-mode optical fiber up to 10 kilometers. Equipped with real-time Digital Diagnostic Monitoring (DDM) for live temperature, laser bias, and optical power feedback.",
    materials: [
      "Anti-static protective clamshell blister pack",
      "Dust caps for LC optical ports",
      "Individual serial number and EEPROM coding certificate"
    ],
    care: [
      "Always keep dust cap on when fiber cable is not connected",
      "Compatible with RouterOS, UniFi OS, Cisco IOS, and generic MSA devices"
    ],
    sizes: [
      { size: "Single 10G SFP+ Module", available: true },
      { size: "Pack of 10 Modules (ISP Discount)", available: true },
      { size: "Pack of 20 Modules", available: true }
    ],
    colors: [
      { name: "Silver Metal with Blue Latch", hex: "#007AFF", available: true }
    ],
    details: [
      "10.3 Gbps bi-directional transmission over single-mode fiber (SMF)",
      "1310nm DFB laser with up to 10km reach",
      "Hot-pluggable SFP+ footprint with low power draw (<1.0W)",
      "Digital Diagnostic Monitoring (DDM/DOM) supported natively in RouterOS",
      "100% interoperability tested on MikroTik CCR/CRS and Ubiquiti switches",
      "Compliant with SFF-8431, SFF-8432, and IEEE 802.3ae standards"
    ],
    madeIn: "Optics Cleanroom Certified"
  },
  {
    id: "netily-42u-server-cabinet",
    name: "Netily Pro 42U Data Center Server Rack Cabinet (800x1000mm)",
    price: 1150,
    category: "Racks & Power",
    brand: "Netily Pro",
    inStock: true,
    warranty: "5-Year Structural Warranty",
    specsSheet: {
      "Capacity": "42U Industry Standard 19-inch Mounting",
      "Dimensions": "2050mm Height x 800mm Width x 1000mm Depth",
      "Static Load": "1,000 kg (2,204 lbs) Reinforced Steel Rating",
      "Doors": "75% Hexagonal High-Airflow Perforated Mesh Front & Split Rear",
      "Cooling": "Top Roof Unit with 4x Heavy-Duty Ball-Bearing Exhaust Fans",
      "Cable Entry": "Top and bottom brush-sealed cable entry slots"
    },
    image: "/products/server_rack.jpg",
    hoverImage: "/products/server_rack.jpg",
    description: "High-density perforated mesh doors (75% airflow), 1000kg load capacity, 4 cooling fans, lockable panels.",
    longDescription:
      "The gold standard for ISP Network Operations Centers (NOCs), server rooms, and telecommunication exchanges. The Netily Pro 42U Server Cabinet provides an ultra-wide 800mm profile with deep vertical cable management channels on both sides. High-density perforated mesh doors provide 75% open ventilation for high-heat core routers and server arrays. Comes pre-assembled with heavy-duty castors, leveling feet, and 4 top exhaust cooling fans.",
    materials: [
      "Pre-assembled 42U Server Cabinet Enclosure",
      "4-Fan Roof Exhaust Unit with thermostat wiring",
      "40 sets of M6 cage nuts, screws, and washers",
      "Set of 4 heavy-duty castors and 4 adjustable leveling feet",
      "Keys for front, rear, and side panel cam locks"
    ],
    care: [
      "Ships on wooden pallet with protective foam and heavy strapping",
      "Grounding wire kit pre-installed across all frame components"
    ],
    sizes: [
      { size: "42U (800mm x 1000mm Extra Wide)", available: true },
      { size: "42U (600mm x 1000mm Standard)", available: true },
      { size: "24U Half-Rack Version", available: true }
    ],
    colors: [
      { name: "Data Center Textured Black", hex: "#111111", available: true }
    ],
    details: [
      "Ultra-strong SPCC cold-rolled steel construction with 1,000kg static load rating",
      "Extra 800mm width includes wide vertical cable organizer fingers for thick cabling bundles",
      "75% hexagonal perforated doors optimize front-to-back cold aisle airflow",
      "Lockable front mesh door, split wardrobe rear doors, and removable side panels",
      "Top-mounted 4-fan high-velocity exhaust system included as standard",
      "Adjustable internal 19\" mounting rails with silkscreened U-unit markings"
    ],
    madeIn: "ISO9001 Certified Heavy Steel Works"
  },
  {
    id: "apc-smart-ups-3000va",
    name: "APC Smart-UPS On-Line 3000VA (3kVA) 2U Rackmount with SNMP",
    price: 1690,
    category: "Racks & Power",
    brand: "APC by Schneider Electric",
    inStock: true,
    warranty: "3-Year Electronics, 2-Year Battery Warranty",
    specsSheet: {
      "Output Capacity": "3000VA / 2700 Watts Pure Sine Wave",
      "Topology": "True Double-Conversion Online (Zero transfer time)",
      "Output Voltage": "230V Nominal (Configurable 220V/240V)",
      "Network Card": "Pre-installed AP9641 SNMP Network Management Card",
      "Outlets": "(6) IEC 320 C13 + (2) IEC 320 C19 outlets",
      "Form Factor": "2U Rack/Tower Convertible"
    },
    image: "/products/server_rack.jpg",
    hoverImage: "/products/server_rack.jpg",
    description: "Double-conversion online pure sine wave UPS, zero transfer time, pre-installed network management card.",
    longDescription:
      "Protect your mission-critical ISP core routing and fiber OLTs against power surges, blackouts, and generator harmonic distortions. The APC Smart-UPS On-Line 3000VA delivers true double-conversion power conditioning with zero millisecond transfer time to battery. Equipped with the AP9641 Network Management Card for remote web monitoring, automated shutdown scripts, and environmental sensor alerts.",
    materials: [
      "2U Rackmount Rail Kit",
      "Pre-installed AP9641 Gigabit Network Card",
      "USB and Serial Signaling Cables",
      "IEC to IEC Output Power Cords"
    ],
    care: [
      "Hot-swappable user-replaceable battery modules",
      "Supports external battery packs (SRT96RMBP) for multiple hours of runtime"
    ],
    sizes: [
      { size: "Standard 3kVA with Internal Batteries", available: true },
      { size: "3kVA + External Extended Battery Pack", available: true }
    ],
    colors: [
      { name: "APC Charcoal Black", hex: "#1F2022", available: true }
    ],
    details: [
      "True double-conversion online topology with zero transfer time to inverter",
      "Pure sine wave output safe for power supplies with Active PFC",
      "High power density: 2700 Watts in a compact 2U rack space",
      "Pre-installed network card enables remote SNMP monitoring and email alerts",
      "Individually switchable outlet groups for rebooting frozen devices remotely",
      "Emergency Power Off (EPO) terminal connection included"
    ],
    madeIn: "APC by Schneider Electric"
  },
  {
    id: "master-cabling-tool-kit",
    name: "Netily Pro Network Cabling & Fiber Termination Master Kit",
    price: 185,
    category: "Cabling & Infrastructure",
    brand: "Netily Pro",
    inStock: true,
    warranty: "Lifetime Tool Warranty",
    specsSheet: {
      "Crimper": "Heavy-duty ratcheting pass-through RJ45/RJ11 crimper",
      "Punchdown Tool": "Impact punchdown with reversible 110/Krone blades",
      "Cable Tester": "Digital Wiremap tester for RJ45, RJ11, and Shielded STP",
      "Fiber Tools": "Optical Power Meter (-70 to +10dBm) & 30mW Visual Fault Locator",
      "Included Accessories": "100x Cat6A shielded pass-through plugs + strain boots",
      "Case": "Reinforced aluminum trim technician carry case"
    },
    image: "/products/fusion_splicer.jpg",
    hoverImage: "/products/fusion_splicer.jpg",
    description: "Complete field toolkit: Ratchet RJ45 pass-through crimper, punchdown tool, fiber cleaver, OPM, VFL.",
    longDescription:
      "The definitive field toolkit for ISP installation crews, network engineers, and cabling contractors. Contains everything needed to terminate, verify, and certify both copper and optical fiber links. Includes a heavy-duty ratcheting pass-through RJ45 crimper, spring-loaded 110 impact punchdown tool, precision fiber cleaver, multi-wavelength optical power meter, high-output 30mW visual fault locator laser, wiremap tester, and 100 shielded Cat6A modular plugs.",
    materials: [
      "Ratcheting RJ45/RJ11 pass-through crimping tool",
      "Impact 110/Krone punchdown tool with spare blade storage",
      "High-precision optical fiber cleaver with waste collector",
      "Digital Optical Power Meter (-70 to +10 dBm) & 30mW Visual Fault Locator",
      "Multi-conductor wiremap network tester with remote unit",
      "100x Cat6A shielded pass-through connectors & 100x rubber boots",
      "Durable shockproof aluminum technician carry briefcase"
    ],
    care: [
      "Keep optical cleaver blade clean with 99% isopropyl alcohol wipes",
      "Ratcheting crimper features replaceable flush-cutting blade"
    ],
    sizes: [
      { size: "Master All-in-One Field Kit", available: true },
      { size: "Kit + 500x Shielded RJ45 Plugs", available: true }
    ],
    colors: [
      { name: "Industrial Matte Black & Orange", hex: "#E85D04", available: true }
    ],
    details: [
      "Pass-through RJ45 crimping trims excess wires flush with connector face in one squeeze",
      "Impact punchdown tool seats and cuts twisted pairs cleanly in keystone jacks and patch panels",
      "High-precision fiber cleaver scores optical fiber at a precise 90-degree angle for splicing",
      "Multi-frequency optical power meter verifies signal loss across all telecom wavelengths",
      "30mW Visual Fault Locator pen pinpoints micro-bends and fiber breaks up to 30km away",
      "Custom foam-cut heavy-duty aluminum technician briefcase keeps all tools organized"
    ],
    madeIn: "Netily Certified Assembly"
  },
  {
    id: "mikrotik-mantbox-52-15s",
    name: "MikroTik mANTBox 52 15s Dual-Band WISP Sector Base Station",
    price: 165,
    category: "Wireless & Backhaul",
    brand: "MikroTik",
    inStock: true,
    warranty: "2-Year Official Netily Warranty",
    specsSheet: {
      "Frequency Bands": "Dual-Band 5GHz and 2.4GHz simultaneously",
      "Antenna Gain": "15 dBi (5GHz) and 12 dBi (2.4GHz)",
      "Beamwidth": "120-Degree Sector Coverage",
      "Processor": "Quad-Core 716MHz IPQ-4019 CPU with 256MB RAM",
      "Ports": "1x Gigabit RJ45 (PoE-in) + 1x SFP Optical Cage",
      "Operating System": "RouterOS Level 4 License"
    },
    image: "/products/wireless_dish.jpg",
    hoverImage: "/products/wireless_dish.jpg",
    description: "Integrated 2.4/5GHz router and 15dBi 120-degree sector antenna, Gigabit Ethernet, SFP cage.",
    longDescription:
      "An all-in-one base station solution for wireless internet service providers (WISPs). The mANTBox 52 15s integrates a high-gain dual-band 120-degree sector antenna with a powerful quad-core RouterOS device. It allows you to connect clients over both 5GHz and 2.4GHz frequencies simultaneously, with a dedicated SFP optical cage for direct fiber feeds up the tower without needing copper cable converters.",
    materials: [
      "mANTBox 52 15s Integrated Sector Radio",
      "quickMOUNT pro heavy-duty precision pole clamp",
      "48V 0.95A Gigabit PoE Injector & Power Supply",
      "Metal hose clamp for mast mounting"
    ],
    care: [
      "IP55 weatherproofing rating with UV-stabilized radome enclosure",
      "Pre-configured for Point-to-MultiPoint (PtMP) access point operation"
    ],
    sizes: [
      { size: "120-Degree Sector Radio", available: true },
      { size: "3-Unit Complete 360-Degree Tower Kit", available: true }
    ],
    colors: [
      { name: "Tower Gray Weatherproof", hex: "#E5E7EB", available: true }
    ],
    details: [
      "Combines high-gain sector antenna and RouterOS routing engine in a single enclosure",
      "120-degree sector beamwidth with 15 dBi gain on 5GHz and 12 dBi gain on 2.4GHz",
      "Gigabit Ethernet with 802.3af/at PoE-in support plus an SFP cage for optical fiber link",
      "Precision quickMOUNT pro bracket allows exact azimuth and elevation adjustments",
      "Capable of managing over 100 concurrent wireless subscriber connections",
      "RouterOS Level 4 license with bandwidth throttling and hotspot management"
    ],
    madeIn: "Latvia (European Union)"
  },
  {
    id: "reverse-poe-switch-8p",
    name: "Netily 8-Port Gigabit Reverse PoE Building Distribution Switch",
    price: 85,
    category: "Switches & PoE",
    brand: "Netily Pro",
    inStock: true,
    warranty: "2-Year Official Netily Warranty",
    specsSheet: {
      "Ports": "7x Reverse PoE-in Ports + 1x PoE-out Port (All Gigabit)",
      "PoE-in Voltage": "12V–48V DC from subscriber apartments",
      "PoE-out Voltage": "48V 30W output for upstream ONT / CPE radio",
      "VLAN Isolation": "Hardware DIP switch for Port-to-Port subscriber isolation",
      "Surge Protection": "6kV Lightning and ESD protection on all ports"
    },
    image: "/products/poe_switch.jpg",
    hoverImage: "/products/poe_switch.jpg",
    description: "7x Reverse PoE-in ports (12V-48V) + 1x PoE-out port, designed for multi-tenant building ISP deployment.",
    longDescription:
      "Solve the landlord electricity problem in multi-tenant residential buildings and apartment blocks. The Netily Reverse PoE Switch draws power backwards through customer LAN cables (Ports 1–7) using standard PoE injectors inside their homes. It combines power from active tenants to run itself and supplies 48V PoE power to the rooftop wireless CPE dish or fiber ONT. Features hardware VLAN isolation to stop tenant crosstalk.",
    materials: [
      "8-Port Reverse PoE Switch Unit in steel chassis",
      "Wall mount brackets and screw kit",
      "Grounding wire lead"
    ],
    care: [
      "Operates as long as at least 1 subscriber has their home PoE injector plugged in",
      "Built-in diode protection prevents backfeeding voltage into neighbor apartments"
    ],
    sizes: [
      { size: "8-Port Gigabit Reverse PoE", available: true },
      { size: "Bundle with 5x 24V Subscriber Injectors", available: true }
    ],
    colors: [
      { name: "Industrial Dark Gray", hex: "#374151", available: true }
    ],
    details: [
      "7x Gigabit Reverse PoE-in ports automatically drawing power from tenant apartments",
      "1x Gigabit PoE-out port delivers up to 48V 30W to power the rooftop dish or fiber ONT",
      "No reliance on building staircase power or landlord electrical meters",
      "Hardware VLAN DIP switch ensures total data security between apartment tenants",
      "6kV lightning surge protection protects expensive connected radios from voltage spikes",
      "Industrial compact metal casing with ventilation cooling"
    ],
    madeIn: "Taiwan"
  },

  // ── PREMIUM ELECTRONICS & WORKSTATIONS (SECONDARY) ────────────────────────
  {
    id: "macbook-pro-16",
    name: "MacBook Pro 16\" (M3 Max / M2 Max)",
    price: 2499,
    category: "Laptops",
    brand: "Apple",
    inStock: true,
    warranty: "1-Year Apple Warranty + Netily Tech Shield",
    specsSheet: {
      "Display": "16.2-inch Liquid Retina XDR (3456x2234), 120Hz ProMotion",
      "Processor": "Apple M-Series Pro/Max Chip with up to 16-Core CPU",
      "Memory": "Up to 64GB Unified Memory",
      "Storage": "512GB to 2TB Ultra-Fast SSD",
      "Ports": "3x Thunderbolt 4 (USB-C), HDMI, SDXC, MagSafe 3",
      "Battery Life": "Up to 22 Hours Continuous Video Playback"
    },
    image: "/macbook_pro.png",
    hoverImage: "/macbook_pro.png",
    description: "M-Series Silicon. Liquid Retina XDR. Engineered for network architects and creative pros.",
    longDescription:
      "The 16-inch MacBook Pro delivers a new class of computing performance for network architects, software engineers, and IT specialists. With a Liquid Retina XDR display capable of 1,600 nits peak brightness, up to 22 hours of battery life, and high-speed Thunderbolt 4 ports, it powers the most intensive networking simulations, compiling, and data analysis effortlessly.",
    materials: ["100% recycled aluminum enclosure", "MagSafe 3 woven charging cable"],
    care: ["Clean screen with microfiber cloth", "Keep away from high humidity"],
    sizes: [
      { size: "512GB / 18GB RAM", available: true },
      { size: "1TB / 36GB RAM", available: true },
      { size: "2TB / 64GB RAM", available: true },
    ],
    colors: [
      { name: "Space Black", hex: "#1C1C1E", available: true },
      { name: "Silver", hex: "#E3E4E5", available: true },
    ],
    details: [
      "16.2-inch Liquid Retina XDR display with 1,000 nits sustained, 1,600 nits peak",
      "Apple Silicon Pro/Max chip with extreme energy efficiency",
      "Up to 22 hours battery life — the longest ever in a Mac",
      "Three Thunderbolt 4 ports, HDMI port, SDXC card slot, and MagSafe 3 charging",
    ],
    madeIn: "Designed by Apple in California",
  },
  {
    id: "macbook-air-m2",
    name: "MacBook Air 13\" (M2 Chip)",
    price: 1199,
    category: "Laptops",
    brand: "Apple",
    inStock: true,
    warranty: "1-Year Apple Warranty",
    specsSheet: {
      "Display": "13.6-inch Liquid Retina Display with True Tone",
      "Processor": "Apple M2 8-Core CPU with up to 10-Core GPU",
      "Memory": "Up to 24GB Unified Memory",
      "Storage": "256GB to 1TB SSD",
      "Weight": "1.24 kg (2.7 lbs) Ultra-Portable",
      "Cooling": "Fanless Silent Design"
    },
    image: "/macbook_air.png",
    hoverImage: "/macbook_air.png",
    description: "Supercharged by M2. Strikingly thin design. 18-hour battery for on-the-go engineering.",
    longDescription:
      "Redesigned around the next-generation M2 chip, MacBook Air is strikingly thin and brings exceptional speed and power efficiency within its durable all-aluminum enclosure. 18 hours of battery life, completely silent fanless design, and a stunning 13.6-inch Liquid Retina display.",
    materials: ["100% recycled aluminum enclosure"],
    care: ["Keep away from liquids", "Clean screen with microfiber cloth"],
    sizes: [
      { size: "256GB / 8GB RAM", available: true },
      { size: "512GB / 16GB RAM", available: true },
      { size: "1TB / 24GB RAM", available: true },
    ],
    colors: [
      { name: "Midnight", hex: "#2E3642", available: true },
      { name: "Starlight", hex: "#F3EFE9", available: true },
      { name: "Space Gray", hex: "#7D7E80", available: true },
      { name: "Silver", hex: "#E3E4E5", available: true },
    ],
    details: [
      "13.6-inch Liquid Retina display with 500 nits brightness",
      "Apple M2 chip: 8-core CPU, up to 10-core GPU, 16-core Neural Engine",
      "Up to 18 hours battery life",
      "1080p FaceTime HD camera with triple microphone array",
    ],
    madeIn: "Designed by Apple in California",
  },
  {
    id: "studio-monitor-4k",
    name: "Studio 4K Ultra-Wide Monitor 32\"",
    price: 899,
    category: "Monitors",
    brand: "Netily Studio",
    inStock: true,
    warranty: "3-Year Commercial Warranty",
    specsSheet: {
      "Panel Size": "32-inch IPS Anti-Glare (3840x2160 4K UHD)",
      "Color Gamut": "99% DCI-P3, 100% sRGB, 10-bit Color Depth",
      "Connectivity": "USB-C with 90W Power Delivery, 2x HDMI 2.1, DisplayPort 1.4",
      "Stand": "Ergonomic Height, Tilt, Swivel, and 90° Pivot",
      "Audio": "Integrated Dual 5W High-Fidelity Stereo Speakers"
    },
    image: "/monitor.png",
    hoverImage: "/monitor.png",
    description: "Breathtaking 4K clarity, 99% DCI-P3, 90W USB-C single cable docking for workstations.",
    longDescription:
      "Experience breathtaking clarity with our 32-inch 4K Ultra-Wide Monitor. Featuring a minimalist thin-bezel design, 99% DCI-P3 color gamut, and single-cable USB-C connectivity with 90W Power Delivery to charge your laptop while driving pristine 4K video and peripherals.",
    materials: ["Brushed aluminum stand", "Anti-glare IPS glass"],
    care: ["Wipe with microfiber cloth", "Avoid harsh cleaning chemicals"],
    sizes: [
      { size: "32-inch 4K UHD", available: true },
      { size: "38-inch UltraWide Curved", available: false },
    ],
    colors: [
      { name: "Graphite", hex: "#4C4A46", available: true },
      { name: "Silver", hex: "#E3E4E5", available: true },
    ],
    details: [
      "32-inch IPS Panel, 4K UHD (3840×2160) at 60Hz",
      "99% DCI-P3, 10-bit color depth with Delta E < 2 factory calibration",
      "USB-C with 90W Power Delivery and integrated 4-port USB hub",
      "Ergonomic stand with height, tilt, swivel, and vertical pivot adjustments",
    ],
    madeIn: "Taiwan",
  },
  {
    id: "iphone-17-pro-max",
    name: "iPhone 17 Pro Max",
    price: 1299,
    category: "Phones",
    brand: "Apple",
    inStock: true,
    warranty: "1-Year Apple Warranty",
    specsSheet: {
      "Display": "6.9-inch Super Retina XDR OLED, 120Hz ProMotion",
      "Chip": "A19 Pro Bionic Chip with 6-Core GPU",
      "Camera": "48MP Pro Fusion Triple-Lens with 5x Periscope Telephoto",
      "Chassis": "Grade-5 Titanium with Ceramic Shield",
      "Battery": "Up to 33 Hours Video Playback"
    },
    image: "/iphone_17_pro.png",
    hoverImage: "/iphone_17_pro.png",
    description: "The most powerful iPhone ever. A19 Pro chip. 48MP Pro Fusion camera.",
    longDescription:
      "iPhone 17 Pro Max redefines what a smartphone can do. With the A19 Pro chip, a stunning 6.9-inch Super Retina XDR display, and a breakthrough 48MP Pro Fusion triple-camera system with 4K 120fps Cinematic video, this is the ultimate flagship mobile experience.",
    materials: ["Grade-5 titanium frame", "Ceramic Shield front", "Matte textured glass back"],
    care: ["IP68 dust/water resistant", "Clean with microfiber cloth only"],
    sizes: [
      { size: "256GB", available: true },
      { size: "512GB", available: true },
      { size: "1TB", available: true },
    ],
    colors: [
      { name: "Black Titanium", hex: "#2C2C2E", available: true },
      { name: "Natural Titanium", hex: "#8C7F70", available: true },
      { name: "White Titanium", hex: "#F0EBE3", available: true },
      { name: "Cosmic Orange", hex: "#D4540A", available: true },
    ],
    details: [
      "6.9-inch Super Retina XDR ProMotion display (1–120Hz)",
      "A19 Pro chip — the fastest chip ever in a smartphone",
      "48MP Pro Fusion triple-camera system with optical stabilization",
      "4K Cinematic video recording at 120fps",
    ],
    madeIn: "Designed by Apple in California",
  },
  {
    id: "iphone-16-pro",
    name: "iPhone 16 Pro",
    price: 999,
    category: "Phones",
    brand: "Apple",
    inStock: true,
    warranty: "1-Year Apple Warranty",
    specsSheet: {
      "Display": "6.3-inch Super Retina XDR OLED with Always-On",
      "Chip": "A18 Pro Chip with Apple Intelligence",
      "Camera": "48MP Fusion Triple-Camera with 5x Telephoto",
      "Material": "Aerospace Grade Titanium"
    },
    image: "/iphone_16_pro.png",
    hoverImage: "/iphone_16_pro.png",
    description: "A18 Pro chip. Apple Intelligence. 4K 120fps video.",
    longDescription:
      "iPhone 16 Pro features Apple Intelligence for the first time — a deeply personal intelligence system powered by the A18 Pro chip. With a larger 6.3-inch display, a more capable triple-camera system, and 4K 120fps Cinematic video.",
    materials: ["Grade-5 titanium frame", "Ceramic Shield front", "Textured matte glass back"],
    care: ["IP68 dust/water resistant", "Clean with microfiber cloth"],
    sizes: [
      { size: "128GB", available: true },
      { size: "256GB", available: true },
      { size: "512GB", available: true },
      { size: "1TB", available: true },
    ],
    colors: [
      { name: "Black Titanium", hex: "#2C2C2E", available: true },
      { name: "Natural Titanium", hex: "#8C7F70", available: true },
      { name: "Desert Titanium", hex: "#B8A080", available: true },
    ],
    details: [
      "6.3-inch Super Retina XDR ProMotion display (1–120Hz)",
      "A18 Pro chip with Apple Intelligence architecture",
      "48MP Fusion triple-camera system with 5x Telephoto zoom",
      "Camera Control button for instant focus and capture",
    ],
    madeIn: "Designed by Apple in California",
  },
  {
    id: "samsung-s23-ultra",
    name: "Samsung Galaxy S23 Ultra 5G",
    price: 1199,
    category: "Phones",
    brand: "Samsung",
    inStock: true,
    warranty: "2-Year Samsung Regional Warranty",
    specsSheet: {
      "Display": "6.8-inch Dynamic AMOLED 2X, 120Hz, 1750 nits",
      "Processor": "Snapdragon 8 Gen 2 for Galaxy",
      "Camera": "200MP Wide + 10x Periscope Optical Zoom",
      "Stylus": "Integrated S Pen with Bluetooth Remote Actions"
    },
    image: "/samsung_s23.png",
    hoverImage: "/samsung_s23.png",
    description: "200MP camera. Built-in S Pen. Epic performance for power users.",
    longDescription:
      "Galaxy S23 Ultra combines a 200MP wide-angle camera, the blazing Snapdragon 8 Gen 2 Mobile Platform, and a built-in S Pen for the ultimate premium Android experience. Capture brilliant astrophotography, sign enterprise documents, and multitask with zero lag.",
    materials: ["Armor Aluminum frame", "Gorilla Glass Victus 2"],
    care: ["IP68 dust/water resistant", "Avoid extreme temperatures"],
    sizes: [
      { size: "256GB / 8GB RAM", available: true },
      { size: "512GB / 12GB RAM", available: true },
      { size: "1TB / 12GB RAM", available: true },
    ],
    colors: [
      { name: "Phantom Black", hex: "#1E1E1E", available: true },
      { name: "Cream", hex: "#F3EFE9", available: true },
      { name: "Green", hex: "#4B5A4B", available: true },
    ],
    details: [
      "6.8-inch Dynamic AMOLED 2X, 120Hz adaptive refresh rate",
      "200MP wide-angle sensor with 100x Space Zoom",
      "Snapdragon 8 Gen 2 processor optimized for Galaxy",
      "Built-in S Pen with air gestures and precision handwriting",
    ],
    madeIn: "South Korea",
  },
  {
    id: "sony-wh1000xm5",
    name: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
    price: 349,
    category: "Accessories",
    brand: "Sony",
    inStock: true,
    warranty: "1-Year Sony Official Warranty",
    specsSheet: {
      "Noise Canceling": "Dual Processors & 8 Microphones Auto NC Optimizer",
      "Battery Life": "Up to 30 Hours (3-min charge for 3 hours playback)",
      "Audio Codec": "LDAC, Hi-Res Audio Wireless, DSEE Extreme",
      "Microphones": "4 Beamforming mics with AI noise reduction"
    },
    image: "/sony_headphones.png",
    hoverImage: "/sony_headphones.png",
    description: "Industry-leading noise canceling. Exceptional sound quality for focused work.",
    longDescription:
      "The WH-1000XM5 headphones feature eight microphones and two processors for industry-leading noise cancellation that shuts out data center fan noise and office distractions. With 30 hours of battery life, Multipoint Connection, and crystal-clear voice calling.",
    materials: ["Soft fit synthetic leather ear cushions", "Lightweight carbon-reinforced headband"],
    care: ["Store in included travel case", "Wipe cushions with soft dry cloth"],
    sizes: [
      { size: "Universal Over-Ear Fit", available: true },
    ],
    colors: [
      { name: "Black", hex: "#1E1E1E", available: true },
      { name: "Silver", hex: "#D1D1D6", available: true },
    ],
    details: [
      "Industry-leading active noise cancellation with 8 microphones",
      "30-hour battery life with 3-minute quick charge giving 3 hours playback",
      "Multipoint Connection seamlessly switches between laptop and phone",
      "Speak-to-Chat automatically pauses audio when you begin speaking",
    ],
    madeIn: "Japan",
  },
  {
    id: "airpods-pro-2",
    name: "Apple AirPods Pro (2nd Gen with USB-C)",
    price: 249,
    category: "Accessories",
    brand: "Apple",
    inStock: true,
    warranty: "1-Year Apple Warranty",
    specsSheet: {
      "Chip": "Apple H2 Headphone Chip",
      "Audio": "Adaptive Audio, Active Noise Cancellation, Transparency Mode",
      "Charging": "MagSafe Case with USB-C and Built-in Speaker for Find My",
      "Battery": "Up to 30 Hours total listening time"
    },
    image: "/airpods_pro.png",
    hoverImage: "/airpods_pro.png",
    description: "Up to 2x more Active Noise Cancellation. USB-C MagSafe Case. Lossless audio.",
    longDescription:
      "AirPods Pro 2nd generation deliver up to 2x more Active Noise Cancellation than the previous generation, Adaptive Transparency, Personalized Spatial Audio, and up to 30 hours of total listening time with the USB-C MagSafe Charging Case.",
    materials: ["Apple H2 chip", "IP54 dust, sweat, and water resistant"],
    care: ["Clean with dry lint-free cloth", "Avoid moisture entering openings"],
    sizes: [
      { size: "One Size (4 Eartip Sizes XS/S/M/L)", available: true },
    ],
    colors: [
      { name: "Gloss White", hex: "#F8F8F8", available: true },
    ],
    details: [
      "Up to 2x more Active Noise Cancellation with Apple H2 chip",
      "Adaptive Audio dynamically blends Transparency and Active Noise Cancellation",
      "Personalized Spatial Audio with dynamic head tracking",
      "USB-C MagSafe case with Precision Finding speaker and lanyard loop",
    ],
    madeIn: "Designed by Apple in California",
  },
  {
    id: "ipad-pro-129",
    name: "Apple iPad Pro 12.9\" (M2 Chip)",
    price: 1099,
    category: "Accessories",
    brand: "Apple",
    inStock: true,
    warranty: "1-Year Apple Warranty",
    specsSheet: {
      "Display": "12.9-inch Liquid Retina XDR with 2,500 Mini-LED Local Dimming Zones",
      "Chip": "Apple M2 8-Core CPU with 10-Core GPU",
      "Pencil": "Apple Pencil (2nd Gen) with Hover Detection",
      "Port": "Thunderbolt / USB 4 Port with 40Gbps Data Transfer"
    },
    image: "/ipad_pro.png",
    hoverImage: "/ipad_pro.png",
    description: "M2 chip. Liquid Retina XDR Mini-LED. The ultimate tablet for network diagrams & work.",
    longDescription:
      "iPad Pro 12.9-inch with M2 chip delivers breakthrough performance for network topology mapping, CAD diagrams, and on-site engineering diagnostics. The Liquid Retina XDR display provides incredible dynamic range with 1,000,000:1 contrast ratio.",
    materials: ["Precision machined aluminum enclosure", "Scratch-resistant front glass"],
    care: ["Clean with damp soft microfiber cloth", "Do not use solvent cleaners"],
    sizes: [
      { size: "128GB Wi-Fi", available: true },
      { size: "256GB Wi-Fi + 5G Cellular", available: true },
      { size: "512GB Wi-Fi + 5G Cellular", available: true },
    ],
    colors: [
      { name: "Space Gray", hex: "#7D7E80", available: true },
      { name: "Silver", hex: "#E3E4E5", available: true },
    ],
    details: [
      "12.9-inch Liquid Retina XDR display with Mini-LED backlighting",
      "Apple M2 chip for unprecedented mobile workstation power",
      "Apple Pencil hover feature for precise CAD and network topology drawing",
      "Thunderbolt / USB 4 port for connecting high-speed 10G dongles and displays",
    ],
    madeIn: "Designed by Apple in California",
  },
]

export const categories = [
  "All",
  "Routers & Gateways",
  "Switches & PoE",
  "Fiber Optics & OLT",
  "Cabling & Infrastructure",
  "Wireless & Backhaul",
  "Racks & Power",
  "Laptops",
  "Phones",
  "Monitors",
  "Accessories"
]

export const PRODUCTS_STORAGE_KEY = "netily_shop_products_catalog"

export function getStoredProducts(): Product[] {
  if (typeof window === "undefined") {
    return products
  }
  try {
    const raw = window.localStorage.getItem(PRODUCTS_STORAGE_KEY)
    if (!raw) {
      return products
    }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
    return products
  } catch {
    return products
  }
}

export function saveStoredProducts(list: Product[]): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent("netily_products_updated", { detail: list }))
  } catch (error) {
    console.error("Failed to save products to localStorage", error)
  }
}

export function addProduct(newProduct: Partial<Product> & { name: string; price: number; category: string }): Product {
  const current = getStoredProducts()
  const baseSlug = newProduct.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
  const uniqueId = newProduct.id || `${baseSlug || "item"}-${Date.now().toString(36)}`

  const defaultImg = "/products/mikrotik_router.jpg"
  const chosenImg = newProduct.image?.trim() || defaultImg
  const chosenHoverImg = newProduct.hoverImage?.trim() || chosenImg

  const created: Product = {
    id: uniqueId,
    name: newProduct.name.trim(),
    price: Number(newProduct.price) || 0,
    category: newProduct.category || "Routers & Gateways",
    brand: newProduct.brand?.trim() || "Netily Pro",
    inStock: newProduct.inStock ?? true,
    warranty: newProduct.warranty?.trim() || "1-Year Official Netily Warranty",
    specsSheet: newProduct.specsSheet && Object.keys(newProduct.specsSheet).length > 0
      ? newProduct.specsSheet
      : {
          "Condition": "Brand New Factory Sealed",
          "Warranty": newProduct.warranty?.trim() || "1-Year Official Netily Warranty",
          "Category": newProduct.category || "Hardware",
          "Verification": "Netily QC Passed",
        },
    image: chosenImg,
    hoverImage: chosenHoverImg,
    description:
      newProduct.description?.trim() ||
      `${newProduct.name} - Genuine hardware with full manufacturer warranty and Netily technical support.`,
    longDescription:
      newProduct.longDescription?.trim() ||
      newProduct.description?.trim() ||
      `${newProduct.name} is built for high reliability and professional performance. Fully tested and verified by Netily engineers before dispatch.`,
    materials: newProduct.materials?.length
      ? newProduct.materials
      : ["Original Factory Packaging", "Accessories & Installation Guide", "Quality Assurance Seal"],
    care: newProduct.care?.length
      ? newProduct.care
      : ["Operate within standard temperature limits", "Store in clean, dry environment", "Use surge protected power supplies"],
    sizes: newProduct.sizes?.length ? newProduct.sizes : [{ size: "Standard Unit", available: true }],
    colors: newProduct.colors?.length ? newProduct.colors : [{ name: "Standard Finish", hex: "#1C1C1E", available: true }],
    details: newProduct.details?.length
      ? newProduct.details
      : [
          `Authentic ${newProduct.name}`,
          "Passed Netily multi-point diagnostic inspection",
          "Express regional freight & transit insurance included",
          "Technical documentation and support access included",
        ],
    madeIn: newProduct.madeIn?.trim() || "Netily Verified Equipment",
  }

  const updated = [created, ...current.filter((p) => p.id !== created.id)]
  saveStoredProducts(updated)
  return created
}

export function removeProduct(id: string): boolean {
  const current = getStoredProducts()
  const updated = current.filter((p) => p.id !== id)
  saveStoredProducts(updated)
  return true
}

export function resetProductsToDefault(): Product[] {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(PRODUCTS_STORAGE_KEY)
      window.dispatchEvent(new CustomEvent("netily_products_updated", { detail: products }))
    } catch (e) {
      console.error("Failed to reset products", e)
    }
  }
  return products
}

export function getProductById(id: string): Product | undefined {
  const current = getStoredProducts()
  const found = current.find((p) => p.id === id)
  if (found) return found
  return products.find((p) => p.id === id)
}

export function getProductsByCategory(category: string): Product[] {
  const current = getStoredProducts()
  if (category === "All") return current
  return current.filter((p) => p.category === category)
}

export function getRelatedProducts(currentId: string, limit = 4): Product[] {
  const current = getProductById(currentId)
  const all = getStoredProducts()
  if (!current) return all.slice(0, limit)

  const sameCategory = all.filter((p) => p.id !== currentId && p.category === current.category)
  const others = all.filter((p) => p.id !== currentId && p.category !== current.category)

  return [...sameCategory, ...others].slice(0, limit)
}

