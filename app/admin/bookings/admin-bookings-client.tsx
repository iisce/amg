'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Calendar,
	CalendarDays,
	Clock,
	Search,
	Filter,
	Plus,
	Eye,
	LayoutGrid,
	UserCog,
	FileText,
	QrCode,
	Package,
	ShoppingCart,
	Blocks,
} from 'lucide-react';
import { format } from 'date-fns';
import type { BookingWithRelations } from '@/actions/bookings';

interface AdminBookingsClientProps {
	bookings: BookingWithRelations[];
}

// Helper to format price from kobo
const formatPrice = (kobo: number) => {
	return (kobo / 100).toLocaleString();
};

export default function AdminBookingsClient({
	bookings,
}: AdminBookingsClientProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');

	const filteredBookings = bookings.filter((booking) => {
		const matchesSearch =
			booking.user.name
				.toLowerCase()
				.includes(searchQuery.toLowerCase()) ||
			booking.bookingNumber
				.toLowerCase()
				.includes(searchQuery.toLowerCase()) ||
			booking.space.name
				.toLowerCase()
				.includes(searchQuery.toLowerCase());

		const matchesStatus =
			statusFilter === 'all' ||
			booking.status.toLowerCase() === statusFilter;

		return matchesSearch && matchesStatus;
	});

	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case 'confirmed':
				return 'text-blue-600 border-blue-600';
			case 'checked_in':
				return 'text-green-600 border-green-600';
			case 'completed':
				return 'text-gray-600 border-gray-600';
			case 'pending':
				return 'text-yellow-600 border-yellow-600';
			case 'cancelled':
				return 'text-red-600 border-red-600';
			default:
				return 'text-gray-600 border-gray-600';
		}
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
								Bookings Management
							</h1>
						</div>
						<Button asChild>
							<Link href='/admin/scanner'>
								<Plus className='mr-2 h-4 w-4' />
								Check-in via QR
							</Link>
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
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-primary bg-background'
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
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
					{/* Filters */}
					<Card>
						<CardContent className='py-4'>
							<div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
								<div className='relative flex-1'>
									<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
									<Input
										placeholder='Search by ID, customer, or space...'
										className='pl-9 bg-transparent'
										value={searchQuery}
										onChange={(e) =>
											setSearchQuery(e.target.value)
										}
									/>
								</div>
								<div className='flex gap-2'>
									<Select
										value={statusFilter}
										onValueChange={setStatusFilter}
									>
										<SelectTrigger className='w-[150px] bg-transparent'>
											<Filter className='mr-2 h-4 w-4' />
											<SelectValue placeholder='Status' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='all'>
												All Status
											</SelectItem>
											<SelectItem value='pending'>
												Pending
											</SelectItem>
											<SelectItem value='confirmed'>
												Confirmed
											</SelectItem>
											<SelectItem value='checked_in'>
												Checked In
											</SelectItem>
											<SelectItem value='completed'>
												Completed
											</SelectItem>
											<SelectItem value='cancelled'>
												Cancelled
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Bookings List */}
					<div className='space-y-4'>
						{filteredBookings.length > 0 ? (
							filteredBookings.map((booking) => (
								<Card key={booking.id}>
									<CardContent className='py-4'>
										<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
											<div className='flex-1 space-y-2'>
												<div className='flex items-center gap-3'>
													<span className='font-mono text-sm text-muted-foreground'>
														{booking.bookingNumber}
													</span>
													<Badge
														variant='outline'
														className={getStatusColor(
															booking.status
														)}
													>
														{booking.status.replace(
															'_',
															' '
														)}
													</Badge>
												</div>
												<div>
													<div className='font-semibold'>
														{booking.space.name}
													</div>
													<div className='text-sm text-muted-foreground'>
														{booking.user.name} •{' '}
														{booking.user.email}
													</div>
												</div>
												<div className='flex items-center gap-4 text-sm'>
													<div className='flex items-center gap-1'>
														<Calendar className='h-4 w-4 text-muted-foreground' />
														<span>
															{format(
																new Date(
																	booking.bookingDate
																),
																'PPP'
															)}
														</span>
													</div>
													<div className='flex items-center gap-1'>
														<Clock className='h-4 w-4 text-muted-foreground' />
														<span>
															{format(
																new Date(
																	booking.startTime
																),
																'HH:mm'
															)}{' '}
															-{' '}
															{format(
																new Date(
																	booking.endTime
																),
																'HH:mm'
															)}
														</span>
													</div>
												</div>
											</div>
											<div className='flex items-center gap-4'>
												<div className='text-right'>
													<div className='font-bold text-primary'>
														₦
														{formatPrice(
															booking.totalAmount
														)}
													</div>
												</div>
												<Button
													size='sm'
													variant='outline'
													asChild
												>
													<Link
														href={`/admin/bookings/${booking.id}`}
													>
														<Eye className='mr-2 h-4 w-4' />
														View
													</Link>
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							))
						) : (
							<Card>
								<CardContent className='py-12 text-center'>
									<Calendar className='h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50' />
									<h3 className='text-lg font-semibold mb-2'>
										No bookings found
									</h3>
									<p className='text-muted-foreground'>
										{searchQuery || statusFilter !== 'all'
											? 'Try adjusting your search or filters'
											: 'No bookings have been made yet'}
									</p>
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			</section>
		</div>
	);
}
