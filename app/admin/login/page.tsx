'use client';

import type React from 'react';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
import { ArrowLeft, Shield, Loader2 } from 'lucide-react';
import { adminLogin } from '@/actions';
import { toast } from 'sonner';

export default function AdminLoginPage() {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const handleLogin = (e: React.FormEvent) => {
		e.preventDefault();

		startTransition(async () => {
			const result = await adminLogin({ email, password });

			if (result.success) {
				toast.success('Admin login successful!');
				router.push('/admin/dashboard');
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
						<div className='flex h-14 w-14 items-center justify-center rounded-full bg-red-100'>
							<Shield className='h-7 w-7 text-red-600' />
						</div>
					</div>
					<h1 className='text-2xl font-bold'>Admin Access</h1>
					<p className='text-muted-foreground mt-2'>
						Sign in to the admin dashboard
					</p>
				</div>

				<Card className='border-2 border-red-200'>
					<CardHeader>
						<CardTitle>Admin Login</CardTitle>
						<CardDescription>
							Enter your admin credentials to continue
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form
							onSubmit={handleLogin}
							className='space-y-4'
						>
							<div className='space-y-2'>
								<Label htmlFor='email'>Admin Email</Label>
								<Input
									id='email'
									type='email'
									placeholder='admin@amgworkspace.com'
									value={email}
									onChange={(e) => setEmail(e.target.value)}
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

							<Button
								type='submit'
								className='w-full bg-red-600 hover:bg-red-700 text-white'
								disabled={isPending}
							>
								{isPending ? (
									<>
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
										Signing in...
									</>
								) : (
									<>
										<Shield className='mr-2 h-4 w-4' />
										Sign In as Admin
									</>
								)}
							</Button>
						</form>
					</CardContent>
				</Card>

				<p className='text-center text-xs text-muted-foreground'>
					This area is restricted to authorized personnel only.
				</p>
			</div>
		</div>
	);
}
