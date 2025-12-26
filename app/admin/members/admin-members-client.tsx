'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Search,
	Filter,
	Eye,
	Mail,
	Phone,
	LayoutGrid,
	Calendar,
	CalendarDays,
	UserCog,
	FileText,
	QrCode,
	Users,
	Shield,
	Building2,
	Package,
	ShoppingCart,
} from 'lucide-react';
import { format } from 'date-fns';
import { AddStaffDialog } from '@/components/admin/add-staff-dialog';
import type { UserProfile } from '@/actions/users';
import type { MembershipWithRelations } from '@/actions/subscriptions';
import {
	getRoleDisplayName,
	getRoleBadgeColor,
	isAdminRole,
} from '@/lib/permissions';
import type { UserRole } from '@prisma/client';

interface AdminMembersClientProps {
	users: UserProfile[];
	subscriptions: MembershipWithRelations[];
	currentUserRole: UserRole;
}

export default function AdminMembersClient({
	users,
	subscriptions,
	currentUserRole,
}: AdminMembersClientProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [roleFilter, setRoleFilter] = useState('all');
	const [activeTab, setActiveTab] = useState<'clients' | 'team'>('clients');

	// Separate users into clients and team members
	const clients = users.filter((user) => user.role === 'CLIENT');
	const teamMembers = users.filter((user) => isAdminRole(user.role));

	// Create a map of user IDs to their active subscriptions
	const userSubscriptionMap = new Map<string, MembershipWithRelations[]>();
	subscriptions.forEach((sub) => {
		const existing = userSubscriptionMap.get(sub.userId) || [];
		userSubscriptionMap.set(sub.userId, [...existing, sub]);
	});

	// Transform clients into format with subscription info
	const clientsWithSubs = clients.map((user) => {
		const userSubs = userSubscriptionMap.get(user.id) || [];
		const activeSub = userSubs.find((s) => s.status === 'ACTIVE');

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			phone: user.phone || '',
			company: user.company || '',
			plan: activeSub?.pricingPlan.name || 'No active plan',
			status: activeSub
				? 'active'
				: userSubs.length > 0
				? 'expired'
				: 'no_subscription',
			joinDate: user.createdAt,
			expiryDate: activeSub?.endDate,
			role: user.role,
			isActive: user.isActive,
		};
	});

	// Filter clients
	const filteredClients = clientsWithSubs.filter((client) => {
		const matchesSearch =
			client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
			client.id.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesStatus =
			statusFilter === 'all' || client.status === statusFilter;

		return matchesSearch && matchesStatus;
	});

	// Filter team members
	const filteredTeam = teamMembers.filter((member) => {
		const matchesSearch =
			member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			member.email.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesRole = roleFilter === 'all' || member.role === roleFilter;

		return matchesSearch && matchesRole;
	});

	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'active':
				return (
					<Badge className='bg-green-100 text-green-800 border-green-200'>
						Active
					</Badge>
				);
			case 'expired':
				return (
					<Badge className='bg-red-100 text-red-800 border-red-200'>
						Expired
					</Badge>
				);
			case 'no_subscription':
				return <Badge variant='outline'>No Subscription</Badge>;
			default:
				return <Badge variant='outline'>{status}</Badge>;
		}
	};
	const getRoleBadge = (role: UserRole) => {
		const variant = getRoleBadgeColor(role);
		return <Badge variant={variant}>{getRoleDisplayName(role)}</Badge>;
	};

	// Check if current user can add staff
	const canAddStaff =
		currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN';
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
								{getRoleBadge(currentUserRole)}
							</div>
							<h1 className='text-2xl font-bold'>
								User Management
							</h1>
							<p className='text-sm text-secondary-foreground/70 mt-1'>
								Manage clients and team members
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Navigation */}
			<section className='border-b bg-muted/30'>
				<div className='container mx-auto px-4'>
					<nav className='flex gap-1 overflow-x-auto'>
						<Link
							href='/admin/dashboard'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<LayoutGrid className='h-4 w-4' />
							Overview
						</Link>
						<Link
							href='/admin/bookings'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<Calendar className='h-4 w-4' />
							Bookings
						</Link>
						<Link
							href='/admin/spaces'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<LayoutGrid className='h-4 w-4' />
							Spaces
						</Link>
						<Link
							href='/admin/members'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-primary bg-background'
						>
							<UserCog className='h-4 w-4' />
							Users
						</Link>
						<Link
							href='/admin/tours'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<CalendarDays className='h-4 w-4' />
							Tours
						</Link>
						<Link
							href='/admin/inventory'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<Package className='h-4 w-4' />
							Inventory
						</Link>
						<Link
							href='/admin/shop'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<ShoppingCart className='h-4 w-4' />
							Shop
						</Link>
						<Link
							href='/admin/reports'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<FileText className='h-4 w-4' />
							Reports
						</Link>
						<Link
							href='/admin/scanner'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<QrCode className='h-4 w-4' />
							QR Scanner
						</Link>
					</nav>
				</div>
			</section>

			{/* Content */}
			<section className='px-4 py-8'>
				<div className='container mx-auto space-y-6'>
					{/* Stats Cards */}
					<div className='grid gap-4 md:grid-cols-4'>
						<Card>
							<CardHeader className='flex flex-row items-center justify-between pb-2'>
								<CardTitle className='text-sm font-medium'>
									Total Clients
								</CardTitle>
								<Users className='h-4 w-4 text-muted-foreground' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold'>
									{clients.length}
								</div>
								<p className='text-xs text-muted-foreground'>
									{
										clientsWithSubs.filter(
											(c) => c.status === 'active'
										).length
									}{' '}
									with active subscriptions
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className='flex flex-row items-center justify-between pb-2'>
								<CardTitle className='text-sm font-medium'>
									Team Members
								</CardTitle>
								<Shield className='h-4 w-4 text-muted-foreground' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold'>
									{teamMembers.length}
								</div>
								<p className='text-xs text-muted-foreground'>
									Staff and administrators
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className='flex flex-row items-center justify-between pb-2'>
								<CardTitle className='text-sm font-medium'>
									Active Subscriptions
								</CardTitle>
								<Calendar className='h-4 w-4 text-muted-foreground' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold'>
									{
										clientsWithSubs.filter(
											(c) => c.status === 'active'
										).length
									}
								</div>
								<p className='text-xs text-muted-foreground'>
									Currently active
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className='flex flex-row items-center justify-between pb-2'>
								<CardTitle className='text-sm font-medium'>
									Admins
								</CardTitle>
								<Shield className='h-4 w-4 text-muted-foreground' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold'>
									{
										teamMembers.filter(
											(m) =>
												m.role === 'ADMIN' ||
												m.role === 'SUPER_ADMIN'
										).length
									}
								</div>
								<p className='text-xs text-muted-foreground'>
									Full access users
								</p>
							</CardContent>
						</Card>
					</div>

					{/* Tabs */}
					<Tabs
						value={activeTab}
						onValueChange={(v) =>
							setActiveTab(v as 'clients' | 'team')
						}
						className='space-y-6'
					>
						<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
							<TabsList className='grid w-full sm:w-auto grid-cols-2'>
								<TabsTrigger
									value='clients'
									className='flex items-center gap-2'
								>
									<Users className='h-4 w-4' />
									Clients ({clients.length})
								</TabsTrigger>
								<TabsTrigger
									value='team'
									className='flex items-center gap-2'
								>
									<Shield className='h-4 w-4' />
									Team ({teamMembers.length})
								</TabsTrigger>
							</TabsList>

							{canAddStaff && activeTab === 'team' && (
								<AddStaffDialog
									currentUserRole={currentUserRole}
								/>
							)}
						</div>

						{/* Clients Tab */}
						<TabsContent
							value='clients'
							className='space-y-6'
						>
							{/* Filters */}
							<Card>
								<CardContent className='py-4'>
									<div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
										<div className='relative flex-1'>
											<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
											<Input
												placeholder='Search by name or email...'
												className='pl-9 bg-transparent'
												value={searchQuery}
												onChange={(e) =>
													setSearchQuery(
														e.target.value
													)
												}
											/>
										</div>
										<div className='flex gap-2'>
											<Select
												value={statusFilter}
												onValueChange={setStatusFilter}
											>
												<SelectTrigger className='w-[180px] bg-transparent'>
													<Filter className='mr-2 h-4 w-4' />
													<SelectValue placeholder='Status' />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value='all'>
														All Clients
													</SelectItem>
													<SelectItem value='active'>
														Active Subscription
													</SelectItem>
													<SelectItem value='expired'>
														Expired
													</SelectItem>
													<SelectItem value='no_subscription'>
														No Subscription
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Clients List */}
							<div className='space-y-4'>
								{filteredClients.length > 0 ? (
									filteredClients.map((client) => (
										<Card key={client.id}>
											<CardContent className='py-4'>
												<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
													<div className='flex-1 space-y-2'>
														<div className='flex items-center gap-3'>
															<span className='font-semibold'>
																{client.name}
															</span>
															{getStatusBadge(
																client.status
															)}
														</div>
														<div className='flex flex-wrap items-center gap-4 text-sm text-muted-foreground'>
															<div className='flex items-center gap-1'>
																<Mail className='h-4 w-4' />
																<span>
																	{
																		client.email
																	}
																</span>
															</div>
															{client.phone && (
																<div className='flex items-center gap-1'>
																	<Phone className='h-4 w-4' />
																	<span>
																		{
																			client.phone
																		}
																	</span>
																</div>
															)}
															{client.company && (
																<div className='flex items-center gap-1'>
																	<Building2 className='h-4 w-4' />
																	<span>
																		{
																			client.company
																		}
																	</span>
																</div>
															)}
														</div>
														<div className='flex flex-wrap gap-4 text-sm'>
															<div>
																<span className='text-muted-foreground'>
																	Plan:{' '}
																</span>
																<span className='font-medium'>
																	{
																		client.plan
																	}
																</span>
															</div>
															<div>
																<span className='text-muted-foreground'>
																	Joined:{' '}
																</span>
																<span className='font-medium'>
																	{format(
																		new Date(
																			client.joinDate
																		),
																		'PP'
																	)}
																</span>
															</div>
															{client.expiryDate && (
																<div>
																	<span className='text-muted-foreground'>
																		Expires:{' '}
																	</span>
																	<span className='font-medium'>
																		{format(
																			new Date(
																				client.expiryDate
																			),
																			'PP'
																		)}
																	</span>
																</div>
															)}
														</div>
													</div>
													<div className='flex items-center gap-2'>
														<Button
															size='sm'
															variant='outline'
															asChild
														>
															<Link
																href={`/admin/members/${client.id}`}
															>
																<Eye className='mr-2 h-4 w-4' />
																View
															</Link>
														</Button>
													</div>
												</div>
											</CardContent>
										</Card>
									))
								) : (
									<Card>
										<CardContent className='py-12 text-center'>
											<Users className='h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50' />
											<h3 className='text-lg font-semibold mb-2'>
												No clients found
											</h3>
											<p className='text-muted-foreground'>
												{searchQuery ||
												statusFilter !== 'all'
													? 'Try adjusting your search or filters'
													: 'No clients have registered yet'}
											</p>
										</CardContent>
									</Card>
								)}
							</div>
						</TabsContent>

						{/* Team Tab */}
						<TabsContent
							value='team'
							className='space-y-6'
						>
							{/* Filters */}
							<Card>
								<CardContent className='py-4'>
									<div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
										<div className='relative flex-1'>
											<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
											<Input
												placeholder='Search team members...'
												className='pl-9 bg-transparent'
												value={searchQuery}
												onChange={(e) =>
													setSearchQuery(
														e.target.value
													)
												}
											/>
										</div>
										<div className='flex gap-2'>
											<Select
												value={roleFilter}
												onValueChange={setRoleFilter}
											>
												<SelectTrigger className='w-[200px] bg-transparent'>
													<Filter className='mr-2 h-4 w-4' />
													<SelectValue placeholder='Role' />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value='all'>
														All Roles
													</SelectItem>
													<SelectItem value='SUPER_ADMIN'>
														Super Admin
													</SelectItem>
													<SelectItem value='ADMIN'>
														Admin
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
												</SelectContent>
											</Select>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Team List */}
							<div className='space-y-4'>
								{filteredTeam.length > 0 ? (
									filteredTeam.map((member) => (
										<Card key={member.id}>
											<CardContent className='py-4'>
												<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
													<div className='flex-1 space-y-2'>
														<div className='flex items-center gap-3'>
															<span className='font-semibold'>
																{member.name}
															</span>
															{getRoleBadge(
																member.role
															)}
															{!member.isActive && (
																<Badge
																	variant='outline'
																	className='text-red-600 border-red-200'
																>
																	Inactive
																</Badge>
															)}
														</div>
														<div className='flex flex-wrap items-center gap-4 text-sm text-muted-foreground'>
															<div className='flex items-center gap-1'>
																<Mail className='h-4 w-4' />
																<span>
																	{
																		member.email
																	}
																</span>
															</div>
															{member.phone && (
																<div className='flex items-center gap-1'>
																	<Phone className='h-4 w-4' />
																	<span>
																		{
																			member.phone
																		}
																	</span>
																</div>
															)}
														</div>
														<div className='text-sm text-muted-foreground'>
															<span>
																Joined{' '}
																{format(
																	new Date(
																		member.createdAt
																	),
																	'PP'
																)}
															</span>
														</div>
													</div>
													<div className='flex items-center gap-2'>
														<Button
															size='sm'
															variant='outline'
															asChild
														>
															<Link
																href={`/admin/members/${member.id}`}
															>
																<Eye className='mr-2 h-4 w-4' />
																View
															</Link>
														</Button>
													</div>
												</div>
											</CardContent>
										</Card>
									))
								) : (
									<Card>
										<CardContent className='py-12 text-center'>
											<Shield className='h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50' />
											<h3 className='text-lg font-semibold mb-2'>
												No team members found
											</h3>
											<p className='text-muted-foreground mb-4'>
												{searchQuery ||
												roleFilter !== 'all'
													? 'Try adjusting your search or filters'
													: 'Add your first team member'}
											</p>
											{canAddStaff && (
												<AddStaffDialog
													currentUserRole={
														currentUserRole
													}
												/>
											)}
										</CardContent>
									</Card>
								)}
							</div>
						</TabsContent>
					</Tabs>
				</div>
			</section>
		</div>
	);
}
