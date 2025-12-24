'use server';

import { prisma } from '@/lib/db';
import { getCurrentAdmin } from './auth';

// ============================================
// TYPES
// ============================================

export interface DashboardStats {
	totalUsers: number;
	newUsersThisMonth: number;
	totalBookings: number;
	bookingsThisMonth: number;
	totalSubscriptions: number;
	activeSubscriptions: number;
	totalRevenue: number;
	revenueThisMonth: number;
	occupancyRate: number;
	checkedInToday: number;
}

export interface RevenueData {
	date: string;
	amount: number;
}

export interface SpaceUtilization {
	spaceId: string;
	spaceName: string;
	totalBookings: number;
	totalHours: number;
	revenue: number;
}

export interface AdminResult<T = unknown> {
	success: boolean;
	message: string;
	data?: T;
	error?: string;
}

// ============================================
// DASHBOARD STATS
// ============================================

export async function getDashboardStats(): Promise<
	AdminResult<DashboardStats>
> {
	try {
		const admin = await getCurrentAdmin();

		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const startOfDay = new Date(now.setHours(0, 0, 0, 0));

		const [
			totalUsers,
			newUsersThisMonth,
			totalBookings,
			bookingsThisMonth,
			totalSubscriptions,
			activeSubscriptions,
			totalRevenue,
			revenueThisMonth,
			totalSpaces,
			bookedSpacesToday,
			checkedInToday,
		] = await Promise.all([
			prisma.user.count({ where: { role: 'CLIENT' } }),
			prisma.user.count({
				where: { role: 'CLIENT', createdAt: { gte: startOfMonth } },
			}),
			prisma.booking.count(),
			prisma.booking.count({
				where: { createdAt: { gte: startOfMonth } },
			}),
			prisma.membership.count(),
			prisma.membership.count({ where: { status: 'ACTIVE' } }),
			prisma.payment.aggregate({
				where: { status: 'PAID' },
				_sum: { amount: true },
			}),
			prisma.payment.aggregate({
				where: { status: 'PAID', createdAt: { gte: startOfMonth } },
				_sum: { amount: true },
			}),
			prisma.space.count({ where: { isActive: true } }),
			prisma.booking.findMany({
				where: {
					bookingDate: {
						gte: startOfDay,
						lt: new Date(
							startOfDay.getTime() + 24 * 60 * 60 * 1000
						),
					},
					status: { in: ['CONFIRMED', 'CHECKED_IN'] },
				},
				select: { spaceId: true },
				distinct: ['spaceId'],
			}),
			prisma.booking.count({
				where: {
					status: 'CHECKED_IN',
					checkInTime: {
						gte: startOfDay,
						lt: new Date(
							startOfDay.getTime() + 24 * 60 * 60 * 1000
						),
					},
				},
			}),
		]);

		const occupancyRate =
			totalSpaces > 0
				? Math.round((bookedSpacesToday.length / totalSpaces) * 100)
				: 0;

		return {
			success: true,
			message: 'Dashboard stats fetched',
			data: {
				totalUsers,
				newUsersThisMonth,
				totalBookings,
				bookingsThisMonth,
				totalSubscriptions,
				activeSubscriptions,
				totalRevenue: totalRevenue._sum?.amount || 0,
				revenueThisMonth: revenueThisMonth._sum?.amount || 0,
				occupancyRate,
				checkedInToday,
			},
		};
	} catch (error) {
		console.error('Get dashboard stats error:', error);
		return {
			success: false,
			message: 'Failed to fetch dashboard stats',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// REVENUE REPORTS
// ============================================

export async function getRevenueReport(options: {
	startDate: Date;
	endDate: Date;
	groupBy: 'day' | 'week' | 'month';
}): Promise<AdminResult<RevenueData[]>> {
	try {
		const admin = await getCurrentAdmin();

		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const payments = await prisma.payment.findMany({
			where: {
				status: 'PAID',
				paidAt: {
					gte: options.startDate,
					lte: options.endDate,
				},
			},
			select: {
				amount: true,
				paidAt: true,
			},
			orderBy: { paidAt: 'asc' },
		});

		// Group by period
		const groupedData: Record<string, number> = {};

		payments.forEach((payment: { amount: number; paidAt: Date | null }) => {
			if (!payment.paidAt) return;

			let key: string;
			const date = new Date(payment.paidAt);

			switch (options.groupBy) {
				case 'day':
					key = date.toISOString().split('T')[0];
					break;
				case 'week':
					const weekStart = new Date(date);
					weekStart.setDate(date.getDate() - date.getDay());
					key = weekStart.toISOString().split('T')[0];
					break;
				case 'month':
					key = `${date.getFullYear()}-${String(
						date.getMonth() + 1
					).padStart(2, '0')}`;
					break;
			}

			groupedData[key] = (groupedData[key] || 0) + payment.amount;
		});

		const data: RevenueData[] = Object.entries(groupedData).map(
			([date, amount]) => ({
				date,
				amount,
			})
		);

		return {
			success: true,
			message: 'Revenue report generated',
			data,
		};
	} catch (error) {
		console.error('Get revenue report error:', error);
		return {
			success: false,
			message: 'Failed to generate revenue report',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// SPACE UTILIZATION
// ============================================

export async function getSpaceUtilization(options?: {
	startDate?: Date;
	endDate?: Date;
}): Promise<AdminResult<SpaceUtilization[]>> {
	try {
		const admin = await getCurrentAdmin();

		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const { startDate, endDate } = options || {};

		const spaces = await prisma.space.findMany({
			where: { isActive: true },
			select: {
				id: true,
				name: true,
				bookings: {
					where: {
						status: {
							in: ['CONFIRMED', 'COMPLETED', 'CHECKED_IN'],
						},
						...(startDate && { bookingDate: { gte: startDate } }),
						...(endDate && { bookingDate: { lte: endDate } }),
					},
					select: {
						startTime: true,
						endTime: true,
						totalAmount: true,
					},
				},
			},
		});

		type SpaceWithBookings = {
			id: string;
			name: string;
			bookings: {
				startTime: Date;
				endTime: Date;
				totalAmount: number;
			}[];
		};

		const utilization: SpaceUtilization[] = spaces.map(
			(space: SpaceWithBookings) => {
				let totalHours = 0;
				let revenue = 0;

				space.bookings.forEach(
					(booking: {
						startTime: Date;
						endTime: Date;
						totalAmount: number;
					}) => {
						const hours =
							(booking.endTime.getTime() -
								booking.startTime.getTime()) /
							(1000 * 60 * 60);
						totalHours += hours;
						revenue += booking.totalAmount;
					}
				);

				return {
					spaceId: space.id,
					spaceName: space.name,
					totalBookings: space.bookings.length,
					totalHours: Math.round(totalHours * 10) / 10,
					revenue,
				};
			}
		);

		return {
			success: true,
			message: 'Space utilization fetched',
			data: utilization.sort((a, b) => b.totalBookings - a.totalBookings),
		};
	} catch (error) {
		console.error('Get space utilization error:', error);
		return {
			success: false,
			message: 'Failed to fetch space utilization',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// ACTIVITY LOGS
// ============================================

export async function getActivityLogs(options?: {
	userId?: string;
	action?: string;
	entityType?: string;
	entityId?: string;
	limit?: number;
	offset?: number;
}): Promise<
	AdminResult<{
		logs: Array<{
			id: string;
			action: string;
			entityType: string | null;
			entityId: string | null;
			metadata: unknown;
			ipAddress: string | null;
			createdAt: Date;
			user: {
				id: string;
				name: string;
				email: string;
			} | null;
		}>;
		total: number;
	}>
> {
	try {
		const admin = await getCurrentAdmin();

		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const {
			userId,
			action,
			entityType,
			entityId,
			limit = 50,
			offset = 0,
		} = options || {};

		const [logs, total] = await Promise.all([
			prisma.activityLog.findMany({
				where: {
					...(userId && { userId }),
					...(action && { action: { contains: action } }),
					...(entityType && { entityType }),
					...(entityId && { entityId }),
				},
				include: {
					user: {
						select: { id: true, name: true, email: true },
					},
				},
				orderBy: { createdAt: 'desc' },
				take: limit,
				skip: offset,
			}),
			prisma.activityLog.count({
				where: {
					...(userId && { userId }),
					...(action && { action: { contains: action } }),
					...(entityType && { entityType }),
					...(entityId && { entityId }),
				},
			}),
		]);

		return {
			success: true,
			message: 'Activity logs fetched',
			data: { logs, total },
		};
	} catch (error) {
		console.error('Get activity logs error:', error);
		return {
			success: false,
			message: 'Failed to fetch activity logs',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// BOOKING MANAGEMENT (Admin)
// ============================================

export async function getAdminBookings(options?: {
	status?: string;
	spaceId?: string;
	fromDate?: Date;
	toDate?: Date;
	search?: string;
	limit?: number;
	offset?: number;
}): Promise<
	AdminResult<{
		bookings: Array<{
			id: string;
			bookingNumber: string;
			status: string;
			bookingDate: Date;
			startTime: Date;
			endTime: Date;
			totalAmount: number;
			paymentStatus: string;
			checkInTime: Date | null;
			user: {
				id: string;
				name: string;
				email: string;
				phone: string | null;
			};
			space: { id: string; name: string };
			pricingPlan: { name: string; price: number };
		}>;
		total: number;
	}>
> {
	try {
		const admin = await getCurrentAdmin();

		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const {
			status,
			spaceId,
			fromDate,
			toDate,
			search,
			limit = 50,
			offset = 0,
		} = options || {};

		const where = {
			...(status && { status: status as never }),
			...(spaceId && { spaceId }),
			...(fromDate && { bookingDate: { gte: fromDate } }),
			...(toDate && { bookingDate: { lte: toDate } }),
			...(search && {
				OR: [
					{
						bookingNumber: {
							contains: search,
							mode: 'insensitive' as const,
						},
					},
					{
						user: {
							name: {
								contains: search,
								mode: 'insensitive' as const,
							},
						},
					},
					{
						user: {
							email: {
								contains: search,
								mode: 'insensitive' as const,
							},
						},
					},
				],
			}),
		};

		const [bookings, total] = await Promise.all([
			prisma.booking.findMany({
				where,
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
							phone: true,
						},
					},
					space: {
						select: { id: true, name: true },
					},
					pricingPlan: {
						select: { name: true, price: true },
					},
				},
				orderBy: { bookingDate: 'desc' },
				take: limit,
				skip: offset,
			}),
			prisma.booking.count({ where }),
		]);

		return {
			success: true,
			message: 'Bookings fetched',
			data: { bookings, total },
		};
	} catch (error) {
		console.error('Get admin bookings error:', error);
		return {
			success: false,
			message: 'Failed to fetch bookings',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// MEMBER MANAGEMENT
// ============================================

export async function getAdminMembers(options?: {
	status?: string;
	spaceId?: string;
	type?: string;
	search?: string;
	limit?: number;
	offset?: number;
}): Promise<
	AdminResult<{
		members: Array<{
			id: string;
			membershipNumber: string;
			type: string;
			status: string;
			startDate: Date;
			endDate: Date;
			totalAmount: number;
			paymentStatus: string;
			assignedDesk: string | null;
			user: {
				id: string;
				name: string;
				email: string;
				phone: string | null;
			};
			space: { id: string; name: string };
		}>;
		total: number;
	}>
> {
	try {
		const admin = await getCurrentAdmin();

		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const {
			status,
			spaceId,
			type,
			search,
			limit = 50,
			offset = 0,
		} = options || {};

		const where = {
			...(status && { status: status as never }),
			...(spaceId && { spaceId }),
			...(type && { type: type as never }),
			...(search && {
				OR: [
					{
						membershipNumber: {
							contains: search,
							mode: 'insensitive' as const,
						},
					},
					{
						user: {
							name: {
								contains: search,
								mode: 'insensitive' as const,
							},
						},
					},
					{
						user: {
							email: {
								contains: search,
								mode: 'insensitive' as const,
							},
						},
					},
				],
			}),
		};

		const [members, total] = await Promise.all([
			prisma.membership.findMany({
				where,
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
							phone: true,
						},
					},
					space: {
						select: { id: true, name: true },
					},
				},
				orderBy: { createdAt: 'desc' },
				take: limit,
				skip: offset,
			}),
			prisma.membership.count({ where }),
		]);

		return {
			success: true,
			message: 'Members fetched',
			data: { members, total },
		};
	} catch (error) {
		console.error('Get admin members error:', error);
		return {
			success: false,
			message: 'Failed to fetch members',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// TODAY'S OVERVIEW
// ============================================

export async function getTodayOverview(): Promise<
	AdminResult<{
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
	}>
> {
	try {
		const admin = await getCurrentAdmin();

		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const now = new Date();
		const startOfDay = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate()
		);
		const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

		const [expectedCheckIns, currentlyCheckedIn, upcomingBookings] =
			await Promise.all([
				prisma.booking.findMany({
					where: {
						bookingDate: { gte: startOfDay, lt: endOfDay },
						status: 'CONFIRMED',
					},
					select: {
						id: true,
						bookingNumber: true,
						startTime: true,
						endTime: true,
						status: true,
						user: { select: { name: true, email: true } },
						space: { select: { name: true } },
					},
					orderBy: { startTime: 'asc' },
				}),
				prisma.booking.findMany({
					where: {
						status: 'CHECKED_IN',
					},
					select: {
						id: true,
						bookingNumber: true,
						checkInTime: true,
						user: { select: { name: true } },
						space: { select: { name: true } },
					},
				}),
				prisma.booking.findMany({
					where: {
						bookingDate: { gt: endOfDay },
						status: 'CONFIRMED',
					},
					select: {
						id: true,
						bookingNumber: true,
						startTime: true,
						user: { select: { name: true } },
						space: { select: { name: true } },
					},
					orderBy: { startTime: 'asc' },
					take: 10,
				}),
			]);

		return {
			success: true,
			message: "Today's overview fetched",
			data: {
				expectedCheckIns,
				currentlyCheckedIn,
				upcomingBookings,
			},
		};
	} catch (error) {
		console.error("Get today's overview error:", error);
		return {
			success: false,
			message: "Failed to fetch today's overview",
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// EXPORT DATA
// ============================================

export async function exportBookingsCSV(options: {
	fromDate: Date;
	toDate: Date;
}): Promise<AdminResult<string>> {
	try {
		const admin = await getCurrentAdmin();

		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const bookings = await prisma.booking.findMany({
			where: {
				bookingDate: {
					gte: options.fromDate,
					lte: options.toDate,
				},
			},
			include: {
				user: { select: { name: true, email: true, phone: true } },
				space: { select: { name: true } },
				pricingPlan: { select: { name: true, price: true } },
			},
			orderBy: { bookingDate: 'asc' },
		});

		// Generate CSV
		const headers = [
			'Booking Number',
			'Customer Name',
			'Email',
			'Phone',
			'Space',
			'Plan',
			'Date',
			'Start Time',
			'End Time',
			'Status',
			'Payment Status',
			'Amount (₦)',
		];

		type BookingForExport = {
			bookingNumber: string;
			bookingDate: Date;
			startTime: Date;
			endTime: Date;
			status: string;
			paymentStatus: string;
			totalAmount: number;
			user: { name: string; email: string; phone: string | null };
			space: { name: string };
			pricingPlan: { name: string; price: number };
		};

		const rows = bookings.map((b: BookingForExport) => [
			b.bookingNumber,
			b.user.name,
			b.user.email,
			b.user.phone || '',
			b.space.name,
			b.pricingPlan.name,
			b.bookingDate.toISOString().split('T')[0],
			b.startTime.toISOString(),
			b.endTime.toISOString(),
			b.status,
			b.paymentStatus,
			(b.totalAmount / 100).toFixed(2),
		]);

		const csv = [
			headers.join(','),
			...rows.map((r: string[]) => r.join(',')),
		].join('\n');

		return {
			success: true,
			message: 'CSV generated',
			data: csv,
		};
	} catch (error) {
		console.error('Export bookings CSV error:', error);
		return {
			success: false,
			message: 'Failed to export bookings',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// SETTINGS
// ============================================

export async function getSystemSettings(): Promise<
	AdminResult<Record<string, string>>
> {
	try {
		const admin = await getCurrentAdmin();

		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		// In production, fetch from a settings table
		// For now, return environment-based settings
		return {
			success: true,
			message: 'Settings fetched',
			data: {
				appName: 'AMG Workspace',
				currency: 'NGN',
				timezone: 'Africa/Lagos',
				supportEmail:
					process.env.SUPPORT_EMAIL || 'support@amgworkspace.com',
				paystackEnabled: process.env.PAYSTACK_SECRET_KEY
					? 'true'
					: 'false',
			},
		};
	} catch (error) {
		console.error('Get system settings error:', error);
		return {
			success: false,
			message: 'Failed to fetch settings',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}
