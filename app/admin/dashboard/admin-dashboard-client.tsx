'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
	Calendar,
	Users,
	DollarSign,
	TrendingUp,
	Clock,
	CheckCircle2,
	Settings,
	LogOut,
	QrCode,
	LayoutGrid,
	FileText,
	UserCog,
	Loader2,
	UserPlus,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { DashboardStats } from '@/actions/admin';

// Types matching the actual getTodayOverview return
interface TodayOverview {
	expectedCheckIns: Array<{
		id: string;
		bookingNumber: string;
		startTime: Date;
		endTime: Date;
		status: string;
		user: { name: string; email: string };
		space: { name: string };
	}>;
	currentlyCheckedIn: Array<{
		id: string;
		bookingNumber: string;
		checkInTime: Date | null;
		user: { name: string };
		space: { name: string };
	}>;
	upcomingBookings: Array<{
		id: string;
		bookingNumber: string;
		startTime: Date;
		user: { name: string };
		space: { name: string };
	}>;
}

// SessionUser from auth
interface SessionUser {
	id: string;
	email: string;
	name: string;
	role: string;
}

interface AdminDashboardClientProps {
	admin: SessionUser;
	stats: DashboardStats | null;
	overview: TodayOverview | null;
	logoutAction: () => Promise<{ success: boolean; message: string }>;
}

// Helper to format price from kobo
const formatPrice = (kobo: number) => {
	return (kobo / 100).toLocaleString();
};

export default function AdminDashboardClient({
	admin,
	stats,
	overview,
	logoutAction,
}: AdminDashboardClientProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const handleLogout = () => {
		startTransition(async () => {
			const result = await logoutAction();
			if (result.success) {
				toast.success('Logged out successfully');
				router.push('/admin/login');
				router.refresh();
			} else {
				toast.error(result.message || 'Logout failed');
			}
		});
	};

	const dashboardStats = stats ?? {
		totalUsers: 0,
		newUsersThisMonth: 0,
		totalBookings: 0,
		bookingsThisMonth: 0,
		totalSubscriptions: 0,
		activeSubscriptions: 0,
		totalRevenue: 0,
		revenueThisMonth: 0,
		occupancyRate: 0,
		checkedInToday: 0,
	};

	const expectedCheckIns = overview?.expectedCheckIns ?? [];
	const currentlyCheckedIn = overview?.currentlyCheckedIn ?? [];
	const upcomingBookings = overview?.upcomingBookings ?? [];

	return (
		<div className='min-h-screen bg-background'>
			{/* Admin Header */}
			<section className='bg-secondary text-secondary-foreground px-4 py-6 border-b'>
				<div className='container mx-auto'>
					<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
						<div>
							<div className='flex items-center gap-2 mb-2'>
								<Badge className='bg-red-600 text-white'>
									Admin
								</Badge>
								<span className='text-sm text-secondary-foreground/70'>
									Staff Portal
								</span>
							</div>
							<h1 className='text-2xl font-bold'>
								Admin Dashboard
							</h1>
							<p className='text-sm text-secondary-foreground/70'>
								Welcome back, {admin.name}
							</p>
						</div>
						<div className='flex gap-2'>
							<Button
								variant='outline'
								size='sm'
								className='bg-transparent border-secondary-foreground/20 text-secondary-foreground'
							>
								<Settings className='mr-2 h-4 w-4' />
								Settings
							</Button>
							<Button
								variant='outline'
								size='sm'
								onClick={handleLogout}
								disabled={isPending}
								className='bg-transparent border-secondary-foreground/20 text-secondary-foreground'
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

			{/* Navigation */}
			<section className='border-b bg-muted/30'>
				<div className='container mx-auto px-4'>
					<nav className='flex gap-1 overflow-x-auto'>
						<Link
							href='/admin/dashboard'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-primary bg-background'
						>
							<LayoutGrid className='h-4 w-4' />
							Overview
						</Link>
						<Link
							href='/admin/bookings'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground'
						>
							<Calendar className='h-4 w-4' />
							Bookings
						</Link>
						<Link
							href='/admin/members'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground'
						>
							<Users className='h-4 w-4' />
							Members
						</Link>
						<Link
							href='/admin/spaces'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground'
						>
							<LayoutGrid className='h-4 w-4' />
							Spaces
						</Link>
						<Link
							href='/admin/scanner'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground'
						>
							<QrCode className='h-4 w-4' />
							Scanner
						</Link>
						<Link
							href='/admin/visitors'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground'
						>
							<UserPlus className='h-4 w-4' />
							Visitors
						</Link>
						<Link
							href='/admin/reports'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground'
						>
							<FileText className='h-4 w-4' />
							Reports
						</Link>
					</nav>
				</div>
			</section>

			{/* Main Content */}
			<main className='container mx-auto px-4 py-8'>
				{/* Stats Grid */}
				<div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
					<Card>
						<CardHeader className='pb-2'>
							<CardTitle className='text-sm font-medium text-muted-foreground'>
								Total Users
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='flex items-center gap-2'>
								<Users className='h-5 w-5 text-primary' />
								<span className='text-2xl font-bold'>
									{dashboardStats.totalUsers}
								</span>
							</div>
							<p className='text-xs text-muted-foreground mt-1'>
								+{dashboardStats.newUsersThisMonth} this month
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='pb-2'>
							<CardTitle className='text-sm font-medium text-muted-foreground'>
								Total Bookings
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='flex items-center gap-2'>
								<Calendar className='h-5 w-5 text-blue-500' />
								<span className='text-2xl font-bold'>
									{dashboardStats.totalBookings}
								</span>
							</div>
							<p className='text-xs text-muted-foreground mt-1'>
								{dashboardStats.bookingsThisMonth} this month
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='pb-2'>
							<CardTitle className='text-sm font-medium text-muted-foreground'>
								Total Revenue
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='flex items-center gap-2'>
								<DollarSign className='h-5 w-5 text-green-500' />
								<span className='text-2xl font-bold'>
									₦{formatPrice(dashboardStats.totalRevenue)}
								</span>
							</div>
							<p className='text-xs text-muted-foreground mt-1'>
								₦{formatPrice(dashboardStats.revenueThisMonth)}{' '}
								this month
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='pb-2'>
							<CardTitle className='text-sm font-medium text-muted-foreground'>
								Occupancy Rate
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='flex items-center gap-2'>
								<TrendingUp className='h-5 w-5 text-orange-500' />
								<span className='text-2xl font-bold'>
									{dashboardStats.occupancyRate}%
								</span>
							</div>
							<p className='text-xs text-muted-foreground mt-1'>
								{dashboardStats.checkedInToday} checked in today
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Active Subscriptions */}
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8'>
					<Card>
						<CardHeader className='pb-2'>
							<CardTitle className='text-sm font-medium text-muted-foreground'>
								Total Subscriptions
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='flex items-center gap-2'>
								<UserCog className='h-5 w-5 text-purple-500' />
								<span className='text-2xl font-bold'>
									{dashboardStats.totalSubscriptions}
								</span>
							</div>
							<p className='text-xs text-muted-foreground mt-1'>
								{dashboardStats.activeSubscriptions} currently
								active
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='pb-2'>
							<CardTitle className='text-sm font-medium text-muted-foreground'>
								Checked In Today
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='flex items-center gap-2'>
								<CheckCircle2 className='h-5 w-5 text-green-500' />
								<span className='text-2xl font-bold'>
									{dashboardStats.checkedInToday}
								</span>
							</div>
							<p className='text-xs text-muted-foreground mt-1'>
								Currently in workspace
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Today's Schedule */}
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
					{/* Expected Check-ins */}
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Clock className='h-5 w-5' />
								Expected Check-ins Today
							</CardTitle>
						</CardHeader>
						<CardContent>
							{expectedCheckIns.length > 0 ? (
								<div className='space-y-3'>
									{expectedCheckIns.map((booking) => (
										<div
											key={booking.id}
											className='flex items-center justify-between p-3 bg-muted/50 rounded-lg'
										>
											<div>
												<p className='font-medium'>
													{booking.user.name}
												</p>
												<p className='text-sm text-muted-foreground'>
													{booking.space.name}
												</p>
											</div>
											<div className='text-right'>
												<Badge variant='outline'>
													{booking.bookingNumber}
												</Badge>
												<p className='text-xs text-muted-foreground mt-1'>
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
												</p>
											</div>
										</div>
									))}
								</div>
							) : (
								<p className='text-muted-foreground text-center py-4'>
									No check-ins expected today
								</p>
							)}
						</CardContent>
					</Card>

					{/* Currently Checked In */}
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<CheckCircle2 className='h-5 w-5 text-green-500' />
								Currently Checked In
							</CardTitle>
						</CardHeader>
						<CardContent>
							{currentlyCheckedIn.length > 0 ? (
								<div className='space-y-3'>
									{currentlyCheckedIn.map((booking) => (
										<div
											key={booking.id}
											className='flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg'
										>
											<div>
												<p className='font-medium'>
													{booking.user.name}
												</p>
												<p className='text-sm text-muted-foreground'>
													{booking.space.name}
												</p>
											</div>
											<div className='text-right'>
												<Badge className='bg-green-500'>
													Checked In
												</Badge>
												{booking.checkInTime && (
													<p className='text-xs text-muted-foreground mt-1'>
														Since{' '}
														{format(
															new Date(
																booking.checkInTime
															),
															'h:mm a'
														)}
													</p>
												)}
											</div>
										</div>
									))}
								</div>
							) : (
								<p className='text-muted-foreground text-center py-4'>
									No one currently checked in
								</p>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Upcoming Bookings */}
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<CardTitle className='flex items-center gap-2'>
								<Calendar className='h-5 w-5' />
								Upcoming Bookings
							</CardTitle>
							<Link href='/admin/bookings'>
								<Button
									variant='ghost'
									size='sm'
								>
									View All
								</Button>
							</Link>
						</div>
					</CardHeader>
					<CardContent>
						{upcomingBookings.length > 0 ? (
							<div className='space-y-3'>
								{upcomingBookings.map((booking) => (
									<div
										key={booking.id}
										className='flex items-center justify-between p-3 bg-muted/50 rounded-lg'
									>
										<div>
											<p className='font-medium'>
												{booking.user.name}
											</p>
											<p className='text-sm text-muted-foreground'>
												{booking.space.name}
											</p>
										</div>
										<div className='text-right'>
											<Badge variant='outline'>
												{booking.bookingNumber}
											</Badge>
											<p className='text-xs text-muted-foreground mt-1'>
												{format(
													new Date(booking.startTime),
													'MMM d, h:mm a'
												)}
											</p>
										</div>
									</div>
								))}
							</div>
						) : (
							<p className='text-muted-foreground text-center py-4'>
								No upcoming bookings
							</p>
						)}
					</CardContent>
				</Card>

				{/* Quick Actions */}
				<div className='mt-8'>
					<h2 className='text-lg font-semibold mb-4'>
						Quick Actions
					</h2>
					<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
						<Link href='/admin/scanner'>
							<Card className='hover:bg-muted/50 transition-colors cursor-pointer'>
								<CardContent className='p-6 text-center'>
									<QrCode className='h-8 w-8 mx-auto mb-2 text-primary' />
									<p className='font-medium'>Scan QR Code</p>
									<p className='text-xs text-muted-foreground'>
										Check in members
									</p>
								</CardContent>
							</Card>
						</Link>
						<Link href='/admin/bookings'>
							<Card className='hover:bg-muted/50 transition-colors cursor-pointer'>
								<CardContent className='p-6 text-center'>
									<Calendar className='h-8 w-8 mx-auto mb-2 text-blue-500' />
									<p className='font-medium'>
										Manage Bookings
									</p>
									<p className='text-xs text-muted-foreground'>
										View all bookings
									</p>
								</CardContent>
							</Card>
						</Link>
						<Link href='/admin/spaces'>
							<Card className='hover:bg-muted/50 transition-colors cursor-pointer'>
								<CardContent className='p-6 text-center'>
									<LayoutGrid className='h-8 w-8 mx-auto mb-2 text-green-500' />
									<p className='font-medium'>Manage Spaces</p>
									<p className='text-xs text-muted-foreground'>
										Add or edit spaces
									</p>
								</CardContent>
							</Card>
						</Link>
						<Link href='/admin/reports'>
							<Card className='hover:bg-muted/50 transition-colors cursor-pointer'>
								<CardContent className='p-6 text-center'>
									<FileText className='h-8 w-8 mx-auto mb-2 text-orange-500' />
									<p className='font-medium'>View Reports</p>
									<p className='text-xs text-muted-foreground'>
										Revenue & analytics
									</p>
								</CardContent>
							</Card>
						</Link>
					</div>
				</div>
			</main>
		</div>
	);
}
