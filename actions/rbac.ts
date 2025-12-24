'use server';

import { getCurrentUser, getCurrentAdmin } from '@/actions/auth';
import {
	hasPermission,
	hasAnyPermission,
	hasAllPermissions,
	isAdminRole,
	type Permission,
} from '@/lib/permissions';
import { UserRole } from '@prisma/client';

export type RBACResult =
	| { success: true; user: { id: string; role: UserRole; email: string; name: string } }
	| { success: false; error: string };

/**
 * Check if the current user has admin panel access
 * Returns user data if authorized, error otherwise
 */
export async function requireAdmin(): Promise<RBACResult> {
	const user = await getCurrentAdmin();
	
	if (!user) {
		return { success: false, error: 'Not authenticated' };
	}

	if (!isAdminRole(user.role)) {
		return { success: false, error: 'Access denied. Admin role required.' };
	}

	return {
		success: true,
		user: {
			id: user.id,
			role: user.role,
			email: user.email,
			name: user.name,
		},
	};
}

/**
 * Check if the current user has a specific permission
 * Returns user data if authorized, error otherwise
 */
export async function requirePermission(permission: Permission): Promise<RBACResult> {
	const user = await getCurrentAdmin();
	
	if (!user) {
		return { success: false, error: 'Not authenticated' };
	}

	if (!hasPermission(user.role, permission)) {
		return {
			success: false,
			error: `Access denied. Missing permission: ${permission}`,
		};
	}

	return {
		success: true,
		user: {
			id: user.id,
			role: user.role,
			email: user.email,
			name: user.name,
		},
	};
}

/**
 * Check if the current user has any of the specified permissions
 */
export async function requireAnyPermission(permissions: Permission[]): Promise<RBACResult> {
	const user = await getCurrentAdmin();
	
	if (!user) {
		return { success: false, error: 'Not authenticated' };
	}

	if (!hasAnyPermission(user.role, permissions)) {
		return {
			success: false,
			error: `Access denied. Required one of: ${permissions.join(', ')}`,
		};
	}

	return {
		success: true,
		user: {
			id: user.id,
			role: user.role,
			email: user.email,
			name: user.name,
		},
	};
}

/**
 * Check if the current user has all of the specified permissions
 */
export async function requireAllPermissions(permissions: Permission[]): Promise<RBACResult> {
	const user = await getCurrentAdmin();
	
	if (!user) {
		return { success: false, error: 'Not authenticated' };
	}

	if (!hasAllPermissions(user.role, permissions)) {
		return {
			success: false,
			error: `Access denied. Required all of: ${permissions.join(', ')}`,
		};
	}

	return {
		success: true,
		user: {
			id: user.id,
			role: user.role,
			email: user.email,
			name: user.name,
		},
	};
}

/**
 * Check if the current user is a client (regular user)
 */
export async function requireClient(): Promise<RBACResult> {
	const user = await getCurrentUser();
	
	if (!user) {
		return { success: false, error: 'Not authenticated' };
	}

	return {
		success: true,
		user: {
			id: user.id,
			role: user.role,
			email: user.email,
			name: user.name,
		},
	};
}

/**
 * Check if the current user is either an admin OR the owner of a resource
 */
export async function requireAdminOrOwner(ownerId: string): Promise<RBACResult> {
	// First try admin
	const adminUser = await getCurrentAdmin();
	if (adminUser && isAdminRole(adminUser.role)) {
		return {
			success: true,
			user: {
				id: adminUser.id,
				role: adminUser.role,
				email: adminUser.email,
				name: adminUser.name,
			},
		};
	}

	// Then try regular user
	const user = await getCurrentUser();
	if (user && user.id === ownerId) {
		return {
			success: true,
			user: {
				id: user.id,
				role: user.role,
				email: user.email,
				name: user.name,
			},
		};
	}

	return { success: false, error: 'Access denied' };
}

/**
 * Get current user's role (or null if not authenticated)
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
	const user = await getCurrentAdmin() || await getCurrentUser();
	return user?.role ?? null;
}
