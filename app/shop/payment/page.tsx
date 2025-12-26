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
							{error ||
								'Your payment could not be processed. Please try again.'}
						</p>
						<div className='flex flex-col gap-3'>
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
								<Link href='/'>Go to Home</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Success state
	return (
		<div className='min-h-screen bg-background'>
			{/* Hero Section */}
			<section className='bg-green-600 py-12 px-4'>
				<div className='container mx-auto max-w-2xl text-center'>
					<CheckCircle className='h-20 w-20 mx-auto mb-4 text-white' />
					<h1 className='text-3xl font-bold text-white mb-2'>
						Order Confirmed!
					</h1>
					<p className='text-white/90'>
						Your order has been placed successfully
					</p>
				</div>
			</section>

			{/* Order Details */}
			<section className='px-4 py-8'>
				<div className='container mx-auto max-w-2xl'>
					<Card>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<CardTitle className='flex items-center gap-2'>
									<Store className='h-5 w-5' />
									Order Details
								</CardTitle>
								<Badge variant='outline'>
									#{order?.orderNumber}
								</Badge>
							</div>
						</CardHeader>
						<CardContent className='space-y-6'>
							{/* Status */}
							<div className='p-4 bg-amber-50 border border-amber-200 rounded-lg'>
								<div className='flex items-center gap-3'>
									<Clock className='h-5 w-5 text-amber-600' />
									<div>
										<p className='font-medium text-amber-900'>
											Your order is being prepared
										</p>
										{order?.estimatedReadyAt && (
											<p className='text-sm text-amber-700'>
												Estimated ready by:{' '}
												{new Date(
													order.estimatedReadyAt
												).toLocaleTimeString([], {
													hour: '2-digit',
													minute: '2-digit',
												})}
											</p>
										)}
									</div>
								</div>
							</div>

							<Separator />

							{/* Items */}
							<div className='space-y-3'>
								<h3 className='font-medium'>Items Ordered</h3>
								{order?.items.map((item) => (
									<div
										key={item.id}
										className='flex items-center justify-between py-2'
									>
										<div className='flex items-center gap-3'>
											<div className='w-10 h-10 bg-muted rounded flex items-center justify-center'>
												{item.shopItem.isComposite ? (
													<Coffee className='h-5 w-5 text-muted-foreground' />
												) : (
													<Package className='h-5 w-5 text-muted-foreground' />
												)}
											</div>
											<div>
												<p className='font-medium'>
													{item.shopItem.name}
												</p>
												<p className='text-sm text-muted-foreground'>
													Qty: {item.quantity}
												</p>
											</div>
										</div>
										<span className='font-medium'>
											{formatPrice(
												item.unitPrice * item.quantity
											)}
										</span>
									</div>
								))}
							</div>

							<Separator />

							{/* Total */}
							<div className='flex justify-between items-center text-lg font-bold'>
								<span>Total Paid</span>
								<span className='text-primary'>
									{order
										? formatPrice(order.totalAmount)
										: '---'}
								</span>
							</div>

							{/* Notes */}
							{order?.notes && (
								<>
									<Separator />
									<div>
										<h3 className='font-medium mb-1'>
											Special Instructions
										</h3>
										<p className='text-sm text-muted-foreground'>
											{order.notes}
										</p>
									</div>
								</>
							)}

							{/* Actions */}
							<div className='pt-4 flex flex-col sm:flex-row gap-3'>
								<Button
									asChild
									className='flex-1'
								>
									<Link href='/shop'>
										Continue Shopping
										<ArrowRight className='ml-2 h-4 w-4' />
									</Link>
								</Button>
								<Button
									variant='outline'
									asChild
									className='flex-1'
								>
									<Link href='/'>Go to Home</Link>
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Information Note */}
					<div className='mt-6 p-4 bg-muted rounded-lg'>
						<h3 className='font-medium mb-2'>What happens next?</h3>
						<ul className='text-sm text-muted-foreground space-y-2'>
							<li>
								• Our staff will start preparing your order
								immediately
							</li>
							<li>
								• You'll receive an email confirmation at{' '}
								{order?.customerEmail}
							</li>
							<li>
								• Please collect your order from the front desk
								when ready
							</li>
							<li>
								• Show your order number to collect your items
							</li>
						</ul>
					</div>
				</div>
			</section>
		</div>
	);
}
