import Link from "next/link"

const sections = [
  {
    title: "1. Data We Collect",
    content:
      "We collect account details, tenant configuration data, transaction metadata, and operational logs required to provide billing and payment services.",
  },
  {
    title: "2. How We Use Data",
    content:
      "Data is used to authenticate users, process billing actions, deliver service notifications, reconcile payments, and improve platform reliability.",
  },
  {
    title: "3. Payment Information",
    content:
      "Payment channel credentials and transaction records are processed for operational purposes. Sensitive secrets should be rotated periodically and restricted to authorized administrators.",
  },
  {
    title: "4. Data Sharing",
    content:
      "We only share required data with approved infrastructure and payment providers to complete authorized operations. We do not sell customer personal data.",
  },
  {
    title: "5. Security",
    content:
      "We apply technical and organizational controls to protect data, including access controls, encrypted transport, and audit trails for administrative actions.",
  },
  {
    title: "6. Your Rights",
    content:
      "You can request correction or deletion of inaccurate profile information, subject to legal retention obligations and dispute/audit requirements.",
  },
]

export default function PrivacyPage() {
  const updated = new Date().toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <p className="text-sm text-slate-500">Last updated: {updated}</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Privacy Policy</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          This policy explains how Netily handles personal and operational data.
        </p>
      </div>

      <div className="space-y-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{section.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{section.content}</p>
          </section>
        ))}
      </div>

      <div className="mt-8 text-sm text-slate-600 dark:text-slate-400">
        <Link href="/admin/register" className="text-blue-600 hover:underline">
          Back to registration
        </Link>
      </div>
    </main>
  )
}
