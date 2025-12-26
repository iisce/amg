'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Package,
	Plus,
	Search,
	Calendar,
	CalendarDays,
	Users,
	LayoutGrid,
	FileText,
	QrCode,
	UserPlus,
	Loader2,
	ShoppingCart,
	Store,
	Coffee,
	Clock,
	CheckCircle,
	Utensils,
	DollarSign,
	X,
	Check,
	Blocks,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
	createShopCategory,
	createShopItem,
	updateShopOrderStatus,
	type ShopItemWithRelations,
	type ShopOrderWithItems,
} from '@/actions/shop';
import type { ShopCategory, ShopOrderStatus } from '@prisma/client';
import type { InventoryItemWithCategory } from '@/actions/inventory';

interface SessionUser {
	id: string;
	email: string;
	name: string;
	role: string;
}

interface ShopStats {
	totalItems: number;
	totalCategories: number;
	pendingOrders: number;
	todayRevenue: number;
	todayOrders: number;
}

interface AdminShopClientProps {
	categories: ShopCategory[];
	items: ShopItemWithRelations[];
	pendingOrders: ShopOrderWithItems[];
	stats: ShopStats | null;
	inventoryItems: InventoryItemWithCategory[];
	admin: SessionUser;
}

// Helper to format currency
const formatPrice = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

// Order status colors
const statusColors: Record<ShopOrderStatus, string> = {
	PENDING: 'bg-amber-100 text-amber-700',
	PAID: 'bg-blue-100 text-blue-700',
	PREPARING: 'bg-purple-100 text-purple-700',
	READY: 'bg-green-100 text-green-700',
	SERVED: 'bg-gray-100 text-gray-700',
	CANCELLED: 'bg-red-100 text-red-700',
};

// Order status icons
const statusIcons: Record<ShopOrderStatus, React.ReactNode> = {
	PENDING: <Clock className='h-4 w-4' />,
	PAID: <CheckCircle className='h-4 w-4' />,
	PREPARING: <Coffee className='h-4 w-4' />,
	READY: <Utensils className='h-4 w-4' />,
	SERVED: <Check className='h-4 w-4' />,
	CANCELLED: <X className='h-4 w-4' />,
};

export function AdminShopClient({
	categories,
	items,
	pendingOrders,
	stats,
	inventoryItems,
	admin,
}: AdminShopClientProps) {
	const [isPending, startTransition] = useTransition();
	const [searchTerm, setSearchTerm] = useState('');
	const [categoryFilter, setCategoryFilter] = useState<string>('all');
	const [showAddItem, setShowAddItem] = useState(false);
	const [showAddCategory, setShowAddCategory] = useState(false);
	const [isComposite, setIsComposite] = useState(false);
	const [components, setComponents] = useState<
		Array<{ inventoryItemId: string; quantity: number }>
	>([]);

	// Filter items
	const filteredItems = items.filter((item) => {
		const matchesSearch = item.name
			.toLowerCase()
			.includes(searchTerm.toLowerCase());
		const matchesCategory =
			categoryFilter === 'all' || item.categoryId === categoryFilter;
		return matchesSearch && matchesCategory;
	});

	// Add component handler
	const addComponent = () => {
		setComponents([...components, { inventoryItemId: '', quantity: 1 }]);
	};

	const removeComponent = (index: number) => {
		setComponents(components.filter((_, i) => i !== index));
	};

	const updateComponent = (
		index: number,
		field: 'inventoryItemId' | 'quantity',
		value: string | number
	) => {
		const updated = [...components];
		updated[index] = { ...updated[index], [field]: value };
		setComponents(updated);
	};

	// Add Category Form
	const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		startTransition(async () => {
			const result = await createShopCategory({
				name: formData.get('name') as string,
				description: formData.get('description') as string,
			});

			if (result.success) {
				toast.success('Category created successfully');
				setShowAddCategory(false);
			} else {
				toast.error(result.error || 'Failed to create category');
			}
		});
	};

	// Add Item Form
	const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		const inventoryItemId = formData.get('inventoryItemId') as string;
		const validInventoryItemId =
			inventoryItemId && inventoryItemId !== 'none'
				? inventoryItemId
				: undefined;

		startTransition(async () => {
			const result = await createShopItem({
				categoryId: formData.get('categoryId') as string,
				name: formData.get('name') as string,
				description: formData.get('description') as string,
				price: Math.round(
					parseFloat(formData.get('price') as string) * 100
				),
				isComposite,
				preparationTime: isComposite
					? parseInt(formData.get('preparationTime') as string) || 0
					: undefined,
				components: isComposite ? components : undefined,
				inventoryItemId: !isComposite
					? validInventoryItemId
					: undefined,
			});

			if (result.success) {
				toast.success('Item created successfully');
				setShowAddItem(false);
				setIsComposite(false);
				setComponents([]);
			} else {
				toast.error(result.error || 'Failed to create item');
			}
		});
	};

	// Update order status
	const handleUpdateStatus = async (
		orderId: string,
		status: ShopOrderStatus
	) => {
		startTransition(async () => {
			const result = await updateShopOrderStatus(orderId, status);

			if (result.success) {
				toast.success(`Order marked as ${status.toLowerCase()}`);
			} else {
				toast.error(result.error || 'Failed to update order');
			}
		});
	};

	return (
		<div className='min-h-screen bg-background'>
			{/* Header */}
			<section className='bg-secondary text-secondary-foreground px-4 py-6 border-b'>
				<div className='container mx-auto'>
					<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
						<div>
							<div className='flex items-center gap-2 mb-2'>
								<Badge className='bg-red-600 text-white'>
									Admin
								</Badge>
								<span className='text-sm text-secondary-foreground/70'>
									Staff Portal
								</span>
							</div>
							<h1 className='text-2xl font-bold'>
								Shop Management
							</h1>
							<p className='text-sm text-secondary-foreground/70'>
								Manage shop items, categories, and orders
							</p>
						</div>
						<div className='flex gap-2'>
							<Dialog
								open={showAddCategory}
								onOpenChange={setShowAddCategory}
							>
								<DialogTrigger asChild>
									<Button
										variant='outline'
										size='sm'
										className='bg-transparent'
									>
										<Plus className='mr-2 h-4 w-4' />
										Add Category
									</Button>
								</DialogTrigger>
								<DialogContent>
									<form onSubmit={handleAddCategory}>
										<DialogHeader>
											<DialogTitle>
												Add Shop Category
											</DialogTitle>
											<DialogDescription>
												Create a new category for shop
												items
											</DialogDescription>
										</DialogHeader>
										<div className='space-y-4 py-4'>
											<div className='space-y-2'>
												<Label htmlFor='name'>
													Category Name
												</Label>
												<Input
													id='name'
													name='name'
													placeholder='e.g., Hot Drinks, Cold Drinks, Snacks'
													required
												/>
											</div>
											<div className='space-y-2'>
												<Label htmlFor='description'>
													Description
												</Label>
												<Textarea
													id='description'
													name='description'
													placeholder='Category description...'
												/>
											</div>
										</div>
										<DialogFooter>
											<Button
												type='submit'
												disabled={isPending}
											>
												{isPending && (
													<Loader2 className='mr-2 h-4 w-4 animate-spin' />
												)}
												Create Category
											</Button>
										</DialogFooter>
									</form>
								</DialogContent>
							</Dialog>

							<Dialog
								open={showAddItem}
								onOpenChange={(open) => {
									setShowAddItem(open);
									if (!open) {
										setIsComposite(false);
										setComponents([]);
									}
								}}
							>
								<DialogTrigger asChild>
									<Button size='sm'>
										<Plus className='mr-2 h-4 w-4' />
										Add Item
									</Button>
								</DialogTrigger>
								<DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
									<form onSubmit={handleAddItem}>
										<DialogHeader>
											<DialogTitle>
												Add Shop Item
											</DialogTitle>
											<DialogDescription>
												Add a new item to sell in the
												shop
											</DialogDescription>
										</DialogHeader>
										<div className='space-y-4 py-4'>
											<div className='grid grid-cols-2 gap-4'>
												<div className='space-y-2'>
													<Label htmlFor='categoryId'>
														Category
													</Label>
													<Select
														name='categoryId'
														required
													>
														<SelectTrigger>
															<SelectValue placeholder='Select category' />
														</SelectTrigger>
														<SelectContent>
															{categories.map(
																(cat) => (
																	<SelectItem
																		key={
																			cat.id
																		}
																		value={
																			cat.id
																		}
																	>
																		{
																			cat.name
																		}
																	</SelectItem>
																)
															)}
														</SelectContent>
													</Select>
												</div>
												<div className='space-y-2'>
													<Label htmlFor='itemName'>
														Item Name
													</Label>
													<Input
														id='itemName'
														name='name'
														placeholder='e.g., Coffee Cup Small'
														required
													/>
												</div>
											</div>

											<div className='space-y-2'>
												<Label htmlFor='itemDesc'>
													Description
												</Label>
												<Textarea
													id='itemDesc'
													name='description'
													placeholder='Item description...'
												/>
											</div>

											<div className='space-y-2'>
												<Label htmlFor='price'>
													Price (₦)
												</Label>
												<Input
													id='price'
													name='price'
													type='number'
													step='0.01'
													min='0'
													placeholder='0.00'
													required
												/>
											</div>

											<div className='flex items-center gap-2 p-3 bg-muted rounded-lg'>
												<input
													type='checkbox'
													id='isComposite'
													checked={isComposite}
													onChange={(e) =>
														setIsComposite(
															e.target.checked
														)
													}
													className='h-4 w-4'
												/>
												<div>
													<Label
														htmlFor='isComposite'
														className='cursor-pointer'
													>
														Composite Item (made
														from inventory items)
													</Label>
													<p className='text-xs text-muted-foreground'>
														e.g., Coffee made from
														coffee sachet + sugar +
														milk + cup
													</p>
												</div>
											</div>

											{isComposite ? (
												<>
													<div className='space-y-2'>
														<Label htmlFor='preparationTime'>
															Preparation Time
															(minutes)
														</Label>
														<Input
															id='preparationTime'
															name='preparationTime'
															type='number'
															min='0'
															defaultValue='5'
														/>
														<p className='text-xs text-muted-foreground'>
															Time to prepare this
															item
														</p>
													</div>

													<div className='space-y-2'>
														<div className='flex items-center justify-between'>
															<Label>
																Components
																(Recipe)
															</Label>
															<Button
																type='button'
																variant='outline'
																size='sm'
																onClick={
																	addComponent
																}
															>
																<Plus className='mr-2 h-4 w-4' />
																Add Component
															</Button>
														</div>
														{components.length ===
														0 ? (
															<div className='p-4 border border-dashed rounded-lg text-center text-muted-foreground'>
																No components
																added. Click
																"Add Component"
																to start.
															</div>
														) : (
															<div className='space-y-2'>
																{components.map(
																	(
																		comp,
																		index
																	) => (
																		<div
																			key={
																				index
																			}
																			className='flex items-center gap-2 p-2 bg-muted rounded'
																		>
																			<Select
																				value={
																					comp.inventoryItemId
																				}
																				onValueChange={(
																					val
																				) =>
																					updateComponent(
																						index,
																						'inventoryItemId',
																						val
																					)
																				}
																			>
																				<SelectTrigger className='flex-1'>
																					<SelectValue placeholder='Select item' />
																				</SelectTrigger>
																				<SelectContent>
																					{inventoryItems.map(
																						(
																							item
																						) => (
																							<SelectItem
																								key={
																									item.id
																								}
																								value={
																									item.id
																								}
																							>
																								{
																									item.name
																								}{' '}
																								(
																								{
																									item.currentStock
																								}{' '}
																								{
																									item.baseUnit
																								}
																								s
																								available)
																							</SelectItem>
																						)
																					)}
																				</SelectContent>
																			</Select>
																			<Input
																				type='number'
																				min='1'
																				value={
																					comp.quantity
																				}
																				onChange={(
																					e
																				) =>
																					updateComponent(
																						index,
																						'quantity',
																						parseInt(
																							e
																								.target
																								.value
																						) ||
																							1
																					)
																				}
																				className='w-20'
																			/>
																			<span className='text-sm text-muted-foreground'>
																				units
																			</span>
																			<Button
																				type='button'
																				variant='ghost'
																				size='sm'
																				onClick={() =>
																					removeComponent(
																						index
																					)
																				}
																			>
																				<X className='h-4 w-4' />
																			</Button>
																		</div>
																	)
																)}
															</div>
														)}
													</div>
												</>
											) : (
												<div className='space-y-2'>
													<Label htmlFor='inventoryItemId'>
														Link to Inventory Item
														(optional)
													</Label>
													<Select name='inventoryItemId'>
														<SelectTrigger>
															<SelectValue placeholder='Select inventory item' />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value='none'>
																None (manual)
															</SelectItem>
															{inventoryItems
																.filter(
																	(item) =>
																		item.showInShop
																)
																.map((item) => (
																	<SelectItem
																		key={
																			item.id
																		}
																		value={
																			item.id
																		}
																	>
																		{
																			item.name
																		}{' '}
																		(
																		{
																			item.currentStock
																		}{' '}
																		available)
																	</SelectItem>
																))}
														</SelectContent>
													</Select>
													<p className='text-xs text-muted-foreground'>
														Directly sell an
														inventory item (e.g.,
														bottled drinks)
													</p>
												</div>
											)}
										</div>
										<DialogFooter>
											<Button
												type='submit'
												disabled={isPending}
											>
												{isPending && (
													<Loader2 className='mr-2 h-4 w-4 animate-spin' />
												)}
												Create Item
											</Button>
										</DialogFooter>
									</form>
								</DialogContent>
							</Dialog>
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
							href='/admin/members'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<Users className='h-4 w-4' />
							Members
						</Link>
						<Link
							href='/admin/spaces'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<LayoutGrid className='h-4 w-4' />
							Spaces
						</Link>
						<Link
							href='/admin/scanner'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<QrCode className='h-4 w-4' />
							Scanner
						</Link>
						<Link
							href='/admin/visitors'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<UserPlus className='h-4 w-4' />
							Visitors
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
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-primary text-foreground'
						>
							<Store className='h-4 w-4' />
							Shop
						</Link>
						<Link
							href='/admin/addons'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<Blocks className='h-4 w-4' />
							Add-ons
						</Link>
						<Link
							href='/admin/reports'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<FileText className='h-4 w-4' />
							Reports
						</Link>
					</nav>
				</div>
			</section>

			{/* Main Content */}
			<main className='container mx-auto px-4 py-8'>
				{/* Stats Cards */}
				<div className='grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8'>
					<Card>
						<CardHeader className='pb-2'>
							<CardTitle className='text-sm font-medium text-muted-foreground'>
								Shop Items
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='flex items-center gap-2'>
								<ShoppingCart className='h-5 w-5 text-primary' />
								<span className='text-2xl font-bold'>
									{stats?.totalItems ?? 0}
								</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='pb-2'>
							<CardTitle className='text-sm font-medium text-muted-foreground'>
								Categories
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='flex items-center gap-2'>
								<Store className='h-5 w-5 text-blue-500' />
								<span className='text-2xl font-bold'>
									{stats?.totalCategories ?? 0}
								</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='pb-2'>
							<CardTitle className='text-sm font-medium text-muted-foreground'>
								Pending Orders
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='flex items-center gap-2'>
								<Clock className='h-5 w-5 text-amber-500' />
								<span className='text-2xl font-bold'>
									{stats?.pendingOrders ?? 0}
								</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='pb-2'>
							<CardTitle className='text-sm font-medium text-muted-foreground'>
								Today's Orders
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='flex items-center gap-2'>
								<CheckCircle className='h-5 w-5 text-green-500' />
								<span className='text-2xl font-bold'>
									{stats?.todayOrders ?? 0}
								</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='pb-2'>
							<CardTitle className='text-sm font-medium text-muted-foreground'>
								Today's Revenue
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='flex items-center gap-2'>
								<DollarSign className='h-5 w-5 text-green-500' />
								<span className='text-2xl font-bold'>
									{formatPrice(stats?.todayRevenue ?? 0)}
								</span>
							</div>
						</CardContent>
					</Card>
				</div>

				<Tabs
					defaultValue='orders'
					className='space-y-6'
				>
					<TabsList>
						<TabsTrigger value='orders'>
							Active Orders
							{pendingOrders.length > 0 && (
								<Badge
									variant='destructive'
									className='ml-2'
								>
									{pendingOrders.length}
								</Badge>
							)}
						</TabsTrigger>
						<TabsTrigger value='items'>Shop Items</TabsTrigger>
						<TabsTrigger value='categories'>Categories</TabsTrigger>
					</TabsList>

					{/* Active Orders Tab */}
					<TabsContent value='orders'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Coffee className='h-5 w-5' />
									Active Orders
								</CardTitle>
								<CardDescription>
									Orders that need preparation or serving
								</CardDescription>
							</CardHeader>
							<CardContent>
								{pendingOrders.length === 0 ? (
									<div className='text-center py-12 text-muted-foreground'>
										<CheckCircle className='h-12 w-12 mx-auto mb-4 opacity-50' />
										<p>No pending orders</p>
										<p className='text-sm'>
											All orders have been served!
										</p>
									</div>
								) : (
									<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
										{pendingOrders.map((order) => (
											<Card
												key={order.id}
												className='border-2'
											>
												<CardHeader className='pb-2'>
													<div className='flex items-center justify-between'>
														<div>
															<p className='font-mono text-xs text-muted-foreground'>
																#
																{
																	order.orderNumber
																}
															</p>
															<p className='font-medium'>
																{order.customerName ||
																	'Guest'}
															</p>
														</div>
														<Badge
															className={
																statusColors[
																	order.status
																]
															}
														>
															<span className='mr-1'>
																{
																	statusIcons[
																		order
																			.status
																	]
																}
															</span>
															{order.status}
														</Badge>
													</div>
												</CardHeader>
												<CardContent className='space-y-3'>
													{/* Order Items */}
													<div className='space-y-1'>
														{order.items.map(
															(item) => (
																<div
																	key={
																		item.id
																	}
																	className='flex items-center justify-between text-sm'
																>
																	<span>
																		{
																			item.quantity
																		}
																		x{' '}
																		{
																			item
																				.shopItem
																				.name
																		}
																	</span>
																	<span className='font-medium'>
																		{formatPrice(
																			item.totalPrice
																		)}
																	</span>
																</div>
															)
														)}
													</div>

													{/* Notes */}
													{order.notes && (
														<div className='p-2 bg-muted rounded text-sm'>
															<p className='text-muted-foreground'>
																Notes:
															</p>
															<p>{order.notes}</p>
														</div>
													)}

													{/* Time Info */}
													<div className='flex items-center gap-2 text-xs text-muted-foreground'>
														<Clock className='h-3 w-3' />
														<span>
															{formatDistanceToNow(
																new Date(
																	order.createdAt
																),
																{
																	addSuffix:
																		true,
																}
															)}
														</span>
														{order.estimatedReadyAt &&
															order.status !==
																'READY' && (
																<>
																	<span>
																		•
																	</span>
																	<span>
																		Ready{' '}
																		{formatDistanceToNow(
																			new Date(
																				order.estimatedReadyAt
																			),
																			{
																				addSuffix:
																					true,
																			}
																		)}
																	</span>
																</>
															)}
													</div>

													{/* Total */}
													<div className='flex items-center justify-between pt-2 border-t font-medium'>
														<span>Total</span>
														<span>
															{formatPrice(
																order.totalAmount
															)}
														</span>
													</div>

													{/* Actions */}
													<div className='flex gap-2 pt-2'>
														{order.status ===
															'PAID' && (
															<Button
																size='sm'
																className='flex-1'
																onClick={() =>
																	handleUpdateStatus(
																		order.id,
																		'PREPARING'
																	)
																}
																disabled={
																	isPending
																}
															>
																<Coffee className='mr-2 h-4 w-4' />
																Start Preparing
															</Button>
														)}
														{order.status ===
															'PREPARING' && (
															<Button
																size='sm'
																className='flex-1'
																onClick={() =>
																	handleUpdateStatus(
																		order.id,
																		'READY'
																	)
																}
																disabled={
																	isPending
																}
															>
																<CheckCircle className='mr-2 h-4 w-4' />
																Ready
															</Button>
														)}
														{order.status ===
															'READY' && (
															<Button
																size='sm'
																className='flex-1'
																onClick={() =>
																	handleUpdateStatus(
																		order.id,
																		'SERVED'
																	)
																}
																disabled={
																	isPending
																}
															>
																<Utensils className='mr-2 h-4 w-4' />
																Served
															</Button>
														)}
													</div>
												</CardContent>
											</Card>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					{/* Shop Items Tab */}
					<TabsContent value='items'>
						<Card>
							<CardHeader>
								<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
									<div>
										<CardTitle>Shop Items</CardTitle>
										<CardDescription>
											View and manage all shop items
										</CardDescription>
									</div>
									<div className='flex gap-2'>
										<div className='relative'>
											<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
											<Input
												placeholder='Search items...'
												className='pl-9 w-[200px]'
												value={searchTerm}
												onChange={(e) =>
													setSearchTerm(
														e.target.value
													)
												}
											/>
										</div>
										<Select
											value={categoryFilter}
											onValueChange={setCategoryFilter}
										>
											<SelectTrigger className='w-[150px]'>
												<SelectValue placeholder='Category' />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value='all'>
													All Categories
												</SelectItem>
												{categories.map((cat) => (
													<SelectItem
														key={cat.id}
														value={cat.id}
													>
														{cat.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Name</TableHead>
											<TableHead>Category</TableHead>
											<TableHead>Type</TableHead>
											<TableHead>Price</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Stock</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredItems.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={6}
													className='text-center py-8 text-muted-foreground'
												>
													No items found
												</TableCell>
											</TableRow>
										) : (
											filteredItems.map((item) => (
												<TableRow key={item.id}>
													<TableCell>
														<div>
															<p className='font-medium'>
																{item.name}
															</p>
															{(item.preparationTime ??
																0) > 0 && (
																<p className='text-xs text-muted-foreground'>
																	<Clock className='inline h-3 w-3 mr-1' />
																	{
																		item.preparationTime
																	}{' '}
																	min prep
																	time
																</p>
															)}
														</div>
													</TableCell>
													<TableCell>
														{item.category.name}
													</TableCell>
													<TableCell>
														{item.isComposite ? (
															<Badge variant='outline'>
																<Coffee className='h-3 w-3 mr-1' />
																Composite
															</Badge>
														) : item.inventoryItemId ? (
															<Badge variant='outline'>
																<Package className='h-3 w-3 mr-1' />
																Inventory
															</Badge>
														) : (
															<Badge variant='secondary'>
																Manual
															</Badge>
														)}
													</TableCell>
													<TableCell className='font-medium'>
														{formatPrice(
															item.price
														)}
													</TableCell>
													<TableCell>
														{item.isActive ? (
															<Badge
																variant='outline'
																className='bg-green-50 text-green-700'
															>
																Active
															</Badge>
														) : (
															<Badge variant='secondary'>
																Inactive
															</Badge>
														)}
													</TableCell>
													<TableCell>
														{item.isComposite ? (
															<span className='text-sm text-muted-foreground'>
																{item.components
																	?.length ??
																	0}{' '}
																components
															</span>
														) : item.inventoryItem ? (
															<span>
																{
																	item
																		.inventoryItem
																		.currentStock
																}{' '}
																{
																	item
																		.inventoryItem
																		.baseUnit
																}
																s
															</span>
														) : (
															<span className='text-muted-foreground'>
																N/A
															</span>
														)}
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Categories Tab */}
					<TabsContent value='categories'>
						<Card>
							<CardHeader>
								<CardTitle>Shop Categories</CardTitle>
								<CardDescription>
									Manage categories for organizing shop items
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
									{categories.map((category) => {
										const categoryItems = items.filter(
											(i) => i.categoryId === category.id
										);

										return (
											<Card key={category.id}>
												<CardHeader className='pb-2'>
													<CardTitle className='text-lg'>
														{category.name}
													</CardTitle>
													{category.description && (
														<CardDescription>
															{
																category.description
															}
														</CardDescription>
													)}
												</CardHeader>
												<CardContent>
													<div className='flex items-center justify-between text-sm'>
														<span className='text-muted-foreground'>
															{
																categoryItems.length
															}{' '}
															items
														</span>
														<Badge
															variant={
																category.isActive
																	? 'outline'
																	: 'secondary'
															}
														>
															{category.isActive
																? 'Active'
																: 'Inactive'}
														</Badge>
													</div>
												</CardContent>
											</Card>
										);
									})}
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</main>
		</div>
	);
}
