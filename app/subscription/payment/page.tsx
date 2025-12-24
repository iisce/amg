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
	Loader2,
	User,
	LogIn,
} from 'lucide-react';
import { toast } from 'sonner';
import { useBookingStore } from '@/store/booking-store';
import { useAuth } from '@/hooks/use-auth';
import { createSubscription, initializePayment } from '@/actions';

export default function SubscriptionPaymentPage() {
	const router = useRouter();
	const { user, isLoading: authLoading, isAuthenticated } = useAuth();
	const subscriptionData = useBookingStore((state) => state.subscriptionData);
	const clearData = useBookingStore((state) => state.clearData);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		if (!subscriptionData) {
			router.push('/spaces');
		}
	}, [subscriptionData, router]);

	// Redirect to login if not authenticated
	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			router.push('/login?redirect=/subscription/payment');
		}
	}, [authLoading, isAuthenticated, router]);

	if (!subscriptionData) {
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
						<h2 className='text-xl font-bold mb-2'>
							Sign In Required
						</h2>
						<p className='text-muted-foreground mb-6'>
							Please sign in to complete your subscription.
						</p>
						<Button
							asChild
							className='w-full'
						>
							<Link href='/login?redirect=/subscription/payment'>
								Sign In
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	const totalWithVAT = subscriptionData.amount * 1.075;

	const handlePayment = (e: React.FormEvent) => {
		e.preventDefault();

		if (!user) {
			toast.error('Please sign in to continue');
			return;
		}

		startTransition(async () => {
			try {
				// Determine membership type based on plan unit (from pricing plan)
				const unitLower = (
					subscriptionData.unit || 'month'
				).toLowerCase();
				let membershipType:
					| 'DAILY'
					| 'WEEKLY'
					| 'MONTHLY'
					| 'QUARTERLY'
					| 'ANNUAL' = 'MONTHLY';

				if (unitLower === 'day' || unitLower === 'daily') {
					membershipType = 'DAILY';
				} else if (unitLower === 'week' || unitLower === 'weekly') {
					membershipType = 'WEEKLY';
				} else if (
					unitLower === 'quarter' ||
					unitLower === 'quarterly'
				) {
					membershipType = 'QUARTERLY';
				} else if (unitLower === 'year' || unitLower === 'annual') {
					membershipType = 'ANNUAL';
				}

				// Create the subscription in the database (user info from session)
				const subscriptionResult = await createSubscription({
					spaceId: subscriptionData.spaceId,
					pricingPlanId: subscriptionData.planId,
					type: membershipType,
					startDate: new Date(),
					// Contact info comes from authenticated user's profile
					contactName: user.name,
					contactEmail: user.email,
					contactPhone: user.phone || undefined,
				});

				if (!subscriptionResult.success) {
					toast.error(
						subscriptionResult.message ||
							'Failed to create subscription'
					);
					return;
				}

				// Get the subscription data
				const subscription = Array.isArray(subscriptionResult.data)
					? subscriptionResult.data[0]
					: subscriptionResult.data;

				if (!subscription) {
					toast.error('Subscription created but no data returned');
					return;
				}

				// Initialize Paystack payment
				const paymentResult = await initializePayment({
					amount: Math.round(totalWithVAT * 100), // Convert to kobo
					membershipId: subscription.id,
					callbackUrl: `${window.location.origin}/booking/confirmation?id=${subscription.membershipNumber}&type=subscription`,
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
					// For demo purposes, redirect to confirmation with the membership number
					toast.success('Subscription created successfully!');
					clearData();
					router.push(
						`/booking/confirmation?id=${subscription.membershipNumber}&type=subscription`
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
						<Link href='/spaces'>
							<ArrowLeft className='mr-2 h-4 w-4' />
							Back to Spaces
						</Link>
					</Button>
					<h1 className='text-3xl font-bold text-secondary sm:text-4xl mb-2'>
						Subscription Payment
					</h1>
					<p className='text-secondary/80'>
						Complete your subscription with secure payment
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
										<CardTitle>
											Subscription Summary
										</CardTitle>
									</CardHeader>
									<CardContent className='space-y-4'>
										<div>
											<div className='text-sm text-muted-foreground mb-1'>
												Space
											</div>
											<div className='font-semibold'>
												{subscriptionData.spaceName}
											</div>
										</div>

										<div>
											<div className='text-sm text-muted-foreground mb-1'>
												Plan
											</div>
											<div className='font-semibold'>
												{subscriptionData.planName}
											</div>
										</div>

										{subscriptionData.capacity && (
											<div>
												<div className='text-sm text-muted-foreground mb-1'>
													Capacity
												</div>
												<div className='font-semibold'>
													{subscriptionData.capacity}{' '}
													{subscriptionData.capacity ===
													1
														? 'person'
														: 'people'}
												</div>
											</div>
										)}

										{subscriptionData.amenities.length >
											0 && (
											<div>
												<div className='text-sm text-muted-foreground mb-2'>
													Amenities
												</div>
												<div className='flex flex-wrap gap-1'>
													{subscriptionData.amenities.map(
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
													{subscriptionData.amount.toLocaleString()}
												</span>
											</div>
											<div className='flex items-center justify-between text-sm'>
												<span className='text-muted-foreground'>
													VAT (7.5%)
												</span>
												<span>
													₦
													{(
														subscriptionData.amount *
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
