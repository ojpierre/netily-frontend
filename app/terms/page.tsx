import Link from "next/link"

const sections = [
  {
    title: "1. Service Scope",
    content:
      "Netily provides software tools for billing, authentication, and payment collection for internet service providers. Access to specific payment channels may depend on provider readiness and backend activation.",
  },
  {
    title: "2. Account Responsibility",
    content:
      "You are responsible for maintaining secure credentials, accurate company/customer details, and authorized use of all connected payment accounts.",
  },
  {
    title: "3. Payments and Settlements",
    content:
      "Supported payment channels are displayed in your dashboard. Settlement timing, transaction fees, and reversals depend on the configured payment provider and applicable regulations.",
  },
  {
    title: "4. Compliance",
    content:
      "You agree to comply with applicable telecom, payments, and data protection laws in your operating jurisdiction, including customer consent and record-keeping requirements.",
  },
  {
    title: "5. Availability",
    content:
      "Netily works to maintain high availability but cannot guarantee uninterrupted service during maintenance windows, provider outages, or force majeure events.",
  },
  {
    title: "6. Contact",
    content:
      "For legal or account concerns, contact support through your Netily admin portal support channels.",
  },
]

export default function TermsPage() {
  const updated = new Date().toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <p className="text-sm text-slate-500">Last updated: {updated}</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Terms of Service</h1>
        <p className="mt-3 text-slate-600">
          These terms govern your use of Netily services and payment tooling.
        </p>
      </div>

      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{section.content}</p>
          </section>
        ))}
      </div>

      <div className="mt-8 text-sm text-slate-600">
        <Link href="/admin/register" className="text-blue-600 hover:underline">
          Back to registration
        </Link>
      </div>
    </main>
  )
}
