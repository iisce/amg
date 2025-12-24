'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState('');
	const [submitted, setSubmitted] = useState(false);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitted(true);
	};

	return (
		<div className='min-h-screen flex items-center justify-center bg-background px-4 py-12'>
			<div className='w-full max-w-md space-y-6'>
				<Card>
					<CardHeader>
						<CardTitle>Forgot Password</CardTitle>
					</CardHeader>
					<CardContent>
						{submitted ? (
							<div className='text-center space-y-4'>
								<p className='text-green-600 font-semibold'>
									If an account exists, a reset link has been
									sent to your email.
								</p>
								<Button
									asChild
									variant='outline'
								>
									<Link href='/login'>Back to Login</Link>
								</Button>
							</div>
						) : (
							<form
								onSubmit={handleSubmit}
								className='space-y-4'
							>
								<div className='space-y-2'>
									<Label htmlFor='email'>Email Address</Label>
									<Input
										id='email'
										type='email'
										placeholder='you@example.com'
										value={email}
										onChange={(e) =>
											setEmail(e.target.value)
										}
										required
									/>
								</div>
								<Button
									type='submit'
									className='w-full'
								>
									Send Reset Link
								</Button>
							</form>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
