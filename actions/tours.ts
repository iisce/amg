'use server';

import { prisma } from '@/lib/db';
import type { Tour, TourStatus } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { getCurrentAdmin } from './auth';
import { sendEmail } from '@/lib/email';
import {
	createTourRequestEmail,
	createTourConfirmationEmail,
	createTourReminderEmail,
	createTourAdminNotificationEmail,
} from '@/lib/email-templates';

// ============================================
// TYPES
// ============================================

export type { Tour, TourStatus };

export interface TourResult {
	success: boolean;
	message: string;
	data?: Tour | Tour[];
	error?: string;
}

export interface CreateTourInput {
	name: string;
	email: string;
	phone?: string;
	company?: string;
	preferredDate: Date;
	duration?: number;
	interestedIn?: string;
	groupSize?: number;
	budget?: string;
	source?: string;
	message?: string;
}

export interface UpdateTourInput {
	confirmedDate?: Date;
	duration?: number;
	status?: TourStatus;
	confirmedBy?: string;
	conductedBy?: string;
	feedback?: string;
	converted?: boolean;
	convertedToMembershipId?: string;
}

// ============================================
// PUBLIC: REQUEST A TOUR
// ============================================

export async function requestTour(input: CreateTourInput): Promise<TourResult> {
	try {
		// Validate required fields
		if (!input.name || !input.email || !input.preferredDate) {
			return {
				success: false,
				message: 'Name, email, and preferred date are required',
			};
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(input.email)) {
			return {
				success: false,
				message: 'Please enter a valid email address',
			};
		}

		// Validate preferred date is in the future
		const preferredDate = new Date(input.preferredDate);
		const now = new Date();
		if (preferredDate < now) {
			return {
				success: false,
				message: 'Please select a future date and time',
			};
		}

		// Create the tour request
		const tour = await prisma.tour.create({
			data: {
				name: input.name,
				email: input.email.toLowerCase().trim(),
				phone: input.phone || null,
				company: input.company || null,
				preferredDate,
				duration: input.duration || 30,
				interestedIn: input.interestedIn || null,
				groupSize: input.groupSize || 1,
				budget: input.budget || null,
				source: input.source || null,
				message: input.message || null,
				status: 'PENDING',
			},
		});

		// Send confirmation email to prospect
		try {
			const confirmEmail = createTourRequestEmail({
				name: input.name,
				email: input.email,
				preferredDate,
				interestedIn: input.interestedIn,
			});

			await sendEmail({
				to: input.email,
				subject: confirmEmail.subject,
				html: confirmEmail.html,
			});
		} catch (emailError) {
			console.error(
				'Failed to send tour request confirmation:',
				emailError
			);
		}

		// Notify admin
		try {
			const adminEmail = createTourAdminNotificationEmail({
				name: input.name,
				email: input.email,
				phone: input.phone,
				company: input.company,
				preferredDate,
				interestedIn: input.interestedIn,
				groupSize: input.groupSize || 1,
				budget: input.budget,
				source: input.source,
				message: input.message,
			});

			// Send to admin email - you can configure this
			await sendEmail({
				to: process.env.ADMIN_EMAIL || 'admin@amgworkspace.com',
				subject: adminEmail.subject,
				html: adminEmail.html,
			});
		} catch (emailError) {
			console.error('Failed to send admin notification:', emailError);
		}

		revalidatePath('/admin/tours');

		return {
			success: true,
			message:
				'Tour request submitted successfully! We will contact you shortly to confirm your appointment.',
			data: tour,
		};
	} catch (error) {
		console.error('Request tour error:', error);
		return {
			success: false,
			message: 'Failed to submit tour request',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// ADMIN: GET TOURS
// ============================================

export async function getTours(options?: {
	status?: TourStatus;
	upcoming?: boolean;
	today?: boolean;
	limit?: number;
	offset?: number;
}): Promise<TourResult> {
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
			upcoming,
			today,
			limit = 50,
			offset = 0,
		} = options || {};

		const now = new Date();
		const todayStart = new Date(now);
		todayStart.setHours(0, 0, 0, 0);
		const todayEnd = new Date(todayStart);
		todayEnd.setDate(todayEnd.getDate() + 1);

		const tours = await prisma.tour.findMany({
			where: {
				...(status && { status }),
				...(upcoming && {
					OR: [
						{ confirmedDate: { gte: now } },
						{ confirmedDate: null, preferredDate: { gte: now } },
					],
					status: { in: ['PENDING', 'CONFIRMED'] },
				}),
				...(today && {
					OR: [
						{
							confirmedDate: { gte: todayStart, lt: todayEnd },
						},
						{
							confirmedDate: null,
							preferredDate: { gte: todayStart, lt: todayEnd },
						},
					],
				}),
			},
			orderBy: [
				{ status: 'asc' },
				{ confirmedDate: 'asc' },
				{ preferredDate: 'asc' },
			],
			take: limit,
			skip: offset,
		});

		return {
			success: true,
			message: 'Tours fetched successfully',
			data: tours,
		};
	} catch (error) {
		console.error('Get tours error:', error);
		return {
			success: false,
			message: 'Failed to fetch tours',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getTourById(id: string): Promise<TourResult> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const tour = await prisma.tour.findUnique({
			where: { id },
		});

		if (!tour) {
			return {
				success: false,
				message: 'Tour not found',
			};
		}

		return {
			success: true,
			message: 'Tour fetched successfully',
			data: tour,
		};
	} catch (error) {
		console.error('Get tour by id error:', error);
		return {
			success: false,
			message: 'Failed to fetch tour',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// ADMIN: CONFIRM TOUR
// ============================================

export async function confirmTour(
	id: string,
	confirmedDate: Date,
	confirmedBy?: string
): Promise<TourResult> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const tour = await prisma.tour.findUnique({
			where: { id },
		});

		if (!tour) {
			return {
				success: false,
				message: 'Tour not found',
			};
		}

		if (tour.status !== 'PENDING') {
			return {
				success: false,
				message: `Cannot confirm a tour with status: ${tour.status}`,
			};
		}

		const updatedTour = await prisma.tour.update({
			where: { id },
			data: {
				status: 'CONFIRMED',
				confirmedDate: new Date(confirmedDate),
				confirmedBy: confirmedBy || admin.name || 'Admin',
			},
		});

		// Send confirmation email to prospect
		try {
			const confirmEmail = createTourConfirmationEmail({
				name: tour.name,
				email: tour.email,
				confirmedDate: new Date(confirmedDate),
				duration: tour.duration,
			});

			await sendEmail({
				to: tour.email,
				subject: confirmEmail.subject,
				html: confirmEmail.html,
			});
		} catch (emailError) {
			console.error(
				'Failed to send tour confirmation email:',
				emailError
			);
		}

		// Log activity
		await prisma.activityLog.create({
			data: {
				userId: admin.id,
				action: 'tour.confirmed',
				entityType: 'Tour',
				entityId: tour.id,
				metadata: {
					tourName: tour.name,
					confirmedDate: confirmedDate,
				},
			},
		});

		revalidatePath('/admin/tours');

		return {
			success: true,
			message: `Tour confirmed for ${tour.name}. Confirmation email sent.`,
			data: updatedTour,
		};
	} catch (error) {
		console.error('Confirm tour error:', error);
		return {
			success: false,
			message: 'Failed to confirm tour',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// ADMIN: RESCHEDULE TOUR
// ============================================

export async function rescheduleTour(
	id: string,
	newDate: Date
): Promise<TourResult> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const tour = await prisma.tour.findUnique({
			where: { id },
		});

		if (!tour) {
			return {
				success: false,
				message: 'Tour not found',
			};
		}

		if (!['PENDING', 'CONFIRMED'].includes(tour.status)) {
			return {
				success: false,
				message: `Cannot reschedule a tour with status: ${tour.status}`,
			};
		}

		const updatedTour = await prisma.tour.update({
			where: { id },
			data: {
				confirmedDate: new Date(newDate),
				status: 'CONFIRMED',
			},
		});

		// Send rescheduled confirmation email
		try {
			const confirmEmail = createTourConfirmationEmail({
				name: tour.name,
				email: tour.email,
				confirmedDate: new Date(newDate),
				duration: tour.duration,
				isRescheduled: true,
			});

			await sendEmail({
				to: tour.email,
				subject: confirmEmail.subject,
				html: confirmEmail.html,
			});
		} catch (emailError) {
			console.error('Failed to send reschedule email:', emailError);
		}

		revalidatePath('/admin/tours');

		return {
			success: true,
			message: `Tour rescheduled for ${tour.name}`,
			data: updatedTour,
		};
	} catch (error) {
		console.error('Reschedule tour error:', error);
		return {
			success: false,
			message: 'Failed to reschedule tour',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// ADMIN: COMPLETE TOUR
// ============================================

export async function completeTour(
	id: string,
	conductedBy?: string,
	feedback?: string
): Promise<TourResult> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const tour = await prisma.tour.findUnique({
			where: { id },
		});

		if (!tour) {
			return {
				success: false,
				message: 'Tour not found',
			};
		}

		if (tour.status !== 'CONFIRMED') {
			return {
				success: false,
				message: 'Only confirmed tours can be marked as completed',
			};
		}

		const updatedTour = await prisma.tour.update({
			where: { id },
			data: {
				status: 'COMPLETED',
				conductedBy: conductedBy || admin.name || 'Staff',
				feedback: feedback || null,
			},
		});

		// Log activity
		await prisma.activityLog.create({
			data: {
				userId: admin.id,
				action: 'tour.completed',
				entityType: 'Tour',
				entityId: tour.id,
				metadata: {
					tourName: tour.name,
					conductedBy: conductedBy || admin.name,
				},
			},
		});

		revalidatePath('/admin/tours');

		return {
			success: true,
			message: `Tour marked as completed`,
			data: updatedTour,
		};
	} catch (error) {
		console.error('Complete tour error:', error);
		return {
			success: false,
			message: 'Failed to complete tour',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// ADMIN: CANCEL TOUR
// ============================================

export async function cancelTour(
	id: string,
	reason?: string
): Promise<TourResult> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const tour = await prisma.tour.findUnique({
			where: { id },
		});

		if (!tour) {
			return {
				success: false,
				message: 'Tour not found',
			};
		}

		if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(tour.status)) {
			return {
				success: false,
				message: `Cannot cancel a tour with status: ${tour.status}`,
			};
		}

		const updatedTour = await prisma.tour.update({
			where: { id },
			data: {
				status: 'CANCELLED',
				feedback: reason || 'Cancelled by admin',
			},
		});

		// Log activity
		await prisma.activityLog.create({
			data: {
				userId: admin.id,
				action: 'tour.cancelled',
				entityType: 'Tour',
				entityId: tour.id,
				metadata: {
					tourName: tour.name,
					reason,
				},
			},
		});

		revalidatePath('/admin/tours');

		return {
			success: true,
			message: `Tour cancelled`,
			data: updatedTour,
		};
	} catch (error) {
		console.error('Cancel tour error:', error);
		return {
			success: false,
			message: 'Failed to cancel tour',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// ADMIN: MARK NO SHOW
// ============================================

export async function markTourNoShow(id: string): Promise<TourResult> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const tour = await prisma.tour.findUnique({
			where: { id },
		});

		if (!tour) {
			return {
				success: false,
				message: 'Tour not found',
			};
		}

		if (tour.status !== 'CONFIRMED') {
			return {
				success: false,
				message: 'Only confirmed tours can be marked as no-show',
			};
		}

		const updatedTour = await prisma.tour.update({
			where: { id },
			data: {
				status: 'NO_SHOW',
			},
		});

		// Log activity
		await prisma.activityLog.create({
			data: {
				userId: admin.id,
				action: 'tour.no_show',
				entityType: 'Tour',
				entityId: tour.id,
				metadata: {
					tourName: tour.name,
				},
			},
		});

		revalidatePath('/admin/tours');

		return {
			success: true,
			message: `Tour marked as no-show`,
			data: updatedTour,
		};
	} catch (error) {
		console.error('Mark tour no-show error:', error);
		return {
			success: false,
			message: 'Failed to mark tour as no-show',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// ADMIN: MARK AS CONVERTED
// ============================================

export async function markTourConverted(
	id: string,
	membershipId?: string
): Promise<TourResult> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const tour = await prisma.tour.findUnique({
			where: { id },
		});

		if (!tour) {
			return {
				success: false,
				message: 'Tour not found',
			};
		}

		const updatedTour = await prisma.tour.update({
			where: { id },
			data: {
				converted: true,
				convertedToMembershipId: membershipId || null,
			},
		});

		// Log activity
		await prisma.activityLog.create({
			data: {
				userId: admin.id,
				action: 'tour.converted',
				entityType: 'Tour',
				entityId: tour.id,
				metadata: {
					tourName: tour.name,
					membershipId,
				},
			},
		});

		revalidatePath('/admin/tours');

		return {
			success: true,
			message: `🎉 Tour marked as converted to member!`,
			data: updatedTour,
		};
	} catch (error) {
		console.error('Mark tour converted error:', error);
		return {
			success: false,
			message: 'Failed to mark tour as converted',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// ADMIN: UPDATE TOUR
// ============================================

export async function updateTour(
	id: string,
	data: UpdateTourInput
): Promise<TourResult> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const tour = await prisma.tour.findUnique({
			where: { id },
		});

		if (!tour) {
			return {
				success: false,
				message: 'Tour not found',
			};
		}

		const updatedTour = await prisma.tour.update({
			where: { id },
			data: {
				...(data.confirmedDate && {
					confirmedDate: new Date(data.confirmedDate),
				}),
				...(data.duration !== undefined && { duration: data.duration }),
				...(data.status && { status: data.status }),
				...(data.confirmedBy && { confirmedBy: data.confirmedBy }),
				...(data.conductedBy && { conductedBy: data.conductedBy }),
				...(data.feedback !== undefined && { feedback: data.feedback }),
				...(data.converted !== undefined && {
					converted: data.converted,
				}),
				...(data.convertedToMembershipId !== undefined && {
					convertedToMembershipId: data.convertedToMembershipId,
				}),
			},
		});

		revalidatePath('/admin/tours');

		return {
			success: true,
			message: 'Tour updated successfully',
			data: updatedTour,
		};
	} catch (error) {
		console.error('Update tour error:', error);
		return {
			success: false,
			message: 'Failed to update tour',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// ADMIN: GET TOUR STATS
// ============================================

export async function getTourStats(): Promise<{
	success: boolean;
	message: string;
	data?: {
		total: number;
		pending: number;
		confirmed: number;
		completed: number;
		cancelled: number;
		noShow: number;
		converted: number;
		conversionRate: number;
		todayCount: number;
		thisWeekCount: number;
		thisMonthCount: number;
	};
	error?: string;
}> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const now = new Date();
		const todayStart = new Date(now);
		todayStart.setHours(0, 0, 0, 0);
		const weekStart = new Date(todayStart);
		weekStart.setDate(weekStart.getDate() - weekStart.getDay());
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

		const [
			total,
			pending,
			confirmed,
			completed,
			cancelled,
			noShow,
			converted,
			todayCount,
			thisWeekCount,
			thisMonthCount,
		] = await Promise.all([
			prisma.tour.count(),
			prisma.tour.count({ where: { status: 'PENDING' } }),
			prisma.tour.count({ where: { status: 'CONFIRMED' } }),
			prisma.tour.count({ where: { status: 'COMPLETED' } }),
			prisma.tour.count({ where: { status: 'CANCELLED' } }),
			prisma.tour.count({ where: { status: 'NO_SHOW' } }),
			prisma.tour.count({ where: { converted: true } }),
			prisma.tour.count({
				where: {
					OR: [
						{ confirmedDate: { gte: todayStart } },
						{ preferredDate: { gte: todayStart } },
					],
				},
			}),
			prisma.tour.count({ where: { createdAt: { gte: weekStart } } }),
			prisma.tour.count({ where: { createdAt: { gte: monthStart } } }),
		]);

		const conversionRate =
			completed > 0 ? Math.round((converted / completed) * 100) : 0;

		return {
			success: true,
			message: 'Tour stats fetched successfully',
			data: {
				total,
				pending,
				confirmed,
				completed,
				cancelled,
				noShow,
				converted,
				conversionRate,
				todayCount,
				thisWeekCount,
				thisMonthCount,
			},
		};
	} catch (error) {
		console.error('Get tour stats error:', error);
		return {
			success: false,
			message: 'Failed to fetch tour stats',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// ADMIN: SEND REMINDER
// ============================================

export async function sendTourReminder(id: string): Promise<TourResult> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const tour = await prisma.tour.findUnique({
			where: { id },
		});

		if (!tour) {
			return {
				success: false,
				message: 'Tour not found',
			};
		}

		if (tour.status !== 'CONFIRMED') {
			return {
				success: false,
				message: 'Can only send reminders for confirmed tours',
			};
		}

		const tourDate = tour.confirmedDate || tour.preferredDate;

		const reminderEmail = createTourReminderEmail({
			name: tour.name,
			tourDate,
			duration: tour.duration,
		});

		const sent = await sendEmail({
			to: tour.email,
			subject: reminderEmail.subject,
			html: reminderEmail.html,
		});

		if (!sent) {
			return {
				success: false,
				message: 'Failed to send reminder email',
			};
		}

		await prisma.tour.update({
			where: { id },
			data: { reminderSent: true },
		});

		return {
			success: true,
			message: `Reminder sent to ${tour.email}`,
			data: tour,
		};
	} catch (error) {
		console.error('Send tour reminder error:', error);
		return {
			success: false,
			message: 'Failed to send reminder',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// PUBLIC: GET AVAILABLE TIME SLOTS
// ============================================

export async function getAvailableTimeSlots(date: Date): Promise<{
	success: boolean;
	message: string;
	data?: string[];
	error?: string;
}> {
	try {
		const targetDate = new Date(date);
		targetDate.setHours(0, 0, 0, 0);
		const nextDay = new Date(targetDate);
		nextDay.setDate(nextDay.getDate() + 1);

		// Get all confirmed tours for that date
		const bookedTours = await prisma.tour.findMany({
			where: {
				OR: [
					{
						confirmedDate: { gte: targetDate, lt: nextDay },
					},
					{
						confirmedDate: null,
						preferredDate: { gte: targetDate, lt: nextDay },
						status: { in: ['PENDING', 'CONFIRMED'] },
					},
				],
			},
			select: {
				confirmedDate: true,
				preferredDate: true,
				duration: true,
			},
		});

		// Generate all available slots (9 AM to 5 PM, every 30 min)
		const allSlots = [];
		for (let hour = 9; hour < 17; hour++) {
			for (let min = 0; min < 60; min += 30) {
				const slotTime = new Date(targetDate);
				slotTime.setHours(hour, min, 0, 0);
				allSlots.push(slotTime);
			}
		}

		// Filter out booked slots
		const availableSlots = allSlots.filter((slot) => {
			return !bookedTours.some((tour) => {
				const tourTime = tour.confirmedDate || tour.preferredDate;
				const tourEnd = new Date(tourTime);
				tourEnd.setMinutes(
					tourEnd.getMinutes() + (tour.duration || 30)
				);

				const slotEnd = new Date(slot);
				slotEnd.setMinutes(slotEnd.getMinutes() + 30);

				// Check if slots overlap
				return slot < tourEnd && slotEnd > tourTime;
			});
		});

		return {
			success: true,
			message: 'Available slots fetched',
			data: availableSlots.map((slot) =>
				slot.toLocaleTimeString('en-US', {
					hour: '2-digit',
					minute: '2-digit',
					hour12: true,
				})
			),
		};
	} catch (error) {
		console.error('Get available time slots error:', error);
		return {
			success: false,
			message: 'Failed to fetch available slots',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}
