'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
	Plus,
	Pencil,
	Trash2,
	Package,
	Clock,
	Building2,
	Search,
	MoreVertical,
	Check,
	X,
	ShoppingBag,
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
} from '@/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { createAddon, updateAddon, deleteAddon } from '@/actions/perks';
import { AddonType, AddonUnitType } from '@prisma/client';

interface Addon {
	id: string;
	name: string;
	description: string | null;
	price: number;
	durationMinutes: number;
	isActive: boolean;
	availableForAllPlans: boolean;
	type: AddonType;
	category: string | null;
	unitType: AddonUnitType;
	unitLabel: string | null;
	maxQuantityPerPurchase: number | null;
	space: {
		id: string;
		name: string;
		slug: string;
		images: string[];
	} | null;
	availablePlans: {
		id: string;
		name: string;
	}[];
}

interface Space {
	id: string;
	name: string;
	slug: string;
	pricingPlans: {
		id: string;
		name: string;
	}[];
}

interface PricingPlan {
	id: string;
	name: string;
	spaceId: string;
	spaceName: string;
}

interface AdminAddonsClientProps {
	addons: Addon[];
	spaces: Space[];
	pricingPlans: PricingPlan[];
	admin: { id: string; name: string };
}

// Helper to format currency (kobo to Naira)
const formatPrice = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

// Helper to format duration
const formatDuration = (minutes: number) => {
	if (minutes < 60) return `${minutes} mins`;
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return mins > 0
		? `${hours}hr ${mins}mins`
		: `${hours} hour${hours > 1 ? 's' : ''}`;
};

export function AdminAddonsClient({
	addons: initialAddons,
	spaces,
	pricingPlans,
}: AdminAddonsClientProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [addons, setAddons] = useState(initialAddons);
	const [searchQuery, setSearchQuery] = useState('');
	const [showDialog, setShowDialog] = useState(false);
	const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

	// Form state
	const [formData, setFormData] = useState({
		name: '',
		description: '',
		spaceId: '',
		price: '',
		durationMinutes: '60',
		availableForAllPlans: true,
		selectedPlanIds: [] as string[],
		type: 'SUBSCRIPTION' as AddonType,
		category: '',
		unitType: 'QUANTITY' as AddonUnitType,
		unitLabel: '',
		maxQuantityPerPurchase: '10',
	});

	// Filter addons by search query
	const filteredAddons = addons.filter(
		(addon) =>
			addon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			addon.description?.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const resetForm = () => {
		setFormData({
			name: '',
			description: '',
			spaceId: '',
			price: '',
			durationMinutes: '60',
			availableForAllPlans: true,
			selectedPlanIds: [],
			type: 'SUBSCRIPTION',
			category: '',
			unitType: 'QUANTITY',
			unitLabel: '',
			maxQuantityPerPurchase: '10',
		});
		setEditingAddon(null);
	};

	const openCreateDialog = () => {
		resetForm();
		setShowDialog(true);
	};

	const openEditDialog = (addon: Addon) => {
		setEditingAddon(addon);
		setFormData({
			name: addon.name,
			description: addon.description || '',
			spaceId: addon.space?.id || '',
			price: (addon.price / 100).toString(),
			durationMinutes: addon.durationMinutes.toString(),
			availableForAllPlans: addon.availableForAllPlans,
			selectedPlanIds: addon.availablePlans.map((p) => p.id),
			type: addon.type,
			category: addon.category || '',
			unitType: addon.unitType,
			unitLabel: addon.unitLabel || '',
			maxQuantityPerPurchase: (
				addon.maxQuantityPerPurchase ?? 10
			).toString(),
		});
		setShowDialog(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name || !formData.price) {
			toast.error('Please fill in all required fields');
			return;
		}

		const priceInKobo = Math.round(parseFloat(formData.price) * 100);

		startTransition(async () => {
			try {
				const input = {
					name: formData.name,
					description: formData.description || undefined,
					spaceId: formData.spaceId || undefined,
					price: priceInKobo,
					durationMinutes: parseInt(formData.durationMinutes) || 60,
					availableForAllPlans: formData.availableForAllPlans,
					availablePlanIds: formData.availableForAllPlans
						? undefined
						: formData.selectedPlanIds,
					type: formData.type,
					category: formData.category || undefined,
					unitType: formData.unitType,
					unitLabel: formData.unitLabel || undefined,
					maxQuantityPerPurchase:
						parseInt(formData.maxQuantityPerPurchase) || 10,
				};

				const result = editingAddon
					? await updateAddon(editingAddon.id, input)
					: await createAddon(input);

				if (result.success) {
					toast.success(result.message);
					setShowDialog(false);
					resetForm();
					router.refresh();
				} else {
					toast.error(result.message || 'Operation failed');
				}
			} catch (error) {
				console.error('Error:', error);
				toast.error('An error occurred');
			}
		});
	};

	const handleDelete = async (addonId: string) => {
		startTransition(async () => {
			try {
				const result = await deleteAddon(addonId);

				if (result.success) {
					toast.success(result.message);
					setDeleteConfirmId(null);
					router.refresh();
				} else {
					toast.error(result.message || 'Delete failed');
				}
			} catch (error) {
				console.error('Error:', error);
				toast.error('An error occurred');
			}
		});
	};

	const togglePlanSelection = (planId: string) => {
		setFormData((prev) => ({
			...prev,
			selectedPlanIds: prev.selectedPlanIds.includes(planId)
				? prev.selectedPlanIds.filter((id) => id !== planId)
				: [...prev.selectedPlanIds, planId],
		}));
	};

	return (
		<div className='container mx-auto py-6 space-y-6'>
			{/* Header */}
			<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
				<div>
					<h1 className='text-2xl font-bold'>Add-ons Management</h1>
					<p className='text-muted-foreground'>
						Create and manage subscription add-ons
					</p>
				</div>
				<div className='flex gap-2'>
					<Link href='/admin/addons/purchases'>
						<Button variant='outline'>
							<ShoppingBag className='mr-2 h-4 w-4' />
							View Purchases
						</Button>
					</Link>
					<Button onClick={openCreateDialog}>
						<Plus className='mr-2 h-4 w-4' />
						Create Add-on
					</Button>
				</div>
			</div>

			{/* Stats Cards */}
			<div className='grid gap-4 md:grid-cols-4'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardTitle className='text-sm font-medium'>
							Total Add-ons
						</CardTitle>
						<Package className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{addons.length}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardTitle className='text-sm font-medium'>
							Active
						</CardTitle>
						<Check className='h-4 w-4 text-green-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{addons.filter((a) => a.isActive).length}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardTitle className='text-sm font-medium'>
							Inactive
						</CardTitle>
						<X className='h-4 w-4 text-red-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{addons.filter((a) => !a.isActive).length}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardTitle className='text-sm font-medium'>
							Space-Linked
						</CardTitle>
						<Building2 className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{addons.filter((a) => a.space).length}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Search and Table */}
			<Card>
				<CardHeader>
					<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
						<div>
							<CardTitle>All Add-ons</CardTitle>
							<CardDescription>
								Manage your subscription add-ons and pricing
							</CardDescription>
						</div>
						<div className='relative w-full sm:w-64'>
							<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
							<Input
								placeholder='Search add-ons...'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className='pl-9'
							/>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{filteredAddons.length === 0 ? (
						<div className='text-center py-12 text-muted-foreground'>
							<Package className='h-12 w-12 mx-auto mb-4 opacity-50' />
							<p className='font-medium'>No add-ons found</p>
							<p className='text-sm mt-1'>
								{searchQuery
									? 'Try a different search term'
									: 'Create your first add-on to get started'}
							</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Price</TableHead>
									<TableHead>Unit</TableHead>
									<TableHead>Space</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className='text-right'>
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredAddons.map((addon) => (
									<TableRow key={addon.id}>
										<TableCell>
											<div>
												<p className='font-medium'>
													{addon.name}
												</p>
												{addon.description && (
													<p className='text-sm text-muted-foreground truncate max-w-xs'>
														{addon.description}
													</p>
												)}
												{addon.category && (
													<Badge
														variant='outline'
														className='mt-1 text-xs'
													>
														{addon.category}
													</Badge>
												)}
											</div>
										</TableCell>
										<TableCell>
											<Badge
												variant={
													addon.type ===
													'SUBSCRIPTION'
														? 'default'
														: addon.type ===
														  'BOOKING'
														? 'secondary'
														: addon.type === 'SHOP'
														? 'outline'
														: 'default'
												}
											>
												{addon.type}
											</Badge>
										</TableCell>
										<TableCell className='font-medium'>
											{formatPrice(addon.price)}
										</TableCell>
										<TableCell>
											<div className='text-sm'>
												<span className='text-muted-foreground'>
													{addon.unitType ===
													'HOURS' ? (
														<span className='flex items-center gap-1'>
															<Clock className='h-3 w-3' />
															{addon.unitLabel ||
																`${addon.durationMinutes} mins`}
														</span>
													) : addon.unitType ===
													  'DAYS' ? (
														addon.unitLabel ||
														'Days'
													) : addon.unitType ===
													  'ACCESS' ? (
														addon.unitLabel ||
														'Access'
													) : (
														addon.unitLabel ||
														`Max ${addon.maxQuantityPerPurchase}`
													)}
												</span>
											</div>
										</TableCell>
										<TableCell>
											{addon.space ? (
												<Badge variant='secondary'>
													{addon.space.name}
												</Badge>
											) : (
												<span className='text-muted-foreground'>
													-
												</span>
											)}
										</TableCell>
										<TableCell>
											{addon.isActive ? (
												<Badge className='bg-green-100 text-green-700'>
													Active
												</Badge>
											) : (
												<Badge variant='secondary'>
													Inactive
												</Badge>
											)}
										</TableCell>
										<TableCell className='text-right'>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant='ghost'
														size='icon'
													>
														<MoreVertical className='h-4 w-4' />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align='end'>
													<DropdownMenuItem
														onClick={() =>
															openEditDialog(
																addon
															)
														}
													>
														<Pencil className='mr-2 h-4 w-4' />
														Edit
													</DropdownMenuItem>
													<DropdownMenuItem
														className='text-red-600'
														onClick={() =>
															setDeleteConfirmId(
																addon.id
															)
														}
													>
														<Trash2 className='mr-2 h-4 w-4' />
														Delete
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* Create/Edit Dialog */}
			<Dialog
				open={showDialog}
				onOpenChange={setShowDialog}
			>
				<DialogContent className='max-w-lg max-h-[90vh] overflow-y-auto'>
					<DialogHeader>
						<DialogTitle>
							{editingAddon ? 'Edit Add-on' : 'Create Add-on'}
						</DialogTitle>
						<DialogDescription>
							{editingAddon
								? 'Update the add-on details'
								: 'Create a new subscription add-on'}
						</DialogDescription>
					</DialogHeader>

					<form
						onSubmit={handleSubmit}
						className='space-y-4'
					>
						<div className='space-y-2'>
							<Label htmlFor='name'>
								Name <span className='text-red-500'>*</span>
							</Label>
							<Input
								id='name'
								placeholder='e.g., Board Room - 1 Hour'
								value={formData.name}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										name: e.target.value,
									}))
								}
								required
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='description'>Description</Label>
							<Textarea
								id='description'
								placeholder='Describe what this add-on includes...'
								value={formData.description}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										description: e.target.value,
									}))
								}
								rows={3}
							/>
						</div>

						{/* Type and Category Row */}
						<div className='grid grid-cols-2 gap-4'>
							<div className='space-y-2'>
								<Label htmlFor='type'>
									Type <span className='text-red-500'>*</span>
								</Label>
								<Select
									value={formData.type}
									onValueChange={(value: AddonType) =>
										setFormData((prev) => ({
											...prev,
											type: value,
										}))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder='Select type...' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='SUBSCRIPTION'>
											Subscription
										</SelectItem>
										<SelectItem value='BOOKING'>
											Booking
										</SelectItem>
										<SelectItem value='SHOP'>
											Shop
										</SelectItem>
										<SelectItem value='UNIVERSAL'>
											Universal
										</SelectItem>
									</SelectContent>
								</Select>
								<p className='text-xs text-muted-foreground'>
									{formData.type === 'SUBSCRIPTION' &&
										'For members with active subscriptions'}
									{formData.type === 'BOOKING' &&
										'Add-on for bookings (e.g., extra hours)'}
									{formData.type === 'SHOP' &&
										'Standalone purchase (e.g., coffee bundles)'}
									{formData.type === 'UNIVERSAL' &&
										'Available to all users'}
								</p>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='category'>Category</Label>
								<Input
									id='category'
									placeholder='e.g., Beverages, Services'
									value={formData.category}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											category: e.target.value,
										}))
									}
								/>
							</div>
						</div>

						{/* Price and Unit Type Row */}
						<div className='grid grid-cols-2 gap-4'>
							<div className='space-y-2'>
								<Label htmlFor='price'>
									Price (₦){' '}
									<span className='text-red-500'>*</span>
								</Label>
								<Input
									id='price'
									type='number'
									min='0'
									step='0.01'
									placeholder='5000'
									value={formData.price}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											price: e.target.value,
										}))
									}
									required
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='unitType'>
									Unit Type{' '}
									<span className='text-red-500'>*</span>
								</Label>
								<Select
									value={formData.unitType}
									onValueChange={(value: AddonUnitType) =>
										setFormData((prev) => ({
											...prev,
											unitType: value,
										}))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder='Select unit...' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='QUANTITY'>
											Quantity
										</SelectItem>
										<SelectItem value='HOURS'>
											Hours
										</SelectItem>
										<SelectItem value='DAYS'>
											Days
										</SelectItem>
										<SelectItem value='ACCESS'>
											Access Pass
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* Unit Label and Max Quantity Row */}
						<div className='grid grid-cols-2 gap-4'>
							<div className='space-y-2'>
								<Label htmlFor='unitLabel'>Unit Label</Label>
								<Input
									id='unitLabel'
									placeholder='e.g., "cups", "sessions"'
									value={formData.unitLabel}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											unitLabel: e.target.value,
										}))
									}
								/>
								<p className='text-xs text-muted-foreground'>
									Display label for the unit (optional)
								</p>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='maxQuantity'>
									Max Quantity per Purchase
								</Label>
								<Input
									id='maxQuantity'
									type='number'
									min='1'
									placeholder='10'
									value={formData.maxQuantityPerPurchase}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											maxQuantityPerPurchase:
												e.target.value,
										}))
									}
								/>
							</div>
						</div>

						{/* Duration (for time-based add-ons) */}
						{(formData.unitType === 'HOURS' ||
							formData.type === 'BOOKING') && (
							<div className='space-y-2'>
								<Label htmlFor='duration'>
									Duration (minutes)
								</Label>
								<Input
									id='duration'
									type='number'
									min='1'
									placeholder='60'
									value={formData.durationMinutes}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											durationMinutes: e.target.value,
										}))
									}
								/>
								<p className='text-xs text-muted-foreground'>
									Time allocation per unit (for booking
									add-ons)
								</p>
							</div>
						)}

						<div className='space-y-2'>
							<Label htmlFor='space'>
								Link to Space (Optional)
							</Label>
							<Select
								value={formData.spaceId}
								onValueChange={(value) =>
									setFormData((prev) => ({
										...prev,
										spaceId: value === 'none' ? '' : value,
									}))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder='Select a space...' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='none'>
										No specific space
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
							<p className='text-xs text-muted-foreground'>
								Link this add-on to a specific space (e.g.,
								Board Room access)
							</p>
						</div>

						{formData.type === 'SUBSCRIPTION' && (
							<div className='space-y-4 border rounded-lg p-4'>
								<div className='flex items-center justify-between'>
									<div>
										<Label>Available for All Plans</Label>
										<p className='text-xs text-muted-foreground'>
											Make this add-on available to all
											subscription plans
										</p>
									</div>
									<Switch
										checked={formData.availableForAllPlans}
										onCheckedChange={(checked) =>
											setFormData((prev) => ({
												...prev,
												availableForAllPlans: checked,
											}))
										}
									/>
								</div>

								{!formData.availableForAllPlans && (
									<div className='space-y-2 pt-2 border-t'>
										<Label>Select Plans</Label>
										<div className='grid gap-2 max-h-48 overflow-y-auto'>
											{pricingPlans.map((plan) => (
												<div
													key={plan.id}
													className='flex items-center space-x-2'
												>
													<Checkbox
														id={plan.id}
														checked={formData.selectedPlanIds.includes(
															plan.id
														)}
														onCheckedChange={() =>
															togglePlanSelection(
																plan.id
															)
														}
													/>
													<Label
														htmlFor={plan.id}
														className='text-sm font-normal cursor-pointer'
													>
														{plan.name}
													</Label>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						)}

						<DialogFooter>
							<Button
								type='button'
								variant='outline'
								onClick={() => setShowDialog(false)}
							>
								Cancel
							</Button>
							<Button
								type='submit'
								disabled={isPending}
							>
								{isPending
									? 'Saving...'
									: editingAddon
									? 'Update'
									: 'Create'}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog
				open={!!deleteConfirmId}
				onOpenChange={() => setDeleteConfirmId(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Add-on</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this add-on? This
							action will deactivate it but preserve existing
							purchase records.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setDeleteConfirmId(null)}
						>
							Cancel
						</Button>
						<Button
							variant='destructive'
							onClick={() =>
								deleteConfirmId && handleDelete(deleteConfirmId)
							}
							disabled={isPending}
						>
							{isPending ? 'Deleting...' : 'Delete'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
