'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
	Users,
	Clock,
	ArrowLeft,
	LogIn,
	User,
	CheckCircle2,
	AlertCircle,
} from 'lucide-react';
import { format, addDays, isSameDay, startOfDay } from 'date-fns';
import type { SpaceWithPricing } from '@/actions/spaces';
import { getBookedSlots } from '@/actions/bookings';
import { useBookingStore } from '@/store/booking-store';
import { useAuth } from '@/hooks/use-auth';
import {
	getBusinessHours,
	getAvailableTimeSlots,
	getDurationOptions,
	calculateEndTime,
	isPastDate,
	isPastTime,
	timeToDate,
	type TimeSlot,
} from '@/lib/utils/business-hours';

interface BookSpaceClientProps {
	space: SpaceWithPricing;
}

export default function BookSpaceClient({ space }: BookSpaceClientProps) {
	const router = useRouter();
	const { user, isLoading: authLoading, isAuthenticated } = useAuth();
	const setBookingData = useBookingStore((state) => state.setBookingData);

	// State
	const [selectedDate, setSelectedDate] = useState<Date | undefined>();
	const [selectedSlot, setSelectedSlot] = useState<string>('');
	const [selectedDuration, setSelectedDuration] = useState<number>(1);
	const [attendees, setAttendees] = useState<number>(1);
	const [notes, setNotes] = useState('');
	const [showLoginDialog, setShowLoginDialog] = useState(false);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);

	// Availability state
	const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
	const [loadingSlots, setLoadingSlots] = useState(false);
	const [bookedSlots, setBookedSlots] = useState<
		{ startTime: string; endTime: string }[]
	>([]);

	// Check if this is full workspace (can only book on Saturdays)
	const isFullWorkspace =
		space.name.toLowerCase().includes('full workspace') ||
		space.slug?.includes('full-workspace');

	// Get the selected pricing plan (first hourly plan)
	const pricingPlan =
		space.pricingPlans.find((p) => p.unit === 'hour') ||
		space.pricingPlans[0];

	// Fetch booked slots when date changes
	const fetchAvailability = useCallback(async () => {
		if (!selectedDate) {
			setAvailableSlots([]);
			return;
		}

		setLoadingSlots(true);
		try {
			const booked = await getBookedSlots(space.id, selectedDate);
			setBookedSlots(booked);

			const slots = getAvailableTimeSlots(
				selectedDate,
				booked,
				selectedDuration
			);

			// Filter out past times if date is today
			const now = new Date();
			const filteredSlots = slots.map((slot) => {
				if (
					isSameDay(selectedDate, now) &&
					isPastTime(selectedDate, slot.time)
				) {
					return { ...slot, available: false };
				}
				return slot;
			});

			setAvailableSlots(filteredSlots);
		} catch (error) {
			console.error('Failed to fetch availability:', error);
			setAvailableSlots([]);
		} finally {
			setLoadingSlots(false);
		}
	}, [selectedDate, selectedDuration, space.id]);

	useEffect(() => {
		fetchAvailability();
	}, [fetchAvailability]);

	// Reset slot when duration changes (need to recheck availability)
	useEffect(() => {
		setSelectedSlot('');
	}, [selectedDuration]);

	// Get duration options based on selected slot
	const durationOptions =
		selectedDate && selectedSlot
			? getDurationOptions(selectedDate, selectedSlot, 8).filter((d) => {
					// Check if this duration is available (no conflicts)
					const endTime = calculateEndTime(selectedSlot, d);
					const slotStart = timeToDate(selectedDate, selectedSlot);
					const slotEnd = timeToDate(selectedDate, endTime);

					return !bookedSlots.some((booked) => {
						const bookedStart = new Date(booked.startTime);
						const bookedEnd = new Date(booked.endTime);
						return slotStart < bookedEnd && slotEnd > bookedStart;
					});
			  })
			: [1, 2, 3, 4, 5, 6, 7, 8];

	// Calculate total price
	const totalPrice = pricingPlan
		? (pricingPlan.price / 100) * selectedDuration
		: 0;

	// Get business hours for selected date
	const businessHours = selectedDate ? getBusinessHours(selectedDate) : null;

	// Date disabled function for calendar
	const isDateDisabled = (date: Date) => {
		// Past dates
		if (isPastDate(date)) return true;

		// Sundays
		if (date.getDay() === 0) return true;

		// Full workspace - only Saturdays
		if (isFullWorkspace && date.getDay() !== 6) return true;

		return false;
	};

	const handleProceedToPayment = () => {
		if (!isAuthenticated) {
			setShowLoginDialog(true);
			return;
		}

		if (!selectedDate || !selectedSlot || !pricingPlan) return;

		setShowConfirmDialog(true);
	};

	const handleConfirmBooking = () => {
		if (!selectedDate || !selectedSlot || !pricingPlan || !user) return;

		const endTime = calculateEndTime(selectedSlot, selectedDuration);

		// Set booking data in store
		setBookingData({
			type: 'booking',
			spaceId: space.id,
			spaceName: space.name,
			planId: pricingPlan.id,
			planName: pricingPlan.name,
			date: startOfDay(selectedDate).toISOString(),
			startTime: selectedSlot,
			endTime: endTime,
			duration: selectedDuration,
			unit: pricingPlan.unit,
			attendees: attendees,
			rate: pricingPlan.price / 100,
			total: totalPrice,
			amenities: space.amenities || [],
			notes: notes || undefined,
		});

		setShowConfirmDialog(false);
		router.push('/booking/payment');
	};

	const formatPrice = (amount: number) => {
		return `₦${amount.toLocaleString()}`;
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
									<Badge className='absolute top-3 left-3 bg-secondary text-secondary-foreground'>
										Hourly Booking
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
												Up to {space.capacity} people
											</span>
										</div>
										<div className='flex items-center gap-2'>
											<Clock className='h-4 w-4 text-primary' />
											<span>
												{formatPrice(
													pricingPlan?.price
														? pricingPlan.price /
																100
														: 0
												)}
												/{pricingPlan?.unit || 'hour'}
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
								</CardContent>
							</Card>
						</div>

						{/* Right Column - Booking Form */}
						<div className='lg:col-span-2 space-y-6'>
							<Card>
								<CardHeader>
									<CardTitle>Select Date & Time</CardTitle>
								</CardHeader>
								<CardContent className='space-y-6'>
									{/* Full Workspace Warning */}
									{isFullWorkspace && (
										<Alert>
											<AlertCircle className='h-4 w-4' />
											<AlertDescription>
												The Full Workspace can only be
												booked on Saturdays.
											</AlertDescription>
										</Alert>
									)}

									{/* Calendar */}
									<div>
										<Label className='mb-3 block'>
											Select Date
										</Label>
										<Calendar
											mode='single'
											selected={selectedDate}
											onSelect={(date) => {
												setSelectedDate(date);
												setSelectedSlot('');
											}}
											disabled={isDateDisabled}
											fromDate={new Date()}
											toDate={addDays(new Date(), 90)}
											className='rounded-md border'
										/>
									</div>

									{/* Business Hours Info */}
									{selectedDate && businessHours && (
										<div className='p-4 bg-muted rounded-lg'>
											<p className='font-medium'>
												{format(
													selectedDate,
													'EEEE, MMMM d, yyyy'
												)}
											</p>
											{businessHours.isOpen ? (
												<p className='text-sm text-muted-foreground'>
													Open from{' '}
													{businessHours.open.replace(
														/(\d{2}):(\d{2})/,
														(_, h, m) => {
															const hour =
																parseInt(h);
															return `${
																hour > 12
																	? hour - 12
																	: hour
															}:${m} ${
																hour >= 12
																	? 'PM'
																	: 'AM'
															}`;
														}
													)}{' '}
													to{' '}
													{businessHours.close.replace(
														/(\d{2}):(\d{2})/,
														(_, h, m) => {
															const hour =
																parseInt(h);
															return `${
																hour > 12
																	? hour - 12
																	: hour
															}:${m} ${
																hour >= 12
																	? 'PM'
																	: 'AM'
															}`;
														}
													)}
												</p>
											) : (
												<p className='text-sm text-destructive'>
													Closed
												</p>
											)}
										</div>
									)}

									{/* Time Slots */}
									{selectedDate && businessHours?.isOpen && (
										<div>
											<Label className='mb-3 block'>
												Select Start Time
											</Label>
											{loadingSlots ? (
												<div className='grid grid-cols-4 gap-2'>
													{Array.from({
														length: 8,
													}).map((_, i) => (
														<Skeleton
															key={i}
															className='h-10'
														/>
													))}
												</div>
											) : availableSlots.length === 0 ? (
												<Alert variant='destructive'>
													<AlertCircle className='h-4 w-4' />
													<AlertDescription>
														No available time slots
														for this date.
													</AlertDescription>
												</Alert>
											) : (
												<div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2'>
													{availableSlots.map(
														(slot) => (
															<Button
																key={slot.time}
																variant={
																	selectedSlot ===
																	slot.time
																		? 'default'
																		: 'outline'
																}
																className='w-full'
																disabled={
																	!slot.available
																}
																onClick={() =>
																	setSelectedSlot(
																		slot.time
																	)
																}
															>
																{slot.label}
															</Button>
														)
													)}
												</div>
											)}
										</div>
									)}

									{/* Duration Selection */}
									{selectedSlot && (
										<div>
											<Label className='mb-3 block'>
												Duration (hours)
											</Label>
											<Select
												value={selectedDuration.toString()}
												onValueChange={(v) =>
													setSelectedDuration(
														parseInt(v)
													)
												}
											>
												<SelectTrigger className='w-full sm:w-50'>
													<SelectValue placeholder='Select duration' />
												</SelectTrigger>
												<SelectContent>
													{durationOptions.map(
														(d) => (
															<SelectItem
																key={d}
																value={d.toString()}
															>
																{d} hour
																{d > 1
																	? 's'
																	: ''}
															</SelectItem>
														)
													)}
												</SelectContent>
											</Select>
										</div>
									)}

									{/* Attendees */}
									{selectedSlot && (
										<div>
											<Label
												htmlFor='attendees'
												className='mb-3 block'
											>
												Number of Attendees
											</Label>
											<Input
												id='attendees'
												type='number'
												min={1}
												max={space.capacity}
												value={attendees}
												onChange={(e) =>
													setAttendees(
														Math.min(
															Math.max(
																1,
																parseInt(
																	e.target
																		.value
																) || 1
															),
															space.capacity
														)
													)
												}
												className='w-full sm:w-50'
											/>
											<p className='text-xs text-muted-foreground mt-1'>
												Maximum: {space.capacity} people
											</p>
										</div>
									)}

									{/* Notes */}
									{selectedSlot && (
										<div>
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
												placeholder='Any special requirements or setup needs?'
												rows={3}
											/>
										</div>
									)}
								</CardContent>
							</Card>

							{/* Summary Card */}
							{selectedDate && selectedSlot && (
								<Card>
									<CardHeader>
										<CardTitle>Booking Summary</CardTitle>
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
												Date
											</span>
											<span className='font-medium'>
												{format(
													selectedDate,
													'EEEE, MMM d, yyyy'
												)}
											</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-muted-foreground'>
												Time
											</span>
											<span className='font-medium'>
												{
													availableSlots.find(
														(s) =>
															s.time ===
															selectedSlot
													)?.label
												}{' '}
												-{' '}
												{(() => {
													const end =
														calculateEndTime(
															selectedSlot,
															selectedDuration
														);
													const [h, m] = end
														.split(':')
														.map(Number);
													const period =
														h >= 12 ? 'PM' : 'AM';
													const displayH =
														h > 12
															? h - 12
															: h === 0
															? 12
															: h;
													return `${displayH}:${m
														.toString()
														.padStart(
															2,
															'0'
														)} ${period}`;
												})()}
											</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-muted-foreground'>
												Duration
											</span>
											<span className='font-medium'>
												{selectedDuration} hour
												{selectedDuration > 1
													? 's'
													: ''}
											</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-muted-foreground'>
												Attendees
											</span>
											<span className='font-medium'>
												{attendees}
											</span>
										</div>
										<Separator />
										<div className='flex justify-between'>
											<span className='text-muted-foreground'>
												Rate (
												{formatPrice(
													pricingPlan?.price
														? pricingPlan.price /
																100
														: 0
												)}
												/hour)
											</span>
											<span>
												{selectedDuration} ×{' '}
												{formatPrice(
													pricingPlan?.price
														? pricingPlan.price /
																100
														: 0
												)}
											</span>
										</div>
										<div className='flex justify-between text-lg font-bold'>
											<span>Total</span>
											<span className='text-primary'>
												{formatPrice(totalPrice)}
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
							You need to be signed in to book this space.
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4 pt-4'>
						<p className='text-sm text-muted-foreground'>
							Your profile information will be used for the
							booking.
						</p>
						<div className='flex flex-col gap-3'>
							<Button asChild>
								<Link
									href={`/login?redirect=/spaces/${space.slug}/book`}
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
									href={`/register?redirect=/spaces/${space.slug}/book`}
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
						<DialogTitle>Confirm Booking</DialogTitle>
						<DialogDescription>
							Review your booking details before proceeding to
							payment.
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

						{/* Booking Details */}
						<div className='p-4 border rounded-lg space-y-2'>
							<div className='flex justify-between'>
								<span className='text-sm text-muted-foreground'>
									Space
								</span>
								<span className='font-medium'>
									{space.name}
								</span>
							</div>
							{selectedDate && (
								<div className='flex justify-between'>
									<span className='text-sm text-muted-foreground'>
										Date
									</span>
									<span>
										{format(selectedDate, 'MMM d, yyyy')}
									</span>
								</div>
							)}
							<div className='flex justify-between'>
								<span className='text-sm text-muted-foreground'>
									Time
								</span>
								<span>
									{
										availableSlots.find(
											(s) => s.time === selectedSlot
										)?.label
									}{' '}
									-{' '}
									{(() => {
										const end = calculateEndTime(
											selectedSlot,
											selectedDuration
										);
										const [h, m] = end
											.split(':')
											.map(Number);
										const period = h >= 12 ? 'PM' : 'AM';
										const displayH =
											h > 12 ? h - 12 : h === 0 ? 12 : h;
										return `${displayH}:${m
											.toString()
											.padStart(2, '0')} ${period}`;
									})()}
								</span>
							</div>
							<div className='flex justify-between'>
								<span className='text-sm text-muted-foreground'>
									Duration
								</span>
								<span>
									{selectedDuration} hour
									{selectedDuration > 1 ? 's' : ''}
								</span>
							</div>
							<Separator />
							<div className='flex justify-between font-bold'>
								<span>Total</span>
								<span className='text-primary'>
									{formatPrice(totalPrice)}
								</span>
							</div>
						</div>

						<div className='flex justify-end gap-3'>
							<Button
								variant='outline'
								onClick={() => setShowConfirmDialog(false)}
							>
								Cancel
							</Button>
							<Button onClick={handleConfirmBooking}>
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
