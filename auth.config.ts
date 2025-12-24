import type { NextAuthConfig } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { UserRole } from '@prisma/client';

declare module 'next-auth' {
	interface User {
		role: UserRole;
		phone?: string | null;
		company?: string | null;
	}

	interface Session {
		user: {
			id: string;
			email: string;
			name: string;
			role: UserRole;
			phone?: string | null;
			company?: string | null;
			image?: string | null;
		};
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		id: string;
		role: UserRole;
		phone?: string | null;
		company?: string | null;
	}
}

/**
 * Auth configuration that's Edge-compatible (no Prisma).
 * Used by middleware for route protection.
 */
export const authConfig: NextAuthConfig = {
	session: {
		strategy: 'jwt',
		maxAge: 7 * 24 * 60 * 60, // 7 days
	},
	pages: {
		signIn: '/login',
		error: '/login',
	},
	providers: [], // Providers are configured in auth.ts
	callbacks: {
		authorized({ auth, request: { nextUrl } }) {
			const isLoggedIn = !!auth?.user;
			const pathname = nextUrl.pathname;

			// Protected routes that require authentication
			const protectedRoutes = ['/dashboard', '/booking/confirmation'];
			const adminRoutes = [
				'/admin/dashboard',
				'/admin/spaces',
				'/admin/bookings',
				'/admin/members',
				'/admin/reports',
				'/admin/scanner',
			];
			const authRoutes = ['/login', '/register'];
			const adminAuthRoutes = ['/admin/login'];

			const isProtectedRoute = protectedRoutes.some((route) =>
				pathname.startsWith(route)
			);
			const isAdminRoute = adminRoutes.some((route) =>
				pathname.startsWith(route)
			);
			const isAuthRoute = authRoutes.some((route) =>
				pathname.startsWith(route)
			);
			const isAdminAuthRoute = adminAuthRoutes.some((route) =>
				pathname.startsWith(route)
			);

			const isAdmin =
				auth?.user?.role === 'ADMIN' ||
				auth?.user?.role === 'STAFF' ||
				auth?.user?.role === 'SUPER_ADMIN';

			// Allow access to auth routes
			if (isAuthRoute || isAdminAuthRoute) {
				return true;
			}

			// Protect dashboard routes
			if (isProtectedRoute) {
				return isLoggedIn;
			}

			// Protect admin routes - require admin role
			if (isAdminRoute) {
				return isLoggedIn && isAdmin;
			}

			return true;
		},
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id as string;
				token.role = user.role;
				token.phone = user.phone;
				token.company = user.company;
			}
			return token;
		},
		async session({ session, token }) {
			if (token && session.user) {
				session.user.id = token.id as string;
				session.user.role = token.role as UserRole;
				session.user.phone = token.phone as string | null | undefined;
				session.user.company = token.company as
					| string
					| null
					| undefined;
			}
			return session;
		},
	},
};
