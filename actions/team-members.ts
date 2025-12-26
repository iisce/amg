'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getCurrentUser, getCurrentAdmin } from './auth';
import { nanoid } from 'nanoid';

// ============================================
// TYPES
// ============================================

export interface TeamMember {
	id: string;
	membershipId: string;
	userId: string | null;
	name: string;
	email: string | null;
	phone: string | null;
	accessCode: string;
	isActive: boolean;
	isPrimary: boolean;
	createdAt: Date;
	user?: {
		id: string;
		name: string;
		email: string;
		avatar: string | null;
	} | null;
}

export interface TeamMemberResult<T = unknown> {
	success: boolean;
	message: string;
	data?: T;
	error?: string;
}

// ============================================
// HELPER: Generate unique access code
// ============================================

function generateAccessCode(): string {
	return `AMG-TM-${nanoid(8).toUpperCase()}`;
}

// ============================================
// GET TEAM MEMBERS
// ============================================

export async function getTeamMembers(
	membershipId: string
): Promise<TeamMemberResult<TeamMember[]>> {
	try {
		const user = await getCurrentUser();
		const admin = await getCurrentAdmin();

		if (!user && !admin) {
			return {
				success: false,
				message: 'Authentication required',
			};
		}

		// Verify ownership or admin access
		const membership = await prisma.membership.findUnique({
			where: { id: membershipId },
			select: { userId: true },
		});

		if (!membership) {
			return {
				success: false,
				message: 'Membership not found',
			};
		}

		if (!admin && membership.userId !== user?.id) {
			return {
				success: false,
				message: 'Access denied',
			};
		}

		const members = await prisma.membershipMember.findMany({
			where: { membershipId },
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						avatar: true,
					},
				},
			},
			orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
		});

		return {
			success: true,
			message: 'Team members fetched successfully',
			data: members as TeamMember[],
		};
	} catch (error) {
		console.error('Get team members error:', error);
		return {
			success: false,
			message: 'Failed to fetch team members',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// ADD TEAM MEMBER
// ============================================

export async function addTeamMember(input: {
	membershipId: string;
	name: string;
	email?: string;
	phone?: string;
	userId?: string; // Link to existing user account
}): Promise<TeamMemberResult<TeamMember>> {
	try {
		const user = await getCurrentUser();
		const admin = await getCurrentAdmin();

		if (!user && !admin) {
			return {
				success: false,
				message: 'Authentication required',
			};
		}

		// Verify membership and check capacity
		const membership = await prisma.membership.findUnique({
			where: { id: input.membershipId },
			include: {
				_count: {
					select: { teamMembers: true },
				},
			},
		});

		if (!membership) {
			return {
				success: false,
				message: 'Membership not found',
			};
		}

		if (!admin && membership.userId !== user?.id) {
			return {
				success: false,
				message: 'Access denied',
			};
		}

		// Check if max members reached
		if (membership._count.teamMembers >= membership.maxMembers) {
			return {
				success: false,
				message: `Maximum team size (${membership.maxMembers}) reached. Purchase an addon to add more members.`,
			};
		}

		// Check for duplicate email in this membership
		if (input.email) {
			const existingMember = await prisma.membershipMember.findFirst({
				where: {
					membershipId: input.membershipId,
					email: input.email.toLowerCase(),
				},
			});

			if (existingMember) {
				return {
					success: false,
					message: 'A team member with this email already exists',
				};
			}
		}

		// Generate unique access code
		let accessCode = generateAccessCode();
		let attempts = 0;
		while (attempts < 5) {
			const existing = await prisma.membershipMember.findUnique({
				where: { accessCode },
			});
			if (!existing) break;
			accessCode = generateAccessCode();
			attempts++;
		}

		const member = await prisma.membershipMember.create({
			data: {
				membershipId: input.membershipId,
				userId: input.userId,
				name: input.name,
				email: input.email?.toLowerCase(),
				phone: input.phone,
				accessCode,
				isPrimary: false,
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						avatar: true,
					},
				},
			},
		});

		await prisma.activityLog.create({
			data: {
				userId: admin?.id || user?.id,
				action: 'team_member.added',
				entityType: 'MembershipMember',
				entityId: member.id,
				metadata: {
					membershipId: input.membershipId,
					memberName: input.name,
				},
			},
		});

		revalidatePath('/dashboard/subscriptions');
		revalidatePath('/admin/members');

		return {
			success: true,
			message: 'Team member added successfully',
			data: member as TeamMember,
		};
	} catch (error) {
		console.error('Add team member error:', error);
		return {
			success: false,
			message: 'Failed to add team member',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// UPDATE TEAM MEMBER
// ============================================

export async function updateTeamMember(
	memberId: string,
	input: {
		name?: string;
		email?: string;
		phone?: string;
		isActive?: boolean;
	}
): Promise<TeamMemberResult<TeamMember>> {
	try {
		const user = await getCurrentUser();
		const admin = await getCurrentAdmin();

		if (!user && !admin) {
			return {
				success: false,
				message: 'Authentication required',
			};
		}

		// Get member and verify ownership
		const existingMember = await prisma.membershipMember.findUnique({
			where: { id: memberId },
			include: {
				membership: {
					select: { userId: true },
				},
			},
		});

		if (!existingMember) {
			return {
				success: false,
				message: 'Team member not found',
			};
		}

		if (!admin && existingMember.membership.userId !== user?.id) {
			return {
				success: false,
				message: 'Access denied',
			};
		}

		// Check for duplicate email if updating email
		if (input.email && input.email !== existingMember.email) {
			const duplicate = await prisma.membershipMember.findFirst({
				where: {
					membershipId: existingMember.membershipId,
					email: input.email.toLowerCase(),
					id: { not: memberId },
				},
			});

			if (duplicate) {
				return {
					success: false,
					message: 'A team member with this email already exists',
				};
			}
		}

		const member = await prisma.membershipMember.update({
			where: { id: memberId },
			data: {
				...(input.name && { name: input.name }),
				...(input.email && { email: input.email.toLowerCase() }),
				...(input.phone !== undefined && { phone: input.phone }),
				...(typeof input.isActive === 'boolean' && {
					isActive: input.isActive,
				}),
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						avatar: true,
					},
				},
			},
		});

		await prisma.activityLog.create({
			data: {
				userId: admin?.id || user?.id,
				action: 'team_member.updated',
				entityType: 'MembershipMember',
				entityId: memberId,
				metadata: { updatedFields: Object.keys(input) },
			},
		});

		revalidatePath('/dashboard/subscriptions');
		revalidatePath('/admin/members');

		return {
			success: true,
			message: 'Team member updated successfully',
			data: member as TeamMember,
		};
	} catch (error) {
		console.error('Update team member error:', error);
		return {
			success: false,
			message: 'Failed to update team member',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// REMOVE TEAM MEMBER
// ============================================

export async function removeTeamMember(
	memberId: string
): Promise<TeamMemberResult> {
	try {
		const user = await getCurrentUser();
		const admin = await getCurrentAdmin();

		if (!user && !admin) {
			return {
				success: false,
				message: 'Authentication required',
			};
		}

		// Get member and verify ownership
		const member = await prisma.membershipMember.findUnique({
			where: { id: memberId },
			include: {
				membership: {
					select: { userId: true },
				},
			},
		});

		if (!member) {
			return {
				success: false,
				message: 'Team member not found',
			};
		}

		if (!admin && member.membership.userId !== user?.id) {
			return {
				success: false,
				message: 'Access denied',
			};
		}

		// Cannot remove primary member
		if (member.isPrimary) {
			return {
				success: false,
				message: 'Cannot remove the primary subscription holder',
			};
		}

		// Check if member is currently checked in
		const activeCheckIn = await prisma.membershipCheckIn.findFirst({
			where: {
				memberId: memberId,
				checkOutTime: null,
			},
		});

		if (activeCheckIn) {
			return {
				success: false,
				message:
					'Cannot remove a member who is currently checked in. Check them out first.',
			};
		}

		await prisma.membershipMember.delete({
			where: { id: memberId },
		});

		await prisma.activityLog.create({
			data: {
				userId: admin?.id || user?.id,
				action: 'team_member.removed',
				entityType: 'MembershipMember',
				entityId: memberId,
				metadata: { memberName: member.name },
			},
		});

		revalidatePath('/dashboard/subscriptions');
		revalidatePath('/admin/members');

		return {
			success: true,
			message: 'Team member removed successfully',
		};
	} catch (error) {
		console.error('Remove team member error:', error);
		return {
			success: false,
			message: 'Failed to remove team member',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// REGENERATE ACCESS CODE
// ============================================

export async function regenerateAccessCode(
	memberId: string
): Promise<TeamMemberResult<{ accessCode: string }>> {
	try {
		const user = await getCurrentUser();
		const admin = await getCurrentAdmin();

		if (!user && !admin) {
			return {
				success: false,
				message: 'Authentication required',
			};
		}

		// Get member and verify ownership
		const member = await prisma.membershipMember.findUnique({
			where: { id: memberId },
			include: {
				membership: {
					select: { userId: true },
				},
			},
		});

		if (!member) {
			return {
				success: false,
				message: 'Team member not found',
			};
		}

		if (!admin && member.membership.userId !== user?.id) {
			return {
				success: false,
				message: 'Access denied',
			};
		}

		// Generate new unique access code
		let accessCode = generateAccessCode();
		let attempts = 0;
		while (attempts < 5) {
			const existing = await prisma.membershipMember.findUnique({
				where: { accessCode },
			});
			if (!existing) break;
			accessCode = generateAccessCode();
			attempts++;
		}

		await prisma.membershipMember.update({
			where: { id: memberId },
			data: { accessCode },
		});

		await prisma.activityLog.create({
			data: {
				userId: admin?.id || user?.id,
				action: 'team_member.access_code_regenerated',
				entityType: 'MembershipMember',
				entityId: memberId,
			},
		});

		return {
			success: true,
			message: 'Access code regenerated successfully',
			data: { accessCode },
		};
	} catch (error) {
		console.error('Regenerate access code error:', error);
		return {
			success: false,
			message: 'Failed to regenerate access code',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// CHECK IN TEAM MEMBER
// ============================================

export async function checkInTeamMember(accessCode: string): Promise<
	TeamMemberResult<{
		checkIn: {
			id: string;
			checkInTime: Date;
		};
		member: TeamMember;
		membership: {
			id: string;
			membershipNumber: string;
			companyName: string | null;
			currentOccupancy: number;
			maxMembers: number;
			space: { name: string };
		};
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

		// Find member by access code
		const member = await prisma.membershipMember.findUnique({
			where: { accessCode },
			include: {
				membership: {
					include: {
						space: {
							select: { name: true },
						},
					},
				},
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						avatar: true,
					},
				},
			},
		});

		if (!member) {
			return {
				success: false,
				message: 'Invalid access code. Team member not found.',
			};
		}

		if (!member.isActive) {
			return {
				success: false,
				message: 'This team member has been deactivated',
			};
		}

		const membership = member.membership;

		// Check membership status
		if (membership.status !== 'ACTIVE') {
			return {
				success: false,
				message: `Membership is ${membership.status.toLowerCase()}`,
			};
		}

		// Check if membership has expired
		if (new Date() > membership.endDate) {
			return {
				success: false,
				message: 'Membership has expired',
			};
		}

		// Check if member is already checked in
		const existingCheckIn = await prisma.membershipCheckIn.findFirst({
			where: {
				memberId: member.id,
				checkOutTime: null,
			},
		});

		if (existingCheckIn) {
			return {
				success: false,
				message: `${member.name} is already checked in`,
			};
		}

		// Check occupancy limit
		if (membership.currentOccupancy >= membership.maxMembers) {
			return {
				success: false,
				message: `Maximum occupancy (${membership.maxMembers}) reached. Someone must check out first.`,
			};
		}

		// Create check-in and update occupancy in transaction
		const result = await prisma.$transaction(async (tx) => {
			const checkIn = await tx.membershipCheckIn.create({
				data: {
					membershipId: membership.id,
					memberId: member.id,
					checkedInBy: admin.id,
				},
			});

			const updatedMembership = await tx.membership.update({
				where: { id: membership.id },
				data: {
					currentOccupancy: { increment: 1 },
				},
				include: {
					space: { select: { name: true } },
				},
			});

			return { checkIn, updatedMembership };
		});

		await prisma.activityLog.create({
			data: {
				userId: admin.id,
				action: 'team_member.checked_in',
				entityType: 'MembershipCheckIn',
				entityId: result.checkIn.id,
				metadata: {
					memberName: member.name,
					membershipNumber: membership.membershipNumber,
				},
			},
		});

		revalidatePath('/admin/scanner');
		revalidatePath('/admin/dashboard');

		return {
			success: true,
			message: `${member.name} checked in successfully`,
			data: {
				checkIn: {
					id: result.checkIn.id,
					checkInTime: result.checkIn.checkInTime,
				},
				member: member as TeamMember,
				membership: {
					id: result.updatedMembership.id,
					membershipNumber: result.updatedMembership.membershipNumber,
					companyName: result.updatedMembership.companyName,
					currentOccupancy: result.updatedMembership.currentOccupancy,
					maxMembers: result.updatedMembership.maxMembers,
					space: result.updatedMembership.space,
				},
			},
		};
	} catch (error) {
		console.error('Check in team member error:', error);
		return {
			success: false,
			message: 'Failed to check in team member',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// CHECK OUT TEAM MEMBER
// ============================================

export async function checkOutTeamMember(accessCode: string): Promise<
	TeamMemberResult<{
		checkIn: {
			id: string;
			checkInTime: Date;
			checkOutTime: Date;
			duration: number; // minutes
		};
		member: TeamMember;
		membership: {
			currentOccupancy: number;
			maxMembers: number;
		};
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

		// Find member by access code
		const member = await prisma.membershipMember.findUnique({
			where: { accessCode },
			include: {
				membership: true,
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						avatar: true,
					},
				},
			},
		});

		if (!member) {
			return {
				success: false,
				message: 'Invalid access code. Team member not found.',
			};
		}

		// Find active check-in
		const activeCheckIn = await prisma.membershipCheckIn.findFirst({
			where: {
				memberId: member.id,
				checkOutTime: null,
			},
		});

		if (!activeCheckIn) {
			return {
				success: false,
				message: `${member.name} is not currently checked in`,
			};
		}

		const checkOutTime = new Date();
		const duration = Math.round(
			(checkOutTime.getTime() - activeCheckIn.checkInTime.getTime()) /
				(1000 * 60)
		);

		// Update check-in and decrement occupancy in transaction
		const result = await prisma.$transaction(async (tx) => {
			const updatedCheckIn = await tx.membershipCheckIn.update({
				where: { id: activeCheckIn.id },
				data: { checkOutTime },
			});

			const updatedMembership = await tx.membership.update({
				where: { id: member.membershipId },
				data: {
					currentOccupancy: { decrement: 1 },
				},
			});

			return { checkIn: updatedCheckIn, membership: updatedMembership };
		});

		await prisma.activityLog.create({
			data: {
				userId: admin.id,
				action: 'team_member.checked_out',
				entityType: 'MembershipCheckIn',
				entityId: activeCheckIn.id,
				metadata: {
					memberName: member.name,
					duration,
				},
			},
		});

		revalidatePath('/admin/scanner');
		revalidatePath('/admin/dashboard');

		return {
			success: true,
			message: `${member.name} checked out successfully`,
			data: {
				checkIn: {
					id: result.checkIn.id,
					checkInTime: result.checkIn.checkInTime,
					checkOutTime: result.checkIn.checkOutTime!,
					duration,
				},
				member: member as TeamMember,
				membership: {
					currentOccupancy: result.membership.currentOccupancy,
					maxMembers: result.membership.maxMembers,
				},
			},
		};
	} catch (error) {
		console.error('Check out team member error:', error);
		return {
			success: false,
			message: 'Failed to check out team member',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// GET CURRENT OCCUPANCY
// ============================================

export async function getCurrentOccupancy(membershipId: string): Promise<
	TeamMemberResult<{
		currentOccupancy: number;
		maxMembers: number;
		checkedInMembers: Array<{
			id: string;
			name: string;
			checkInTime: Date;
		}>;
	}>
> {
	try {
		const user = await getCurrentUser();
		const admin = await getCurrentAdmin();

		if (!user && !admin) {
			return {
				success: false,
				message: 'Authentication required',
			};
		}

		const membership = await prisma.membership.findUnique({
			where: { id: membershipId },
			select: {
				userId: true,
				currentOccupancy: true,
				maxMembers: true,
			},
		});

		if (!membership) {
			return {
				success: false,
				message: 'Membership not found',
			};
		}

		if (!admin && membership.userId !== user?.id) {
			return {
				success: false,
				message: 'Access denied',
			};
		}

		// Get currently checked in members
		const activeCheckIns = await prisma.membershipCheckIn.findMany({
			where: {
				membershipId,
				checkOutTime: null,
			},
			include: {
				member: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: {
				checkInTime: 'asc',
			},
		});

		return {
			success: true,
			message: 'Occupancy fetched successfully',
			data: {
				currentOccupancy: membership.currentOccupancy,
				maxMembers: membership.maxMembers,
				checkedInMembers: activeCheckIns.map((ci) => ({
					id: ci.member?.id || ci.id,
					name: ci.member?.name || 'Unknown',
					checkInTime: ci.checkInTime,
				})),
			},
		};
	} catch (error) {
		console.error('Get current occupancy error:', error);
		return {
			success: false,
			message: 'Failed to fetch occupancy',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// INITIALIZE PRIMARY MEMBER
// ============================================

// Call this when creating a new membership to set up the primary member
export async function initializePrimaryMember(
	membershipId: string,
	userId: string
): Promise<TeamMemberResult<TeamMember>> {
	try {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
			},
		});

		if (!user) {
			return {
				success: false,
				message: 'User not found',
			};
		}

		// Check if primary member already exists
		const existingPrimary = await prisma.membershipMember.findFirst({
			where: {
				membershipId,
				isPrimary: true,
			},
		});

		if (existingPrimary) {
			return {
				success: false,
				message: 'Primary member already exists',
			};
		}

		// Generate unique access code
		let accessCode = generateAccessCode();
		let attempts = 0;
		while (attempts < 5) {
			const existing = await prisma.membershipMember.findUnique({
				where: { accessCode },
			});
			if (!existing) break;
			accessCode = generateAccessCode();
			attempts++;
		}

		const member = await prisma.membershipMember.create({
			data: {
				membershipId,
				userId: user.id,
				name: user.name,
				email: user.email,
				phone: user.phone,
				accessCode,
				isPrimary: true,
				isActive: true,
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						avatar: true,
					},
				},
			},
		});

		return {
			success: true,
			message: 'Primary member initialized',
			data: member as TeamMember,
		};
	} catch (error) {
		console.error('Initialize primary member error:', error);
		return {
			success: false,
			message: 'Failed to initialize primary member',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}
