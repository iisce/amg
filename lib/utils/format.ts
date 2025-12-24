// Format currency in Naira
export function formatNaira(amount: number): string {
	return new Intl.NumberFormat('en-NG', {
		style: 'currency',
		currency: 'NGN',
		minimumFractionDigits: 0,
	}).format(amount);
}

// Convert kobo to naira
export function koboToNaira(kobo: number): number {
	return kobo / 100;
}

// Convert naira to kobo
export function nairaToKobo(naira: number): number {
	return Math.round(naira * 100);
}

// Format date
export function formatDate(date: Date | string): string {
	return new Intl.DateTimeFormat('en-NG', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	}).format(new Date(date));
}

// Format time
export function formatTime(date: Date | string): string {
	return new Intl.DateTimeFormat('en-NG', {
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(date));
}

// Format datetime
export function formatDateTime(date: Date | string): string {
	return new Intl.DateTimeFormat('en-NG', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(date));
}

// Format subscription duration
export function formatDuration(
	startDate: Date | string,
	endDate: Date | string
): string {
	const start = new Date(startDate);
	const end = new Date(endDate);
	const diffMs = end.getTime() - start.getTime();
	const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays < 7) {
		return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
	} else if (diffDays < 30) {
		const weeks = Math.ceil(diffDays / 7);
		return `${weeks} week${weeks !== 1 ? 's' : ''}`;
	} else if (diffDays < 365) {
		const months = Math.round(diffDays / 30);
		return `${months} month${months !== 1 ? 's' : ''}`;
	} else {
		const years = Math.round(diffDays / 365);
		return `${years} year${years !== 1 ? 's' : ''}`;
	}
}

// Format days remaining
export function formatDaysRemaining(endDate: Date | string): string {
	const end = new Date(endDate);
	const now = new Date();
	const diffMs = end.getTime() - now.getTime();
	const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays < 0) {
		return 'Expired';
	} else if (diffDays === 0) {
		return 'Expires today';
	} else if (diffDays === 1) {
		return '1 day left';
	} else if (diffDays < 30) {
		return `${diffDays} days left`;
	} else {
		const months = Math.round(diffDays / 30);
		return `${months} month${months !== 1 ? 's' : ''} left`;
	}
}

// Format membership type
export function formatMembershipType(type: string): string {
	const typeMap: Record<string, string> = {
		DAILY: 'Daily',
		WEEKLY: 'Weekly',
		MONTHLY: 'Monthly',
		QUARTERLY: 'Quarterly',
		ANNUAL: 'Annual',
	};
	return typeMap[type] || type;
}
