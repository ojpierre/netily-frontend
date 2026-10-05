import type { Metadata } from "next"
import { AcademyHeader, AcademyFooter } from "../academy-components"
import { LearnerWorkspace } from "./learner-workspace"
export const metadata: Metadata = {
  title: "My Learning | Internetily Academy",
  robots: { index: false, follow: false }
}
export default function Page() {
  return (
    <main className="academy-shell">
      <AcademyHeader />
      <div className="academy-container academy-content">
        <LearnerWorkspace />
      </div>
      <AcademyFooter />
    </main>
  )
}
