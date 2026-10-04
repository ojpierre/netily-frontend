"use client"

import { useState } from "react"
import { ChevronDown, FileText } from "lucide-react"
import type { AcademyCourse } from "@/lib/academy-data"
import { getCourseLessons } from "@/lib/academy-curriculum"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog"

export function CourseCurriculum({ course }: { course: AcademyCourse }) {
  const lessons = getCourseLessons(course)
  const [open, setOpen] = useState<number[]>([0])
  const [preview, setPreview] = useState(false)
  const allOpen = open.length === lessons.length
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <p className="academy-muted">
          {lessons.length} sections / {lessons.length} lessons /{" "}
          {course.duration} total
        </p>
        <button
          type="button"
          className="academy-link min-h-12 px-2 font-medium"
          onClick={() =>
            setOpen(allOpen ? [] : lessons.map((_, index) => index))
          }
        >
          {allOpen ? "Collapse all sections" : "Expand all sections"}
        </button>
      </div>
      <div className="academy-curriculum">
        {lessons.map((lesson, index) => (
          <section key={lesson.title} className="academy-lesson">
            <h3>
              <button
                className="academy-lesson-toggle"
                type="button"
                aria-expanded={open.includes(index)}
                aria-controls={`lesson-${index}`}
                onClick={() =>
                  setOpen((items) =>
                    items.includes(index)
                      ? items.filter((item) => item !== index)
                      : [...items, index]
                  )
                }
              >
                <span className="flex items-center gap-3">
                  <ChevronDown
                    size={14}
                    className={open.includes(index) ? "rotate-180" : ""}
                  />
                  {lesson.title}
                </span>
                <span className="academy-muted shrink-0 text-xs">1 lesson</span>
              </button>
            </h3>
            <div id={`lesson-${index}`} hidden={!open.includes(index)}>
              <div className="academy-lesson-content">
                <div>
                  <p className="mb-2 flex items-center gap-2 font-medium">
                    <FileText size={14} />
                    {lesson.title}
                  </p>
                  <p className="academy-muted max-w-2xl">
                    {lesson.guide.split(". ")[0]}.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {index === 0 && (
                    <button
                      type="button"
                      className="academy-link min-h-12 px-2 font-medium"
                      onClick={() => setPreview(true)}
                    >
                      Preview
                    </button>
                  )}
                  <span className="academy-muted">{lesson.minutes} min</span>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent>
          <DialogTitle>{lessons[0].title}</DialogTitle>
          <DialogDescription>
            A short introduction from {course.title}.
          </DialogDescription>
          <p className="text-sm leading-7">{lessons[0].guide}</p>
        </DialogContent>
      </Dialog>
    </>
  )
}
