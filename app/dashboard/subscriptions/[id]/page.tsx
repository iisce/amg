import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
	AlertDialog,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { CancelSubscriptionForm } from './cancel-subscription-form';
import { SubscriptionQRCode } from './subscription-qr-code';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
	ArrowLeft,
	Calendar,
	CreditCard,
	Mail,
	Phone,
	Users,
	CheckCircle,
	XCircle,
	Clock,
	Building2,
	CalendarCheck,
	BarChart3,
} from 'lucide-react';
import { format } from 'date-fns';
import { getSubscriptionById, getMembershipAttendance } from '@/actions';
import {
	formatDuration,
	formatDaysRemaining,
	formatMembershipType,
} from '@/lib/utils/format';

// Status badge styling
const statusStyles: Record<string, string> = {
	ACTIVE: 'text-green-600 border-green-600 bg-green-50',
	EXPIRED: 'text-red-600 border-red-600 bg-red-50',
	CANCELLED: 'text-gray-600 border-gray-600 bg-gray-50',
	PAUSED: 'text-yellow-600 border-yellow-600 bg-yellow-50',
	PENDING: 'text-blue-600 border-blue-600 bg-blue-50',
};

// Status card styling
const statusCardStyles: Record<
	string,
	{ bg: string; icon: string; text: string }
> = {
	ACTIVE: {
		bg: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200',
		icon: 'text-green-600',
		text: 'Your subscription is active',
	},
	EXPIRED: {
		bg: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200',
		icon: 'text-red-600',
		text: 'Your subscription has expired',
	},
	CANCELLED: {
		bg: 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200',
		icon: 'text-gray-600',
		text: 'Your subscription has been cancelled',
	},
	PAUSED: {
		bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200',
		icon: 'text-yellow-600',
		text: 'Your subscription is paused',
	},
	PENDING: {
		bg: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
		icon: 'text-blue-600',
		text: 'Your subscription is pending activation',
	},
};

interface PageProps {
	params: Promise<{ id: string }>;
}

export default async function SubscriptionDetailPage({ params }: PageProps) {
	const { id } = await params;

	// Fetch subscription data
	const subscriptionResult = await getSubscriptionById(id);

	if (!subscriptionResult.success || !subscriptionResult.data) {
		notFound();
	}

	const subscription = subscriptionResult.data as NonNullable<
		typeof subscriptionResult.data
	>;

	// Fetch attendance data
	const attendanceResult = await getMembershipAttendance(id);
	const attendance = attendanceResult.success ? attendanceResult.data : null;

	// Calculate billing amounts (prices are stored in kobo)
	const subtotal = subscription.totalAmount / 100;
	const vatRate = 0.075;
	const vatAmount = Math.round(subtotal * vatRate);
	const total = subtotal;

	// Get the most recent payment
	const latestPayment = subscription.payments?.[0];

	// Calculate subscription progress
	const startDate = new Date(subscription.startDate);
	const endDate = new Date(subscription.endDate);
	const now = new Date();
	const totalDays = Math.ceil(
		(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
	);
	const elapsedDays = Math.ceil(
		(now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
	);
	const progressPercent = Math.min(
		100,
		Math.max(0, (elapsedDays / totalDays) * 100)
	);

	const statusCard =
		statusCardStyles[subscription.status] || statusCardStyles.PENDING;

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
						<Link href='/dashboard/subscriptions'>
							<ArrowLeft className='mr-2 h-4 w-4' />
							Back to Subscriptions
						</Link>
					</Button>
					<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
						<div>
							<h1 className='text-3xl font-bold text-secondary mb-2'>
								Subscription Details
							</h1>
							<p className='text-secondary/80'>
								#{subscription.membershipNumber}
							</p>
						</div>
						<Badge
							variant='outline'
							className={`self-start sm:self-center ${
								statusStyles[subscription.status]
							}`}
						>
							{subscription.status}
						</Badge>
					</div>
				</div>
			</section>

			{/* Content */}
			<section className='px-4 py-8'>
				<div className='container mx-auto max-w-4xl space-y-6'>
					{/* Status Card */}
					<Card className={statusCard.bg}>
						<CardContent className='p-6'>
							<div className='flex items-center gap-3 mb-4'>
								{subscription.status === 'ACTIVE' ? (
									<CheckCircle
										className={`h-6 w-6 ${statusCard.icon}`}
									/>
								) : (
									<XCircle
										className={`h-6 w-6 ${statusCard.icon}`}
									/>
								)}
								<h3 className='text-lg font-semibold'>
									{statusCard.text}
								</h3>
							</div>

							{subscription.status === 'ACTIVE' && (
								<>
									<div className='space-y-2 mb-4'>
										<div className='flex justify-between text-sm'>
											<span className='text-muted-foreground'>
												Subscription Progress
											</span>
											<span className='font-medium'>
												{formatDaysRemaining(
													subscription.endDate
												)}
											</span>
										</div>
										<Progress
											value={progressPercent}
											className='h-2'
										/>
										<div className='flex justify-between text-xs text-muted-foreground'>
											<span>
												{format(
													startDate,
													'MMM d, yyyy'
												)}
											</span>
											<span>
												{format(endDate, 'MMM d, yyyy')}
											</span>
										</div>
									</div>

									{subscription.autoRenew && (
										<Badge
											variant='outline'
											className='bg-white'
										>
											Auto-Renew Enabled
										</Badge>
									)}
								</>
							)}
						</CardContent>
					</Card>

					{/* Stats Cards */}
					<div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
						<Card>
							<CardContent className='p-4 text-center'>
								<Clock className='h-5 w-5 mx-auto mb-2 text-muted-foreground' />
								<p className='text-2xl font-bold'>
									{formatDuration(
										subscription.startDate,
										subscription.endDate
									)}
								</p>
								<p className='text-xs text-muted-foreground'>
									Duration
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardContent className='p-4 text-center'>
								<CalendarCheck className='h-5 w-5 mx-auto mb-2 text-muted-foreground' />
								<p className='text-2xl font-bold'>
									{attendance?.totalVisits || 0}
								</p>
								<p className='text-xs text-muted-foreground'>
									Total Visits
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardContent className='p-4 text-center'>
								<BarChart3 className='h-5 w-5 mx-auto mb-2 text-muted-foreground' />
								<p className='text-2xl font-bold'>
									{attendance?.thisMonthVisits || 0}
								</p>
								<p className='text-xs text-muted-foreground'>
									This Month
								</p>
							</CardContent>
						</Card>

						{attendance?.daysAllowed !== null && (
							<Card>
								<CardContent className='p-4 text-center'>
									<Calendar className='h-5 w-5 mx-auto mb-2 text-muted-foreground' />
									<p className='text-2xl font-bold'>
										{attendance?.daysRemaining ??
											attendance?.daysAllowed ??
											0}
										<span className='text-sm font-normal text-muted-foreground'>
											/{attendance?.daysAllowed}
										</span>
									</p>
									<p className='text-xs text-muted-foreground'>
										Days Remaining
									</p>
								</CardContent>
							</Card>
						)}
					</div>

					<div className='grid gap-6 lg:grid-cols-2'>
						{/* Plan Information */}
						<Card>
							<CardHeader>
								<CardTitle>Plan Information</CardTitle>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div>
									<h3 className='font-semibold text-lg mb-2'>
										{subscription.pricingPlan.name}
									</h3>
									<div className='flex items-center gap-2 text-sm text-muted-foreground'>
										<Building2 className='h-4 w-4' />
										<span>{subscription.space.name}</span>
									</div>
								</div>

								<Separator />

								<div className='grid grid-cols-2 gap-4 text-sm'>
									<div>
										<div className='font-medium text-muted-foreground mb-1'>
											Type
										</div>
										<div>
											{formatMembershipType(
												subscription.type
											)}
										</div>
									</div>
									{subscription.assignedDesk && (
										<div>
											<div className='font-medium text-muted-foreground mb-1'>
												Assigned Desk
											</div>
											<div>
												{subscription.assignedDesk}
											</div>
										</div>
									)}
								</div>

								<Separator />

								<div className='space-y-3 text-sm'>
									<div className='flex items-start gap-3'>
										<Calendar className='h-4 w-4 text-muted-foreground mt-0.5' />
										<div>
											<div className='font-medium'>
												Start Date
											</div>
											<div className='text-muted-foreground'>
												{format(startDate, 'PPPP')}
											</div>
										</div>
									</div>

									<div className='flex items-start gap-3'>
										<Calendar className='h-4 w-4 text-muted-foreground mt-0.5' />
										<div>
											<div className='font-medium'>
												End Date
											</div>
											<div className='text-muted-foreground'>
												{format(endDate, 'PPPP')}
											</div>
										</div>
									</div>
								</div>

								{subscription.accessCode && (
									<>
										<Separator />
										<div>
											<div className='font-medium text-sm mb-2'>
												Access Code
											</div>
											<code className='bg-muted px-3 py-2 rounded text-sm font-mono block text-center'>
												{subscription.accessCode}
											</code>
										</div>
									</>
								)}
							</CardContent>
						</Card>

						{/* Customer & Payment */}
						<div className='space-y-6'>
							<Card>
								<CardHeader>
									<CardTitle>Member Details</CardTitle>
								</CardHeader>
								<CardContent className='space-y-3 text-sm'>
									<div className='flex items-start gap-3'>
										<Users className='h-4 w-4 text-muted-foreground mt-0.5' />
										<div>
											<div className='font-medium'>
												Name
											</div>
											<div className='text-muted-foreground'>
												{subscription.user.name}
											</div>
										</div>
									</div>

									<div className='flex items-start gap-3'>
										<Mail className='h-4 w-4 text-muted-foreground mt-0.5' />
										<div>
											<div className='font-medium'>
												Email
											</div>
											<div className='text-muted-foreground'>
												{subscription.user.email}
											</div>
										</div>
									</div>

									{subscription.user.phone && (
										<div className='flex items-start gap-3'>
											<Phone className='h-4 w-4 text-muted-foreground mt-0.5' />
											<div>
												<div className='font-medium'>
													Phone
												</div>
												<div className='text-muted-foreground'>
													{subscription.user.phone}
												</div>
											</div>
										</div>
									)}
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Billing Summary</CardTitle>
								</CardHeader>
								<CardContent className='space-y-3'>
									<div className='flex justify-between text-sm'>
										<span className='text-muted-foreground'>
											{formatMembershipType(
												subscription.type
											)}{' '}
											Plan
										</span>
										<span>
											₦
											{(
												subtotal - vatAmount
											).toLocaleString()}
										</span>
									</div>
									<div className='flex justify-between text-sm'>
										<span className='text-muted-foreground'>
											VAT (7.5%)
										</span>
										<span>
											₦{vatAmount.toLocaleString()}
										</span>
									</div>
									<Separator />
									<div className='flex justify-between font-bold text-lg'>
										<span>Total</span>
										<span className='text-primary'>
											₦{total.toLocaleString()}
										</span>
									</div>
									<Separator />
									{latestPayment && (
										<>
											<div className='flex justify-between text-sm'>
												<span className='text-muted-foreground'>
													Payment Method
												</span>
												<span>
													{latestPayment.method}
												</span>
											</div>
											<div className='flex justify-between text-sm'>
												<span className='text-muted-foreground'>
													Transaction Ref
												</span>
												<span className='font-mono text-xs'>
													{latestPayment.reference}
												</span>
											</div>
											<div className='flex justify-between text-sm'>
												<span className='text-muted-foreground'>
													Payment Date
												</span>
												<span>
													{format(
														new Date(
															latestPayment.createdAt
														),
														'MMM d, yyyy'
													)}
												</span>
											</div>
										</>
									)}
								</CardContent>
							</Card>
						</div>
					</div>

					{/* QR Code for Active Subscriptions */}
					{subscription.status === 'ACTIVE' &&
						subscription.accessCode && (
							<SubscriptionQRCode
								membershipId={subscription.id}
								membershipNumber={subscription.membershipNumber}
								accessCode={subscription.accessCode}
								spaceName={subscription.space.name}
							/>
						)}

					{/* Recent Attendance */}
					{attendance && attendance.checkIns.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle>Recent Attendance</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='space-y-3'>
									{attendance.checkIns
										.slice(0, 5)
										.map((checkIn) => (
											<div
												key={checkIn.id}
												className='flex items-center justify-between text-sm py-2 border-b last:border-0'
											>
												<div className='flex items-center gap-3'>
													<CheckCircle className='h-4 w-4 text-green-600' />
													<span>
														{format(
															new Date(
																checkIn.checkInTime
															),
															'EEEE, MMM d, yyyy'
														)}
													</span>
												</div>
												<div className='text-muted-foreground'>
													{format(
														new Date(
															checkIn.checkInTime
														),
														'h:mm a'
													)}
													{checkIn.checkOutTime && (
														<span>
															{' '}
															-{' '}
															{format(
																new Date(
																	checkIn.checkOutTime
																),
																'h:mm a'
															)}
														</span>
													)}
												</div>
											</div>
										))}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Actions */}
					<Card>
						<CardContent className='p-6'>
							<div className='flex flex-col gap-3 sm:flex-row'>
								<Button
									variant='outline'
									className='flex-1 bg-transparent'
									asChild
								>
									<Link
										href={`/spaces/${subscription.space.slug}`}
									>
										<Building2 className='mr-2 h-4 w-4' />
										View Space
									</Link>
								</Button>
								{subscription.status === 'ACTIVE' && (
									<>
										<Button
											variant='outline'
											className='flex-1 bg-transparent'
										>
											{subscription.autoRenew ? (
												<>
													<XCircle className='mr-2 h-4 w-4' />
													Disable Auto-Renew
												</>
											) : (
												<>
													<CheckCircle className='mr-2 h-4 w-4' />
													Enable Auto-Renew
												</>
											)}
										</Button>
										{/* Cancel Subscription with confirmation dialog */}
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<Button
													variant='outline'
													className='flex-1 bg-transparent text-red-600 hover:text-red-700'
												>
													Cancel Subscription
												</Button>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>
														Cancel Subscription?
													</AlertDialogTitle>
													<AlertDialogDescription>
														<span className='font-semibold text-red-600'>
															Warning:
														</span>{' '}
														This action cannot be
														undone.
														<br />
														<span className='block mt-2'>
															There will be{' '}
															<b>no refunds</b>{' '}
															for cancelled
															subscriptions.
														</span>
														<span className='block mt-4'>
															To confirm, type{' '}
															<b>CONFIRM</b>{' '}
															below:
														</span>
													</AlertDialogDescription>
												</AlertDialogHeader>
												<CancelSubscriptionForm
													subscriptionId={
														subscription.id
													}
												/>
											</AlertDialogContent>
										</AlertDialog>
									</>
								)}
								{subscription.status === 'EXPIRED' && (
									<Button className='flex-1'>
										<CreditCard className='mr-2 h-4 w-4' />
										Renew Subscription
									</Button>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			</section>
		</div>
	);
}
