import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getAcademyCourse } from "@/lib/academy-data"
import { AcademyHeader, AcademyFooter } from "../../academy-components"
import { LearnerWorkspace } from "../../account/learner-workspace"
export const metadata: Metadata = {
  title: "Course Workspace | Internetily Academy",
  robots: { index: false, follow: false }
}
export default async function Page({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!getAcademyCourse(slug)) notFound()
  return (
    <main className="academy-shell">
      <AcademyHeader />
      <div className="academy-container academy-content">
        <LearnerWorkspace slug={slug} />
      </div>
      <AcademyFooter />
    </main>
  )
}
