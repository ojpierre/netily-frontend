"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import {
  BookOpen,
  ShoppingBag,
  Users,
  Star,
  Settings,
  Save,
  Search,
  Plus,
  ExternalLink
} from "lucide-react"
import { academyCourses, type AcademyCourse } from "@/lib/academy-data"
import {
  readPreviewOrders,
  type AcademyPreviewOrder
} from "@/lib/academy-preview"
import { academyReviewFixtures } from "@/lib/academy-review-fixtures"

const DRAFTS = "internetily-academy-management-drafts"
const sections = [
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "learners", label: "Learners", icon: Users },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "settings", label: "Settings", icon: Settings }
] as const
type Tab = (typeof sections)[number]["id"]
const input =
  "w-full min-h-12 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
export default function Page() {
  const [tab, setTab] = useState<Tab>("courses")
  const [courses, setCourses] = useState<AcademyCourse[]>(academyCourses)
  const [orders, setOrders] = useState<AcademyPreviewOrder[]>([])
  const [selected, setSelected] = useState<AcademyCourse | null>(null)
  const [query, setQuery] = useState("")
  const [notice, setNotice] = useState("")
  const [reviewCourse, setReviewCourse] = useState(academyCourses[0].slug)
  const [support, setSupport] = useState("netilysupport@gmail.com")
  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFTS) || "null")
      if (
        Array.isArray(draft) &&
        draft.every(
          (item) =>
            typeof item?.slug === "string" &&
            typeof item?.title === "string" &&
            Array.isArray(item?.lessons)
        )
      )
        setCourses(draft)
      setSupport(
        localStorage.getItem("academy-preview-support") ||
          "netilysupport@gmail.com"
      )
    } catch {
      setNotice(
        "Saved drafts could not be loaded. The course catalog is still available."
      )
    }
    const update = () => setOrders(readPreviewOrders())
    update()
    window.addEventListener("storage", update)
    window.addEventListener("focus", update)
    return () => {
      window.removeEventListener("storage", update)
      window.removeEventListener("focus", update)
    }
  }, [])
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    const data = new FormData(event.currentTarget)
    const slug = String(data.get("slug")).trim()
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setNotice(
        "Use lowercase words separated by hyphens for the course address."
      )
      return
    }
    if (
      courses.some(
        (course) => course.slug === slug && course.slug !== selected.slug
      )
    ) {
      setNotice("That course address is already in use.")
      return
    }
    const next = {
      ...selected,
      slug,
      title: String(data.get("title")).trim(),
      summary: String(data.get("summary")).trim(),
      outcome: String(data.get("outcome")).trim(),
      image: String(data.get("image")),
      imageAlt: String(data.get("imageAlt")).trim(),
      level:
        data.get("level") === "Intermediate"
          ? ("Intermediate" as const)
          : ("Beginner" as const),
      category: String(data.get("category")).trim(),
      price: "KES " + Number(data.get("price")).toLocaleString("en-KE"),
      duration: String(data.get("minutes")) + " min",
      lessons: String(data.get("lessons"))
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
    }
    if (!next.lessons.length) {
      setNotice("Add at least one lesson.")
      return
    }
    const list = courses.some((course) => course.slug === selected.slug)
      ? courses.map((course) => (course.slug === selected.slug ? next : course))
      : [...courses, next]
    try {
      localStorage.setItem(DRAFTS, JSON.stringify(list))
      setCourses(list)
      setSelected(null)
      setNotice(
        "Course draft saved. Public pages are unchanged until publishing is connected."
      )
    } catch {
      setNotice("Could not save this draft. Please try again.")
    }
  }
  const learnerEmails = [...new Set(orders.map((order) => order.email))]
  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Academy management</h1>
          <p className="mt-2 text-sm text-slate-400">
            Courses, learners, orders, and feedback.
          </p>
        </div>
        <Link
          className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-slate-700 px-4 text-sm"
          href="/academy"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink size={16} />
          View academy
        </Link>
      </div>
      <p className="rounded-lg border border-amber-800 bg-amber-950/30 p-4 text-sm text-amber-200">
        Frontend workspace. Drafts and preview orders stay on this browser. No
        live payments or account changes are made here.
      </p>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          [courses.length, "Course drafts"],
          [learnerEmails.length, "Preview learners"],
          [orders.length, "Preview orders"],
          [
            orders.filter((order) => order.status === "pending").length,
            "Awaiting confirmation"
          ]
        ].map(([value, label]) => (
          <div
            key={label}
            className="rounded-lg border border-slate-800 bg-slate-900 p-4"
          >
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[210px_minmax(0,1fr)]">
        <nav
          aria-label="Academy management"
          className="grid gap-2 lg:sticky lg:top-6"
        >
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                setTab(section.id)
                setNotice("")
                setSelected(null)
              }}
              aria-current={tab === section.id ? "page" : undefined}
              className={
                "flex min-h-12 items-center gap-3 rounded-lg px-4 text-left " +
                (tab === section.id
                  ? "bg-violet-600 text-white"
                  : "bg-slate-900 text-slate-300")
              }
            >
              <section.icon size={18} />
              {section.label}
            </button>
          ))}
        </nav>
        <section className="min-w-0">
          {tab === "courses" && (
            <>
              <div className="flex flex-wrap gap-3 mb-6">
                <label className="flex flex-1 items-center gap-2 min-w-48">
                  <Search size={18} />
                  <input
                    className={input}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Find a course"
                    aria-label="Find a course"
                  />
                </label>
                <button
                  className="flex min-h-12 items-center gap-2 rounded-lg bg-violet-600 px-4"
                  onClick={() => {
                    setSelected({
                      ...academyCourses[0],
                      slug: "new-course",
                      title: "",
                      summary: "",
                      lessons: [],
                      status: "New"
                    })
                    setNotice("")
                  }}
                >
                  <Plus size={18} />
                  Add course
                </button>
              </div>
              {selected ? (
                <form
                  className="grid gap-4"
                  onSubmit={save}
                  key={selected.slug}
                >
                  <h2 className="text-xl font-semibold">Course draft</h2>
                  {[
                    ["title", "Course title", selected.title, "text"],
                    ["slug", "Course address", selected.slug, "text"],
                    ["category", "Category", selected.category, "text"],
                    [
                      "price",
                      "Price (KES)",
                      selected.price.replace(/[^0-9.]/g, ""),
                      "number"
                    ],
                    [
                      "minutes",
                      "Duration (minutes)",
                      parseInt(selected.duration),
                      "number"
                    ]
                  ].map(([name, label, value, type]) => (
                    <label className="grid gap-2 text-sm" key={name}>
                      {label}
                      <input
                        className={input}
                        name={String(name)}
                        defaultValue={value}
                        type={String(type)}
                        required
                        min={name === "minutes" ? 1 : 0}
                        max={type === "number" ? 1000000 : undefined}
                        maxLength={150}
                        step={name === "price" ? ".01" : "1"}
                      />
                    </label>
                  ))}
                  <label className="grid gap-2 text-sm">
                    Course visual
                    <select
                      className={input}
                      name="image"
                      defaultValue={selected.image}
                    >
                      {academyCourses.map((course) => (
                        <option key={course.slug} value={course.image}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm">
                    Image description
                    <input
                      className={input}
                      name="imageAlt"
                      defaultValue={selected.imageAlt}
                      required
                      maxLength={250}
                    />
                  </label>
                  <label className="grid gap-2 text-sm">
                    Level
                    <select
                      className={input}
                      name="level"
                      defaultValue={selected.level}
                    >
                      <option>Beginner</option>
                      <option>Intermediate</option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm">
                    Learning outcome
                    <textarea
                      className={input}
                      name="outcome"
                      defaultValue={selected.outcome}
                      required
                      maxLength={2000}
                      rows={3}
                    />
                  </label>
                  <label className="grid gap-2 text-sm">
                    Summary
                    <textarea
                      className={input}
                      name="summary"
                      defaultValue={selected.summary}
                      required
                      maxLength={2000}
                      rows={4}
                    />
                  </label>
                  <label className="grid gap-2 text-sm">
                    Lessons (one per line)
                    <textarea
                      className={input}
                      name="lessons"
                      defaultValue={selected.lessons.join("\n")}
                      rows={5}
                      required
                      maxLength={10000}
                    />
                  </label>
                  <div className="flex gap-3">
                    <button
                      className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-violet-600 px-4"
                      type="submit"
                    >
                      <Save size={16} />
                      Save draft
                    </button>
                    <button
                      type="button"
                      className="min-h-12 px-4"
                      onClick={() => setSelected(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="divide-y divide-slate-800">
                  {courses
                    .filter((course) =>
                      (course.title + " " + course.category)
                        .toLowerCase()
                        .includes(query.toLowerCase())
                    )
                    .map((course) => (
                      <div
                        key={course.slug}
                        className="flex flex-wrap justify-between items-center gap-4 py-5"
                      >
                        <div className="min-w-0">
                          <h2 className="font-semibold">{course.title}</h2>
                          <p className="text-sm text-slate-400 mt-2">
                            {course.category} / {course.duration} /{" "}
                            {course.price}
                          </p>
                        </div>
                        <button
                          className="min-h-12 rounded-lg border border-slate-700 px-4 text-sm"
                          onClick={() => setSelected(course)}
                        >
                          Manage course
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
          {tab === "orders" && (
            <>
              <h2 className="text-xl font-semibold mb-5">Orders</h2>
              {orders.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr>
                        {["Order", "Learner", "Total", "Status", "Date"].map(
                          (title) => (
                            <th key={title} className="p-3 text-slate-400">
                              {title}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-t border-slate-800"
                        >
                          <td className="p-3 max-w-40 break-all">{order.id}</td>
                          <td className="p-3">{order.email}</td>
                          <td className="p-3 whitespace-nowrap">
                            KES {order.total.toLocaleString()}
                          </td>
                          <td className="p-3">{order.status}</td>
                          <td className="p-3 whitespace-nowrap">
                            {new Date(order.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-400">No orders yet.</p>
              )}
            </>
          )}
          {tab === "learners" && (
            <>
              <h2 className="text-xl font-semibold mb-5">Learners</h2>
              {learnerEmails.length ? (
                learnerEmails.map((email) => (
                  <p
                    key={email}
                    className="py-4 border-b border-slate-800 break-all"
                  >
                    {email}
                  </p>
                ))
              ) : (
                <p className="text-slate-400">
                  Learners appear here after placing an order.
                </p>
              )}
            </>
          )}
          {tab === "reviews" && (
            <>
              <h2 className="text-xl font-semibold mb-3">
                Review layout preview
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                Five sample reviews per course for private layout checks. They
                are not published or included in search ratings.
              </p>
              <select
                aria-label="Review course"
                className={input}
                value={reviewCourse}
                onChange={(event) => setReviewCourse(event.target.value)}
              >
                {courses.map((course) => (
                  <option key={course.slug} value={course.slug}>
                    {course.title}
                  </option>
                ))}
              </select>
              <div className="divide-y divide-slate-800 mt-5">
                {academyReviewFixtures.map((review) => (
                  <article key={review.name} className="py-5">
                    <div className="flex justify-between gap-3">
                      <h3 className="font-semibold">{review.name}</h3>
                      <span
                        className="flex gap-1 text-amber-300"
                        aria-label={review.rating + " out of 5"}
                      >
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star
                            key={index}
                            size={15}
                            aria-hidden="true"
                            className={
                              index < review.rating ? "fill-current" : ""
                            }
                          />
                        ))}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{review.text}</p>
                  </article>
                ))}
              </div>
            </>
          )}
          {tab === "settings" && (
            <form
              className="grid gap-5 max-w-lg"
              onSubmit={(event) => {
                event.preventDefault()
                try {
                  localStorage.setItem("academy-preview-support", support)
                  setNotice("Support contact draft saved.")
                } catch {
                  setNotice("Could not save settings.")
                }
              }}
            >
              <h2 className="text-xl font-semibold">Academy settings</h2>
              <label className="grid gap-2 text-sm">
                Support email
                <input
                  type="email"
                  className={input}
                  required
                  value={support}
                  onChange={(event) => setSupport(event.target.value)}
                />
              </label>
              <p className="text-sm text-slate-400">
                Currency: KES / Payment method: M-Pesa / Access: confirmed
                orders only
              </p>
              <button className="min-h-12 rounded-lg bg-violet-600 px-4">
                Save settings draft
              </button>
            </form>
          )}
          {notice && (
            <p
              role="status"
              className="mt-5 rounded-lg border border-slate-700 p-4 text-sm"
            >
              {notice}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
