'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
	CheckCircle2,
	Download,
	Calendar,
	Mail,
	XCircle,
	Loader2,
} from 'lucide-react';
import { verifyPayment } from '@/actions';

interface VerificationResult {
	verified: boolean;
	message: string;
	bookingNumber?: string;
	spaceName?: string;
	type?: 'booking' | 'subscription';
}

function ConfirmationContent() {
	const searchParams = useSearchParams();
	const bookingId = searchParams.get('id') || '';
	const type = searchParams.get('type') || 'booking'; // 'booking' or 'subscription'
	const reference =
		searchParams.get('reference') || searchParams.get('trxref') || '';

	// Debug: log the URL parameters
	console.log('Confirmation page params:', {
		bookingId,
		type,
		reference,
		allParams: Object.fromEntries(searchParams.entries()),
	});

	const [verifying, setVerifying] = useState(true);
	const [result, setResult] = useState<VerificationResult | null>(null);

	useEffect(() => {
		async function verify() {
			if (!reference) {
				// No payment reference - this might be a direct access or demo mode
				setResult({
					verified: true,
					message: 'Booking confirmed',
					bookingNumber: bookingId,
					type: type as 'booking' | 'subscription',
				});
				setVerifying(false);
				return;
			}

			try {
				const paymentResult = await verifyPayment(reference);

				if (paymentResult.success) {
					const payment = Array.isArray(paymentResult.data)
						? paymentResult.data[0]
						: paymentResult.data;

					setResult({
						verified: true,
						message: 'Payment verified successfully',
						bookingNumber:
							type === 'subscription'
								? payment?.membership?.membershipNumber
								: payment?.booking?.bookingNumber,
						spaceName:
							type === 'subscription'
								? payment?.membership?.space?.name
								: payment?.booking?.space?.name,
						type: type as 'booking' | 'subscription',
					});
				} else {
					setResult({
						verified: false,
						message:
							paymentResult.message ||
							'Payment verification failed',
					});
				}
			} catch (error) {
				console.error('Verification error:', error);
				setResult({
					verified: false,
					message: 'An error occurred while verifying payment',
				});
			} finally {
				setVerifying(false);
			}
		}

		verify();
	}, [reference, bookingId, type]);

	if (verifying) {
		return (
			<div className='min-h-screen bg-background'>
				<section className='bg-primary px-4 py-16 text-center'>
					<div className='container mx-auto max-w-2xl'>
						<div className='flex justify-center mb-6'>
							<div className='flex h-20 w-20 items-center justify-center rounded-full bg-secondary/20'>
								<Loader2 className='h-12 w-12 text-secondary animate-spin' />
							</div>
						</div>
						<h1 className='text-4xl font-bold text-secondary mb-4'>
							Verifying Payment...
						</h1>
						<p className='text-lg text-secondary/80'>
							Please wait while we confirm your payment.
						</p>
					</div>
				</section>
				<section className='px-4 py-12'>
					<div className='container mx-auto max-w-2xl'>
						<Card>
							<CardContent className='p-8 space-y-6'>
								<Skeleton className='h-8 w-full' />
								<Skeleton className='h-20 w-full' />
								<Skeleton className='h-10 w-full' />
							</CardContent>
						</Card>
					</div>
				</section>
			</div>
		);
	}

	if (!result?.verified) {
		return (
			<div className='min-h-screen bg-background'>
				<section className='bg-destructive px-4 py-16 text-center'>
					<div className='container mx-auto max-w-2xl'>
						<div className='flex justify-center mb-6'>
							<div className='flex h-20 w-20 items-center justify-center rounded-full bg-white/20'>
								<XCircle className='h-12 w-12 text-white' />
							</div>
						</div>
						<h1 className='text-4xl font-bold text-white mb-4'>
							Payment Failed
						</h1>
						<p className='text-lg text-white/80'>
							{result?.message ||
								'We could not verify your payment.'}
						</p>
					</div>
				</section>
				<section className='px-4 py-12'>
					<div className='container mx-auto max-w-2xl'>
						<Card>
							<CardContent className='p-8 text-center'>
								<p className='text-muted-foreground mb-6'>
									If you believe this is an error, please
									contact support with your booking reference.
								</p>
								<div className='flex flex-col gap-3'>
									<Button
										size='lg'
										asChild
									>
										<Link href='/spaces'>Try Again</Link>
									</Button>
									<Button
										size='lg'
										variant='outline'
										asChild
									>
										<Link href='/enquiry'>
											Contact Support
										</Link>
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</section>
			</div>
		);
	}

	const isSubscription = result.type === 'subscription';

	return (
		<div className='min-h-screen bg-background'>
			{/* Success Header */}
			<section className='bg-primary px-4 py-16 text-center'>
				<div className='container mx-auto max-w-2xl'>
					<div className='flex justify-center mb-6'>
						<div className='flex h-20 w-20 items-center justify-center rounded-full bg-green-100'>
							<CheckCircle2 className='h-12 w-12 text-green-600' />
						</div>
					</div>
					<h1 className='text-4xl font-bold text-secondary mb-4'>
						{isSubscription
							? 'Subscription Confirmed!'
							: 'Booking Confirmed!'}
					</h1>
					<p className='text-lg text-secondary/80 mb-6'>
						Your payment was successful and your{' '}
						{isSubscription ? 'membership' : 'space'} has been
						confirmed.
					</p>
					<div className='inline-flex items-center gap-2 bg-secondary/10 px-6 py-3 rounded-lg'>
						<span className='text-sm text-secondary/70'>
							{isSubscription ? 'Membership ID:' : 'Booking ID:'}
						</span>
						<span className='font-mono font-bold text-secondary text-lg'>
							{result.bookingNumber || bookingId}
						</span>
					</div>
				</div>
			</section>

			{/* Confirmation Details */}
			<section className='px-4 py-12'>
				<div className='container mx-auto max-w-2xl'>
					<Card>
						<CardContent className='p-8 space-y-6'>
							<div className='text-center pb-6 border-b'>
								<h2 className='text-2xl font-bold mb-2'>
									What's Next?
								</h2>
								<p className='text-muted-foreground'>
									{isSubscription
										? "We've sent a confirmation email with your membership details."
										: "We've sent a confirmation email with all the details and your QR code."}
								</p>
							</div>

							<div className='space-y-4'>
								<div className='flex items-start gap-4'>
									<div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0'>
										<Mail className='h-5 w-5 text-primary' />
									</div>
									<div>
										<h3 className='font-semibold mb-1'>
											Check Your Email
										</h3>
										<p className='text-sm text-muted-foreground'>
											Your confirmation details have been
											sent to your email address.
										</p>
									</div>
								</div>

								{!isSubscription && (
									<div className='flex items-start gap-4'>
										<div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0'>
											<Download className='h-5 w-5 text-primary' />
										</div>
										<div>
											<h3 className='font-semibold mb-1'>
												Save Your QR Code
											</h3>
											<p className='text-sm text-muted-foreground'>
												Present your QR code at
												check-in. You can download it
												from your dashboard.
											</p>
										</div>
									</div>
								)}

								<div className='flex items-start gap-4'>
									<div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0'>
										<Calendar className='h-5 w-5 text-primary' />
									</div>
									<div>
										<h3 className='font-semibold mb-1'>
											{isSubscription
												? 'Start Using Your Space'
												: 'Arrive On Time'}
										</h3>
										<p className='text-sm text-muted-foreground'>
											{isSubscription
												? 'Your membership is now active. Visit us during business hours.'
												: 'Please arrive a few minutes early for a smooth check-in experience.'}
										</p>
									</div>
								</div>
							</div>

							<div className='pt-6 border-t'>
								<h3 className='font-semibold mb-4'>
									{isSubscription
										? 'Membership Details'
										: 'Booking Details'}
								</h3>
								<div className='space-y-3 text-sm'>
									<div className='flex justify-between'>
										<span className='text-muted-foreground'>
											{isSubscription
												? 'Membership ID'
												: 'Booking ID'}
										</span>
										<span className='font-mono font-semibold'>
											{result.bookingNumber || bookingId}
										</span>
									</div>
									{result.spaceName && (
										<div className='flex justify-between'>
											<span className='text-muted-foreground'>
												Space
											</span>
											<span className='font-semibold'>
												{result.spaceName}
											</span>
										</div>
									)}
									<div className='flex justify-between'>
										<span className='text-muted-foreground'>
											Status
										</span>
										<span className='font-semibold text-green-600'>
											{isSubscription
												? 'Active'
												: 'Confirmed'}
										</span>
									</div>
								</div>
							</div>

							<div className='flex flex-col gap-3 pt-4'>
								<Button
									size='lg'
									asChild
								>
									<Link href='/dashboard'>
										{isSubscription
											? 'View Subscriptions'
											: 'View in Dashboard'}
									</Link>
								</Button>
								<Button
									size='lg'
									variant='outline'
									asChild
								>
									<Link href='/spaces'>
										{isSubscription
											? 'Browse More Spaces'
											: 'Book Another Space'}
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Support */}
					<div className='text-center mt-8'>
						<p className='text-sm text-muted-foreground mb-2'>
							Need help with your{' '}
							{isSubscription ? 'subscription' : 'booking'}?
						</p>
						<Button
							variant='link'
							asChild
						>
							<Link href='/enquiry'>Contact Support</Link>
						</Button>
					</div>
				</div>
			</section>
		</div>
	);
}

export default function ConfirmationPage() {
	return (
		<Suspense
			fallback={
				<div className='min-h-screen bg-background flex items-center justify-center'>
					<Loader2 className='h-8 w-8 animate-spin text-primary' />
				</div>
			}
		>
			<ConfirmationContent />
		</Suspense>
	);
}
