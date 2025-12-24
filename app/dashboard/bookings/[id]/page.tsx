"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, Calendar, Clock, MapPin, Users, Mail, Phone } from "lucide-react"
import { format } from "date-fns"
import { useParams } from "next/navigation"

// Mock booking data
const bookingData = {
  id: "BK001",
  space: "Work Solo",
  date: new Date(2024, 0, 25),
  startTime: "09:00",
  endTime: "17:00",
  duration: "8 hours",
  attendees: 1,
  status: "confirmed",
  amount: 5500,
  vat: 412.5,
  total: 5912.5,
  qrCode: "AMG-BK001-2024",
  customer: {
    name: "John Doe",
    email: "john@example.com",
    phone: "+234 123 456 7890",
  },
  paymentMethod: "Card",
  transactionId: "TXN123456789",
}

export default function BookingDetailPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary px-4 py-8">
        <div className="container mx-auto max-w-4xl">
          <Button variant="ghost" asChild className="mb-4 text-secondary hover:bg-secondary/10">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary mb-2">Booking Details</h1>
              <p className="text-secondary/80">Booking #{bookingData.id}</p>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-600 self-start sm:self-center">
              {bookingData.status}
            </Badge>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 py-8">
        <div className="container mx-auto max-w-4xl space-y-6">
          {/* QR Code Card */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">Check-In Instructions</h3>
              <p className="text-muted-foreground mb-4">
                To check in, scan the QR code at AMG Workspace entrance using the scanner in your dashboard.
              </p>
              <Button asChild>
                <Link href="/dashboard/check-in">Open QR Scanner</Link>
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Booking Information */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{bookingData.space}</h3>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Date</div>
                      <div className="text-muted-foreground">{format(bookingData.date, "PPPP")}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Time</div>
                      <div className="text-muted-foreground">
                        {bookingData.startTime} - {bookingData.endTime} ({bookingData.duration})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Attendees</div>
                      <div className="text-muted-foreground">{bookingData.attendees} person</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Location</div>
                      <div className="text-muted-foreground">AMG Workspace, Lagos</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer & Payment */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Name</div>
                      <div className="text-muted-foreground">{bookingData.customer.name}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Email</div>
                      <div className="text-muted-foreground">{bookingData.customer.email}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Phone</div>
                      <div className="text-muted-foreground">{bookingData.customer.phone}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₦{bookingData.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">VAT (7.5%)</span>
                    <span>₦{bookingData.vat.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Paid</span>
                    <span className="text-primary">₦{bookingData.total.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span>{bookingData.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Transaction ID</span>
                    <span className="font-mono text-xs">{bookingData.transactionId}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" className="flex-1 bg-transparent">
                  <Download className="mr-2 h-4 w-4" />
                  Download Receipt
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent">
                  <Mail className="mr-2 h-4 w-4" />
                  Email Details
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent" asChild>
                  <Link href="/contact">Contact Support</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
