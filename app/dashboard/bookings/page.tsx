import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getUserBookings } from '@/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
	Empty,
	EmptyMedia,
	EmptyHeader,
	EmptyTitle,
	EmptyDescription,
	EmptyContent,
} from '@/components/ui/empty';
import { ArrowLeft, Calendar, Clock, Plus, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';

// Helper to format price from kobo
const formatPrice = (kobo: number) => {
	return (kobo / 100).toLocaleString();
};

// Helper to get status badge
const getStatusBadge = (status: string) => {
	switch (status) {
		case 'CONFIRMED':
			return <Badge className='bg-blue-500'>Confirmed</Badge>;
		case 'PENDING':
			return <Badge variant='outline'>Pending</Badge>;
		case 'CHECKED_IN':
			return <Badge className='bg-green-500'>Checked In</Badge>;
		case 'COMPLETED':
			return <Badge variant='secondary'>Completed</Badge>;
		case 'CANCELLED':
			return <Badge variant='destructive'>Cancelled</Badge>;
		case 'NO_SHOW':
			return <Badge variant='destructive'>No Show</Badge>;
		default:
			return <Badge variant='outline'>{status}</Badge>;
	}
};

export default async function BookingsPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect('/login');
	}

	const bookingsResult = await getUserBookings();
	const bookings =
		bookingsResult.success && bookingsResult.data
			? Array.isArray(bookingsResult.data)
				? bookingsResult.data
				: [bookingsResult.data]
			: [];

	// Separate bookings by status
	const upcomingBookings = bookings.filter(
		(b) =>
			b.status === 'CONFIRMED' ||
			b.status === 'PENDING' ||
			b.status === 'CHECKED_IN'
	);
	const pastBookings = bookings.filter(
		(b) =>
			b.status === 'COMPLETED' ||
			b.status === 'CANCELLED' ||
			b.status === 'NO_SHOW'
	);

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
						<Link href='/dashboard'>
							<ArrowLeft className='mr-2 h-4 w-4' />
							Back to Dashboard
						</Link>
					</Button>
					<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
						<div>
							<h1 className='text-3xl font-bold text-secondary'>
								My Bookings
							</h1>
							<p className='text-secondary/80'>
								View and manage your space bookings
							</p>
						</div>
						<Button asChild>
							<Link href='/spaces'>
								<Plus className='mr-2 h-4 w-4' />
								New Booking
							</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Content */}
			<section className='px-4 py-8'>
				<div className='container mx-auto max-w-4xl space-y-8'>
					{/* Upcoming Bookings */}
					<div>
						<h2 className='text-xl font-semibold mb-4'>
							Upcoming Bookings ({upcomingBookings.length})
						</h2>
						{upcomingBookings.length === 0 ? (
							<Card>
								<CardContent className='p-8'>
									<Empty>
										<EmptyMedia variant='icon'>
											<Calendar className='h-6 w-6' />
										</EmptyMedia>
										<EmptyHeader>
											<EmptyTitle>
												No upcoming bookings
											</EmptyTitle>
											<EmptyDescription>
												You don&apos;t have any upcoming
												bookings.
											</EmptyDescription>
										</EmptyHeader>
										<EmptyContent>
											<Button asChild>
												<Link href='/spaces?type=book'>
													Book a Space
												</Link>
											</Button>
										</EmptyContent>
									</Empty>
								</CardContent>
							</Card>
						) : (
							<div className='space-y-4'>
								{upcomingBookings.map((booking) => (
									<Link
										key={booking.id}
										href={`/dashboard/bookings/${booking.id}`}
									>
										<Card className='hover:shadow-md transition-shadow cursor-pointer'>
											<CardContent className='p-6'>
												<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
													<div className='flex items-start gap-4'>
														<div className='p-3 bg-primary/10 rounded-lg'>
															<MapPin className='h-6 w-6 text-primary' />
														</div>
														<div>
															<h3 className='font-semibold text-lg'>
																{
																	booking
																		.space
																		.name
																}
															</h3>
															<p className='text-sm text-muted-foreground'>
																{
																	booking
																		.pricingPlan
																		.name
																}
															</p>
															<div className='flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground'>
																<span className='flex items-center gap-1'>
																	<Calendar className='h-4 w-4' />
																	{format(
																		new Date(
																			booking.bookingDate
																		),
																		'MMM d, yyyy'
																	)}
																</span>
																<span className='flex items-center gap-1'>
																	<Clock className='h-4 w-4' />
																	{format(
																		new Date(
																			booking.startTime
																		),
																		'h:mm a'
																	)}{' '}
																	-{' '}
																	{format(
																		new Date(
																			booking.endTime
																		),
																		'h:mm a'
																	)}
																</span>
																{booking.attendees >
																	1 && (
																	<span className='flex items-center gap-1'>
																		<Users className='h-4 w-4' />
																		{
																			booking.attendees
																		}{' '}
																		guests
																	</span>
																)}
															</div>
														</div>
													</div>
													<div className='flex items-center gap-3'>
														<span className='text-sm font-medium'>
															₦
															{formatPrice(
																booking.totalAmount
															)}
														</span>
														{getStatusBadge(
															booking.status
														)}
													</div>
												</div>
											</CardContent>
										</Card>
									</Link>
								))}
							</div>
						)}
					</div>

					{/* Past Bookings */}
					{pastBookings.length > 0 && (
						<div>
							<h2 className='text-xl font-semibold mb-4'>
								Past Bookings ({pastBookings.length})
							</h2>
							<div className='space-y-4'>
								{pastBookings.map((booking) => (
									<Link
										key={booking.id}
										href={`/dashboard/bookings/${booking.id}`}
									>
										<Card className='hover:shadow-md transition-shadow cursor-pointer opacity-75'>
											<CardContent className='p-6'>
												<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
													<div className='flex items-start gap-4'>
														<div className='p-3 bg-muted rounded-lg'>
															<MapPin className='h-6 w-6 text-muted-foreground' />
														</div>
														<div>
															<h3 className='font-semibold text-lg'>
																{
																	booking
																		.space
																		.name
																}
															</h3>
															<p className='text-sm text-muted-foreground'>
																{
																	booking
																		.pricingPlan
																		.name
																}
															</p>
															<div className='flex items-center gap-4 mt-2 text-sm text-muted-foreground'>
																<span className='flex items-center gap-1'>
																	<Calendar className='h-4 w-4' />
																	{format(
																		new Date(
																			booking.bookingDate
																		),
																		'MMM d, yyyy'
																	)}
																</span>
															</div>
														</div>
													</div>
													<div className='flex items-center gap-3'>
														{getStatusBadge(
															booking.status
														)}
													</div>
												</div>
											</CardContent>
										</Card>
									</Link>
								))}
							</div>
						</div>
					)}
				</div>
			</section>
		</div>
	);
}
