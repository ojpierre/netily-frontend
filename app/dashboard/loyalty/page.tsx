"use client"

import React from "react"
import {
  Gift,
  Star,
  Trophy,
  Clock,
  ArrowRight,
  Zap,
  Crown,
  Target,
  History,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

export default function CustomerLoyaltyPage() {
  const loyaltyData = {
    points: 2450,
    tier: "Gold",
    nextTier: "Platinum",
    pointsToNextTier: 550,
    lifetimePoints: 8500,
    memberSince: "2022-06-15",
  }

  const rewards = [
    { id: 1, name: "1 Week Free Internet", points: 500, description: "Get 7 days of free service", available: true },
    { id: 2, name: "Speed Boost (1 Month)", points: 750, description: "Double your speed for a month", available: true },
    { id: 3, name: "KSh 500 Credit", points: 1000, description: "Account credit towards your bill", available: true },
    { id: 4, name: "Premium Router", points: 3000, description: "Free router upgrade", available: false },
    { id: 5, name: "1 Month Free Service", points: 2500, description: "Complete month free", available: true },
  ]

  const pointsHistory = [
    { id: 1, type: "earn", description: "Monthly subscription payment", points: 100, date: "2024-01-15" },
    { id: 2, type: "earn", description: "Referral bonus - John Doe", points: 500, date: "2024-01-10" },
    { id: 3, type: "redeem", description: "Redeemed: Speed Boost", points: -750, date: "2024-01-05" },
    { id: 4, type: "earn", description: "Monthly subscription payment", points: 100, date: "2023-12-15" },
    { id: 5, type: "earn", description: "On-time payment bonus", points: 50, date: "2023-12-15" },
  ]

  const tiers = [
    { name: "Bronze", minPoints: 0, benefits: ["Basic rewards access", "Standard support"] },
    { name: "Silver", minPoints: 1000, benefits: ["10% bonus points", "Priority support", "Early access to offers"] },
    { name: "Gold", minPoints: 2000, benefits: ["20% bonus points", "Priority support", "Exclusive rewards", "Birthday bonus"] },
    { name: "Platinum", minPoints: 3000, benefits: ["30% bonus points", "VIP support", "All rewards", "Special promotions", "Free upgrades"] },
  ]

  const handleRedeem = (reward: typeof rewards[0]) => {
    if (reward.points > loyaltyData.points) {
      toast.error("Not enough points")
      return
    }
    toast.success(`Redeemed: ${reward.name}`)
  }

  const currentTierIndex = tiers.findIndex(t => t.name === loyaltyData.tier)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Loyalty Program</h1>
        <p className="text-slate-600 mt-1">Earn points and redeem exciting rewards</p>
      </div>

      {/* Points Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-gradient-to-br from-amber-50 to-orange-50 border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-warning font-medium">Available Points</p>
                <p className="text-5xl font-bold text-amber-900 mt-2">{loyaltyData.points.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-4">
                  <Badge className="bg-amber-600 text-white">
                    <Crown className="w-3 h-3 mr-1" />
                    {loyaltyData.tier} Member
                  </Badge>
                </div>
              </div>
              <div className="w-24 h-24 bg-amber-200 rounded-full flex items-center justify-center">
                <Trophy className="w-12 h-12 text-warning" />
              </div>
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-warning">{loyaltyData.pointsToNextTier} points to {loyaltyData.nextTier}</span>
                <span className="text-warning">{loyaltyData.points} / {loyaltyData.points + loyaltyData.pointsToNextTier}</span>
              </div>
              <Progress value={(loyaltyData.points / (loyaltyData.points + loyaltyData.pointsToNextTier)) * 100} className="h-2 bg-amber-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-warning" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-500">Lifetime Points</span>
              <span className="font-semibold">{loyaltyData.lifetimePoints.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Member Since</span>
              <span className="font-semibold">{new Date(loyaltyData.memberSince).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current Tier</span>
              <Badge className="bg-warning/15 text-warning">{loyaltyData.tier}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ways to Earn */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-warning" />
            Ways to Earn Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <div className="w-12 h-12 bg-primary/15 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold">Monthly Payment</p>
              <p className="text-sm text-slate-500">+100 points</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <div className="w-12 h-12 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-success" />
              </div>
              <p className="font-semibold">Referral</p>
              <p className="text-sm text-slate-500">+500 points</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <p className="font-semibold">On-time Payment</p>
              <p className="text-sm text-slate-500">+50 bonus</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <div className="w-12 h-12 bg-warning/15 rounded-full flex items-center justify-center mx-auto mb-3">
                <Gift className="w-6 h-6 text-warning" />
              </div>
              <p className="font-semibold">Birthday Bonus</p>
              <p className="text-sm text-slate-500">+200 points</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="rewards">
        <TabsList className="w-full flex overflow-x-auto">
          <TabsTrigger value="rewards" className="flex-1 min-w-0 text-xs sm:text-sm">Available Rewards</TabsTrigger>
          <TabsTrigger value="history" className="flex-1 min-w-0 text-xs sm:text-sm">Points History</TabsTrigger>
          <TabsTrigger value="tiers" className="flex-1 min-w-0 text-xs sm:text-sm">Membership Tiers</TabsTrigger>
        </TabsList>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward) => (
              <Card key={reward.id} className={!reward.available ? "opacity-60" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{reward.name}</CardTitle>
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                      {reward.points} pts
                    </Badge>
                  </div>
                  <CardDescription>{reward.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    disabled={!reward.available || reward.points > loyaltyData.points}
                    onClick={() => handleRedeem(reward)}
                  >
                    {reward.points > loyaltyData.points ? "Not Enough Points" : "Redeem"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Points History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pointsHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        <Badge className={item.type === "earn" ? "bg-success/15 text-success" : "bg-primary/15 text-primary"}>
                          {item.type === "earn" ? "Earned" : "Redeemed"}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${item.points > 0 ? "text-success" : "text-primary"}`}>
                        {item.points > 0 ? "+" : ""}{item.points}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tiers Tab */}
        <TabsContent value="tiers" className="mt-6">
          <div className="grid md:grid-cols-4 gap-4">
            {tiers.map((tier, index) => (
              <Card 
                key={tier.name} 
                className={`${index === currentTierIndex ? "border-amber-400 bg-warning/10" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{tier.name}</CardTitle>
                    {index === currentTierIndex && (
                      <Badge className="bg-amber-600 text-white">Current</Badge>
                    )}
                  </div>
                  <CardDescription>
                    {tier.minPoints > 0 ? `${tier.minPoints}+ points` : "Starting tier"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tier.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Star className="w-4 h-4 text-warning" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
