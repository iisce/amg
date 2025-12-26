'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	AlertCircle,
	ArrowLeft,
	BadgeCheck,
	Ban,
	Building2,
	Calendar,
	Check,
	CheckCircle2,
	Clock,
	CreditCard,
	Edit,
	History,
	Key,
	Loader2,
	LogIn,
	LogOut,
	Mail,
	MoreHorizontal,
	Phone,
	Trash2,
	Users,
	X,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
	updateUser,
	toggleUserStatus,
	resetUserPassword,
	deleteUser,
} from '@/actions/users';

// Types
interface UserProfile {
	id: string;
	email: string;
	name: string | null;
	phone: string | null;
	company: string | null;
	avatar: string | null;
	role: string;
	isActive: boolean;
	emailVerified: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

interface Booking {
	id: string;
	bookingNumber: string;
	bookingDate: Date;
	startTime: Date;
	endTime: Date;
	totalAmount: number;
	status: string;
	paymentStatus: string;
	checkInTime: Date | null;
	checkOutTime: Date | null;
	notes: string | null;
	createdAt: Date;
	space: {
		name: string;
	};
	pricingPlan: {
		name: string;
	};
}

interface Membership {
	id: string;
	membershipNumber: string;
	type: string;
	totalAmount: number;
	startDate: Date;
	endDate: Date;
	status: string;
	paymentStatus: string;
	assignedDesk: string | null;
	daysAllowed: number | null;
	autoRenew: boolean;
	createdAt: Date;
	checkIns: CheckIn[];
	maxMembers: number;
	currentOccupancy: number;
	companyName: string | null;
	_count?: {
		teamMembers: number;
	};
	space: {
		name: string;
	};
	pricingPlan: {
		name: string;
	};
}

interface Payment {
	id: string;
	reference: string;
	amount: number;
	method: string;
	status: string;
	paidAt: Date | null;
	createdAt: Date;
}

interface ActivityLogItem {
	id: string;
	action: string;
	entityType: string | null;
	entityId: string | null;
	metadata: Record<string, unknown> | null;
	createdAt: Date;
}

interface CheckIn {
	id: string;
	checkInTime: Date;
	checkOutTime: Date | null;
	notes: string | null;
}

interface MemberDetailClientProps {
	user: UserProfile;
	bookings: Booking[];
	memberships: Membership[];
	payments: Payment[];
	activityLogs: ActivityLogItem[];
	stats: {
		totalBookings: number;
		totalMemberships: number;
		totalSpent: number;
		totalCheckIns: number;
	};
	currentAdmin: {
		role: string;
	};
}

const roleColors: Record<string, string> = {
	CLIENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
	STAFF: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
	FRONT_DESK:
		'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
	FRONT_DESK_ASSISTANT:
		'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
	ADMIN: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
	SUPER_ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const statusColors: Record<string, string> = {
	ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
	PENDING:
		'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
	CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
	CHECKED_IN:
		'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
	COMPLETED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
	CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
	EXPIRED: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
	PAUSED: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
	NO_SHOW: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300',
	SUSPENDED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const paymentStatusColors: Record<string, string> = {
	PAID: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
	PENDING:
		'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
	FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
	REFUNDED:
		'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};

function formatCurrency(kobo: number): string {
	return `₦${(kobo / 100).toLocaleString('en-NG')}`;
}

function formatDate(date: Date): string {
	return new Date(date).toLocaleDateString('en-NG', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}

function formatDateTime(date: Date): string {
	return new Date(date).toLocaleString('en-NG', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function formatTime(date: Date): string {
	return new Date(date).toLocaleTimeString('en-NG', {
		hour: '2-digit',
		minute: '2-digit',
	});
}

function getInitials(name: string | null): string {
	if (!name) return '?';
	return name
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);
}

function getActionLabel(action: string): string {
	const labels: Record<string, string> = {
		'user.login': 'Logged in',
		'user.logout': 'Logged out',
		'user.created': 'Account created',
		'user.updated': 'Profile updated',
		'booking.created': 'Created booking',
		'booking.cancelled': 'Cancelled booking',
		'booking.checked_in': 'Checked in',
		'booking.checked_out': 'Checked out',
		'membership.created': 'Created membership',
		'membership.renewed': 'Renewed membership',
		'membership.cancelled': 'Cancelled membership',
		'payment.completed': 'Payment completed',
		'password.changed': 'Changed password',
		'user.password_reset': 'Password was reset',
	};
	return labels[action] || action.replace(/[._]/g, ' ');
}

export default function MemberDetailClient({
	user,
	bookings,
	memberships,
	payments,
	activityLogs,
	stats,
	currentAdmin,
}: MemberDetailClientProps) {
	const router = useRouter();
	const { toast } = useToast();

	const [loading, setLoading] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [resetPasswordDialogOpen, setResetPasswordDialogOpen] =
		useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	// Edit form state
	const [editForm, setEditForm] = useState({
		name: user.name || '',
		phone: user.phone || '',
		company: user.company || '',
		role: user.role,
	});

	// Password reset state
	const [newPassword, setNewPassword] = useState('');

	const isStaff = [
		'STAFF',
		'FRONT_DESK',
		'FRONT_DESK_ASSISTANT',
		'ADMIN',
		'SUPER_ADMIN',
	].includes(user.role);
	const canEditRole =
		currentAdmin.role === 'SUPER_ADMIN' || currentAdmin.role === 'ADMIN';
	const canDelete = currentAdmin.role === 'SUPER_ADMIN';

	const handleToggleStatus = async () => {
		setLoading(true);
		try {
			const result = await toggleUserStatus(user.id);
			if (result.success) {
				toast({
					title: 'Success',
					description: result.message,
				});
				router.refresh();
			} else {
				toast({
					title: 'Error',
					description: result.message,
					variant: 'destructive',
				});
			}
		} catch {
			toast({
				title: 'Error',
				description: 'Failed to update user status',
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	};

	const handleUpdateUser = async () => {
		setLoading(true);
		try {
			const updateData: Record<string, string> = {
				name: editForm.name,
				phone: editForm.phone,
				company: editForm.company,
			};
			if (canEditRole) {
				updateData.role = editForm.role;
			}

			const result = await updateUser(user.id, updateData);
			if (result.success) {
				toast({
					title: 'Success',
					description: 'User updated successfully',
				});
				setEditDialogOpen(false);
				router.refresh();
			} else {
				toast({
					title: 'Error',
					description: result.message,
					variant: 'destructive',
				});
			}
		} catch {
			toast({
				title: 'Error',
				description: 'Failed to update user',
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	};

	const handleResetPassword = async () => {
		if (!newPassword || newPassword.length < 8) {
			toast({
				title: 'Error',
				description: 'Password must be at least 8 characters',
				variant: 'destructive',
			});
			return;
		}

		setLoading(true);
		try {
			const result = await resetUserPassword(user.id, newPassword);
			if (result.success) {
				toast({
					title: 'Success',
					description: 'Password reset successfully',
				});
				setResetPasswordDialogOpen(false);
				setNewPassword('');
			} else {
				toast({
					title: 'Error',
					description: result.message,
					variant: 'destructive',
				});
			}
		} catch {
			toast({
				title: 'Error',
				description: 'Failed to reset password',
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteUser = async () => {
		setLoading(true);
		try {
			const result = await deleteUser(user.id);
			if (result.success) {
				toast({
					title: 'Success',
					description: 'User deleted successfully',
				});
				router.push('/admin/members');
			} else {
				toast({
					title: 'Error',
					description: result.message,
					variant: 'destructive',
				});
			}
		} catch {
			toast({
				title: 'Error',
				description: 'Failed to delete user',
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	};

	// Calculate total check-ins from all memberships
	const allCheckIns = memberships
		.flatMap((m) =>
			m.checkIns.map((c) => ({
				...c,
				membershipNumber: m.membershipNumber,
				spaceName: m.space.name,
			}))
		)
		.sort(
			(a, b) =>
				new Date(b.checkInTime).getTime() -
				new Date(a.checkInTime).getTime()
		);

	return (
		<div className='container mx-auto py-6 space-y-6 max-w-7xl'>
			{/* Header */}
			<div className='flex items-center gap-4'>
				<Button
					variant='ghost'
					size='icon'
					onClick={() => router.back()}
				>
					<ArrowLeft className='h-5 w-5' />
				</Button>
				<div className='flex-1'>
					<h1 className='text-2xl font-bold'>
						{isStaff ? 'Staff Details' : 'Member Details'}
					</h1>
					<p className='text-muted-foreground'>
						View and manage {isStaff ? 'staff' : 'member'}{' '}
						information
					</p>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant='outline'
							disabled={loading}
						>
							{loading ? (
								<Loader2 className='h-4 w-4 animate-spin' />
							) : (
								<MoreHorizontal className='h-4 w-4' />
							)}
							<span className='ml-2'>Actions</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align='end'
						className='w-48'
					>
						<DropdownMenuItem
							onClick={() => setEditDialogOpen(true)}
						>
							<Edit className='h-4 w-4 mr-2' />
							Edit Profile
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => setResetPasswordDialogOpen(true)}
						>
							<Key className='h-4 w-4 mr-2' />
							Reset Password
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={handleToggleStatus}>
							{user.isActive ? (
								<>
									<Ban className='h-4 w-4 mr-2' />
									Suspend User
								</>
							) : (
								<>
									<CheckCircle2 className='h-4 w-4 mr-2' />
									Activate User
								</>
							)}
						</DropdownMenuItem>
						{canDelete && (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => setDeleteDialogOpen(true)}
									className='text-destructive focus:text-destructive'
								>
									<Trash2 className='h-4 w-4 mr-2' />
									Delete User
								</DropdownMenuItem>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Profile Card */}
			<Card>
				<CardContent className='pt-6'>
					<div className='flex flex-col md:flex-row gap-6'>
						{/* Avatar and Basic Info */}
						<div className='flex flex-col items-center md:items-start gap-4'>
							<Avatar className='h-24 w-24'>
								<AvatarImage src={user.avatar || undefined} />
								<AvatarFallback className='text-2xl bg-primary/10'>
									{getInitials(user.name)}
								</AvatarFallback>
							</Avatar>
							<div className='text-center md:text-left'>
								<h2 className='text-xl font-semibold'>
									{user.name || 'Unnamed'}
								</h2>
								<p className='text-muted-foreground'>
									{user.email}
								</p>
								<div className='flex items-center gap-2 mt-2 justify-center md:justify-start'>
									<Badge
										className={roleColors[user.role] || ''}
									>
										{user.role.replace(/_/g, ' ')}
									</Badge>
									<Badge
										variant={
											user.isActive
												? 'default'
												: 'secondary'
										}
									>
										{user.isActive ? 'Active' : 'Inactive'}
									</Badge>
									{user.emailVerified && (
										<Badge
											variant='outline'
											className='gap-1'
										>
											<BadgeCheck className='h-3 w-3' />
											Verified
										</Badge>
									)}
								</div>
							</div>
						</div>

						{/* Contact Info */}
						<div className='flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4'>
							<div className='flex items-center gap-3 p-3 rounded-lg bg-muted/50'>
								<Mail className='h-5 w-5 text-muted-foreground' />
								<div>
									<p className='text-xs text-muted-foreground'>
										Email
									</p>
									<p className='font-medium'>{user.email}</p>
								</div>
							</div>
							<div className='flex items-center gap-3 p-3 rounded-lg bg-muted/50'>
								<Phone className='h-5 w-5 text-muted-foreground' />
								<div>
									<p className='text-xs text-muted-foreground'>
										Phone
									</p>
									<p className='font-medium'>
										{user.phone || 'Not provided'}
									</p>
								</div>
							</div>
							<div className='flex items-center gap-3 p-3 rounded-lg bg-muted/50'>
								<Building2 className='h-5 w-5 text-muted-foreground' />
								<div>
									<p className='text-xs text-muted-foreground'>
										Company
									</p>
									<p className='font-medium'>
										{user.company || 'Not provided'}
									</p>
								</div>
							</div>
							<div className='flex items-center gap-3 p-3 rounded-lg bg-muted/50'>
								<Calendar className='h-5 w-5 text-muted-foreground' />
								<div>
									<p className='text-xs text-muted-foreground'>
										Member Since
									</p>
									<p className='font-medium'>
										{formatDate(user.createdAt)}
									</p>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Stats Cards */}
			<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
				<Card>
					<CardContent className='pt-6'>
						<div className='flex items-center gap-3'>
							<div className='p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30'>
								<Calendar className='h-5 w-5 text-blue-600 dark:text-blue-400' />
							</div>
							<div>
								<p className='text-2xl font-bold'>
									{stats.totalBookings}
								</p>
								<p className='text-xs text-muted-foreground'>
									Total Bookings
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className='pt-6'>
						<div className='flex items-center gap-3'>
							<div className='p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30'>
								<Users className='h-5 w-5 text-purple-600 dark:text-purple-400' />
							</div>
							<div>
								<p className='text-2xl font-bold'>
									{stats.totalMemberships}
								</p>
								<p className='text-xs text-muted-foreground'>
									Memberships
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className='pt-6'>
						<div className='flex items-center gap-3'>
							<div className='p-2 rounded-lg bg-green-100 dark:bg-green-900/30'>
								<CreditCard className='h-5 w-5 text-green-600 dark:text-green-400' />
							</div>
							<div>
								<p className='text-2xl font-bold'>
									{formatCurrency(stats.totalSpent)}
								</p>
								<p className='text-xs text-muted-foreground'>
									Total Spent
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className='pt-6'>
						<div className='flex items-center gap-3'>
							<div className='p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30'>
								<LogIn className='h-5 w-5 text-amber-600 dark:text-amber-400' />
							</div>
							<div>
								<p className='text-2xl font-bold'>
									{stats.totalCheckIns}
								</p>
								<p className='text-xs text-muted-foreground'>
									Total Check-ins
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Tabs Section */}
			<Tabs
				defaultValue='memberships'
				className='space-y-4'
			>
				<TabsList className='grid grid-cols-5 w-full max-w-2xl'>
					<TabsTrigger
						value='memberships'
						className='gap-2'
					>
						<Users className='h-4 w-4' />
						<span className='hidden sm:inline'>Memberships</span>
					</TabsTrigger>
					<TabsTrigger
						value='bookings'
						className='gap-2'
					>
						<Calendar className='h-4 w-4' />
						<span className='hidden sm:inline'>Bookings</span>
					</TabsTrigger>
					<TabsTrigger
						value='checkins'
						className='gap-2'
					>
						<LogIn className='h-4 w-4' />
						<span className='hidden sm:inline'>Check-ins</span>
					</TabsTrigger>
					<TabsTrigger
						value='payments'
						className='gap-2'
					>
						<CreditCard className='h-4 w-4' />
						<span className='hidden sm:inline'>Payments</span>
					</TabsTrigger>
					<TabsTrigger
						value='activity'
						className='gap-2'
					>
						<History className='h-4 w-4' />
						<span className='hidden sm:inline'>Activity</span>
					</TabsTrigger>
				</TabsList>

				{/* Memberships Tab */}
				<TabsContent value='memberships'>
					<Card>
						<CardHeader>
							<CardTitle>Membership History</CardTitle>
							<CardDescription>
								All memberships and subscriptions for this{' '}
								{isStaff ? 'staff member' : 'member'}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{memberships.length === 0 ? (
								<div className='text-center py-8 text-muted-foreground'>
									<Users className='h-12 w-12 mx-auto mb-3 opacity-20' />
									<p>No memberships found</p>
								</div>
							) : (
								<div className='space-y-4'>
									{memberships.map((membership) => (
										<div
											key={membership.id}
											className='border rounded-lg p-4 space-y-3'
										>
											<div className='flex items-start justify-between'>
												<div>
													<div className='flex items-center gap-2'>
														<h3 className='font-semibold'>
															{
																membership.space
																	.name
															}
														</h3>
														<Badge
															className={
																statusColors[
																	membership
																		.status
																] || ''
															}
														>
															{membership.status}
														</Badge>
													</div>
													<p className='text-sm text-muted-foreground'>
														{
															membership.membershipNumber
														}{' '}
														•{' '}
														{
															membership
																.pricingPlan
																.name
														}
													</p>
												</div>
												<div className='text-right'>
													<p className='font-semibold'>
														{formatCurrency(
															membership.totalAmount
														)}
													</p>
													<Badge
														variant='outline'
														className={
															paymentStatusColors[
																membership
																	.paymentStatus
															] || ''
														}
													>
														{
															membership.paymentStatus
														}
													</Badge>
												</div>
											</div>
											<Separator />
											<div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
												<div>
													<p className='text-muted-foreground'>
														Type
													</p>
													<p className='font-medium'>
														{membership.type}
													</p>
												</div>
												<div>
													<p className='text-muted-foreground'>
														Period
													</p>
													<p className='font-medium'>
														{formatDate(
															membership.startDate
														)}{' '}
														-{' '}
														{formatDate(
															membership.endDate
														)}
													</p>
												</div>
												{membership.assignedDesk && (
													<div>
														<p className='text-muted-foreground'>
															Assigned Desk
														</p>
														<p className='font-medium'>
															{
																membership.assignedDesk
															}
														</p>
													</div>
												)}
												<div>
													<p className='text-muted-foreground'>
														Check-ins
													</p>
													<p className='font-medium'>
														{
															membership.checkIns
																.length
														}
														{membership.daysAllowed
															? ` / ${membership.daysAllowed} days`
															: ''}
													</p>
												</div>
												<div>
													<p className='text-muted-foreground'>
														Auto-Renew
													</p>
													<p className='font-medium'>
														{membership.autoRenew ? (
															<span className='text-green-600 flex items-center gap-1'>
																<Check className='h-4 w-4' />{' '}
																Enabled
															</span>
														) : (
															<span className='text-muted-foreground flex items-center gap-1'>
																<X className='h-4 w-4' />{' '}
																Disabled
															</span>
														)}
													</p>
												</div>
												{membership.maxMembers > 1 && (
													<div>
														<p className='text-muted-foreground'>
															Team Members
														</p>
														<p className='font-medium flex items-center gap-1'>
															<Users className='h-4 w-4' />
															{membership._count
																?.teamMembers ||
																0}{' '}
															/{' '}
															{
																membership.maxMembers
															}
															{membership.currentOccupancy >
																0 && (
																<Badge
																	variant='secondary'
																	className='ml-2 text-xs'
																>
																	{
																		membership.currentOccupancy
																	}{' '}
																	present
																</Badge>
															)}
														</p>
													</div>
												)}
											</div>
											{membership.maxMembers > 1 && (
												<>
													<Separator />
													<div className='flex items-center justify-between pt-2'>
														<div className='text-sm'>
															{membership.companyName && (
																<span className='text-muted-foreground'>
																	Company:{' '}
																	<span className='font-medium text-foreground'>
																		{
																			membership.companyName
																		}
																	</span>
																</span>
															)}
														</div>
														<Button
															variant='outline'
															size='sm'
															onClick={() =>
																router.push(
																	`/admin/members/${user.id}/team/${membership.id}`
																)
															}
														>
															<Users className='h-4 w-4 mr-2' />
															Manage Team
														</Button>
													</div>
												</>
											)}
											{membership.maxMembers === 1 &&
												membership.status ===
													'ACTIVE' && (
													<>
														<Separator />
														<div className='flex items-center justify-between pt-2'>
															<p className='text-sm text-muted-foreground'>
																Enable team
																membership to
																allow multiple
																people to use
																this
																subscription
															</p>
															<Button
																variant='outline'
																size='sm'
																onClick={() =>
																	router.push(
																		`/admin/members/${user.id}/team/${membership.id}`
																	)
																}
															>
																<Users className='h-4 w-4 mr-2' />
																Enable Team
															</Button>
														</div>
													</>
												)}
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Bookings Tab */}
				<TabsContent value='bookings'>
					<Card>
						<CardHeader>
							<CardTitle>Booking History</CardTitle>
							<CardDescription>
								All space bookings made by this{' '}
								{isStaff ? 'staff member' : 'member'}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{bookings.length === 0 ? (
								<div className='text-center py-8 text-muted-foreground'>
									<Calendar className='h-12 w-12 mx-auto mb-3 opacity-20' />
									<p>No bookings found</p>
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Booking #</TableHead>
											<TableHead>Space</TableHead>
											<TableHead>Date & Time</TableHead>
											<TableHead>Amount</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Payment</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{bookings.map((booking) => (
											<TableRow key={booking.id}>
												<TableCell className='font-medium'>
													{booking.bookingNumber}
												</TableCell>
												<TableCell>
													<div>
														<p>
															{booking.space.name}
														</p>
														<p className='text-xs text-muted-foreground'>
															{
																booking
																	.pricingPlan
																	.name
															}
														</p>
													</div>
												</TableCell>
												<TableCell>
													<div>
														<p>
															{formatDate(
																booking.bookingDate
															)}
														</p>
														<p className='text-xs text-muted-foreground'>
															{formatTime(
																booking.startTime
															)}{' '}
															-{' '}
															{formatTime(
																booking.endTime
															)}
														</p>
													</div>
												</TableCell>
												<TableCell>
													{formatCurrency(
														booking.totalAmount
													)}
												</TableCell>
												<TableCell>
													<Badge
														className={
															statusColors[
																booking.status
															] || ''
														}
													>
														{booking.status.replace(
															/_/g,
															' '
														)}
													</Badge>
												</TableCell>
												<TableCell>
													<Badge
														variant='outline'
														className={
															paymentStatusColors[
																booking
																	.paymentStatus
															] || ''
														}
													>
														{booking.paymentStatus}
													</Badge>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Check-ins Tab */}
				<TabsContent value='checkins'>
					<Card>
						<CardHeader>
							<CardTitle>Check-in History</CardTitle>
							<CardDescription>
								Attendance records for membership check-ins
							</CardDescription>
						</CardHeader>
						<CardContent>
							{allCheckIns.length === 0 ? (
								<div className='text-center py-8 text-muted-foreground'>
									<LogIn className='h-12 w-12 mx-auto mb-3 opacity-20' />
									<p>No check-in records found</p>
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Date</TableHead>
											<TableHead>Space</TableHead>
											<TableHead>Membership</TableHead>
											<TableHead>Check-in</TableHead>
											<TableHead>Check-out</TableHead>
											<TableHead>Duration</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{allCheckIns.map((checkIn) => {
											const duration =
												checkIn.checkOutTime
													? Math.round(
															(new Date(
																checkIn.checkOutTime
															).getTime() -
																new Date(
																	checkIn.checkInTime
																).getTime()) /
																(1000 * 60)
													  )
													: null;
											return (
												<TableRow key={checkIn.id}>
													<TableCell>
														{formatDate(
															checkIn.checkInTime
														)}
													</TableCell>
													<TableCell>
														{checkIn.spaceName}
													</TableCell>
													<TableCell className='font-mono text-xs'>
														{
															checkIn.membershipNumber
														}
													</TableCell>
													<TableCell>
														<div className='flex items-center gap-1 text-green-600'>
															<LogIn className='h-3 w-3' />
															{formatTime(
																checkIn.checkInTime
															)}
														</div>
													</TableCell>
													<TableCell>
														{checkIn.checkOutTime ? (
															<div className='flex items-center gap-1 text-red-600'>
																<LogOut className='h-3 w-3' />
																{formatTime(
																	checkIn.checkOutTime
																)}
															</div>
														) : (
															<Badge variant='outline'>
																Still in
															</Badge>
														)}
													</TableCell>
													<TableCell>
														{duration !== null ? (
															<span>
																{Math.floor(
																	duration /
																		60
																)}
																h{' '}
																{duration % 60}m
															</span>
														) : (
															<span className='text-muted-foreground'>
																-
															</span>
														)}
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Payments Tab */}
				<TabsContent value='payments'>
					<Card>
						<CardHeader>
							<CardTitle>Payment History</CardTitle>
							<CardDescription>
								All payment transactions for this{' '}
								{isStaff ? 'staff member' : 'member'}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{payments.length === 0 ? (
								<div className='text-center py-8 text-muted-foreground'>
									<CreditCard className='h-12 w-12 mx-auto mb-3 opacity-20' />
									<p>No payments found</p>
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Reference</TableHead>
											<TableHead>Date</TableHead>
											<TableHead>Method</TableHead>
											<TableHead>Amount</TableHead>
											<TableHead>Status</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{payments.map((payment) => (
											<TableRow key={payment.id}>
												<TableCell className='font-mono text-xs'>
													{payment.reference}
												</TableCell>
												<TableCell>
													{payment.paidAt
														? formatDateTime(
																payment.paidAt
														  )
														: formatDateTime(
																payment.createdAt
														  )}
												</TableCell>
												<TableCell>
													<Badge variant='outline'>
														{payment.method}
													</Badge>
												</TableCell>
												<TableCell className='font-semibold'>
													{formatCurrency(
														payment.amount
													)}
												</TableCell>
												<TableCell>
													<Badge
														className={
															paymentStatusColors[
																payment.status
															] || ''
														}
													>
														{payment.status}
													</Badge>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Activity Tab */}
				<TabsContent value='activity'>
					<Card>
						<CardHeader>
							<CardTitle>Activity Log</CardTitle>
							<CardDescription>
								Recent actions and events for this{' '}
								{isStaff ? 'staff member' : 'member'}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{activityLogs.length === 0 ? (
								<div className='text-center py-8 text-muted-foreground'>
									<History className='h-12 w-12 mx-auto mb-3 opacity-20' />
									<p>No activity recorded</p>
								</div>
							) : (
								<div className='space-y-4'>
									{activityLogs.map((log) => (
										<div
											key={log.id}
											className='flex items-start gap-4 border-b pb-4 last:border-0'
										>
											<div className='p-2 rounded-full bg-muted'>
												{log.action.includes(
													'login'
												) ? (
													<LogIn className='h-4 w-4' />
												) : log.action.includes(
														'logout'
												  ) ? (
													<LogOut className='h-4 w-4' />
												) : log.action.includes(
														'booking'
												  ) ? (
													<Calendar className='h-4 w-4' />
												) : log.action.includes(
														'membership'
												  ) ? (
													<Users className='h-4 w-4' />
												) : log.action.includes(
														'payment'
												  ) ? (
													<CreditCard className='h-4 w-4' />
												) : log.action.includes(
														'password'
												  ) ? (
													<Key className='h-4 w-4' />
												) : (
													<Clock className='h-4 w-4' />
												)}
											</div>
											<div className='flex-1 min-w-0'>
												<p className='font-medium'>
													{getActionLabel(log.action)}
												</p>
												{log.entityType &&
													log.entityId && (
														<p className='text-sm text-muted-foreground'>
															{log.entityType}:{' '}
															{log.entityId.slice(
																0,
																8
															)}
															...
														</p>
													)}
												<p className='text-xs text-muted-foreground mt-1'>
													{formatDateTime(
														log.createdAt
													)}
												</p>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Edit Profile Dialog */}
			<Dialog
				open={editDialogOpen}
				onOpenChange={setEditDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Profile</DialogTitle>
						<DialogDescription>
							Update {isStaff ? 'staff' : 'member'} information
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4 py-4'>
						<div className='space-y-2'>
							<Label htmlFor='name'>Full Name</Label>
							<Input
								id='name'
								value={editForm.name}
								onChange={(e) =>
									setEditForm({
										...editForm,
										name: e.target.value,
									})
								}
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='phone'>Phone Number</Label>
							<Input
								id='phone'
								value={editForm.phone}
								onChange={(e) =>
									setEditForm({
										...editForm,
										phone: e.target.value,
									})
								}
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='company'>Company</Label>
							<Input
								id='company'
								value={editForm.company}
								onChange={(e) =>
									setEditForm({
										...editForm,
										company: e.target.value,
									})
								}
							/>
						</div>
						{canEditRole && (
							<div className='space-y-2'>
								<Label htmlFor='role'>Role</Label>
								<Select
									value={editForm.role}
									onValueChange={(value) =>
										setEditForm({
											...editForm,
											role: value,
										})
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='CLIENT'>
											Client
										</SelectItem>
										<SelectItem value='STAFF'>
											Staff
										</SelectItem>
										<SelectItem value='FRONT_DESK'>
											Front Desk
										</SelectItem>
										<SelectItem value='FRONT_DESK_ASSISTANT'>
											Front Desk Assistant
										</SelectItem>
										<SelectItem value='ADMIN'>
											Admin
										</SelectItem>
										{currentAdmin.role ===
											'SUPER_ADMIN' && (
											<SelectItem value='SUPER_ADMIN'>
												Super Admin
											</SelectItem>
										)}
									</SelectContent>
								</Select>
							</div>
						)}
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setEditDialogOpen(false)}
							disabled={loading}
						>
							Cancel
						</Button>
						<Button
							onClick={handleUpdateUser}
							disabled={loading}
						>
							{loading && (
								<Loader2 className='h-4 w-4 mr-2 animate-spin' />
							)}
							Save Changes
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Reset Password Dialog */}
			<Dialog
				open={resetPasswordDialogOpen}
				onOpenChange={setResetPasswordDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reset Password</DialogTitle>
						<DialogDescription>
							Set a new password for this{' '}
							{isStaff ? 'staff member' : 'member'}. They will be
							logged out of all sessions.
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4 py-4'>
						<div className='space-y-2'>
							<Label htmlFor='newPassword'>New Password</Label>
							<Input
								id='newPassword'
								type='password'
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								placeholder='Minimum 8 characters'
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => {
								setResetPasswordDialogOpen(false);
								setNewPassword('');
							}}
							disabled={loading}
						>
							Cancel
						</Button>
						<Button
							onClick={handleResetPassword}
							disabled={loading}
						>
							{loading && (
								<Loader2 className='h-4 w-4 mr-2 animate-spin' />
							)}
							Reset Password
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2 text-destructive'>
							<AlertCircle className='h-5 w-5' />
							Delete User
						</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this user? This
							action will deactivate their account and log them
							out of all sessions.
						</DialogDescription>
					</DialogHeader>
					<div className='py-4'>
						<div className='flex items-center gap-3 p-4 rounded-lg bg-destructive/10'>
							<Avatar>
								<AvatarImage src={user.avatar || undefined} />
								<AvatarFallback>
									{getInitials(user.name)}
								</AvatarFallback>
							</Avatar>
							<div>
								<p className='font-medium'>{user.name}</p>
								<p className='text-sm text-muted-foreground'>
									{user.email}
								</p>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setDeleteDialogOpen(false)}
							disabled={loading}
						>
							Cancel
						</Button>
						<Button
							variant='destructive'
							onClick={handleDeleteUser}
							disabled={loading}
						>
							{loading && (
								<Loader2 className='h-4 w-4 mr-2 animate-spin' />
							)}
							Delete User
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
