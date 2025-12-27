import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import { NextResponse } from 'next/server';
import type { UserRole } from '@prisma/client';

const { auth } = NextAuth(authConfig);

// Admin roles that should access /admin routes
const ADMIN_ROLES: UserRole[] = [
	'SUPER_ADMIN',
	'ADMIN',
	'STAFF',
	'FRONT_DESK',
	'FRONT_DESK_ASSISTANT',
];

function isAdminRole(role?: string): boolean {
	return ADMIN_ROLES.includes(role as UserRole);
}

export default auth((req) => {
	const { pathname } = req.nextUrl;
	const isLoggedIn = !!req.auth;
	const userRole = req.auth?.user?.role as UserRole | undefined;
	const isAdmin = isAdminRole(userRole);

	// Routes configuration
	const protectedRoutes = [
		'/dashboard',
		'/booking/confirmation',
		'/booking/payment',
		'/subscription/payment',
	];
	const adminRoutes = [
		'/admin/dashboard',
		'/admin/spaces',
		'/admin/bookings',
		'/admin/members',
		'/admin/memberships',
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
	const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
	const isAdminAuthRoute = adminAuthRoutes.some((route) =>
		pathname.startsWith(route)
	);

	// Redirect to login if not authenticated and accessing protected route
	if (isProtectedRoute && !isLoggedIn) {
		const callbackUrl = encodeURIComponent(pathname);
		return NextResponse.redirect(
			new URL(`/login?callbackUrl=${callbackUrl}`, req.url)
		);
	}

	// Redirect to admin login if not authenticated and accessing admin route
	if (isAdminRoute && !isLoggedIn) {
		const callbackUrl = encodeURIComponent(pathname);
		return NextResponse.redirect(
			new URL(`/admin/login?callbackUrl=${callbackUrl}`, req.url)
		);
	}

	// Redirect to home if not admin trying to access admin routes
	if (isAdminRoute && isLoggedIn && !isAdmin) {
		return NextResponse.redirect(new URL('/dashboard', req.url));
	}

	// Redirect admin users away from client dashboard to admin dashboard
	if (pathname.startsWith('/dashboard') && isLoggedIn && isAdmin) {
		return NextResponse.redirect(new URL('/admin/dashboard', req.url));
	}

	// Redirect to appropriate dashboard if authenticated and accessing auth routes
	if (isAuthRoute && isLoggedIn) {
		if (isAdmin) {
			return NextResponse.redirect(new URL('/admin/dashboard', req.url));
		}
		return NextResponse.redirect(new URL('/dashboard', req.url));
	}

	// Redirect to admin dashboard if admin and accessing admin login
	if (isAdminAuthRoute && isLoggedIn && isAdmin) {
		return NextResponse.redirect(new URL('/admin/dashboard', req.url));
	}

	return NextResponse.next();
});

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		'/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
	],
};
