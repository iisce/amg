'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
	Package,
	ShoppingBag,
	CheckCircle2,
	Coffee,
	Gift,
	Plus,
	Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { purchaseAddon } from '@/actions/perks';
import {
	AddonPurchaseStatus,
	AddonType,
	AddonUnitType,
	MembershipStatus,
} from '@prisma/client';
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
		unitType: AddonUnitType;
		unitLabel: string | null;
		price: number;
	};
}

interface Addon {
	id: string;
	name: string;
	description: string | null;
	price: number;
	type: AddonType;
	category: string | null;
	unitType: AddonUnitType;
	unitLabel: string | null;
	maxQuantityPerPurchase: number | null;
	durationMinutes: number;
	isActive: boolean;
	space: {
		id: string;
		name: string;
	} | null;
}

interface Subscription {
	id: string;
	status: MembershipStatus;
	space: {
		id: string;
		name: string;
	};
	pricingPlan: {
		id: string;
		name: string;
	};
}

interface MyAddonsClientProps {
	purchases: AddonPurchase[];
	shopAddons: Addon[];
	subscriptionAddons: Addon[];
	subscriptions: Subscription[];
	hasActiveSubscription: boolean;
}

// Helper to format currency (kobo to Naira)
const formatPrice = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

// Get status badge
const getStatusBadge = (status: AddonPurchaseStatus) => {
	switch (status) {
		case 'PENDING':
			return (
				<Badge
					variant='outline'
					className='bg-yellow-50 text-yellow-700'
				>
					Pending
				</Badge>
			);
		case 'ACTIVE':
			return (
				<Badge className='bg-green-100 text-green-700'>Active</Badge>
			);
		case 'USED':
			return <Badge variant='secondary'>Used</Badge>;
		case 'PARTIALLY_USED':
			return (
				<Badge className='bg-blue-100 text-blue-700'>
					Partially Used
				</Badge>
			);
		case 'EXPIRED':
			return (
				<Badge
					variant='outline'
					className='bg-red-50 text-red-700'
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

export function MyAddonsClient({
	purchases,
	shopAddons,
	subscriptionAddons,
	subscriptions,
	hasActiveSubscription,
}: MyAddonsClientProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [purchaseDialog, setPurchaseDialog] = useState<{
		addon: Addon;
		quantity: number;
		membershipId?: string;
	} | null>(null);

	// Derived value for max quantity (safely handle null)
	const maxQty = purchaseDialog?.addon.maxQuantityPerPurchase ?? 10;

	// Stats
	const activeAddons = purchases.filter(
		(p) => p.status === 'ACTIVE' || p.status === 'PARTIALLY_USED'
	);
	const totalSpent = purchases.reduce((sum, p) => sum + p.totalAmount, 0);

	const handlePurchase = async () => {
		if (!purchaseDialog) return;

		startTransition(async () => {
			try {
				const result = await purchaseAddon({
					addonId: purchaseDialog.addon.id,
					quantity: purchaseDialog.quantity,
					membershipId: purchaseDialog.membershipId,
				});

				if (result.success) {
					toast.success('Add-on purchased successfully!');
					setPurchaseDialog(null);
					router.refresh();
				} else {
					toast.error(result.message || 'Purchase failed');
				}
			} catch (error) {
				console.error('Error:', error);
				toast.error('An error occurred');
			}
		});
	};

	const openPurchaseDialog = (addon: Addon) => {
		// For subscription addons, preselect first active subscription
		const activeSubscription = subscriptions.find(
			(s) => s.status === 'ACTIVE'
		);
		setPurchaseDialog({
			addon,
			quantity: 1,
			membershipId:
				addon.type === 'SUBSCRIPTION'
					? activeSubscription?.id
					: undefined,
		});
	};

	const renderAddonCard = (addon: Addon) => (
		<Card
			key={addon.id}
			className='flex flex-col'
		>
			<CardHeader className='pb-3'>
				<div className='flex items-start justify-between'>
					<div>
						<CardTitle className='text-lg'>{addon.name}</CardTitle>
						{addon.category && (
							<Badge
								variant='outline'
								className='mt-1 text-xs'
							>
								{addon.category}
							</Badge>
						)}
					</div>
					<Badge
						variant={addon.type === 'SHOP' ? 'outline' : 'default'}
					>
						{addon.type}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className='flex-1'>
				{addon.description && (
					<p className='text-sm text-muted-foreground mb-3'>
						{addon.description}
					</p>
				)}
				<div className='space-y-2 text-sm'>
					<div className='flex justify-between'>
						<span className='text-muted-foreground'>Price:</span>
						<span className='font-medium'>
							{formatPrice(addon.price)}
						</span>
					</div>
					{addon.space && (
						<div className='flex justify-between'>
							<span className='text-muted-foreground'>
								Space:
							</span>
							<span>{addon.space.name}</span>
						</div>
					)}
					{addon.unitType === 'HOURS' && (
						<div className='flex justify-between'>
							<span className='text-muted-foreground'>
								Duration:
							</span>
							<span>{addon.durationMinutes} mins</span>
						</div>
					)}
				</div>
			</CardContent>
			<CardFooter>
				<Button
					className='w-full'
					onClick={() => openPurchaseDialog(addon)}
					disabled={!addon.isActive}
				>
					<ShoppingBag className='mr-2 h-4 w-4' />
					Purchase
				</Button>
			</CardFooter>
		</Card>
	);

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div>
				<h1 className='text-2xl font-bold'>My Add-ons</h1>
				<p className='text-muted-foreground'>
					View your purchases and buy new add-ons
				</p>
			</div>

			{/* Stats Cards */}
			<div className='grid gap-4 md:grid-cols-3'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardTitle className='text-sm font-medium'>
							Total Purchases
						</CardTitle>
						<Package className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{purchases.length}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardTitle className='text-sm font-medium'>
							Active Add-ons
						</CardTitle>
						<CheckCircle2 className='h-4 w-4 text-green-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{activeAddons.length}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardTitle className='text-sm font-medium'>
							Total Spent
						</CardTitle>
						<Coffee className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{formatPrice(totalSpent)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Tabs */}
			<Tabs
				defaultValue='purchases'
				className='space-y-4'
			>
				<TabsList>
					<TabsTrigger value='purchases'>My Purchases</TabsTrigger>
					<TabsTrigger value='shop'>Shop</TabsTrigger>
					{hasActiveSubscription && (
						<TabsTrigger value='subscription'>
							Subscription Add-ons
						</TabsTrigger>
					)}
				</TabsList>

				{/* Purchases Tab */}
				<TabsContent value='purchases'>
					<Card>
						<CardHeader>
							<CardTitle>Purchase History</CardTitle>
							<CardDescription>
								All your add-on purchases
							</CardDescription>
						</CardHeader>
						<CardContent>
							{purchases.length === 0 ? (
								<div className='text-center py-12 text-muted-foreground'>
									<Gift className='h-12 w-12 mx-auto mb-4 opacity-50' />
									<p className='font-medium'>
										No purchases yet
									</p>
									<p className='text-sm mt-1'>
										Browse the shop to buy your first add-on
									</p>
								</div>
							) : (
								<div className='overflow-x-auto'>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Add-on</TableHead>
												<TableHead>Qty</TableHead>
												<TableHead>Used</TableHead>
												<TableHead>Total</TableHead>
												<TableHead>Status</TableHead>
												<TableHead>Date</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{purchases.map((purchase) => (
												<TableRow key={purchase.id}>
													<TableCell>
														<div>
															<p className='font-medium'>
																{
																	purchase
																		.addon
																		.name
																}
															</p>
															{purchase.addon
																.category && (
																<p className='text-xs text-muted-foreground'>
																	{
																		purchase
																			.addon
																			.category
																	}
																</p>
															)}
														</div>
													</TableCell>
													<TableCell>
														{purchase.quantity}
													</TableCell>
													<TableCell>
														{purchase.usedQuantity >
														0 ? (
															<span className='text-green-600 font-medium'>
																{
																	purchase.usedQuantity
																}
																/
																{
																	purchase.quantity
																}
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
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Shop Tab */}
				<TabsContent value='shop'>
					<div className='space-y-4'>
						<div className='flex items-center justify-between'>
							<div>
								<h3 className='text-lg font-semibold'>
									Available Add-ons
								</h3>
								<p className='text-sm text-muted-foreground'>
									Purchase add-ons like coffee bundles,
									printing credits, and more
								</p>
							</div>
						</div>
						{shopAddons.length === 0 ? (
							<Card>
								<CardContent className='py-12 text-center text-muted-foreground'>
									<ShoppingBag className='h-12 w-12 mx-auto mb-4 opacity-50' />
									<p className='font-medium'>
										No shop add-ons available
									</p>
									<p className='text-sm mt-1'>
										Check back later for new items
									</p>
								</CardContent>
							</Card>
						) : (
							<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
								{shopAddons.map((addon) =>
									renderAddonCard(addon)
								)}
							</div>
						)}
					</div>
				</TabsContent>

				{/* Subscription Add-ons Tab */}
				{hasActiveSubscription && (
					<TabsContent value='subscription'>
						<div className='space-y-4'>
							<div>
								<h3 className='text-lg font-semibold'>
									Subscription Add-ons
								</h3>
								<p className='text-sm text-muted-foreground'>
									Extra services available to members with
									active subscriptions
								</p>
							</div>
							{subscriptionAddons.length === 0 ? (
								<Card>
									<CardContent className='py-12 text-center text-muted-foreground'>
										<Package className='h-12 w-12 mx-auto mb-4 opacity-50' />
										<p className='font-medium'>
											No subscription add-ons available
										</p>
										<p className='text-sm mt-1'>
											Check back later for new items
										</p>
									</CardContent>
								</Card>
							) : (
								<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
									{subscriptionAddons.map((addon) =>
										renderAddonCard(addon)
									)}
								</div>
							)}
						</div>
					</TabsContent>
				)}
			</Tabs>

			{/* Purchase Dialog */}
			<Dialog
				open={!!purchaseDialog}
				onOpenChange={() => setPurchaseDialog(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Purchase Add-on</DialogTitle>
						<DialogDescription>
							{purchaseDialog && (
								<>
									Purchase &quot;{purchaseDialog.addon.name}
									&quot;
								</>
							)}
						</DialogDescription>
					</DialogHeader>
					{purchaseDialog && (
						<div className='space-y-4'>
							{/* Quantity Selector */}
							<div className='space-y-2'>
								<label className='text-sm font-medium'>
									Quantity
								</label>
								<div className='flex items-center gap-3'>
									<Button
										type='button'
										variant='outline'
										size='icon'
										onClick={() =>
											setPurchaseDialog((prev) =>
												prev && prev.quantity > 1
													? {
															...prev,
															quantity:
																prev.quantity -
																1,
													  }
													: prev
											)
										}
									>
										<Minus className='h-4 w-4' />
									</Button>
									<Input
										type='number'
										min='1'
										max={maxQty}
										value={purchaseDialog.quantity}
										onChange={(e) => {
											const newVal =
												parseInt(e.target.value) || 1;
											setPurchaseDialog((prev) =>
												prev
													? {
															...prev,
															quantity: Math.min(
																newVal,
																maxQty
															),
													  }
													: null
											);
										}}
										className='w-20 text-center'
									/>
									<Button
										type='button'
										variant='outline'
										size='icon'
										onClick={() =>
											setPurchaseDialog((prev) =>
												prev && prev.quantity < maxQty
													? {
															...prev,
															quantity:
																prev.quantity +
																1,
													  }
													: prev
											)
										}
									>
										<Plus className='h-4 w-4' />
									</Button>
								</div>
								<p className='text-xs text-muted-foreground'>
									Max: {maxQty} per purchase
								</p>
							</div>

							{/* Subscription Selector (for subscription addons) */}
							{purchaseDialog.addon.type === 'SUBSCRIPTION' &&
								subscriptions.length > 1 && (
									<div className='space-y-2'>
										<label className='text-sm font-medium'>
											Link to Subscription
										</label>
										<Select
											value={purchaseDialog.membershipId}
											onValueChange={(value) =>
												setPurchaseDialog((prev) =>
													prev
														? {
																...prev,
																membershipId:
																	value,
														  }
														: null
												)
											}
										>
											<SelectTrigger>
												<SelectValue placeholder='Select subscription' />
											</SelectTrigger>
											<SelectContent>
												{subscriptions
													.filter(
														(s) =>
															s.status ===
															'ACTIVE'
													)
													.map((sub) => (
														<SelectItem
															key={sub.id}
															value={sub.id}
														>
															{sub.space.name} -{' '}
															{
																sub.pricingPlan
																	.name
															}
														</SelectItem>
													))}
											</SelectContent>
										</Select>
									</div>
								)}

							{/* Price Summary */}
							<div className='border-t pt-4'>
								<div className='flex justify-between text-sm'>
									<span>Unit Price:</span>
									<span>
										{formatPrice(
											purchaseDialog.addon.price
										)}
									</span>
								</div>
								<div className='flex justify-between text-sm'>
									<span>Quantity:</span>
									<span>x{purchaseDialog.quantity}</span>
								</div>
								<div className='flex justify-between font-semibold text-lg mt-2 pt-2 border-t'>
									<span>Total:</span>
									<span>
										{formatPrice(
											purchaseDialog.addon.price *
												purchaseDialog.quantity
										)}
									</span>
								</div>
							</div>
						</div>
					)}
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setPurchaseDialog(null)}
						>
							Cancel
						</Button>
						<Button
							onClick={handlePurchase}
							disabled={isPending}
						>
							{isPending ? 'Processing...' : 'Confirm Purchase'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
