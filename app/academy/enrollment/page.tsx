import type { Metadata } from "next"
import { AcademyFooter, AcademyHeader } from "../academy-components"
import { AcademyCartPage } from "../cart-content"

export const metadata: Metadata = {
  title: { absolute: "Course Enrollment | Internetily Academy" },
  robots: { index: false, follow: true }
}
export default async function EnrollmentPage({
  searchParams
}: {
  searchParams: Promise<{ course?: string }>
}) {
  const { course } = await searchParams
  return (
    <main className="academy-shell">
      <AcademyHeader />
      <AcademyCartPage selectedCourse={course} />
      <AcademyFooter />
    </main>
  )
}
