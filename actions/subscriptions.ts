'use server';

import { prisma } from '@/lib/db';
import type {
	Membership,
	MembershipStatus,
	MembershipType,
	Payment,
	MembershipCheckIn,
} from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';
import { getCurrentAdmin, getCurrentUser } from './auth';
import { sendEmail } from '@/lib/email';
import {
	createSubscriptionRenewalEmail,
	createSubscriptionCancellationEmail,
	createSubscriptionPausedEmail,
} from '@/lib/email-templates';

// ============================================
// TYPES
// ============================================

export interface MembershipWithRelations extends Membership {
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
	payments?: Payment[];
	checkIns?: MembershipCheckIn[];
}

export interface SubscriptionResult {
	success: boolean;
	message: string;
	data?: MembershipWithRelations | MembershipWithRelations[];
	error?: string;
}

export interface CreateSubscriptionInput {
	spaceId: string;
	pricingPlanId: string;
	type: MembershipType;
	startDate: Date;
	autoRenew?: boolean;
	assignedDesk?: string;
	contactName?: string;
	contactEmail?: string;
	contactPhone?: string;
	// Team membership fields
	companyName?: string;
	maxMembers?: number; // Total members allowed (base + addons)
	// Duration multiplier (e.g., 2 for "2 Months" plan)
	durationMultiplier?: number;
}

// ============================================
// HELPERS
// ============================================

function generateMembershipNumber(): string {
	const timestamp = Date.now().toString(36).toUpperCase();
	const random = randomBytes(2).toString('hex').toUpperCase();
	return `AMG-MB-${timestamp}${random}`;
}

function generateAccessCode(): string {
	return randomBytes(4).toString('hex').toUpperCase();
}

function calculateEndDate(
	startDate: Date,
	type: MembershipType,
	multiplier: number = 1
): Date {
	const endDate = new Date(startDate);

	switch (type) {
		case 'DAILY':
			endDate.setDate(endDate.getDate() + 1 * multiplier);
			break;
		case 'WEEKLY':
			endDate.setDate(endDate.getDate() + 7 * multiplier);
			break;
		case 'MONTHLY':
			endDate.setMonth(endDate.getMonth() + 1 * multiplier);
			break;
		case 'QUARTERLY':
			endDate.setMonth(endDate.getMonth() + 3 * multiplier);
			break;
		case 'ANNUAL':
			endDate.setFullYear(endDate.getFullYear() + 1 * multiplier);
			break;
	}

	return endDate;
}

// ============================================
// READ ACTIONS
// ============================================

export async function getSubscriptions(options?: {
	userId?: string;
	spaceId?: string;
	status?: MembershipStatus;
	type?: MembershipType;
	limit?: number;
	offset?: number;
}): Promise<SubscriptionResult> {
	try {
		const {
			userId,
			spaceId,
			status,
			type,
			limit = 50,
			offset = 0,
		} = options || {};

		const memberships = await prisma.membership.findMany({
			where: {
				...(userId && { userId }),
				...(spaceId && { spaceId }),
				...(status && { status }),
				...(type && { type }),
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
				checkIns: {
					orderBy: { checkInTime: 'desc' },
					take: 5, // Last 5 check-ins for performance
				},
			},
			orderBy: { createdAt: 'desc' },
			take: limit,
			skip: offset,
		});

		return {
			success: true,
			message: 'Subscriptions fetched successfully',
			data: memberships as MembershipWithRelations[],
		};
	} catch (error) {
		console.error('Get subscriptions error:', error);
		return {
			success: false,
			message: 'Failed to fetch subscriptions',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getSubscriptionById(
	id: string
): Promise<SubscriptionResult> {
	try {
		const membership = await prisma.membership.findUnique({
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
				payments: {
					orderBy: { createdAt: 'desc' },
				},
				checkIns: {
					orderBy: { checkInTime: 'desc' },
				},
				teamMembers: {
					where: { isActive: true },
					select: { id: true },
				},
				_count: {
					select: { teamMembers: true },
				},
			},
		});

		if (!membership) {
			return {
				success: false,
				message: 'Subscription not found',
			};
		}

		return {
			success: true,
			message: 'Subscription fetched successfully',
			data: membership as MembershipWithRelations,
		};
	} catch (error) {
		console.error('Get subscription by id error:', error);
		return {
			success: false,
			message: 'Failed to fetch subscription',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getSubscriptionByNumber(
	membershipNumber: string
): Promise<SubscriptionResult> {
	try {
		const membership = await prisma.membership.findUnique({
			where: { membershipNumber },
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

		if (!membership) {
			return {
				success: false,
				message: 'Subscription not found',
			};
		}

		return {
			success: true,
			message: 'Subscription fetched successfully',
			data: membership as MembershipWithRelations,
		};
	} catch (error) {
		console.error('Get subscription by number error:', error);
		return {
			success: false,
			message: 'Failed to fetch subscription',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getUserSubscriptions(): Promise<SubscriptionResult> {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return {
				success: false,
				message: 'Please login to view your subscriptions',
			};
		}

		return getSubscriptions({ userId: user.id });
	} catch (error) {
		console.error('Get user subscriptions error:', error);
		return {
			success: false,
			message: 'Failed to fetch subscriptions',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getActiveSubscription(
	userId: string,
	spaceId?: string
): Promise<SubscriptionResult> {
	try {
		const membership = await prisma.membership.findFirst({
			where: {
				userId,
				status: 'ACTIVE',
				...(spaceId && { spaceId }),
				endDate: { gte: new Date() },
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

		if (!membership) {
			return {
				success: false,
				message: 'No active subscription found',
			};
		}

		return {
			success: true,
			message: 'Active subscription found',
			data: membership as MembershipWithRelations,
		};
	} catch (error) {
		console.error('Get active subscription error:', error);
		return {
			success: false,
			message: 'Failed to fetch active subscription',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// CREATE ACTIONS
// ============================================

export async function createSubscription(
	input: CreateSubscriptionInput
): Promise<SubscriptionResult> {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return {
				success: false,
				message: 'Please login to create a subscription',
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
			select: {
				id: true,
				price: true,
				daysAllowed: true,
			},
		});

		if (!pricingPlan) {
			return {
				success: false,
				message: 'Invalid pricing plan',
			};
		}

		// Check for existing active subscription for same space
		const existingSubscription = await prisma.membership.findFirst({
			where: {
				userId: user.id,
				spaceId: input.spaceId,
				status: 'ACTIVE',
				endDate: { gte: new Date() },
			},
		});

		if (existingSubscription) {
			return {
				success: false,
				message:
					'You already have an active subscription for this space',
			};
		}

		const startDate = new Date(input.startDate);
		const endDate = calculateEndDate(
			startDate,
			input.type,
			input.durationMultiplier || 1
		);

		// Determine max members (default to 1 for individual subscriptions)
		const maxMembers = input.maxMembers ?? 1;

		const membership = await prisma.membership.create({
			data: {
				membershipNumber: generateMembershipNumber(),
				userId: user.id,
				spaceId: input.spaceId,
				pricingPlanId: input.pricingPlanId,
				type: input.type,
				startDate,
				endDate,
				totalAmount: pricingPlan.price,
				accessCode: generateAccessCode(),
				autoRenew: input.autoRenew ?? false,
				assignedDesk: input.assignedDesk,
				daysAllowed: pricingPlan.daysAllowed, // Copy days allowed from pricing plan
				// Team membership fields
				companyName: input.companyName,
				maxMembers,
				currentOccupancy: 0,
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

		// Create primary team member for the subscription holder
		await prisma.membershipMember.create({
			data: {
				membershipId: membership.id,
				userId: user.id,
				name: membership.user.name,
				email: membership.user.email,
				phone: membership.user.phone,
				accessCode: `AMG-TM-${generateAccessCode()}`,
				isPrimary: true,
				isActive: true,
			},
		});

		await prisma.activityLog.create({
			data: {
				userId: user.id,
				action: 'subscription.created',
				entityType: 'Membership',
				entityId: membership.id,
				metadata: {
					membershipNumber: membership.membershipNumber,
					spaceId: input.spaceId,
					type: input.type,
				},
			},
		});

		revalidatePath('/dashboard');
		revalidatePath('/dashboard/subscriptions');
		revalidatePath('/admin/members');

		return {
			success: true,
			message: 'Subscription created successfully',
			data: membership as MembershipWithRelations,
		};
	} catch (error) {
		console.error('Create subscription error:', error);
		return {
			success: false,
			message: 'Failed to create subscription',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// UPDATE ACTIONS
// ============================================

export async function updateSubscriptionStatus(
	id: string,
	status: MembershipStatus
): Promise<SubscriptionResult> {
	try {
		const membership = await prisma.membership.update({
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
				action: 'subscription.status_updated',
				entityType: 'Membership',
				entityId: id,
				metadata: { status },
			},
		});

		revalidatePath('/dashboard');
		revalidatePath('/dashboard/subscriptions');
		revalidatePath('/admin/members');

		return {
			success: true,
			message: `Subscription ${status.toLowerCase()}`,
			data: membership as MembershipWithRelations,
		};
	} catch (error) {
		console.error('Update subscription status error:', error);
		return {
			success: false,
			message: 'Failed to update subscription status',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function activateSubscription(
	id: string
): Promise<SubscriptionResult> {
	return updateSubscriptionStatus(id, 'ACTIVE');
}

/**
 * Update team settings for a subscription (admin only)
 * When enabling team membership (maxMembers > 1), auto-creates the primary member
 */
export async function updateTeamSettings(
	id: string,
	data: { maxMembers?: number; companyName?: string | null }
): Promise<SubscriptionResult> {
	try {
		// First, get current membership state
		const currentMembership = await prisma.membership.findUnique({
			where: { id },
			include: {
				user: {
					select: { id: true, name: true, email: true, phone: true },
				},
				_count: {
					select: { teamMembers: true },
				},
			},
		});

		if (!currentMembership) {
			return {
				success: false,
				message: 'Subscription not found',
			};
		}

		const membership = await prisma.membership.update({
			where: { id },
			data: {
				...(data.maxMembers !== undefined && {
					maxMembers: data.maxMembers,
				}),
				...(data.companyName !== undefined && {
					companyName: data.companyName,
				}),
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

		// If enabling team membership and no primary member exists, create one
		if (
			data.maxMembers &&
			data.maxMembers > 1 &&
			currentMembership._count.teamMembers === 0
		) {
			// Generate unique access code for the primary member
			let accessCode = `AMG-TM-${randomBytes(4)
				.toString('hex')
				.toUpperCase()}`;
			let attempts = 0;
			while (attempts < 5) {
				const existing = await prisma.membershipMember.findUnique({
					where: { accessCode },
				});
				if (!existing) break;
				accessCode = `AMG-TM-${randomBytes(4)
					.toString('hex')
					.toUpperCase()}`;
				attempts++;
			}

			// Create the primary member (subscription owner)
			await prisma.membershipMember.create({
				data: {
					membershipId: id,
					userId: currentMembership.userId,
					name: currentMembership.user.name || 'Subscription Owner',
					email: currentMembership.user.email,
					phone: currentMembership.user.phone,
					accessCode,
					isPrimary: true,
					isActive: true,
				},
			});
		}

		await prisma.activityLog.create({
			data: {
				action: 'subscription.team_settings_updated',
				entityType: 'Membership',
				entityId: id,
				metadata: data,
			},
		});

		revalidatePath('/dashboard');
		revalidatePath('/dashboard/subscriptions');
		revalidatePath('/admin/members');
		revalidatePath(`/admin/members/${membership.userId}`);

		return {
			success: true,
			message: 'Team settings updated successfully',
			data: membership as MembershipWithRelations,
		};
	} catch (error) {
		console.error('Update team settings error:', error);
		return {
			success: false,
			message: 'Failed to update team settings',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function pauseSubscription(
	id: string
): Promise<SubscriptionResult> {
	try {
		const membership = await prisma.membership.findUnique({
			where: { id },
		});

		if (!membership) {
			return {
				success: false,
				message: 'Subscription not found',
			};
		}

		if (membership.status !== 'ACTIVE') {
			return {
				success: false,
				message: 'Only active subscriptions can be paused',
			};
		}

		const result = await updateSubscriptionStatus(id, 'SUSPENDED');

		// Send pause notification email if successful
		if (result.success && result.data) {
			const membershipData = Array.isArray(result.data)
				? result.data[0]
				: result.data;
			if (membershipData) {
				const pauseEmail =
					createSubscriptionPausedEmail(membershipData);
				await sendEmail({
					to: membershipData.user.email,
					subject: pauseEmail.subject,
					html: pauseEmail.html,
				});
			}
		}

		return result;
	} catch (error) {
		console.error('Pause subscription error:', error);
		return {
			success: false,
			message: 'Failed to pause subscription',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function cancelSubscription(
	id: string
): Promise<SubscriptionResult> {
	try {
		const user = await getCurrentUser();
		const membership = await prisma.membership.findUnique({
			where: { id },
		});

		if (!membership) {
			return {
				success: false,
				message: 'Subscription not found',
			};
		}

		// Check if user owns this subscription or is admin
		if (user && membership.userId !== user.id && user.role === 'CLIENT') {
			return {
				success: false,
				message:
					"You don't have permission to cancel this subscription",
			};
		}

		if (
			membership.status === 'CANCELLED' ||
			membership.status === 'EXPIRED'
		) {
			return {
				success: false,
				message: 'Subscription is already cancelled or expired',
			};
		}

		const result = await updateSubscriptionStatus(id, 'CANCELLED');

		// Send cancellation email if successful
		if (result.success && result.data) {
			const membershipData = Array.isArray(result.data)
				? result.data[0]
				: result.data;
			if (membershipData) {
				const cancelEmail =
					createSubscriptionCancellationEmail(membershipData);
				await sendEmail({
					to: membershipData.user.email,
					subject: cancelEmail.subject,
					html: cancelEmail.html,
				});
			}
		}

		return result;
	} catch (error) {
		console.error('Cancel subscription error:', error);
		return {
			success: false,
			message: 'Failed to cancel subscription',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function renewSubscription(
	id: string
): Promise<SubscriptionResult> {
	try {
		const membership = await prisma.membership.findUnique({
			where: { id },
			include: {
				pricingPlan: true,
			},
		});

		if (!membership) {
			return {
				success: false,
				message: 'Subscription not found',
			};
		}

		// Calculate new end date from current end date
		const newEndDate = calculateEndDate(
			membership.endDate,
			membership.type
		);

		const updatedMembership = await prisma.membership.update({
			where: { id },
			data: {
				endDate: newEndDate,
				status: 'ACTIVE',
				renewedAt: new Date(),
				paymentStatus: 'PENDING', // Will be updated after payment
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
				userId: membership.userId,
				action: 'subscription.renewed',
				entityType: 'Membership',
				entityId: id,
				metadata: {
					previousEndDate: membership.endDate,
					newEndDate,
				},
			},
		});

		// Send renewal confirmation email
		const renewalEmail = createSubscriptionRenewalEmail(
			updatedMembership as MembershipWithRelations
		);
		await sendEmail({
			to: updatedMembership.user.email,
			subject: renewalEmail.subject,
			html: renewalEmail.html,
		});

		revalidatePath('/dashboard');
		revalidatePath('/dashboard/subscriptions');
		revalidatePath('/admin/members');

		return {
			success: true,
			message: 'Subscription renewed successfully',
			data: updatedMembership as MembershipWithRelations,
		};
	} catch (error) {
		console.error('Renew subscription error:', error);
		return {
			success: false,
			message: 'Failed to renew subscription',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function toggleAutoRenew(id: string): Promise<SubscriptionResult> {
	try {
		const membership = await prisma.membership.findUnique({
			where: { id },
		});

		if (!membership) {
			return {
				success: false,
				message: 'Subscription not found',
			};
		}

		const updatedMembership = await prisma.membership.update({
			where: { id },
			data: { autoRenew: !membership.autoRenew },
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

		revalidatePath('/dashboard/subscriptions');

		return {
			success: true,
			message: `Auto-renew ${
				updatedMembership.autoRenew ? 'enabled' : 'disabled'
			}`,
			data: updatedMembership as MembershipWithRelations,
		};
	} catch (error) {
		console.error('Toggle auto-renew error:', error);
		return {
			success: false,
			message: 'Failed to update auto-renew setting',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// ADMIN ACTIONS
// ============================================

export async function assignDesk(
	id: string,
	deskNumber: string
): Promise<SubscriptionResult> {
	try {
		const membership = await prisma.membership.update({
			where: { id },
			data: { assignedDesk: deskNumber },
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
				action: 'subscription.desk_assigned',
				entityType: 'Membership',
				entityId: id,
				metadata: { deskNumber },
			},
		});

		revalidatePath('/admin/members');

		return {
			success: true,
			message: `Desk ${deskNumber} assigned successfully`,
			data: membership as MembershipWithRelations,
		};
	} catch (error) {
		console.error('Assign desk error:', error);
		return {
			success: false,
			message: 'Failed to assign desk',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// EXPIRATION CHECK (for scheduled job)
// ============================================

export async function checkAndExpireSubscriptions(): Promise<{
	success: boolean;
	expiredCount: number;
}> {
	try {
		const result = await prisma.membership.updateMany({
			where: {
				status: 'ACTIVE',
				endDate: { lt: new Date() },
				autoRenew: false,
			},
			data: {
				status: 'EXPIRED',
			},
		});

		return {
			success: true,
			expiredCount: result.count,
		};
	} catch (error) {
		console.error('Check and expire subscriptions error:', error);
		return {
			success: false,
			expiredCount: 0,
		};
	}
}

// ============================================
// CHECK-IN ACTIONS
// ============================================

export async function checkInMembership(membershipId: string): Promise<{
	success: boolean;
	message: string;
	checkInId?: string;
}> {
	try {
		const membership = await prisma.membership.findUnique({
			where: { id: membershipId },
			include: {
				checkIns: {
					where: {
						checkOutTime: null,
					},
					take: 1,
				},
			},
		});

		if (!membership) {
			return { success: false, message: 'Membership not found' };
		}

		if (membership.status !== 'ACTIVE') {
			return { success: false, message: 'Membership is not active' };
		}

		// Check if already checked in
		if (membership.checkIns.length > 0) {
			return {
				success: false,
				message: 'Already checked in. Please check out first.',
			};
		}

		// For fixed-day subscriptions, check if days remaining
		if (membership.daysAllowed !== null) {
			const startOfPeriod = membership.startDate;
			const usedDays = await prisma.membershipCheckIn.count({
				where: {
					membershipId,
					checkInTime: { gte: startOfPeriod },
				},
			});

			if (usedDays >= membership.daysAllowed) {
				return {
					success: false,
					message: `You have used all ${membership.daysAllowed} days for this billing period`,
				};
			}
		}

		const checkIn = await prisma.membershipCheckIn.create({
			data: {
				membershipId,
				checkInTime: new Date(),
			},
		});

		await prisma.activityLog.create({
			data: {
				userId: membership.userId,
				action: 'membership.checkin',
				entityType: 'MembershipCheckIn',
				entityId: checkIn.id,
				metadata: { membershipId },
			},
		});

		revalidatePath('/dashboard');
		revalidatePath('/dashboard/subscriptions');
		revalidatePath('/admin/scanner');

		return {
			success: true,
			message: 'Checked in successfully',
			checkInId: checkIn.id,
		};
	} catch (error) {
		console.error('Check-in membership error:', error);
		return {
			success: false,
			message: 'Failed to check in',
		};
	}
}

export async function checkOutMembership(membershipId: string): Promise<{
	success: boolean;
	message: string;
}> {
	try {
		// Find the active check-in
		const activeCheckIn = await prisma.membershipCheckIn.findFirst({
			where: {
				membershipId,
				checkOutTime: null,
			},
			orderBy: { checkInTime: 'desc' },
		});

		if (!activeCheckIn) {
			return { success: false, message: 'No active check-in found' };
		}

		await prisma.membershipCheckIn.update({
			where: { id: activeCheckIn.id },
			data: { checkOutTime: new Date() },
		});

		await prisma.activityLog.create({
			data: {
				action: 'membership.checkout',
				entityType: 'MembershipCheckIn',
				entityId: activeCheckIn.id,
				metadata: { membershipId },
			},
		});

		revalidatePath('/dashboard');
		revalidatePath('/dashboard/subscriptions');
		revalidatePath('/admin/scanner');

		return {
			success: true,
			message: 'Checked out successfully',
		};
	} catch (error) {
		console.error('Check-out membership error:', error);
		return {
			success: false,
			message: 'Failed to check out',
		};
	}
}

export async function getMembershipAttendance(
	membershipId: string,
	options?: {
		startDate?: Date;
		endDate?: Date;
	}
): Promise<{
	success: boolean;
	data?: {
		totalVisits: number;
		thisMonthVisits: number;
		daysAllowed: number | null;
		daysRemaining: number | null;
		checkIns: Array<{
			id: string;
			checkInTime: Date;
			checkOutTime: Date | null;
		}>;
	};
	message?: string;
}> {
	try {
		const membership = await prisma.membership.findUnique({
			where: { id: membershipId },
		});

		if (!membership) {
			return { success: false, message: 'Membership not found' };
		}

		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const startOfPeriod = options?.startDate || membership.startDate;
		const endOfPeriod = options?.endDate || membership.endDate;

		// Get all check-ins for this membership period
		const allCheckIns = await prisma.membershipCheckIn.findMany({
			where: {
				membershipId,
				checkInTime: {
					gte: startOfPeriod,
					lte: endOfPeriod,
				},
			},
			orderBy: { checkInTime: 'desc' },
			select: {
				id: true,
				checkInTime: true,
				checkOutTime: true,
			},
		});

		// Get this month's check-ins
		const thisMonthCheckIns = await prisma.membershipCheckIn.count({
			where: {
				membershipId,
				checkInTime: { gte: startOfMonth },
			},
		});

		// Calculate days remaining for fixed-day plans
		let daysRemaining: number | null = null;
		if (membership.daysAllowed !== null) {
			const usedDays = await prisma.membershipCheckIn.count({
				where: {
					membershipId,
					checkInTime: { gte: membership.startDate },
				},
			});
			daysRemaining = Math.max(0, membership.daysAllowed - usedDays);
		}

		return {
			success: true,
			data: {
				totalVisits: allCheckIns.length,
				thisMonthVisits: thisMonthCheckIns,
				daysAllowed: membership.daysAllowed,
				daysRemaining,
				checkIns: allCheckIns,
			},
		};
	} catch (error) {
		console.error('Get membership attendance error:', error);
		return {
			success: false,
			message: 'Failed to get attendance data',
		};
	}
}

// ============================================
// ADMIN CHECK-IN/CHECK-OUT ACTIONS
// ============================================

export interface AdminCheckInResult {
	success: boolean;
	message: string;
	data?: {
		membership: MembershipWithRelations;
		checkInId?: string;
		action: 'checked_in' | 'checked_out';
		attendance: {
			totalVisits: number;
			thisMonthVisits: number;
			daysAllowed: number | null;
			daysRemaining: number | null;
		};
		// Team member info if applicable
		teamMember?: {
			id: string;
			name: string;
			isPrimary: boolean;
		};
		occupancy?: {
			current: number;
			max: number;
		};
	};
}

/**
 * Admin action to check in a member by membership number, access code, or team member access code
 * Handles both individual memberships and team memberships
 * No location constraints - just requires admin to be authenticated
 */
export async function adminCheckInByCode(
	code: string
): Promise<AdminCheckInResult> {
	try {
		const normalizedCode = code.toUpperCase().trim();

		// First, check if this is a team member access code (AMG-TM-XXXXXXXX)
		if (normalizedCode.startsWith('AMG-TM-')) {
			return await handleTeamMemberCheckIn(normalizedCode);
		}

		// Try to find membership by membershipNumber or accessCode
		const membership = await prisma.membership.findFirst({
			where: {
				OR: [
					{ membershipNumber: normalizedCode },
					{ accessCode: normalizedCode },
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
				checkIns: {
					where: { checkOutTime: null },
					take: 1,
				},
				teamMembers: {
					where: { isActive: true },
					select: { id: true, name: true, isPrimary: true },
				},
			},
		});

		if (!membership) {
			// Could also be a team member access code without the AMG-TM- prefix
			const teamMember = await prisma.membershipMember.findFirst({
				where: { accessCode: normalizedCode },
			});
			if (teamMember) {
				return await handleTeamMemberCheckIn(normalizedCode);
			}

			return {
				success: false,
				message: 'Membership not found. Please check the code.',
			};
		}

		if (membership.status !== 'ACTIVE') {
			return {
				success: false,
				message: `Membership is ${membership.status.toLowerCase()}. Cannot check in.`,
			};
		}

		// Check if membership has expired
		if (new Date(membership.endDate) < new Date()) {
			return {
				success: false,
				message: 'Membership has expired.',
			};
		}

		// For team memberships with maxMembers > 1, require team member-specific check-ins
		if (membership.maxMembers > 1 && membership.teamMembers.length > 0) {
			return {
				success: false,
				message: `This is a team membership with ${membership.teamMembers.length} members. Each member must scan their own QR code to check in.`,
			};
		}

		// Calculate attendance data
		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

		const thisMonthVisits = await prisma.membershipCheckIn.count({
			where: {
				membershipId: membership.id,
				checkInTime: { gte: startOfMonth },
			},
		});

		const totalVisits = await prisma.membershipCheckIn.count({
			where: { membershipId: membership.id },
		});

		let daysRemaining: number | null = null;
		if (membership.daysAllowed !== null) {
			const usedDays = await prisma.membershipCheckIn.count({
				where: {
					membershipId: membership.id,
					checkInTime: { gte: membership.startDate },
				},
			});
			daysRemaining = Math.max(0, membership.daysAllowed - usedDays);
		}

		// Check if already checked in
		if (membership.checkIns.length > 0) {
			// User is checked in, perform check-out
			const activeCheckIn = membership.checkIns[0];

			await prisma.membershipCheckIn.update({
				where: { id: activeCheckIn.id },
				data: { checkOutTime: new Date() },
			});

			await prisma.activityLog.create({
				data: {
					userId: membership.userId,
					action: 'membership.admin_checkout',
					entityType: 'MembershipCheckIn',
					entityId: activeCheckIn.id,
					metadata: {
						membershipId: membership.id,
						adminAction: true,
					},
				},
			});

			revalidatePath('/dashboard');
			revalidatePath('/dashboard/subscriptions');
			revalidatePath('/admin/scanner');
			revalidatePath('/admin/members');

			return {
				success: true,
				message: `${membership.user.name} has been checked out successfully.`,
				data: {
					membership: membership as MembershipWithRelations,
					action: 'checked_out',
					attendance: {
						totalVisits,
						thisMonthVisits,
						daysAllowed: membership.daysAllowed,
						daysRemaining,
					},
				},
			};
		}

		// Not checked in, perform check-in
		// For fixed-day subscriptions, check if days remaining
		if (
			membership.daysAllowed !== null &&
			daysRemaining !== null &&
			daysRemaining <= 0
		) {
			return {
				success: false,
				message: `Member has used all ${membership.daysAllowed} days for this billing period.`,
			};
		}

		const checkIn = await prisma.membershipCheckIn.create({
			data: {
				membershipId: membership.id,
				checkInTime: new Date(),
			},
		});

		await prisma.activityLog.create({
			data: {
				userId: membership.userId,
				action: 'membership.admin_checkin',
				entityType: 'MembershipCheckIn',
				entityId: checkIn.id,
				metadata: { membershipId: membership.id, adminAction: true },
			},
		});

		revalidatePath('/dashboard');
		revalidatePath('/dashboard/subscriptions');
		revalidatePath('/admin/scanner');
		revalidatePath('/admin/members');

		return {
			success: true,
			message: `${membership.user.name} has been checked in successfully.`,
			data: {
				membership: membership as MembershipWithRelations,
				checkInId: checkIn.id,
				action: 'checked_in',
				attendance: {
					totalVisits: totalVisits + 1,
					thisMonthVisits: thisMonthVisits + 1,
					daysAllowed: membership.daysAllowed,
					daysRemaining:
						daysRemaining !== null ? daysRemaining - 1 : null,
				},
			},
		};
	} catch (error) {
		console.error('Admin check-in error:', error);
		return {
			success: false,
			message: 'Failed to process check-in. Please try again.',
		};
	}
}

/**
 * Get membership details by code for admin view
 */
export async function getMembershipByCode(code: string): Promise<{
	success: boolean;
	message: string;
	data?: {
		membership: MembershipWithRelations;
		isCheckedIn: boolean;
		attendance: {
			totalVisits: number;
			thisMonthVisits: number;
			daysAllowed: number | null;
			daysRemaining: number | null;
			recentCheckIns: Array<{
				id: string;
				checkInTime: Date;
				checkOutTime: Date | null;
			}>;
		};
	};
}> {
	try {
		const membership = await prisma.membership.findFirst({
			where: {
				OR: [
					{ membershipNumber: code.toUpperCase() },
					{ accessCode: code.toUpperCase() },
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
				checkIns: {
					orderBy: { checkInTime: 'desc' },
					take: 10, // Last 10 check-ins
				},
			},
		});

		if (!membership) {
			return {
				success: false,
				message: 'Membership not found',
			};
		}

		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

		const thisMonthVisits = await prisma.membershipCheckIn.count({
			where: {
				membershipId: membership.id,
				checkInTime: { gte: startOfMonth },
			},
		});

		const totalVisits = await prisma.membershipCheckIn.count({
			where: { membershipId: membership.id },
		});

		let daysRemaining: number | null = null;
		if (membership.daysAllowed !== null) {
			const usedDays = await prisma.membershipCheckIn.count({
				where: {
					membershipId: membership.id,
					checkInTime: { gte: membership.startDate },
				},
			});
			daysRemaining = Math.max(0, membership.daysAllowed - usedDays);
		}

		const isCheckedIn = membership.checkIns.some((ci) => !ci.checkOutTime);

		return {
			success: true,
			message: 'Membership found',
			data: {
				membership: membership as MembershipWithRelations,
				isCheckedIn,
				attendance: {
					totalVisits,
					thisMonthVisits,
					daysAllowed: membership.daysAllowed,
					daysRemaining,
					recentCheckIns: membership.checkIns.map((ci) => ({
						id: ci.id,
						checkInTime: ci.checkInTime,
						checkOutTime: ci.checkOutTime,
					})),
				},
			},
		};
	} catch (error) {
		console.error('Get membership by code error:', error);
		return {
			success: false,
			message: 'Failed to fetch membership',
		};
	}
}

// ============================================
// TEAM MEMBER CHECK-IN HANDLER
// ============================================

/**
 * Handle check-in/check-out for team members using their personal access code
 * This ensures occupancy tracking is correct for team memberships
 */
async function handleTeamMemberCheckIn(
	accessCode: string
): Promise<AdminCheckInResult> {
	try {
		// Find team member by access code
		const teamMember = await prisma.membershipMember.findUnique({
			where: { accessCode },
			include: {
				membership: {
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
							select: {
								id: true,
								name: true,
								slug: true,
								images: true,
							},
						},
						pricingPlan: {
							select: {
								id: true,
								name: true,
								price: true,
								unit: true,
							},
						},
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
		});

		if (!teamMember) {
			return {
				success: false,
				message: 'Team member not found. Please check the access code.',
			};
		}

		if (!teamMember.isActive) {
			return {
				success: false,
				message: `${teamMember.name} has been deactivated. Please contact support.`,
			};
		}

		const membership = teamMember.membership;

		if (membership.status !== 'ACTIVE') {
			return {
				success: false,
				message: `Membership is ${membership.status.toLowerCase()}. Cannot check in.`,
			};
		}

		if (new Date(membership.endDate) < new Date()) {
			return {
				success: false,
				message: 'Membership has expired.',
			};
		}

		// Check for active check-in for this specific team member
		const activeCheckIn = await prisma.membershipCheckIn.findFirst({
			where: {
				membershipId: membership.id,
				memberId: teamMember.id,
				checkOutTime: null,
			},
		});

		// Calculate attendance
		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

		const thisMonthVisits = await prisma.membershipCheckIn.count({
			where: {
				membershipId: membership.id,
				memberId: teamMember.id,
				checkInTime: { gte: startOfMonth },
			},
		});

		const totalVisits = await prisma.membershipCheckIn.count({
			where: {
				membershipId: membership.id,
				memberId: teamMember.id,
			},
		});

		let daysRemaining: number | null = null;
		if (membership.daysAllowed !== null) {
			const usedDays = await prisma.membershipCheckIn.count({
				where: {
					membershipId: membership.id,
					memberId: teamMember.id,
					checkInTime: { gte: membership.startDate },
				},
			});
			daysRemaining = Math.max(0, membership.daysAllowed - usedDays);
		}

		if (activeCheckIn) {
			// Check out this team member
			const result = await prisma.$transaction(async (tx) => {
				await tx.membershipCheckIn.update({
					where: { id: activeCheckIn.id },
					data: { checkOutTime: new Date() },
				});

				const updatedMembership = await tx.membership.update({
					where: { id: membership.id },
					data: {
						currentOccupancy: {
							decrement: 1,
						},
					},
				});

				return updatedMembership;
			});

			await prisma.activityLog.create({
				data: {
					userId: teamMember.userId || membership.userId,
					action: 'membership.team_member_checkout',
					entityType: 'MembershipCheckIn',
					entityId: activeCheckIn.id,
					metadata: {
						membershipId: membership.id,
						teamMemberId: teamMember.id,
						teamMemberName: teamMember.name,
						adminAction: true,
					},
				},
			});

			revalidatePath('/dashboard');
			revalidatePath('/dashboard/subscriptions');
			revalidatePath('/admin/scanner');
			revalidatePath('/admin/members');

			return {
				success: true,
				message: `${teamMember.name} has been checked out successfully.`,
				data: {
					membership: membership as MembershipWithRelations,
					action: 'checked_out',
					attendance: {
						totalVisits,
						thisMonthVisits,
						daysAllowed: membership.daysAllowed,
						daysRemaining,
					},
					teamMember: {
						id: teamMember.id,
						name: teamMember.name,
						isPrimary: teamMember.isPrimary,
					},
					occupancy: {
						current: Math.max(0, result.currentOccupancy),
						max: result.maxMembers,
					},
				},
			};
		}

		// Check in this team member
		// First, verify occupancy limit
		if (membership.currentOccupancy >= membership.maxMembers) {
			return {
				success: false,
				message: `Maximum occupancy (${membership.maxMembers}) reached. Someone must check out first.`,
			};
		}

		// For fixed-day subscriptions, check if days remaining
		if (
			membership.daysAllowed !== null &&
			daysRemaining !== null &&
			daysRemaining <= 0
		) {
			return {
				success: false,
				message: `${teamMember.name} has used all ${membership.daysAllowed} days for this billing period.`,
			};
		}

		const result = await prisma.$transaction(async (tx) => {
			const checkIn = await tx.membershipCheckIn.create({
				data: {
					membershipId: membership.id,
					memberId: teamMember.id,
					checkInTime: new Date(),
				},
			});

			const updatedMembership = await tx.membership.update({
				where: { id: membership.id },
				data: {
					currentOccupancy: {
						increment: 1,
					},
				},
			});

			return { checkIn, membership: updatedMembership };
		});

		await prisma.activityLog.create({
			data: {
				userId: teamMember.userId || membership.userId,
				action: 'membership.team_member_checkin',
				entityType: 'MembershipCheckIn',
				entityId: result.checkIn.id,
				metadata: {
					membershipId: membership.id,
					teamMemberId: teamMember.id,
					teamMemberName: teamMember.name,
					adminAction: true,
				},
			},
		});

		revalidatePath('/dashboard');
		revalidatePath('/dashboard/subscriptions');
		revalidatePath('/admin/scanner');
		revalidatePath('/admin/members');

		return {
			success: true,
			message: `${teamMember.name} has been checked in successfully. (${result.membership.currentOccupancy}/${result.membership.maxMembers} present)`,
			data: {
				membership: membership as MembershipWithRelations,
				checkInId: result.checkIn.id,
				action: 'checked_in',
				attendance: {
					totalVisits: totalVisits + 1,
					thisMonthVisits: thisMonthVisits + 1,
					daysAllowed: membership.daysAllowed,
					daysRemaining:
						daysRemaining !== null ? daysRemaining - 1 : null,
				},
				teamMember: {
					id: teamMember.id,
					name: teamMember.name,
					isPrimary: teamMember.isPrimary,
				},
				occupancy: {
					current: result.membership.currentOccupancy,
					max: result.membership.maxMembers,
				},
			},
		};
	} catch (error) {
		console.error('Team member check-in error:', error);
		return {
			success: false,
			message:
				'Failed to process team member check-in. Please try again.',
		};
	}
}

// ============================================
// TEAM MEMBER INVITATIONS
// ============================================

export interface TeamMemberInvitationResult {
	success: boolean;
	message: string;
	data?: {
		memberId: string;
		email: string;
		invitationToken?: string;
	};
	error?: string;
}

/**
 * Send invitation email to a team member so they can create/link a user account
 */
export async function sendTeamMemberInvitation(
	memberId: string
): Promise<TeamMemberInvitationResult> {
	try {
		const admin = await getCurrentAdmin();
		const user = !admin ? await getCurrentUser() : null;

		if (!admin && !user) {
			return {
				success: false,
				message: 'Authentication required',
			};
		}

		const member = await prisma.membershipMember.findUnique({
			where: { id: memberId },
			include: {
				membership: {
					include: {
						user: {
							select: { id: true, name: true, email: true },
						},
						space: {
							select: { id: true, name: true },
						},
					},
				},
			},
		});

		if (!member) {
			return {
				success: false,
				message: 'Team member not found',
			};
		}

		// Check permission - user must own the membership or be admin
		if (user && member.membership.userId !== user.id) {
			return {
				success: false,
				message:
					'You do not have permission to invite this team member',
			};
		}

		if (!member.email) {
			return {
				success: false,
				message: 'Team member does not have an email address',
			};
		}

		if (member.userId) {
			return {
				success: false,
				message: 'This team member is already linked to a user account',
			};
		}

		// Generate invitation token
		const invitationToken = randomBytes(32).toString('hex');
		const invitationExpires = new Date();
		invitationExpires.setDate(invitationExpires.getDate() + 7); // 7 days expiry

		// Update member with invitation token
		await prisma.membershipMember.update({
			where: { id: memberId },
			data: {
				invitationToken,
				invitationSentAt: new Date(),
				invitationExpires,
			},
		});

		// Import and send invitation email
		const { createTeamMemberInvitationEmail } = await import(
			'@/lib/email-templates'
		);

		const inviteEmail = createTeamMemberInvitationEmail({
			memberName: member.name,
			memberEmail: member.email,
			ownerName: member.membership.user.name,
			spaceName: member.membership.space.name,
			companyName: member.membership.companyName || undefined,
			invitationToken,
			accessCode: member.accessCode,
		});

		const sent = await sendEmail({
			to: member.email,
			subject: inviteEmail.subject,
			html: inviteEmail.html,
		});

		if (!sent) {
			return {
				success: false,
				message: 'Failed to send invitation email',
			};
		}

		await prisma.activityLog.create({
			data: {
				userId: admin?.id || user?.id,
				action: 'team_member.invitation_sent',
				entityType: 'MembershipMember',
				entityId: memberId,
				metadata: {
					memberName: member.name,
					memberEmail: member.email,
				},
			},
		});

		revalidatePath('/dashboard/subscriptions');
		revalidatePath('/admin/members');

		return {
			success: true,
			message: `Invitation email sent to ${member.email}`,
			data: {
				memberId,
				email: member.email,
			},
		};
	} catch (error) {
		console.error('Send team member invitation error:', error);
		return {
			success: false,
			message: 'Failed to send invitation',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

/**
 * Accept team member invitation and link to user account
 */
export async function acceptTeamMemberInvitation(
	invitationToken: string,
	userData?: { name?: string; password?: string }
): Promise<TeamMemberInvitationResult> {
	try {
		const member = await prisma.membershipMember.findFirst({
			where: { invitationToken },
			include: {
				membership: {
					include: {
						user: { select: { id: true, name: true } },
						space: { select: { id: true, name: true } },
					},
				},
			},
		});

		if (!member) {
			return {
				success: false,
				message: 'Invalid or expired invitation token',
			};
		}

		if (member.invitationExpires && member.invitationExpires < new Date()) {
			return {
				success: false,
				message:
					'This invitation has expired. Please request a new one.',
			};
		}

		if (member.userId) {
			return {
				success: false,
				message: 'This invitation has already been accepted',
			};
		}

		const currentUser = await getCurrentUser();

		// If user is logged in, link to their account
		if (currentUser) {
			// Check if email matches
			if (member.email && currentUser.email !== member.email) {
				return {
					success: false,
					message: `This invitation was sent to ${member.email}. Please log in with that email or contact the team owner.`,
				};
			}

			await prisma.membershipMember.update({
				where: { id: member.id },
				data: {
					userId: currentUser.id,
					invitationToken: null,
					invitationExpires: null,
				},
			});

			await prisma.activityLog.create({
				data: {
					userId: currentUser.id,
					action: 'team_member.invitation_accepted',
					entityType: 'MembershipMember',
					entityId: member.id,
					metadata: {
						membershipId: member.membershipId,
						linkedToExistingUser: true,
					},
				},
			});

			revalidatePath('/dashboard');
			revalidatePath('/dashboard/subscriptions');

			return {
				success: true,
				message: `You've been added to ${
					member.membership.companyName ||
					member.membership.space.name
				} team!`,
				data: {
					memberId: member.id,
					email: member.email || currentUser.email,
				},
			};
		}

		// If no user logged in and they provided registration data
		if (userData?.password && member.email) {
			const bcrypt = await import('bcryptjs');
			const hashedPassword = await bcrypt.hash(userData.password, 12);

			// Create new user account
			const newUser = await prisma.user.create({
				data: {
					name: userData.name || member.name,
					email: member.email,
					password: hashedPassword,
					emailVerified: new Date(), // Auto-verify since they got the invitation
				},
			});

			await prisma.membershipMember.update({
				where: { id: member.id },
				data: {
					userId: newUser.id,
					name: userData.name || member.name,
					invitationToken: null,
					invitationExpires: null,
				},
			});

			await prisma.activityLog.create({
				data: {
					userId: newUser.id,
					action: 'team_member.invitation_accepted',
					entityType: 'MembershipMember',
					entityId: member.id,
					metadata: {
						membershipId: member.membershipId,
						createdNewAccount: true,
					},
				},
			});

			return {
				success: true,
				message: `Account created and you've been added to ${
					member.membership.companyName ||
					member.membership.space.name
				} team!`,
				data: {
					memberId: member.id,
					email: member.email,
				},
			};
		}

		// Return info for registration page
		return {
			success: true,
			message: 'Invitation valid. Please create an account or log in.',
			data: {
				memberId: member.id,
				email: member.email || '',
				invitationToken,
			},
		};
	} catch (error) {
		console.error('Accept team member invitation error:', error);
		return {
			success: false,
			message: 'Failed to accept invitation',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

/**
 * Send QR code to team member via email
 */
export async function sendTeamMemberQRCode(
	memberId: string
): Promise<TeamMemberInvitationResult> {
	try {
		const admin = await getCurrentAdmin();
		const user = !admin ? await getCurrentUser() : null;

		if (!admin && !user) {
			return {
				success: false,
				message: 'Authentication required',
			};
		}

		const member = await prisma.membershipMember.findUnique({
			where: { id: memberId },
			include: {
				membership: {
					include: {
						user: {
							select: { id: true, name: true, email: true },
						},
						space: {
							select: { id: true, name: true, images: true },
						},
					},
				},
			},
		});

		if (!member) {
			return {
				success: false,
				message: 'Team member not found',
			};
		}

		// Check permission
		if (user && member.membership.userId !== user.id) {
			return {
				success: false,
				message:
					'You do not have permission to send QR code to this team member',
			};
		}

		if (!member.email) {
			return {
				success: false,
				message: 'Team member does not have an email address',
			};
		}

		if (!member.isActive) {
			return {
				success: false,
				message: 'Cannot send QR code to inactive team member',
			};
		}

		// Generate QR code
		const QRCode = await import('qrcode');
		const qrCodeDataUrl = await QRCode.toDataURL(member.accessCode, {
			width: 300,
			margin: 2,
			color: {
				dark: '#000000',
				light: '#FFFFFF',
			},
		});

		// Import and send QR code email
		const { createTeamMemberQRCodeEmail } = await import(
			'@/lib/email-templates'
		);

		const qrEmail = createTeamMemberQRCodeEmail({
			memberName: member.name,
			memberEmail: member.email,
			spaceName: member.membership.space.name,
			companyName: member.membership.companyName || undefined,
			accessCode: member.accessCode,
			qrCodeDataUrl,
		});

		const sent = await sendEmail({
			to: member.email,
			subject: qrEmail.subject,
			html: qrEmail.html,
		});

		if (!sent) {
			return {
				success: false,
				message: 'Failed to send QR code email',
			};
		}

		// Update qrCodeSentAt
		await prisma.membershipMember.update({
			where: { id: memberId },
			data: { qrCodeSentAt: new Date() },
		});

		await prisma.activityLog.create({
			data: {
				userId: admin?.id || user?.id,
				action: 'team_member.qr_code_sent',
				entityType: 'MembershipMember',
				entityId: memberId,
				metadata: {
					memberName: member.name,
					memberEmail: member.email,
				},
			},
		});

		revalidatePath('/dashboard/subscriptions');
		revalidatePath('/admin/members');

		return {
			success: true,
			message: `QR code sent to ${member.email}`,
			data: {
				memberId,
				email: member.email,
			},
		};
	} catch (error) {
		console.error('Send team member QR code error:', error);
		return {
			success: false,
			message: 'Failed to send QR code',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

/**
 * Get team member by access code (for portal)
 */
export async function getTeamMemberByAccessCode(accessCode: string): Promise<{
	success: boolean;
	message: string;
	data?: {
		member: {
			id: string;
			name: string;
			email: string | null;
			phone: string | null;
			accessCode: string;
			isPrimary: boolean;
			isActive: boolean;
		};
		membership: {
			id: string;
			membershipNumber: string;
			companyName: string | null;
			status: string;
			space: {
				id: string;
				name: string;
				images: string[];
			};
		};
		checkIns: Array<{
			id: string;
			checkInTime: Date;
			checkOutTime: Date | null;
		}>;
	};
	error?: string;
}> {
	try {
		const normalizedCode = accessCode.toUpperCase().trim();

		const member = await prisma.membershipMember.findUnique({
			where: { accessCode: normalizedCode },
			include: {
				membership: {
					include: {
						space: {
							select: { id: true, name: true, images: true },
						},
					},
				},
				checkIns: {
					orderBy: { checkInTime: 'desc' },
					take: 20,
					select: {
						id: true,
						checkInTime: true,
						checkOutTime: true,
					},
				},
			},
		});

		if (!member) {
			return {
				success: false,
				message: 'Invalid access code',
			};
		}

		return {
			success: true,
			message: 'Team member found',
			data: {
				member: {
					id: member.id,
					name: member.name,
					email: member.email,
					phone: member.phone,
					accessCode: member.accessCode,
					isPrimary: member.isPrimary,
					isActive: member.isActive,
				},
				membership: {
					id: member.membership.id,
					membershipNumber: member.membership.membershipNumber,
					companyName: member.membership.companyName,
					status: member.membership.status,
					space: member.membership.space,
				},
				checkIns: member.checkIns,
			},
		};
	} catch (error) {
		console.error('Get team member by access code error:', error);
		return {
			success: false,
			message: 'Failed to lookup team member',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

/**
 * Verify invitation token validity
 */
export async function verifyInvitationToken(token: string): Promise<{
	success: boolean;
	message: string;
	data?: {
		memberName: string;
		memberEmail: string | null;
		spaceName: string;
		companyName: string | null;
		ownerName: string;
		isExpired: boolean;
	};
}> {
	try {
		const member = await prisma.membershipMember.findFirst({
			where: { invitationToken: token },
			include: {
				membership: {
					include: {
						user: { select: { name: true } },
						space: { select: { name: true } },
					},
				},
			},
		});

		if (!member) {
			return {
				success: false,
				message: 'Invalid invitation token',
			};
		}

		const isExpired =
			member.invitationExpires !== null &&
			member.invitationExpires < new Date();

		if (member.userId) {
			return {
				success: false,
				message: 'This invitation has already been accepted',
			};
		}

		return {
			success: true,
			message: isExpired ? 'Invitation has expired' : 'Valid invitation',
			data: {
				memberName: member.name,
				memberEmail: member.email,
				spaceName: member.membership.space.name,
				companyName: member.membership.companyName,
				ownerName: member.membership.user.name,
				isExpired,
			},
		};
	} catch (error) {
		console.error('Verify invitation token error:', error);
		return {
			success: false,
			message: 'Failed to verify invitation token',
		};
	}
}
