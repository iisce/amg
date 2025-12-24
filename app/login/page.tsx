'use client';

import type React from 'react';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { login } from '@/actions';
import { toast } from 'sonner';

export default function LoginPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const callbackUrl =
		searchParams.get('redirect') || searchParams.get('callbackUrl');
	const [isPending, startTransition] = useTransition();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	// Admin roles that should go to /admin
	const ADMIN_ROLES = [
		'SUPER_ADMIN',
		'ADMIN',
		'STAFF',
		'FRONT_DESK',
		'FRONT_DESK_ASSISTANT',
	];

	const handleLogin = (e: React.FormEvent) => {
		e.preventDefault();

		startTransition(async () => {
			const result = await login({ email, password });

			if (result.success) {
				toast.success('Login successful!');

				// Determine redirect based on role
				let redirectUrl = '/dashboard';
				if (result.role && ADMIN_ROLES.includes(result.role)) {
					redirectUrl = '/admin/dashboard';
				}

				// Use callback URL if provided (and it matches role access)
				if (callbackUrl) {
					const isAdminCallback = callbackUrl.startsWith('/admin');
					const isAdminUser =
						result.role && ADMIN_ROLES.includes(result.role);

					// Only use callback if role matches the route type
					if (isAdminCallback && isAdminUser) {
						redirectUrl = callbackUrl;
					} else if (!isAdminCallback && !isAdminUser) {
						redirectUrl = callbackUrl;
					}
				}

				router.push(redirectUrl);
				router.refresh();
			} else {
				toast.error(result.message || 'Login failed');
			}
		});
	};

	return (
		<div className='min-h-screen bg-background flex items-center justify-center px-4 py-12'>
			<div className='w-full max-w-md space-y-6'>
				<div className='text-center'>
					<Button
						variant='ghost'
						asChild
						className='mb-4'
					>
						<Link href='/'>
							<ArrowLeft className='mr-2 h-4 w-4' />
							Back to Home
						</Link>
					</Button>
					<div className='flex justify-center mb-4'>
						<div className='flex h-14 w-14 items-center justify-center rounded-full bg-primary'>
							<span className='text-sm font-bold text-primary-foreground'>
								AMG
							</span>
						</div>
					</div>
					<h1 className='text-2xl font-bold'>Welcome Back</h1>
					<p className='text-muted-foreground mt-2'>
						Sign in to your AMG Workspace account
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Login</CardTitle>
						<CardDescription>
							Enter your credentials to access your dashboard
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form
							onSubmit={handleLogin}
							className='space-y-4'
						>
							<div className='space-y-2'>
								<Label htmlFor='email'>Email Address</Label>
								<Input
									id='email'
									type='email'
									placeholder='you@example.com'
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
								/>
							</div>

							<div className='space-y-2'>
								<div className='flex items-center justify-between'>
									<Label htmlFor='password'>Password</Label>
									<Link
										href='/forgot-password'
										className='text-xs text-primary hover:underline'
									>
										Forgot password?
									</Link>
								</div>
								<Input
									id='password'
									type='password'
									value={password}
									onChange={(e) =>
										setPassword(e.target.value)
									}
									required
								/>
							</div>

							<Button
								type='submit'
								className='w-full'
								disabled={isPending}
							>
								{isPending ? (
									<>
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
										Signing in...
									</>
								) : (
									'Sign In'
								)}
							</Button>
						</form>

						<Separator className='my-6' />

						<div className='text-center text-sm'>
							<span className='text-muted-foreground'>
								Don't have an account?{' '}
							</span>
							<Link
								href={
									callbackUrl
										? `/register?redirect=${encodeURIComponent(
												callbackUrl
										  )}`
										: '/register'
								}
								className='text-primary font-semibold hover:underline'
							>
								Create one
							</Link>
						</div>
					</CardContent>
				</Card>

				<p className='text-center text-xs text-muted-foreground'>
					By continuing, you agree to our{' '}
					<Link
						href='/terms'
						className='underline'
					>
						Terms of Service
					</Link>{' '}
					and{' '}
					<Link
						href='/privacy'
						className='underline'
					>
						Privacy Policy
					</Link>
				</p>
			</div>
		</div>
	);
}
