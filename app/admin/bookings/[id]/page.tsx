"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, Clock, User, Mail, Phone, MapPin, CreditCard, CheckCircle2, XCircle } from "lucide-react"
import { format } from "date-fns"

// Mock booking data
const getBooking = (id: string) => ({
  id: id,
  space: "Board Room",
  customer: "Jane Smith",
  email: "jane@example.com",
  phone: "+234 806 123 4567",
  date: new Date(2024, 0, 25),
  startTime: "14:00",
  endTime: "16:00",
  duration: "2 hours",
  status: "checked-in",
  amount: 15000,
  vat: 1125,
  total: 16125,
  paymentMethod: "Paystack",
  paymentStatus: "paid",
  notes: "Need projector and whiteboard setup",
  createdAt: new Date(2024, 0, 20),
  checkedInAt: new Date(2024, 0, 25, 13, 55),
})

export default function AdminBookingDetailPage() {
  const params = useParams()
  const booking = getBooking(params.id as string)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "checked-in":
        return "bg-green-100 text-green-700 border-green-300"
      case "completed":
        return "bg-gray-100 text-gray-700 border-gray-300"
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-300"
      default:
        return "bg-gray-100 text-gray-700 border-gray-300"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <section className="bg-secondary text-secondary-foreground px-4 py-6 border-b">
        <div className="container mx-auto">
          <Button variant="ghost" asChild className="mb-4 text-secondary-foreground/70 hover:text-secondary-foreground">
            <Link href="/admin/bookings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Bookings
            </Link>
          </Button>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-red-600 text-white">Admin</Badge>
                <span className="font-mono text-sm">#{booking.id}</span>
              </div>
              <h1 className="text-2xl font-bold">Booking Details</h1>
            </div>
            <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 py-8">
        <div className="container mx-auto max-w-4xl space-y-6">
          {/* Booking Information */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Space</p>
                  <p className="font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {booking.space}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {booking.duration}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(booking.date, "MMMM dd, yyyy")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {booking.startTime} - {booking.endTime}
                  </p>
                </div>
              </div>

              {booking.notes && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Special Requests</p>
                    <p className="text-sm">{booking.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-semibold">{booking.customer}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold">{booking.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-semibold">{booking.phone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base Amount</span>
                  <span className="font-medium">₦{booking.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT (7.5%)</span>
                  <span className="font-medium">₦{booking.vat.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold">Total Amount</span>
                  <span className="font-bold text-lg">₦{booking.total.toLocaleString()}</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Payment Method</span>
                </div>
                <span className="font-semibold">{booking.paymentMethod}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Payment Status</span>
                <Badge className="bg-green-100 text-green-700 border-green-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {booking.paymentStatus}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Check-in Status */}
          {booking.checkedInAt && (
            <Card>
              <CardHeader>
                <CardTitle>Check-in Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Checked In</p>
                    <p className="text-sm text-muted-foreground">
                      {format(booking.checkedInAt, "MMM dd, yyyy 'at' hh:mm a")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" className="flex-1 bg-transparent">
                  Edit Booking
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Booking
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
