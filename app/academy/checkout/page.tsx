import type { Metadata } from "next"
import { AcademyFooter, AcademyHeader } from "../academy-components"
import { AcademyCheckout } from "../checkout-content"

export const metadata: Metadata = {
  title: "Course Checkout | Internetily Academy",
  robots: { index: false, follow: true }
}
export default function CheckoutPage() {
  return (
    <main className="academy-shell">
      <AcademyHeader />
      <AcademyCheckout />
      <AcademyFooter />
    </main>
  )
}
