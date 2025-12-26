'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
	CheckCircle,
	XCircle,
	Clock,
	Package,
	Coffee,
	Loader2,
	Store,
	ArrowRight,
	RotateCcw,
} from 'lucide-react';
import { verifyShopPayment } from '@/actions/shop';
import type { ShopOrder, ShopOrderItem, ShopItem } from '@prisma/client';

type OrderWithItems = ShopOrder & {
	items: (ShopOrderItem & { shopItem: ShopItem })[];
};

// Helper to format currency
const formatPrice = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

export default function ShopPaymentCallbackPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [status, setStatus] = useState<'loading' | 'success' | 'failed'>(
		'loading'
	);
	const [order, setOrder] = useState<OrderWithItems | null>(null);
	const [error, setError] = useState<string | null>(null);

	const reference = searchParams.get('reference');
	const trxref = searchParams.get('trxref');
	const orderId = searchParams.get('orderId');
	const paymentRef = reference || trxref;

	useEffect(() => {
		const verifyPayment = async () => {
			if (!paymentRef) {
				setStatus('failed');
				setError('No payment reference found');
				return;
			}

			try {
				const result = await verifyShopPayment(paymentRef);

				if (result.success && 'data' in result && result.data) {
					setStatus('success');
					setOrder(result.data as OrderWithItems);
				} else {
					setStatus('failed');
					const errorMsg =
						'error' in result && result.error
							? result.error
							: 'Payment verification failed';
					setError(errorMsg);
				}
			} catch (err) {
				console.error('Verification error:', err);
				setStatus('failed');
				setError('An error occurred while verifying payment');
			}
		};

		verifyPayment();
	}, [paymentRef]);

	// Loading state
	if (status === 'loading') {
		return (
			<div className='min-h-screen bg-background flex items-center justify-center'>
				<Card className='max-w-md w-full mx-4'>
					<CardContent className='p-8 text-center'>
						<Loader2 className='h-16 w-16 mx-auto mb-4 animate-spin text-primary' />
						<h2 className='text-xl font-bold mb-2'>
							Verifying Payment
						</h2>
						<p className='text-muted-foreground'>
							Please wait while we confirm your payment...
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Failed state
	if (status === 'failed') {
		return (
			<div className='min-h-screen bg-background flex items-center justify-center'>
				<Card className='max-w-md w-full mx-4'>
					<CardContent className='p-8 text-center'>
						<XCircle className='h-16 w-16 mx-auto mb-4 text-destructive' />
						<h2 className='text-xl font-bold mb-2'>
							Payment Failed
						</h2>
						<p className='text-muted-foreground mb-6'>
							{error || 'Your payment could not be processed'}
						</p>
						<div className='flex flex-col gap-2'>
							<Button asChild>
								<Link href='/shop'>
									<RotateCcw className='mr-2 h-4 w-4' />
									Try Again
								</Link>
							</Button>
							<Button
								variant='outline'
								asChild
							>
								<Link href='/dashboard'>Go to Dashboard</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Success state
	return (
		<div className='min-h-screen bg-background py-12'>
			<div className='container max-w-2xl mx-auto px-4'>
				<Card>
					<CardHeader className='text-center pb-2'>
						<CheckCircle className='h-16 w-16 mx-auto mb-4 text-green-500' />
						<CardTitle className='text-2xl'>
							Order Confirmed!
						</CardTitle>
						<p className='text-muted-foreground'>
							Thank you for your order. Your payment was
							successful.
						</p>
					</CardHeader>

					<CardContent className='space-y-6'>
						{order && (
							<>
								{/* Order Status */}
								<div className='flex items-center justify-center gap-2'>
									<Badge
										variant={
											order.status === 'PAID'
												? 'default'
												: order.status === 'PREPARING'
												? 'secondary'
												: order.status === 'READY'
												? 'outline'
												: 'default'
										}
										className='text-sm py-1'
									>
										{order.status === 'PAID' && (
											<Clock className='mr-1 h-3 w-3' />
										)}
										{order.status === 'PREPARING' && (
											<Coffee className='mr-1 h-3 w-3' />
										)}
										{order.status === 'READY' && (
											<Package className='mr-1 h-3 w-3' />
										)}
										{order.status.replace('_', ' ')}
									</Badge>
								</div>

								{/* Order Details */}
								<div className='bg-muted/50 rounded-lg p-4 space-y-3'>
									<div className='flex justify-between text-sm'>
										<span className='text-muted-foreground'>
											Order Number
										</span>
										<span className='font-mono font-medium'>
											{order.orderNumber}
										</span>
									</div>
									<div className='flex justify-between text-sm'>
										<span className='text-muted-foreground'>
											Order Date
										</span>
										<span>
											{new Date(
												order.createdAt
											).toLocaleDateString('en-NG', {
												dateStyle: 'medium',
											})}
										</span>
									</div>
									{order.estimatedReadyAt && (
										<div className='flex justify-between text-sm'>
											<span className='text-muted-foreground'>
												Estimated Ready
											</span>
											<span>
												{new Date(
													order.estimatedReadyAt
												).toLocaleTimeString('en-NG', {
													timeStyle: 'short',
												})}
											</span>
										</div>
									)}
								</div>

								<Separator />

								{/* Order Items */}
								<div className='space-y-3'>
									<h3 className='font-semibold'>
										Order Items
									</h3>
									{order.items.map((item) => (
										<div
											key={item.id}
											className='flex justify-between items-start'
										>
											<div>
												<p className='font-medium'>
													{item.shopItem.name}
												</p>
												<p className='text-sm text-muted-foreground'>
													{item.quantity} x{' '}
													{formatPrice(
														item.unitPrice
													)}
												</p>
											</div>
											<span className='font-medium'>
												{formatPrice(item.totalPrice)}
											</span>
										</div>
									))}
								</div>

								<Separator />

								{/* Total */}
								<div className='flex justify-between items-center text-lg font-bold'>
									<span>Total Paid</span>
									<span className='text-primary'>
										{formatPrice(order.totalAmount)}
									</span>
								</div>

								{/* Notes */}
								{order.notes && (
									<div className='bg-secondary/50 rounded-lg p-3'>
										<p className='text-sm text-muted-foreground'>
											Special Instructions:
										</p>
										<p className='text-sm'>{order.notes}</p>
									</div>
								)}

								{/* Next Steps */}
								<div className='bg-primary/5 border border-primary/20 rounded-lg p-4'>
									<h4 className='font-medium mb-2 flex items-center gap-2'>
										<Clock className='h-4 w-4' />
										What&apos;s Next?
									</h4>
									<ul className='text-sm text-muted-foreground space-y-1'>
										<li>
											• Your order is being prepared by
											our team
										</li>
										<li>
											• You&apos;ll be notified when
											it&apos;s ready for pickup
										</li>
										<li>
											• Please collect your order from the
											front desk
										</li>
									</ul>
								</div>
							</>
						)}

						{/* Actions */}
						<div className='flex flex-col sm:flex-row gap-3 pt-4'>
							<Button
								asChild
								className='flex-1'
							>
								<Link href='/dashboard'>
									View Order History
									<ArrowRight className='ml-2 h-4 w-4' />
								</Link>
							</Button>
							<Button
								variant='outline'
								asChild
								className='flex-1'
							>
								<Link href='/shop'>
									<Store className='mr-2 h-4 w-4' />
									Continue Shopping
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
