'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, differenceInDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Users,
	Search,
	MoreHorizontal,
	Eye,
	RefreshCw,
	XCircle,
	Pause,
	Play,
	Clock,
	CreditCard,
	AlertTriangle,
	CheckCircle,
	Ban,
	Timer,
	Download,
	Building2,
	DollarSign,
} from 'lucide-react';
import { AdminNavigation } from '@/components/admin/admin-navigation';
import { toast } from 'sonner';
import type { MembershipWithRelations } from '@/actions/subscriptions';
import type { MembershipStatus } from '@prisma/client';
import {
	cancelSubscription,
	pauseSubscription,
	resumeSubscription,
} from '@/actions';
import { formatNaira, koboToNaira } from '@/lib/utils/format';

// ============================================
// TYPES
// ============================================

interface Space {
	id: string;
	name: string;
	slug: string;
}

interface AdminMembershipsClientProps {
	memberships: MembershipWithRelations[];
	spaces: Space[];
	currentUserRole: string;
}

// ============================================
// CONSTANTS
// ============================================

const STATUS_CONFIG: Record<
	MembershipStatus | 'SUSPENDED',
	{
		label: string;
		variant: 'default' | 'secondary' | 'destructive' | 'outline';
		icon: typeof CheckCircle;
	}
> = {
	ACTIVE: { label: 'Active', variant: 'default', icon: CheckCircle },
	PENDING: { label: 'Pending', variant: 'outline', icon: Clock },
	EXPIRED: { label: 'Expired', variant: 'secondary', icon: Timer },
	CANCELLED: { label: 'Cancelled', variant: 'destructive', icon: Ban },
	PAUSED: { label: 'Paused', variant: 'outline', icon: Pause },
	SUSPENDED: { label: 'Suspended', variant: 'outline', icon: Pause },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatMoney(amount: number): string {
	return formatNaira(koboToNaira(amount));
}

function getDaysRemaining(endDate: Date): number {
	return differenceInDays(new Date(endDate), new Date());
}

function getExpiryStatus(
	endDate: Date
): 'expired' | 'expiring-soon' | 'active' {
	const days = getDaysRemaining(endDate);
	if (days < 0) return 'expired';
	if (days <= 7) return 'expiring-soon';
	return 'active';
}

// ============================================
// COMPONENT
// ============================================

export default function AdminMembershipsClient({
	memberships,
	spaces,
	currentUserRole,
}: AdminMembershipsClientProps) {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [spaceFilter, setSpaceFilter] = useState<string>('all');
	const [activeTab, setActiveTab] = useState('all');

	// Dialog states
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
	const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
	const [selectedMembership, setSelectedMembership] =
		useState<MembershipWithRelations | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);

	// Stats
	const stats = useMemo(() => {
		const active = memberships.filter((m) => m.status === 'ACTIVE').length;
		const pending = memberships.filter(
			(m) => m.status === 'PENDING'
		).length;
		const expired = memberships.filter(
			(m) => m.status === 'EXPIRED'
		).length;
		const cancelled = memberships.filter(
			(m) => m.status === 'CANCELLED'
		).length;
		const paused = memberships.filter(
			(m) => m.status === 'PAUSED' || m.status === 'SUSPENDED'
		).length;
		const expiringSoon = memberships.filter(
			(m) =>
				m.status === 'ACTIVE' &&
				getDaysRemaining(new Date(m.endDate)) <= 7 &&
				getDaysRemaining(new Date(m.endDate)) >= 0
		).length;
		const totalRevenue = memberships.reduce(
			(sum, m) => sum + m.totalAmount,
			0
		);

		return {
			total: memberships.length,
			active,
			pending,
			expired,
			cancelled,
			paused,
			expiringSoon,
			totalRevenue,
		};
	}, [memberships]);

	// Filtered memberships
	const filteredMemberships = useMemo(() => {
		return memberships.filter((membership) => {
			// Search filter
			const searchLower = searchQuery.toLowerCase();
			const matchesSearch =
				!searchQuery ||
				membership.membershipNumber
					.toLowerCase()
					.includes(searchLower) ||
				membership.user.name.toLowerCase().includes(searchLower) ||
				membership.user.email.toLowerCase().includes(searchLower) ||
				membership.space.name.toLowerCase().includes(searchLower) ||
				(membership.companyName?.toLowerCase().includes(searchLower) ??
					false);

			// Status filter
			const matchesStatus =
				statusFilter === 'all' || membership.status === statusFilter;

			// Space filter
			const matchesSpace =
				spaceFilter === 'all' || membership.spaceId === spaceFilter;

			// Tab filter
			let matchesTab = true;
			if (activeTab === 'expiring') {
				matchesTab =
					membership.status === 'ACTIVE' &&
					getDaysRemaining(new Date(membership.endDate)) <= 7 &&
					getDaysRemaining(new Date(membership.endDate)) >= 0;
			} else if (activeTab === 'paused') {
				matchesTab =
					membership.status === 'PAUSED' ||
					membership.status === 'SUSPENDED';
			} else if (activeTab !== 'all') {
				matchesTab = membership.status === activeTab.toUpperCase();
			}

			return matchesSearch && matchesStatus && matchesSpace && matchesTab;
		});
	}, [memberships, searchQuery, statusFilter, spaceFilter, activeTab]);

	// Handlers
	const handleCancel = async () => {
		if (!selectedMembership) return;

		setIsProcessing(true);
		try {
			const result = await cancelSubscription(selectedMembership.id);
			if (result.success) {
				toast.success('Membership cancelled successfully');
				router.refresh();
			} else {
				toast.error(result.message || 'Failed to cancel membership');
			}
		} catch (error) {
			toast.error('An error occurred');
		} finally {
			setIsProcessing(false);
			setCancelDialogOpen(false);
			setSelectedMembership(null);
		}
	};

	const handlePause = async () => {
		if (!selectedMembership) return;

		setIsProcessing(true);
		try {
			const result = await pauseSubscription(selectedMembership.id);
			if (result.success) {
				toast.success('Membership paused successfully');
				router.refresh();
			} else {
				toast.error(result.message || 'Failed to pause membership');
			}
		} catch (error) {
			toast.error('An error occurred');
		} finally {
			setIsProcessing(false);
			setPauseDialogOpen(false);
			setSelectedMembership(null);
		}
	};

	const handleResume = async (membership: MembershipWithRelations) => {
		setIsProcessing(true);
		try {
			const result = await resumeSubscription(membership.id);
			if (result.success) {
				toast.success('Membership resumed successfully');
				router.refresh();
			} else {
				toast.error(result.message || 'Failed to resume membership');
			}
		} catch (error) {
			toast.error('An error occurred');
		} finally {
			setIsProcessing(false);
		}
	};

	// Export functions
	const exportToCSV = () => {
		const headers = [
			'Membership #',
			'Member',
			'Email',
			'Company',
			'Space',
			'Plan',
			'Status',
			'Start Date',
			'End Date',
			'Amount',
			'Auto Renew',
		];

		const rows = filteredMemberships.map((m) => [
			m.membershipNumber,
			m.user.name,
			m.user.email,
			m.companyName || '-',
			m.space.name,
			m.pricingPlan.name,
			m.status,
			format(new Date(m.startDate), 'yyyy-MM-dd'),
			format(new Date(m.endDate), 'yyyy-MM-dd'),
			formatMoney(m.totalAmount),
			m.autoRenew ? 'Yes' : 'No',
		]);

		const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join(
			'\n'
		);
		const blob = new Blob(['\uFEFF' + csv], {
			type: 'text/csv;charset=utf-8',
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `memberships-${format(new Date(), 'yyyy-MM-dd')}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className='min-h-screen bg-background'>
			{/* Admin Header */}
			<section className='bg-secondary text-secondary-foreground px-4 py-6 border-b'>
				<div className='container mx-auto'>
					<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
						<div>
							<div className='flex items-center gap-2 mb-2'>
								<Badge className='bg-red-600 text-white'>
									Admin
								</Badge>
								<span className='text-sm text-secondary-foreground/70'>
									Membership Management
								</span>
							</div>
							<h1 className='text-2xl font-bold'>Memberships</h1>
							<p className='text-sm text-secondary-foreground/70'>
								Manage all subscriptions and memberships
							</p>
						</div>
						<div className='flex gap-2'>
							<Button
								variant='outline'
								size='sm'
								onClick={exportToCSV}
								className='bg-transparent border-secondary-foreground/20'
							>
								<Download className='mr-2 h-4 w-4' />
								Export CSV
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Navigation */}
			<AdminNavigation />

			{/* Main Content */}
			<main className='container mx-auto px-4 py-8'>
				{/* Stats Overview */}
				<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 mb-8'>
					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>
								Total
							</CardTitle>
							<Users className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>
								{stats.total}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>
								Active
							</CardTitle>
							<CheckCircle className='h-4 w-4 text-green-500' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold text-green-500'>
								{stats.active}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>
								Pending
							</CardTitle>
							<Clock className='h-4 w-4 text-orange-500' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold text-orange-500'>
								{stats.pending}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>
								Paused
							</CardTitle>
							<Pause className='h-4 w-4 text-blue-500' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold text-blue-500'>
								{stats.paused}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>
								Expiring Soon
							</CardTitle>
							<AlertTriangle className='h-4 w-4 text-yellow-500' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold text-yellow-500'>
								{stats.expiringSoon}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>
								Expired
							</CardTitle>
							<Timer className='h-4 w-4 text-gray-500' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold text-gray-500'>
								{stats.expired}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>
								Revenue
							</CardTitle>
							<DollarSign className='h-4 w-4 text-green-500' />
						</CardHeader>
						<CardContent>
							<div className='text-xl font-bold'>
								{formatMoney(stats.totalRevenue)}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Filters & Search */}
				<Card className='mb-6'>
					<CardContent className='pt-6'>
						<div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
							<div className='relative flex-1'>
								<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
								<Input
									placeholder='Search by name, email, membership #, company...'
									className='pl-10'
									value={searchQuery}
									onChange={(e) =>
										setSearchQuery(e.target.value)
									}
								/>
							</div>
							<Select
								value={statusFilter}
								onValueChange={setStatusFilter}
							>
								<SelectTrigger className='w-full sm:w-[150px]'>
									<SelectValue placeholder='Status' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>
										All Status
									</SelectItem>
									<SelectItem value='ACTIVE'>
										Active
									</SelectItem>
									<SelectItem value='PENDING'>
										Pending
									</SelectItem>
									<SelectItem value='PAUSED'>
										Paused
									</SelectItem>
									<SelectItem value='SUSPENDED'>
										Suspended
									</SelectItem>
									<SelectItem value='EXPIRED'>
										Expired
									</SelectItem>
									<SelectItem value='CANCELLED'>
										Cancelled
									</SelectItem>
								</SelectContent>
							</Select>
							<Select
								value={spaceFilter}
								onValueChange={setSpaceFilter}
							>
								<SelectTrigger className='w-full sm:w-[180px]'>
									<SelectValue placeholder='Space' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>
										All Spaces
									</SelectItem>
									{spaces.map((space) => (
										<SelectItem
											key={space.id}
											value={space.id}
										>
											{space.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>

				{/* Tabs & Table */}
				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
				>
					<TabsList className='mb-4'>
						<TabsTrigger value='all'>
							All ({stats.total})
						</TabsTrigger>
						<TabsTrigger value='active'>
							Active ({stats.active})
						</TabsTrigger>
						<TabsTrigger value='expiring'>
							Expiring Soon ({stats.expiringSoon})
						</TabsTrigger>
						<TabsTrigger value='pending'>
							Pending ({stats.pending})
						</TabsTrigger>
						<TabsTrigger value='paused'>
							Paused ({stats.paused})
						</TabsTrigger>
						<TabsTrigger value='expired'>
							Expired ({stats.expired})
						</TabsTrigger>
					</TabsList>

					<TabsContent value={activeTab}>
						<Card>
							<CardContent className='pt-6'>
								{filteredMemberships.length > 0 ? (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>
													Membership #
												</TableHead>
												<TableHead>Member</TableHead>
												<TableHead>
													Space / Plan
												</TableHead>
												<TableHead>Status</TableHead>
												<TableHead>Duration</TableHead>
												<TableHead className='text-right'>
													Amount
												</TableHead>
												<TableHead className='text-right'>
													Actions
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{filteredMemberships.map(
												(membership) => {
													const daysRemaining =
														getDaysRemaining(
															new Date(
																membership.endDate
															)
														);
													const expiryStatus =
														getExpiryStatus(
															new Date(
																membership.endDate
															)
														);
													const StatusIcon =
														STATUS_CONFIG[
															membership.status
														]?.icon || Clock;

													return (
														<TableRow
															key={membership.id}
														>
															<TableCell className='font-mono text-sm'>
																{
																	membership.membershipNumber
																}
															</TableCell>
															<TableCell>
																<div>
																	<p className='font-medium'>
																		{
																			membership
																				.user
																				.name
																		}
																	</p>
																	<p className='text-xs text-muted-foreground'>
																		{
																			membership
																				.user
																				.email
																		}
																	</p>
																	{membership.companyName && (
																		<p className='text-xs text-muted-foreground flex items-center gap-1'>
																			<Building2 className='h-3 w-3' />
																			{
																				membership.companyName
																			}
																		</p>
																	)}
																</div>
															</TableCell>
															<TableCell>
																<div>
																	<p className='font-medium'>
																		{
																			membership
																				.space
																				.name
																		}
																	</p>
																	<p className='text-xs text-muted-foreground'>
																		{
																			membership
																				.pricingPlan
																				.name
																		}
																	</p>
																</div>
															</TableCell>
															<TableCell>
																<Badge
																	variant={
																		STATUS_CONFIG[
																			membership
																				.status
																		]
																			?.variant ||
																		'outline'
																	}
																	className='gap-1'
																>
																	<StatusIcon className='h-3 w-3' />
																	{STATUS_CONFIG[
																		membership
																			.status
																	]?.label ||
																		membership.status}
																</Badge>
																{membership.status ===
																	'ACTIVE' &&
																	expiryStatus ===
																		'expiring-soon' && (
																		<Badge
																			variant='outline'
																			className='ml-2 text-yellow-600 border-yellow-600'
																		>
																			{
																				daysRemaining
																			}
																			d
																			left
																		</Badge>
																	)}
															</TableCell>
															<TableCell>
																<div className='text-sm'>
																	<p>
																		{format(
																			new Date(
																				membership.startDate
																			),
																			'MMM d, yyyy'
																		)}
																	</p>
																	<p className='text-muted-foreground'>
																		→{' '}
																		{format(
																			new Date(
																				membership.endDate
																			),
																			'MMM d, yyyy'
																		)}
																	</p>
																</div>
															</TableCell>
															<TableCell className='text-right font-medium'>
																{formatMoney(
																	membership.totalAmount
																)}
																{membership.autoRenew && (
																	<Badge
																		variant='outline'
																		className='ml-2 text-xs'
																	>
																		<RefreshCw className='h-3 w-3 mr-1' />
																		Auto
																	</Badge>
																)}
															</TableCell>
															<TableCell className='text-right'>
																<DropdownMenu>
																	<DropdownMenuTrigger
																		asChild
																	>
																		<Button
																			variant='ghost'
																			size='icon'
																		>
																			<MoreHorizontal className='h-4 w-4' />
																		</Button>
																	</DropdownMenuTrigger>
																	<DropdownMenuContent align='end'>
																		<DropdownMenuLabel>
																			Actions
																		</DropdownMenuLabel>
																		<DropdownMenuSeparator />
																		<DropdownMenuItem
																			asChild
																		>
																			<Link
																				href={`/admin/members/${membership.userId}`}
																			>
																				<Eye className='mr-2 h-4 w-4' />
																				View
																				Member
																			</Link>
																		</DropdownMenuItem>
																		{membership.status ===
																			'ACTIVE' && (
																			<>
																				<DropdownMenuItem
																					onClick={() => {
																						setSelectedMembership(
																							membership
																						);
																						setPauseDialogOpen(
																							true
																						);
																					}}
																				>
																					<Pause className='mr-2 h-4 w-4' />
																					Pause
																				</DropdownMenuItem>
																				<DropdownMenuItem
																					onClick={() => {
																						setSelectedMembership(
																							membership
																						);
																						setCancelDialogOpen(
																							true
																						);
																					}}
																					className='text-destructive'
																				>
																					<XCircle className='mr-2 h-4 w-4' />
																					Cancel
																				</DropdownMenuItem>
																			</>
																		)}
																		{(membership.status ===
																			'PAUSED' ||
																			membership.status ===
																				'SUSPENDED') && (
																			<DropdownMenuItem
																				onClick={() =>
																					handleResume(
																						membership
																					)
																				}
																				disabled={
																					isProcessing
																				}
																			>
																				<Play className='mr-2 h-4 w-4' />
																				Resume
																			</DropdownMenuItem>
																		)}
																	</DropdownMenuContent>
																</DropdownMenu>
															</TableCell>
														</TableRow>
													);
												}
											)}
										</TableBody>
									</Table>
								) : (
									<div className='text-center py-12'>
										<CreditCard className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
										<h3 className='text-lg font-medium mb-2'>
											No memberships found
										</h3>
										<p className='text-muted-foreground'>
											{searchQuery ||
											statusFilter !== 'all' ||
											spaceFilter !== 'all'
												? 'Try adjusting your search or filters'
												: 'No memberships have been created yet'}
										</p>
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</main>

			{/* Cancel Dialog */}
			<Dialog
				open={cancelDialogOpen}
				onOpenChange={setCancelDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Cancel Membership</DialogTitle>
						<DialogDescription>
							Are you sure you want to cancel this membership?
							This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					{selectedMembership && (
						<div className='space-y-2 py-4'>
							<p>
								<strong>Member:</strong>{' '}
								{selectedMembership.user.name}
							</p>
							<p>
								<strong>Membership #:</strong>{' '}
								{selectedMembership.membershipNumber}
							</p>
							<p>
								<strong>Plan:</strong>{' '}
								{selectedMembership.pricingPlan.name}
							</p>
						</div>
					)}
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => {
								setCancelDialogOpen(false);
								setSelectedMembership(null);
							}}
						>
							Keep Membership
						</Button>
						<Button
							variant='destructive'
							onClick={handleCancel}
							disabled={isProcessing}
						>
							{isProcessing
								? 'Cancelling...'
								: 'Cancel Membership'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Pause Dialog */}
			<Dialog
				open={pauseDialogOpen}
				onOpenChange={setPauseDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Pause Membership</DialogTitle>
						<DialogDescription>
							Pausing will temporarily suspend the membership. The
							member will not be able to use their benefits until
							resumed.
						</DialogDescription>
					</DialogHeader>
					{selectedMembership && (
						<div className='space-y-2 py-4'>
							<p>
								<strong>Member:</strong>{' '}
								{selectedMembership.user.name}
							</p>
							<p>
								<strong>Membership #:</strong>{' '}
								{selectedMembership.membershipNumber}
							</p>
							<p>
								<strong>Plan:</strong>{' '}
								{selectedMembership.pricingPlan.name}
							</p>
						</div>
					)}
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => {
								setPauseDialogOpen(false);
								setSelectedMembership(null);
							}}
						>
							Cancel
						</Button>
						<Button
							onClick={handlePause}
							disabled={isProcessing}
						>
							{isProcessing ? 'Pausing...' : 'Pause Membership'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
