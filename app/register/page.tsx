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
import { register, login } from '@/actions';
import { toast } from 'sonner';

export default function RegisterPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirectUrl = searchParams.get('redirect') || '/dashboard';
	const [isPending, startTransition] = useTransition();
	const [fullName, setFullName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	const handleRegister = (e: React.FormEvent) => {
		e.preventDefault();

		if (password !== confirmPassword) {
			toast.error('Passwords do not match');
			return;
		}

		if (password.length < 6) {
			toast.error('Password must be at least 6 characters');
			return;
		}

		startTransition(async () => {
			const result = await register({
				name: fullName,
				email,
				phone,
				password,
			});

			if (result.success) {
				// Auto sign in after registration
				const loginResult = await login({ email, password });
				if (loginResult.success) {
					toast.success('Account created successfully!');
					router.push(redirectUrl);
					router.refresh();
				} else {
					// Registration succeeded but auto-login failed, redirect to login
					toast.success('Account created! Please sign in.');
					router.push(
						`/login?redirect=${encodeURIComponent(redirectUrl)}`
					);
				}
			} else {
				toast.error(result.message || 'Registration failed');
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
					<h1 className='text-2xl font-bold'>Create Account</h1>
					<p className='text-muted-foreground mt-2'>
						Join AMG Workspace today
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Register</CardTitle>
						<CardDescription>
							Create your account to start booking spaces
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form
							onSubmit={handleRegister}
							className='space-y-4'
						>
							<div className='space-y-2'>
								<Label htmlFor='fullName'>Full Name</Label>
								<Input
									id='fullName'
									placeholder='John Doe'
									value={fullName}
									onChange={(e) =>
										setFullName(e.target.value)
									}
									required
								/>
							</div>

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
								<Label htmlFor='phone'>Phone Number</Label>
								<Input
									id='phone'
									type='tel'
									placeholder='+234 XXX XXX XXXX'
									value={phone}
									onChange={(e) => setPhone(e.target.value)}
									required
								/>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='password'>Password</Label>
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

							<div className='space-y-2'>
								<Label htmlFor='confirmPassword'>
									Confirm Password
								</Label>
								<Input
									id='confirmPassword'
									type='password'
									value={confirmPassword}
									onChange={(e) =>
										setConfirmPassword(e.target.value)
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
										Creating account...
									</>
								) : (
									'Create Account'
								)}
							</Button>
						</form>

						<Separator className='my-6' />

						<div className='text-center text-sm'>
							<span className='text-muted-foreground'>
								Already have an account?{' '}
							</span>
							<Link
								href={
									redirectUrl !== '/dashboard'
										? `/login?redirect=${encodeURIComponent(
												redirectUrl
										  )}`
										: '/login'
								}
								className='text-primary font-semibold hover:underline'
							>
								Sign in
							</Link>
						</div>
					</CardContent>
				</Card>

				<p className='text-center text-xs text-muted-foreground'>
					By creating an account, you agree to our{' '}
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
