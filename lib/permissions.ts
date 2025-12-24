/**
 * Role-Based Access Control (RBAC) Permissions
 *
 * Defines what each role can do in the system.
 */

import { UserRole } from '@prisma/client';

// Permission actions
export type Permission =
	// User Management
	| 'users:read'
	| 'users:create'
	| 'users:update'
	| 'users:delete'
	| 'users:manage-roles'
	// Space Management
	| 'spaces:read'
	| 'spaces:create'
	| 'spaces:update'
	| 'spaces:delete'
	// Booking Management
	| 'bookings:read'
	| 'bookings:read-own'
	| 'bookings:create'
	| 'bookings:update'
	| 'bookings:cancel'
	| 'bookings:check-in'
	| 'bookings:check-out'
	// Membership/Subscription Management
	| 'memberships:read'
	| 'memberships:read-own'
	| 'memberships:create'
	| 'memberships:update'
	| 'memberships:cancel'
	| 'memberships:assign-desk'
	// Payment Management
	| 'payments:read'
	| 'payments:read-own'
	| 'payments:create'
	| 'payments:refund'
	| 'payments:record-manual'
	// Reports & Analytics
	| 'reports:view'
	| 'reports:export'
	| 'analytics:view'
	// System Settings
	| 'settings:read'
	| 'settings:update'
	| 'holidays:manage'
	// Perks & Add-ons
	| 'perks:read'
	| 'perks:create'
	| 'perks:update'
	| 'perks:delete'
	| 'addons:read'
	| 'addons:create'
	| 'addons:update'
	| 'addons:delete'
	// Admin Panel Access
	| 'admin:access'
	| 'admin:dashboard';

/**
 * Role hierarchy (higher number = more permissions)
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
	CLIENT: 0,
	FRONT_DESK_ASSISTANT: 1,
	FRONT_DESK: 2,
	STAFF: 3,
	ADMIN: 4,
	SUPER_ADMIN: 5,
};

/**
 * Permissions for each role
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
	// Clients can only manage their own data
	CLIENT: [
		'bookings:read-own',
		'bookings:create',
		'memberships:read-own',
		'payments:read-own',
	],

	// Front Desk Assistant - Basic check-in/out operations
	FRONT_DESK_ASSISTANT: [
		'admin:access',
		'admin:dashboard',
		'bookings:read',
		'bookings:check-in',
		'bookings:check-out',
		'memberships:read',
		'spaces:read',
	],

	// Front Desk - Full reception operations
	FRONT_DESK: [
		'admin:access',
		'admin:dashboard',
		'bookings:read',
		'bookings:create',
		'bookings:update',
		'bookings:cancel',
		'bookings:check-in',
		'bookings:check-out',
		'memberships:read',
		'memberships:create',
		'memberships:update',
		'memberships:assign-desk',
		'payments:read',
		'payments:create',
		'payments:record-manual',
		'spaces:read',
		'users:read',
		'perks:read',
		'addons:read',
	],

	// Staff - Extended operations (general staff member)
	STAFF: [
		'admin:access',
		'admin:dashboard',
		'bookings:read',
		'bookings:create',
		'bookings:update',
		'bookings:cancel',
		'bookings:check-in',
		'bookings:check-out',
		'memberships:read',
		'memberships:create',
		'memberships:update',
		'memberships:cancel',
		'memberships:assign-desk',
		'payments:read',
		'payments:create',
		'payments:record-manual',
		'spaces:read',
		'spaces:update',
		'users:read',
		'users:create',
		'users:update',
		'reports:view',
		'perks:read',
		'addons:read',
	],

	// Admin - Full management except system settings
	ADMIN: [
		'admin:access',
		'admin:dashboard',
		'bookings:read',
		'bookings:create',
		'bookings:update',
		'bookings:cancel',
		'bookings:check-in',
		'bookings:check-out',
		'memberships:read',
		'memberships:create',
		'memberships:update',
		'memberships:cancel',
		'memberships:assign-desk',
		'payments:read',
		'payments:create',
		'payments:refund',
		'payments:record-manual',
		'spaces:read',
		'spaces:create',
		'spaces:update',
		'spaces:delete',
		'users:read',
		'users:create',
		'users:update',
		'users:delete',
		'reports:view',
		'reports:export',
		'analytics:view',
		'holidays:manage',
		'perks:read',
		'perks:create',
		'perks:update',
		'perks:delete',
		'addons:read',
		'addons:create',
		'addons:update',
		'addons:delete',
	],

	// Super Admin - Everything including system settings and role management
	SUPER_ADMIN: [
		'admin:access',
		'admin:dashboard',
		'bookings:read',
		'bookings:create',
		'bookings:update',
		'bookings:cancel',
		'bookings:check-in',
		'bookings:check-out',
		'memberships:read',
		'memberships:create',
		'memberships:update',
		'memberships:cancel',
		'memberships:assign-desk',
		'payments:read',
		'payments:create',
		'payments:refund',
		'payments:record-manual',
		'spaces:read',
		'spaces:create',
		'spaces:update',
		'spaces:delete',
		'users:read',
		'users:create',
		'users:update',
		'users:delete',
		'users:manage-roles',
		'reports:view',
		'reports:export',
		'analytics:view',
		'settings:read',
		'settings:update',
		'holidays:manage',
		'perks:read',
		'perks:create',
		'perks:update',
		'perks:delete',
		'addons:read',
		'addons:create',
		'addons:update',
		'addons:delete',
	],
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
	return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
	role: UserRole,
	permissions: Permission[]
): boolean {
	return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(
	role: UserRole,
	permissions: Permission[]
): boolean {
	return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Check if a role can manage another role (based on hierarchy)
 */
export function canManageRole(
	managerRole: UserRole,
	targetRole: UserRole
): boolean {
	// Only SUPER_ADMIN and ADMIN can manage roles
	if (!hasPermission(managerRole, 'users:manage-roles')) {
		// ADMIN can manage lower roles but not SUPER_ADMIN
		if (managerRole === 'ADMIN') {
			return (
				ROLE_HIERARCHY[targetRole] < ROLE_HIERARCHY['ADMIN'] &&
				targetRole !== 'SUPER_ADMIN'
			);
		}
		return false;
	}
	// SUPER_ADMIN can manage everyone except other SUPER_ADMINs
	return ROLE_HIERARCHY[managerRole] > ROLE_HIERARCHY[targetRole];
}

/**
 * Get roles that a user can assign to others
 */
export function getAssignableRoles(managerRole: UserRole): UserRole[] {
	const allRoles: UserRole[] = [
		'CLIENT',
		'FRONT_DESK_ASSISTANT',
		'FRONT_DESK',
		'STAFF',
		'ADMIN',
		'SUPER_ADMIN',
	];

	return allRoles.filter((role) => canManageRole(managerRole, role));
}

/**
 * Check if a role is an admin role (has admin panel access)
 */
export function isAdminRole(role: UserRole): boolean {
	return hasPermission(role, 'admin:access');
}

/**
 * Get human-readable role name
 */
export function getRoleDisplayName(role: UserRole): string {
	const displayNames: Record<UserRole, string> = {
		CLIENT: 'Client',
		FRONT_DESK_ASSISTANT: 'Front Desk Assistant',
		FRONT_DESK: 'Front Desk',
		STAFF: 'Staff',
		ADMIN: 'Administrator',
		SUPER_ADMIN: 'Super Administrator',
	};
	return displayNames[role] || role;
}

/**
 * Get role badge color for UI
 */
export function getRoleBadgeColor(
	role: UserRole
): 'default' | 'secondary' | 'destructive' | 'outline' {
	switch (role) {
		case 'SUPER_ADMIN':
			return 'destructive';
		case 'ADMIN':
			return 'default';
		case 'STAFF':
		case 'FRONT_DESK':
			return 'secondary';
		default:
			return 'outline';
	}
}
