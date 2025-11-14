"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, Zap, Shield, Clock, Headphones, Check, Star, TrendingUp, Users, Wifi, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LandingPage() {
  const [email, setEmail] = useState("")
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    element?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-blue-600">Netily</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollToSection("features")} className="text-slate-700 hover:text-blue-600 transition-colors">
              Features
            </button>
            <button onClick={() => scrollToSection("pricing")} className="text-slate-700 hover:text-blue-600 transition-colors">
              Pricing
            </button>
            <button onClick={() => scrollToSection("testimonials")} className="text-slate-700 hover:text-blue-600 transition-colors">
              Reviews
            </button>
            <button onClick={() => scrollToSection("faq")} className="text-slate-700 hover:text-blue-600 transition-colors">
              FAQ
            </button>
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-700">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className={`max-w-7xl mx-auto transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                <span>Trusted by 50,000+ customers</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
                Unlimited internet, <span className="text-blue-600">paid in seconds</span>
              </h1>
              <p className="text-xl text-slate-600 mb-8">
                Say goodbye to data limits and payment hassles. Netily brings you unlimited high-speed internet with instant recharges, real-time tracking, and support that actually cares. Your connection matters—we make paying for it effortless.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/register">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg flex items-center gap-2">
                    Start Free Today <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="px-8 py-6 text-lg border-slate-300 bg-transparent"
                  onClick={() => scrollToSection("features")}
                >
                  See How It Works
                </Button>
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>No hidden fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Instant activation</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 shadow-2xl">
                <div className="bg-white rounded-xl p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-600 text-sm">Current Plan</span>
                    <Wifi className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900">Unlimited</p>
                  <p className="text-slate-500 text-sm mt-1">Active • 1500 Mbps</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-700 rounded-lg p-4 text-white">
                    <Zap className="w-5 h-5 mb-2" />
                    <p className="text-2xl font-bold">1500</p>
                    <p className="text-xs text-blue-200">Mbps Speed</p>
                  </div>
                  <div className="bg-blue-700 rounded-lg p-4 text-white">
                    <Clock className="w-5 h-5 mb-2" />
                    <p className="text-2xl font-bold">31d</p>
                    <p className="text-xs text-blue-200">Validity</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-100 rounded-full -z-10 blur-3xl"></div>
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-blue-200 rounded-full -z-10 blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <Users className="w-8 h-8 mx-auto mb-3 opacity-80" />
              <p className="text-4xl font-bold mb-2">50K+</p>
              <p className="text-blue-100">Active Users</p>
            </div>
            <div>
              <Zap className="w-8 h-8 mx-auto mb-3 opacity-80" />
              <p className="text-4xl font-bold mb-2">2.4M</p>
              <p className="text-blue-100">Transactions</p>
            </div>
            <div>
              <Star className="w-8 h-8 mx-auto mb-3 opacity-80" />
              <p className="text-4xl font-bold mb-2">4.9/5</p>
              <p className="text-blue-100">User Rating</p>
            </div>
            <div>
              <Shield className="w-8 h-8 mx-auto mb-3 opacity-80" />
              <p className="text-4xl font-bold mb-2">99.9%</p>
              <p className="text-blue-100">Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Why 50,000+ users choose Netily</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              We've built the most intuitive platform for internet payments. Here's what makes us different.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: <Wifi className="w-8 h-8" />,
                title: "Truly Unlimited",
                desc: "No data caps, no throttling, no surprises. Stream, game, and work without limits.",
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Lightning Fast",
                desc: "High-speed connections up to 3000 Mbps. Recharge in under 10 seconds.",
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Bank-Grade Security",
                desc: "Your payments are encrypted end-to-end. We're PCI DSS compliant for your peace of mind.",
              },
              {
                icon: <Headphones className="w-8 h-8" />,
                title: "Human Support",
                desc: "Real people, real help—24/7. Average response time: under 2 minutes.",
              },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-xl p-8 border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Get started in 3 simple steps</h2>
            <p className="text-xl text-slate-600">From signup to surfing in under 5 minutes</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create Your Account",
                desc: "Sign up with your email in 60 seconds. No credit card required to start.",
              },
              {
                step: "02",
                title: "Choose Your Plan",
                desc: "Pick the perfect package for your needs. Change anytime, no penalties.",
              },
              {
                step: "03",
                title: "Stay Connected",
                desc: "Pay via M-Pesa or Pokopoko and get instant activation. It's that simple.",
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-6xl font-bold text-blue-100 mb-4">{item.step}</div>
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-slate-600 text-lg">{item.desc}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 -right-4 w-8 h-0.5 bg-blue-200"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-xl text-slate-600">No surprises. No hidden fees. Just fast internet.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Mtaani-8",
                price: "1,500",
                speed: "1500 Mbps",
                features: ["Unlimited internet", "4-5 devices", "Email support", "31 days validity"],
                popular: false,
              },
              {
                name: "Mtaani-10",
                price: "1,800",
                speed: "2000 Mbps",
                features: ["Unlimited internet", "6-8 devices", "Priority support", "31 days validity"],
                popular: true,
              },
              {
                name: "Mtaani-20",
                price: "2,500",
                speed: "3000 Mbps",
                features: ["Unlimited internet", "Unlimited devices", "24/7 premium support", "31 days validity"],
                popular: false,
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`relative bg-white rounded-2xl p-8 border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                  plan.popular ? "border-blue-600 shadow-xl scale-105" : "border-slate-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">KSh {plan.price}</span>
                  <span className="text-slate-600">/month</span>
                </div>
                <div className="space-y-2 mb-6">
                  <p className="text-lg font-semibold text-blue-600">{plan.speed}</p>
                  <p className="text-slate-600">Unlimited Data</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-slate-700">
                      <Check className="w-5 h-5 text-green-600 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button
                    className={`w-full py-6 text-lg ${
                      plan.popular
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                    }`}
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">What our customers say</h2>
            <p className="text-xl text-slate-600">Real stories from real users</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Mwangi",
                role: "Small Business Owner",
                content: "Netily transformed how I manage my cafe's internet. No more long queues or payment hassles. My team loves it!",
                rating: 5,
              },
              {
                name: "James Ochieng",
                role: "Software Developer",
                content: "As someone who works from home, reliable internet is crucial. Netily's instant recharge saved me during a crucial client demo.",
                rating: 5,
              },
              {
                name: "Mary Njeri",
                role: "University Student",
                content: "The 24/7 support is amazing! I had an issue at midnight and got help in under 2 minutes. Plus, the pricing is student-friendly.",
                rating: 5,
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-white rounded-xl p-8 border border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, idx) => (
                    <Star key={idx} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-6 text-lg leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-lg">{testimonial.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{testimonial.name}</p>
                    <p className="text-slate-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="bg-slate-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Frequently asked questions</h2>
            <p className="text-xl text-slate-600">Everything you need to know</p>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "How quickly can I get started?",
                a: "You can sign up and make your first payment in under 5 minutes. Once payment is confirmed, your internet is activated instantly—no waiting, no delays.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept M-Pesa and Pokopoko for maximum convenience. Both methods process payments instantly, and you'll receive confirmation via SMS and email.",
              },
              {
                q: "Can I change my plan anytime?",
                a: "Absolutely! You can upgrade or downgrade your plan at any time through your dashboard. Changes take effect immediately, and we'll prorate any remaining balance.",
              },
              {
                q: "Is the internet really unlimited?",
                a: "Yes! All our plans offer truly unlimited data with no caps, no throttling, and no fair usage policies. Stream, download, and browse as much as you want.",
              },
              {
                q: "Is my payment information secure?",
                a: "Yes! We use bank-grade encryption and are PCI DSS compliant. Your payment data is never stored on our servers and is processed through secure, certified payment gateways.",
              },
              {
                q: "Do you offer refunds?",
                a: "We offer a 7-day money-back guarantee if you're not satisfied. For active subscriptions, unused time can be credited to your next recharge.",
              },
            ].map((faq, i) => (
              <details key={i} className="bg-white rounded-xl p-6 border border-slate-200 group">
                <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg text-slate-900">
                  {faq.q}
                  <ArrowRight className="w-5 h-5 text-blue-600 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-4 text-slate-600 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-30"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 rounded-full blur-3xl opacity-30"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to simplify your internet payments?</h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join 50,000+ users who've already made the switch. Start free, cancel anytime.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="max-w-md bg-white h-14 text-lg"
                />
                <Link href="/register">
                  <Button className="bg-white text-blue-600 hover:bg-blue-50 px-8 h-14 text-lg font-medium">
                    Get Started Free
                  </Button>
                </Link>
              </div>
              <p className="text-blue-100 text-sm mt-4">No credit card required • Free 7-day trial</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">Netily</span>
              </div>
              <p className="text-slate-400">Making internet payments simple and fast for everyone.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <button onClick={() => scrollToSection("features")} className="hover:text-white transition-colors">
                    Features
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection("pricing")} className="hover:text-white transition-colors">
                    Pricing
                  </button>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-white transition-colors">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link href="/dashboard/support" className="hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <button onClick={() => scrollToSection("faq")} className="hover:text-white transition-colors">
                    FAQ
                  </button>
                </li>
                <li>
                  <a href="mailto:support@netily.com" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Refund Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
            <p>&copy; {new Date().getFullYear()} Netily. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
