'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Users,
	Clock,
	CheckCircle2,
	ArrowLeft,
	CalendarIcon,
	LogIn,
	User,
} from 'lucide-react';
import { format } from 'date-fns';
import type { SpaceWithPricing } from '@/actions/spaces';
import { useBookingStore } from '@/store/booking-store';
import { useAuth } from '@/hooks/use-auth';

interface SpaceDetailsClientProps {
	space: SpaceWithPricing;
}

export default function SpaceDetailsClient({ space }: SpaceDetailsClientProps) {
	const router = useRouter();
	const { user, isLoading: authLoading, isAuthenticated } = useAuth();
	const setSubscriptionData = useBookingStore(
		(state) => state.setSubscriptionData
	);
	const setBookingData = useBookingStore((state) => state.setBookingData);

	const [selectedDate, setSelectedDate] = useState<Date>();
	const [selectedSlot, setSelectedSlot] = useState('');
	const [selectedPlan, setSelectedPlan] = useState(0);
	const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);
	const [showLoginDialog, setShowLoginDialog] = useState(false);
	const [notes, setNotes] = useState('');

	// Amenities and features are already arrays in the database
	const amenities = space.amenities || [];
	const features = space.features || [];

	// Images array from database
	const gallery =
		space.images && space.images.length > 0
			? space.images
			: ['/placeholder.svg'];

	// Get available time slots from database
	const availableSlots = space.timeSlots?.map((slot) => slot.startTime) || [];

	const handleSubscribe = () => {
		if (!isAuthenticated) {
			setShowLoginDialog(true);
			return;
		}
		setShowSubscribeDialog(true);
	};

	const handleSubscribeConfirm = () => {
		if (!isAuthenticated || !user) {
			setShowLoginDialog(true);
			return;
		}

		const plan = space.pricingPlans[selectedPlan];

		// Set subscription data in store (contact info comes from user profile)
		setSubscriptionData({
			type: 'subscription',
			spaceId: space.id,
			spaceName: space.name,
			planId: plan.id,
			planName: plan.name,
			unit: plan.unit,
			amount: plan.price / 100, // Convert kobo to naira for display
			capacity: space.capacity,
			amenities: space.amenities || [],
			notes: notes || undefined,
		});

		setShowSubscribeDialog(false);
		// Navigate to payment page
		router.push('/subscription/payment');
	};

	const handleBooking = () => {
		if (!isAuthenticated) {
			setShowLoginDialog(true);
			return;
		}

		if (!selectedDate || !selectedSlot) return;

		const plan = space.pricingPlans[0];

		// Calculate end time (1 hour after start)
		const [hours, minutes] = selectedSlot.split(':').map(Number);
		const endHour = String(hours + 1).padStart(2, '0');
		const endTime = `${endHour}:${String(minutes).padStart(2, '0')}`;

		// Set booking data in store
		setBookingData({
			type: 'booking',
			spaceId: space.id,
			spaceName: space.name,
			planId: plan.id,
			planName: plan.name,
			date: selectedDate.toISOString(),
			startTime: selectedSlot,
			endTime: endTime,
			duration: 1,
			unit: plan.unit,
			attendees: 1,
			rate: plan.price / 100,
			total: plan.price / 100,
			amenities: space.amenities || [],
		});

		router.push('/booking/payment');
	};

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

			{/* Hero Image */}
			<section className='px-4 py-8'>
				<div className='container mx-auto'>
					<div className='grid gap-6 lg:grid-cols-2 lg:gap-12'>
						<div className='space-y-4'>
							<div className='relative aspect-[4/3] rounded-lg overflow-hidden'>
								<Image
									src={gallery[0] || '/placeholder.svg'}
									alt={space.name}
									fill
									className='object-cover'
									priority
								/>
							</div>
							{gallery.length > 1 && (
								<div className='grid grid-cols-3 gap-2'>
									{gallery.slice(1).map((img, idx) => (
										<div
											key={idx}
											className='relative aspect-[4/3] rounded-lg overflow-hidden'
										>
											<Image
												src={img || '/placeholder.svg'}
												alt={`${space.name} ${idx + 2}`}
												fill
												className='object-cover'
											/>
										</div>
									))}
								</div>
							)}
						</div>

						<div className='space-y-6'>
							<div>
								<div className='flex gap-2 mb-3'>
									<Badge className='bg-primary'>
										{space.category}
									</Badge>
									<Badge
										variant={
											space.type === 'SUBSCRIPTION'
												? 'default'
												: 'secondary'
										}
									>
										{space.type === 'SUBSCRIPTION'
											? 'Subscription'
											: 'Booking'}
									</Badge>
									{space.isActive && (
										<Badge variant='outline'>
											Available
										</Badge>
									)}
								</div>
								<h1 className='text-3xl font-bold tracking-tight text-secondary sm:text-4xl mb-4'>
									{space.name}
								</h1>
								<p className='text-lg text-muted-foreground'>
									{space.description}
								</p>
							</div>

							<div className='flex flex-wrap gap-6 text-sm'>
								<div className='flex items-center gap-2'>
									<Users className='h-5 w-5 text-primary' />
									<div>
										<div className='font-semibold'>
											Capacity
										</div>
										<div className='text-muted-foreground'>
											Up to {space.capacity} people
										</div>
									</div>
								</div>
								<div className='flex items-center gap-2'>
									<Clock className='h-5 w-5 text-primary' />
									<div>
										<div className='font-semibold'>
											Availability
										</div>
										<div className='text-muted-foreground'>
											{space.type === 'SUBSCRIPTION'
												? 'Monthly Plans'
												: 'Hourly/Daily'}
										</div>
									</div>
								</div>
							</div>

							<Separator />

							{space.type === 'SUBSCRIPTION' ? (
								// Subscription UI
								<Card>
									<CardContent className='p-6'>
										<h3 className='font-semibold text-lg mb-4'>
											Subscription Plans
										</h3>
										<div className='space-y-3 mb-4'>
											{space.pricingPlans.map(
												(plan, idx) => (
													<div
														key={plan.id}
														className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-colors ${
															selectedPlan === idx
																? 'border-primary bg-primary/5'
																: 'border-border hover:border-primary/50'
														}`}
														onClick={() =>
															setSelectedPlan(idx)
														}
													>
														<span className='font-medium'>
															{plan.name}
														</span>
														<span className='font-bold text-xl text-primary'>
															₦
															{(
																plan.price / 100
															).toLocaleString()}
															/
															{plan.type.toLowerCase()}
														</span>
													</div>
												)
											)}
										</div>
										<Button
											className='w-full'
											size='lg'
											onClick={handleSubscribe}
										>
											Subscribe Now
										</Button>
									</CardContent>
								</Card>
							) : (
								// Booking UI with available slots
								<Card>
									<CardContent className='p-6'>
										<h3 className='font-semibold text-lg mb-4'>
											Book This Space
										</h3>

										<div className='space-y-4 mb-4'>
											<div>
												<label className='text-sm font-medium mb-2 block'>
													Select Date
												</label>
												<Popover>
													<PopoverTrigger asChild>
														<Button
															variant='outline'
															className='w-full justify-start text-left font-normal bg-transparent'
														>
															<CalendarIcon className='mr-2 h-4 w-4' />
															{selectedDate
																? format(
																		selectedDate,
																		'PPP'
																  )
																: 'Pick a date'}
														</Button>
													</PopoverTrigger>
													<PopoverContent
														className='w-auto p-0'
														align='start'
													>
														<Calendar
															mode='single'
															selected={
																selectedDate
															}
															onSelect={
																setSelectedDate
															}
															disabled={(date) =>
																date <
																new Date()
															}
															initialFocus
														/>
													</PopoverContent>
												</Popover>
											</div>

											{selectedDate &&
												availableSlots.length > 0 && (
													<div>
														<label className='text-sm font-medium mb-2 block'>
															Available Time Slots
														</label>
														<div className='grid grid-cols-3 gap-2'>
															{availableSlots.map(
																(slot) => (
																	<Button
																		key={
																			slot
																		}
																		variant={
																			selectedSlot ===
																			slot
																				? 'default'
																				: 'outline'
																		}
																		className='w-full'
																		onClick={() =>
																			setSelectedSlot(
																				slot
																			)
																		}
																	>
																		{slot}
																	</Button>
																)
															)}
														</div>
													</div>
												)}

											<div className='border-t pt-4'>
												<div className='flex items-center justify-between text-lg font-bold'>
													<span>Price</span>
													<span className='text-primary'>
														₦
														{space.pricingPlans[0]
															? (
																	space
																		.pricingPlans[0]
																		.price /
																	100
															  ).toLocaleString()
															: '0'}
													</span>
												</div>
											</div>
										</div>

										<Button
											className='w-full'
											size='lg'
											onClick={handleBooking}
											disabled={
												!selectedDate || !selectedSlot
											}
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

			{/* Amenities & Features */}
			{(amenities.length > 0 || features.length > 0) && (
				<section className='px-4 py-12 bg-muted/50'>
					<div className='container mx-auto'>
						<div className='grid gap-8 md:grid-cols-2'>
							{amenities.length > 0 && (
								<div>
									<h2 className='text-2xl font-bold mb-6'>
										Amenities
									</h2>
									<div className='grid gap-3'>
										{amenities.map(
											(amenity: string, idx: number) => (
												<div
													key={idx}
													className='flex items-center gap-3'
												>
													<CheckCircle2 className='h-5 w-5 text-primary shrink-0' />
													<span>{amenity}</span>
												</div>
											)
										)}
									</div>
								</div>
							)}

							{features.length > 0 && (
								<div>
									<h2 className='text-2xl font-bold mb-6'>
										Features
									</h2>
									<div className='grid gap-3'>
										{features.map(
											(feature: string, idx: number) => (
												<div
													key={idx}
													className='flex items-center gap-3'
												>
													<CheckCircle2 className='h-5 w-5 text-primary shrink-0' />
													<span>{feature}</span>
												</div>
											)
										)}
									</div>
								</div>
							)}
						</div>
					</div>
				</section>
			)}

			{/* CTA Section */}
			<section className='px-4 py-12'>
				<div className='container mx-auto'>
					<Card className='bg-primary text-primary-foreground'>
						<CardContent className='p-8 text-center'>
							<h2 className='text-2xl font-bold mb-4 text-secondary'>
								Ready to Book?
							</h2>
							<p className='text-secondary/80 mb-6 max-w-2xl mx-auto'>
								Reserve your spot today and experience the AMG
								Workspace difference.
							</p>
							<div className='flex flex-col gap-3 sm:flex-row justify-center'>
								<Button
									size='lg'
									asChild
									className='bg-secondary text-secondary-foreground hover:bg-secondary/90'
								>
									<Link href='/spaces'>
										Browse All Spaces
									</Link>
								</Button>
								<Button
									size='lg'
									variant='outline'
									asChild
									className='border-secondary text-secondary hover:bg-secondary/10 bg-transparent'
								>
									<Link href='/enquiry'>Make an Enquiry</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</section>

			{/* Login Required Dialog */}
			<Dialog
				open={showLoginDialog}
				onOpenChange={setShowLoginDialog}
			>
				<DialogContent className='sm:max-w-[400px]'>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2'>
							<LogIn className='h-5 w-5' />
							Sign In Required
						</DialogTitle>
						<DialogDescription>
							You need to be signed in to{' '}
							{space.type === 'SUBSCRIPTION'
								? 'subscribe to'
								: 'book'}{' '}
							this space.
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4 pt-4'>
						<p className='text-sm text-muted-foreground'>
							Your profile information will be used for the{' '}
							{space.type === 'SUBSCRIPTION'
								? 'subscription'
								: 'booking'}
							.
						</p>
						<div className='flex flex-col gap-3'>
							<Button asChild>
								<Link
									href={`/login?redirect=/spaces/${
										space.slug || space.id
									}`}
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
									href={`/register?redirect=/spaces/${
										space.slug || space.id
									}`}
								>
									Create Account
								</Link>
							</Button>
						</div>
						<p className='text-xs text-muted-foreground text-center'>
							Have questions?{' '}
							<Link
								href='/enquiry'
								className='text-primary hover:underline'
							>
								Send us an enquiry
							</Link>
						</p>
					</div>
				</DialogContent>
			</Dialog>

			{/* Subscribe Confirmation Dialog */}
			<Dialog
				open={showSubscribeDialog}
				onOpenChange={setShowSubscribeDialog}
			>
				<DialogContent className='sm:max-w-[500px]'>
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

						{/* Plan Info */}
						<div className='p-4 border rounded-lg'>
							<div className='flex justify-between items-center'>
								<div>
									<p className='font-medium'>{space.name}</p>
									<p className='text-sm text-muted-foreground'>
										{space.pricingPlans[selectedPlan]?.name}
									</p>
								</div>
								<p className='text-xl font-bold text-primary'>
									₦
									{(
										(space.pricingPlans[selectedPlan]
											?.price || 0) / 100
									).toLocaleString()}
								</p>
							</div>
						</div>

						{/* Notes */}
						<div className='space-y-2'>
							<Label htmlFor='notes'>
								Additional Notes (Optional)
							</Label>
							<Textarea
								id='notes'
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								placeholder='Any special requests or questions?'
								rows={3}
							/>
						</div>

						<div className='flex justify-end gap-3'>
							<Button
								type='button'
								variant='outline'
								onClick={() => setShowSubscribeDialog(false)}
							>
								Cancel
							</Button>
							<Button onClick={handleSubscribeConfirm}>
								Proceed to Payment
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
