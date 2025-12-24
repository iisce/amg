'use server';

import { prisma } from '@/lib/db';
import { getCurrentUser } from './auth';
import type { ApiResponse } from '@/lib/types';
import type { Enquiry, EnquiryStatus } from '@prisma/client';
import { z } from 'zod';

// ============================================
// ENQUIRY SCHEMAS
// ============================================

const createEnquirySchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters'),
	email: z.string().email('Invalid email address'),
	phone: z.string().optional(),
	company: z.string().optional(),
	spaceId: z.string().optional(),
	subject: z.string().min(3, 'Subject must be at least 3 characters'),
	message: z.string().min(10, 'Message must be at least 10 characters'),
});

const updateEnquirySchema = z.object({
	status: z.enum(['NEW', 'IN_PROGRESS', 'RESPONDED', 'CLOSED']).optional(),
	notes: z.string().optional(),
});

// ============================================
// CLIENT ACTIONS
// ============================================

/**
 * Create a new enquiry
 */
export async function createEnquiry(
	data: z.infer<typeof createEnquirySchema>
): Promise<ApiResponse<Enquiry>> {
	try {
		const validated = createEnquirySchema.parse(data);

		// Get current user if logged in (optional)
		const user = await getCurrentUser();

		const enquiry = await prisma.enquiry.create({
			data: {
				name: validated.name,
				email: validated.email,
				phone: validated.phone,
				company: validated.company,
				spaceId: validated.spaceId || null,
				subject: validated.subject,
				message: validated.message,
				userId: user?.id || null,
			},
			include: {
				space: true,
			},
		});

		return {
			success: true,
			message:
				'Thank you for your enquiry! We will get back to you shortly.',
			data: enquiry,
		};
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				message: error.errors[0].message,
			};
		}

		console.error('Create enquiry error:', error);
		return {
			success: false,
			message: 'Failed to submit enquiry. Please try again.',
		};
	}
}

// ============================================
// ADMIN ACTIONS
// ============================================

/**
 * Get all enquiries with filters (admin only)
 */
export async function getEnquiries(options?: {
	status?: EnquiryStatus;
	spaceId?: string;
	page?: number;
	limit?: number;
}): Promise<ApiResponse<{ enquiries: Enquiry[]; total: number }>> {
	try {
		const user = await getCurrentUser();
		if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
			return { success: false, message: 'Unauthorized' };
		}

		const page = options?.page || 1;
		const limit = options?.limit || 20;
		const skip = (page - 1) * limit;

		const where: {
			status?: EnquiryStatus;
			spaceId?: string;
		} = {};

		if (options?.status) {
			where.status = options.status;
		}
		if (options?.spaceId) {
			where.spaceId = options.spaceId;
		}

		const [enquiries, total] = await Promise.all([
			prisma.enquiry.findMany({
				where,
				include: {
					space: {
						select: {
							id: true,
							name: true,
							slug: true,
						},
					},
					user: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
				orderBy: { createdAt: 'desc' },
				skip,
				take: limit,
			}),
			prisma.enquiry.count({ where }),
		]);

		return {
			success: true,
			message: 'Enquiries fetched successfully',
			data: { enquiries, total },
		};
	} catch (error) {
		console.error('Get enquiries error:', error);
		return {
			success: false,
			message: 'Failed to fetch enquiries',
		};
	}
}

/**
 * Get a single enquiry by ID (admin only)
 */
export async function getEnquiryById(
	id: string
): Promise<ApiResponse<Enquiry>> {
	try {
		const user = await getCurrentUser();
		if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
			return { success: false, message: 'Unauthorized' };
		}

		const enquiry = await prisma.enquiry.findUnique({
			where: { id },
			include: {
				space: true,
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						phone: true,
						company: true,
					},
				},
			},
		});

		if (!enquiry) {
			return { success: false, message: 'Enquiry not found' };
		}

		return {
			success: true,
			message: 'Enquiry fetched successfully',
			data: enquiry,
		};
	} catch (error) {
		console.error('Get enquiry error:', error);
		return {
			success: false,
			message: 'Failed to fetch enquiry',
		};
	}
}

/**
 * Update enquiry status/notes (admin only)
 */
export async function updateEnquiry(
	id: string,
	data: z.infer<typeof updateEnquirySchema>
): Promise<ApiResponse<Enquiry>> {
	try {
		const user = await getCurrentUser();
		if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
			return { success: false, message: 'Unauthorized' };
		}

		const validated = updateEnquirySchema.parse(data);

		const enquiry = await prisma.enquiry.update({
			where: { id },
			data: {
				status: validated.status,
				notes: validated.notes,
			},
		});

		return {
			success: true,
			message: 'Enquiry updated successfully',
			data: enquiry,
		};
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				message: error.errors[0].message,
			};
		}

		console.error('Update enquiry error:', error);
		return {
			success: false,
			message: 'Failed to update enquiry',
		};
	}
}

/**
 * Delete an enquiry (admin only)
 */
export async function deleteEnquiry(id: string): Promise<ApiResponse<void>> {
	try {
		const user = await getCurrentUser();
		if (!user || user.role !== 'ADMIN') {
			return { success: false, message: 'Unauthorized' };
		}

		await prisma.enquiry.delete({
			where: { id },
		});

		return {
			success: true,
			message: 'Enquiry deleted successfully',
		};
	} catch (error) {
		console.error('Delete enquiry error:', error);
		return {
			success: false,
			message: 'Failed to delete enquiry',
		};
	}
}

/**
 * Get enquiry statistics (admin only)
 */
export async function getEnquiryStats(): Promise<
	ApiResponse<{
		total: number;
		new: number;
		inProgress: number;
		responded: number;
		closed: number;
	}>
> {
	try {
		const user = await getCurrentUser();
		if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
			return { success: false, message: 'Unauthorized' };
		}

		const [total, newCount, inProgressCount, respondedCount, closedCount] =
			await Promise.all([
				prisma.enquiry.count(),
				prisma.enquiry.count({ where: { status: 'NEW' } }),
				prisma.enquiry.count({ where: { status: 'IN_PROGRESS' } }),
				prisma.enquiry.count({ where: { status: 'RESPONDED' } }),
				prisma.enquiry.count({ where: { status: 'CLOSED' } }),
			]);

		return {
			success: true,
			message: 'Enquiry stats fetched successfully',
			data: {
				total,
				new: newCount,
				inProgress: inProgressCount,
				responded: respondedCount,
				closed: closedCount,
			},
		};
	} catch (error) {
		console.error('Get enquiry stats error:', error);
		return {
			success: false,
			message: 'Failed to fetch enquiry statistics',
		};
	}
}
