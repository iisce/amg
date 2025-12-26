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
	AlertTriangle,
	Calendar,
	CalendarDays,
	Users,
	LayoutGrid,
	FileText,
	QrCode,
	UserPlus,
	Loader2,
	PackageOpen,
	Boxes,
	ArrowUpCircle,
	ArrowDownCircle,
	DollarSign,
	ShoppingCart,
	Store,
	Pencil,
	Blocks,
} from 'lucide-react';
import { toast } from 'sonner';
import {
	createInventoryCategory,
	createInventoryItem,
	adjustStock,
	restockItem,
	updateInventoryItem,
	type InventoryItemWithCategory,
} from '@/actions/inventory';
import type { InventoryCategory } from '@prisma/client';

interface SessionUser {
	id: string;
	email: string;
	name: string;
	role: string;
}

interface InventoryStats {
	totalItems: number;
	totalCategories: number;
	lowStockCount: number;
	totalInventoryValue: number;
}

interface AdminInventoryClientProps {
	categories: InventoryCategory[];
	items: InventoryItemWithCategory[];
	stats: InventoryStats | null;
	lowStockItems: InventoryItemWithCategory[];
	admin: SessionUser;
}

// Helper to format currency
const formatPrice = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

export function AdminInventoryClient({
	categories,
	items,
	stats,
	lowStockItems,
	admin,
}: AdminInventoryClientProps) {
	const [isPending, startTransition] = useTransition();
	const [searchTerm, setSearchTerm] = useState('');
	const [categoryFilter, setCategoryFilter] = useState<string>('all');
	const [showAddItem, setShowAddItem] = useState(false);
	const [showAddCategory, setShowAddCategory] = useState(false);
	const [showRestock, setShowRestock] =
		useState<InventoryItemWithCategory | null>(null);
	const [showAdjust, setShowAdjust] =
		useState<InventoryItemWithCategory | null>(null);
	const [showEditItem, setShowEditItem] =
		useState<InventoryItemWithCategory | null>(null);

	// Filter items
	const filteredItems = items.filter((item) => {
		const matchesSearch =
			item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.sku.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesCategory =
			categoryFilter === 'all' || item.categoryId === categoryFilter;
		return matchesSearch && matchesCategory;
	});

	// Add Category Form
	const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		startTransition(async () => {
			const result = await createInventoryCategory({
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

		startTransition(async () => {
			const result = await createInventoryItem({
				categoryId: formData.get('categoryId') as string,
				name: formData.get('name') as string,
				description: formData.get('description') as string,
				baseUnit: formData.get('baseUnit') as string,
				packageUnit:
					(formData.get('packageUnit') as string) || undefined,
				unitsPerPackage:
					parseInt(formData.get('unitsPerPackage') as string) || 1,
				currentStock:
					parseInt(formData.get('currentStock') as string) || 0,
				reorderLevel:
					parseInt(formData.get('reorderLevel') as string) || 10,
				costPerUnit: Math.round(
					parseFloat((formData.get('costPerUnit') as string) || '0') *
						100
				),
				showInShop: formData.get('showInShop') === 'on',
			});

			if (result.success) {
				toast.success('Item created successfully');
				setShowAddItem(false);
			} else {
				toast.error(result.error || 'Failed to create item');
			}
		});
	};

	// Restock Form
	const handleRestock = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!showRestock) return;

		const formData = new FormData(e.currentTarget);

		startTransition(async () => {
			const result = await restockItem(showRestock.id, {
				packages: parseInt(formData.get('packages') as string),
				costPerPackage: Math.round(
					parseFloat(
						(formData.get('costPerPackage') as string) || '0'
					) * 100
				),
				notes: formData.get('notes') as string,
			});

			if (result.success) {
				toast.success('Stock updated successfully');
				setShowRestock(null);
			} else {
				toast.error(result.error || 'Failed to update stock');
			}
		});
	};

	// Adjust Stock Form
	const handleAdjust = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!showAdjust) return;

		const formData = new FormData(e.currentTarget);
		const type = formData.get('type') as string;
		const quantity = parseInt(formData.get('quantity') as string);

		startTransition(async () => {
			const result = await adjustStock(showAdjust.id, {
				quantity:
					type === 'DAMAGE' || type === 'ADJUSTMENT_DOWN'
						? -quantity
						: quantity,
				type:
					type === 'ADJUSTMENT_DOWN'
						? 'ADJUSTMENT'
						: (type as
								| 'RESTOCK'
								| 'SALE'
								| 'ADJUSTMENT'
								| 'DAMAGE'
								| 'TRANSFER'
								| 'RETURN'),
				notes: formData.get('notes') as string,
			});

			if (result.success) {
				toast.success('Stock adjusted successfully');
				setShowAdjust(null);
			} else {
				toast.error(result.error || 'Failed to adjust stock');
			}
		});
	};

	// Edit Item Form
	const handleEditItem = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!showEditItem) return;

		const formData = new FormData(e.currentTarget);

		startTransition(async () => {
			const result = await updateInventoryItem(showEditItem.id, {
				categoryId: formData.get('categoryId') as string,
				name: formData.get('name') as string,
				description: formData.get('description') as string,
				baseUnit: formData.get('baseUnit') as string,
				packageUnit:
					(formData.get('packageUnit') as string) || undefined,
				unitsPerPackage:
					parseInt(formData.get('unitsPerPackage') as string) || 1,
				reorderLevel:
					parseInt(formData.get('reorderLevel') as string) || 10,
				optimalStock:
					parseInt(formData.get('optimalStock') as string) ||
					undefined,
				costPerUnit: Math.round(
					parseFloat((formData.get('costPerUnit') as string) || '0') *
						100
				),
				showInShop: formData.get('showInShop') === 'on',
				isActive: formData.get('isActive') === 'on',
			});

			if (result.success) {
				toast.success('Item updated successfully');
				setShowEditItem(null);
			} else {
				toast.error(result.error || 'Failed to update item');
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
								Inventory Management
							</h1>
							<p className='text-sm text-secondary-foreground/70'>
								Manage stock levels, categories, and inventory
								items
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
												Add Inventory Category
											</DialogTitle>
											<DialogDescription>
												Create a new category to
												organize inventory items
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
													placeholder='e.g., Beverages, Disposables'
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
								onOpenChange={setShowAddItem}
							>
								<DialogTrigger asChild>
									<Button size='sm'>
										<Plus className='mr-2 h-4 w-4' />
										Add Item
									</Button>
								</DialogTrigger>
								<DialogContent className='max-w-2xl'>
									<form onSubmit={handleAddItem}>
										<DialogHeader>
											<DialogTitle>
												Add Inventory Item
											</DialogTitle>
											<DialogDescription>
												Add a new item to track in
												inventory
											</DialogDescription>
										</DialogHeader>
										<div className='grid grid-cols-2 gap-4 py-4'>
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
																	key={cat.id}
																	value={
																		cat.id
																	}
																>
																	{cat.name}
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
													placeholder='e.g., Sugar, Coffee Sachet'
													required
												/>
											</div>
											<div className='col-span-2 space-y-2'>
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
												<Label htmlFor='baseUnit'>
													Base Unit
												</Label>
												<Input
													id='baseUnit'
													name='baseUnit'
													placeholder='e.g., cube, sachet, piece'
													required
												/>
												<p className='text-xs text-muted-foreground'>
													Smallest trackable unit
												</p>
											</div>
											<div className='space-y-2'>
												<Label htmlFor='packageUnit'>
													Package Unit
												</Label>
												<Input
													id='packageUnit'
													name='packageUnit'
													placeholder='e.g., pack, box, carton'
												/>
												<p className='text-xs text-muted-foreground'>
													Larger unit for bulk orders
												</p>
											</div>
											<div className='space-y-2'>
												<Label htmlFor='unitsPerPackage'>
													Units per Package
												</Label>
												<Input
													id='unitsPerPackage'
													name='unitsPerPackage'
													type='number'
													min='1'
													defaultValue='1'
												/>
												<p className='text-xs text-muted-foreground'>
													e.g., 100 cubes per pack of
													sugar
												</p>
											</div>
											<div className='space-y-2'>
												<Label htmlFor='currentStock'>
													Initial Stock (base units)
												</Label>
												<Input
													id='currentStock'
													name='currentStock'
													type='number'
													min='0'
													defaultValue='0'
												/>
											</div>
											<div className='space-y-2'>
												<Label htmlFor='reorderLevel'>
													Reorder Level
												</Label>
												<Input
													id='reorderLevel'
													name='reorderLevel'
													type='number'
													min='0'
													defaultValue='10'
												/>
												<p className='text-xs text-muted-foreground'>
													Alert when stock falls below
												</p>
											</div>
											<div className='space-y-2'>
												<Label htmlFor='costPerUnit'>
													Cost per Unit (₦)
												</Label>
												<Input
													id='costPerUnit'
													name='costPerUnit'
													type='number'
													step='0.01'
													min='0'
													defaultValue='0'
												/>
											</div>
											<div className='col-span-2 flex items-center gap-2'>
												<input
													type='checkbox'
													id='showInShop'
													name='showInShop'
													className='h-4 w-4'
												/>
												<Label htmlFor='showInShop'>
													Show in shop as standalone
													item
												</Label>
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
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-primary text-foreground'
						>
							<Package className='h-4 w-4' />
							Inventory
						</Link>
						<Link
							href='/admin/shop'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
				<div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
					<Card>
						<CardHeader className='pb-2'>
							<CardTitle className='text-sm font-medium text-muted-foreground'>
								Total Items
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='flex items-center gap-2'>
								<Boxes className='h-5 w-5 text-primary' />
								<span className='text-2xl font-bold'>
									{stats?.totalItems ?? 0}
								</span>
							</div>
							<p className='text-xs text-muted-foreground mt-1'>
								{stats?.totalCategories ?? 0} categories
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='pb-2'>
							<CardTitle className='text-sm font-medium text-muted-foreground'>
								Low Stock Alerts
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='flex items-center gap-2'>
								<AlertTriangle className='h-5 w-5 text-amber-500' />
								<span className='text-2xl font-bold'>
									{stats?.lowStockCount ?? 0}
								</span>
							</div>
							<p className='text-xs text-muted-foreground mt-1'>
								Items need restocking
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='pb-2'>
							<CardTitle className='text-sm font-medium text-muted-foreground'>
								Inventory Value
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='flex items-center gap-2'>
								<DollarSign className='h-5 w-5 text-green-500' />
								<span className='text-2xl font-bold'>
									{formatPrice(
										stats?.totalInventoryValue ?? 0
									)}
								</span>
							</div>
							<p className='text-xs text-muted-foreground mt-1'>
								Total stock value
							</p>
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
								<PackageOpen className='h-5 w-5 text-blue-500' />
								<span className='text-2xl font-bold'>
									{stats?.totalCategories ?? 0}
								</span>
							</div>
							<p className='text-xs text-muted-foreground mt-1'>
								Active categories
							</p>
						</CardContent>
					</Card>
				</div>

				<Tabs
					defaultValue='items'
					className='space-y-6'
				>
					<TabsList>
						<TabsTrigger value='items'>All Items</TabsTrigger>
						<TabsTrigger value='low-stock'>
							Low Stock
							{lowStockItems.length > 0 && (
								<Badge
									variant='destructive'
									className='ml-2'
								>
									{lowStockItems.length}
								</Badge>
							)}
						</TabsTrigger>
						<TabsTrigger value='categories'>Categories</TabsTrigger>
					</TabsList>

					{/* All Items Tab */}
					<TabsContent value='items'>
						<Card>
							<CardHeader>
								<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
									<div>
										<CardTitle>Inventory Items</CardTitle>
										<CardDescription>
											View and manage all inventory items
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
											<TableHead>SKU</TableHead>
											<TableHead>Name</TableHead>
											<TableHead>Category</TableHead>
											<TableHead>Stock</TableHead>
											<TableHead>Unit</TableHead>
											<TableHead>Status</TableHead>
											<TableHead className='text-right'>
												Actions
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredItems.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={7}
													className='text-center py-8 text-muted-foreground'
												>
													No items found
												</TableCell>
											</TableRow>
										) : (
											filteredItems.map((item) => (
												<TableRow key={item.id}>
													<TableCell className='font-mono text-sm'>
														{item.sku}
													</TableCell>
													<TableCell>
														<div>
															<p className='font-medium'>
																{item.name}
															</p>
															{item.showInShop && (
																<Badge
																	variant='outline'
																	className='text-xs'
																>
																	<ShoppingCart className='h-3 w-3 mr-1' />
																	Shop
																</Badge>
															)}
														</div>
													</TableCell>
													<TableCell>
														{item.category.name}
													</TableCell>
													<TableCell>
														<div className='flex items-center gap-2'>
															<span className='font-medium'>
																{
																	item.currentStock
																}
															</span>
															{item.packageUnit && (
																<span className='text-muted-foreground text-sm'>
																	(
																	{Math.floor(
																		item.currentStock /
																			item.unitsPerPackage
																	)}{' '}
																	{
																		item.packageUnit
																	}
																	s)
																</span>
															)}
														</div>
													</TableCell>
													<TableCell>
														{item.baseUnit}
													</TableCell>
													<TableCell>
														{item.currentStock <=
														item.reorderLevel ? (
															<Badge variant='destructive'>
																Low Stock
															</Badge>
														) : item.currentStock <=
														  item.reorderLevel *
																2 ? (
															<Badge variant='secondary'>
																Warning
															</Badge>
														) : (
															<Badge
																variant='outline'
																className='bg-green-50 text-green-700'
															>
																In Stock
															</Badge>
														)}
													</TableCell>
													<TableCell className='text-right'>
														<div className='flex justify-end gap-1'>
															<Button
																variant='ghost'
																size='sm'
																onClick={() =>
																	setShowEditItem(
																		item
																	)
																}
																title='Edit item'
															>
																<Pencil className='h-4 w-4' />
															</Button>
															<Button
																variant='ghost'
																size='sm'
																onClick={() =>
																	setShowRestock(
																		item
																	)
																}
																title='Restock'
															>
																<ArrowUpCircle className='h-4 w-4' />
															</Button>
															<Button
																variant='ghost'
																size='sm'
																onClick={() =>
																	setShowAdjust(
																		item
																	)
																}
																title='Adjust stock'
															>
																<ArrowDownCircle className='h-4 w-4' />
															</Button>
														</div>
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Low Stock Tab */}
					<TabsContent value='low-stock'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<AlertTriangle className='h-5 w-5 text-amber-500' />
									Low Stock Items
								</CardTitle>
								<CardDescription>
									Items that need to be restocked soon
								</CardDescription>
							</CardHeader>
							<CardContent>
								{lowStockItems.length === 0 ? (
									<div className='text-center py-8 text-muted-foreground'>
										<Package className='h-12 w-12 mx-auto mb-4 opacity-50' />
										<p>All items are well stocked!</p>
									</div>
								) : (
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Item</TableHead>
												<TableHead>Category</TableHead>
												<TableHead>
													Current Stock
												</TableHead>
												<TableHead>
													Reorder Level
												</TableHead>
												<TableHead>Needed</TableHead>
												<TableHead className='text-right'>
													Actions
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{lowStockItems.map((item) => (
												<TableRow key={item.id}>
													<TableCell className='font-medium'>
														{item.name}
													</TableCell>
													<TableCell>
														{item.category.name}
													</TableCell>
													<TableCell>
														<Badge variant='destructive'>
															{item.currentStock}{' '}
															{item.baseUnit}s
														</Badge>
													</TableCell>
													<TableCell>
														{item.reorderLevel}
													</TableCell>
													<TableCell className='font-medium text-amber-600'>
														+
														{item.optimalStock -
															item.currentStock}{' '}
														{item.baseUnit}s
													</TableCell>
													<TableCell className='text-right'>
														<Button
															size='sm'
															onClick={() =>
																setShowRestock(
																	item
																)
															}
														>
															<ArrowUpCircle className='h-4 w-4 mr-2' />
															Restock
														</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					{/* Categories Tab */}
					<TabsContent value='categories'>
						<Card>
							<CardHeader>
								<CardTitle>Inventory Categories</CardTitle>
								<CardDescription>
									Manage categories for organizing inventory
									items
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
									{categories.map((category) => {
										const categoryItems = items.filter(
											(i) => i.categoryId === category.id
										);
										const lowStock = categoryItems.filter(
											(i) =>
												i.currentStock <= i.reorderLevel
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
														{lowStock.length >
															0 && (
															<Badge variant='destructive'>
																{
																	lowStock.length
																}{' '}
																low stock
															</Badge>
														)}
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

			{/* Restock Dialog */}
			<Dialog
				open={!!showRestock}
				onOpenChange={() => setShowRestock(null)}
			>
				<DialogContent>
					<form onSubmit={handleRestock}>
						<DialogHeader>
							<DialogTitle>Restock Item</DialogTitle>
							<DialogDescription>
								Add stock to {showRestock?.name}
							</DialogDescription>
						</DialogHeader>
						<div className='space-y-4 py-4'>
							<div className='p-3 bg-muted rounded-lg'>
								<p className='text-sm text-muted-foreground'>
									Current Stock
								</p>
								<p className='text-lg font-bold'>
									{showRestock?.currentStock}{' '}
									{showRestock?.baseUnit}s
									{showRestock?.packageUnit && (
										<span className='text-sm font-normal text-muted-foreground ml-2'>
											(
											{Math.floor(
												(showRestock?.currentStock ??
													0) /
													(showRestock?.unitsPerPackage ??
														1)
											)}{' '}
											{showRestock?.packageUnit}s)
										</span>
									)}
								</p>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='packages'>
									Number of{' '}
									{showRestock?.packageUnit || 'packages'}
								</Label>
								<Input
									id='packages'
									name='packages'
									type='number'
									min='1'
									required
								/>
								<p className='text-xs text-muted-foreground'>
									1 {showRestock?.packageUnit || 'package'} ={' '}
									{showRestock?.unitsPerPackage}{' '}
									{showRestock?.baseUnit}s
								</p>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='costPerPackage'>
									Cost per{' '}
									{showRestock?.packageUnit || 'package'} (₦)
								</Label>
								<Input
									id='costPerPackage'
									name='costPerPackage'
									type='number'
									step='0.01'
									min='0'
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='restockNotes'>Notes</Label>
								<Textarea
									id='restockNotes'
									name='notes'
									placeholder='e.g., Supplier: ABC Trading, Invoice #123'
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								type='button'
								variant='outline'
								onClick={() => setShowRestock(null)}
							>
								Cancel
							</Button>
							<Button
								type='submit'
								disabled={isPending}
							>
								{isPending && (
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
								)}
								Restock
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Adjust Stock Dialog */}
			<Dialog
				open={!!showAdjust}
				onOpenChange={() => setShowAdjust(null)}
			>
				<DialogContent>
					<form onSubmit={handleAdjust}>
						<DialogHeader>
							<DialogTitle>Adjust Stock</DialogTitle>
							<DialogDescription>
								Make adjustments to {showAdjust?.name} stock
							</DialogDescription>
						</DialogHeader>
						<div className='space-y-4 py-4'>
							<div className='p-3 bg-muted rounded-lg'>
								<p className='text-sm text-muted-foreground'>
									Current Stock
								</p>
								<p className='text-lg font-bold'>
									{showAdjust?.currentStock}{' '}
									{showAdjust?.baseUnit}s
								</p>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='adjustType'>
									Adjustment Type
								</Label>
								<Select
									name='type'
									defaultValue='ADJUSTMENT_DOWN'
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='ADJUSTMENT_DOWN'>
											Remove Stock
										</SelectItem>
										<SelectItem value='ADJUSTMENT'>
											Add Stock (Correction)
										</SelectItem>
										<SelectItem value='DAMAGE'>
											Damaged/Expired
										</SelectItem>
										<SelectItem value='TRANSFER'>
											Transfer Out
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='adjustQty'>
									Quantity ({showAdjust?.baseUnit}s)
								</Label>
								<Input
									id='adjustQty'
									name='quantity'
									type='number'
									min='1'
									max={showAdjust?.currentStock}
									required
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='adjustNotes'>Reason</Label>
								<Textarea
									id='adjustNotes'
									name='notes'
									placeholder='Reason for adjustment...'
									required
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								type='button'
								variant='outline'
								onClick={() => setShowAdjust(null)}
							>
								Cancel
							</Button>
							<Button
								type='submit'
								disabled={isPending}
							>
								{isPending && (
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
								)}
								Apply Adjustment
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Edit Item Dialog */}
			<Dialog
				open={!!showEditItem}
				onOpenChange={() => setShowEditItem(null)}
			>
				<DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
					<form onSubmit={handleEditItem}>
						<DialogHeader>
							<DialogTitle>Edit Inventory Item</DialogTitle>
							<DialogDescription>
								Update details for {showEditItem?.name}
							</DialogDescription>
						</DialogHeader>
						<div className='grid gap-4 py-4'>
							<div className='grid grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='edit-category'>
										Category
									</Label>
									<Select
										name='categoryId'
										defaultValue={showEditItem?.categoryId}
									>
										<SelectTrigger>
											<SelectValue placeholder='Select category' />
										</SelectTrigger>
										<SelectContent>
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
								<div className='space-y-2'>
									<Label htmlFor='edit-name'>Item Name</Label>
									<Input
										id='edit-name'
										name='name'
										defaultValue={showEditItem?.name}
										required
									/>
								</div>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='edit-description'>
									Description
								</Label>
								<Textarea
									id='edit-description'
									name='description'
									defaultValue={
										showEditItem?.description || ''
									}
									placeholder='Item description...'
								/>
							</div>
							<div className='grid grid-cols-3 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='edit-baseUnit'>
										Base Unit
									</Label>
									<Input
										id='edit-baseUnit'
										name='baseUnit'
										defaultValue={showEditItem?.baseUnit}
										placeholder='e.g., can, bottle'
										required
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='edit-packageUnit'>
										Package Unit (optional)
									</Label>
									<Input
										id='edit-packageUnit'
										name='packageUnit'
										defaultValue={
											showEditItem?.packageUnit || ''
										}
										placeholder='e.g., crate, carton'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='edit-unitsPerPackage'>
										Units per Package
									</Label>
									<Input
										id='edit-unitsPerPackage'
										name='unitsPerPackage'
										type='number'
										min='1'
										defaultValue={
											showEditItem?.unitsPerPackage || 1
										}
									/>
								</div>
							</div>
							<div className='grid grid-cols-3 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='edit-reorderLevel'>
										Reorder Level
									</Label>
									<Input
										id='edit-reorderLevel'
										name='reorderLevel'
										type='number'
										min='0'
										defaultValue={
											showEditItem?.reorderLevel || 10
										}
									/>
									<p className='text-xs text-muted-foreground'>
										Alert when stock falls below
									</p>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='edit-optimalStock'>
										Optimal Stock
									</Label>
									<Input
										id='edit-optimalStock'
										name='optimalStock'
										type='number'
										min='0'
										defaultValue={
											showEditItem?.optimalStock || ''
										}
									/>
									<p className='text-xs text-muted-foreground'>
										Target stock level
									</p>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='edit-costPerUnit'>
										Cost per Unit (₦)
									</Label>
									<Input
										id='edit-costPerUnit'
										name='costPerUnit'
										type='number'
										step='0.01'
										min='0'
										defaultValue={
											showEditItem?.costPerUnit
												? (
														showEditItem.costPerUnit /
														100
												  ).toFixed(2)
												: ''
										}
									/>
								</div>
							</div>
							<div className='grid grid-cols-2 gap-4'>
								<div className='flex items-center space-x-2'>
									<input
										type='checkbox'
										id='edit-showInShop'
										name='showInShop'
										defaultChecked={
											showEditItem?.showInShop
										}
										className='rounded border-gray-300'
									/>
									<Label htmlFor='edit-showInShop'>
										Show in Shop (for direct sale)
									</Label>
								</div>
								<div className='flex items-center space-x-2'>
									<input
										type='checkbox'
										id='edit-isActive'
										name='isActive'
										defaultChecked={
											showEditItem?.isActive ?? true
										}
										className='rounded border-gray-300'
									/>
									<Label htmlFor='edit-isActive'>
										Active (available for use)
									</Label>
								</div>
							</div>
							<div className='p-3 bg-muted rounded-lg'>
								<p className='text-sm text-muted-foreground'>
									Current Stock
								</p>
								<p className='text-lg font-bold'>
									{showEditItem?.currentStock}{' '}
									{showEditItem?.baseUnit}s
									{showEditItem?.packageUnit && (
										<span className='text-sm font-normal text-muted-foreground ml-2'>
											(
											{Math.floor(
												(showEditItem?.currentStock ??
													0) /
													(showEditItem?.unitsPerPackage ??
														1)
											)}{' '}
											{showEditItem?.packageUnit}s)
										</span>
									)}
								</p>
								<p className='text-xs text-muted-foreground mt-1'>
									To change stock levels, use the Restock or
									Adjust buttons
								</p>
							</div>
						</div>
						<DialogFooter>
							<Button
								type='button'
								variant='outline'
								onClick={() => setShowEditItem(null)}
							>
								Cancel
							</Button>
							<Button
								type='submit'
								disabled={isPending}
							>
								{isPending && (
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
								)}
								Save Changes
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
