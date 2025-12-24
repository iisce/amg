'use client';

import { useAuth } from './use-auth';
import {
	hasPermission,
	hasAnyPermission,
	hasAllPermissions,
	canManageRole,
	getAssignableRoles,
	isAdminRole,
	getRoleDisplayName,
	getRoleBadgeColor,
	type Permission,
} from '@/lib/permissions';
import { UserRole } from '@prisma/client';

/**
 * Hook for checking user permissions in components
 */
export function usePermissions() {
	const { user, isLoading } = useAuth();
	const role = user?.role as UserRole | undefined;

	return {
		isLoading,
		role,

		/**
		 * Check if user has a specific permission
		 */
		can: (permission: Permission): boolean => {
			if (!role) return false;
			return hasPermission(role, permission);
		},

		/**
		 * Check if user has any of the specified permissions
		 */
		canAny: (permissions: Permission[]): boolean => {
			if (!role) return false;
			return hasAnyPermission(role, permissions);
		},

		/**
		 * Check if user has all of the specified permissions
		 */
		canAll: (permissions: Permission[]): boolean => {
			if (!role) return false;
			return hasAllPermissions(role, permissions);
		},

		/**
		 * Check if user can manage another role
		 */
		canManageRole: (targetRole: UserRole): boolean => {
			if (!role) return false;
			return canManageRole(role, targetRole);
		},

		/**
		 * Get roles that user can assign to others
		 */
		assignableRoles: (): UserRole[] => {
			if (!role) return [];
			return getAssignableRoles(role);
		},

		/**
		 * Check if user has admin panel access
		 */
		isAdmin: (): boolean => {
			if (!role) return false;
			return isAdminRole(role);
		},

		/**
		 * Check if user is Super Admin
		 */
		isSuperAdmin: (): boolean => {
			return role === 'SUPER_ADMIN';
		},

		/**
		 * Get display name for user's role
		 */
		roleDisplayName: (): string => {
			if (!role) return 'Unknown';
			return getRoleDisplayName(role);
		},

		/**
		 * Get badge color for user's role
		 */
		roleBadgeColor: () => {
			if (!role) return 'outline' as const;
			return getRoleBadgeColor(role);
		},
	};
}

export type { Permission };
