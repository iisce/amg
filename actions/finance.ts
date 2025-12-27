'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getCurrentAdmin } from './auth';
import type { PaymentStatus, PaymentMethod } from '@prisma/client';

// ============================================
// TYPES
// ============================================

export interface FinanceSettings {
	taxEnabled: boolean;
	taxRate: number; // Percentage e.g., 7.5
	taxName: string; // e.g., "VAT", "Sales Tax"
	taxNumber: string; // Business tax ID
	currency: string;
	currencySymbol: string;
	invoicePrefix: string;
	invoiceFooter: string;
}

export interface FinanceResult<T = unknown> {
	success: boolean;
	message: string;
	data?: T;
	error?: string;
}

export interface TransactionSummary {
	totalRevenue: number;
	totalTax: number;
	totalTransactions: number;
	paidTransactions: number;
	pendingTransactions: number;
	failedTransactions: number;
	refundedAmount: number;
}

export interface RevenueByPeriod {
	period: string;
	revenue: number;
	tax: number;
	count: number;
}

export interface RevenueBySource {
	source: string;
	revenue: number;
	tax: number;
	count: number;
	percentage: number;
}

export interface TransactionWithDetails {
	id: string;
	reference: string;
	type: 'booking' | 'membership' | 'shop' | 'addon';
	description: string;
	customerName: string;
	customerEmail: string;
	subtotal: number;
	taxAmount: number;
	taxRate: number;
	amount: number;
	method: PaymentMethod;
	status: PaymentStatus;
	paidAt: Date | null;
	createdAt: Date;
}

// ============================================
// SETTINGS HELPERS
// ============================================

const DEFAULT_FINANCE_SETTINGS: FinanceSettings = {
	taxEnabled: false,
	taxRate: 7.5,
	taxName: 'VAT',
	taxNumber: '',
	currency: 'NGN',
	currencySymbol: '₦',
	invoicePrefix: 'INV',
	invoiceFooter: 'Thank you for your business!',
};

async function getSetting(key: string): Promise<string | null> {
	const setting = await prisma.systemSettings.findUnique({
		where: { key },
	});
	return setting?.value ?? null;
}

async function setSetting(
	key: string,
	value: string,
	options?: {
		type?: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
		group?: string;
		label?: string;
		description?: string;
	}
): Promise<void> {
	await prisma.systemSettings.upsert({
		where: { key },
		update: { value, updatedAt: new Date() },
		create: {
			key,
			value,
			type: options?.type ?? 'STRING',
			group: options?.group ?? 'general',
			label: options?.label,
			description: options?.description,
		},
	});
}

// ============================================
// FINANCE SETTINGS ACTIONS
// ============================================

export async function getFinanceSettings(): Promise<
	FinanceResult<FinanceSettings>
> {
	try {
		const settings = await prisma.systemSettings.findMany({
			where: { group: 'finance' },
		});

		const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

		const financeSettings: FinanceSettings = {
			taxEnabled: settingsMap.get('finance.taxEnabled') === 'true',
			taxRate: parseFloat(settingsMap.get('finance.taxRate') || '7.5'),
			taxName:
				settingsMap.get('finance.taxName') ||
				DEFAULT_FINANCE_SETTINGS.taxName,
			taxNumber: settingsMap.get('finance.taxNumber') || '',
			currency:
				settingsMap.get('finance.currency') ||
				DEFAULT_FINANCE_SETTINGS.currency,
			currencySymbol:
				settingsMap.get('finance.currencySymbol') ||
				DEFAULT_FINANCE_SETTINGS.currencySymbol,
			invoicePrefix:
				settingsMap.get('finance.invoicePrefix') ||
				DEFAULT_FINANCE_SETTINGS.invoicePrefix,
			invoiceFooter:
				settingsMap.get('finance.invoiceFooter') ||
				DEFAULT_FINANCE_SETTINGS.invoiceFooter,
		};

		return {
			success: true,
			message: 'Finance settings fetched successfully',
			data: financeSettings,
		};
	} catch (error) {
		console.error('Get finance settings error:', error);
		return {
			success: false,
			message: 'Failed to fetch finance settings',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function updateFinanceSettings(
	settings: Partial<FinanceSettings>
): Promise<FinanceResult<FinanceSettings>> {
	try {
		const admin = await getCurrentAdmin();

		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		// Update each setting
		const updates: Promise<void>[] = [];

		if (settings.taxEnabled !== undefined) {
			updates.push(
				setSetting('finance.taxEnabled', String(settings.taxEnabled), {
					type: 'BOOLEAN',
					group: 'finance',
					label: 'Enable Tax',
					description: 'Whether to include tax in transactions',
				})
			);
		}

		if (settings.taxRate !== undefined) {
			updates.push(
				setSetting('finance.taxRate', String(settings.taxRate), {
					type: 'NUMBER',
					group: 'finance',
					label: 'Tax Rate (%)',
					description: 'Tax rate percentage to apply',
				})
			);
		}

		if (settings.taxName !== undefined) {
			updates.push(
				setSetting('finance.taxName', settings.taxName, {
					type: 'STRING',
					group: 'finance',
					label: 'Tax Name',
					description: 'Name of the tax (e.g., VAT, Sales Tax)',
				})
			);
		}

		if (settings.taxNumber !== undefined) {
			updates.push(
				setSetting('finance.taxNumber', settings.taxNumber, {
					type: 'STRING',
					group: 'finance',
					label: 'Tax ID Number',
					description: 'Business tax identification number',
				})
			);
		}

		if (settings.currency !== undefined) {
			updates.push(
				setSetting('finance.currency', settings.currency, {
					type: 'STRING',
					group: 'finance',
					label: 'Currency Code',
					description: 'ISO currency code (e.g., NGN, USD)',
				})
			);
		}

		if (settings.currencySymbol !== undefined) {
			updates.push(
				setSetting('finance.currencySymbol', settings.currencySymbol, {
					type: 'STRING',
					group: 'finance',
					label: 'Currency Symbol',
					description: 'Currency symbol for display',
				})
			);
		}

		if (settings.invoicePrefix !== undefined) {
			updates.push(
				setSetting('finance.invoicePrefix', settings.invoicePrefix, {
					type: 'STRING',
					group: 'finance',
					label: 'Invoice Prefix',
					description: 'Prefix for invoice numbers',
				})
			);
		}

		if (settings.invoiceFooter !== undefined) {
			updates.push(
				setSetting('finance.invoiceFooter', settings.invoiceFooter, {
					type: 'STRING',
					group: 'finance',
					label: 'Invoice Footer',
					description: 'Footer text for invoices',
				})
			);
		}

		await Promise.all(updates);

		// Log the activity
		await prisma.activityLog.create({
			data: {
				userId: admin.id,
				action: 'settings.update',
				entityType: 'SystemSettings',
				entityId: 'finance',
				metadata: { settings },
			},
		});

		revalidatePath('/admin/finance');
		revalidatePath('/admin/finance/settings');

		// Return updated settings
		return getFinanceSettings();
	} catch (error) {
		console.error('Update finance settings error:', error);
		return {
			success: false,
			message: 'Failed to update finance settings',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// TAX CALCULATION HELPER
// ============================================

export async function calculateTax(subtotal: number): Promise<{
	subtotal: number;
	taxAmount: number;
	taxRate: number;
	total: number;
}> {
	const settingsResult = await getFinanceSettings();
	const settings = settingsResult.data || DEFAULT_FINANCE_SETTINGS;

	if (!settings.taxEnabled) {
		return {
			subtotal,
			taxAmount: 0,
			taxRate: 0,
			total: subtotal,
		};
	}

	const taxAmount = Math.round((subtotal * settings.taxRate) / 100);

	return {
		subtotal,
		taxAmount,
		taxRate: settings.taxRate,
		total: subtotal + taxAmount,
	};
}

// ============================================
// TRANSACTION SUMMARY
// ============================================

export async function getTransactionSummary(options?: {
	startDate?: Date;
	endDate?: Date;
}): Promise<FinanceResult<TransactionSummary>> {
	try {
		const admin = await getCurrentAdmin();

		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const { startDate, endDate } = options || {};
		const dateFilter = {
			...(startDate && { gte: startDate }),
			...(endDate && { lte: endDate }),
		};

		const [
			totalStats,
			paidStats,
			pendingCount,
			failedCount,
			refundedStats,
		] = await Promise.all([
			prisma.payment.aggregate({
				where: {
					createdAt: Object.keys(dateFilter).length
						? dateFilter
						: undefined,
				},
				_sum: { amount: true, taxAmount: true },
				_count: true,
			}),
			prisma.payment.aggregate({
				where: {
					status: 'PAID',
					createdAt: Object.keys(dateFilter).length
						? dateFilter
						: undefined,
				},
				_sum: { amount: true, taxAmount: true },
				_count: true,
			}),
			prisma.payment.count({
				where: {
					status: 'PENDING',
					createdAt: Object.keys(dateFilter).length
						? dateFilter
						: undefined,
				},
			}),
			prisma.payment.count({
				where: {
					status: 'FAILED',
					createdAt: Object.keys(dateFilter).length
						? dateFilter
						: undefined,
				},
			}),
			prisma.payment.aggregate({
				where: {
					status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] },
					createdAt: Object.keys(dateFilter).length
						? dateFilter
						: undefined,
				},
				_sum: { amount: true },
			}),
		]);

		return {
			success: true,
			message: 'Transaction summary fetched successfully',
			data: {
				totalRevenue: paidStats._sum.amount || 0,
				totalTax: paidStats._sum.taxAmount || 0,
				totalTransactions: totalStats._count || 0,
				paidTransactions: paidStats._count || 0,
				pendingTransactions: pendingCount,
				failedTransactions: failedCount,
				refundedAmount: refundedStats._sum.amount || 0,
			},
		};
	} catch (error) {
		console.error('Get transaction summary error:', error);
		return {
			success: false,
			message: 'Failed to fetch transaction summary',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// REVENUE ANALYTICS
// ============================================

export async function getRevenueByPeriod(options: {
	startDate: Date;
	endDate: Date;
	groupBy: 'day' | 'week' | 'month';
}): Promise<FinanceResult<RevenueByPeriod[]>> {
	try {
		const admin = await getCurrentAdmin();

		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const { startDate, endDate, groupBy } = options;

		const payments = await prisma.payment.findMany({
			where: {
				status: 'PAID',
				paidAt: {
					gte: startDate,
					lte: endDate,
				},
			},
			select: {
				amount: true,
				taxAmount: true,
				paidAt: true,
			},
			orderBy: { paidAt: 'asc' },
		});

		// Group by period
		const grouped = new Map<
			string,
			{ revenue: number; tax: number; count: number }
		>();

		for (const payment of payments) {
			if (!payment.paidAt) continue;

			let periodKey: string;
			const date = new Date(payment.paidAt);

			switch (groupBy) {
				case 'day':
					periodKey = date.toISOString().split('T')[0];
					break;
				case 'week':
					const weekStart = new Date(date);
					weekStart.setDate(date.getDate() - date.getDay());
					periodKey = weekStart.toISOString().split('T')[0];
					break;
				case 'month':
					periodKey = `${date.getFullYear()}-${String(
						date.getMonth() + 1
					).padStart(2, '0')}`;
					break;
			}

			const existing = grouped.get(periodKey) || {
				revenue: 0,
				tax: 0,
				count: 0,
			};
			grouped.set(periodKey, {
				revenue: existing.revenue + payment.amount,
				tax: existing.tax + payment.taxAmount,
				count: existing.count + 1,
			});
		}

		const result: RevenueByPeriod[] = Array.from(grouped.entries()).map(
			([period, data]) => ({
				period,
				revenue: data.revenue,
				tax: data.tax,
				count: data.count,
			})
		);

		return {
			success: true,
			message: 'Revenue by period fetched successfully',
			data: result,
		};
	} catch (error) {
		console.error('Get revenue by period error:', error);
		return {
			success: false,
			message: 'Failed to fetch revenue by period',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getRevenueBySource(options?: {
	startDate?: Date;
	endDate?: Date;
}): Promise<FinanceResult<RevenueBySource[]>> {
	try {
		const admin = await getCurrentAdmin();

		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const { startDate, endDate } = options || {};
		const dateFilter = {
			...(startDate && { gte: startDate }),
			...(endDate && { lte: endDate }),
		};

		const [bookingRevenue, membershipRevenue, shopRevenue] =
			await Promise.all([
				prisma.payment.aggregate({
					where: {
						status: 'PAID',
						bookingId: { not: null },
						paidAt: Object.keys(dateFilter).length
							? dateFilter
							: undefined,
					},
					_sum: { amount: true, taxAmount: true },
					_count: true,
				}),
				prisma.payment.aggregate({
					where: {
						status: 'PAID',
						membershipId: { not: null },
						paidAt: Object.keys(dateFilter).length
							? dateFilter
							: undefined,
					},
					_sum: { amount: true, taxAmount: true },
					_count: true,
				}),
				prisma.shopOrder.aggregate({
					where: {
						paymentStatus: 'PAID',
						paidAt: Object.keys(dateFilter).length
							? dateFilter
							: undefined,
					},
					_sum: { totalAmount: true, tax: true },
					_count: true,
				}),
			]);

		const totalRevenue =
			(bookingRevenue._sum.amount || 0) +
			(membershipRevenue._sum.amount || 0) +
			(shopRevenue._sum.totalAmount || 0);

		const sources: RevenueBySource[] = [
			{
				source: 'Bookings',
				revenue: bookingRevenue._sum.amount || 0,
				tax: bookingRevenue._sum.taxAmount || 0,
				count: bookingRevenue._count || 0,
				percentage:
					totalRevenue > 0
						? ((bookingRevenue._sum.amount || 0) / totalRevenue) *
						  100
						: 0,
			},
			{
				source: 'Memberships',
				revenue: membershipRevenue._sum.amount || 0,
				tax: membershipRevenue._sum.taxAmount || 0,
				count: membershipRevenue._count || 0,
				percentage:
					totalRevenue > 0
						? ((membershipRevenue._sum.amount || 0) /
								totalRevenue) *
						  100
						: 0,
			},
			{
				source: 'Shop',
				revenue: shopRevenue._sum.totalAmount || 0,
				tax: shopRevenue._sum.tax || 0,
				count: shopRevenue._count || 0,
				percentage:
					totalRevenue > 0
						? ((shopRevenue._sum.totalAmount || 0) / totalRevenue) *
						  100
						: 0,
			},
		];

		return {
			success: true,
			message: 'Revenue by source fetched successfully',
			data: sources,
		};
	} catch (error) {
		console.error('Get revenue by source error:', error);
		return {
			success: false,
			message: 'Failed to fetch revenue by source',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// TRANSACTIONS LIST
// ============================================

export async function getTransactions(options?: {
	status?: PaymentStatus;
	method?: PaymentMethod;
	type?: 'booking' | 'membership' | 'shop';
	startDate?: Date;
	endDate?: Date;
	search?: string;
	limit?: number;
	offset?: number;
}): Promise<
	FinanceResult<{ transactions: TransactionWithDetails[]; total: number }>
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
			method,
			type,
			startDate,
			endDate,
			search,
			limit = 50,
			offset = 0,
		} = options || {};

		const where: any = {};

		if (status) where.status = status;
		if (method) where.method = method;
		if (startDate || endDate) {
			where.createdAt = {
				...(startDate && { gte: startDate }),
				...(endDate && { lte: endDate }),
			};
		}
		if (type === 'booking') where.bookingId = { not: null };
		if (type === 'membership') where.membershipId = { not: null };
		if (search) {
			where.OR = [
				{ reference: { contains: search, mode: 'insensitive' } },
				{ user: { name: { contains: search, mode: 'insensitive' } } },
				{ user: { email: { contains: search, mode: 'insensitive' } } },
			];
		}

		const [payments, total] = await Promise.all([
			prisma.payment.findMany({
				where,
				include: {
					user: { select: { name: true, email: true } },
					booking: {
						select: {
							bookingNumber: true,
							space: { select: { name: true } },
						},
					},
					membership: {
						select: {
							membershipNumber: true,
							space: { select: { name: true } },
						},
					},
				},
				orderBy: { createdAt: 'desc' },
				take: limit,
				skip: offset,
			}),
			prisma.payment.count({ where }),
		]);

		const transactions: TransactionWithDetails[] = payments.map((p) => ({
			id: p.id,
			reference: p.reference,
			type: p.bookingId
				? 'booking'
				: p.membershipId
				? 'membership'
				: 'addon',
			description: p.booking
				? `Booking: ${p.booking.space.name}`
				: p.membership
				? `Membership: ${p.membership.space.name}`
				: 'Add-on Purchase',
			customerName: p.user.name,
			customerEmail: p.user.email,
			subtotal: p.subtotal,
			taxAmount: p.taxAmount,
			taxRate: p.taxRate,
			amount: p.amount,
			method: p.method,
			status: p.status,
			paidAt: p.paidAt,
			createdAt: p.createdAt,
		}));

		return {
			success: true,
			message: 'Transactions fetched successfully',
			data: { transactions, total },
		};
	} catch (error) {
		console.error('Get transactions error:', error);
		return {
			success: false,
			message: 'Failed to fetch transactions',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// EXPORT TRANSACTIONS
// ============================================

export async function exportTransactionsCSV(options?: {
	startDate?: Date;
	endDate?: Date;
	status?: PaymentStatus;
}): Promise<FinanceResult<string>> {
	try {
		const admin = await getCurrentAdmin();

		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const result = await getTransactions({
			...options,
			limit: 10000, // Max export
		});

		if (!result.success || !result.data) {
			return {
				success: false,
				message: 'Failed to fetch transactions for export',
			};
		}

		const headers = [
			'Reference',
			'Date',
			'Type',
			'Description',
			'Customer',
			'Email',
			'Subtotal',
			'Tax Rate',
			'Tax Amount',
			'Total',
			'Method',
			'Status',
			'Paid At',
		];

		const rows = result.data.transactions.map((t) => [
			t.reference,
			t.createdAt.toISOString(),
			t.type,
			t.description,
			t.customerName,
			t.customerEmail,
			(t.subtotal / 100).toFixed(2),
			`${t.taxRate}%`,
			(t.taxAmount / 100).toFixed(2),
			(t.amount / 100).toFixed(2),
			t.method,
			t.status,
			t.paidAt?.toISOString() || '',
		]);

		const csv = [
			headers.join(','),
			...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
		].join('\n');

		return {
			success: true,
			message: 'CSV generated successfully',
			data: csv,
		};
	} catch (error) {
		console.error('Export transactions CSV error:', error);
		return {
			success: false,
			message: 'Failed to export transactions',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// TAX REPORT
// ============================================

export async function getTaxReport(options: {
	startDate: Date;
	endDate: Date;
}): Promise<
	FinanceResult<{
		totalTaxCollected: number;
		taxByMonth: { month: string; tax: number; revenue: number }[];
		taxBySource: { source: string; tax: number; revenue: number }[];
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

		const { startDate, endDate } = options;

		// Get all paid payments in range
		const payments = await prisma.payment.findMany({
			where: {
				status: 'PAID',
				paidAt: { gte: startDate, lte: endDate },
			},
			select: {
				amount: true,
				taxAmount: true,
				paidAt: true,
				bookingId: true,
				membershipId: true,
			},
		});

		// Group by month
		const byMonth = new Map<string, { tax: number; revenue: number }>();
		const bySource = {
			bookings: { tax: 0, revenue: 0 },
			memberships: { tax: 0, revenue: 0 },
			other: { tax: 0, revenue: 0 },
		};

		let totalTax = 0;

		for (const p of payments) {
			if (!p.paidAt) continue;

			totalTax += p.taxAmount;

			// By month
			const monthKey = `${p.paidAt.getFullYear()}-${String(
				p.paidAt.getMonth() + 1
			).padStart(2, '0')}`;
			const existing = byMonth.get(monthKey) || { tax: 0, revenue: 0 };
			byMonth.set(monthKey, {
				tax: existing.tax + p.taxAmount,
				revenue: existing.revenue + p.amount,
			});

			// By source
			if (p.bookingId) {
				bySource.bookings.tax += p.taxAmount;
				bySource.bookings.revenue += p.amount;
			} else if (p.membershipId) {
				bySource.memberships.tax += p.taxAmount;
				bySource.memberships.revenue += p.amount;
			} else {
				bySource.other.tax += p.taxAmount;
				bySource.other.revenue += p.amount;
			}
		}

		// Get shop orders tax
		const shopOrders = await prisma.shopOrder.aggregate({
			where: {
				paymentStatus: 'PAID',
				paidAt: { gte: startDate, lte: endDate },
			},
			_sum: { tax: true, totalAmount: true },
		});

		totalTax += shopOrders._sum.tax || 0;

		return {
			success: true,
			message: 'Tax report fetched successfully',
			data: {
				totalTaxCollected: totalTax + (shopOrders._sum.tax || 0),
				taxByMonth: Array.from(byMonth.entries())
					.map(([month, data]) => ({ month, ...data }))
					.sort((a, b) => a.month.localeCompare(b.month)),
				taxBySource: [
					{ source: 'Bookings', ...bySource.bookings },
					{ source: 'Memberships', ...bySource.memberships },
					{
						source: 'Shop',
						tax: shopOrders._sum.tax || 0,
						revenue: shopOrders._sum.totalAmount || 0,
					},
					{ source: 'Other', ...bySource.other },
				].filter((s) => s.revenue > 0),
			},
		};
	} catch (error) {
		console.error('Get tax report error:', error);
		return {
			success: false,
			message: 'Failed to fetch tax report',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}
