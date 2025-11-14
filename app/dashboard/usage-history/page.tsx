"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Calendar, TrendingUp, Download, Clock } from "lucide-react"
import { useState } from "react"

export default function UsageHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("all")

  const usageData = [
    { date: "Nov 13, 2025", time: "14:30", duration: "2h 45m", volume: "Unlimited", speed: "1500 Mbps", activity: "Streaming & Browsing" },
    { date: "Nov 13, 2025", time: "10:15", duration: "1h 20m", volume: "Unlimited", speed: "1500 Mbps", activity: "Video Conference" },
    { date: "Nov 12, 2025", time: "20:45", duration: "4h 10m", volume: "Unlimited", speed: "1500 Mbps", activity: "Gaming & Downloads" },
    { date: "Nov 12, 2025", time: "08:30", duration: "3h 30m", volume: "Unlimited", speed: "1500 Mbps", activity: "Work & Email" },
    { date: "Nov 11, 2025", time: "18:00", duration: "5h 15m", volume: "Unlimited", speed: "1500 Mbps", activity: "HD Streaming" },
    { date: "Nov 11, 2025", time: "09:00", duration: "2h 00m", volume: "Unlimited", speed: "1500 Mbps", activity: "Social Media" },
    { date: "Nov 10, 2025", time: "16:20", duration: "3h 45m", volume: "Unlimited", speed: "1500 Mbps", activity: "Video Streaming" },
  ]

  const filtered = usageData.filter(
    (item) =>
      item.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.date.includes(searchTerm)
  )

  const totalDuration = usageData.reduce((acc, item) => {
    const hours = parseInt(item.duration.split('h')[0])
    const minutes = parseInt(item.duration.split('h')[1].split('m')[0])
    return acc + hours + (minutes / 60)
  }, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Usage History</h1>
        <p className="text-slate-600 mt-1">Track your internet activity and connection history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-3xl font-bold">{Math.round(totalDuration)}h</p>
          <p className="text-blue-100 text-sm">Total Usage This Week</p>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">1500</p>
          <p className="text-slate-600 text-sm">Average Mbps</p>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">7</p>
          <p className="text-slate-600 text-sm">Active Days</p>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-2">
            <Download className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">∞</p>
          <p className="text-slate-600 text-sm">Data Remaining</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 bg-white">
        <div className="grid md:grid-cols-3 gap-4">
          <Input
            placeholder="Search by activity or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-10 px-4 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </Card>

      {/* Usage Table */}
      <Card className="p-6 bg-white">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Connection History</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Time</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Duration</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Speed</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Activity</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((usage, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-4 px-4 text-slate-900">{usage.date}</td>
                  <td className="py-4 px-4 text-slate-600">{usage.time}</td>
                  <td className="py-4 px-4 text-slate-900 font-medium">{usage.duration}</td>
                  <td className="py-4 px-4 text-blue-600 font-semibold">{usage.speed}</td>
                  <td className="py-4 px-4 text-slate-600">{usage.activity}</td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                      Completed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
