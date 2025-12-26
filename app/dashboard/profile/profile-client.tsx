'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
	ArrowLeft,
	Save,
	QrCode,
	Building2,
	Calendar,
	Loader2,
	Download,
	Copy,
	CheckCircle,
} from 'lucide-react';
import { updateProfile, changePassword } from '@/actions';
import { toast } from 'sonner';
import QRCode from 'qrcode';

interface Subscription {
	id: string;
	membershipNumber: string;
	accessCode: string;
	status: string;
	startDate: string;
	endDate: string;
	space: {
		name: string;
		slug: string;
	};
	pricingPlan: {
		name: string;
	};
}

interface User {
	id: string;
	name: string;
	email: string;
	phone: string | null;
	company: string | null;
}

interface ProfileClientProps {
	user: User;
	subscriptions: Subscription[];
}

export function ProfileClient({ user, subscriptions }: ProfileClientProps) {
	const [fullName, setFullName] = useState(user.name);
	const [email] = useState(user.email);
	const [phone, setPhone] = useState(user.phone || '');
	const [company, setCompany] = useState(user.company || '');
	const [isSaving, setIsSaving] = useState(false);
	const [isChangingPassword, setIsChangingPassword] = useState(false);

	// Password fields
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	// QR code states
	const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
	const [loadingQrCodes, setLoadingQrCodes] = useState(true);
	const [copiedCode, setCopiedCode] = useState<string | null>(null);

	// Active subscriptions only
	const activeSubscriptions = subscriptions.filter(
		(sub) => sub.status === 'ACTIVE'
	);

	// Generate QR codes for all active subscriptions
	useEffect(() => {
		const generateQRCodes = async () => {
			const codes: Record<string, string> = {};

			for (const sub of activeSubscriptions) {
				try {
					const qrData = JSON.stringify({
						type: 'membership_checkin',
						membershipNumber: sub.membershipNumber,
						membershipId: sub.id,
						accessCode: sub.accessCode,
					});

					const dataUrl = await QRCode.toDataURL(qrData, {
						width: 200,
						margin: 2,
						color: { dark: '#000000', light: '#ffffff' },
					});
					codes[sub.id] = dataUrl;
				} catch (error) {
					console.error(
						'Failed to generate QR code for',
						sub.id,
						error
					);
				}
			}

			setQrCodes(codes);
			setLoadingQrCodes(false);
		};

		if (activeSubscriptions.length > 0) {
			generateQRCodes();
		} else {
			setLoadingQrCodes(false);
		}
	}, [activeSubscriptions.length]);

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSaving(true);

		try {
			const result = await updateProfile({
				name: fullName,
				phone: phone || undefined,
				company: company || undefined,
			});

			if (result.success) {
				toast.success('Profile updated successfully!');
			} else {
				toast.error(result.error || 'Failed to update profile');
			}
		} catch (error) {
			toast.error('An error occurred while updating profile');
		} finally {
			setIsSaving(false);
		}
	};

	const handlePasswordChange = async (e: React.FormEvent) => {
		e.preventDefault();

		if (newPassword !== confirmPassword) {
			toast.error('New passwords do not match');
			return;
		}

		if (newPassword.length < 8) {
			toast.error('Password must be at least 8 characters');
			return;
		}

		setIsChangingPassword(true);

		try {
			const result = await changePassword(currentPassword, newPassword);

			if (result.success) {
				toast.success('Password changed successfully!');
				setCurrentPassword('');
				setNewPassword('');
				setConfirmPassword('');
			} else {
				toast.error(result.message || 'Failed to change password');
			}
		} catch (error) {
			toast.error('An error occurred while changing password');
		} finally {
			setIsChangingPassword(false);
		}
	};

	const handleCopyAccessCode = (accessCode: string, subId: string) => {
		navigator.clipboard.writeText(accessCode);
		setCopiedCode(subId);
		toast.success('Access code copied!');
		setTimeout(() => setCopiedCode(null), 2000);
	};

	const handleDownloadQR = (dataUrl: string, membershipNumber: string) => {
		const link = document.createElement('a');
		link.href = dataUrl;
		link.download = `amg-membership-${membershipNumber}.png`;
		link.click();
		toast.success('QR code downloaded!');
	};

	return (
		<div className='min-h-screen bg-background'>
			{/* Header */}
			<section className='bg-primary px-4 py-8'>
				<div className='container mx-auto max-w-4xl'>
					<Button
						variant='ghost'
						asChild
						className='mb-4 text-secondary hover:bg-secondary/10'
					>
						<Link href='/dashboard'>
							<ArrowLeft className='mr-2 h-4 w-4' />
							Back to Dashboard
						</Link>
					</Button>
					<h1 className='text-3xl font-bold text-secondary mb-2'>
						Profile Settings
					</h1>
					<p className='text-secondary/80'>
						Manage your account and view your membership QR codes
					</p>
				</div>
			</section>

			<section className='px-4 py-8'>
				<div className='container mx-auto max-w-4xl space-y-6'>
					{/* Membership QR Codes */}
					{activeSubscriptions.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<QrCode className='h-5 w-5' />
									My Membership QR Codes
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className='text-sm text-muted-foreground mb-4'>
									Show these QR codes to staff for quick
									check-in at AMG Workspace.
								</p>
								<div className='grid gap-6 sm:grid-cols-2'>
									{activeSubscriptions.map((sub) => (
										<div
											key={sub.id}
											className='border rounded-lg p-4 bg-card'
										>
											<div className='flex items-center gap-2 mb-3'>
												<Building2 className='h-4 w-4 text-muted-foreground' />
												<span className='font-medium'>
													{sub.space.name}
												</span>
												<Badge
													variant='outline'
													className='text-green-600 border-green-600 ml-auto'
												>
													Active
												</Badge>
											</div>

											<p className='text-sm text-muted-foreground mb-3'>
												{sub.pricingPlan.name}
											</p>

											{/* QR Code */}
											<div className='flex justify-center mb-4'>
												{loadingQrCodes ? (
													<Skeleton className='w-[200px] h-[200px] rounded-lg' />
												) : qrCodes[sub.id] ? (
													<img
														src={qrCodes[sub.id]}
														alt={`QR Code for ${sub.space.name}`}
														className='w-[200px] h-[200px] rounded-lg border'
													/>
												) : (
													<div className='w-[200px] h-[200px] bg-muted rounded-lg flex items-center justify-center'>
														<span className='text-sm text-muted-foreground'>
															QR generation failed
														</span>
													</div>
												)}
											</div>

											{/* Membership Details */}
											<div className='space-y-2 text-sm'>
												<div className='flex justify-between'>
													<span className='text-muted-foreground'>
														Membership #
													</span>
													<span className='font-mono'>
														{sub.membershipNumber}
													</span>
												</div>
												<div className='flex justify-between items-center'>
													<span className='text-muted-foreground'>
														Access Code
													</span>
													<div className='flex items-center gap-2'>
														<code className='bg-muted px-2 py-0.5 rounded text-xs font-mono'>
															{sub.accessCode}
														</code>
														<Button
															variant='ghost'
															size='icon'
															className='h-6 w-6'
															onClick={() =>
																handleCopyAccessCode(
																	sub.accessCode,
																	sub.id
																)
															}
														>
															{copiedCode ===
															sub.id ? (
																<CheckCircle className='h-3 w-3 text-green-600' />
															) : (
																<Copy className='h-3 w-3' />
															)}
														</Button>
													</div>
												</div>
												<div className='flex justify-between'>
													<span className='text-muted-foreground'>
														Valid Until
													</span>
													<span>
														{new Date(
															sub.endDate
														).toLocaleDateString(
															'en-NG',
															{
																day: 'numeric',
																month: 'short',
																year: 'numeric',
															}
														)}
													</span>
												</div>
											</div>

											<Separator className='my-4' />

											{/* Actions */}
											<div className='flex gap-2'>
												{qrCodes[sub.id] && (
													<Button
														variant='outline'
														size='sm'
														className='flex-1'
														onClick={() =>
															handleDownloadQR(
																qrCodes[sub.id],
																sub.membershipNumber
															)
														}
													>
														<Download className='mr-2 h-3 w-3' />
														Download QR
													</Button>
												)}
												<Button
													variant='outline'
													size='sm'
													className='flex-1'
													asChild
												>
													<Link
														href={`/dashboard/subscriptions/${sub.id}`}
													>
														<Calendar className='mr-2 h-3 w-3' />
														View Details
													</Link>
												</Button>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					)}

					{/* No Active Memberships */}
					{activeSubscriptions.length === 0 && (
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<QrCode className='h-5 w-5' />
									Membership QR Codes
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='text-center py-8'>
									<QrCode className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
									<p className='text-muted-foreground mb-4'>
										No active memberships found.
									</p>
									<Button asChild>
										<Link href='/subscription'>
											Get a Membership
										</Link>
									</Button>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Profile Form */}
					<form onSubmit={handleSave}>
						<Card>
							<CardHeader>
								<CardTitle>Personal Information</CardTitle>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='space-y-2'>
									<Label htmlFor='fullName'>Full Name</Label>
									<Input
										id='fullName'
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
										value={email}
										disabled
										className='bg-muted'
									/>
									<p className='text-xs text-muted-foreground'>
										Email cannot be changed. Contact support
										if needed.
									</p>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='phone'>Phone Number</Label>
									<Input
										id='phone'
										type='tel'
										value={phone}
										onChange={(e) =>
											setPhone(e.target.value)
										}
										placeholder='+234 xxx xxx xxxx'
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='company'>
										Company (Optional)
									</Label>
									<Input
										id='company'
										value={company}
										onChange={(e) =>
											setCompany(e.target.value)
										}
										placeholder='Your company name'
									/>
								</div>

								<Button
									type='submit'
									disabled={isSaving}
								>
									{isSaving ? (
										<>
											<Loader2 className='mr-2 h-4 w-4 animate-spin' />
											Saving...
										</>
									) : (
										<>
											<Save className='mr-2 h-4 w-4' />
											Save Changes
										</>
									)}
								</Button>
							</CardContent>
						</Card>
					</form>

					{/* Password Change */}
					<form onSubmit={handlePasswordChange}>
						<Card>
							<CardHeader>
								<CardTitle>Change Password</CardTitle>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='space-y-2'>
									<Label htmlFor='currentPassword'>
										Current Password
									</Label>
									<Input
										id='currentPassword'
										type='password'
										value={currentPassword}
										onChange={(e) =>
											setCurrentPassword(e.target.value)
										}
										required
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='newPassword'>
										New Password
									</Label>
									<Input
										id='newPassword'
										type='password'
										value={newPassword}
										onChange={(e) =>
											setNewPassword(e.target.value)
										}
										required
										minLength={8}
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='confirmNewPassword'>
										Confirm New Password
									</Label>
									<Input
										id='confirmNewPassword'
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
									variant='outline'
									disabled={isChangingPassword}
								>
									{isChangingPassword ? (
										<>
											<Loader2 className='mr-2 h-4 w-4 animate-spin' />
											Changing...
										</>
									) : (
										'Change Password'
									)}
								</Button>
							</CardContent>
						</Card>
					</form>

					{/* Actions */}
					<div className='flex gap-3'>
						<Button
							type='button'
							variant='outline'
							asChild
						>
							<Link href='/dashboard'>Back to Dashboard</Link>
						</Button>
					</div>
				</div>
			</section>
		</div>
	);
}
