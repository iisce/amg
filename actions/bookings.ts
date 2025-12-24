'use server';

import { prisma } from '@/lib/db';
import type { Booking, BookingStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';
import { getCurrentUser } from './auth';
import { sendEmail } from '@/lib/email';
import {
	createBookingCancellationEmail,
	createCheckInNotificationEmail,
} from '@/lib/email-templates';

// ============================================
// TYPES
// ============================================

export interface BookingWithRelations extends Booking {
	user: {
		id: string;
		name: string;
		email: string;
		phone: string | null;
	};
	space: {
		id: string;
		name: string;
		slug: string;
		images: string[];
	};
	pricingPlan: {
		id: string;
		name: string;
		price: number;
		unit: string;
	};
}

export interface BookingResult {
	success: boolean;
	message: string;
	data?: BookingWithRelations | BookingWithRelations[];
	error?: string;
}

export interface CreateBookingInput {
	spaceId: string;
	pricingPlanId: string;
	bookingDate: Date;
	startTime: Date;
	endTime: Date;
	attendees?: number;
	notes?: string;
	contactName?: string;
	contactEmail?: string;
	contactPhone?: string;
}

// ============================================
// HELPERS
// ============================================

function generateBookingNumber(): string {
	const timestamp = Date.now().toString(36).toUpperCase();
	const random = randomBytes(2).toString('hex').toUpperCase();
	return `AMG-BK-${timestamp}${random}`;
}

function generateQRCode(): string {
	return randomBytes(16).toString('hex');
}

// ============================================
// READ ACTIONS
// ============================================

export async function getBookings(options?: {
	userId?: string;
	spaceId?: string;
	status?: BookingStatus;
	fromDate?: Date;
	toDate?: Date;
	limit?: number;
	offset?: number;
}): Promise<BookingResult> {
	try {
		const {
			userId,
			spaceId,
			status,
			fromDate,
			toDate,
			limit = 50,
			offset = 0,
		} = options || {};

		const bookings = await prisma.booking.findMany({
			where: {
				...(userId && { userId }),
				...(spaceId && { spaceId }),
				...(status && { status }),
				...(fromDate && { bookingDate: { gte: fromDate } }),
				...(toDate && { bookingDate: { lte: toDate } }),
			},
			include: {
				user: {
					select: { id: true, name: true, email: true, phone: true },
				},
				space: {
					select: { id: true, name: true, slug: true, images: true },
				},
				pricingPlan: {
					select: { id: true, name: true, price: true, unit: true },
				},
			},
			orderBy: { bookingDate: 'desc' },
			take: limit,
			skip: offset,
		});

		return {
			success: true,
			message: 'Bookings fetched successfully',
			data: bookings as BookingWithRelations[],
		};
	} catch (error) {
		console.error('Get bookings error:', error);
		return {
			success: false,
			message: 'Failed to fetch bookings',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getBookingById(id: string): Promise<BookingResult> {
	try {
		const booking = await prisma.booking.findUnique({
			where: { id },
			include: {
				user: {
					select: { id: true, name: true, email: true, phone: true },
				},
				space: {
					select: { id: true, name: true, slug: true, images: true },
				},
				pricingPlan: {
					select: { id: true, name: true, price: true, unit: true },
				},
				payment: true,
			},
		});

		if (!booking) {
			return {
				success: false,
				message: 'Booking not found',
			};
		}

		return {
			success: true,
			message: 'Booking fetched successfully',
			data: booking as BookingWithRelations,
		};
	} catch (error) {
		console.error('Get booking by id error:', error);
		return {
			success: false,
			message: 'Failed to fetch booking',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getBookingByNumber(
	bookingNumber: string
): Promise<BookingResult> {
	try {
		const booking = await prisma.booking.findUnique({
			where: { bookingNumber },
			include: {
				user: {
					select: { id: true, name: true, email: true, phone: true },
				},
				space: {
					select: { id: true, name: true, slug: true, images: true },
				},
				pricingPlan: {
					select: { id: true, name: true, price: true, unit: true },
				},
				payment: true,
			},
		});

		if (!booking) {
			return {
				success: false,
				message: 'Booking not found',
			};
		}

		return {
			success: true,
			message: 'Booking fetched successfully',
			data: booking as BookingWithRelations,
		};
	} catch (error) {
		console.error('Get booking by number error:', error);
		return {
			success: false,
			message: 'Failed to fetch booking',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getBookingByQRCode(
	qrCode: string
): Promise<BookingResult> {
	try {
		const booking = await prisma.booking.findUnique({
			where: { qrCode },
			include: {
				user: {
					select: { id: true, name: true, email: true, phone: true },
				},
				space: {
					select: { id: true, name: true, slug: true, images: true },
				},
				pricingPlan: {
					select: { id: true, name: true, price: true, unit: true },
				},
			},
		});

		if (!booking) {
			return {
				success: false,
				message: 'Invalid QR code',
			};
		}

		return {
			success: true,
			message: 'Booking found',
			data: booking as BookingWithRelations,
		};
	} catch (error) {
		console.error('Get booking by QR code error:', error);
		return {
			success: false,
			message: 'Failed to fetch booking',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getUserBookings(): Promise<BookingResult> {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return {
				success: false,
				message: 'Please login to view your bookings',
			};
		}

		return getBookings({ userId: user.id });
	} catch (error) {
		console.error('Get user bookings error:', error);
		return {
			success: false,
			message: 'Failed to fetch bookings',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// CREATE ACTIONS
// ============================================

export async function createBooking(
	input: CreateBookingInput
): Promise<BookingResult> {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return {
				success: false,
				message: 'Please login to make a booking',
			};
		}

		// Verify user exists in database (session may have stale data)
		const dbUser = await prisma.user.findUnique({
			where: { id: user.id },
			select: { id: true },
		});

		if (!dbUser) {
			return {
				success: false,
				message: 'Your session has expired. Please login again.',
			};
		}

		// Get pricing plan to calculate total
		const pricingPlan = await prisma.pricingPlan.findUnique({
			where: { id: input.pricingPlanId },
		});

		if (!pricingPlan) {
			return {
				success: false,
				message: 'Invalid pricing plan',
			};
		}

		// Check for conflicting bookings
		const conflictingBooking = await prisma.booking.findFirst({
			where: {
				spaceId: input.spaceId,
				bookingDate: input.bookingDate,
				status: { notIn: ['CANCELLED', 'NO_SHOW'] },
				OR: [
					{
						AND: [
							{ startTime: { lte: input.startTime } },
							{ endTime: { gt: input.startTime } },
						],
					},
					{
						AND: [
							{ startTime: { lt: input.endTime } },
							{ endTime: { gte: input.endTime } },
						],
					},
				],
			},
		});

		if (conflictingBooking) {
			return {
				success: false,
				message: 'This time slot is already booked',
			};
		}

		const booking = await prisma.booking.create({
			data: {
				bookingNumber: generateBookingNumber(),
				userId: user.id,
				spaceId: input.spaceId,
				pricingPlanId: input.pricingPlanId,
				bookingDate: input.bookingDate,
				startTime: input.startTime,
				endTime: input.endTime,
				attendees: input.attendees || 1,
				totalAmount: pricingPlan.price,
				qrCode: generateQRCode(),
				notes: input.notes,
				contactName: input.contactName,
				contactEmail: input.contactEmail,
				contactPhone: input.contactPhone,
			},
			include: {
				user: {
					select: { id: true, name: true, email: true, phone: true },
				},
				space: {
					select: { id: true, name: true, slug: true, images: true },
				},
				pricingPlan: {
					select: { id: true, name: true, price: true, unit: true },
				},
			},
		});

		await prisma.activityLog.create({
			data: {
				userId: user.id,
				action: 'booking.created',
				entityType: 'Booking',
				entityId: booking.id,
				metadata: {
					bookingNumber: booking.bookingNumber,
					spaceId: input.spaceId,
				},
			},
		});

		revalidatePath('/dashboard');
		revalidatePath('/dashboard/bookings');
		revalidatePath('/admin/bookings');

		return {
			success: true,
			message: 'Booking created successfully',
			data: booking as BookingWithRelations,
		};
	} catch (error) {
		console.error('Create booking error:', error);
		return {
			success: false,
			message: 'Failed to create booking',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// UPDATE ACTIONS
// ============================================

export async function updateBookingStatus(
	id: string,
	status: BookingStatus
): Promise<BookingResult> {
	try {
		const booking = await prisma.booking.update({
			where: { id },
			data: { status },
			include: {
				user: {
					select: { id: true, name: true, email: true, phone: true },
				},
				space: {
					select: { id: true, name: true, slug: true, images: true },
				},
				pricingPlan: {
					select: { id: true, name: true, price: true, unit: true },
				},
			},
		});

		await prisma.activityLog.create({
			data: {
				action: 'booking.status_updated',
				entityType: 'Booking',
				entityId: id,
				metadata: { status },
			},
		});

		revalidatePath('/dashboard');
		revalidatePath('/dashboard/bookings');
		revalidatePath('/admin/bookings');

		return {
			success: true,
			message: `Booking ${status.toLowerCase()}`,
			data: booking as BookingWithRelations,
		};
	} catch (error) {
		console.error('Update booking status error:', error);
		return {
			success: false,
			message: 'Failed to update booking status',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function confirmBooking(id: string): Promise<BookingResult> {
	return updateBookingStatus(id, 'CONFIRMED');
}

export async function cancelBooking(id: string): Promise<BookingResult> {
	try {
		const user = await getCurrentUser();
		const booking = await prisma.booking.findUnique({ where: { id } });

		if (!booking) {
			return {
				success: false,
				message: 'Booking not found',
			};
		}

		// Check if user owns this booking or is admin
		if (user && booking.userId !== user.id && user.role === 'CLIENT') {
			return {
				success: false,
				message: "You don't have permission to cancel this booking",
			};
		}

		// Check if booking can be cancelled
		if (booking.status === 'COMPLETED' || booking.status === 'CHECKED_IN') {
			return {
				success: false,
				message: 'Cannot cancel a completed or checked-in booking',
			};
		}

		const result = await updateBookingStatus(id, 'CANCELLED');

		// Send cancellation email if successful
		if (result.success && result.data) {
			const bookingData = Array.isArray(result.data)
				? result.data[0]
				: result.data;
			if (bookingData) {
				const cancelEmail = createBookingCancellationEmail(bookingData);
				await sendEmail({
					to: bookingData.user.email,
					subject: cancelEmail.subject,
					html: cancelEmail.html,
				});
			}
		}

		return result;
	} catch (error) {
		console.error('Cancel booking error:', error);
		return {
			success: false,
			message: 'Failed to cancel booking',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function checkInBooking(id: string): Promise<BookingResult> {
	try {
		const booking = await prisma.booking.findUnique({ where: { id } });

		if (!booking) {
			return {
				success: false,
				message: 'Booking not found',
			};
		}

		if (booking.status !== 'CONFIRMED') {
			return {
				success: false,
				message: 'Only confirmed bookings can be checked in',
			};
		}

		if (booking.paymentStatus !== 'PAID') {
			return {
				success: false,
				message: 'Payment required before check-in',
			};
		}

		const updatedBooking = await prisma.booking.update({
			where: { id },
			data: {
				status: 'CHECKED_IN',
				checkInTime: new Date(),
			},
			include: {
				user: {
					select: { id: true, name: true, email: true, phone: true },
				},
				space: {
					select: { id: true, name: true, slug: true, images: true },
				},
				pricingPlan: {
					select: { id: true, name: true, price: true, unit: true },
				},
			},
		});

		await prisma.activityLog.create({
			data: {
				userId: booking.userId,
				action: 'booking.checked_in',
				entityType: 'Booking',
				entityId: id,
				metadata: { bookingNumber: booking.bookingNumber },
			},
		});

		// Send check-in notification email
		const checkInEmail = createCheckInNotificationEmail(
			updatedBooking as BookingWithRelations
		);
		await sendEmail({
			to: updatedBooking.user.email,
			subject: checkInEmail.subject,
			html: checkInEmail.html,
		});

		revalidatePath('/dashboard/bookings');
		revalidatePath('/admin/bookings');

		return {
			success: true,
			message: 'Check-in successful!',
			data: updatedBooking as BookingWithRelations,
		};
	} catch (error) {
		console.error('Check-in booking error:', error);
		return {
			success: false,
			message: 'Failed to check in',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function checkOutBooking(id: string): Promise<BookingResult> {
	try {
		const booking = await prisma.booking.findUnique({ where: { id } });

		if (!booking) {
			return {
				success: false,
				message: 'Booking not found',
			};
		}

		if (booking.status !== 'CHECKED_IN') {
			return {
				success: false,
				message: 'Only checked-in bookings can be checked out',
			};
		}

		const updatedBooking = await prisma.booking.update({
			where: { id },
			data: {
				status: 'COMPLETED',
				checkOutTime: new Date(),
			},
			include: {
				user: {
					select: { id: true, name: true, email: true, phone: true },
				},
				space: {
					select: { id: true, name: true, slug: true, images: true },
				},
				pricingPlan: {
					select: { id: true, name: true, price: true, unit: true },
				},
			},
		});

		await prisma.activityLog.create({
			data: {
				userId: booking.userId,
				action: 'booking.checked_out',
				entityType: 'Booking',
				entityId: id,
				metadata: { bookingNumber: booking.bookingNumber },
			},
		});

		revalidatePath('/admin/bookings');

		return {
			success: true,
			message: 'Check-out completed',
			data: updatedBooking as BookingWithRelations,
		};
	} catch (error) {
		console.error('Check-out booking error:', error);
		return {
			success: false,
			message: 'Failed to check out',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// QR CODE CHECK-IN
// ============================================

export async function checkInByQRCode(qrCode: string): Promise<BookingResult> {
	try {
		const bookingResult = await getBookingByQRCode(qrCode);

		if (!bookingResult.success || !bookingResult.data) {
			return bookingResult;
		}

		const booking = bookingResult.data as BookingWithRelations;

		// Validate booking date is today
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const bookingDate = new Date(booking.bookingDate);
		bookingDate.setHours(0, 0, 0, 0);

		if (bookingDate.getTime() !== today.getTime()) {
			return {
				success: false,
				message: 'This booking is not for today',
			};
		}

		return checkInBooking(booking.id);
	} catch (error) {
		console.error('QR check-in error:', error);
		return {
			success: false,
			message: 'Failed to process QR code',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// AVAILABILITY CHECK
// ============================================

/**
 * Get all booked time slots for a specific space and date
 * Returns an array of { startTime, endTime } objects representing occupied slots
 */
export async function getBookedSlots(
	spaceId: string,
	date: Date
): Promise<{ startTime: string; endTime: string }[]> {
	try {
		// Normalize the date to start of day
		const startOfDay = new Date(date);
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = new Date(date);
		endOfDay.setHours(23, 59, 59, 999);

		const bookings = await prisma.booking.findMany({
			where: {
				spaceId,
				bookingDate: {
					gte: startOfDay,
					lte: endOfDay,
				},
				status: { notIn: ['CANCELLED', 'NO_SHOW'] },
			},
			select: {
				startTime: true,
				endTime: true,
			},
		});

		return bookings.map((b) => ({
			startTime: b.startTime.toISOString(),
			endTime: b.endTime.toISOString(),
		}));
	} catch (error) {
		console.error('Get booked slots error:', error);
		return [];
	}
}

export async function checkAvailability(
	spaceId: string,
	date: Date,
	startTime: Date,
	endTime: Date
): Promise<{
	available: boolean;
	conflictingBookings?: BookingWithRelations[];
}> {
	try {
		const conflicts = await prisma.booking.findMany({
			where: {
				spaceId,
				bookingDate: date,
				status: { notIn: ['CANCELLED', 'NO_SHOW'] },
				OR: [
					{
						AND: [
							{ startTime: { lte: startTime } },
							{ endTime: { gt: startTime } },
						],
					},
					{
						AND: [
							{ startTime: { lt: endTime } },
							{ endTime: { gte: endTime } },
						],
					},
					{
						AND: [
							{ startTime: { gte: startTime } },
							{ endTime: { lte: endTime } },
						],
					},
				],
			},
			include: {
				user: {
					select: { id: true, name: true, email: true, phone: true },
				},
				space: {
					select: { id: true, name: true, slug: true, images: true },
				},
				pricingPlan: {
					select: { id: true, name: true, price: true, unit: true },
				},
			},
		});

		return {
			available: conflicts.length === 0,
			conflictingBookings: conflicts as BookingWithRelations[],
		};
	} catch (error) {
		console.error('Check availability error:', error);
		return { available: false };
	}
}
