'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
	ShoppingCart,
	Plus,
	Minus,
	Clock,
	Package,
	Coffee,
	Loader2,
	Trash2,
	Store,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ShopCategory } from '@prisma/client';
import type { ShopItemWithRelations } from '@/actions/shop';
import { createShopOrder, initializeShopPayment } from '@/actions/shop';

interface CartItem {
	item: ShopItemWithRelations;
	quantity: number;
}

interface SessionUser {
	id: string;
	email: string;
	name: string;
	role: string;
	phone?: string | null;
	company?: string | null;
}

interface ShopClientProps {
	categories: ShopCategory[];
	items: ShopItemWithRelations[];
	user: SessionUser;
}

// Helper to format currency
const formatPrice = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

export function ShopClient({ categories, items, user }: ShopClientProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [selectedCategory, setSelectedCategory] = useState<string | null>(
		null
	);
	const [cart, setCart] = useState<CartItem[]>([]);
	const [showCheckout, setShowCheckout] = useState(false);
	const [notes, setNotes] = useState('');

	// Merge shop categories with categories from items (for inventory items)
	const allCategories = useMemo(() => {
		const itemCategories = items.map((item) => item.category);
		const uniqueCategories = new Map<
			string,
			{ id: string; name: string; sortOrder: number }
		>();

		// Add shop categories first
		categories.forEach((cat) => {
			uniqueCategories.set(cat.id, {
				id: cat.id,
				name: cat.name,
				sortOrder: cat.sortOrder,
			});
		});

		// Add categories from items (includes inventory categories)
		itemCategories.forEach((cat) => {
			if (!uniqueCategories.has(cat.id)) {
				uniqueCategories.set(cat.id, {
					id: cat.id,
					name: cat.name,
					sortOrder: cat.sortOrder,
				});
			}
		});

		return Array.from(uniqueCategories.values()).sort(
			(a, b) => a.sortOrder - b.sortOrder
		);
	}, [categories, items]);

	// Filter items by category
	const filteredItems = selectedCategory
		? items.filter((item) => item.categoryId === selectedCategory)
		: items;

	// Cart functions
	const addToCart = (item: ShopItemWithRelations) => {
		setCart((prev) => {
			const existing = prev.find((c) => c.item.id === item.id);
			if (existing) {
				return prev.map((c) =>
					c.item.id === item.id
						? { ...c, quantity: c.quantity + 1 }
						: c
				);
			}
			return [...prev, { item, quantity: 1 }];
		});
		toast.success(`${item.name} added to cart`);
	};

	const updateQuantity = (itemId: string, delta: number) => {
		setCart((prev) =>
			prev
				.map((c) =>
					c.item.id === itemId
						? { ...c, quantity: Math.max(0, c.quantity + delta) }
						: c
				)
				.filter((c) => c.quantity > 0)
		);
	};

	const removeFromCart = (itemId: string) => {
		setCart((prev) => prev.filter((c) => c.item.id !== itemId));
	};

	const clearCart = () => {
		setCart([]);
	};

	// Calculate totals
	const cartTotal = cart.reduce(
		(sum, c) => sum + c.item.price * c.quantity,
		0
	);

	const cartItemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

	// Calculate max preparation time
	const maxPrepTime = Math.max(
		...cart.map((c) => (c.item.preparationTime ?? 0) * c.quantity),
		0
	);

	// Handle checkout
	const handleCheckout = async () => {
		if (cart.length === 0) {
			toast.error('Your cart is empty');
			return;
		}

		startTransition(async () => {
			// Create the order with user details from session
			const orderResult = await createShopOrder({
				customerName: user.name,
				customerEmail: user.email,
				customerPhone: user.phone || undefined,
				items: cart.map((c) => ({
					shopItemId: c.item.id,
					quantity: c.quantity,
					notes: notes || undefined,
				})),
			});

			if (!orderResult.success || !orderResult.data) {
				toast.error(orderResult.error || 'Failed to create order');
				return;
			}

			// Initialize payment
			const paymentResult = await initializeShopPayment(
				orderResult.data.id
			);

			if (!paymentResult.success || !paymentResult.data) {
				toast.error(
					paymentResult.error || 'Failed to initialize payment'
				);
				return;
			}

			// Clear cart and redirect to payment
			clearCart();
			setShowCheckout(false);

			// Redirect to Paystack
			window.location.href = paymentResult.data.authorizationUrl;
		});
	};

	return (
		<div className='min-h-screen bg-background'>
			{/* Hero Section */}
			<section className='bg-secondary py-12 px-4'>
				<div className='container mx-auto'>
					<div className='flex items-center gap-3 mb-4'>
						<Store className='h-8 w-8 text-primary' />
						<h1 className='text-3xl font-bold'>AMG Shop</h1>
					</div>
					<p className='text-muted-foreground max-w-2xl'>
						Order refreshments, drinks, and snacks. Your order will
						be prepared fresh and ready for pickup.
					</p>
				</div>
			</section>

			{/* Categories */}
			<section className='container mx-auto px-4 py-6'>
				<div className='flex gap-2 overflow-x-auto pb-2'>
					<Button
						variant={
							selectedCategory === null ? 'default' : 'outline'
						}
						className='rounded-full shrink-0'
						onClick={() => setSelectedCategory(null)}
					>
						All Items
					</Button>
					{allCategories.map((category) => (
						<Button
							key={category.id}
							variant={
								selectedCategory === category.id
									? 'default'
									: 'outline'
							}
							className='rounded-full shrink-0'
							onClick={() => setSelectedCategory(category.id)}
						>
							{category.name}
						</Button>
					))}
				</div>
			</section>

			{/* Items Grid */}
			<section className='container mx-auto px-4 pb-24'>
				{filteredItems.length === 0 ? (
					<div className='text-center py-16 text-muted-foreground'>
						<Package className='h-16 w-16 mx-auto mb-4 opacity-50' />
						<p className='text-lg'>No items available</p>
						<p className='text-sm'>Check back soon!</p>
					</div>
				) : (
					<div className='grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
						{filteredItems.map((item) => {
							const cartItem = cart.find(
								(c) => c.item.id === item.id
							);

							return (
								<Card
									key={item.id}
									className='overflow-hidden'
								>
									{item.image ? (
										<div className='aspect-square bg-muted'>
											<img
												src={item.image}
												alt={item.name}
												className='w-full h-full object-cover'
											/>
										</div>
									) : (
										<div className='aspect-square bg-muted flex items-center justify-center'>
											{item.isComposite ? (
												<Coffee className='h-16 w-16 text-muted-foreground' />
											) : (
												<Package className='h-16 w-16 text-muted-foreground' />
											)}
										</div>
									)}
									<CardHeader className='pb-2'>
										<CardTitle className='text-lg'>
											{item.name}
										</CardTitle>
										{item.description && (
											<CardDescription className='line-clamp-2'>
												{item.description}
											</CardDescription>
										)}
									</CardHeader>
									<CardContent className='pb-2'>
										<div className='flex items-center justify-between'>
											<span className='text-xl font-bold text-primary'>
												{formatPrice(item.price)}
											</span>
											{(item.preparationTime ?? 0) >
												0 && (
												<Badge
													variant='outline'
													className='text-xs'
												>
													<Clock className='h-3 w-3 mr-1' />
													{item.preparationTime} min
												</Badge>
											)}
										</div>
									</CardContent>
									<CardFooter>
										{cartItem ? (
											<div className='flex items-center justify-between w-full'>
												<Button
													variant='outline'
													size='icon'
													onClick={() =>
														updateQuantity(
															item.id,
															-1
														)
													}
												>
													<Minus className='h-4 w-4' />
												</Button>
												<span className='font-medium'>
													{cartItem.quantity}
												</span>
												<Button
													variant='outline'
													size='icon'
													onClick={() =>
														updateQuantity(
															item.id,
															1
														)
													}
												>
													<Plus className='h-4 w-4' />
												</Button>
											</div>
										) : (
											<Button
												className='w-full'
												onClick={() => addToCart(item)}
											>
												<Plus className='mr-2 h-4 w-4' />
												Add to Cart
											</Button>
										)}
									</CardFooter>
								</Card>
							);
						})}
					</div>
				)}
			</section>

			{/* Cart Button (Fixed) */}
			{cart.length > 0 && (
				<div className='fixed bottom-6 left-0 right-0 px-4 z-50'>
					<div className='container mx-auto max-w-lg'>
						<Sheet>
							<SheetTrigger asChild>
								<Button
									size='lg'
									className='w-full shadow-lg'
								>
									<ShoppingCart className='mr-2 h-5 w-5' />
									View Cart ({cartItemCount})
									<span className='ml-auto'>
										{formatPrice(cartTotal)}
									</span>
								</Button>
							</SheetTrigger>
							<SheetContent className='w-full sm:max-w-lg'>
								<SheetHeader>
									<SheetTitle>Your Cart</SheetTitle>
									<SheetDescription>
										{cartItemCount} item
										{cartItemCount !== 1 ? 's' : ''} in your
										cart
									</SheetDescription>
								</SheetHeader>

								<ScrollArea className='flex-1 mt-4'>
									<div className='space-y-4'>
										{cart.map(({ item, quantity }) => (
											<div
												key={item.id}
												className='flex items-center gap-4 p-3 bg-muted rounded-lg'
											>
												<div className='w-16 h-16 bg-background rounded flex items-center justify-center shrink-0'>
													{item.isComposite ? (
														<Coffee className='h-8 w-8 text-muted-foreground' />
													) : (
														<Package className='h-8 w-8 text-muted-foreground' />
													)}
												</div>
												<div className='flex-1 min-w-0'>
													<p className='font-medium truncate'>
														{item.name}
													</p>
													<p className='text-sm text-muted-foreground'>
														{formatPrice(
															item.price
														)}{' '}
														each
													</p>
													{(item.preparationTime ??
														0) > 0 && (
														<p className='text-xs text-muted-foreground'>
															<Clock className='inline h-3 w-3 mr-1' />
															{
																item.preparationTime
															}{' '}
															min prep
														</p>
													)}
												</div>
												<div className='flex items-center gap-2'>
													<Button
														variant='outline'
														size='icon'
														className='h-8 w-8'
														onClick={() =>
															updateQuantity(
																item.id,
																-1
															)
														}
													>
														<Minus className='h-3 w-3' />
													</Button>
													<span className='w-8 text-center'>
														{quantity}
													</span>
													<Button
														variant='outline'
														size='icon'
														className='h-8 w-8'
														onClick={() =>
															updateQuantity(
																item.id,
																1
															)
														}
													>
														<Plus className='h-3 w-3' />
													</Button>
													<Button
														variant='ghost'
														size='icon'
														className='h-8 w-8 text-destructive'
														onClick={() =>
															removeFromCart(
																item.id
															)
														}
													>
														<Trash2 className='h-4 w-4' />
													</Button>
												</div>
											</div>
										))}
									</div>
								</ScrollArea>

								<div className='mt-4 space-y-4'>
									<Separator />

									{/* Prep Time Estimate */}
									{maxPrepTime > 0 && (
										<div className='flex items-center gap-2 p-3 bg-amber-50 text-amber-800 rounded-lg'>
											<Clock className='h-4 w-4' />
											<span className='text-sm'>
												Estimated preparation time:{' '}
												{maxPrepTime} minutes
											</span>
										</div>
									)}

									{/* Totals */}
									<div className='space-y-2'>
										<div className='flex items-center justify-between text-lg font-bold'>
											<span>Total</span>
											<span>
												{formatPrice(cartTotal)}
											</span>
										</div>
									</div>

									{/* Actions */}
									<div className='flex gap-2'>
										<Button
											variant='outline'
											onClick={clearCart}
											className='flex-1'
										>
											Clear Cart
										</Button>
										<Button
											className='flex-1'
											onClick={() =>
												setShowCheckout(true)
											}
										>
											Checkout
										</Button>
									</div>
								</div>
							</SheetContent>
						</Sheet>
					</div>
				</div>
			)}

			{/* Checkout Dialog */}
			<Dialog
				open={showCheckout}
				onOpenChange={setShowCheckout}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Complete Your Order</DialogTitle>
						<DialogDescription>
							Review your order details and proceed to payment
						</DialogDescription>
					</DialogHeader>

					<div className='space-y-4 py-4'>
						{/* User Info (from session) */}
						<div className='p-4 bg-secondary/50 rounded-lg space-y-2'>
							<p className='text-sm font-medium text-muted-foreground'>
								Order for:
							</p>
							<p className='font-medium'>{user.name}</p>
							<p className='text-sm text-muted-foreground'>
								{user.email}
							</p>
							{user.phone && (
								<p className='text-sm text-muted-foreground'>
									{user.phone}
								</p>
							)}
						</div>

						<div className='space-y-2'>
							<Label htmlFor='notes'>
								Special Instructions (optional)
							</Label>
							<Textarea
								id='notes'
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								placeholder='Any special requests...'
							/>
						</div>

						{/* Order Summary */}
						<div className='p-4 bg-muted rounded-lg space-y-2'>
							<p className='font-medium'>Order Summary</p>
							{cart.map(({ item, quantity }) => (
								<div
									key={item.id}
									className='flex justify-between text-sm'
								>
									<span>
										{quantity}x {item.name}
									</span>
									<span>
										{formatPrice(item.price * quantity)}
									</span>
								</div>
							))}
							<Separator />
							<div className='flex justify-between font-bold'>
								<span>Total</span>
								<span>{formatPrice(cartTotal)}</span>
							</div>
							{maxPrepTime > 0 && (
								<p className='text-xs text-muted-foreground'>
									<Clock className='inline h-3 w-3 mr-1' />
									Ready in approximately {maxPrepTime} minutes
									after payment
								</p>
							)}
						</div>
					</div>

					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setShowCheckout(false)}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button
							onClick={handleCheckout}
							disabled={isPending || cart.length === 0}
						>
							{isPending ? (
								<>
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									Processing...
								</>
							) : (
								<>Pay {formatPrice(cartTotal)}</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
