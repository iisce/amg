import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/db';
import { authConfig } from '@/auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
	...authConfig,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	adapter: PrismaAdapter(prisma) as any,
	providers: [
		Credentials({
			id: 'credentials',
			name: 'Credentials',
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' },
				isAdmin: { label: 'Is Admin', type: 'text' },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					throw new Error('Email and password are required');
				}

				const email = credentials.email as string;
				const password = credentials.password as string;
				const isAdmin = credentials.isAdmin === 'true';

				const user = await prisma.user.findUnique({
					where: { email: email.toLowerCase() },
				});

				if (!user) {
					throw new Error('Invalid email or password');
				}

				if (!user.isActive) {
					throw new Error(
						'Your account has been deactivated. Please contact support.'
					);
				}

				const isValidPassword = await compare(password, user.password);
				if (!isValidPassword) {
					throw new Error('Invalid email or password');
				}

				// Check admin access for admin login
				// All non-CLIENT roles can access admin panel
				if (isAdmin) {
					const adminRoles = [
						'SUPER_ADMIN',
						'ADMIN',
						'STAFF',
						'FRONT_DESK',
						'FRONT_DESK_ASSISTANT',
					];
					if (!adminRoles.includes(user.role)) {
						throw new Error(
							'Access denied. Admin privileges required.'
						);
					}
				}

				// Log the login activity
				await prisma.activityLog.create({
					data: {
						userId: user.id,
						action: isAdmin ? 'admin.login' : 'user.login',
						entityType: 'User',
						entityId: user.id,
						metadata: {
							email: user.email,
							role: user.role,
						},
					},
				});

				return {
					id: user.id,
					email: user.email,
					name: user.name,
					role: user.role,
					phone: user.phone,
					company: user.company,
					image: user.avatar,
				};
			},
		}),
	],
});
