'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
	Building2,
	CheckCircle2,
	XCircle,
	Loader2,
	LogIn,
	UserPlus,
} from 'lucide-react';
import {
	verifyInvitationToken,
	acceptTeamMemberInvitation,
} from '@/actions/subscriptions';

const registerSchema = z
	.object({
		name: z.string().min(2, 'Name must be at least 2 characters'),
		password: z.string().min(8, 'Password must be at least 8 characters'),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword'],
	});

type RegisterFormData = z.infer<typeof registerSchema>;

interface InvitationData {
	memberName: string;
	memberEmail: string | null;
	spaceName: string;
	companyName: string | null;
	ownerName: string;
	isExpired: boolean;
}

export default function TeamInvitePage() {
	const params = useParams();
	const router = useRouter();
	const { toast } = useToast();
	const token = params.token as string;

	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [invitationData, setInvitationData] = useState<InvitationData | null>(
		null
	);
	const [success, setSuccess] = useState(false);

	const form = useForm<RegisterFormData>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			name: '',
			password: '',
			confirmPassword: '',
		},
	});

	useEffect(() => {
		const verify = async () => {
			setLoading(true);
			const result = await verifyInvitationToken(token);

			if (result.success && result.data) {
				setInvitationData(result.data);
				form.setValue('name', result.data.memberName);
			} else {
				setError(result.message);
			}
			setLoading(false);
		};

		if (token) {
			verify();
		}
	}, [token, form]);

	const handleAcceptWithLogin = async () => {
		setSubmitting(true);
		const result = await acceptTeamMemberInvitation(token);

		if (result.success) {
			if (result.data?.invitationToken) {
				// User not logged in, show registration form or login option
				toast({
					title: 'Please log in or create an account',
					description:
						'You need to be logged in to accept this invitation.',
				});
			} else {
				setSuccess(true);
				toast({
					title: 'Success!',
					description: result.message,
				});
			}
		} else {
			toast({
				title: 'Error',
				description: result.message,
				variant: 'destructive',
			});
		}
		setSubmitting(false);
	};

	const handleRegister = async (data: RegisterFormData) => {
		setSubmitting(true);
		const result = await acceptTeamMemberInvitation(token, {
			name: data.name,
			password: data.password,
		});

		if (result.success) {
			setSuccess(true);
			toast({
				title: 'Welcome to the team!',
				description:
					'Your account has been created. You can now log in.',
			});
		} else {
			toast({
				title: 'Error',
				description: result.message,
				variant: 'destructive',
			});
		}
		setSubmitting(false);
	};

	if (loading) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4'>
				<Card className='max-w-md w-full'>
					<CardHeader className='text-center'>
						<Skeleton className='h-12 w-12 rounded-full mx-auto mb-4' />
						<Skeleton className='h-6 w-48 mx-auto' />
						<Skeleton className='h-4 w-64 mx-auto mt-2' />
					</CardHeader>
					<CardContent className='space-y-4'>
						<Skeleton className='h-10 w-full' />
						<Skeleton className='h-10 w-full' />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (error) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4'>
				<Card className='max-w-md w-full'>
					<CardHeader className='text-center'>
						<div className='mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4'>
							<XCircle className='h-8 w-8 text-red-600' />
						</div>
						<CardTitle>Invalid Invitation</CardTitle>
						<CardDescription>{error}</CardDescription>
					</CardHeader>
					<CardContent className='text-center space-y-4'>
						<p className='text-sm text-muted-foreground'>
							This invitation link may have expired or already
							been used. Please contact the team owner to request
							a new invitation.
						</p>
						<Button
							asChild
							variant='outline'
						>
							<Link href='/login'>Go to Login</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (success) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4'>
				<Card className='max-w-md w-full'>
					<CardHeader className='text-center'>
						<div className='mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4'>
							<CheckCircle2 className='h-8 w-8 text-green-600' />
						</div>
						<CardTitle>Welcome to the Team!</CardTitle>
						<CardDescription>
							You&apos;ve successfully joined{' '}
							{invitationData?.companyName ||
								invitationData?.spaceName}
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='text-center text-sm text-muted-foreground'>
							<p>You can now:</p>
							<ul className='mt-2 space-y-1'>
								<li>✓ Check in using your personal QR code</li>
								<li>✓ View your attendance history</li>
								<li>✓ Access team workspace benefits</li>
							</ul>
						</div>
						<div className='flex gap-2'>
							<Button
								asChild
								className='flex-1'
							>
								<Link href='/login'>Log In</Link>
							</Button>
							<Button
								asChild
								variant='outline'
								className='flex-1'
							>
								<Link href='/dashboard'>Dashboard</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (invitationData?.isExpired) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4'>
				<Card className='max-w-md w-full'>
					<CardHeader className='text-center'>
						<div className='mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4'>
							<XCircle className='h-8 w-8 text-yellow-600' />
						</div>
						<CardTitle>Invitation Expired</CardTitle>
						<CardDescription>
							This invitation from {invitationData.ownerName} has
							expired.
						</CardDescription>
					</CardHeader>
					<CardContent className='text-center space-y-4'>
						<p className='text-sm text-muted-foreground'>
							Please contact {invitationData.ownerName} to request
							a new invitation.
						</p>
						<Button
							asChild
							variant='outline'
						>
							<Link href='/'>Go Home</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	const teamName = invitationData?.companyName || invitationData?.spaceName;

	return (
		<div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4'>
			<Card className='max-w-md w-full'>
				<CardHeader className='text-center'>
					<div className='mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4'>
						<Building2 className='h-8 w-8 text-primary' />
					</div>
					<CardTitle>Join {teamName}</CardTitle>
					<CardDescription>
						{invitationData?.ownerName} has invited you to join
						their workspace team
					</CardDescription>
				</CardHeader>
				<CardContent className='space-y-6'>
					{/* Invitation Details */}
					<div className='bg-muted/50 rounded-lg p-4 space-y-2'>
						<div className='flex justify-between items-center'>
							<span className='text-sm text-muted-foreground'>
								Team
							</span>
							<span className='font-medium'>{teamName}</span>
						</div>
						<div className='flex justify-between items-center'>
							<span className='text-sm text-muted-foreground'>
								Workspace
							</span>
							<span className='font-medium'>
								{invitationData?.spaceName}
							</span>
						</div>
						<div className='flex justify-between items-center'>
							<span className='text-sm text-muted-foreground'>
								Invited by
							</span>
							<span className='font-medium'>
								{invitationData?.ownerName}
							</span>
						</div>
						{invitationData?.memberEmail && (
							<div className='flex justify-between items-center'>
								<span className='text-sm text-muted-foreground'>
									Email
								</span>
								<Badge variant='secondary'>
									{invitationData.memberEmail}
								</Badge>
							</div>
						)}
					</div>

					{/* Options */}
					<div className='space-y-4'>
						<div className='text-center'>
							<p className='text-sm text-muted-foreground mb-4'>
								Already have an AMG Workspace account?
							</p>
							<Button
								onClick={handleAcceptWithLogin}
								disabled={submitting}
								className='w-full'
							>
								{submitting ? (
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
								) : (
									<LogIn className='mr-2 h-4 w-4' />
								)}
								Log In & Accept Invitation
							</Button>
						</div>

						<div className='relative'>
							<div className='absolute inset-0 flex items-center'>
								<span className='w-full border-t' />
							</div>
							<div className='relative flex justify-center text-xs uppercase'>
								<span className='bg-background px-2 text-muted-foreground'>
									Or create a new account
								</span>
							</div>
						</div>

						{/* Registration Form */}
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(handleRegister)}
								className='space-y-4'
							>
								<FormField
									control={form.control}
									name='name'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Full Name</FormLabel>
											<FormControl>
												<Input
													placeholder='Your name'
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{invitationData?.memberEmail && (
									<div>
										<FormLabel>Email</FormLabel>
										<Input
											value={invitationData.memberEmail}
											disabled
											className='mt-1.5'
										/>
										<p className='text-xs text-muted-foreground mt-1'>
											Your account will be created with
											this email
										</p>
									</div>
								)}

								<FormField
									control={form.control}
									name='password'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Password</FormLabel>
											<FormControl>
												<Input
													type='password'
													placeholder='Create a password'
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name='confirmPassword'
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Confirm Password
											</FormLabel>
											<FormControl>
												<Input
													type='password'
													placeholder='Confirm your password'
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<Button
									type='submit'
									disabled={submitting}
									variant='outline'
									className='w-full'
								>
									{submitting ? (
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									) : (
										<UserPlus className='mr-2 h-4 w-4' />
									)}
									Create Account & Join Team
								</Button>
							</form>
						</Form>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
