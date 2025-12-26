'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Download,
	TrendingUp,
	DollarSign,
	Users,
	Calendar,
	CalendarDays,
	LayoutGrid,
	FileText,
	QrCode,
	UserCog,
	Package,
	ShoppingCart,
	Blocks,
} from 'lucide-react';
import { format } from 'date-fns';
import type { RevenueData, SpaceUtilization } from '@/actions/admin';

interface AdminReportsClientProps {
	revenueData: RevenueData[];
	spaceUtilization: SpaceUtilization[];
	totalRevenue: number;
	totalBookings: number;
	totalUsers: number;
}

export default function AdminReportsClient({
	revenueData,
	spaceUtilization,
	totalRevenue,
	totalBookings,
	totalUsers,
}: AdminReportsClientProps) {
	const [period, setPeriod] = useState('month');

	const handleExport = () => {
		// Create CSV content
		const headers = [
			'Space',
			'Total Bookings',
			'Total Hours',
			'Revenue (₦)',
		];
		const rows = spaceUtilization.map((space) => [
			space.spaceName,
			space.totalBookings,
			space.totalHours,
			(space.revenue / 100).toFixed(2),
		]);

		const csv = [
			headers.join(','),
			...rows.map((row) => row.join(',')),
		].join('\n');

		// Download CSV
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `amg-workspace-report-${format(
			new Date(),
			'yyyy-MM-dd'
		)}.csv`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	};

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
							</div>
							<h1 className='text-2xl font-bold'>
								Reports & Analytics
							</h1>
						</div>
						<Button
							variant='outline'
							onClick={handleExport}
							className='bg-transparent border-secondary-foreground/20'
						>
							<Download className='mr-2 h-4 w-4' />
							Export Report
						</Button>
					</div>
				</div>
			</section>

			{/* Navigation */}
			<section className='border-b bg-muted/30'>
				<div className='container mx-auto px-4'>
					<nav className='flex gap-1 overflow-x-auto'>
						<Link
							href='/admin/dashboard'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<LayoutGrid className='h-4 w-4' />
							Overview
						</Link>
						<Link
							href='/admin/bookings'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<Calendar className='h-4 w-4' />
							Bookings
						</Link>
						<Link
							href='/admin/spaces'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<LayoutGrid className='h-4 w-4' />
							Spaces
						</Link>
						<Link
							href='/admin/members'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<UserCog className='h-4 w-4' />
							Members
						</Link>
						<Link
							href='/admin/tours'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<CalendarDays className='h-4 w-4' />
							Tours
						</Link>
						<Link
							href='/admin/inventory'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<Package className='h-4 w-4' />
							Inventory
						</Link>
						<Link
							href='/admin/shop'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<ShoppingCart className='h-4 w-4' />
							Shop
						</Link>
						<Link
							href='/admin/addons'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<Blocks className='h-4 w-4' />
							Add-ons
						</Link>
						<Link
							href='/admin/reports'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-primary text-foreground'
						>
							<FileText className='h-4 w-4' />
							Reports
						</Link>
						<Link
							href='/admin/scanner'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<QrCode className='h-4 w-4' />
							QR Scanner
						</Link>
					</nav>
				</div>
			</section>

			{/* Content */}
			<section className='px-4 py-8'>
				<div className='container mx-auto space-y-6'>
					{/* Stats Overview */}
					<div className='grid gap-4 md:grid-cols-3'>
						<Card>
							<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
								<CardTitle className='text-sm font-medium'>
									Total Revenue
								</CardTitle>
								<DollarSign className='h-4 w-4 text-muted-foreground' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold'>
									₦{(totalRevenue / 100).toLocaleString()}
								</div>
								<p className='text-xs text-muted-foreground'>
									All time revenue
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
								<CardTitle className='text-sm font-medium'>
									Total Bookings
								</CardTitle>
								<Calendar className='h-4 w-4 text-muted-foreground' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold'>
									{totalBookings}
								</div>
								<p className='text-xs text-muted-foreground'>
									Completed bookings
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
								<CardTitle className='text-sm font-medium'>
									Total Users
								</CardTitle>
								<Users className='h-4 w-4 text-muted-foreground' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold'>
									{totalUsers}
								</div>
								<p className='text-xs text-muted-foreground'>
									Registered users
								</p>
							</CardContent>
						</Card>
					</div>

					{/* Revenue Trends */}
					<Card>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<div>
									<CardTitle>Revenue Trends</CardTitle>
									<p className='text-sm text-muted-foreground mt-1'>
										Revenue over time
									</p>
								</div>
								<Select
									value={period}
									onValueChange={setPeriod}
								>
									<SelectTrigger className='w-[150px]'>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='day'>
											Daily
										</SelectItem>
										<SelectItem value='week'>
											Weekly
										</SelectItem>
										<SelectItem value='month'>
											Monthly
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</CardHeader>
						<CardContent>
							<div className='space-y-2'>
								{revenueData.slice(0, 10).map((item) => (
									<div
										key={item.date}
										className='flex items-center justify-between border-b pb-2 last:border-0'
									>
										<span className='text-sm font-medium'>
											{format(
												new Date(item.date),
												'MMM dd, yyyy'
											)}
										</span>
										<div className='flex items-center gap-2'>
											<span className='text-sm font-bold'>
												₦
												{(
													item.amount / 100
												).toLocaleString()}
											</span>
											<TrendingUp className='h-4 w-4 text-green-500' />
										</div>
									</div>
								))}
								{revenueData.length === 0 && (
									<p className='text-sm text-muted-foreground text-center py-4'>
										No revenue data available
									</p>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Space Utilization */}
					<Card>
						<CardHeader>
							<CardTitle>Space Utilization</CardTitle>
							<p className='text-sm text-muted-foreground'>
								Performance by space
							</p>
						</CardHeader>
						<CardContent>
							<div className='space-y-4'>
								{spaceUtilization.map((space) => (
									<div
										key={space.spaceId}
										className='flex items-center justify-between border-b pb-4 last:border-0'
									>
										<div className='flex-1'>
											<h4 className='font-medium'>
												{space.spaceName}
											</h4>
											<div className='flex gap-4 mt-1 text-sm text-muted-foreground'>
												<span>
													{space.totalBookings}{' '}
													bookings
												</span>
												<span>
													{space.totalHours} hours
												</span>
											</div>
										</div>
										<div className='text-right'>
											<p className='text-lg font-bold'>
												₦
												{(
													space.revenue / 100
												).toLocaleString()}
											</p>
											<p className='text-xs text-muted-foreground'>
												Revenue
											</p>
										</div>
									</div>
								))}
								{spaceUtilization.length === 0 && (
									<p className='text-sm text-muted-foreground text-center py-4'>
										No utilization data available
									</p>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			</section>
		</div>
	);
}
