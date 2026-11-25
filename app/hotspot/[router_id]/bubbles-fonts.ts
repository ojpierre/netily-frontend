import { Figtree, Fraunces } from "next/font/google"

// Bubbles portal theme (template 18). Self-hosted by next/font, so the files are
// served from this site and load behind a captive portal's walled garden.
// preload: false keeps them off every other theme's critical path.
export const bubblesSans = Figtree({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  preload: false,
})

export const bubblesSerif = Fraunces({
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
  preload: false,
})
