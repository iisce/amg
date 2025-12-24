/**
 * Business hours and time slot utilities for AMG Workspace
 *
 * Business Hours:
 * - Monday to Friday: 9:00 AM - 6:00 PM
 * - Saturday: 11:00 AM - 4:00 PM
 * - Sunday: Closed
 *
 * Booking Rules:
 * - Time slots: 30-minute intervals
 * - Minimum booking duration: 1 hour
 * - Full Workspace: Only available on Saturdays
 */

export interface BusinessHours {
	open: string; // HH:mm format
	close: string;
	isOpen: boolean;
}

export interface TimeSlot {
	time: string; // HH:mm format
	label: string; // Display format like "9:00 AM"
	available: boolean;
}

/**
 * Get business hours for a specific date
 */
export function getBusinessHours(date: Date): BusinessHours {
	const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

	switch (dayOfWeek) {
		case 0: // Sunday - Closed
			return { open: '', close: '', isOpen: false };
		case 6: // Saturday
			return { open: '11:00', close: '16:00', isOpen: true };
		default: // Monday to Friday
			return { open: '09:00', close: '18:00', isOpen: true };
	}
}

/**
 * Check if a date is a business day (not Sunday)
 */
export function isBusinessDay(date: Date): boolean {
	return date.getDay() !== 0; // Sunday = 0
}

/**
 * Check if full workspace booking is allowed on a date
 * Full workspace can only be booked on Saturdays
 */
export function canBookFullWorkspace(date: Date): boolean {
	return date.getDay() === 6; // Saturday = 6
}

/**
 * Parse time string (HH:mm) to hours and minutes
 */
export function parseTime(timeStr: string): { hours: number; minutes: number } {
	const [hours, minutes] = timeStr.split(':').map(Number);
	return { hours, minutes };
}

/**
 * Format time (hours, minutes) to display string (e.g., "9:00 AM")
 */
export function formatTimeDisplay(hours: number, minutes: number): string {
	const period = hours >= 12 ? 'PM' : 'AM';
	const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
	const displayMinutes = minutes.toString().padStart(2, '0');
	return `${displayHours}:${displayMinutes} ${period}`;
}

/**
 * Format time (hours, minutes) to 24-hour string (HH:mm)
 */
export function formatTime24(hours: number, minutes: number): string {
	return `${hours.toString().padStart(2, '0')}:${minutes
		.toString()
		.padStart(2, '0')}`;
}

/**
 * Convert HH:mm to Date object on a given date
 */
export function timeToDate(date: Date, timeStr: string): Date {
	const { hours, minutes } = parseTime(timeStr);
	const result = new Date(date);
	result.setHours(hours, minutes, 0, 0);
	return result;
}

/**
 * Generate all possible time slots for a given date (30-minute intervals)
 * Does not consider existing bookings - just generates the raw slots
 */
export function generateTimeSlots(date: Date): TimeSlot[] {
	const hours = getBusinessHours(date);
	if (!hours.isOpen) return [];

	const slots: TimeSlot[] = [];
	const { hours: openHour, minutes: openMin } = parseTime(hours.open);
	const { hours: closeHour, minutes: closeMin } = parseTime(hours.close);

	let currentHour = openHour;
	let currentMin = openMin;

	// Generate slots in 30-minute intervals
	// Stop 30 minutes before closing (last slot start must allow at least 30 min)
	while (
		currentHour < closeHour ||
		(currentHour === closeHour && currentMin < closeMin)
	) {
		// Don't generate a slot if it's within 30 minutes of closing
		const timeUntilClose =
			(closeHour - currentHour) * 60 + (closeMin - currentMin);
		if (timeUntilClose < 30) break;

		slots.push({
			time: formatTime24(currentHour, currentMin),
			label: formatTimeDisplay(currentHour, currentMin),
			available: true, // Will be set based on bookings
		});

		// Increment by 30 minutes
		currentMin += 30;
		if (currentMin >= 60) {
			currentMin -= 60;
			currentHour += 1;
		}
	}

	return slots;
}

/**
 * Check if a time slot overlaps with any booked period
 */
export function isSlotBooked(
	slotStart: string, // HH:mm
	slotDurationHours: number,
	bookedSlots: { startTime: string; endTime: string }[],
	date: Date
): boolean {
	const slotStartDate = timeToDate(date, slotStart);
	const slotEndDate = new Date(
		slotStartDate.getTime() + slotDurationHours * 60 * 60 * 1000
	);

	return bookedSlots.some((booked) => {
		const bookedStart = new Date(booked.startTime);
		const bookedEnd = new Date(booked.endTime);

		// Check for any overlap
		return slotStartDate < bookedEnd && slotEndDate > bookedStart;
	});
}

/**
 * Get available time slots for a date considering existing bookings
 * @param date - The date to check
 * @param bookedSlots - Array of already booked time ranges
 * @param durationHours - Desired booking duration in hours (minimum 1)
 */
export function getAvailableTimeSlots(
	date: Date,
	bookedSlots: { startTime: string; endTime: string }[],
	durationHours: number = 1
): TimeSlot[] {
	const allSlots = generateTimeSlots(date);
	const hours = getBusinessHours(date);

	if (!hours.isOpen) return [];

	const { hours: closeHour, minutes: closeMin } = parseTime(hours.close);

	return allSlots.map((slot) => {
		// Check if slot + duration would exceed business hours
		const slotStart = timeToDate(date, slot.time);
		const slotEnd = new Date(
			slotStart.getTime() + durationHours * 60 * 60 * 1000
		);
		const closeTime = new Date(date);
		closeTime.setHours(closeHour, closeMin, 0, 0);

		// Not available if end time exceeds closing time
		if (slotEnd > closeTime) {
			return { ...slot, available: false };
		}

		// Not available if overlaps with existing booking
		if (isSlotBooked(slot.time, durationHours, bookedSlots, date)) {
			return { ...slot, available: false };
		}

		return { ...slot, available: true };
	});
}

/**
 * Calculate end time given start time and duration
 */
export function calculateEndTime(
	startTime: string,
	durationHours: number
): string {
	const { hours, minutes } = parseTime(startTime);
	let endHours = hours + Math.floor(durationHours);
	let endMinutes = minutes + (durationHours % 1) * 60;

	if (endMinutes >= 60) {
		endMinutes -= 60;
		endHours += 1;
	}

	return formatTime24(endHours, endMinutes);
}

/**
 * Get duration options based on business hours
 * Returns array of hours (1, 2, 3, etc.) that fit within remaining time
 */
export function getDurationOptions(
	date: Date,
	startTime: string,
	maxDuration: number = 8
): number[] {
	const hours = getBusinessHours(date);
	if (!hours.isOpen) return [];

	const { hours: closeHour, minutes: closeMin } = parseTime(hours.close);
	const { hours: startHour, minutes: startMin } = parseTime(startTime);

	const closeMinutes = closeHour * 60 + closeMin;
	const startMinutes = startHour * 60 + startMin;
	const availableMinutes = closeMinutes - startMinutes;
	const maxHours = Math.floor(availableMinutes / 60);

	const durations: number[] = [];
	for (let i = 1; i <= Math.min(maxHours, maxDuration); i++) {
		durations.push(i);
	}

	return durations;
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: Date): boolean {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const checkDate = new Date(date);
	checkDate.setHours(0, 0, 0, 0);
	return checkDate < today;
}

/**
 * Check if a time slot is in the past (for today's date)
 */
export function isPastTime(date: Date, time: string): boolean {
	const now = new Date();
	const slotTime = timeToDate(date, time);
	return slotTime < now;
}
