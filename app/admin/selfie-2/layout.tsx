import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tenant activation | Internetily",
  robots: { index: false, follow: false },
}

export default function SelfieTwoLayout({ children }: { children: React.ReactNode }) {
  return children
}
