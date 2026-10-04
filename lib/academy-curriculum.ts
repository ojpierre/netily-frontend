import type { AcademyCourse } from "./academy-data"

const lessonGuides: Record<string, string[]> = {
  "networking-fundamentals-for-isp-teams": [
    "An ISP buys or builds an upstream connection, carries it across a network, and delivers access to customers. Follow the path from the upstream link through your router and access equipment to a customer's device. Understanding that path makes it easier to find where a connection has failed.",
    "Identify the job of each device before changing its settings. A router connects networks, a switch connects devices within a network, and an access point provides wireless access. Label ports and cables, keep a simple network diagram, and record management addresses somewhere your team can find them.",
    "Separate customer addressing from device management. PPPoE identifies a subscriber with a login, while hotspot access usually begins in a captive portal. Keep address ranges organised and avoid reusing the same addresses across overlapping networks.",
    "Start with power and cable checks, then check whether the device has an address and can reach its gateway. Test the upstream connection separately. Record what you tested and what changed so the next technician does not have to start again."
  ],
  "upstream-backhaul-and-wisp-planning": [
    "Ask an upstream provider about usable capacity, support hours, installation costs, and outage handling. A backup link should have a different failure path where possible. Test failover before customers depend on it, and check the service terms for your intended use.",
    "Survey both ends of a wireless link. Check line of sight, mounting points, power, access permission, and interference. A clear-looking path is only a starting point: terrain, obstructions, and the radio's installation requirements still matter.",
    "Plan around busy-hour demand rather than adding up every advertised package speed. Record actual usage as customers join, watch congestion on shared links, and set a clear point at which you will add capacity.",
    "A cheap rollout can become expensive when equipment is hard to reach or power is unreliable. Budget for mounting, grounding, maintenance access, spares, and support visits alongside the radios and bandwidth."
  ],
  "isp-operations-billing-and-support": [
    "Keep a customer's plan, due date, payment, and access state linked. A confirmed payment should have a traceable reference, and staff should be able to explain why access is active or suspended without searching several spreadsheets.",
    "Send reminders that tell customers what to do next. Check whether a payment has already been confirmed before sending another notice. When a customer contacts support, record the issue, owner, and next action in one place.",
    "Give staff access to the work they need to do, then review important changes. Customer creation, plan activation, payment recording, and deletion should leave a useful activity trail. Never share one login across a whole team.",
    "Review collections, upcoming renewals, failed payments, open support work, and network outages each day. Choose a few figures that lead to action, and check that the date range and payment states behind them are consistent."
  ],
  "market-survey-and-growth-for-isps": [
    "Walk the target area and speak to potential customers before buying equipment. Ask what they use today, what frustrates them, what they pay, and whether they would switch. Record interested households and businesses with permission to follow up.",
    "A package needs to cover bandwidth, equipment, installation, support, and collection costs. Compare nearby offers without promising speeds or uptime your network cannot deliver. Keep installation fees and renewal terms easy to understand.",
    "Start with channels your neighbours already use: local WhatsApp groups, referrals, estate noticeboards, and useful social posts. Get permission before posting in community spaces. Show real coverage and a clear way to request installation.",
    "Keep each enquiry with its location, contact details, and next step. Follow up when you said you would, confirm coverage before taking payment, and explain installation timing honestly. Track which channels lead to connected customers, not just messages."
  ]
}

export function getCourseLessons(course: AcademyCourse) {
  const totalMinutes = Number.parseInt(course.duration, 10)
  const baseMinutes = Math.floor(totalMinutes / course.lessons.length)
  return course.lessons.map((title, index) => ({
    title,
    guide: lessonGuides[course.slug]?.[index] || course.summary,
    minutes:
      baseMinutes + (index < totalMinutes % course.lessons.length ? 1 : 0)
  }))
}

export function getCourseRequirements(course: AcademyCourse) {
  return [
    "A laptop or phone with an internet connection.",
    course.level === "Intermediate"
      ? "A basic understanding of routers, IP addresses, and network links."
      : "No previous ISP experience is needed. Start with the basics and take your time.",
    "A notebook for your network plan, questions, and practical exercises."
  ]
}
