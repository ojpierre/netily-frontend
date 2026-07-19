import type { MetadataRoute } from "next"

// A deterministic metadata route always returns JSON. Host-dependent rendering
// can turn runtime failures into HTML responses, which browsers report as a
// manifest syntax error at line 1.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Internetily - ISP Management Platform",
    short_name: "Internetily",
    description:
      "Automate ISP billing, M-Pesa payments, MikroTik provisioning, and customer management. Built for Kenyan and East African ISPs.",
    start_url: "/admin",
    display: "standalone",
    orientation: "any",
    theme_color: "#1e3a5f",
    background_color: "#ffffff",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["business", "productivity", "utilities"],
    lang: "en",
    dir: "ltr",
    prefer_related_applications: false,
  }
}
