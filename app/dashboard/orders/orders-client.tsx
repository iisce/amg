'use client';

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
import { Separator } from '@/components/ui/separator';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Package,
	Coffee,
	Clock,
	CheckCircle,
	XCircle,
	Store,
	ArrowLeft,
	Eye,
	ShoppingBag,
} from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import type { ShopOrder, ShopOrderItem, ShopItem } from '@prisma/client';

type OrderWithItems = ShopOrder & {
	items: (ShopOrderItem & { shopItem: ShopItem })[];
};

interface OrdersClientProps {
	orders: OrderWithItems[];
}

// Helper to format currency
const formatPrice = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

// Get status badge
const getStatusBadge = (status: string) => {
	switch (status) {
		case 'PENDING':
			return (
				<Badge variant='outline'>
					<Clock className='mr-1 h-3 w-3' />
					Pending
				</Badge>
			);
		case 'PAID':
			return (
				<Badge className='bg-blue-500'>
					<CheckCircle className='mr-1 h-3 w-3' />
					Paid
				</Badge>
			);
		case 'PREPARING':
			return (
				<Badge className='bg-orange-500'>
					<Coffee className='mr-1 h-3 w-3' />
					Preparing
				</Badge>
			);
		case 'READY':
			return (
				<Badge className='bg-green-500'>
					<Package className='mr-1 h-3 w-3' />
					Ready
				</Badge>
			);
		case 'SERVED':
			return (
				<Badge variant='secondary'>
					<CheckCircle className='mr-1 h-3 w-3' />
					Served
				</Badge>
			);
		case 'CANCELLED':
			return (
				<Badge variant='destructive'>
					<XCircle className='mr-1 h-3 w-3' />
					Cancelled
				</Badge>
			);
		default:
			return <Badge variant='outline'>{status}</Badge>;
	}
};

export function OrdersClient({ orders }: OrdersClientProps) {
	const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(
		null
	);

	return (
		<div className='min-h-screen bg-background'>
			{/* Header */}
			<section className='bg-primary text-primary-foreground px-4 py-8'>
				<div className='container mx-auto'>
					<div className='flex items-center gap-4'>
						<Link href='/dashboard'>
							<Button
								variant='secondary'
								size='icon'
							>
								<ArrowLeft className='h-4 w-4' />
							</Button>
						</Link>
						<div>
							<h1 className='text-2xl font-bold'>My Orders</h1>
							<p className='text-sm text-primary-foreground/80'>
								View your shop order history
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Content */}
			<section className='container mx-auto px-4 py-8'>
				{orders.length === 0 ? (
					<Card>
						<CardContent className='flex flex-col items-center justify-center py-16'>
							<ShoppingBag className='h-16 w-16 text-muted-foreground mb-4' />
							<h3 className='text-lg font-semibold mb-2'>
								No orders yet
							</h3>
							<p className='text-muted-foreground text-center mb-6'>
								You haven&apos;t placed any orders from our
								shop. Browse our menu and place your first
								order!
							</p>
							<Button asChild>
								<Link href='/shop'>
									<Store className='mr-2 h-4 w-4' />
									Visit Shop
								</Link>
							</Button>
						</CardContent>
					</Card>
				) : (
					<Card>
						<CardHeader>
							<CardTitle>Order History</CardTitle>
							<CardDescription>
								You have placed {orders.length} order
								{orders.length !== 1 ? 's' : ''}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Order #</TableHead>
										<TableHead>Date</TableHead>
										<TableHead>Items</TableHead>
										<TableHead>Total</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className='text-right'>
											Actions
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{orders.map((order) => (
										<TableRow key={order.id}>
											<TableCell className='font-mono font-medium'>
												{order.orderNumber}
											</TableCell>
											<TableCell>
												{format(
													new Date(order.createdAt),
													'MMM d, yyyy'
												)}
												<br />
												<span className='text-xs text-muted-foreground'>
													{format(
														new Date(
															order.createdAt
														),
														'h:mm a'
													)}
												</span>
											</TableCell>
											<TableCell>
												{order.items.length} item
												{order.items.length !== 1
													? 's'
													: ''}
											</TableCell>
											<TableCell className='font-medium'>
												{formatPrice(order.totalAmount)}
											</TableCell>
											<TableCell>
												{getStatusBadge(order.status)}
											</TableCell>
											<TableCell className='text-right'>
												<Button
													variant='ghost'
													size='sm'
													onClick={() =>
														setSelectedOrder(order)
													}
												>
													<Eye className='h-4 w-4' />
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				)}

				{/* Order Detail Dialog */}
				<Dialog
					open={!!selectedOrder}
					onOpenChange={() => setSelectedOrder(null)}
				>
					<DialogContent className='max-w-md'>
						<DialogHeader>
							<DialogTitle>
								Order {selectedOrder?.orderNumber}
							</DialogTitle>
							<DialogDescription>
								Placed on{' '}
								{selectedOrder &&
									format(
										new Date(selectedOrder.createdAt),
										"MMMM d, yyyy 'at' h:mm a"
									)}
							</DialogDescription>
						</DialogHeader>

						{selectedOrder && (
							<div className='space-y-4'>
								{/* Status */}
								<div className='flex justify-center'>
									{getStatusBadge(selectedOrder.status)}
								</div>

								{/* Items */}
								<div className='space-y-2'>
									<h4 className='font-medium'>Items</h4>
									{selectedOrder.items.map((item) => (
										<div
											key={item.id}
											className='flex justify-between text-sm'
										>
											<span>
												{item.quantity}x{' '}
												{item.shopItem.name}
											</span>
											<span>
												{formatPrice(item.totalPrice)}
											</span>
										</div>
									))}
								</div>

								<Separator />

								{/* Total */}
								<div className='flex justify-between font-bold'>
									<span>Total</span>
									<span>
										{formatPrice(selectedOrder.totalAmount)}
									</span>
								</div>

								{/* Notes */}
								{selectedOrder.notes && (
									<div className='bg-muted p-3 rounded-lg'>
										<p className='text-sm font-medium'>
											Notes:
										</p>
										<p className='text-sm text-muted-foreground'>
											{selectedOrder.notes}
										</p>
									</div>
								)}

								{/* Ready time */}
								{selectedOrder.estimatedReadyAt && (
									<div className='text-center text-sm text-muted-foreground'>
										<Clock className='inline h-4 w-4 mr-1' />
										Estimated ready:{' '}
										{format(
											new Date(
												selectedOrder.estimatedReadyAt
											),
											'h:mm a'
										)}
									</div>
								)}
							</div>
						)}
					</DialogContent>
				</Dialog>
			</section>
		</div>
	);
}
