"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { SlidersHorizontal, Search, Star } from "lucide-react"
import { academyCourses } from "@/lib/academy-data"
import { AddCourseButton, coursePrice } from "./academy-cart"

export function CourseCatalog() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [level, setLevel] = useState("")
  const [format, setFormat] = useState("")
  const [minimum, setMinimum] = useState("")
  const [maximum, setMaximum] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setCategory(params.get("category") || "")
    setLevel(params.get("level") || "")
  }, [])
  const results = academyCourses.filter((course) => {
    const query = search.trim().toLowerCase()
    return (
      (!query ||
        [
          course.title,
          course.summary,
          course.category,
          "Internetily Academy",
          ...course.lessons
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)) &&
      (!category || course.category === category) &&
      (!level || course.level === level) &&
      (!minimum || coursePrice(course) >= Number(minimum)) &&
      (!maximum || coursePrice(course) <= Number(maximum))
    )
  })
  const clear = () => {
    setSearch("")
    setCategory("")
    setLevel("")
    setFormat("")
    setMinimum("")
    setMaximum("")
  }
  const hasFilters = Boolean(
    search || category || level || format || minimum || maximum
  )
  const radioGroup = (
    title: string,
    name: string,
    options: string[],
    value: string,
    setValue: (value: string) => void
  ) => (
    <fieldset className="academy-filter-group">
      <legend>{title}</legend>
      {["", ...options].map((option) => (
        <label className="academy-radio" key={option}>
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={() => setValue(option)}
          />
          {option ||
            `All ${name === "category" ? "categories" : name === "level" ? "levels" : "formats"}`}
        </label>
      ))}
    </fieldset>
  )
  return (
    <>
      <button
        type="button"
        className="academy-button secondary academy-filter-mobile mb-4"
        aria-expanded={filtersOpen}
        aria-controls="course-filters"
        onClick={() => setFiltersOpen(!filtersOpen)}
      >
        <SlidersHorizontal size={17} />
        {filtersOpen ? "Hide filters" : "Search & filters"}
      </button>
      <div className="academy-catalog">
        <aside
          id="course-filters"
          className="academy-filters"
          data-open={filtersOpen}
          aria-label="Filter courses"
        >
          <label className="grid gap-3 text-sm font-medium">
            Search courses
            <span className="relative">
              <Search
                className="academy-muted absolute left-3 top-4"
                size={16}
              />
              <input
                className="academy-input pl-9!"
                type="search"
                placeholder="Title, topic or instructor"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </span>
          </label>
          {radioGroup(
            "Category",
            "category",
            [...new Set(academyCourses.map((course) => course.category))],
            category,
            setCategory
          )}
          {radioGroup(
            "Level",
            "level",
            ["Beginner", "Intermediate"],
            level,
            setLevel
          )}
          {radioGroup(
            "Course format",
            "format",
            ["Self-paced"],
            format,
            setFormat
          )}
          <fieldset className="academy-filter-group">
            <legend>Price range</legend>
            <label className="academy-muted grid gap-2 text-xs">
              Minimum price (KES)
              <input
                className="academy-input"
                type="number"
                min="0"
                placeholder="Any"
                value={minimum}
                onChange={(event) => setMinimum(event.target.value)}
              />
            </label>
            <label className="academy-muted grid gap-2 text-xs">
              Maximum price (KES)
              <input
                className="academy-input"
                type="number"
                min="0"
                placeholder="Any"
                value={maximum}
                onChange={(event) => setMaximum(event.target.value)}
              />
            </label>
          </fieldset>
          {hasFilters && (
            <button
              className="academy-button secondary"
              type="button"
              onClick={clear}
            >
              Clear filters
            </button>
          )}
        </aside>
        <div className="min-w-0">
          <p className="academy-muted mb-4 text-sm" role="status">
            {results.length} {results.length === 1 ? "result" : "results"}
          </p>
          {results.map((course) => (
            <article key={course.slug} className="academy-course-row">
              <Link
                href={`/academy/courses/${course.slug}`}
                className="academy-thumbnail"
              >
                <Image
                  src={course.image}
                  alt={course.imageAlt}
                  fill
                  sizes="(max-width: 700px) 112px, (max-width: 1100px) 160px, 208px"
                  className="object-cover"
                />
              </Link>
              <div className="min-w-0">
                <p className="academy-link text-xs">{course.category}</p>
                <h2>
                  <Link href={`/academy/courses/${course.slug}`}>
                    {course.title}
                  </Link>
                </h2>
                <p className="academy-course-summary">{course.summary}</p>
                <p className="academy-muted mt-2 text-xs">
                  Internetily Academy
                </p>
                <div className="academy-course-meta">
                  <span className="flex items-center gap-1">
                    <Star size={12} />
                    Not yet rated
                  </span>
                  <span>{course.duration}</span>
                  <span>{course.level}</span>
                  <span>Self-paced</span>
                </div>
              </div>
              <div className="academy-row-actions">
                <strong className="text-sm">{course.price}</strong>
                <AddCourseButton slug={course.slug} />
                <Link
                  href={`/academy/courses/${course.slug}`}
                  className="academy-button secondary"
                >
                  View details
                </Link>
              </div>
            </article>
          ))}
          {results.length === 0 && (
            <div
              className="border-y py-12"
              style={{ borderColor: "var(--academy-line)" }}
            >
              <h2 className="academy-heading">No courses match your search</h2>
              <p className="academy-muted mb-5">
                Try another topic or clear your filters to see all courses.
              </p>
              <button type="button" className="academy-button" onClick={clear}>
                See all courses
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
