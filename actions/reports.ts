'use server';

import { prisma } from '@/lib/db';
import { getCurrentAdmin } from './auth';

// ============================================
// TYPES
// ============================================

export type TimeFrame =
	| 'today'
	| 'yesterday'
	| 'last7days'
	| 'last30days'
	| 'thisMonth'
	| 'lastMonth'
	| 'thisQuarter'
	| 'thisYear'
	| 'custom';

export interface DateRange {
	startDate: Date;
	endDate: Date;
}

export interface ReportResult<T> {
	success: boolean;
	message: string;
	data?: T;
	error?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getDateRangeFromTimeFrame(
	timeFrame: TimeFrame,
	customRange?: { start: string; end: string }
): DateRange {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

	switch (timeFrame) {
		case 'today':
			return {
				startDate: today,
				endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
			};
		case 'yesterday':
			const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
			return {
				startDate: yesterday,
				endDate: new Date(today.getTime() - 1),
			};
		case 'last7days':
			return {
				startDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
				endDate: now,
			};
		case 'last30days':
			return {
				startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
				endDate: now,
			};
		case 'thisMonth':
			return {
				startDate: new Date(now.getFullYear(), now.getMonth(), 1),
				endDate: now,
			};
		case 'lastMonth':
			return {
				startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
				endDate: new Date(
					now.getFullYear(),
					now.getMonth(),
					0,
					23,
					59,
					59
				),
			};
		case 'thisQuarter':
			const quarter = Math.floor(now.getMonth() / 3);
			return {
				startDate: new Date(now.getFullYear(), quarter * 3, 1),
				endDate: now,
			};
		case 'thisYear':
			return {
				startDate: new Date(now.getFullYear(), 0, 1),
				endDate: now,
			};
		case 'custom':
			if (customRange) {
				return {
					startDate: new Date(customRange.start),
					endDate: new Date(customRange.end),
				};
			}
			return { startDate: today, endDate: now };
		default:
			return { startDate: today, endDate: now };
	}
}

// ============================================
// REVENUE REPORTS
// ============================================

export interface RevenueOverview {
	totalRevenue: number;
	bookingRevenue: number;
	membershipRevenue: number;
	shopRevenue: number;
	addonRevenue: number;
	taxCollected: number;
	refunds: number;
	netRevenue: number;
	transactionCount: number;
	averageTransactionValue: number;
	paymentMethodBreakdown: { method: string; amount: number; count: number }[];
}

export async function getRevenueOverview(
	timeFrame: TimeFrame,
	customRange?: { start: string; end: string }
): Promise<ReportResult<RevenueOverview>> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, message: 'Unauthorized' };
		}

		const { startDate, endDate } = getDateRangeFromTimeFrame(
			timeFrame,
			customRange
		);

		// Get booking payments
		const bookingPayments = await prisma.payment.aggregate({
			where: {
				bookingId: { not: null },
				status: 'PAID',
				paidAt: { gte: startDate, lte: endDate },
			},
			_sum: { amount: true, taxAmount: true },
			_count: true,
		});

		// Get membership payments
		const membershipPayments = await prisma.payment.aggregate({
			where: {
				membershipId: { not: null },
				status: 'PAID',
				paidAt: { gte: startDate, lte: endDate },
			},
			_sum: { amount: true, taxAmount: true },
			_count: true,
		});

		// Get shop orders
		const shopOrders = await prisma.shopOrder.aggregate({
			where: {
				status: { in: ['PAID', 'PREPARING', 'READY', 'SERVED'] },
				createdAt: { gte: startDate, lte: endDate },
			},
			_sum: { totalAmount: true, tax: true },
			_count: true,
		});

		// Get addon purchases
		const addonPurchases = await prisma.addonPurchase.aggregate({
			where: {
				status: { in: ['ACTIVE', 'PARTIALLY_USED', 'USED'] },
				createdAt: { gte: startDate, lte: endDate },
			},
			_sum: { totalAmount: true },
			_count: true,
		});

		// Get refunds
		const refunds = await prisma.payment.aggregate({
			where: {
				status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] },
				refundedAt: { gte: startDate, lte: endDate },
			},
			_sum: { amount: true },
			_count: true,
		});

		// Payment method breakdown
		const paymentMethods = await prisma.payment.groupBy({
			by: ['method'],
			where: {
				status: 'PAID',
				paidAt: { gte: startDate, lte: endDate },
			},
			_sum: { amount: true },
			_count: true,
		});

		const bookingRev = bookingPayments._sum?.amount || 0;
		const membershipRev = membershipPayments._sum?.amount || 0;
		const shopRev = shopOrders._sum?.totalAmount || 0;
		const addonRev = addonPurchases._sum?.totalAmount || 0;
		const totalRefunds = refunds._sum?.amount || 0;
		const taxCollected =
			(bookingPayments._sum?.taxAmount || 0) +
			(membershipPayments._sum?.taxAmount || 0) +
			(shopOrders._sum?.tax || 0);

		const totalRevenue = bookingRev + membershipRev + shopRev + addonRev;
		const transactionCount =
			(bookingPayments._count || 0) +
			(membershipPayments._count || 0) +
			((shopOrders._count as number) || 0) +
			(addonPurchases._count || 0);

		return {
			success: true,
			message: 'Revenue overview retrieved',
			data: {
				totalRevenue,
				bookingRevenue: bookingRev,
				membershipRevenue: membershipRev,
				shopRevenue: shopRev,
				addonRevenue: addonRev,
				taxCollected,
				refunds: totalRefunds,
				netRevenue: totalRevenue - totalRefunds,
				transactionCount,
				averageTransactionValue:
					transactionCount > 0
						? Math.round(totalRevenue / transactionCount)
						: 0,
				paymentMethodBreakdown: paymentMethods.map((pm) => ({
					method: pm.method,
					amount: pm._sum.amount || 0,
					count: pm._count || 0,
				})),
			},
		};
	} catch (error) {
		console.error('Error getting revenue overview:', error);
		return {
			success: false,
			message: 'Failed to get revenue overview',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export interface RevenueTrend {
	date: string;
	revenue: number;
	bookings: number;
	memberships: number;
	shop: number;
}

export async function getRevenueTrends(
	timeFrame: TimeFrame,
	customRange?: { start: string; end: string }
): Promise<ReportResult<RevenueTrend[]>> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, message: 'Unauthorized' };
		}

		const { startDate, endDate } = getDateRangeFromTimeFrame(
			timeFrame,
			customRange
		);

		// Get daily payments for the period
		const payments = await prisma.payment.findMany({
			where: {
				status: 'PAID',
				paidAt: { gte: startDate, lte: endDate },
			},
			select: {
				amount: true,
				paidAt: true,
				bookingId: true,
				membershipId: true,
			},
		});

		// Get shop orders
		const shopOrders = await prisma.shopOrder.findMany({
			where: {
				status: { in: ['PAID', 'PREPARING', 'READY', 'SERVED'] },
				createdAt: { gte: startDate, lte: endDate },
			},
			select: {
				totalAmount: true,
				createdAt: true,
			},
		});

		// Group by date
		const trendsMap = new Map<string, RevenueTrend>();

		payments.forEach((p) => {
			if (!p.paidAt) return;
			const dateKey = p.paidAt.toISOString().split('T')[0];
			const existing = trendsMap.get(dateKey) || {
				date: dateKey,
				revenue: 0,
				bookings: 0,
				memberships: 0,
				shop: 0,
			};
			existing.revenue += p.amount;
			if (p.bookingId) existing.bookings += p.amount;
			if (p.membershipId) existing.memberships += p.amount;
			trendsMap.set(dateKey, existing);
		});

		shopOrders.forEach((o) => {
			const dateKey = o.createdAt.toISOString().split('T')[0];
			const existing = trendsMap.get(dateKey) || {
				date: dateKey,
				revenue: 0,
				bookings: 0,
				memberships: 0,
				shop: 0,
			};
			existing.revenue += o.totalAmount;
			existing.shop += o.totalAmount;
			trendsMap.set(dateKey, existing);
		});

		const trends = Array.from(trendsMap.values()).sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
		);

		return {
			success: true,
			message: 'Revenue trends retrieved',
			data: trends,
		};
	} catch (error) {
		console.error('Error getting revenue trends:', error);
		return {
			success: false,
			message: 'Failed to get revenue trends',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// CLIENT ANALYTICS
// ============================================

export interface ClientOverview {
	totalClients: number;
	activeClients: number;
	newClients: number;
	clientsWithBookings: number;
	clientsWithMemberships: number;
	retentionRate: number;
}

export async function getClientOverview(
	timeFrame: TimeFrame,
	customRange?: { start: string; end: string }
): Promise<ReportResult<ClientOverview>> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, message: 'Unauthorized' };
		}

		const { startDate, endDate } = getDateRangeFromTimeFrame(
			timeFrame,
			customRange
		);

		// Total clients
		const totalClients = await prisma.user.count({
			where: { role: 'CLIENT' },
		});

		// Active clients (with activity in period)
		const activeClients = await prisma.user.count({
			where: {
				role: 'CLIENT',
				OR: [
					{
						bookings: {
							some: {
								createdAt: { gte: startDate, lte: endDate },
							},
						},
					},
					{
						memberships: {
							some: {
								createdAt: { gte: startDate, lte: endDate },
							},
						},
					},
					{
						payments: {
							some: { paidAt: { gte: startDate, lte: endDate } },
						},
					},
				],
			},
		});

		// New clients in period
		const newClients = await prisma.user.count({
			where: {
				role: 'CLIENT',
				createdAt: { gte: startDate, lte: endDate },
			},
		});

		// Clients with bookings
		const clientsWithBookings = await prisma.user.count({
			where: {
				role: 'CLIENT',
				bookings: { some: {} },
			},
		});

		// Clients with memberships
		const clientsWithMemberships = await prisma.user.count({
			where: {
				role: 'CLIENT',
				memberships: { some: {} },
			},
		});

		// Calculate retention (clients who made repeat transactions)
		const returningClients = await prisma.user.count({
			where: {
				role: 'CLIENT',
				payments: { some: { status: 'PAID' } },
				AND: [
					{ payments: { some: { paidAt: { lt: startDate } } } },
					{
						payments: {
							some: { paidAt: { gte: startDate, lte: endDate } },
						},
					},
				],
			},
		});

		const previousClients = await prisma.user.count({
			where: {
				role: 'CLIENT',
				payments: {
					some: { paidAt: { lt: startDate }, status: 'PAID' },
				},
			},
		});

		const retentionRate =
			previousClients > 0
				? Math.round((returningClients / previousClients) * 100)
				: 0;

		return {
			success: true,
			message: 'Client overview retrieved',
			data: {
				totalClients,
				activeClients,
				newClients,
				clientsWithBookings,
				clientsWithMemberships,
				retentionRate,
			},
		};
	} catch (error) {
		console.error('Error getting client overview:', error);
		return {
			success: false,
			message: 'Failed to get client overview',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export interface TopClient {
	id: string;
	name: string;
	email: string;
	company: string | null;
	totalSpent: number;
	bookingCount: number;
	membershipCount: number;
	lastActivity: Date | null;
}

export async function getTopClientsByRevenue(
	timeFrame: TimeFrame,
	customRange?: { start: string; end: string },
	limit: number = 10
): Promise<ReportResult<TopClient[]>> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, message: 'Unauthorized' };
		}

		const { startDate, endDate } = getDateRangeFromTimeFrame(
			timeFrame,
			customRange
		);

		const clients = await prisma.user.findMany({
			where: {
				role: 'CLIENT',
				payments: {
					some: {
						status: 'PAID',
						paidAt: { gte: startDate, lte: endDate },
					},
				},
			},
			include: {
				payments: {
					where: {
						status: 'PAID',
						paidAt: { gte: startDate, lte: endDate },
					},
					select: { amount: true, paidAt: true },
				},
				bookings: {
					where: { createdAt: { gte: startDate, lte: endDate } },
					select: { id: true },
				},
				memberships: {
					where: { createdAt: { gte: startDate, lte: endDate } },
					select: { id: true },
				},
			},
		});

		const topClients = clients
			.map((client) => ({
				id: client.id,
				name: client.name,
				email: client.email,
				company: client.company,
				totalSpent: client.payments.reduce(
					(sum, p) => sum + p.amount,
					0
				),
				bookingCount: client.bookings.length,
				membershipCount: client.memberships.length,
				lastActivity:
					client.payments.length > 0
						? client.payments.reduce(
								(latest, p) =>
									p.paidAt && (!latest || p.paidAt > latest)
										? p.paidAt
										: latest,
								null as Date | null
						  )
						: null,
			}))
			.sort((a, b) => b.totalSpent - a.totalSpent)
			.slice(0, limit);

		return {
			success: true,
			message: 'Top clients retrieved',
			data: topClients,
		};
	} catch (error) {
		console.error('Error getting top clients:', error);
		return {
			success: false,
			message: 'Failed to get top clients',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getTopClientsByBookings(
	timeFrame: TimeFrame,
	customRange?: { start: string; end: string },
	limit: number = 10
): Promise<ReportResult<TopClient[]>> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, message: 'Unauthorized' };
		}

		const { startDate, endDate } = getDateRangeFromTimeFrame(
			timeFrame,
			customRange
		);

		const clients = await prisma.user.findMany({
			where: {
				role: 'CLIENT',
				bookings: {
					some: {
						createdAt: { gte: startDate, lte: endDate },
					},
				},
			},
			include: {
				payments: {
					where: { status: 'PAID' },
					select: { amount: true, paidAt: true },
				},
				bookings: {
					where: { createdAt: { gte: startDate, lte: endDate } },
					select: { id: true },
				},
				memberships: {
					select: { id: true },
				},
			},
		});

		const topClients = clients
			.map((client) => ({
				id: client.id,
				name: client.name,
				email: client.email,
				company: client.company,
				totalSpent: client.payments.reduce(
					(sum, p) => sum + p.amount,
					0
				),
				bookingCount: client.bookings.length,
				membershipCount: client.memberships.length,
				lastActivity:
					client.payments.length > 0
						? client.payments.reduce(
								(latest, p) =>
									p.paidAt && (!latest || p.paidAt > latest)
										? p.paidAt
										: latest,
								null as Date | null
						  )
						: null,
			}))
			.sort((a, b) => b.bookingCount - a.bookingCount)
			.slice(0, limit);

		return {
			success: true,
			message: 'Top clients by bookings retrieved',
			data: topClients,
		};
	} catch (error) {
		console.error('Error getting top clients by bookings:', error);
		return {
			success: false,
			message: 'Failed to get top clients by bookings',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// BOOKING ANALYTICS
// ============================================

export interface BookingOverview {
	totalBookings: number;
	confirmedBookings: number;
	completedBookings: number;
	cancelledBookings: number;
	noShows: number;
	totalValue: number;
	averageBookingValue: number;
	averageAttendees: number;
	cancellationRate: number;
	noShowRate: number;
}

export async function getBookingOverview(
	timeFrame: TimeFrame,
	customRange?: { start: string; end: string }
): Promise<ReportResult<BookingOverview>> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, message: 'Unauthorized' };
		}

		const { startDate, endDate } = getDateRangeFromTimeFrame(
			timeFrame,
			customRange
		);

		const bookings = await prisma.booking.findMany({
			where: {
				createdAt: { gte: startDate, lte: endDate },
			},
			select: {
				status: true,
				totalAmount: true,
				attendees: true,
			},
		});

		const totalBookings = bookings.length;
		const confirmedBookings = bookings.filter(
			(b) => b.status === 'CONFIRMED'
		).length;
		const completedBookings = bookings.filter(
			(b) => b.status === 'COMPLETED'
		).length;
		const cancelledBookings = bookings.filter(
			(b) => b.status === 'CANCELLED'
		).length;
		const noShows = bookings.filter((b) => b.status === 'NO_SHOW').length;
		const totalValue = bookings
			.filter((b) => b.status !== 'CANCELLED')
			.reduce((sum, b) => sum + b.totalAmount, 0);
		const totalAttendees = bookings.reduce(
			(sum, b) => sum + b.attendees,
			0
		);

		return {
			success: true,
			message: 'Booking overview retrieved',
			data: {
				totalBookings,
				confirmedBookings,
				completedBookings,
				cancelledBookings,
				noShows,
				totalValue,
				averageBookingValue:
					totalBookings > 0
						? Math.round(
								totalValue / (totalBookings - cancelledBookings)
						  )
						: 0,
				averageAttendees:
					totalBookings > 0
						? Math.round((totalAttendees / totalBookings) * 10) / 10
						: 0,
				cancellationRate:
					totalBookings > 0
						? Math.round((cancelledBookings / totalBookings) * 100)
						: 0,
				noShowRate:
					totalBookings > 0
						? Math.round((noShows / totalBookings) * 100)
						: 0,
			},
		};
	} catch (error) {
		console.error('Error getting booking overview:', error);
		return {
			success: false,
			message: 'Failed to get booking overview',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export interface PopularSpace {
	id: string;
	name: string;
	type: string;
	bookingCount: number;
	totalRevenue: number;
	averageOccupancy: number;
}

export async function getPopularSpaces(
	timeFrame: TimeFrame,
	customRange?: { start: string; end: string },
	limit: number = 10
): Promise<ReportResult<PopularSpace[]>> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, message: 'Unauthorized' };
		}

		const { startDate, endDate } = getDateRangeFromTimeFrame(
			timeFrame,
			customRange
		);

		const spaces = await prisma.space.findMany({
			where: {
				bookings: {
					some: {
						createdAt: { gte: startDate, lte: endDate },
						status: { not: 'CANCELLED' },
					},
				},
			},
			include: {
				bookings: {
					where: {
						createdAt: { gte: startDate, lte: endDate },
						status: { not: 'CANCELLED' },
					},
					select: {
						totalAmount: true,
						attendees: true,
					},
				},
			},
		});

		const popularSpaces = spaces
			.map((space) => ({
				id: space.id,
				name: space.name,
				type: space.type,
				bookingCount: space.bookings.length,
				totalRevenue: space.bookings.reduce(
					(sum, b) => sum + b.totalAmount,
					0
				),
				averageOccupancy:
					space.capacity > 0 && space.bookings.length > 0
						? Math.round(
								(space.bookings.reduce(
									(sum, b) => sum + b.attendees,
									0
								) /
									(space.bookings.length * space.capacity)) *
									100
						  )
						: 0,
			}))
			.sort((a, b) => b.bookingCount - a.bookingCount)
			.slice(0, limit);

		return {
			success: true,
			message: 'Popular spaces retrieved',
			data: popularSpaces,
		};
	} catch (error) {
		console.error('Error getting popular spaces:', error);
		return {
			success: false,
			message: 'Failed to get popular spaces',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export interface PeakHour {
	hour: number;
	bookingCount: number;
	label: string;
}

export async function getPeakBookingHours(
	timeFrame: TimeFrame,
	customRange?: { start: string; end: string }
): Promise<ReportResult<PeakHour[]>> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, message: 'Unauthorized' };
		}

		const { startDate, endDate } = getDateRangeFromTimeFrame(
			timeFrame,
			customRange
		);

		const bookings = await prisma.booking.findMany({
			where: {
				createdAt: { gte: startDate, lte: endDate },
				status: { not: 'CANCELLED' },
			},
			select: {
				startTime: true,
			},
		});

		// Count bookings by hour
		const hourCounts = new Map<number, number>();
		for (let i = 0; i < 24; i++) {
			hourCounts.set(i, 0);
		}

		bookings.forEach((b) => {
			const hour = b.startTime.getHours();
			hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
		});

		const peakHours: PeakHour[] = Array.from(hourCounts.entries())
			.map(([hour, count]) => ({
				hour,
				bookingCount: count,
				label: `${hour.toString().padStart(2, '0')}:00`,
			}))
			.sort((a, b) => a.hour - b.hour);

		return {
			success: true,
			message: 'Peak hours retrieved',
			data: peakHours,
		};
	} catch (error) {
		console.error('Error getting peak hours:', error);
		return {
			success: false,
			message: 'Failed to get peak hours',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export interface EarlyBirdClient {
	id: string;
	name: string;
	email: string;
	company: string | null;
	averageLeadTime: number; // Days in advance
	bookingCount: number;
	earliestBooking: number; // Max days in advance
}

export async function getEarlyBirdClients(
	timeFrame: TimeFrame,
	customRange?: { start: string; end: string },
	limit: number = 10
): Promise<ReportResult<EarlyBirdClient[]>> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, message: 'Unauthorized' };
		}

		const { startDate, endDate } = getDateRangeFromTimeFrame(
			timeFrame,
			customRange
		);

		const bookings = await prisma.booking.findMany({
			where: {
				createdAt: { gte: startDate, lte: endDate },
				status: { not: 'CANCELLED' },
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						company: true,
					},
				},
			},
		});

		// Calculate lead time for each booking
		const clientLeadTimes = new Map<
			string,
			{
				user: {
					id: string;
					name: string;
					email: string;
					company: string | null;
				};
				leadTimes: number[];
			}
		>();

		bookings.forEach((booking) => {
			const leadTime = Math.floor(
				(booking.bookingDate.getTime() - booking.createdAt.getTime()) /
					(1000 * 60 * 60 * 24)
			);
			if (leadTime > 0) {
				const existing = clientLeadTimes.get(booking.userId);
				if (existing) {
					existing.leadTimes.push(leadTime);
				} else {
					clientLeadTimes.set(booking.userId, {
						user: booking.user,
						leadTimes: [leadTime],
					});
				}
			}
		});

		const earlyBirds = Array.from(clientLeadTimes.values())
			.map(({ user, leadTimes }) => ({
				id: user.id,
				name: user.name,
				email: user.email,
				company: user.company,
				averageLeadTime: Math.round(
					leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length
				),
				bookingCount: leadTimes.length,
				earliestBooking: Math.max(...leadTimes),
			}))
			.sort((a, b) => b.averageLeadTime - a.averageLeadTime)
			.slice(0, limit);

		return {
			success: true,
			message: 'Early bird clients retrieved',
			data: earlyBirds,
		};
	} catch (error) {
		console.error('Error getting early bird clients:', error);
		return {
			success: false,
			message: 'Failed to get early bird clients',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// SHOP ANALYTICS
// ============================================

export interface TopShopItem {
	id: string;
	name: string;
	category: string;
	quantitySold: number;
	totalRevenue: number;
	averagePrice: number;
}

export async function getTopShopItems(
	timeFrame: TimeFrame,
	customRange?: { start: string; end: string },
	limit: number = 10
): Promise<ReportResult<TopShopItem[]>> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, message: 'Unauthorized' };
		}

		const { startDate, endDate } = getDateRangeFromTimeFrame(
			timeFrame,
			customRange
		);

		const orderItems = await prisma.shopOrderItem.findMany({
			where: {
				order: {
					status: { in: ['PAID', 'PREPARING', 'READY', 'SERVED'] },
					createdAt: { gte: startDate, lte: endDate },
				},
			},
			include: {
				shopItem: {
					select: {
						id: true,
						name: true,
						category: {
							select: { name: true },
						},
					},
				},
			},
		});

		// Aggregate by item
		const itemStats = new Map<
			string,
			{
				item: { id: string; name: string; category: { name: string } };
				quantity: number;
				revenue: number;
			}
		>();

		orderItems.forEach((oi) => {
			const existing = itemStats.get(oi.shopItemId);
			if (existing) {
				existing.quantity += oi.quantity;
				existing.revenue += oi.totalPrice;
			} else {
				itemStats.set(oi.shopItemId, {
					item: oi.shopItem,
					quantity: oi.quantity,
					revenue: oi.totalPrice,
				});
			}
		});

		const topItems = Array.from(itemStats.values())
			.map(({ item, quantity, revenue }) => ({
				id: item.id,
				name: item.name,
				category: item.category.name,
				quantitySold: quantity,
				totalRevenue: revenue,
				averagePrice: quantity > 0 ? Math.round(revenue / quantity) : 0,
			}))
			.sort((a, b) => b.quantitySold - a.quantitySold)
			.slice(0, limit);

		return {
			success: true,
			message: 'Top shop items retrieved',
			data: topItems,
		};
	} catch (error) {
		console.error('Error getting top shop items:', error);
		return {
			success: false,
			message: 'Failed to get top shop items',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// MEMBERSHIP ANALYTICS
// ============================================

export interface MembershipOverview {
	activeMemberships: number;
	expiredMemberships: number;
	cancelledMemberships: number;
	totalValue: number;
	renewalRate: number;
	upcomingRenewals: number;
	averageMembershipDuration: number; // in days
}

export async function getMembershipOverview(
	timeFrame: TimeFrame,
	customRange?: { start: string; end: string }
): Promise<ReportResult<MembershipOverview>> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, message: 'Unauthorized' };
		}

		const { startDate, endDate } = getDateRangeFromTimeFrame(
			timeFrame,
			customRange
		);
		const now = new Date();
		const thirtyDaysFromNow = new Date(
			now.getTime() + 30 * 24 * 60 * 60 * 1000
		);

		// Active memberships
		const activeMemberships = await prisma.membership.count({
			where: { status: 'ACTIVE' },
		});

		// Expired memberships in period
		const expiredMemberships = await prisma.membership.count({
			where: {
				status: 'EXPIRED',
				endDate: { gte: startDate, lte: endDate },
			},
		});

		// Cancelled memberships in period
		const cancelledMemberships = await prisma.membership.count({
			where: {
				status: 'CANCELLED',
				updatedAt: { gte: startDate, lte: endDate },
			},
		});

		// Total membership value in period
		const membershipPayments = await prisma.payment.aggregate({
			where: {
				membershipId: { not: null },
				status: 'PAID',
				paidAt: { gte: startDate, lte: endDate },
			},
			_sum: { amount: true },
		});

		// Renewal rate (renewed vs expired)
		const renewedMemberships = await prisma.membership.count({
			where: {
				renewedAt: { gte: startDate, lte: endDate },
			},
		});

		const expiredInPeriod = await prisma.membership.count({
			where: {
				endDate: { gte: startDate, lte: endDate },
			},
		});

		// Upcoming renewals (next 30 days)
		const upcomingRenewals = await prisma.membership.count({
			where: {
				status: 'ACTIVE',
				autoRenew: true,
				endDate: { gte: now, lte: thirtyDaysFromNow },
			},
		});

		// Average membership duration
		const memberships = await prisma.membership.findMany({
			where: {
				status: { in: ['ACTIVE', 'EXPIRED'] },
			},
			select: {
				startDate: true,
				endDate: true,
			},
		});

		const totalDuration = memberships.reduce((sum, m) => {
			const duration = Math.floor(
				(m.endDate.getTime() - m.startDate.getTime()) /
					(1000 * 60 * 60 * 24)
			);
			return sum + duration;
		}, 0);

		return {
			success: true,
			message: 'Membership overview retrieved',
			data: {
				activeMemberships,
				expiredMemberships,
				cancelledMemberships,
				totalValue: membershipPayments._sum.amount || 0,
				renewalRate:
					expiredInPeriod > 0
						? Math.round(
								(renewedMemberships / expiredInPeriod) * 100
						  )
						: 0,
				upcomingRenewals,
				averageMembershipDuration:
					memberships.length > 0
						? Math.round(totalDuration / memberships.length)
						: 0,
			},
		};
	} catch (error) {
		console.error('Error getting membership overview:', error);
		return {
			success: false,
			message: 'Failed to get membership overview',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// SPACE UTILIZATION
// ============================================

export interface ReportSpaceUtilization {
	id: string;
	name: string;
	type: string;
	capacity: number;
	totalBookings: number;
	totalHours: number;
	utilizationRate: number; // percentage
	revenue: number;
}

export async function getReportSpaceUtilization(
	timeFrame: TimeFrame,
	customRange?: { start: string; end: string }
): Promise<ReportResult<ReportSpaceUtilization[]>> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, message: 'Unauthorized' };
		}

		const { startDate, endDate } = getDateRangeFromTimeFrame(
			timeFrame,
			customRange
		);
		const totalDays = Math.ceil(
			(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
		);
		const operatingHoursPerDay = 12; // Assuming 12 operating hours per day

		const spaces = await prisma.space.findMany({
			where: {
				type: 'BOOKING', // Only booking spaces for utilization
			},
			include: {
				bookings: {
					where: {
						bookingDate: { gte: startDate, lte: endDate },
						status: {
							in: ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'],
						},
					},
					select: {
						startTime: true,
						endTime: true,
						totalAmount: true,
					},
				},
			},
		});

		const utilization = spaces.map((space) => {
			const totalHours = space.bookings.reduce((sum, b) => {
				const hours =
					(b.endTime.getTime() - b.startTime.getTime()) /
					(1000 * 60 * 60);
				return sum + hours;
			}, 0);

			const availableHours = totalDays * operatingHoursPerDay;
			const utilizationRate =
				availableHours > 0
					? Math.round((totalHours / availableHours) * 100)
					: 0;

			return {
				id: space.id,
				name: space.name,
				type: space.type,
				capacity: space.capacity,
				totalBookings: space.bookings.length,
				totalHours: Math.round(totalHours * 10) / 10,
				utilizationRate,
				revenue: space.bookings.reduce(
					(sum, b) => sum + b.totalAmount,
					0
				),
			};
		});

		return {
			success: true,
			message: 'Space utilization retrieved',
			data: utilization.sort(
				(a, b) => b.utilizationRate - a.utilizationRate
			),
		};
	} catch (error) {
		console.error('Error getting space utilization:', error);
		return {
			success: false,
			message: 'Failed to get space utilization',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// VISITOR ANALYTICS
// ============================================

export interface VisitorOverview {
	totalVisitors: number;
	checkedInVisitors: number;
	checkedOutVisitors: number;
	pendingVisitors: number;
	averageVisitDuration: number; // in minutes
}

export async function getVisitorOverview(
	timeFrame: TimeFrame,
	customRange?: { start: string; end: string }
): Promise<ReportResult<VisitorOverview>> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, message: 'Unauthorized' };
		}

		const { startDate, endDate } = getDateRangeFromTimeFrame(
			timeFrame,
			customRange
		);

		const visitors = await prisma.visitor.findMany({
			where: {
				createdAt: { gte: startDate, lte: endDate },
			},
			select: {
				status: true,
				checkInTime: true,
				checkOutTime: true,
			},
		});

		const totalVisitors = visitors.length;
		const checkedInVisitors = visitors.filter(
			(v) => v.status === 'CHECKED_IN'
		).length;
		const checkedOutVisitors = visitors.filter(
			(v) => v.status === 'CHECKED_OUT'
		).length;
		const pendingVisitors = visitors.filter(
			(v) => v.status === 'PENDING'
		).length;

		// Calculate average visit duration for completed visits
		const completedVisits = visitors.filter(
			(v) => v.checkInTime && v.checkOutTime
		);
		const totalDuration = completedVisits.reduce((sum, v) => {
			if (v.checkInTime && v.checkOutTime) {
				return (
					sum +
					(v.checkOutTime.getTime() - v.checkInTime.getTime()) /
						(1000 * 60)
				);
			}
			return sum;
		}, 0);

		return {
			success: true,
			message: 'Visitor overview retrieved',
			data: {
				totalVisitors,
				checkedInVisitors,
				checkedOutVisitors,
				pendingVisitors,
				averageVisitDuration:
					completedVisits.length > 0
						? Math.round(totalDuration / completedVisits.length)
						: 0,
			},
		};
	} catch (error) {
		console.error('Error getting visitor overview:', error);
		return {
			success: false,
			message: 'Failed to get visitor overview',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// LEADERBOARD
// ============================================

export interface LeaderboardEntry {
	rank: number;
	id: string;
	name: string;
	email: string;
	company: string | null;
	avatar: string | null;
	score: number;
	metric: string;
}

export async function getClientLeaderboard(
	timeFrame: TimeFrame,
	customRange?: { start: string; end: string },
	limit: number = 10
): Promise<
	ReportResult<{
		byRevenue: LeaderboardEntry[];
		byBookings: LeaderboardEntry[];
		byEarlyBird: LeaderboardEntry[];
		byLoyalty: LeaderboardEntry[];
	}>
> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, message: 'Unauthorized' };
		}

		const { startDate, endDate } = getDateRangeFromTimeFrame(
			timeFrame,
			customRange
		);

		// Get all clients with their activity
		const clients = await prisma.user.findMany({
			where: {
				role: 'CLIENT',
			},
			include: {
				payments: {
					where: {
						status: 'PAID',
						paidAt: { gte: startDate, lte: endDate },
					},
					select: { amount: true },
				},
				bookings: {
					where: {
						createdAt: { gte: startDate, lte: endDate },
						status: { not: 'CANCELLED' },
					},
					select: {
						id: true,
						createdAt: true,
						bookingDate: true,
					},
				},
				memberships: {
					where: { status: 'ACTIVE' },
					select: {
						startDate: true,
					},
				},
			},
		});

		// By Revenue
		const byRevenue = clients
			.map((c) => ({
				id: c.id,
				name: c.name,
				email: c.email,
				company: c.company,
				avatar: c.avatar,
				score: c.payments.reduce((sum, p) => sum + p.amount, 0),
			}))
			.filter((c) => c.score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, limit)
			.map((c, i) => ({ ...c, rank: i + 1, metric: 'Total Spent' }));

		// By Bookings
		const byBookings = clients
			.map((c) => ({
				id: c.id,
				name: c.name,
				email: c.email,
				company: c.company,
				avatar: c.avatar,
				score: c.bookings.length,
			}))
			.filter((c) => c.score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, limit)
			.map((c, i) => ({ ...c, rank: i + 1, metric: 'Bookings' }));

		// By Early Bird (average lead time in days)
		const byEarlyBird = clients
			.map((c) => {
				const leadTimes = c.bookings
					.map((b) =>
						Math.floor(
							(b.bookingDate.getTime() - b.createdAt.getTime()) /
								(1000 * 60 * 60 * 24)
						)
					)
					.filter((lt) => lt > 0);
				return {
					id: c.id,
					name: c.name,
					email: c.email,
					company: c.company,
					avatar: c.avatar,
					score:
						leadTimes.length > 0
							? Math.round(
									leadTimes.reduce((a, b) => a + b, 0) /
										leadTimes.length
							  )
							: 0,
				};
			})
			.filter((c) => c.score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, limit)
			.map((c, i) => ({ ...c, rank: i + 1, metric: 'Days Ahead' }));

		// By Loyalty (longest active membership)
		const now = new Date();
		const byLoyalty = clients
			.map((c) => {
				const oldestMembership = c.memberships.sort(
					(a, b) => a.startDate.getTime() - b.startDate.getTime()
				)[0];
				return {
					id: c.id,
					name: c.name,
					email: c.email,
					company: c.company,
					avatar: c.avatar,
					score: oldestMembership
						? Math.floor(
								(now.getTime() -
									oldestMembership.startDate.getTime()) /
									(1000 * 60 * 60 * 24)
						  )
						: 0,
				};
			})
			.filter((c) => c.score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, limit)
			.map((c, i) => ({ ...c, rank: i + 1, metric: 'Days Member' }));

		return {
			success: true,
			message: 'Client leaderboard retrieved',
			data: {
				byRevenue,
				byBookings,
				byEarlyBird,
				byLoyalty,
			},
		};
	} catch (error) {
		console.error('Error getting client leaderboard:', error);
		return {
			success: false,
			message: 'Failed to get client leaderboard',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}
