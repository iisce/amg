import { notFound, redirect } from 'next/navigation';

import { prisma } from '@/lib/db';
import { getCurrentAdmin } from '@/actions/auth';
import MemberDetailClient from './member-detail-client';

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function AdminMemberDetailPage({ params }: PageProps) {
	const admin = await getCurrentAdmin();
	const { id } = await params;

	if (!admin) {
		redirect('/admin/login');
	}

	// Fetch comprehensive user data with all relations
	const user = await prisma.user.findUnique({
		where: { id },
		select: {
			id: true,
			email: true,
			name: true,
			phone: true,
			company: true,
			avatar: true,
			role: true,
			isActive: true,
			emailVerified: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	if (!user) {
		notFound();
	}

	// Fetch all related data in parallel for performance
	const [bookings, memberships, payments, activityLogs, stats] =
		await Promise.all([
			// All bookings
			prisma.booking.findMany({
				where: { userId: id },
				select: {
					id: true,
					bookingNumber: true,
					bookingDate: true,
					startTime: true,
					endTime: true,
					totalAmount: true,
					status: true,
					paymentStatus: true,
					checkInTime: true,
					checkOutTime: true,
					notes: true,
					createdAt: true,
					space: {
						select: {
							name: true,
						},
					},
					pricingPlan: {
						select: {
							name: true,
						},
					},
				},
				orderBy: {
					bookingDate: 'desc',
				},
				take: 50,
			}),

			// All memberships with check-ins
			prisma.membership.findMany({
				where: { userId: id },
				select: {
					id: true,
					membershipNumber: true,
					type: true,
					totalAmount: true,
					startDate: true,
					endDate: true,
					status: true,
					paymentStatus: true,
					assignedDesk: true,
					daysAllowed: true,
					autoRenew: true,
					createdAt: true,
					space: {
						select: {
							name: true,
						},
					},
					pricingPlan: {
						select: {
							name: true,
						},
					},
					checkIns: {
						select: {
							id: true,
							checkInTime: true,
							checkOutTime: true,
							notes: true,
						},
						orderBy: {
							checkInTime: 'desc',
						},
					},
				},
				orderBy: {
					createdAt: 'desc',
				},
			}),

			// All payments
			prisma.payment.findMany({
				where: { userId: id },
				select: {
					id: true,
					reference: true,
					amount: true,
					method: true,
					status: true,
					paidAt: true,
					createdAt: true,
				},
				orderBy: {
					createdAt: 'desc',
				},
				take: 50,
			}),

			// Activity logs
			prisma.activityLog.findMany({
				where: { userId: id },
				select: {
					id: true,
					action: true,
					entityType: true,
					entityId: true,
					metadata: true,
					createdAt: true,
				},
				orderBy: {
					createdAt: 'desc',
				},
				take: 50,
			}),

			// Calculate stats
			Promise.all([
				prisma.booking.count({ where: { userId: id } }),
				prisma.membership.count({ where: { userId: id } }),
				prisma.payment.aggregate({
					where: { userId: id, status: 'PAID' },
					_sum: { amount: true },
				}),
				prisma.membershipCheckIn.count({
					where: { membership: { userId: id } },
				}),
			]),
		]);

	const [totalBookings, totalMemberships, totalSpentAgg, totalCheckIns] =
		stats;

	return (
		<MemberDetailClient
			user={user}
			bookings={bookings}
			memberships={memberships}
			payments={payments}
			activityLogs={
				activityLogs as Array<{
					id: string;
					action: string;
					entityType: string | null;
					entityId: string | null;
					metadata: Record<string, unknown> | null;
					createdAt: Date;
				}>
			}
			stats={{
				totalBookings,
				totalMemberships,
				totalSpent: totalSpentAgg._sum.amount || 0,
				totalCheckIns,
			}}
			currentAdmin={{
				role: admin.role,
			}}
		/>
	);
}
