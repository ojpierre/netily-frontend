"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Headphones, Mail, Phone } from "lucide-react"
import { useState } from "react"

export default function SupportPage() {
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setMessage("")
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Customer Support</h1>

      {/* Support Channels */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6 bg-white hover:shadow-lg transition-shadow cursor-pointer">
          <Headphones className="w-8 h-8 text-blue-600 mb-4" />
          <h3 className="font-bold text-slate-900 mb-2">Live Chat</h3>
          <p className="text-slate-600 text-sm mb-4">Chat with our support team now</p>
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Start Chat</Button>
        </Card>

        <Card className="p-6 bg-white hover:shadow-lg transition-shadow cursor-pointer">
          <Phone className="w-8 h-8 text-blue-600 mb-4" />
          <h3 className="font-bold text-slate-900 mb-2">Phone Support</h3>
          <p className="text-slate-600 text-sm mb-4">Call us at +254 123 456 789</p>
          <Button variant="outline" className="w-full bg-transparent">
            Call Now
          </Button>
        </Card>

        <Card className="p-6 bg-white hover:shadow-lg transition-shadow cursor-pointer">
          <Mail className="w-8 h-8 text-blue-600 mb-4" />
          <h3 className="font-bold text-slate-900 mb-2">Email Support</h3>
          <p className="text-slate-600 text-sm mb-4">support@netily.com</p>
          <Button variant="outline" className="w-full bg-transparent">
            Send Email
          </Button>
        </Card>
      </div>

      {/* Contact Form */}
      <Card className="p-8 bg-white">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Send us a Message</h2>

        {submitted && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            Thank you for your message! We'll get back to you soon.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
            <Input placeholder="e.g., Billing question, Technical issue..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
            <textarea
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              rows={5}
              placeholder="Tell us how we can help..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6">
            Send Message
          </Button>
        </form>
      </Card>

      {/* FAQ */}
      <Card className="p-8 bg-white">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>

        <div className="space-y-4">
          {[
            {
              q: "How do I recharge my plan?",
              a: "Go to Recharge section and select your desired plan, then choose your payment method.",
            },
            { q: "What payment methods do you accept?", a: "We accept M-Pesa and Pokopoko for your convenience." },
            {
              q: "How long does it take for my payment to be processed?",
              a: "Most payments are processed instantly. If not, our support team will assist you within 2 hours.",
            },
            {
              q: "Can I change my plan anytime?",
              a: "Yes, you can upgrade or downgrade your plan anytime from the dashboard.",
            },
          ].map((faq, i) => (
            <div key={i} className="border-b border-slate-200 pb-4 last:border-0">
              <p className="font-semibold text-slate-900 mb-2">{faq.q}</p>
              <p className="text-slate-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
