import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/actions';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
	ArrowLeft,
	Mail,
	Phone,
	Building2,
	Calendar,
	Shield,
} from 'lucide-react';

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function AdminMemberDetailPage({ params }: PageProps) {
	const admin = await getCurrentAdmin();
	const { id } = await params;

	if (!admin) {
		redirect('/admin/login');
	}

	const user = await prisma.user.findUnique({
		where: { id },
		include: {
			bookings: {
				include: {
					space: true,
					pricingPlan: true,
				},
				orderBy: {
					createdAt: 'desc',
				},
				take: 10,
			},
			memberships: {
				include: {
					space: true,
					pricingPlan: true,
				},
				orderBy: {
					createdAt: 'desc',
				},
			},
			payments: {
				orderBy: {
					createdAt: 'desc',
				},
				take: 10,
			},
		},
	});

	if (!user) {
		notFound();
	}

	const totalSpent = user.payments
		.filter((p) => p.status === 'PAID')
		.reduce((sum, p) => sum + p.amount, 0);

	return (
		<div className='space-y-6 p-6'>
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-4'>
					<Link href='/admin/members'>
						<Button
							variant='outline'
							size='icon'
						>
							<ArrowLeft className='h-4 w-4' />
						</Button>
					</Link>
					<div>
						<h1 className='text-3xl font-bold'>{user.name}</h1>
						<p className='text-muted-foreground'>{user.email}</p>
					</div>
				</div>
				<Badge variant={user.isActive ? 'default' : 'destructive'}>
					{user.isActive ? 'Active' : 'Inactive'}
				</Badge>
			</div>

			<div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Role
						</CardTitle>
						<Shield className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{user.role}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Total Bookings
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{user.bookings.length}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Memberships
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{user.memberships.length}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Total Spent
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							₦{(totalSpent / 100).toLocaleString()}
						</div>
					</CardContent>
				</Card>
			</div>

			<div className='grid gap-6 md:grid-cols-2'>
				<Card>
					<CardHeader>
						<CardTitle>Contact Information</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='flex items-center gap-3'>
							<Mail className='h-5 w-5 text-muted-foreground' />
							<div>
								<p className='text-sm font-medium'>Email</p>
								<p className='text-sm text-muted-foreground'>
									{user.email}
								</p>
							</div>
						</div>
						{user.phone && (
							<div className='flex items-center gap-3'>
								<Phone className='h-5 w-5 text-muted-foreground' />
								<div>
									<p className='text-sm font-medium'>Phone</p>
									<p className='text-sm text-muted-foreground'>
										{user.phone}
									</p>
								</div>
							</div>
						)}
						{user.company && (
							<div className='flex items-center gap-3'>
								<Building2 className='h-5 w-5 text-muted-foreground' />
								<div>
									<p className='text-sm font-medium'>
										Company
									</p>
									<p className='text-sm text-muted-foreground'>
										{user.company}
									</p>
								</div>
							</div>
						)}
						<div className='flex items-center gap-3'>
							<Calendar className='h-5 w-5 text-muted-foreground' />
							<div>
								<p className='text-sm font-medium'>
									Member Since
								</p>
								<p className='text-sm text-muted-foreground'>
									{new Date(
										user.createdAt
									).toLocaleDateString()}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Recent Activity</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						{user.bookings.slice(0, 5).map((booking) => (
							<div
								key={booking.id}
								className='flex items-center justify-between'
							>
								<div>
									<p className='text-sm font-medium'>
										{booking.space.name}
									</p>
									<p className='text-xs text-muted-foreground'>
										{new Date(
											booking.startTime
										).toLocaleDateString()}
									</p>
								</div>
								<Badge variant='outline'>
									{booking.status}
								</Badge>
							</div>
						))}
						{user.bookings.length === 0 && (
							<p className='text-sm text-muted-foreground'>
								No bookings yet
							</p>
						)}
					</CardContent>
				</Card>
			</div>

			{user.memberships.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Active Memberships</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							{user.memberships
								.filter((m) => m.status === 'ACTIVE')
								.map((membership) => (
									<div
										key={membership.id}
										className='flex items-center justify-between border-b pb-4 last:border-0'
									>
										<div>
											<p className='font-medium'>
												{membership.space.name}
											</p>
											<p className='text-sm text-muted-foreground'>
												{membership.pricingPlan.name} -{' '}
												₦
												{(
													membership.pricingPlan
														.price / 100
												).toLocaleString()}
												/
												{
													membership.pricingPlan
														.duration
												}
											</p>
											{membership.assignedDesk && (
												<p className='text-sm text-muted-foreground'>
													Desk #
													{membership.assignedDesk}
												</p>
											)}
										</div>
										<div className='text-right'>
											<p className='text-sm font-medium'>
												{new Date(
													membership.startDate
												).toLocaleDateString()}{' '}
												-{' '}
												{new Date(
													membership.endDate
												).toLocaleDateString()}
											</p>
											<Badge variant='outline'>
												{membership.status}
											</Badge>
										</div>
									</div>
								))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
