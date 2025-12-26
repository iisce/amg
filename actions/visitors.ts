'use server';

import { prisma } from '@/lib/db';
import type { Visitor, VisitorStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';
import { getCurrentUser, getCurrentAdmin } from './auth';
import { sendEmail } from '@/lib/email';
import {
	createVisitorInviteEmail,
	createVisitorCheckInNotificationEmail,
} from '@/lib/email-templates';

// ============================================
// TYPES
// ============================================

export interface VisitorWithRelations extends Visitor {
	host: {
		id: string;
		name: string;
		email: string;
		phone: string | null;
	};
	membership?: {
		id: string;
		membershipNumber: string;
		space: {
			id: string;
			name: string;
		};
	} | null;
}

export interface VisitorResult {
	success: boolean;
	message: string;
	data?: VisitorWithRelations | VisitorWithRelations[];
	error?: string;
}

export interface CreateVisitorInput {
	name: string;
	email?: string;
	phone?: string;
	company?: string;
	purpose: string;
	validFrom: Date;
	validUntil: Date;
	maxDuration?: number; // in minutes
	notes?: string;
	hostMembershipId?: string; // Optional - if visiting a specific team/membership
}

// ============================================
// HELPERS
// ============================================

function generateAccessCode(): string {
	return `AMG-VS-${randomBytes(4).toString('hex').toUpperCase()}`;
}

// ============================================
// CREATE VISITOR
// ============================================

export async function createVisitor(
	input: CreateVisitorInput
): Promise<VisitorResult> {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return {
				success: false,
				message: 'Authentication required to register visitors',
			};
		}

		// Generate unique access code
		let accessCode = generateAccessCode();
		let attempts = 0;
		while (attempts < 5) {
			const existing = await prisma.visitor.findUnique({
				where: { accessCode },
			});
			if (!existing) break;
			accessCode = generateAccessCode();
			attempts++;
		}

		// Validate dates
		const validFrom = new Date(input.validFrom);
		const validUntil = new Date(input.validUntil);
		const now = new Date();

		if (validFrom < new Date(now.setHours(0, 0, 0, 0))) {
			return {
				success: false,
				message: 'Valid from date cannot be in the past',
			};
		}

		if (validUntil <= validFrom) {
			return {
				success: false,
				message: 'Valid until must be after valid from',
			};
		}

		// Create visitor
		const visitor = await prisma.visitor.create({
			data: {
				name: input.name,
				email: input.email || null,
				phone: input.phone || null,
				company: input.company || null,
				purpose: input.purpose,
				hostId: user.id,
				hostMembershipId: input.hostMembershipId || null,
				accessCode,
				validFrom,
				validUntil,
				maxDuration: input.maxDuration || 480, // Default 8 hours
				status: 'PENDING',
				notes: input.notes || null,
			},
			include: {
				host: {
					select: { id: true, name: true, email: true, phone: true },
				},
				membership: {
					select: {
						id: true,
						membershipNumber: true,
						space: {
							select: { id: true, name: true },
						},
					},
				},
			},
		});

		// Log activity
		await prisma.activityLog.create({
			data: {
				userId: user.id,
				action: 'visitor.registered',
				entityType: 'Visitor',
				entityId: visitor.id,
				metadata: {
					visitorName: input.name,
					validFrom: validFrom.toISOString(),
					validUntil: validUntil.toISOString(),
				},
			},
		});

		// Send invitation email if email provided
		if (visitor.email) {
			try {
				const inviteEmail = createVisitorInviteEmail({
					visitorName: visitor.name,
					visitorEmail: visitor.email,
					hostName: visitor.host.name,
					accessCode: visitor.accessCode,
					validFrom: visitor.validFrom,
					validUntil: visitor.validUntil,
					purpose: visitor.purpose || 'General visit',
					company: visitor.company || undefined,
				});

				await sendEmail({
					to: visitor.email,
					subject: inviteEmail.subject,
					html: inviteEmail.html,
				});
			} catch (emailError) {
				console.error(
					'Failed to send visitor invitation email:',
					emailError
				);
			}
		}

		revalidatePath('/dashboard/visitors');
		revalidatePath('/admin/members');

		return {
			success: true,
			message: `Visitor ${visitor.name} registered successfully${
				visitor.email ? ' and invitation email sent' : ''
			}`,
			data: visitor as VisitorWithRelations,
		};
	} catch (error) {
		console.error('Create visitor error:', error);
		return {
			success: false,
			message: 'Failed to register visitor',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// GET VISITORS
// ============================================

export async function getVisitors(options?: {
	hostId?: string;
	hostMembershipId?: string;
	status?: VisitorStatus;
	upcoming?: boolean;
	limit?: number;
	offset?: number;
}): Promise<VisitorResult> {
	try {
		const user = await getCurrentUser();
		const admin = !user ? await getCurrentAdmin() : null;

		if (!user && !admin) {
			return {
				success: false,
				message: 'Authentication required',
			};
		}

		const {
			hostId,
			hostMembershipId,
			status,
			upcoming,
			limit = 50,
			offset = 0,
		} = options || {};

		const now = new Date();

		const visitors = await prisma.visitor.findMany({
			where: {
				// Regular users can only see their own visitors
				...(user && !admin && { hostId: user.id }),
				// Admin can filter by host
				...(admin && hostId && { hostId }),
				...(hostMembershipId && { hostMembershipId }),
				...(status && { status }),
				...(upcoming && {
					validFrom: { gte: now },
					status: 'PENDING',
				}),
			},
			include: {
				host: {
					select: { id: true, name: true, email: true, phone: true },
				},
				membership: {
					select: {
						id: true,
						membershipNumber: true,
						space: {
							select: { id: true, name: true },
						},
					},
				},
			},
			orderBy: { validFrom: 'asc' },
			take: limit,
			skip: offset,
		});

		return {
			success: true,
			message: 'Visitors fetched successfully',
			data: visitors as VisitorWithRelations[],
		};
	} catch (error) {
		console.error('Get visitors error:', error);
		return {
			success: false,
			message: 'Failed to fetch visitors',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getVisitorById(id: string): Promise<VisitorResult> {
	try {
		const user = await getCurrentUser();
		const admin = !user ? await getCurrentAdmin() : null;

		if (!user && !admin) {
			return {
				success: false,
				message: 'Authentication required',
			};
		}

		const visitor = await prisma.visitor.findUnique({
			where: { id },
			include: {
				host: {
					select: { id: true, name: true, email: true, phone: true },
				},
				membership: {
					select: {
						id: true,
						membershipNumber: true,
						space: {
							select: { id: true, name: true },
						},
					},
				},
			},
		});

		if (!visitor) {
			return {
				success: false,
				message: 'Visitor not found',
			};
		}

		// Regular users can only view their own visitors
		if (user && !admin && visitor.hostId !== user.id) {
			return {
				success: false,
				message: 'You do not have permission to view this visitor',
			};
		}

		return {
			success: true,
			message: 'Visitor fetched successfully',
			data: visitor as VisitorWithRelations,
		};
	} catch (error) {
		console.error('Get visitor by id error:', error);
		return {
			success: false,
			message: 'Failed to fetch visitor',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// GET VISITOR BY ACCESS CODE (PUBLIC)
// ============================================

export async function getVisitorByAccessCode(
	code: string
): Promise<VisitorResult> {
	try {
		const normalizedCode = code.toUpperCase().trim();

		const visitor = await prisma.visitor.findUnique({
			where: { accessCode: normalizedCode },
			include: {
				host: {
					select: { id: true, name: true, email: true, phone: true },
				},
				membership: {
					select: {
						id: true,
						membershipNumber: true,
						space: {
							select: { id: true, name: true },
						},
					},
				},
			},
		});

		if (!visitor) {
			return {
				success: false,
				message: 'Invalid visitor access code',
			};
		}

		return {
			success: true,
			message: 'Visitor found',
			data: visitor as VisitorWithRelations,
		};
	} catch (error) {
		console.error('Get visitor by access code error:', error);
		return {
			success: false,
			message: 'Failed to lookup visitor',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// CHECK IN VISITOR
// ============================================

export async function checkInVisitor(
	idOrCode: string,
	checkedInBy?: string
): Promise<VisitorResult> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return {
				success: false,
				message: 'Admin access required to check in visitors',
			};
		}

		// Try to find by ID first, then by access code
		let visitor = await prisma.visitor.findUnique({
			where: { id: idOrCode },
			include: {
				host: {
					select: { id: true, name: true, email: true, phone: true },
				},
				membership: {
					select: {
						id: true,
						membershipNumber: true,
						space: {
							select: { id: true, name: true },
						},
					},
				},
			},
		});

		if (!visitor) {
			visitor = await prisma.visitor.findUnique({
				where: { accessCode: idOrCode.toUpperCase().trim() },
				include: {
					host: {
						select: {
							id: true,
							name: true,
							email: true,
							phone: true,
						},
					},
					membership: {
						select: {
							id: true,
							membershipNumber: true,
							space: {
								select: { id: true, name: true },
							},
						},
					},
				},
			});
		}

		if (!visitor) {
			return {
				success: false,
				message: 'Visitor not found',
			};
		}

		const now = new Date();

		// Validate visitor status
		if (visitor.status === 'CHECKED_IN') {
			return {
				success: false,
				message: `${visitor.name} is already checked in`,
			};
		}

		if (visitor.status === 'CANCELLED') {
			return {
				success: false,
				message: `This visitor pass has been cancelled`,
			};
		}

		if (visitor.status === 'EXPIRED' || visitor.validUntil < now) {
			return {
				success: false,
				message: `This visitor pass has expired`,
			};
		}

		if (visitor.validFrom > now) {
			return {
				success: false,
				message: `This visitor pass is not yet valid. Valid from: ${visitor.validFrom.toLocaleString()}`,
			};
		}

		// Check in the visitor
		const updatedVisitor = await prisma.visitor.update({
			where: { id: visitor.id },
			data: {
				status: 'CHECKED_IN',
				checkInTime: now,
				checkedInBy: checkedInBy || admin.name || 'Admin',
			},
			include: {
				host: {
					select: { id: true, name: true, email: true, phone: true },
				},
				membership: {
					select: {
						id: true,
						membershipNumber: true,
						space: {
							select: { id: true, name: true },
						},
					},
				},
			},
		});

		// Log activity
		await prisma.activityLog.create({
			data: {
				userId: admin.id,
				action: 'visitor.checked_in',
				entityType: 'Visitor',
				entityId: visitor.id,
				metadata: {
					visitorName: visitor.name,
					hostName: visitor.host.name,
					checkedInBy: checkedInBy || admin.name,
				},
			},
		});

		// Notify host
		try {
			const notifyEmail = createVisitorCheckInNotificationEmail({
				hostName: visitor.host.name,
				visitorName: visitor.name,
				visitorCompany: visitor.company || undefined,
				purpose: visitor.purpose || 'General visit',
				checkInTime: now,
			});

			await sendEmail({
				to: visitor.host.email,
				subject: notifyEmail.subject,
				html: notifyEmail.html,
			});
		} catch (emailError) {
			console.error('Failed to send check-in notification:', emailError);
		}

		revalidatePath('/dashboard/visitors');
		revalidatePath('/admin/scanner');
		revalidatePath('/admin/members');

		return {
			success: true,
			message: `${visitor.name} checked in successfully`,
			data: updatedVisitor as VisitorWithRelations,
		};
	} catch (error) {
		console.error('Check in visitor error:', error);
		return {
			success: false,
			message: 'Failed to check in visitor',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// CHECK OUT VISITOR
// ============================================

export async function checkOutVisitor(
	idOrCode: string
): Promise<VisitorResult> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return {
				success: false,
				message: 'Admin access required to check out visitors',
			};
		}

		// Try to find by ID first, then by access code
		let visitor = await prisma.visitor.findUnique({
			where: { id: idOrCode },
			include: {
				host: {
					select: { id: true, name: true, email: true, phone: true },
				},
				membership: {
					select: {
						id: true,
						membershipNumber: true,
						space: {
							select: { id: true, name: true },
						},
					},
				},
			},
		});

		if (!visitor) {
			visitor = await prisma.visitor.findUnique({
				where: { accessCode: idOrCode.toUpperCase().trim() },
				include: {
					host: {
						select: {
							id: true,
							name: true,
							email: true,
							phone: true,
						},
					},
					membership: {
						select: {
							id: true,
							membershipNumber: true,
							space: {
								select: { id: true, name: true },
							},
						},
					},
				},
			});
		}

		if (!visitor) {
			return {
				success: false,
				message: 'Visitor not found',
			};
		}

		if (visitor.status !== 'CHECKED_IN') {
			return {
				success: false,
				message: `${visitor.name} is not currently checked in`,
			};
		}

		const now = new Date();

		const updatedVisitor = await prisma.visitor.update({
			where: { id: visitor.id },
			data: {
				status: 'CHECKED_OUT',
				checkOutTime: now,
			},
			include: {
				host: {
					select: { id: true, name: true, email: true, phone: true },
				},
				membership: {
					select: {
						id: true,
						membershipNumber: true,
						space: {
							select: { id: true, name: true },
						},
					},
				},
			},
		});

		// Log activity
		await prisma.activityLog.create({
			data: {
				userId: admin.id,
				action: 'visitor.checked_out',
				entityType: 'Visitor',
				entityId: visitor.id,
				metadata: {
					visitorName: visitor.name,
					hostName: visitor.host.name,
					duration: visitor.checkInTime
						? Math.round(
								(now.getTime() -
									visitor.checkInTime.getTime()) /
									60000
						  )
						: null,
				},
			},
		});

		revalidatePath('/dashboard/visitors');
		revalidatePath('/admin/scanner');
		revalidatePath('/admin/members');

		const duration = visitor.checkInTime
			? Math.round(
					(now.getTime() - visitor.checkInTime.getTime()) / 60000
			  )
			: 0;
		const hours = Math.floor(duration / 60);
		const minutes = duration % 60;
		const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

		return {
			success: true,
			message: `${visitor.name} checked out successfully. Visit duration: ${durationStr}`,
			data: updatedVisitor as VisitorWithRelations,
		};
	} catch (error) {
		console.error('Check out visitor error:', error);
		return {
			success: false,
			message: 'Failed to check out visitor',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// CANCEL VISITOR PASS
// ============================================

export async function cancelVisitor(id: string): Promise<VisitorResult> {
	try {
		const user = await getCurrentUser();
		const admin = !user ? await getCurrentAdmin() : null;

		if (!user && !admin) {
			return {
				success: false,
				message: 'Authentication required',
			};
		}

		const visitor = await prisma.visitor.findUnique({
			where: { id },
			include: {
				host: {
					select: { id: true, name: true, email: true, phone: true },
				},
				membership: {
					select: {
						id: true,
						membershipNumber: true,
						space: {
							select: { id: true, name: true },
						},
					},
				},
			},
		});

		if (!visitor) {
			return {
				success: false,
				message: 'Visitor not found',
			};
		}

		// Regular users can only cancel their own visitors
		if (user && !admin && visitor.hostId !== user.id) {
			return {
				success: false,
				message:
					'You do not have permission to cancel this visitor pass',
			};
		}

		if (visitor.status === 'CANCELLED') {
			return {
				success: false,
				message: 'This visitor pass is already cancelled',
			};
		}

		if (visitor.status === 'CHECKED_IN') {
			return {
				success: false,
				message:
					'Cannot cancel a visitor who is currently checked in. Check out first.',
			};
		}

		const updatedVisitor = await prisma.visitor.update({
			where: { id },
			data: { status: 'CANCELLED' },
			include: {
				host: {
					select: { id: true, name: true, email: true, phone: true },
				},
				membership: {
					select: {
						id: true,
						membershipNumber: true,
						space: {
							select: { id: true, name: true },
						},
					},
				},
			},
		});

		// Log activity
		await prisma.activityLog.create({
			data: {
				userId: user?.id || admin?.id,
				action: 'visitor.cancelled',
				entityType: 'Visitor',
				entityId: visitor.id,
				metadata: {
					visitorName: visitor.name,
					cancelledBy: user?.name || admin?.name || 'Unknown',
				},
			},
		});

		revalidatePath('/dashboard/visitors');
		revalidatePath('/admin/members');

		return {
			success: true,
			message: `Visitor pass for ${visitor.name} has been cancelled`,
			data: updatedVisitor as VisitorWithRelations,
		};
	} catch (error) {
		console.error('Cancel visitor error:', error);
		return {
			success: false,
			message: 'Failed to cancel visitor pass',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// UPDATE VISITOR
// ============================================

export async function updateVisitor(
	id: string,
	data: Partial<CreateVisitorInput>
): Promise<VisitorResult> {
	try {
		const user = await getCurrentUser();
		const admin = !user ? await getCurrentAdmin() : null;

		if (!user && !admin) {
			return {
				success: false,
				message: 'Authentication required',
			};
		}

		const visitor = await prisma.visitor.findUnique({
			where: { id },
		});

		if (!visitor) {
			return {
				success: false,
				message: 'Visitor not found',
			};
		}

		// Regular users can only update their own visitors
		if (user && !admin && visitor.hostId !== user.id) {
			return {
				success: false,
				message: 'You do not have permission to update this visitor',
			};
		}

		// Cannot update if already checked in or out
		if (
			visitor.status === 'CHECKED_IN' ||
			visitor.status === 'CHECKED_OUT'
		) {
			return {
				success: false,
				message: 'Cannot update visitor details after check-in',
			};
		}

		const updatedVisitor = await prisma.visitor.update({
			where: { id },
			data: {
				...(data.name && { name: data.name }),
				...(data.email !== undefined && { email: data.email || null }),
				...(data.phone !== undefined && { phone: data.phone || null }),
				...(data.company !== undefined && {
					company: data.company || null,
				}),
				...(data.purpose && { purpose: data.purpose }),
				...(data.validFrom && { validFrom: new Date(data.validFrom) }),
				...(data.validUntil && {
					validUntil: new Date(data.validUntil),
				}),
				...(data.maxDuration !== undefined && {
					maxDuration: data.maxDuration,
				}),
				...(data.notes !== undefined && { notes: data.notes || null }),
			},
			include: {
				host: {
					select: { id: true, name: true, email: true, phone: true },
				},
				membership: {
					select: {
						id: true,
						membershipNumber: true,
						space: {
							select: { id: true, name: true },
						},
					},
				},
			},
		});

		revalidatePath('/dashboard/visitors');
		revalidatePath('/admin/members');

		return {
			success: true,
			message: 'Visitor updated successfully',
			data: updatedVisitor as VisitorWithRelations,
		};
	} catch (error) {
		console.error('Update visitor error:', error);
		return {
			success: false,
			message: 'Failed to update visitor',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// RESEND VISITOR INVITATION EMAIL
// ============================================

export async function resendVisitorInvitation(
	id: string
): Promise<VisitorResult> {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return {
				success: false,
				message: 'Authentication required',
			};
		}

		const visitor = await prisma.visitor.findUnique({
			where: { id },
			include: {
				host: {
					select: { id: true, name: true, email: true, phone: true },
				},
				membership: {
					select: {
						id: true,
						membershipNumber: true,
						space: {
							select: { id: true, name: true },
						},
					},
				},
			},
		});

		if (!visitor) {
			return {
				success: false,
				message: 'Visitor not found',
			};
		}

		if (visitor.hostId !== user.id) {
			return {
				success: false,
				message: 'You do not have permission to send this invitation',
			};
		}

		if (!visitor.email) {
			return {
				success: false,
				message: 'Visitor does not have an email address',
			};
		}

		if (visitor.status !== 'PENDING') {
			return {
				success: false,
				message: 'Can only resend invitation for pending visitors',
			};
		}

		const inviteEmail = createVisitorInviteEmail({
			visitorName: visitor.name,
			visitorEmail: visitor.email,
			hostName: visitor.host.name,
			accessCode: visitor.accessCode,
			validFrom: visitor.validFrom,
			validUntil: visitor.validUntil,
			purpose: visitor.purpose || 'General visit',
			company: visitor.company || undefined,
		});

		const sent = await sendEmail({
			to: visitor.email,
			subject: inviteEmail.subject,
			html: inviteEmail.html,
		});

		if (!sent) {
			return {
				success: false,
				message: 'Failed to send invitation email',
			};
		}

		return {
			success: true,
			message: `Invitation email sent to ${visitor.email}`,
			data: visitor as VisitorWithRelations,
		};
	} catch (error) {
		console.error('Resend visitor invitation error:', error);
		return {
			success: false,
			message: 'Failed to resend invitation',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// GET USER'S VISITOR HISTORY
// ============================================

export async function getVisitorHistory(options?: {
	limit?: number;
	offset?: number;
}): Promise<VisitorResult> {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return {
				success: false,
				message: 'Authentication required',
			};
		}

		const { limit = 50, offset = 0 } = options || {};

		const visitors = await prisma.visitor.findMany({
			where: { hostId: user.id },
			include: {
				host: {
					select: { id: true, name: true, email: true, phone: true },
				},
				membership: {
					select: {
						id: true,
						membershipNumber: true,
						space: {
							select: { id: true, name: true },
						},
					},
				},
			},
			orderBy: { createdAt: 'desc' },
			take: limit,
			skip: offset,
		});

		return {
			success: true,
			message: 'Visitor history fetched successfully',
			data: visitors as VisitorWithRelations[],
		};
	} catch (error) {
		console.error('Get visitor history error:', error);
		return {
			success: false,
			message: 'Failed to fetch visitor history',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// GET TODAY'S VISITORS (Admin)
// ============================================

export async function getTodaysVisitors(): Promise<VisitorResult> {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		const visitors = await prisma.visitor.findMany({
			where: {
				OR: [
					// Expected visitors today
					{
						validFrom: { lte: tomorrow },
						validUntil: { gte: today },
						status: 'PENDING',
					},
					// Currently checked in
					{ status: 'CHECKED_IN' },
					// Checked out today
					{
						checkOutTime: { gte: today, lt: tomorrow },
					},
				],
			},
			include: {
				host: {
					select: { id: true, name: true, email: true, phone: true },
				},
				membership: {
					select: {
						id: true,
						membershipNumber: true,
						space: {
							select: { id: true, name: true },
						},
					},
				},
			},
			orderBy: [{ status: 'asc' }, { validFrom: 'asc' }],
		});

		return {
			success: true,
			message: "Today's visitors fetched successfully",
			data: visitors as VisitorWithRelations[],
		};
	} catch (error) {
		console.error("Get today's visitors error:", error);
		return {
			success: false,
			message: "Failed to fetch today's visitors",
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// EXPIRE OVERDUE VISITORS (Background Job)
// ============================================

export async function expireOverdueVisitors(): Promise<{
	success: boolean;
	count: number;
	message: string;
}> {
	try {
		const now = new Date();

		const result = await prisma.visitor.updateMany({
			where: {
				status: 'PENDING',
				validUntil: { lt: now },
			},
			data: {
				status: 'EXPIRED',
			},
		});

		return {
			success: true,
			count: result.count,
			message: `${result.count} visitor passes marked as expired`,
		};
	} catch (error) {
		console.error('Expire overdue visitors error:', error);
		return {
			success: false,
			count: 0,
			message: 'Failed to expire overdue visitors',
		};
	}
}
