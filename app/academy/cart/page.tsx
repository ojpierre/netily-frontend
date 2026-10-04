import type { Metadata } from "next"
import { AcademyFooter, AcademyHeader } from "../academy-components"
import { AcademyCartPage } from "../cart-content"

export const metadata: Metadata = {
  title: "Your Course Cart | Internetily Academy",
  robots: { index: false, follow: true }
}
export default function CartPage() {
  return (
    <main className="academy-shell">
      <AcademyHeader />
      <AcademyCartPage />
      <AcademyFooter />
    </main>
  )
}
