'use client';

import type React from 'react';
import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
	ArrowLeft,
	CreditCard,
	ShieldCheck,
	Calendar,
	Clock,
	Loader2,
	User,
	LogIn,
} from 'lucide-react';
import { format, addHours, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useBookingStore } from '@/store/booking-store';
import { useAuth } from '@/hooks/use-auth';
import { createBooking, initializePayment } from '@/actions';

export default function BookingPaymentPage() {
	const router = useRouter();
	const { user, isLoading: authLoading, isAuthenticated } = useAuth();
	const bookingData = useBookingStore((state) => state.bookingData);
	const clearData = useBookingStore((state) => state.clearData);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		if (!bookingData) {
			router.push('/booking');
		}
	}, [bookingData, router]);

	// Redirect to login if not authenticated
	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			router.push('/login?redirect=/booking/payment');
		}
	}, [authLoading, isAuthenticated, router]);

	if (!bookingData) {
		return null;
	}

	// Show loading while checking auth
	if (authLoading) {
		return (
			<div className='min-h-screen bg-background'>
				<section className='bg-primary px-4 py-8'>
					<div className='container mx-auto max-w-4xl'>
						<Skeleton className='h-8 w-48 bg-secondary/20' />
					</div>
				</section>
				<section className='px-4 py-8'>
					<div className='container mx-auto max-w-4xl'>
						<div className='grid gap-6 lg:grid-cols-3'>
							<div className='lg:col-span-2 space-y-6'>
								<Card>
									<CardContent className='p-6'>
										<Skeleton className='h-6 w-32 mb-4' />
										<div className='space-y-3'>
											<Skeleton className='h-4 w-48' />
											<Skeleton className='h-4 w-64' />
											<Skeleton className='h-4 w-40' />
										</div>
									</CardContent>
								</Card>
							</div>
						</div>
					</div>
				</section>
			</div>
		);
	}

	// Show login required if not authenticated
	if (!isAuthenticated || !user) {
		return (
			<div className='min-h-screen bg-background flex items-center justify-center px-4'>
				<Card className='max-w-md w-full'>
					<CardContent className='p-8 text-center'>
						<LogIn className='h-12 w-12 mx-auto mb-4 text-primary' />
						<h2 className='text-xl font-bold mb-2'>Sign In Required</h2>
						<p className='text-muted-foreground mb-6'>
							Please sign in to complete your booking.
						</p>
						<Button asChild className='w-full'>
							<Link href='/login?redirect=/booking/payment'>
								Sign In
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	const totalWithVAT = bookingData.total * 1.075;

	const handlePayment = (e: React.FormEvent) => {
		e.preventDefault();

		if (!user) {
			toast.error('Please sign in to continue');
			return;
		}

		startTransition(async () => {
			try {
				// Parse the booking date and time to create proper DateTime objects
				const bookingDate = parseISO(bookingData.date);
				const [hours, minutes] = bookingData.startTime
					.split(':')
					.map(Number);

				// Create start time by combining date and time
				const startTime = new Date(bookingDate);
				startTime.setHours(hours, minutes, 0, 0);

				// Calculate end time based on duration
				const endTime = addHours(startTime, bookingData.duration);

				// Create the booking in the database (user info from session)
				const bookingResult = await createBooking({
					spaceId: bookingData.spaceId,
					pricingPlanId: bookingData.planId,
					bookingDate: bookingDate,
					startTime: startTime,
					endTime: endTime,
					attendees: bookingData.attendees,
					notes: bookingData.notes,
					// Contact info comes from authenticated user's profile
					contactName: user.name,
					contactEmail: user.email,
					contactPhone: user.phone || undefined,
				});

				if (!bookingResult.success) {
					toast.error(
						bookingResult.message || 'Failed to create booking'
					);
					return;
				}

				// Get the booking data
				const booking = Array.isArray(bookingResult.data)
					? bookingResult.data[0]
					: bookingResult.data;

				if (!booking) {
					toast.error('Booking created but no data returned');
					return;
				}

				// Initialize Paystack payment
				const paymentResult = await initializePayment({
					amount: Math.round(totalWithVAT * 100), // Convert to kobo
					bookingId: booking.id,
					callbackUrl: `${window.location.origin}/booking/confirmation?id=${booking.bookingNumber}&type=booking`,
				});

				if (
					paymentResult.success &&
					paymentResult.data?.authorizationUrl
				) {
					// Clear store data before redirecting to payment
					clearData();
					// Redirect to Paystack
					window.location.href = paymentResult.data.authorizationUrl;
				} else {
					// For demo purposes, redirect to confirmation with the booking number
					toast.success('Booking created successfully!');
					clearData();
					router.push(
						`/booking/confirmation?id=${booking.bookingNumber}&type=booking`
					);
				}
			} catch (error) {
				console.error('Payment error:', error);
				toast.error('An error occurred during payment processing');
			}
		});
	};

	return (
		<div className='min-h-screen bg-background'>
			{/* Header */}
			<section className='bg-primary px-4 py-8'>
				<div className='container mx-auto max-w-4xl'>
					<Button
						variant='ghost'
						asChild
						className='mb-4 text-secondary hover:bg-secondary/10'
					>
						<Link href='/booking'>
							<ArrowLeft className='mr-2 h-4 w-4' />
							Back to Booking
						</Link>
					</Button>
					<h1 className='text-3xl font-bold text-secondary sm:text-4xl mb-2'>
						Booking Payment
					</h1>
					<p className='text-secondary/80'>
						Complete your booking with secure payment
					</p>
				</div>
			</section>

			{/* Payment Form */}
			<section className='px-4 py-8'>
				<div className='container mx-auto max-w-4xl'>
					<form onSubmit={handlePayment}>
						<div className='grid gap-6 lg:grid-cols-3'>
							{/* Payment Details */}
							<div className='lg:col-span-2 space-y-6'>
								<Card>
									<CardHeader>
										<CardTitle className='flex items-center gap-2'>
											<User className='h-5 w-5' />
											Your Information
										</CardTitle>
									</CardHeader>
									<CardContent className='space-y-4'>
										<div className='space-y-2'>
											<div className='text-sm text-muted-foreground'>
												Full Name
											</div>
											<div className='font-semibold'>
												{user.name}
											</div>
										</div>

										<div className='space-y-2'>
											<div className='text-sm text-muted-foreground'>
												Email Address
											</div>
											<div className='font-semibold'>
												{user.email}
											</div>
										</div>

										<div className='space-y-2'>
											<div className='text-sm text-muted-foreground'>
												Phone Number
											</div>
											<div className='font-semibold'>
												{user.phone || 'Not provided'}
											</div>
										</div>

										{user.company && (
											<div className='space-y-2'>
												<div className='text-sm text-muted-foreground'>
													Company
												</div>
												<div className='font-semibold'>
													{user.company}
												</div>
											</div>
										)}

										{bookingData.notes && (
											<div className='space-y-2'>
												<div className='text-sm text-muted-foreground'>
													Special Requests
												</div>
												<div className='text-sm'>
													{bookingData.notes}
												</div>
											</div>
										)}

										<p className='text-xs text-muted-foreground'>
											<Link
												href='/dashboard/profile'
												className='text-primary hover:underline'
											>
												Update profile
											</Link>{' '}
											if any details are incorrect
										</p>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle className='flex items-center gap-2'>
											<CreditCard className='h-5 w-5' />
											Payment Method
										</CardTitle>
									</CardHeader>
									<CardContent className='space-y-4'>
										<div className='flex items-center gap-4'>
											<Badge
												variant='secondary'
												className='text-sm'
											>
												Powered by Paystack
											</Badge>
											<ShieldCheck className='h-5 w-5 text-green-600' />
											<span className='text-sm text-muted-foreground'>
												Secure Payment
											</span>
										</div>

										<p className='text-sm text-muted-foreground'>
											You will be redirected to Paystack
											to complete your payment securely.
											We accept cards, bank transfers, and
											USSD.
										</p>

										<div className='flex flex-wrap gap-2'>
											<Badge variant='outline'>
												Visa
											</Badge>
											<Badge variant='outline'>
												Mastercard
											</Badge>
											<Badge variant='outline'>
												Verve
											</Badge>
											<Badge variant='outline'>
												Bank Transfer
											</Badge>
											<Badge variant='outline'>
												USSD
											</Badge>
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Order Summary */}
							<div className='lg:col-span-1'>
								<Card className='sticky top-20'>
									<CardHeader>
										<CardTitle>Booking Summary</CardTitle>
									</CardHeader>
									<CardContent className='space-y-4'>
										<div>
											<div className='text-sm text-muted-foreground mb-1'>
												Space
											</div>
											<div className='font-semibold'>
												{bookingData.spaceName}
											</div>
										</div>

										<div>
											<div className='text-sm text-muted-foreground mb-1'>
												Date & Time
											</div>
											<div className='space-y-1'>
												<div className='flex items-center gap-2 text-sm'>
													<Calendar className='h-4 w-4' />
													<span className='font-semibold'>
														{format(
															new Date(
																bookingData.date
															),
															'PPP'
														)}
													</span>
												</div>
												<div className='flex items-center gap-2 text-sm'>
													<Clock className='h-4 w-4' />
													<span className='font-semibold'>
														{bookingData.startTime}
													</span>
												</div>
											</div>
										</div>

										<div className='grid grid-cols-2 gap-4'>
											<div>
												<div className='text-sm text-muted-foreground mb-1'>
													Duration
												</div>
												<div className='font-semibold'>
													{bookingData.duration}{' '}
													{bookingData.unit}
												</div>
											</div>
											<div>
												<div className='text-sm text-muted-foreground mb-1'>
													Attendees
												</div>
												<div className='font-semibold'>
													{bookingData.attendees}{' '}
													people
												</div>
											</div>
										</div>

										{bookingData.amenities.length > 0 && (
											<div>
												<div className='text-sm text-muted-foreground mb-2'>
													Amenities
												</div>
												<div className='flex flex-wrap gap-1'>
													{bookingData.amenities.map(
														(amenity, i) => (
															<Badge
																key={i}
																variant='secondary'
																className='text-xs'
															>
																{amenity}
															</Badge>
														)
													)}
												</div>
											</div>
										)}

										<Separator />

										<div className='space-y-2'>
											<div className='flex items-center justify-between text-sm'>
												<span className='text-muted-foreground'>
													Subtotal
												</span>
												<span>
													₦
													{bookingData.total.toLocaleString()}
												</span>
											</div>
											<div className='flex items-center justify-between text-sm'>
												<span className='text-muted-foreground'>
													VAT (7.5%)
												</span>
												<span>
													₦
													{(
														bookingData.total *
														0.075
													).toLocaleString()}
												</span>
											</div>
											<Separator />
											<div className='flex items-center justify-between text-lg font-bold'>
												<span>Total</span>
												<span className='text-primary'>
													₦
													{totalWithVAT.toLocaleString()}
												</span>
											</div>
										</div>

										<Button
											type='submit'
											className='w-full'
											size='lg'
											disabled={isPending}
										>
											{isPending ? (
												<>
													<Loader2 className='mr-2 h-4 w-4 animate-spin' />
													Processing...
												</>
											) : (
												`Pay ₦${totalWithVAT.toLocaleString()}`
											)}
										</Button>

										<p className='text-xs text-center text-muted-foreground'>
											By proceeding, you agree to our
											Terms of Service and Privacy Policy
										</p>
									</CardContent>
								</Card>
							</div>
						</div>
					</form>
				</div>
			</section>
		</div>
	);
}
