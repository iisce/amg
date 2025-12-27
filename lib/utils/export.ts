'use server';

import { formatNaira, koboToNaira } from './format';

// ============================================
// CSV EXPORT
// ============================================

export function generateCSV<T extends Record<string, unknown>>(
	data: T[],
	columns: {
		key: keyof T;
		label: string;
		format?: (value: unknown) => string;
	}[]
): string {
	if (data.length === 0) return '';

	// Header row
	const header = columns.map((col) => `"${col.label}"`).join(',');

	// Data rows
	const rows = data.map((row) =>
		columns
			.map((col) => {
				const value = row[col.key];
				const formatted = col.format
					? col.format(value)
					: String(value ?? '');
				// Escape quotes and wrap in quotes
				return `"${formatted.replace(/"/g, '""')}"`;
			})
			.join(',')
	);

	return [header, ...rows].join('\n');
}

// ============================================
// EXCEL EXPORT (CSV with BOM for Excel compatibility)
// ============================================

export function generateExcelCSV<T extends Record<string, unknown>>(
	data: T[],
	columns: {
		key: keyof T;
		label: string;
		format?: (value: unknown) => string;
	}[]
): string {
	const csv = generateCSV(data, columns);
	// Add BOM for Excel to recognize UTF-8
	return '\uFEFF' + csv;
}

// ============================================
// REPORT DATA FORMATTERS
// ============================================

export function formatDate(date: Date | string | null): string {
	if (!date) return '-';
	const d = new Date(date);
	return d.toLocaleDateString('en-NG', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}

export function formatDateTime(date: Date | string | null): string {
	if (!date) return '-';
	const d = new Date(date);
	return d.toLocaleString('en-NG', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

export function formatMoney(amount: number | null | undefined): string {
	if (amount === null || amount === undefined) return '₦0.00';
	return formatNaira(koboToNaira(amount));
}

export function formatPercent(value: number | null | undefined): string {
	if (value === null || value === undefined) return '0%';
	return `${value}%`;
}

export function formatNumber(value: number | null | undefined): string {
	if (value === null || value === undefined) return '0';
	return value.toLocaleString('en-NG');
}

// ============================================
// PREDEFINED COLUMN CONFIGS
// ============================================

export const REVENUE_REPORT_COLUMNS = [
	{ key: 'date' as const, label: 'Date', format: formatDate },
	{ key: 'revenue' as const, label: 'Total Revenue', format: formatMoney },
	{ key: 'bookings' as const, label: 'Booking Revenue', format: formatMoney },
	{
		key: 'memberships' as const,
		label: 'Membership Revenue',
		format: formatMoney,
	},
	{ key: 'shop' as const, label: 'Shop Revenue', format: formatMoney },
];

export const TOP_CLIENTS_COLUMNS = [
	{ key: 'rank' as const, label: 'Rank' },
	{ key: 'name' as const, label: 'Client Name' },
	{ key: 'email' as const, label: 'Email' },
	{ key: 'company' as const, label: 'Company' },
	{ key: 'totalSpent' as const, label: 'Total Spent', format: formatMoney },
	{ key: 'bookingCount' as const, label: 'Bookings', format: formatNumber },
	{
		key: 'membershipCount' as const,
		label: 'Memberships',
		format: formatNumber,
	},
	{
		key: 'lastActivity' as const,
		label: 'Last Activity',
		format: formatDate,
	},
];

export const BOOKING_REPORT_COLUMNS = [
	{ key: 'bookingNumber' as const, label: 'Booking #' },
	{ key: 'clientName' as const, label: 'Client' },
	{ key: 'spaceName' as const, label: 'Space' },
	{ key: 'bookingDate' as const, label: 'Date', format: formatDate },
	{ key: 'startTime' as const, label: 'Start Time', format: formatDateTime },
	{ key: 'endTime' as const, label: 'End Time', format: formatDateTime },
	{ key: 'attendees' as const, label: 'Attendees', format: formatNumber },
	{ key: 'totalAmount' as const, label: 'Amount', format: formatMoney },
	{ key: 'status' as const, label: 'Status' },
];

export const POPULAR_SPACES_COLUMNS = [
	{ key: 'rank' as const, label: 'Rank' },
	{ key: 'name' as const, label: 'Space Name' },
	{ key: 'type' as const, label: 'Type' },
	{ key: 'bookingCount' as const, label: 'Bookings', format: formatNumber },
	{ key: 'totalRevenue' as const, label: 'Revenue', format: formatMoney },
	{
		key: 'averageOccupancy' as const,
		label: 'Avg Occupancy',
		format: formatPercent,
	},
];

export const TOP_SHOP_ITEMS_COLUMNS = [
	{ key: 'rank' as const, label: 'Rank' },
	{ key: 'name' as const, label: 'Item Name' },
	{ key: 'category' as const, label: 'Category' },
	{ key: 'quantitySold' as const, label: 'Qty Sold', format: formatNumber },
	{ key: 'totalRevenue' as const, label: 'Revenue', format: formatMoney },
	{ key: 'averagePrice' as const, label: 'Avg Price', format: formatMoney },
];

export const SPACE_UTILIZATION_COLUMNS = [
	{ key: 'name' as const, label: 'Space Name' },
	{ key: 'type' as const, label: 'Type' },
	{ key: 'capacity' as const, label: 'Capacity', format: formatNumber },
	{ key: 'totalBookings' as const, label: 'Bookings', format: formatNumber },
	{ key: 'totalHours' as const, label: 'Hours Used', format: formatNumber },
	{
		key: 'utilizationRate' as const,
		label: 'Utilization',
		format: formatPercent,
	},
	{ key: 'revenue' as const, label: 'Revenue', format: formatMoney },
];

export const LEADERBOARD_COLUMNS = [
	{ key: 'rank' as const, label: 'Rank' },
	{ key: 'name' as const, label: 'Name' },
	{ key: 'email' as const, label: 'Email' },
	{ key: 'company' as const, label: 'Company' },
	{ key: 'score' as const, label: 'Score', format: formatNumber },
	{ key: 'metric' as const, label: 'Metric' },
];

export const EARLY_BIRD_COLUMNS = [
	{ key: 'rank' as const, label: 'Rank' },
	{ key: 'name' as const, label: 'Client Name' },
	{ key: 'email' as const, label: 'Email' },
	{ key: 'company' as const, label: 'Company' },
	{
		key: 'averageLeadTime' as const,
		label: 'Avg Lead Time (Days)',
		format: formatNumber,
	},
	{ key: 'bookingCount' as const, label: 'Bookings', format: formatNumber },
	{
		key: 'earliestBooking' as const,
		label: 'Max Lead Time (Days)',
		format: formatNumber,
	},
];

// ============================================
// DOWNLOAD HELPERS
// ============================================

export interface ExportOptions {
	filename: string;
	format: 'csv' | 'excel';
}

export function getExportFilename(
	baseName: string,
	format: 'csv' | 'excel'
): string {
	const date = new Date().toISOString().split('T')[0];
	const extension = format === 'excel' ? 'csv' : 'csv';
	return `${baseName}_${date}.${extension}`;
}

export function getExportMimeType(format: 'csv' | 'excel'): string {
	return format === 'excel'
		? 'application/vnd.ms-excel;charset=utf-8'
		: 'text/csv;charset=utf-8';
}
