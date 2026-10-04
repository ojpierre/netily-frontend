import type { Metadata } from "next"
import { AcademyFooter, AcademyHeader } from "../academy-components"
import { CourseCatalog } from "../course-catalog"

export const metadata: Metadata = {
  title: "Networking Courses for ISP Teams | Internetily Academy",
  description:
    "Explore practical networking, WISP backhaul, ISP billing and business courses. Find training for your level and learn at your own pace.",
  alternates: { canonical: "https://netily.co.ke/academy/courses" }
}

export default function AcademyCoursesPage() {
  return (
    <main className="academy-shell">
      <AcademyHeader />
      <div className="academy-container academy-content">
        <div className="academy-intro">
          <h1 className="academy-title">All networking courses</h1>
          <p>
            Learn how to build, manage, and grow an internet network. Our
            practical courses cover networking basics, backhaul planning,
            everyday ISP operations, and finding your first customers. Whether
            you are starting out or helping an existing team, choose a course
            that fits your next step and learn at your own pace.
          </p>
        </div>
        <CourseCatalog />
      </div>
      <AcademyFooter />
    </main>
  )
}
