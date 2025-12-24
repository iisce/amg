'use server';

import { prisma } from '@/lib/db';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { auth, signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import type { User, UserRole } from '@prisma/client';
import { sendEmail } from '@/lib/email';
import {
	createWelcomeEmail,
	createPasswordResetEmail,
	createPasswordResetSuccessEmail,
} from '@/lib/email-templates';

// ============================================
// TYPES
// ============================================

export interface AuthResult {
	success: boolean;
	message: string;
	user?: Omit<User, 'password'>;
	error?: string;
}

export interface SessionUser {
	id: string;
	email: string;
	name: string;
	role: UserRole;
	phone?: string | null;
	company?: string | null;
}

// ============================================
// HELPERS
// ============================================

function generateToken(): string {
	return randomBytes(32).toString('hex');
}

// ============================================
// AUTH ACTIONS
// ============================================

export async function register(formData: {
	email: string;
	password: string;
	name: string;
	phone?: string;
}): Promise<AuthResult> {
	try {
		const { email, password, name, phone } = formData;

		// Check if user already exists
		const existingUser = await prisma.user.findUnique({
			where: { email: email.toLowerCase() },
		});

		if (existingUser) {
			return {
				success: false,
				message: 'An account with this email already exists',
			};
		}

		// Hash password
		const hashedPassword = await hash(password, 12);

		// Create user
		const user = await prisma.user.create({
			data: {
				email: email.toLowerCase(),
				password: hashedPassword,
				name,
				phone,
				role: 'CLIENT',
			},
		});

		// Log activity
		await prisma.activityLog.create({
			data: {
				userId: user.id,
				action: 'user.register',
				entityType: 'User',
				entityId: user.id,
			},
		});

		// Send welcome email
		const welcomeEmail = createWelcomeEmail({
			name: user.name,
			email: user.email,
		});
		await sendEmail({
			to: user.email,
			subject: welcomeEmail.subject,
			html: welcomeEmail.html,
		});

		const { password: _, ...userWithoutPassword } = user;

		return {
			success: true,
			message: 'Account created successfully',
			user: userWithoutPassword,
		};
	} catch (error) {
		console.error('Registration error:', error);
		return {
			success: false,
			message: 'Failed to create account. Please try again.',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function login(formData: {
	email: string;
	password: string;
}): Promise<AuthResult & { role?: UserRole }> {
	try {
		// First get the user to check their role
		const user = await prisma.user.findUnique({
			where: { email: formData.email.toLowerCase() },
			select: { role: true },
		});

		await signIn('credentials', {
			email: formData.email,
			password: formData.password,
			isAdmin: 'false',
			redirect: false,
		});

		return {
			success: true,
			message: 'Login successful',
			role: user?.role,
		};
	} catch (error) {
		if (error instanceof AuthError) {
			return {
				success: false,
				message:
					error.cause?.err?.message || 'Invalid email or password',
			};
		}
		console.error('Login error:', error);
		return {
			success: false,
			message: 'Failed to login. Please try again.',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function adminLogin(formData: {
	email: string;
	password: string;
}): Promise<AuthResult> {
	try {
		await signIn('credentials', {
			email: formData.email,
			password: formData.password,
			isAdmin: 'true',
			redirect: false,
		});

		return {
			success: true,
			message: 'Admin login successful',
		};
	} catch (error) {
		if (error instanceof AuthError) {
			return {
				success: false,
				message:
					error.cause?.err?.message || 'Invalid email or password',
			};
		}
		console.error('Admin login error:', error);
		return {
			success: false,
			message: 'Failed to login. Please try again.',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function logout(): Promise<AuthResult> {
	try {
		await signOut({ redirect: false });

		return {
			success: true,
			message: 'Logged out successfully',
		};
	} catch (error) {
		console.error('Logout error:', error);
		return {
			success: false,
			message: 'Failed to logout',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function adminLogout(): Promise<AuthResult> {
	// Auth.js uses the same signOut for all users
	return logout();
}

export async function getAuthStatus(): Promise<{
	isAuthenticated: boolean;
	isAdmin: boolean;
}> {
	try {
		const session = await auth();

		if (!session?.user) {
			return { isAuthenticated: false, isAdmin: false };
		}

		const isAdmin =
			session.user.role === 'ADMIN' ||
			session.user.role === 'STAFF' ||
			session.user.role === 'SUPER_ADMIN';

		return { isAuthenticated: true, isAdmin };
	} catch (error) {
		return { isAuthenticated: false, isAdmin: false };
	}
}

export async function getCurrentUser(): Promise<SessionUser | null> {
	try {
		const session = await auth();

		if (!session?.user) {
			return null;
		}

		return {
			id: session.user.id,
			email: session.user.email!,
			name: session.user.name!,
			role: session.user.role,
			phone: session.user.phone,
			company: session.user.company,
		};
	} catch (error) {
		// Suppress expected errors during static build (DYNAMIC_SERVER_USAGE)
		if (
			error instanceof Error &&
			!error.message.includes('DYNAMIC_SERVER_USAGE') &&
			!(error as { digest?: string }).digest?.includes(
				'DYNAMIC_SERVER_USAGE'
			)
		) {
			console.error('Get current user error:', error);
		}
		return null;
	}
}

export async function getCurrentAdmin(): Promise<SessionUser | null> {
	try {
		const session = await auth();

		if (!session?.user) {
			return null;
		}

		// Check if user has admin privileges
		if (
			session.user.role !== 'ADMIN' &&
			session.user.role !== 'STAFF' &&
			session.user.role !== 'SUPER_ADMIN'
		) {
			return null;
		}

		return {
			id: session.user.id,
			email: session.user.email!,
			name: session.user.name!,
			role: session.user.role,
			phone: session.user.phone,
			company: session.user.company,
		};
	} catch (error) {
		// Suppress expected errors during static build (DYNAMIC_SERVER_USAGE)
		if (
			error instanceof Error &&
			!error.message.includes('DYNAMIC_SERVER_USAGE') &&
			!(error as { digest?: string }).digest?.includes(
				'DYNAMIC_SERVER_USAGE'
			)
		) {
			console.error('Get current admin error:', error);
		}
		return null;
	}
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
	try {
		const user = await prisma.user.findUnique({
			where: { email: email.toLowerCase() },
		});

		// Always return success to prevent email enumeration
		if (!user) {
			return {
				success: true,
				message: 'If an account exists, a reset link has been sent',
			};
		}

		// Delete any existing reset tokens
		await prisma.passwordResetToken.deleteMany({
			where: { userId: user.id },
		});

		// Create new reset token
		const token = generateToken();
		const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

		await prisma.passwordResetToken.create({
			data: {
				userId: user.id,
				token,
				expiresAt,
			},
		});

		// Send password reset email
		const resetEmail = createPasswordResetEmail(
			{ name: user.name, email: user.email },
			token
		);
		await sendEmail({
			to: user.email,
			subject: resetEmail.subject,
			html: resetEmail.html,
		});

		await prisma.activityLog.create({
			data: {
				userId: user.id,
				action: 'user.password_reset_requested',
				entityType: 'User',
				entityId: user.id,
			},
		});

		return {
			success: true,
			message: 'If an account exists, a reset link has been sent',
		};
	} catch (error) {
		console.error('Password reset request error:', error);
		return {
			success: false,
			message: 'Failed to process request. Please try again.',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function resetPassword(
	token: string,
	newPassword: string
): Promise<AuthResult> {
	try {
		const resetToken = await prisma.passwordResetToken.findUnique({
			where: { token },
			include: { user: true },
		});

		if (!resetToken || resetToken.expiresAt < new Date()) {
			return {
				success: false,
				message: 'Invalid or expired reset token',
			};
		}

		// Hash new password
		const hashedPassword = await hash(newPassword, 12);

		// Update password
		await prisma.user.update({
			where: { id: resetToken.userId },
			data: { password: hashedPassword },
		});

		// Delete reset token
		await prisma.passwordResetToken.delete({
			where: { id: resetToken.id },
		});

		// Invalidate all sessions for the user
		await prisma.session.deleteMany({
			where: { userId: resetToken.userId },
		});

		await prisma.activityLog.create({
			data: {
				userId: resetToken.userId,
				action: 'user.password_reset_completed',
				entityType: 'User',
				entityId: resetToken.userId,
			},
		});

		// Send password reset success email
		const successEmail = createPasswordResetSuccessEmail({
			name: resetToken.user.name,
			email: resetToken.user.email,
		});
		await sendEmail({
			to: resetToken.user.email,
			subject: successEmail.subject,
			html: successEmail.html,
		});

		return {
			success: true,
			message:
				'Password reset successful. Please login with your new password.',
		};
	} catch (error) {
		console.error('Password reset error:', error);
		return {
			success: false,
			message: 'Failed to reset password. Please try again.',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}
