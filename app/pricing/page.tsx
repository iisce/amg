"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2 } from "lucide-react"

const pricingPlans = [
  {
    category: "Workspace Plans",
    plans: [
      { name: "Daily Plan", price: 5500, unit: "day", popular: true },
      { name: "Saturday Plans", price: 9000, unit: "day", popular: false },
      { name: "Full Weekly", price: 21500, unit: "week", popular: false },
      { name: "Hybrid Weekly", price: 15000, unit: "week", popular: true },
      { name: "Hybrid Flexi", price: 28750, unit: "week", popular: false },
      { name: "Evening Plan", price: 7000, unit: "evening", popular: false },
      { name: "Half Flexi Monthly", price: 33000, unit: "month", popular: false },
      { name: "Monthly Plan", price: 46500, unit: "month", popular: true },
    ],
  },
  {
    category: "Meeting Spaces",
    plans: [
      { name: "Board Room", price: 15000, unit: "2 hours", popular: true },
      { name: "Training Room", price: 200000, unit: "day", popular: false },
      { name: "Lounge", price: 25000, unit: "hour", popular: false },
    ],
  },
  {
    category: "Studio & Offices",
    plans: [
      { name: "Photo Studio", price: 10000, unit: "hour", popular: true },
      { name: "Office Space 1", price: 90000, unit: "1 month", popular: false },
      { name: "Office Space 1", price: 165000, unit: "2 months", popular: false },
      { name: "Office Space 2", price: 135000, unit: "1 month", popular: false },
      { name: "Office Space 2", price: 240000, unit: "2 months", popular: false },
      { name: "Office Space 3", price: 155000, unit: "1 month", popular: false },
      { name: "Office Space 3", price: 290000, unit: "2 months", popular: false },
      { name: "Shared Desk (Half)", price: 100000, unit: "month", popular: false },
      { name: "Shared Desk (Full)", price: 180000, unit: "month", popular: true },
      { name: "Entire Office Space", price: 500000, unit: "Saturday only", popular: false },
    ],
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-primary px-4 py-16">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl font-bold text-secondary sm:text-5xl mb-4">Pricing Plans</h1>
          <p className="text-lg text-secondary/80 max-w-2xl mx-auto">
            Flexible pricing to match your needs. From hourly bookings to monthly memberships.
          </p>
          <p className="text-sm text-secondary/70 mt-4">Exclusive of 7.5% VAT</p>
        </div>
      </section>

      {/* Pricing Tables */}
      <section className="px-4 py-12">
        <div className="container mx-auto space-y-12">
          {pricingPlans.map((category, idx) => (
            <div key={idx}>
              <h2 className="text-3xl font-bold mb-6">{category.category}</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {category.plans.map((plan, planIdx) => (
                  <Card key={planIdx} className={plan.popular ? "border-2 border-primary shadow-lg" : ""}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        {plan.popular && <Badge className="bg-primary text-primary-foreground">Popular</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6">
                        <div className="text-3xl font-bold text-primary">₦{plan.price.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">per {plan.unit}</div>
                      </div>
                      <Button className="w-full" asChild>
                        <Link href="/spaces">Book Now</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-12 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">All Plans Include</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">High-Speed WiFi</div>
                <div className="text-sm text-muted-foreground">Fast & reliable internet</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Coffee & Tea</div>
                <div className="text-sm text-muted-foreground">Complimentary beverages</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Power Backup</div>
                <div className="text-sm text-muted-foreground">Uninterrupted work</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">24/7 Access</div>
                <div className="text-sm text-muted-foreground">Monthly plans only</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Not sure which plan is right for you?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Our team can help you choose the perfect workspace solution for your needs.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row justify-center">
            <Button size="lg" asChild>
              <Link href="/spaces">Browse Spaces</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
