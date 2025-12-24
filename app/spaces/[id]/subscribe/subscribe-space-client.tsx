'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Users,
	Calendar,
	ArrowLeft,
	LogIn,
	User,
	CheckCircle2,
	Check,
} from 'lucide-react';
import type { SpaceWithPricing } from '@/actions/spaces';
import { useBookingStore } from '@/store/booking-store';
import { useAuth } from '@/hooks/use-auth';

interface SubscribeSpaceClientProps {
	space: SpaceWithPricing;
}

export default function SubscribeSpaceClient({
	space,
}: SubscribeSpaceClientProps) {
	const router = useRouter();
	const { user, isLoading: authLoading, isAuthenticated } = useAuth();
	const setSubscriptionData = useBookingStore(
		(state) => state.setSubscriptionData
	);

	// State
	const [selectedPlanId, setSelectedPlanId] = useState<string>(
		space.pricingPlans[0]?.id || ''
	);
	const [notes, setNotes] = useState('');
	const [showLoginDialog, setShowLoginDialog] = useState(false);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);

	// Get selected plan
	const selectedPlan = space.pricingPlans.find(
		(p) => p.id === selectedPlanId
	);

	const formatPrice = (kobo: number) => {
		return `₦${(kobo / 100).toLocaleString()}`;
	};

	const getPlanDuration = (unit: string) => {
		switch (unit.toLowerCase()) {
			case 'day':
				return 'Daily';
			case 'week':
				return 'Weekly';
			case 'month':
				return 'Monthly';
			default:
				return unit;
		}
	};

	const handleProceedToPayment = () => {
		if (!isAuthenticated) {
			setShowLoginDialog(true);
			return;
		}

		if (!selectedPlan) return;
		setShowConfirmDialog(true);
	};

	const handleConfirmSubscription = () => {
		if (!selectedPlan || !user) return;

		// Set subscription data in store
		setSubscriptionData({
			type: 'subscription',
			spaceId: space.id,
			spaceName: space.name,
			planId: selectedPlan.id,
			planName: selectedPlan.name,
			unit: selectedPlan.unit, // Pass the unit to determine membership type
			amount: selectedPlan.price / 100,
			capacity: space.capacity,
			amenities: space.amenities || [],
			notes: notes || undefined,
		});

		setShowConfirmDialog(false);
		router.push('/subscription/payment');
	};

	// Sort plans by price
	const sortedPlans = [...space.pricingPlans].sort(
		(a, b) => a.price - b.price
	);

	return (
		<div className='min-h-screen bg-background'>
			{/* Back Button */}
			<section className='px-4 py-4 border-b'>
				<div className='container mx-auto'>
					<Button
						variant='ghost'
						asChild
					>
						<Link href='/spaces'>
							<ArrowLeft className='mr-2 h-4 w-4' />
							Back to Spaces
						</Link>
					</Button>
				</div>
			</section>

			{/* Main Content */}
			<section className='px-4 py-8'>
				<div className='container mx-auto'>
					<div className='grid gap-8 lg:grid-cols-3'>
						{/* Left Column - Space Info */}
						<div className='lg:col-span-1'>
							<Card className='sticky top-4 pt-0'>
								<div className='relative aspect-4/3 rounded-t-lg overflow-hidden'>
									<Image
										src={
											space.images?.[0] ||
											'/placeholder.svg'
										}
										alt={space.name}
										fill
										className='object-cover'
									/>
									<Badge className='absolute top-3 left-3 bg-primary text-primary-foreground'>
										Subscription
									</Badge>
								</div>
								<CardContent className='p-6'>
									<h1 className='text-2xl font-bold mb-2'>
										{space.name}
									</h1>
									<p className='text-muted-foreground text-sm mb-4'>
										{space.description}
									</p>

									<div className='space-y-3 text-sm'>
										<div className='flex items-center gap-2'>
											<Users className='h-4 w-4 text-primary' />
											<span>
												{space.capacity === 1
													? '1 person'
													: `Up to ${space.capacity} people`}
											</span>
										</div>
										<div className='flex items-center gap-2'>
											<Calendar className='h-4 w-4 text-primary' />
											<span>
												Flexible plans available
											</span>
										</div>
									</div>

									{space.amenities &&
										space.amenities.length > 0 && (
											<>
												<Separator className='my-4' />
												<div>
													<p className='font-medium mb-2'>
														Amenities
													</p>
													<div className='flex flex-wrap gap-1'>
														{space.amenities
															.slice(0, 5)
															.map(
																(
																	amenity,
																	i
																) => (
																	<Badge
																		key={i}
																		variant='outline'
																		className='text-xs'
																	>
																		{
																			amenity
																		}
																	</Badge>
																)
															)}
														{space.amenities
															.length > 5 && (
															<Badge
																variant='outline'
																className='text-xs'
															>
																+
																{space.amenities
																	.length -
																	5}{' '}
																more
															</Badge>
														)}
													</div>
												</div>
											</>
										)}

									{space.features &&
										space.features.length > 0 && (
											<>
												<Separator className='my-4' />
												<div>
													<p className='font-medium mb-2'>
														Includes
													</p>
													<ul className='space-y-1'>
														{space.features
															.slice(0, 4)
															.map(
																(
																	feature,
																	i
																) => (
																	<li
																		key={i}
																		className='flex items-start gap-2 text-sm'
																	>
																		<Check className='h-4 w-4 text-primary shrink-0 mt-0.5' />
																		<span>
																			{
																				feature
																			}
																		</span>
																	</li>
																)
															)}
														{space.features.length >
															4 && (
															<li className='text-xs text-muted-foreground pl-6'>
																+
																{space.features
																	.length -
																	4}{' '}
																more features
															</li>
														)}
													</ul>
												</div>
											</>
										)}
								</CardContent>
							</Card>
						</div>

						{/* Right Column - Plan Selection */}
						<div className='lg:col-span-2 space-y-6'>
							<Card>
								<CardHeader>
									<CardTitle>Select Your Plan</CardTitle>
								</CardHeader>
								<CardContent>
									<RadioGroup
										value={selectedPlanId}
										onValueChange={setSelectedPlanId}
										className='space-y-4'
									>
										{sortedPlans.map((plan) => (
											<div
												key={plan.id}
												className={`relative flex items-start gap-4 rounded-lg border-2 p-4 cursor-pointer transition-all ${
													selectedPlanId === plan.id
														? 'border-primary bg-primary/5'
														: 'border-border hover:border-primary/50'
												}`}
												onClick={() =>
													setSelectedPlanId(plan.id)
												}
											>
												<RadioGroupItem
													value={plan.id}
													id={plan.id}
													className='mt-1'
												/>
												<div className='flex-1'>
													<label
														htmlFor={plan.id}
														className='font-medium cursor-pointer'
													>
														{plan.name}
													</label>
													<p className='text-sm text-muted-foreground'>
														{getPlanDuration(
															plan.unit
														)}{' '}
														subscription
													</p>
													{plan.description && (
														<p className='text-sm text-muted-foreground mt-1'>
															{plan.description}
														</p>
													)}
												</div>
												<div className='text-right'>
													<p className='text-2xl font-bold text-primary'>
														{formatPrice(
															plan.price
														)}
													</p>
													<p className='text-sm text-muted-foreground'>
														per {plan.unit}
													</p>
												</div>
											</div>
										))}
									</RadioGroup>

									{/* Notes */}
									<div className='mt-6'>
										<Label
											htmlFor='notes'
											className='mb-3 block'
										>
											Additional Notes (Optional)
										</Label>
										<Textarea
											id='notes'
											value={notes}
											onChange={(e) =>
												setNotes(e.target.value)
											}
											placeholder='Any special requirements or preferences?'
											rows={3}
										/>
									</div>
								</CardContent>
							</Card>

							{/* Summary Card */}
							{selectedPlan && (
								<Card>
									<CardHeader>
										<CardTitle>
											Subscription Summary
										</CardTitle>
									</CardHeader>
									<CardContent className='space-y-4'>
										<div className='flex justify-between'>
											<span className='text-muted-foreground'>
												Space
											</span>
											<span className='font-medium'>
												{space.name}
											</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-muted-foreground'>
												Plan
											</span>
											<span className='font-medium'>
												{selectedPlan.name}
											</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-muted-foreground'>
												Duration
											</span>
											<span className='font-medium'>
												{getPlanDuration(
													selectedPlan.unit
												)}
											</span>
										</div>
										<Separator />
										<div className='flex justify-between text-lg font-bold'>
											<span>Total</span>
											<span className='text-primary'>
												{formatPrice(
													selectedPlan.price
												)}
											</span>
										</div>

										<Button
											className='w-full'
											size='lg'
											onClick={handleProceedToPayment}
										>
											Proceed to Payment
										</Button>
									</CardContent>
								</Card>
							)}
						</div>
					</div>
				</div>
			</section>

			{/* Business Hours Info */}
			<section className='px-4 py-8 bg-muted/50'>
				<div className='container mx-auto'>
					<Card>
						<CardContent className='p-6'>
							<h3 className='font-bold text-lg mb-4'>
								Access Hours
							</h3>
							<p className='text-sm text-muted-foreground mb-4'>
								As a subscriber, you have access during our
								business hours:
							</p>
							<div className='grid gap-4 sm:grid-cols-3'>
								<div>
									<p className='font-medium'>
										Monday - Friday
									</p>
									<p className='text-muted-foreground'>
										9:00 AM - 6:00 PM
									</p>
								</div>
								<div>
									<p className='font-medium'>Saturday</p>
									<p className='text-muted-foreground'>
										11:00 AM - 4:00 PM
									</p>
								</div>
								<div>
									<p className='font-medium'>Sunday</p>
									<p className='text-muted-foreground'>
										Closed
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</section>

			{/* Login Dialog */}
			<Dialog
				open={showLoginDialog}
				onOpenChange={setShowLoginDialog}
			>
				<DialogContent className='sm:max-w-100'>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2'>
							<LogIn className='h-5 w-5' />
							Sign In Required
						</DialogTitle>
						<DialogDescription>
							You need to be signed in to subscribe to this space.
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4 pt-4'>
						<p className='text-sm text-muted-foreground'>
							Your profile information will be used for the
							subscription.
						</p>
						<div className='flex flex-col gap-3'>
							<Button asChild>
								<Link
									href={`/login?redirect=/spaces/${space.slug}/subscribe`}
								>
									<LogIn className='mr-2 h-4 w-4' />
									Sign In
								</Link>
							</Button>
							<Button
								variant='outline'
								asChild
							>
								<Link
									href={`/register?redirect=/spaces/${space.slug}/subscribe`}
								>
									Create Account
								</Link>
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Confirmation Dialog */}
			<Dialog
				open={showConfirmDialog}
				onOpenChange={setShowConfirmDialog}
			>
				<DialogContent className='sm:max-w-125'>
					<DialogHeader>
						<DialogTitle>Confirm Subscription</DialogTitle>
						<DialogDescription>
							Review your subscription details before proceeding
							to payment.
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4 pt-4'>
						{/* User Info */}
						<div className='p-4 bg-muted rounded-lg'>
							<div className='flex items-center gap-2 mb-3'>
								<User className='h-4 w-4 text-muted-foreground' />
								<span className='text-sm font-medium'>
									Your Information
								</span>
							</div>
							{authLoading ? (
								<div className='space-y-2'>
									<Skeleton className='h-4 w-32' />
									<Skeleton className='h-4 w-48' />
								</div>
							) : user ? (
								<div className='space-y-1 text-sm'>
									<p>
										<span className='text-muted-foreground'>
											Name:
										</span>{' '}
										{user.name}
									</p>
									<p>
										<span className='text-muted-foreground'>
											Email:
										</span>{' '}
										{user.email}
									</p>
									{user.phone && (
										<p>
											<span className='text-muted-foreground'>
												Phone:
											</span>{' '}
											{user.phone}
										</p>
									)}
								</div>
							) : null}
						</div>

						{/* Subscription Details */}
						{selectedPlan && (
							<div className='p-4 border rounded-lg space-y-2'>
								<div className='flex justify-between'>
									<span className='text-sm text-muted-foreground'>
										Space
									</span>
									<span className='font-medium'>
										{space.name}
									</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-sm text-muted-foreground'>
										Plan
									</span>
									<span>{selectedPlan.name}</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-sm text-muted-foreground'>
										Duration
									</span>
									<span>
										{getPlanDuration(selectedPlan.unit)}
									</span>
								</div>
								<Separator />
								<div className='flex justify-between font-bold'>
									<span>Total</span>
									<span className='text-primary'>
										{formatPrice(selectedPlan.price)}
									</span>
								</div>
							</div>
						)}

						<div className='flex justify-end gap-3'>
							<Button
								variant='outline'
								onClick={() => setShowConfirmDialog(false)}
							>
								Cancel
							</Button>
							<Button onClick={handleConfirmSubscription}>
								<CheckCircle2 className='mr-2 h-4 w-4' />
								Confirm & Pay
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
