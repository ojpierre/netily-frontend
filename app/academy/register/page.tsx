import type { Metadata } from "next"
import { AcademyHeader, AcademyFooter } from "../academy-components"
import { AcademyAuthForm } from "../auth-form"
export const metadata: Metadata = {
  title: "Internetily Academy Registration",
  robots: { index: false, follow: false }
}
export default function Page() {
  return (
    <main className="academy-shell">
      <AcademyHeader />
      <AcademyAuthForm mode="register" />
      <AcademyFooter />
    </main>
  )
}
