'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
	Plus,
	ShoppingCart,
	Clock,
	CheckCircle,
	AlertCircle,
	Loader2,
	Package,
	CreditCard,
} from 'lucide-react';
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
	DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
	getAddons,
	purchaseAddon,
	getMemberAddonPurchases,
} from '@/actions/perks';
import { initializeAddonPayment } from '@/actions/payments';

interface Addon {
	id: string;
	name: string;
	description: string | null;
	price: number;
	durationMinutes: number;
	space: {
		id: string;
		name: string;
		slug: string;
		images: string[];
	} | null;
}

interface AddonPurchase {
	id: string;
	quantity: number;
	usedQuantity: number;
	totalAmount: number;
	status: string;
	expiresAt: Date | null;
	addon: {
		id: string;
		name: string;
		durationMinutes: number;
	};
}

interface AddonsManagementProps {
	membershipId: string;
	pricingPlanId: string;
	isActive: boolean;
}

// Helper to format currency (kobo to Naira)
const formatPrice = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

// Helper to format duration
const formatDuration = (minutes: number) => {
	if (minutes < 60) return `${minutes} mins`;
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return mins > 0 ? `${hours}hr ${mins}mins` : `${hours} hour${hours > 1 ? 's' : ''}`;
};

export function AddonsManagement({
	membershipId,
	pricingPlanId,
	isActive,
}: AddonsManagementProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [availableAddons, setAvailableAddons] = useState<Addon[]>([]);
	const [myPurchases, setMyPurchases] = useState<AddonPurchase[]>([]);
	const [loading, setLoading] = useState(true);
	const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
	const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null);
	const [quantity, setQuantity] = useState(1);

	// Fetch addons and purchases
	useEffect(() => {
		async function fetchData() {
			setLoading(true);
			try {
				const [addonsResult, purchasesResult] = await Promise.all([
					getAddons({ pricingPlanId }),
					getMemberAddonPurchases(membershipId),
				]);

				if (addonsResult.success) {
					setAvailableAddons(addonsResult.data as Addon[]);
				}
				if (purchasesResult.success) {
					setMyPurchases(purchasesResult.data as AddonPurchase[]);
				}
			} catch (error) {
				console.error('Error fetching addons:', error);
			} finally {
				setLoading(false);
			}
		}

		fetchData();
	}, [membershipId, pricingPlanId]);

	const handlePurchaseClick = (addon: Addon) => {
		setSelectedAddon(addon);
		setQuantity(1);
		setShowPurchaseDialog(true);
	};

	const handlePurchase = () => {
		if (!selectedAddon) return;

		startTransition(async () => {
			try {
				// Create the addon purchase
				const result = await purchaseAddon({
					addonId: selectedAddon.id,
					membershipId,
					quantity,
				});

				if (!result.success) {
					toast.error(result.message || 'Failed to purchase add-on');
					return;
				}

				const purchase = result.data;
				if (!purchase) {
					toast.error('Purchase created but no data returned');
					return;
				}

				// Initialize payment
				const paymentResult = await initializeAddonPayment({
					addonPurchaseId: purchase.id,
					callbackUrl: `${window.location.origin}/dashboard/subscriptions/${membershipId}?addon=success`,
				});

				if (paymentResult.success && paymentResult.data?.authorizationUrl) {
					window.location.href = paymentResult.data.authorizationUrl;
				} else {
					// For demo, just refresh
					toast.success('Add-on purchased successfully!');
					setShowPurchaseDialog(false);
					router.refresh();
				}
			} catch (error) {
				console.error('Purchase error:', error);
				toast.error('An error occurred during purchase');
			}
		});
	};

	// Status badge for purchases
	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'ACTIVE':
				return (
					<Badge className='bg-green-100 text-green-700'>
						<CheckCircle className='mr-1 h-3 w-3' />
						Active
					</Badge>
				);
			case 'PENDING':
				return (
					<Badge variant='outline'>
						<Clock className='mr-1 h-3 w-3' />
						Pending Payment
					</Badge>
				);
			case 'EXPIRED':
				return (
					<Badge variant='secondary'>
						<AlertCircle className='mr-1 h-3 w-3' />
						Expired
					</Badge>
				);
			case 'USED':
				return (
					<Badge variant='secondary'>
						<CheckCircle className='mr-1 h-3 w-3' />
						Used
					</Badge>
				);
			default:
				return <Badge variant='outline'>{status}</Badge>;
		}
	};

	if (loading) {
		return (
			<Card>
				<CardContent className='flex items-center justify-center py-8'>
					<Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
				</CardContent>
			</Card>
		);
	}

	// Calculate active purchases
	const activePurchases = myPurchases.filter(
		(p) => p.status === 'ACTIVE' && p.usedQuantity < p.quantity
	);

	return (
		<Card>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<div>
						<CardTitle className='flex items-center gap-2'>
							<Package className='h-5 w-5' />
							Add-ons
						</CardTitle>
						<CardDescription>
							Purchase additional services for your subscription
						</CardDescription>
					</div>
					{isActive && availableAddons.length > 0 && (
						<Dialog
							open={showPurchaseDialog}
							onOpenChange={setShowPurchaseDialog}
						>
							<DialogTrigger asChild>
								<Button size='sm'>
									<Plus className='mr-2 h-4 w-4' />
									Browse Add-ons
								</Button>
							</DialogTrigger>
							<DialogContent className='max-w-lg'>
								<DialogHeader>
									<DialogTitle>Available Add-ons</DialogTitle>
									<DialogDescription>
										Select an add-on to enhance your
										subscription
									</DialogDescription>
								</DialogHeader>

								{selectedAddon ? (
									<div className='space-y-4'>
										<div className='p-4 border rounded-lg'>
											<h4 className='font-semibold'>
												{selectedAddon.name}
											</h4>
											{selectedAddon.description && (
												<p className='text-sm text-muted-foreground mt-1'>
													{selectedAddon.description}
												</p>
											)}
											<div className='flex items-center gap-4 mt-3'>
												<Badge variant='outline'>
													<Clock className='mr-1 h-3 w-3' />
													{formatDuration(
														selectedAddon.durationMinutes
													)}
												</Badge>
												<span className='font-semibold text-primary'>
													{formatPrice(
														selectedAddon.price
													)}
												</span>
											</div>
										</div>

										<div className='space-y-2'>
											<Label htmlFor='quantity'>
												Quantity
											</Label>
											<Input
												id='quantity'
												type='number'
												min={1}
												max={10}
												value={quantity}
												onChange={(e) =>
													setQuantity(
														parseInt(
															e.target.value
														) || 1
													)
												}
											/>
										</div>

										<Separator />

										<div className='flex justify-between items-center font-semibold'>
											<span>Total</span>
											<span className='text-lg text-primary'>
												{formatPrice(
													selectedAddon.price *
														quantity
												)}
											</span>
										</div>

										<DialogFooter className='gap-2'>
											<Button
												variant='outline'
												onClick={() =>
													setSelectedAddon(null)
												}
											>
												Back
											</Button>
											<Button
												onClick={handlePurchase}
												disabled={isPending}
											>
												{isPending ? (
													<>
														<Loader2 className='mr-2 h-4 w-4 animate-spin' />
														Processing...
													</>
												) : (
													<>
														<CreditCard className='mr-2 h-4 w-4' />
														Pay Now
													</>
												)}
											</Button>
										</DialogFooter>
									</div>
								) : (
									<div className='space-y-3 max-h-96 overflow-y-auto'>
										{availableAddons.map((addon) => (
											<div
												key={addon.id}
												className='p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors'
												onClick={() =>
													handlePurchaseClick(addon)
												}
											>
												<div className='flex justify-between items-start'>
													<div>
														<h4 className='font-medium'>
															{addon.name}
														</h4>
														{addon.description && (
															<p className='text-sm text-muted-foreground mt-1'>
																{
																	addon.description
																}
															</p>
														)}
														<div className='flex items-center gap-2 mt-2'>
															<Badge variant='outline'>
																<Clock className='mr-1 h-3 w-3' />
																{formatDuration(
																	addon.durationMinutes
																)}
															</Badge>
															{addon.space && (
																<Badge variant='secondary'>
																	{
																		addon
																			.space
																			.name
																	}
																</Badge>
															)}
														</div>
													</div>
													<span className='font-semibold text-primary'>
														{formatPrice(
															addon.price
														)}
													</span>
												</div>
											</div>
										))}
									</div>
								)}
							</DialogContent>
						</Dialog>
					)}
				</div>
			</CardHeader>

			<CardContent>
				{myPurchases.length === 0 ? (
					<div className='text-center py-6 text-muted-foreground'>
						<ShoppingCart className='h-12 w-12 mx-auto mb-3 opacity-50' />
						<p>No add-ons purchased yet</p>
						{isActive && availableAddons.length > 0 && (
							<p className='text-sm mt-1'>
								Browse available add-ons to enhance your
								subscription
							</p>
						)}
					</div>
				) : (
					<div className='space-y-4'>
						{/* Active purchases summary */}
						{activePurchases.length > 0 && (
							<div className='p-3 bg-green-50 border border-green-200 rounded-lg'>
								<p className='text-sm font-medium text-green-700'>
									{activePurchases.length} active add-on
									{activePurchases.length !== 1 ? 's' : ''}{' '}
									available
								</p>
							</div>
						)}

						{/* Purchase list */}
						<div className='space-y-3'>
							{myPurchases.map((purchase) => (
								<div
									key={purchase.id}
									className='flex items-center justify-between p-3 border rounded-lg'
								>
									<div>
										<p className='font-medium'>
											{purchase.addon.name}
										</p>
										<div className='flex items-center gap-2 mt-1'>
											<span className='text-sm text-muted-foreground'>
												{purchase.usedQuantity} /{' '}
												{purchase.quantity} used
											</span>
											<span className='text-sm text-muted-foreground'>
												•
											</span>
											<span className='text-sm text-muted-foreground'>
												{formatDuration(
													purchase.addon
														.durationMinutes
												)}{' '}
												each
											</span>
										</div>
									</div>
									{getStatusBadge(purchase.status)}
								</div>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
