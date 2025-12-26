'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Calendar,
	Clock,
	MapPin,
	User,
	CreditCard,
	LogOut,
	QrCode,
	CheckCircle,
	Loader2,
	Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { BookingWithRelations } from '@/actions/bookings';
import type { MembershipWithRelations } from '@/actions/subscriptions';

// SessionUser from auth
interface SessionUser {
	id: string;
	email: string;
	name: string;
	role: string;
}

interface DashboardClientProps {
	user: SessionUser;
	upcomingBookings: BookingWithRelations[];
	pastBookings: BookingWithRelations[];
	activeSubscriptions: MembershipWithRelations[];
	expiredSubscriptions: MembershipWithRelations[];
	logoutAction: () => Promise<{ success: boolean; message: string }>;
}

// Helper to format price from kobo
const formatPrice = (kobo: number) => {
	return (kobo / 100).toLocaleString();
};

// Helper to get status badge color
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
		case 'ACTIVE':
			return <Badge className='bg-green-500'>Active</Badge>;
		case 'EXPIRED':
			return <Badge variant='secondary'>Expired</Badge>;
		case 'PAUSED':
			return <Badge variant='outline'>Paused</Badge>;
		default:
			return <Badge variant='outline'>{status}</Badge>;
	}
};

export default function DashboardClient({
	user,
	upcomingBookings,
	pastBookings,
	activeSubscriptions,
	expiredSubscriptions,
	logoutAction,
}: DashboardClientProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const handleLogout = () => {
		startTransition(async () => {
			const result = await logoutAction();
			if (result.success) {
				toast.success('Logged out successfully');
				router.push('/login');
				router.refresh();
			} else {
				toast.error(result.message || 'Logout failed');
			}
		});
	};

	return (
		<div className='min-h-screen bg-background'>
			{/* Header */}
			<section className='bg-primary text-primary-foreground px-4 py-8'>
				<div className='container mx-auto'>
					<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
						<div>
							<h1 className='text-2xl font-bold'>
								Welcome, {user.name}
							</h1>
							<p className='text-sm text-primary-foreground/80'>
								{user.email}
							</p>
						</div>
						<div className='flex gap-2'>
							<Link href='/dashboard/profile'>
								<Button
									variant='secondary'
									size='sm'
								>
									<User className='mr-2 h-4 w-4' />
									Profile
								</Button>
							</Link>
							<Button
								variant='secondary'
								size='sm'
								onClick={handleLogout}
								disabled={isPending}
							>
								{isPending ? (
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
								) : (
									<LogOut className='mr-2 h-4 w-4' />
								)}
								Logout
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Quick Stats */}
			<section className='container mx-auto px-4 -mt-6'>
				<div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
					<Card className='bg-background shadow-lg'>
						<CardContent className='pt-6'>
							<div className='flex items-center gap-3'>
								<div className='p-2 bg-blue-100 rounded-full'>
									<Calendar className='h-5 w-5 text-blue-600' />
								</div>
								<div>
									<p className='text-2xl font-bold'>
										{upcomingBookings.length}
									</p>
									<p className='text-xs text-muted-foreground'>
										Upcoming
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className='bg-background shadow-lg'>
						<CardContent className='pt-6'>
							<div className='flex items-center gap-3'>
								<div className='p-2 bg-green-100 rounded-full'>
									<CheckCircle className='h-5 w-5 text-green-600' />
								</div>
								<div>
									<p className='text-2xl font-bold'>
										{activeSubscriptions.length}
									</p>
									<p className='text-xs text-muted-foreground'>
										Active Plans
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className='bg-background shadow-lg'>
						<CardContent className='pt-6'>
							<div className='flex items-center gap-3'>
								<div className='p-2 bg-purple-100 rounded-full'>
									<CreditCard className='h-5 w-5 text-purple-600' />
								</div>
								<div>
									<p className='text-2xl font-bold'>
										{pastBookings.length}
									</p>
									<p className='text-xs text-muted-foreground'>
										Past Bookings
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className='bg-background shadow-lg'>
						<CardContent className='pt-6'>
							<div className='flex items-center gap-3'>
								<div className='p-2 bg-orange-100 rounded-full'>
									<QrCode className='h-5 w-5 text-orange-600' />
								</div>
								<div>
									<Link href='/dashboard/check-in'>
										<Button
											variant='link'
											className='p-0 h-auto text-2xl font-bold'
										>
											Check In
										</Button>
									</Link>
									<p className='text-xs text-muted-foreground'>
										Scan QR
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className='bg-background shadow-lg'>
						<CardContent className='pt-6'>
							<div className='flex items-center gap-3'>
								<div className='p-2 bg-teal-100 rounded-full'>
									<Users className='h-5 w-5 text-teal-600' />
								</div>
								<div>
									<Link href='/dashboard/visitors'>
										<Button
											variant='link'
											className='p-0 h-auto text-2xl font-bold'
										>
											Visitors
										</Button>
									</Link>
									<p className='text-xs text-muted-foreground'>
										Register Guests
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</section>

			{/* Main Content */}
			<section className='container mx-auto px-4 py-8'>
				<Tabs defaultValue='bookings'>
					<TabsList className='grid w-full max-w-md grid-cols-2'>
						<TabsTrigger value='bookings'>My Bookings</TabsTrigger>
						<TabsTrigger value='subscriptions'>
							My Subscriptions
						</TabsTrigger>
					</TabsList>

					{/* Bookings Tab */}
					<TabsContent
						value='bookings'
						className='mt-6'
					>
						<div className='space-y-6'>
							{/* Upcoming Bookings */}
							<div>
								<h2 className='text-lg font-semibold mb-4'>
									Upcoming Bookings
								</h2>
								{upcomingBookings.length > 0 ? (
									<div className='grid gap-4'>
										{upcomingBookings.map((booking) => (
											<Card key={booking.id}>
												<CardContent className='p-4'>
													<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
														<div className='flex-1'>
															<div className='flex items-center gap-2 mb-2'>
																<h3 className='font-semibold'>
																	{
																		booking
																			.space
																			.name
																	}
																</h3>
																{getStatusBadge(
																	booking.status
																)}
															</div>
															<div className='space-y-1 text-sm text-muted-foreground'>
																<div className='flex items-center gap-2'>
																	<Calendar className='h-4 w-4' />
																	<span>
																		{format(
																			new Date(
																				booking.bookingDate
																			),
																			'MMMM d, yyyy'
																		)}
																	</span>
																</div>
																<div className='flex items-center gap-2'>
																	<Clock className='h-4 w-4' />
																	<span>
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
																</div>
																<div className='flex items-center gap-2'>
																	<span className='text-xs'>
																		Booking
																		#
																		{
																			booking.bookingNumber
																		}
																	</span>
																</div>
															</div>
														</div>
														<div className='flex flex-col gap-2'>
															<p className='font-semibold text-right'>
																₦
																{formatPrice(
																	booking.totalAmount
																)}
															</p>
															<div className='flex gap-2'>
																<Link
																	href={`/dashboard/bookings/${booking.id}`}
																>
																	<Button
																		size='sm'
																		variant='outline'
																	>
																		View
																		Details
																	</Button>
																</Link>
																{booking.status ===
																	'CONFIRMED' && (
																	<Button size='sm'>
																		<QrCode className='mr-2 h-4 w-4' />
																		QR Code
																	</Button>
																)}
															</div>
														</div>
													</div>
												</CardContent>
											</Card>
										))}
									</div>
								) : (
									<Card>
										<CardContent className='p-6 text-center'>
											<Calendar className='h-12 w-12 mx-auto mb-4 text-muted-foreground/50' />
											<h3 className='font-semibold mb-2'>
												No Upcoming Bookings
											</h3>
											<p className='text-sm text-muted-foreground mb-4'>
												You don&apos;t have any upcoming
												bookings. Book a space now!
											</p>
											<Link href='/booking'>
												<Button>Book a Space</Button>
											</Link>
										</CardContent>
									</Card>
								)}
							</div>

							{/* Past Bookings */}
							{pastBookings.length > 0 && (
								<div>
									<h2 className='text-lg font-semibold mb-4'>
										Past Bookings
									</h2>
									<div className='grid gap-4'>
										{pastBookings
											.slice(0, 5)
											.map((booking) => (
												<Card
													key={booking.id}
													className='bg-muted/30'
												>
													<CardContent className='p-4'>
														<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
															<div className='flex-1'>
																<div className='flex items-center gap-2 mb-2'>
																	<h3 className='font-semibold'>
																		{
																			booking
																				.space
																				.name
																		}
																	</h3>
																	{getStatusBadge(
																		booking.status
																	)}
																</div>
																<div className='space-y-1 text-sm text-muted-foreground'>
																	<div className='flex items-center gap-2'>
																		<Calendar className='h-4 w-4' />
																		<span>
																			{format(
																				new Date(
																					booking.bookingDate
																				),
																				'MMMM d, yyyy'
																			)}
																		</span>
																	</div>
																</div>
															</div>
															<div className='text-right'>
																<p className='font-semibold'>
																	₦
																	{formatPrice(
																		booking.totalAmount
																	)}
																</p>
																<Link
																	href={`/dashboard/bookings/${booking.id}`}
																>
																	<Button
																		size='sm'
																		variant='ghost'
																	>
																		View
																		Details
																	</Button>
																</Link>
															</div>
														</div>
													</CardContent>
												</Card>
											))}
									</div>
								</div>
							)}
						</div>
					</TabsContent>

					{/* Subscriptions Tab */}
					<TabsContent
						value='subscriptions'
						className='mt-6'
					>
						<div className='space-y-6'>
							{/* Active Subscriptions */}
							<div>
								<h2 className='text-lg font-semibold mb-4'>
									Active Subscriptions
								</h2>
								{activeSubscriptions.length > 0 ? (
									<div className='grid gap-4'>
										{activeSubscriptions.map((sub) => (
											<Card key={sub.id}>
												<CardContent className='p-4'>
													<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
														<div className='flex-1'>
															<div className='flex items-center gap-2 mb-2'>
																<h3 className='font-semibold'>
																	{
																		sub
																			.space
																			.name
																	}
																</h3>
																{getStatusBadge(
																	sub.status
																)}
															</div>
															<div className='space-y-1 text-sm text-muted-foreground'>
																<div className='flex items-center gap-2'>
																	<MapPin className='h-4 w-4' />
																	<span>
																		{
																			sub
																				.pricingPlan
																				.name
																		}
																	</span>
																</div>
																<div className='flex items-center gap-2'>
																	<Calendar className='h-4 w-4' />
																	<span>
																		Expires:{' '}
																		{format(
																			new Date(
																				sub.endDate
																			),
																			'MMMM d, yyyy'
																		)}
																	</span>
																</div>
																<div className='flex items-center gap-2'>
																	<span className='text-xs'>
																		Membership
																		#
																		{
																			sub.membershipNumber
																		}
																	</span>
																</div>
															</div>
														</div>
														<div className='flex flex-col gap-2 items-end'>
															<p className='font-semibold'>
																₦
																{formatPrice(
																	sub
																		.pricingPlan
																		.price
																)}
																/
																{
																	sub
																		.pricingPlan
																		.unit
																}
															</p>
															<div className='flex gap-2'>
																<Link
																	href={`/dashboard/subscriptions/${sub.id}`}
																>
																	<Button
																		size='sm'
																		variant='outline'
																	>
																		View
																		Details
																	</Button>
																</Link>
																{sub.accessCode && (
																	<Button size='sm'>
																		<QrCode className='mr-2 h-4 w-4' />
																		Access
																		Code
																	</Button>
																)}
															</div>
														</div>
													</div>
												</CardContent>
											</Card>
										))}
									</div>
								) : (
									<Card>
										<CardContent className='p-6 text-center'>
											<CreditCard className='h-12 w-12 mx-auto mb-4 text-muted-foreground/50' />
											<h3 className='font-semibold mb-2'>
												No Active Subscriptions
											</h3>
											<p className='text-sm text-muted-foreground mb-4'>
												Subscribe to a workspace plan
												for unlimited access!
											</p>
											<Link href='/spaces'>
												<Button>Browse Plans</Button>
											</Link>
										</CardContent>
									</Card>
								)}
							</div>

							{/* Expired Subscriptions */}
							{expiredSubscriptions.length > 0 && (
								<div>
									<h2 className='text-lg font-semibold mb-4'>
										Past Subscriptions
									</h2>
									<div className='grid gap-4'>
										{expiredSubscriptions
											.slice(0, 5)
											.map((sub) => (
												<Card
													key={sub.id}
													className='bg-muted/30'
												>
													<CardContent className='p-4'>
														<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
															<div className='flex-1'>
																<div className='flex items-center gap-2 mb-2'>
																	<h3 className='font-semibold'>
																		{
																			sub
																				.space
																				.name
																		}
																	</h3>
																	{getStatusBadge(
																		sub.status
																	)}
																</div>
																<div className='space-y-1 text-sm text-muted-foreground'>
																	<div className='flex items-center gap-2'>
																		<MapPin className='h-4 w-4' />
																		<span>
																			{
																				sub
																					.pricingPlan
																					.name
																			}
																		</span>
																	</div>
																</div>
															</div>
															<div className='text-right'>
																<Link
																	href={`/dashboard/subscriptions/${sub.id}`}
																>
																	<Button
																		size='sm'
																		variant='ghost'
																	>
																		View
																		Details
																	</Button>
																</Link>
															</div>
														</div>
													</CardContent>
												</Card>
											))}
									</div>
								</div>
							)}
						</div>
					</TabsContent>
				</Tabs>
			</section>

			{/* Quick Actions */}
			<section className='container mx-auto px-4 pb-8'>
				<h2 className='text-lg font-semibold mb-4'>Quick Actions</h2>
				<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
					<Link href='/booking'>
						<Card className='hover:bg-muted/50 transition-colors cursor-pointer'>
							<CardContent className='p-4 text-center'>
								<Calendar className='h-8 w-8 mx-auto mb-2 text-primary' />
								<p className='text-sm font-medium'>
									Book Space
								</p>
							</CardContent>
						</Card>
					</Link>
					<Link href='/spaces'>
						<Card className='hover:bg-muted/50 transition-colors cursor-pointer'>
							<CardContent className='p-4 text-center'>
								<MapPin className='h-8 w-8 mx-auto mb-2 text-blue-500' />
								<p className='text-sm font-medium'>
									Browse Spaces
								</p>
							</CardContent>
						</Card>
					</Link>
					<Link href='/dashboard/check-in'>
						<Card className='hover:bg-muted/50 transition-colors cursor-pointer'>
							<CardContent className='p-4 text-center'>
								<QrCode className='h-8 w-8 mx-auto mb-2 text-green-500' />
								<p className='text-sm font-medium'>Check In</p>
							</CardContent>
						</Card>
					</Link>
					<Link href='/dashboard/profile'>
						<Card className='hover:bg-muted/50 transition-colors cursor-pointer'>
							<CardContent className='p-4 text-center'>
								<User className='h-8 w-8 mx-auto mb-2 text-orange-500' />
								<p className='text-sm font-medium'>
									My Profile
								</p>
							</CardContent>
						</Card>
					</Link>
				</div>
			</section>
		</div>
	);
}
