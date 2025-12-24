import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getUserSubscriptions } from '@/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
	Empty,
	EmptyMedia,
	EmptyHeader,
	EmptyTitle,
	EmptyDescription,
	EmptyContent,
} from '@/components/ui/empty';
import { ArrowLeft, Calendar, CreditCard, Plus, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatMembershipType } from '@/lib/utils/format';

// Helper to format price from kobo
const formatPrice = (kobo: number) => {
	return (kobo / 100).toLocaleString();
};

// Helper to get status badge
const getStatusBadge = (status: string) => {
	switch (status) {
		case 'ACTIVE':
			return <Badge className='bg-green-500'>Active</Badge>;
		case 'EXPIRED':
			return <Badge variant='secondary'>Expired</Badge>;
		case 'CANCELLED':
			return <Badge variant='destructive'>Cancelled</Badge>;
		case 'PAUSED':
			return <Badge variant='outline'>Paused</Badge>;
		case 'PENDING':
			return <Badge variant='outline'>Pending</Badge>;
		default:
			return <Badge variant='outline'>{status}</Badge>;
	}
};

export default async function SubscriptionsPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect('/login');
	}

	const subscriptionsResult = await getUserSubscriptions();
	const subscriptions =
		subscriptionsResult.success && subscriptionsResult.data
			? Array.isArray(subscriptionsResult.data)
				? subscriptionsResult.data
				: [subscriptionsResult.data]
			: [];

	// Separate subscriptions by status
	const activeSubscriptions = subscriptions.filter(
		(s) => s.status === 'ACTIVE' || s.status === 'PAUSED'
	);
	const pastSubscriptions = subscriptions.filter(
		(s) => s.status === 'EXPIRED' || s.status === 'CANCELLED'
	);

	return (
		<div className='min-h-screen bg-background'>
			{/* Header */}
			<section className='bg-primary px-4 py-8'>
				<div className='container mx-auto max-w-4xl'>
					<Button
						variant='ghost'
						asChild
						className='mb-4 text-secondary hover:bg-secondary/10'
					>
						<Link href='/dashboard'>
							<ArrowLeft className='mr-2 h-4 w-4' />
							Back to Dashboard
						</Link>
					</Button>
					<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
						<div>
							<h1 className='text-3xl font-bold text-secondary'>
								My Subscriptions
							</h1>
							<p className='text-secondary/80'>
								Manage your workspace memberships
							</p>
						</div>
						<Button asChild>
							<Link href='/spaces'>
								<Plus className='mr-2 h-4 w-4' />
								New Subscription
							</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Content */}
			<section className='px-4 py-8'>
				<div className='container mx-auto max-w-4xl space-y-8'>
					{/* Active Subscriptions */}
					<div>
						<h2 className='text-xl font-semibold mb-4'>
							Active Subscriptions ({activeSubscriptions.length})
						</h2>
						{activeSubscriptions.length === 0 ? (
							<Card>
								<CardContent className='p-8'>
									<Empty>
										<EmptyMedia variant='icon'>
											<CreditCard className='h-6 w-6' />
										</EmptyMedia>
										<EmptyHeader>
											<EmptyTitle>
												No active subscriptions
											</EmptyTitle>
											<EmptyDescription>
												You don&apos;t have any active
												subscriptions yet.
											</EmptyDescription>
										</EmptyHeader>
										<EmptyContent>
											<Button asChild>
												<Link href='/spaces?type=subscribe'>
													Browse Spaces
												</Link>
											</Button>
										</EmptyContent>
									</Empty>
								</CardContent>
							</Card>
						) : (
							<div className='space-y-4'>
								{activeSubscriptions.map((subscription) => (
									<Link
										key={subscription.id}
										href={`/dashboard/subscriptions/${subscription.id}`}
									>
										<Card className='hover:shadow-md transition-shadow cursor-pointer'>
											<CardContent className='p-6'>
												<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
													<div className='flex items-start gap-4'>
														<div className='p-3 bg-primary/10 rounded-lg'>
															<Building2 className='h-6 w-6 text-primary' />
														</div>
														<div>
															<h3 className='font-semibold text-lg'>
																{
																	subscription
																		.space
																		.name
																}
															</h3>
															<p className='text-sm text-muted-foreground'>
																{
																	subscription
																		.pricingPlan
																		.name
																}{' '}
																•{' '}
																{formatMembershipType(
																	subscription.type
																)}
															</p>
															<div className='flex items-center gap-4 mt-2 text-sm text-muted-foreground'>
																<span className='flex items-center gap-1'>
																	<Calendar className='h-4 w-4' />
																	Ends{' '}
																	{format(
																		new Date(
																			subscription.endDate
																		),
																		'MMM d, yyyy'
																	)}
																</span>
																<span className='flex items-center gap-1'>
																	<CreditCard className='h-4 w-4' />
																	₦
																	{formatPrice(
																		subscription.totalAmount
																	)}
																</span>
															</div>
														</div>
													</div>
													<div className='flex items-center gap-3'>
														{getStatusBadge(
															subscription.status
														)}
													</div>
												</div>
											</CardContent>
										</Card>
									</Link>
								))}
							</div>
						)}
					</div>

					{/* Past Subscriptions */}
					{pastSubscriptions.length > 0 && (
						<div>
							<h2 className='text-xl font-semibold mb-4'>
								Past Subscriptions ({pastSubscriptions.length})
							</h2>
							<div className='space-y-4'>
								{pastSubscriptions.map((subscription) => (
									<Link
										key={subscription.id}
										href={`/dashboard/subscriptions/${subscription.id}`}
									>
										<Card className='hover:shadow-md transition-shadow cursor-pointer opacity-75'>
											<CardContent className='p-6'>
												<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
													<div className='flex items-start gap-4'>
														<div className='p-3 bg-muted rounded-lg'>
															<Building2 className='h-6 w-6 text-muted-foreground' />
														</div>
														<div>
															<h3 className='font-semibold text-lg'>
																{
																	subscription
																		.space
																		.name
																}
															</h3>
															<p className='text-sm text-muted-foreground'>
																{
																	subscription
																		.pricingPlan
																		.name
																}{' '}
																•{' '}
																{formatMembershipType(
																	subscription.type
																)}
															</p>
															<div className='flex items-center gap-4 mt-2 text-sm text-muted-foreground'>
																<span className='flex items-center gap-1'>
																	<Calendar className='h-4 w-4' />
																	Ended{' '}
																	{format(
																		new Date(
																			subscription.endDate
																		),
																		'MMM d, yyyy'
																	)}
																</span>
															</div>
														</div>
													</div>
													<div className='flex items-center gap-3'>
														{getStatusBadge(
															subscription.status
														)}
													</div>
												</div>
											</CardContent>
										</Card>
									</Link>
								))}
							</div>
						</div>
					)}
				</div>
			</section>
		</div>
	);
}
