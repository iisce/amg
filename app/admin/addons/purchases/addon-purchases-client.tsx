'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
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
import {
	Search,
	Package,
	Check,
	Clock,
	MoreVertical,
	CheckCircle2,
	ShoppingBag,
	Users,
	ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { markAddonUsed } from '@/actions/perks';
import { AddonPurchaseStatus, AddonType } from '@prisma/client';
import Link from 'next/link';
import { format } from 'date-fns';

interface AddonPurchase {
	id: string;
	quantity: number;
	usedQuantity: number;
	unitPrice: number;
	totalAmount: number;
	status: AddonPurchaseStatus;
	expiresAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
	notes: string | null;
	addon: {
		id: string;
		name: string;
		type: AddonType;
		category: string | null;
		price: number;
	};
	user: {
		id: string;
		name: string;
		email: string;
	};
	membership: {
		id: string;
		membershipNumber: string;
		space: {
			name: string;
		};
	} | null;
	booking: {
		id: string;
		bookingNumber: string;
		space: {
			name: string;
		};
	} | null;
	payment: {
		id: string;
		status: string;
		reference: string;
	} | null;
}

interface Addon {
	id: string;
	name: string;
	type: AddonType;
}

interface AddonPurchasesClientProps {
	purchases: AddonPurchase[];
	addons: Addon[];
	admin: { id: string; name: string };
}

// Helper to format currency (kobo to Naira)
const formatPrice = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

// Get status badge variant
const getStatusBadge = (status: AddonPurchaseStatus) => {
	switch (status) {
		case 'PENDING':
			return (
				<Badge
					variant='outline'
					className='bg-yellow-50 text-yellow-700 border-yellow-300'
				>
					Pending
				</Badge>
			);
		case 'ACTIVE':
			return (
				<Badge
					variant='outline'
					className='bg-green-50 text-green-700 border-green-300'
				>
					Active
				</Badge>
			);
		case 'USED':
			return <Badge variant='secondary'>Used</Badge>;
		case 'PARTIALLY_USED':
			return (
				<Badge
					variant='outline'
					className='bg-blue-50 text-blue-700 border-blue-300'
				>
					Partially Used
				</Badge>
			);
		case 'EXPIRED':
			return (
				<Badge
					variant='outline'
					className='bg-red-50 text-red-700 border-red-300'
				>
					Expired
				</Badge>
			);
		case 'CANCELLED':
			return <Badge variant='destructive'>Cancelled</Badge>;
		default:
			return <Badge variant='outline'>{status}</Badge>;
	}
};

// Get type badge
const getTypeBadge = (type: AddonType) => {
	switch (type) {
		case 'SUBSCRIPTION':
			return <Badge>Subscription</Badge>;
		case 'BOOKING':
			return <Badge variant='secondary'>Booking</Badge>;
		case 'SHOP':
			return <Badge variant='outline'>Shop</Badge>;
		case 'UNIVERSAL':
			return (
				<Badge className='bg-purple-100 text-purple-700'>
					Universal
				</Badge>
			);
		default:
			return <Badge variant='outline'>{type}</Badge>;
	}
};

export function AddonPurchasesClient({
	purchases: initialPurchases,
	addons,
}: AddonPurchasesClientProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [purchases, setPurchases] = useState(initialPurchases);
	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [typeFilter, setTypeFilter] = useState<string>('all');
	const [markUsedDialog, setMarkUsedDialog] = useState<{
		purchase: AddonPurchase;
		quantityToMark: number;
	} | null>(null);

	// Filter purchases
	const filteredPurchases = purchases.filter((purchase) => {
		const matchesSearch =
			purchase.user.name
				.toLowerCase()
				.includes(searchQuery.toLowerCase()) ||
			purchase.user.email
				.toLowerCase()
				.includes(searchQuery.toLowerCase()) ||
			purchase.addon.name
				.toLowerCase()
				.includes(searchQuery.toLowerCase());

		const matchesStatus =
			statusFilter === 'all' || purchase.status === statusFilter;
		const matchesType =
			typeFilter === 'all' || purchase.addon.type === typeFilter;

		return matchesSearch && matchesStatus && matchesType;
	});

	// Stats
	const stats = {
		total: purchases.length,
		pending: purchases.filter((p) => p.status === 'PENDING').length,
		active: purchases.filter((p) => p.status === 'ACTIVE').length,
		used: purchases.filter(
			(p) => p.status === 'USED' || p.status === 'PARTIALLY_USED'
		).length,
	};

	const handleMarkUsed = async () => {
		if (!markUsedDialog) return;

		startTransition(async () => {
			try {
				const result = await markAddonUsed(
					markUsedDialog.purchase.id,
					markUsedDialog.quantityToMark
				);

				if (result.success) {
					toast.success('Add-on marked as used');
					setMarkUsedDialog(null);
					router.refresh();
				} else {
					toast.error(result.message || 'Failed to mark as used');
				}
			} catch (error) {
				console.error('Error:', error);
				toast.error('An error occurred');
			}
		});
	};

	const openMarkUsedDialog = (purchase: AddonPurchase) => {
		const remainingQuantity = purchase.quantity - purchase.usedQuantity;
		setMarkUsedDialog({
			purchase,
			quantityToMark: remainingQuantity,
		});
	};

	return (
		<div className='container mx-auto py-6 space-y-6'>
			{/* Header */}
			<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
				<div>
					<div className='flex items-center gap-2 mb-2'>
						<Link href='/admin/addons'>
							<Button
								variant='ghost'
								size='sm'
							>
								<ArrowLeft className='mr-2 h-4 w-4' />
								Back to Add-ons
							</Button>
						</Link>
					</div>
					<h1 className='text-2xl font-bold'>Add-on Purchases</h1>
					<p className='text-muted-foreground'>
						Track and manage user add-on purchases
					</p>
				</div>
			</div>

			{/* Stats Cards */}
			<div className='grid gap-4 md:grid-cols-4'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardTitle className='text-sm font-medium'>
							Total Purchases
						</CardTitle>
						<ShoppingBag className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{stats.total}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardTitle className='text-sm font-medium'>
							Pending
						</CardTitle>
						<Clock className='h-4 w-4 text-yellow-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{stats.pending}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardTitle className='text-sm font-medium'>
							Active
						</CardTitle>
						<CheckCircle2 className='h-4 w-4 text-green-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{stats.active}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardTitle className='text-sm font-medium'>
							Used/Fulfilled
						</CardTitle>
						<Check className='h-4 w-4 text-blue-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{stats.used}</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters and Table */}
			<Card>
				<CardHeader>
					<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
						<div>
							<CardTitle>All Purchases</CardTitle>
							<CardDescription>
								View all add-on purchases and mark them as used
							</CardDescription>
						</div>
						<div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
							<div className='relative w-full sm:w-64'>
								<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
								<Input
									placeholder='Search by user or addon...'
									value={searchQuery}
									onChange={(e) =>
										setSearchQuery(e.target.value)
									}
									className='pl-9'
								/>
							</div>
							<Select
								value={statusFilter}
								onValueChange={setStatusFilter}
							>
								<SelectTrigger className='w-full sm:w-40'>
									<SelectValue placeholder='Status' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>
										All Status
									</SelectItem>
									<SelectItem value='PENDING'>
										Pending
									</SelectItem>
									<SelectItem value='ACTIVE'>
										Active
									</SelectItem>
									<SelectItem value='USED'>Used</SelectItem>
									<SelectItem value='PARTIALLY_USED'>
										Partially Used
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
								value={typeFilter}
								onValueChange={setTypeFilter}
							>
								<SelectTrigger className='w-full sm:w-40'>
									<SelectValue placeholder='Type' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>
										All Types
									</SelectItem>
									<SelectItem value='SUBSCRIPTION'>
										Subscription
									</SelectItem>
									<SelectItem value='BOOKING'>
										Booking
									</SelectItem>
									<SelectItem value='SHOP'>Shop</SelectItem>
									<SelectItem value='UNIVERSAL'>
										Universal
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{filteredPurchases.length === 0 ? (
						<div className='text-center py-12 text-muted-foreground'>
							<Package className='h-12 w-12 mx-auto mb-4 opacity-50' />
							<p className='font-medium'>No purchases found</p>
							<p className='text-sm mt-1'>
								{searchQuery ||
								statusFilter !== 'all' ||
								typeFilter !== 'all'
									? 'Try different filters'
									: 'Purchases will appear here when users buy add-ons'}
							</p>
						</div>
					) : (
						<div className='overflow-x-auto'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>User</TableHead>
										<TableHead>Add-on</TableHead>
										<TableHead>Type</TableHead>
										<TableHead>Qty</TableHead>
										<TableHead>Used</TableHead>
										<TableHead>Total</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Date</TableHead>
										<TableHead className='text-right'>
											Actions
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredPurchases.map((purchase) => (
										<TableRow key={purchase.id}>
											<TableCell>
												<div>
													<p className='font-medium'>
														{purchase.user.name}
													</p>
													<p className='text-sm text-muted-foreground'>
														{purchase.user.email}
													</p>
												</div>
											</TableCell>
											<TableCell>
												<div>
													<p className='font-medium'>
														{purchase.addon.name}
													</p>
													{purchase.addon
														.category && (
														<p className='text-xs text-muted-foreground'>
															{
																purchase.addon
																	.category
															}
														</p>
													)}
													{purchase.membership && (
														<Badge
															variant='outline'
															className='mt-1 text-xs'
														>
															{
																purchase
																	.membership
																	.space.name
															}
														</Badge>
													)}
												</div>
											</TableCell>
											<TableCell>
												{getTypeBadge(
													purchase.addon.type
												)}
											</TableCell>
											<TableCell>
												{purchase.quantity}
											</TableCell>
											<TableCell>
												{purchase.usedQuantity > 0 ? (
													<span className='text-green-600 font-medium'>
														{purchase.usedQuantity}/
														{purchase.quantity}
													</span>
												) : (
													<span className='text-muted-foreground'>
														0
													</span>
												)}
											</TableCell>
											<TableCell className='font-medium'>
												{formatPrice(
													purchase.totalAmount
												)}
											</TableCell>
											<TableCell>
												{getStatusBadge(
													purchase.status
												)}
											</TableCell>
											<TableCell className='text-sm text-muted-foreground'>
												{format(
													new Date(
														purchase.createdAt
													),
													'MMM d, yyyy'
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
															<MoreVertical className='h-4 w-4' />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align='end'>
														{(purchase.status ===
															'ACTIVE' ||
															purchase.status ===
																'PARTIALLY_USED') &&
															purchase.usedQuantity <
																purchase.quantity && (
																<DropdownMenuItem
																	onClick={() =>
																		openMarkUsedDialog(
																			purchase
																		)
																	}
																>
																	<CheckCircle2 className='mr-2 h-4 w-4' />
																	Mark as Used
																</DropdownMenuItem>
															)}
														<DropdownMenuItem
															onClick={() => {
																// View user profile
																router.push(
																	`/admin/members?search=${purchase.user.email}`
																);
															}}
														>
															<Users className='mr-2 h-4 w-4' />
															View User
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Mark Used Dialog */}
			<Dialog
				open={!!markUsedDialog}
				onOpenChange={() => setMarkUsedDialog(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Mark Add-on as Used</DialogTitle>
						<DialogDescription>
							{markUsedDialog && (
								<>
									Mark &quot;
									{markUsedDialog.purchase.addon.name}&quot;
									as used for{' '}
									{markUsedDialog.purchase.user.name}.
									<br />
									<span className='text-sm'>
										Remaining:{' '}
										{markUsedDialog.purchase.quantity -
											markUsedDialog.purchase
												.usedQuantity}{' '}
										units
									</span>
								</>
							)}
						</DialogDescription>
					</DialogHeader>
					{markUsedDialog && (
						<div className='space-y-4'>
							<div className='space-y-2'>
								<label className='text-sm font-medium'>
									Quantity to Mark as Used
								</label>
								<Input
									type='number'
									min='1'
									max={
										markUsedDialog.purchase.quantity -
										markUsedDialog.purchase.usedQuantity
									}
									value={markUsedDialog.quantityToMark}
									onChange={(e) =>
										setMarkUsedDialog((prev) =>
											prev
												? {
														...prev,
														quantityToMark:
															parseInt(
																e.target.value
															) || 1,
												  }
												: null
										)
									}
								/>
							</div>
						</div>
					)}
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setMarkUsedDialog(null)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleMarkUsed}
							disabled={isPending}
						>
							{isPending ? 'Marking...' : 'Mark as Used'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
