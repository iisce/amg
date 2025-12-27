'use server';

import { prisma } from '@/lib/db';
import type { User, UserRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { hash } from 'bcryptjs';
import { getCurrentUser, getCurrentAdmin } from './auth';

// ============================================
// TYPES
// ============================================

export interface UserProfile extends Omit<User, 'password'> {
	_count?: {
		bookings: number;
		memberships: number;
	};
}

export interface UserResult {
	success: boolean;
	message: string;
	data?: UserProfile | UserProfile[];
	error?: string;
}

export interface UpdateProfileInput {
	name?: string;
	phone?: string;
	company?: string;
	avatar?: string;
}

// ============================================
// PROFILE ACTIONS
// ============================================

export async function getProfile(): Promise<UserResult> {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return {
				success: false,
				message: 'Please login to view your profile',
			};
		}

		const profile = await prisma.user.findUnique({
			where: { id: user.id },
			select: {
				id: true,
				email: true,
				name: true,
				phone: true,
				company: true,
				avatar: true,
				role: true,
				isActive: true,
				emailVerified: true,
				createdAt: true,
				updatedAt: true,
				_count: {
					select: {
						bookings: true,
						memberships: true,
					},
				},
			},
		});

		if (!profile) {
			return {
				success: false,
				message: 'Profile not found',
			};
		}

		return {
			success: true,
			message: 'Profile fetched successfully',
			data: profile as UserProfile,
		};
	} catch (error) {
		console.error('Get profile error:', error);
		return {
			success: false,
			message: 'Failed to fetch profile',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function updateProfile(
	input: UpdateProfileInput
): Promise<UserResult> {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return {
				success: false,
				message: 'Please login to update your profile',
			};
		}

		const updatedUser = await prisma.user.update({
			where: { id: user.id },
			data: {
				name: input.name,
				phone: input.phone,
				company: input.company,
				avatar: input.avatar,
			},
			select: {
				id: true,
				email: true,
				name: true,
				phone: true,
				company: true,
				avatar: true,
				role: true,
				isActive: true,
				emailVerified: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		await prisma.activityLog.create({
			data: {
				userId: user.id,
				action: 'profile.updated',
				entityType: 'User',
				entityId: user.id,
				metadata: { updatedFields: Object.keys(input) },
			},
		});

		revalidatePath('/dashboard/profile');

		return {
			success: true,
			message: 'Profile updated successfully',
			data: updatedUser as UserProfile,
		};
	} catch (error) {
		console.error('Update profile error:', error);
		return {
			success: false,
			message: 'Failed to update profile',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function changePassword(
	currentPassword: string,
	newPassword: string
): Promise<{ success: boolean; message: string }> {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return {
				success: false,
				message: 'Please login to change your password',
			};
		}

		// Get user with password
		const userWithPassword = await prisma.user.findUnique({
			where: { id: user.id },
			select: { password: true },
		});

		if (!userWithPassword) {
			return {
				success: false,
				message: 'User not found',
			};
		}

		// Verify current password
		const bcrypt = await import('bcryptjs');
		const isValidPassword = await bcrypt.compare(
			currentPassword,
			userWithPassword.password
		);

		if (!isValidPassword) {
			return {
				success: false,
				message: 'Current password is incorrect',
			};
		}

		// Hash new password
		const hashedPassword = await hash(newPassword, 12);

		await prisma.user.update({
			where: { id: user.id },
			data: { password: hashedPassword },
		});

		// Invalidate all sessions except current
		await prisma.session.deleteMany({
			where: {
				userId: user.id,
			},
		});

		await prisma.activityLog.create({
			data: {
				userId: user.id,
				action: 'password.changed',
				entityType: 'User',
				entityId: user.id,
			},
		});

		return {
			success: true,
			message: 'Password changed successfully. Please login again.',
		};
	} catch (error) {
		console.error('Change password error:', error);
		return {
			success: false,
			message: 'Failed to change password',
		};
	}
}

// ============================================
// ADMIN: USER MANAGEMENT
// ============================================

export async function getUsers(options?: {
	role?: UserRole;
	isActive?: boolean;
	search?: string;
	limit?: number;
	offset?: number;
}): Promise<UserResult> {
	try {
		const admin = await getCurrentAdmin();

		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const {
			role,
			isActive,
			search,
			limit = 50,
			offset = 0,
		} = options || {};

		const users = await prisma.user.findMany({
			where: {
				...(role && { role }),
				...(typeof isActive === 'boolean' && { isActive }),
				...(search && {
					OR: [
						{ name: { contains: search, mode: 'insensitive' } },
						{ email: { contains: search, mode: 'insensitive' } },
						{ phone: { contains: search } },
						{ company: { contains: search, mode: 'insensitive' } },
					],
				}),
			},
			select: {
				id: true,
				email: true,
				name: true,
				phone: true,
				company: true,
				avatar: true,
				role: true,
				isActive: true,
				emailVerified: true,
				createdAt: true,
				updatedAt: true,
				_count: {
					select: {
						bookings: true,
						memberships: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
			take: limit,
			skip: offset,
		});

		return {
			success: true,
			message: 'Users fetched successfully',
			data: users as UserProfile[],
		};
	} catch (error) {
		console.error('Get users error:', error);
		return {
			success: false,
			message: 'Failed to fetch users',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getUserById(id: string): Promise<UserResult> {
	try {
		const admin = await getCurrentAdmin();

		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const user = await prisma.user.findUnique({
			where: { id },
			select: {
				id: true,
				email: true,
				name: true,
				phone: true,
				company: true,
				avatar: true,
				role: true,
				isActive: true,
				emailVerified: true,
				createdAt: true,
				updatedAt: true,
				_count: {
					select: {
						bookings: true,
						memberships: true,
					},
				},
			},
		});

		if (!user) {
			return {
				success: false,
				message: 'User not found',
			};
		}

		return {
			success: true,
			message: 'User fetched successfully',
			data: user as UserProfile,
		};
	} catch (error) {
		console.error('Get user by id error:', error);
		return {
			success: false,
			message: 'Failed to fetch user',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function createUser(input: {
	email: string;
	name: string;
	password: string;
	phone?: string;
	company?: string;
	role?: UserRole;
}): Promise<UserResult> {
	try {
		const admin = await getCurrentAdmin();

		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		// Check if email exists
		const existingUser = await prisma.user.findUnique({
			where: { email: input.email.toLowerCase() },
		});

		if (existingUser) {
			return {
				success: false,
				message: 'Email already registered',
			};
		}

		const hashedPassword = await hash(input.password, 12);

		const user = await prisma.user.create({
			data: {
				email: input.email.toLowerCase(),
				name: input.name,
				password: hashedPassword,
				phone: input.phone,
				company: input.company,
				role: input.role || 'CLIENT',
			},
			select: {
				id: true,
				email: true,
				name: true,
				phone: true,
				company: true,
				avatar: true,
				role: true,
				isActive: true,
				emailVerified: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		await prisma.activityLog.create({
			data: {
				userId: admin.id,
				action: 'user.created',
				entityType: 'User',
				entityId: user.id,
				metadata: { createdByAdmin: true },
			},
		});

		revalidatePath('/admin/members');

		return {
			success: true,
			message: 'User created successfully',
			data: user as UserProfile,
		};
	} catch (error) {
		console.error('Create user error:', error);
		return {
			success: false,
			message: 'Failed to create user',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function updateUser(
	id: string,
	input: {
		name?: string;
		phone?: string;
		company?: string;
		role?: UserRole;
		isActive?: boolean;
	}
): Promise<UserResult> {
	try {
		const admin = await getCurrentAdmin();

		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		// Prevent deactivating super admin
		if (input.isActive === false) {
			const targetUser = await prisma.user.findUnique({ where: { id } });
			if (targetUser?.role === 'SUPER_ADMIN') {
				return {
					success: false,
					message: 'Cannot deactivate super admin',
				};
			}
		}

		const user = await prisma.user.update({
			where: { id },
			data: input,
			select: {
				id: true,
				email: true,
				name: true,
				phone: true,
				company: true,
				avatar: true,
				role: true,
				isActive: true,
				emailVerified: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		await prisma.activityLog.create({
			data: {
				userId: admin.id,
				action: 'user.updated',
				entityType: 'User',
				entityId: id,
				metadata: { updatedFields: Object.keys(input) },
			},
		});

		revalidatePath('/admin/members');

		return {
			success: true,
			message: 'User updated successfully',
			data: user as UserProfile,
		};
	} catch (error) {
		console.error('Update user error:', error);
		return {
			success: false,
			message: 'Failed to update user',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function toggleUserStatus(id: string): Promise<UserResult> {
	try {
		const admin = await getCurrentAdmin();

		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const user = await prisma.user.findUnique({ where: { id } });

		if (!user) {
			return {
				success: false,
				message: 'User not found',
			};
		}

		// Prevent deactivating super admin
		if (user.role === 'SUPER_ADMIN' && user.isActive) {
			return {
				success: false,
				message: 'Cannot deactivate super admin',
			};
		}

		return updateUser(id, { isActive: !user.isActive });
	} catch (error) {
		console.error('Toggle user status error:', error);
		return {
			success: false,
			message: 'Failed to toggle user status',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function resetUserPassword(
	id: string,
	newPassword: string
): Promise<{ success: boolean; message: string }> {
	try {
		const admin = await getCurrentAdmin();

		if (!admin) {
			return {
				success: false,
				message: 'Admin access required',
			};
		}

		const hashedPassword = await hash(newPassword, 12);

		await prisma.user.update({
			where: { id },
			data: { password: hashedPassword },
		});

		// Invalidate all user sessions
		await prisma.session.deleteMany({
			where: { userId: id },
		});

		await prisma.activityLog.create({
			data: {
				userId: admin.id,
				action: 'user.password_reset',
				entityType: 'User',
				entityId: id,
				metadata: { resetByAdmin: true },
			},
		});

		return {
			success: true,
			message: 'Password reset successfully',
		};
	} catch (error) {
		console.error('Reset user password error:', error);
		return {
			success: false,
			message: 'Failed to reset password',
		};
	}
}

export async function deleteUser(
	id: string
): Promise<{ success: boolean; message: string }> {
	try {
		const admin = await getCurrentAdmin();

		if (!admin || admin.role !== 'SUPER_ADMIN') {
			return {
				success: false,
				message: 'Super admin access required',
			};
		}

		const user = await prisma.user.findUnique({ where: { id } });

		if (!user) {
			return {
				success: false,
				message: 'User not found',
			};
		}

		// Prevent deleting super admin
		if (user.role === 'SUPER_ADMIN') {
			return {
				success: false,
				message: 'Cannot delete super admin',
			};
		}

		// Soft delete: just deactivate
		await prisma.user.update({
			where: { id },
			data: { isActive: false },
		});

		// Delete all sessions
		await prisma.session.deleteMany({
			where: { userId: id },
		});

		await prisma.activityLog.create({
			data: {
				userId: admin.id,
				action: 'user.deleted',
				entityType: 'User',
				entityId: id,
			},
		});

		revalidatePath('/admin/members');

		return {
			success: true,
			message: 'User deleted successfully',
		};
	} catch (error) {
		console.error('Delete user error:', error);
		return {
			success: false,
			message: 'Failed to delete user',
		};
	}
}

// ============================================
// USER STATS
// ============================================

export async function getUserStats(userId: string): Promise<{
	success: boolean;
	data?: {
		totalBookings: number;
		activeBookings: number;
		completedBookings: number;
		cancelledBookings: number;
		totalSubscriptions: number;
		activeSubscriptions: number;
		totalSpent: number;
	};
	error?: string;
}> {
	try {
		const [
			totalBookings,
			activeBookings,
			completedBookings,
			cancelledBookings,
			totalSubscriptions,
			activeSubscriptions,
			totalPayments,
		] = await Promise.all([
			prisma.booking.count({ where: { userId } }),
			prisma.booking.count({
				where: {
					userId,
					status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
				},
			}),
			prisma.booking.count({ where: { userId, status: 'COMPLETED' } }),
			prisma.booking.count({ where: { userId, status: 'CANCELLED' } }),
			prisma.membership.count({ where: { userId } }),
			prisma.membership.count({ where: { userId, status: 'ACTIVE' } }),
			prisma.payment.aggregate({
				where: { userId, status: 'PAID' },
				_sum: { amount: true },
			}),
		]);

		return {
			success: true,
			data: {
				totalBookings,
				activeBookings,
				completedBookings,
				cancelledBookings,
				totalSubscriptions,
				activeSubscriptions,
				totalSpent: totalPayments._sum?.amount || 0,
			},
		};
	} catch (error) {
		console.error('Get user stats error:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

/**
 * Create a new staff member (Admin only)
 */
export async function createStaff(data: {
	name: string;
	email: string;
	password: string;
	phone?: string;
	role:
		| 'ADMIN'
		| 'STAFF'
		| 'SUPER_ADMIN'
		| 'FRONT_DESK'
		| 'FRONT_DESK_ASSISTANT';
}): Promise<UserResult> {
	try {
		// Get current admin
		const admin = await getCurrentAdmin();
		if (!admin) {
			return {
				success: false,
				message: 'Unauthorized',
				error: 'Unauthorized',
			};
		}

		// Only SUPER_ADMIN can create other SUPER_ADMINs
		if (data.role === 'SUPER_ADMIN' && admin.role !== 'SUPER_ADMIN') {
			return {
				success: false,
				message: 'Only super admins can create super admin accounts',
				error: 'Only super admins can create super admin accounts',
			};
		}

		// Check if email already exists
		const existingUser = await prisma.user.findUnique({
			where: { email: data.email },
		});

		if (existingUser) {
			return {
				success: false,
				message: 'Email already in use',
				error: 'Email already in use',
			};
		}

		// Hash password
		const hashedPassword = await hash(data.password, 12);

		// Create staff user
		const staff = await prisma.user.create({
			data: {
				name: data.name,
				email: data.email,
				password: hashedPassword,
				phone: data.phone,
				role: data.role,
			},
		});

		// Log activity
		await prisma.activityLog.create({
			data: {
				userId: admin.id,
				action: 'CREATE_STAFF',
				entityType: 'User',
				entityId: staff.id,
				metadata: {
					details: `Created ${data.role.toLowerCase()} account for ${
						data.name
					}`,
					role: data.role,
				},
			},
		});

		revalidatePath('/admin/members');

		return {
			success: true,
			message: `${data.role} account created successfully`,
			data: staff,
		};
	} catch (error) {
		console.error('Create staff error:', error);
		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: 'Failed to create staff',
		};
	}
}
