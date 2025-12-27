'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AdminNavigation } from '@/components/admin/admin-navigation';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
	Download,
	TrendingUp,
	TrendingDown,
	DollarSign,
	Users,
	CalendarIcon,
	CalendarDays,
	Trophy,
	Clock,
	Building2,
	CreditCard,
	Receipt,
	PieChart,
	Activity,
	Target,
	Zap,
	Crown,
	Medal,
	Award,
	Star,
	FileSpreadsheet,
	UserCheck,
	UserX,
	UsersRound,
	LogIn,
	CheckCircle2,
	XCircle,
	AlertCircle,
	Repeat,
	Timer,
} from 'lucide-react';
import { format } from 'date-fns';
import type {
	TimeFrame,
	RevenueOverview,
	RevenueTrend,
	ClientOverview,
	TopClient,
	BookingOverview,
	PopularSpace,
	TopShopItem,
	MembershipOverview,
	ReportSpaceUtilization,
	LeaderboardEntry,
	EarlyBirdClient,
	PopularMembershipPlan,
	VisitorOverview,
	VisitorTrend,
	RepeatVisitor,
	CheckInOverview,
	CheckInTrend,
	BookingTrend,
	PeakHour,
} from '@/actions/reports';
import {
	generateCSV,
	generateExcelCSV,
	TOP_CLIENTS_COLUMNS,
	POPULAR_SPACES_COLUMNS,
	TOP_SHOP_ITEMS_COLUMNS,
	SPACE_UTILIZATION_COLUMNS,
	EARLY_BIRD_COLUMNS,
	POPULAR_MEMBERSHIP_PLANS_COLUMNS,
	REPEAT_VISITORS_COLUMNS,
	CHECKIN_SUMMARY_COLUMNS,
	VISITOR_TRENDS_COLUMNS,
	getExportFilename,
	getExportMimeType,
} from '@/lib/utils/export';

// ============================================
// TYPES
// ============================================

interface SessionUser {
	id: string;
	email: string;
	name: string;
	role: string;
}

interface AdminReportsClientProps {
	admin: SessionUser;
	timeFrame: TimeFrame;
	customRange?: { start: string; end: string };
	activeTab: string;
	revenueOverview: RevenueOverview | null;
	revenueTrends: RevenueTrend[];
	clientOverview: ClientOverview | null;
	topClients: TopClient[];
	bookingOverview: BookingOverview | null;
	popularSpaces: PopularSpace[];
	topShopItems: TopShopItem[];
	membershipOverview: MembershipOverview | null;
	spaceUtilization: ReportSpaceUtilization[];
	leaderboard: {
		byRevenue: LeaderboardEntry[];
		byBookings: LeaderboardEntry[];
		byEarlyBird: LeaderboardEntry[];
		byLoyalty: LeaderboardEntry[];
	} | null;
	earlyBirds: EarlyBirdClient[];
	popularMembershipPlans: PopularMembershipPlan[];
	visitorOverview: VisitorOverview | null;
	visitorTrends: VisitorTrend[];
	repeatVisitors: RepeatVisitor[];
	checkInOverview: CheckInOverview | null;
	checkInTrends: CheckInTrend[];
	bookingTrends: BookingTrend[];
	peakHours: PeakHour[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatMoney(amount: number): string {
	return `₦${(amount / 100).toLocaleString('en-NG', {
		minimumFractionDigits: 0,
	})}`;
}

function downloadFile(content: string, filename: string, mimeType: string) {
	const blob = new Blob([content], { type: mimeType });
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	window.URL.revokeObjectURL(url);
}

const TIMEFRAME_OPTIONS = [
	{ value: 'today', label: 'Today' },
	{ value: 'yesterday', label: 'Yesterday' },
	{ value: 'last7days', label: 'Last 7 Days' },
	{ value: 'last30days', label: 'Last 30 Days' },
	{ value: 'thisMonth', label: 'This Month' },
	{ value: 'lastMonth', label: 'Last Month' },
	{ value: 'thisQuarter', label: 'This Quarter' },
	{ value: 'thisYear', label: 'This Year' },
	{ value: 'custom', label: 'Custom Range' },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminReportsClient({
	admin,
	timeFrame,
	customRange,
	activeTab,
	revenueOverview,
	revenueTrends,
	clientOverview,
	topClients,
	bookingOverview,
	popularSpaces,
	topShopItems,
	membershipOverview,
	spaceUtilization,
	leaderboard,
	earlyBirds,
	popularMembershipPlans,
	visitorOverview,
	visitorTrends,
	repeatVisitors,
	checkInOverview,
	checkInTrends,
	bookingTrends,
	peakHours,
}: AdminReportsClientProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [selectedTimeFrame, setSelectedTimeFrame] = useState(timeFrame);
	const [startDate, setStartDate] = useState<Date | undefined>(
		customRange?.start ? new Date(customRange.start) : undefined
	);
	const [endDate, setEndDate] = useState<Date | undefined>(
		customRange?.end ? new Date(customRange.end) : undefined
	);

	const handleTimeFrameChange = (value: TimeFrame) => {
		setSelectedTimeFrame(value);
		if (value !== 'custom') {
			const params = new URLSearchParams(searchParams.toString());
			params.set('timeframe', value);
			params.delete('start');
			params.delete('end');
			router.push(`/admin/reports?${params.toString()}`);
		}
	};

	const handleApplyCustomRange = () => {
		if (startDate && endDate) {
			const params = new URLSearchParams(searchParams.toString());
			params.set('timeframe', 'custom');
			params.set('start', format(startDate, 'yyyy-MM-dd'));
			params.set('end', format(endDate, 'yyyy-MM-dd'));
			router.push(`/admin/reports?${params.toString()}`);
		}
	};

	const handleTabChange = (value: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('tab', value);
		router.push(`/admin/reports?${params.toString()}`);
	};

	// Export functions
	const exportTopClients = (format: 'csv' | 'excel') => {
		const dataWithRank = topClients.map((c, i) => ({ ...c, rank: i + 1 }));
		const content =
			format === 'excel'
				? generateExcelCSV(dataWithRank, TOP_CLIENTS_COLUMNS as any)
				: generateCSV(dataWithRank, TOP_CLIENTS_COLUMNS as any);
		downloadFile(
			content,
			getExportFilename('top-clients', format),
			getExportMimeType(format)
		);
	};

	const exportPopularSpaces = (format: 'csv' | 'excel') => {
		const dataWithRank = popularSpaces.map((s, i) => ({
			...s,
			rank: i + 1,
		}));
		const content =
			format === 'excel'
				? generateExcelCSV(dataWithRank, POPULAR_SPACES_COLUMNS as any)
				: generateCSV(dataWithRank, POPULAR_SPACES_COLUMNS as any);
		downloadFile(
			content,
			getExportFilename('popular-spaces', format),
			getExportMimeType(format)
		);
	};

	const exportTopShopItems = (format: 'csv' | 'excel') => {
		const dataWithRank = topShopItems.map((i, idx) => ({
			...i,
			rank: idx + 1,
		}));
		const content =
			format === 'excel'
				? generateExcelCSV(dataWithRank, TOP_SHOP_ITEMS_COLUMNS as any)
				: generateCSV(dataWithRank, TOP_SHOP_ITEMS_COLUMNS as any);
		downloadFile(
			content,
			getExportFilename('top-shop-items', format),
			getExportMimeType(format)
		);
	};

	const exportSpaceUtilization = (format: 'csv' | 'excel') => {
		const content =
			format === 'excel'
				? generateExcelCSV(
						spaceUtilization as unknown as Record<
							string,
							unknown
						>[],
						SPACE_UTILIZATION_COLUMNS as any
				  )
				: generateCSV(
						spaceUtilization as unknown as Record<
							string,
							unknown
						>[],
						SPACE_UTILIZATION_COLUMNS as any
				  );
		downloadFile(
			content,
			getExportFilename('space-utilization', format),
			getExportMimeType(format)
		);
	};

	const exportEarlyBirds = (format: 'csv' | 'excel') => {
		const dataWithRank = earlyBirds.map((e, i) => ({ ...e, rank: i + 1 }));
		const content =
			format === 'excel'
				? generateExcelCSV(dataWithRank, EARLY_BIRD_COLUMNS as any)
				: generateCSV(dataWithRank, EARLY_BIRD_COLUMNS as any);
		downloadFile(
			content,
			getExportFilename('early-birds', format),
			getExportMimeType(format)
		);
	};

	const exportPopularMembershipPlans = (format: 'csv' | 'excel') => {
		const dataWithRank = popularMembershipPlans.map((p, i) => ({
			...p,
			rank: i + 1,
		}));
		const content =
			format === 'excel'
				? generateExcelCSV(
						dataWithRank,
						POPULAR_MEMBERSHIP_PLANS_COLUMNS as any
				  )
				: generateCSV(
						dataWithRank,
						POPULAR_MEMBERSHIP_PLANS_COLUMNS as any
				  );
		downloadFile(
			content,
			getExportFilename('popular-membership-plans', format),
			getExportMimeType(format)
		);
	};

	const exportRepeatVisitors = (format: 'csv' | 'excel') => {
		const dataWithRank = repeatVisitors.map((v, i) => ({
			...v,
			rank: i + 1,
		}));
		const content =
			format === 'excel'
				? generateExcelCSV(dataWithRank, REPEAT_VISITORS_COLUMNS as any)
				: generateCSV(dataWithRank, REPEAT_VISITORS_COLUMNS as any);
		downloadFile(
			content,
			getExportFilename('repeat-visitors', format),
			getExportMimeType(format)
		);
	};

	const exportCheckInTrends = (format: 'csv' | 'excel') => {
		const content =
			format === 'excel'
				? generateExcelCSV(
						checkInTrends as unknown as Record<string, unknown>[],
						CHECKIN_SUMMARY_COLUMNS as any
				  )
				: generateCSV(
						checkInTrends as unknown as Record<string, unknown>[],
						CHECKIN_SUMMARY_COLUMNS as any
				  );
		downloadFile(
			content,
			getExportFilename('checkin-trends', format),
			getExportMimeType(format)
		);
	};

	const exportVisitorTrends = (format: 'csv' | 'excel') => {
		const content =
			format === 'excel'
				? generateExcelCSV(
						visitorTrends as unknown as Record<string, unknown>[],
						VISITOR_TRENDS_COLUMNS as any
				  )
				: generateCSV(
						visitorTrends as unknown as Record<string, unknown>[],
						VISITOR_TRENDS_COLUMNS as any
				  );
		downloadFile(
			content,
			getExportFilename('visitor-trends', format),
			getExportMimeType(format)
		);
	};

	return (
		<div className='min-h-screen bg-background'>
			{/* Admin Header */}
			<section className='bg-secondary text-secondary-foreground px-4 py-6 border-b'>
				<div className='container mx-auto'>
					<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
						<div>
							<div className='flex items-center gap-2 mb-2'>
								<Badge className='bg-red-600 text-white'>
									Admin
								</Badge>
								<span className='text-sm text-secondary-foreground/70'>
									Analytics & Reports
								</span>
							</div>
							<h1 className='text-2xl font-bold'>
								Reports & Analytics
							</h1>
							<p className='text-sm text-secondary-foreground/70'>
								Comprehensive insights into your workspace
								performance
							</p>
						</div>
						<div className='flex flex-wrap gap-2'>
							{/* Timeframe Selector */}
							<Select
								value={selectedTimeFrame}
								onValueChange={handleTimeFrameChange}
							>
								<SelectTrigger className='w-[160px] bg-transparent border-secondary-foreground/20'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{TIMEFRAME_OPTIONS.map((opt) => (
										<SelectItem
											key={opt.value}
											value={opt.value}
										>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							{/* Custom Date Range */}
							{selectedTimeFrame === 'custom' && (
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant='outline'
											className='bg-transparent border-secondary-foreground/20'
										>
											<CalendarIcon className='mr-2 h-4 w-4' />
											{startDate && endDate
												? `${format(
														startDate,
														'MMM d'
												  )} - ${format(
														endDate,
														'MMM d'
												  )}`
												: 'Pick dates'}
										</Button>
									</PopoverTrigger>
									<PopoverContent
										className='w-auto p-4'
										align='end'
									>
										<div className='space-y-4'>
											<div className='grid gap-2'>
												<Label>Start Date</Label>
												<Calendar
													mode='single'
													selected={startDate}
													onSelect={setStartDate}
													initialFocus
												/>
											</div>
											<div className='grid gap-2'>
												<Label>End Date</Label>
												<Calendar
													mode='single'
													selected={endDate}
													onSelect={setEndDate}
												/>
											</div>
											<Button
												onClick={handleApplyCustomRange}
												className='w-full'
											>
												Apply Range
											</Button>
										</div>
									</PopoverContent>
								</Popover>
							)}
						</div>
					</div>
				</div>
			</section>

			{/* Navigation */}
			<AdminNavigation />

			{/* Content */}
			<section className='px-4 py-8'>
				<div className='container mx-auto'>
					<Tabs
						value={activeTab}
						onValueChange={handleTabChange}
					>
						<TabsList className='mb-6 flex-wrap h-auto gap-1'>
							<TabsTrigger
								value='overview'
								className='gap-2'
							>
								<PieChart className='h-4 w-4' />
								Overview
							</TabsTrigger>
							<TabsTrigger
								value='revenue'
								className='gap-2'
							>
								<DollarSign className='h-4 w-4' />
								Revenue
							</TabsTrigger>
							<TabsTrigger
								value='clients'
								className='gap-2'
							>
								<Users className='h-4 w-4' />
								Clients
							</TabsTrigger>
							<TabsTrigger
								value='bookings'
								className='gap-2'
							>
								<CalendarDays className='h-4 w-4' />
								Bookings
							</TabsTrigger>
							<TabsTrigger
								value='memberships'
								className='gap-2'
							>
								<UserCog className='h-4 w-4' />
								Memberships
							</TabsTrigger>
							<TabsTrigger
								value='spaces'
								className='gap-2'
							>
								<Building2 className='h-4 w-4' />
								Spaces
							</TabsTrigger>
							<TabsTrigger
								value='shop'
								className='gap-2'
							>
								<ShoppingCart className='h-4 w-4' />
								Shop
							</TabsTrigger>
							<TabsTrigger
								value='visitors'
								className='gap-2'
							>
								<UsersRound className='h-4 w-4' />
								Visitors
							</TabsTrigger>
							<TabsTrigger
								value='checkins'
								className='gap-2'
							>
								<LogIn className='h-4 w-4' />
								Check-ins
							</TabsTrigger>
							<TabsTrigger
								value='leaderboard'
								className='gap-2'
							>
								<Trophy className='h-4 w-4' />
								Leaderboard
							</TabsTrigger>
						</TabsList>

						{/* OVERVIEW TAB */}
						<TabsContent
							value='overview'
							className='space-y-6'
						>
							{/* Key Metrics */}
							<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Total Revenue
										</CardTitle>
										<DollarSign className='h-4 w-4 text-muted-foreground' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{formatMoney(
												revenueOverview?.totalRevenue ||
													0
											)}
										</div>
										<p className='text-xs text-muted-foreground'>
											Net:{' '}
											{formatMoney(
												revenueOverview?.netRevenue || 0
											)}
										</p>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Tax Collected
										</CardTitle>
										<Receipt className='h-4 w-4 text-muted-foreground' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{formatMoney(
												revenueOverview?.taxCollected ||
													0
											)}
										</div>
										<p className='text-xs text-muted-foreground'>
											From{' '}
											{revenueOverview?.transactionCount ||
												0}{' '}
											transactions
										</p>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Total Clients
										</CardTitle>
										<Users className='h-4 w-4 text-muted-foreground' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{clientOverview?.totalClients || 0}
										</div>
										<p className='text-xs text-muted-foreground'>
											{clientOverview?.newClients || 0}{' '}
											new this period
										</p>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Total Bookings
										</CardTitle>
										<CalendarDays className='h-4 w-4 text-muted-foreground' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{bookingOverview?.totalBookings ||
												0}
										</div>
										<p className='text-xs text-muted-foreground'>
											{bookingOverview?.completedBookings ||
												0}{' '}
											completed
										</p>
									</CardContent>
								</Card>
							</div>

							{/* Revenue Breakdown */}
							<div className='grid gap-4 md:grid-cols-2'>
								<Card>
									<CardHeader>
										<CardTitle>Revenue by Source</CardTitle>
										<CardDescription>
											Breakdown of revenue streams
										</CardDescription>
									</CardHeader>
									<CardContent className='space-y-4'>
										<div className='space-y-3'>
											<div className='flex items-center justify-between'>
												<div className='flex items-center gap-2'>
													<div className='h-3 w-3 rounded-full bg-blue-500' />
													<span className='text-sm'>
														Bookings
													</span>
												</div>
												<span className='font-medium'>
													{formatMoney(
														revenueOverview?.bookingRevenue ||
															0
													)}
												</span>
											</div>
											<div className='flex items-center justify-between'>
												<div className='flex items-center gap-2'>
													<div className='h-3 w-3 rounded-full bg-green-500' />
													<span className='text-sm'>
														Memberships
													</span>
												</div>
												<span className='font-medium'>
													{formatMoney(
														revenueOverview?.membershipRevenue ||
															0
													)}
												</span>
											</div>
											<div className='flex items-center justify-between'>
												<div className='flex items-center gap-2'>
													<div className='h-3 w-3 rounded-full bg-purple-500' />
													<span className='text-sm'>
														Shop
													</span>
												</div>
												<span className='font-medium'>
													{formatMoney(
														revenueOverview?.shopRevenue ||
															0
													)}
												</span>
											</div>
											<div className='flex items-center justify-between'>
												<div className='flex items-center gap-2'>
													<div className='h-3 w-3 rounded-full bg-orange-500' />
													<span className='text-sm'>
														Add-ons
													</span>
												</div>
												<span className='font-medium'>
													{formatMoney(
														revenueOverview?.addonRevenue ||
															0
													)}
												</span>
											</div>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Quick Stats</CardTitle>
										<CardDescription>
											Key performance indicators
										</CardDescription>
									</CardHeader>
									<CardContent className='space-y-4'>
										<div className='flex items-center justify-between'>
											<span className='text-sm text-muted-foreground'>
												Avg Transaction
											</span>
											<span className='font-medium'>
												{formatMoney(
													revenueOverview?.averageTransactionValue ||
														0
												)}
											</span>
										</div>
										<div className='flex items-center justify-between'>
											<span className='text-sm text-muted-foreground'>
												Active Memberships
											</span>
											<span className='font-medium'>
												{membershipOverview?.activeMemberships ||
													0}
											</span>
										</div>
										<div className='flex items-center justify-between'>
											<span className='text-sm text-muted-foreground'>
												Retention Rate
											</span>
											<span className='font-medium'>
												{clientOverview?.retentionRate ||
													0}
												%
											</span>
										</div>
										<div className='flex items-center justify-between'>
											<span className='text-sm text-muted-foreground'>
												Cancellation Rate
											</span>
											<span className='font-medium'>
												{bookingOverview?.cancellationRate ||
													0}
												%
											</span>
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Revenue Trends */}
							<Card>
								<CardHeader>
									<CardTitle>Revenue Trends</CardTitle>
									<CardDescription>
										Daily revenue over the selected period
									</CardDescription>
								</CardHeader>
								<CardContent>
									{revenueTrends.length > 0 ? (
										<div className='space-y-2'>
											{revenueTrends
												.slice(-10)
												.map((trend) => (
													<div
														key={trend.date}
														className='flex items-center justify-between border-b pb-2 last:border-0'
													>
														<span className='text-sm'>
															{format(
																new Date(
																	trend.date
																),
																'MMM dd, yyyy'
															)}
														</span>
														<div className='flex items-center gap-4'>
															<span className='text-sm text-muted-foreground'>
																B:{' '}
																{formatMoney(
																	trend.bookings
																)}
															</span>
															<span className='text-sm text-muted-foreground'>
																M:{' '}
																{formatMoney(
																	trend.memberships
																)}
															</span>
															<span className='font-medium'>
																{formatMoney(
																	trend.revenue
																)}
															</span>
														</div>
													</div>
												))}
										</div>
									) : (
										<p className='text-sm text-muted-foreground text-center py-8'>
											No revenue data for this period
										</p>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						{/* REVENUE TAB */}
						<TabsContent
							value='revenue'
							className='space-y-6'
						>
							<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Total Revenue
										</CardTitle>
										<DollarSign className='h-4 w-4 text-green-500' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{formatMoney(
												revenueOverview?.totalRevenue ||
													0
											)}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Tax Collected
										</CardTitle>
										<Receipt className='h-4 w-4 text-blue-500' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{formatMoney(
												revenueOverview?.taxCollected ||
													0
											)}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Refunds
										</CardTitle>
										<TrendingDown className='h-4 w-4 text-red-500' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold text-red-500'>
											-
											{formatMoney(
												revenueOverview?.refunds || 0
											)}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Net Revenue
										</CardTitle>
										<TrendingUp className='h-4 w-4 text-green-500' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{formatMoney(
												revenueOverview?.netRevenue || 0
											)}
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Payment Methods */}
							<Card>
								<CardHeader>
									<CardTitle>Payment Methods</CardTitle>
									<CardDescription>
										Revenue breakdown by payment method
									</CardDescription>
								</CardHeader>
								<CardContent>
									{revenueOverview?.paymentMethodBreakdown &&
									revenueOverview.paymentMethodBreakdown
										.length > 0 ? (
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>
														Method
													</TableHead>
													<TableHead className='text-right'>
														Transactions
													</TableHead>
													<TableHead className='text-right'>
														Amount
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{revenueOverview.paymentMethodBreakdown.map(
													(pm) => (
														<TableRow
															key={pm.method}
														>
															<TableCell className='font-medium'>
																<div className='flex items-center gap-2'>
																	<CreditCard className='h-4 w-4' />
																	{pm.method}
																</div>
															</TableCell>
															<TableCell className='text-right'>
																{pm.count}
															</TableCell>
															<TableCell className='text-right font-medium'>
																{formatMoney(
																	pm.amount
																)}
															</TableCell>
														</TableRow>
													)
												)}
											</TableBody>
										</Table>
									) : (
										<p className='text-sm text-muted-foreground text-center py-8'>
											No payment data for this period
										</p>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						{/* CLIENTS TAB */}
						<TabsContent
							value='clients'
							className='space-y-6'
						>
							<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Total Clients
										</CardTitle>
										<Users className='h-4 w-4 text-muted-foreground' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{clientOverview?.totalClients || 0}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Active Clients
										</CardTitle>
										<Activity className='h-4 w-4 text-green-500' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{clientOverview?.activeClients || 0}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											New Clients
										</CardTitle>
										<Zap className='h-4 w-4 text-blue-500' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{clientOverview?.newClients || 0}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Retention Rate
										</CardTitle>
										<Target className='h-4 w-4 text-purple-500' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{clientOverview?.retentionRate || 0}
											%
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Top Clients */}
							<Card>
								<CardHeader className='flex flex-row items-center justify-between'>
									<div>
										<CardTitle>
											Top Clients by Revenue
										</CardTitle>
										<CardDescription>
											Highest spending clients this period
										</CardDescription>
									</div>
									<div className='flex gap-2'>
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												exportTopClients('csv')
											}
										>
											<Download className='mr-2 h-4 w-4' />
											CSV
										</Button>
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												exportTopClients('excel')
											}
										>
											<FileSpreadsheet className='mr-2 h-4 w-4' />
											Excel
										</Button>
									</div>
								</CardHeader>
								<CardContent>
									{topClients.length > 0 ? (
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className='w-12'>
														#
													</TableHead>
													<TableHead>
														Client
													</TableHead>
													<TableHead>
														Company
													</TableHead>
													<TableHead className='text-right'>
														Bookings
													</TableHead>
													<TableHead className='text-right'>
														Total Spent
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{topClients.map((client, i) => (
													<TableRow key={client.id}>
														<TableCell>
															{i === 0 && (
																<Crown className='h-5 w-5 text-yellow-500' />
															)}
															{i === 1 && (
																<Medal className='h-5 w-5 text-gray-400' />
															)}
															{i === 2 && (
																<Award className='h-5 w-5 text-amber-600' />
															)}
															{i > 2 && (
																<span className='text-muted-foreground'>
																	{i + 1}
																</span>
															)}
														</TableCell>
														<TableCell>
															<div>
																<p className='font-medium'>
																	{
																		client.name
																	}
																</p>
																<p className='text-xs text-muted-foreground'>
																	{
																		client.email
																	}
																</p>
															</div>
														</TableCell>
														<TableCell>
															{client.company ||
																'-'}
														</TableCell>
														<TableCell className='text-right'>
															{
																client.bookingCount
															}
														</TableCell>
														<TableCell className='text-right font-medium'>
															{formatMoney(
																client.totalSpent
															)}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									) : (
										<p className='text-sm text-muted-foreground text-center py-8'>
											No client data for this period
										</p>
									)}
								</CardContent>
							</Card>

							{/* Early Birds */}
							<Card>
								<CardHeader className='flex flex-row items-center justify-between'>
									<div>
										<CardTitle>
											🐦 Early Bird Clients
										</CardTitle>
										<CardDescription>
											Clients who book furthest in advance
										</CardDescription>
									</div>
									<div className='flex gap-2'>
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												exportEarlyBirds('csv')
											}
										>
											<Download className='mr-2 h-4 w-4' />
											CSV
										</Button>
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												exportEarlyBirds('excel')
											}
										>
											<FileSpreadsheet className='mr-2 h-4 w-4' />
											Excel
										</Button>
									</div>
								</CardHeader>
								<CardContent>
									{earlyBirds.length > 0 ? (
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className='w-12'>
														#
													</TableHead>
													<TableHead>
														Client
													</TableHead>
													<TableHead className='text-right'>
														Avg Lead Time
													</TableHead>
													<TableHead className='text-right'>
														Max Lead Time
													</TableHead>
													<TableHead className='text-right'>
														Bookings
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{earlyBirds.map((client, i) => (
													<TableRow key={client.id}>
														<TableCell className='text-muted-foreground'>
															{i + 1}
														</TableCell>
														<TableCell>
															<div>
																<p className='font-medium'>
																	{
																		client.name
																	}
																</p>
																<p className='text-xs text-muted-foreground'>
																	{
																		client.email
																	}
																</p>
															</div>
														</TableCell>
														<TableCell className='text-right'>
															{
																client.averageLeadTime
															}{' '}
															days
														</TableCell>
														<TableCell className='text-right'>
															{
																client.earliestBooking
															}{' '}
															days
														</TableCell>
														<TableCell className='text-right'>
															{
																client.bookingCount
															}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									) : (
										<p className='text-sm text-muted-foreground text-center py-8'>
											No early bird data for this period
										</p>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						{/* BOOKINGS TAB */}
						<TabsContent
							value='bookings'
							className='space-y-6'
						>
							<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Total
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{bookingOverview?.totalBookings ||
												0}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Confirmed
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold text-blue-500'>
											{bookingOverview?.confirmedBookings ||
												0}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Completed
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold text-green-500'>
											{bookingOverview?.completedBookings ||
												0}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Cancelled
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold text-red-500'>
											{bookingOverview?.cancelledBookings ||
												0}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											No Shows
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold text-orange-500'>
											{bookingOverview?.noShows || 0}
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Stats Cards */}
							<div className='grid gap-4 md:grid-cols-3'>
								<Card>
									<CardHeader className='pb-2'>
										<CardTitle className='text-sm font-medium'>
											Avg Booking Value
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{formatMoney(
												bookingOverview?.averageBookingValue ||
													0
											)}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='pb-2'>
										<CardTitle className='text-sm font-medium'>
											Avg Attendees
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{bookingOverview?.averageAttendees ||
												0}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='pb-2'>
										<CardTitle className='text-sm font-medium'>
											Total Value
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{formatMoney(
												bookingOverview?.totalValue || 0
											)}
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Popular Spaces */}
							<Card>
								<CardHeader className='flex flex-row items-center justify-between'>
									<div>
										<CardTitle>Popular Spaces</CardTitle>
										<CardDescription>
											Most booked spaces this period
										</CardDescription>
									</div>
									<div className='flex gap-2'>
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												exportPopularSpaces('csv')
											}
										>
											<Download className='mr-2 h-4 w-4' />
											CSV
										</Button>
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												exportPopularSpaces('excel')
											}
										>
											<FileSpreadsheet className='mr-2 h-4 w-4' />
											Excel
										</Button>
									</div>
								</CardHeader>
								<CardContent>
									{popularSpaces.length > 0 ? (
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className='w-12'>
														#
													</TableHead>
													<TableHead>Space</TableHead>
													<TableHead>Type</TableHead>
													<TableHead className='text-right'>
														Bookings
													</TableHead>
													<TableHead className='text-right'>
														Revenue
													</TableHead>
													<TableHead className='text-right'>
														Avg Occupancy
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{popularSpaces.map(
													(space, i) => (
														<TableRow
															key={space.id}
														>
															<TableCell className='text-muted-foreground'>
																{i + 1}
															</TableCell>
															<TableCell className='font-medium'>
																{space.name}
															</TableCell>
															<TableCell>
																<Badge variant='outline'>
																	{space.type}
																</Badge>
															</TableCell>
															<TableCell className='text-right'>
																{
																	space.bookingCount
																}
															</TableCell>
															<TableCell className='text-right font-medium'>
																{formatMoney(
																	space.totalRevenue
																)}
															</TableCell>
															<TableCell className='text-right'>
																{
																	space.averageOccupancy
																}
																%
															</TableCell>
														</TableRow>
													)
												)}
											</TableBody>
										</Table>
									) : (
										<p className='text-sm text-muted-foreground text-center py-8'>
											No booking data for this period
										</p>
									)}
								</CardContent>
							</Card>

							{/* Peak Booking Hours */}
							<Card>
								<CardHeader>
									<CardTitle>⏰ Peak Booking Hours</CardTitle>
									<CardDescription>
										When spaces are most frequently booked
									</CardDescription>
								</CardHeader>
								<CardContent>
									{peakHours.length > 0 ? (
										<div className='space-y-3'>
											{peakHours.map((peak) => {
												const maxBookings = Math.max(
													...peakHours.map(
														(p) => p.bookingCount
													)
												);
												const percentage =
													maxBookings > 0
														? (peak.bookingCount /
																maxBookings) *
														  100
														: 0;
												return (
													<div
														key={peak.hour}
														className='flex items-center gap-3'
													>
														<span className='w-16 text-sm text-muted-foreground'>
															{peak.label}
														</span>
														<div className='flex-1'>
															<Progress
																value={
																	percentage
																}
																className='h-6'
															/>
														</div>
														<span className='w-20 text-sm text-right font-medium'>
															{peak.bookingCount}
														</span>
													</div>
												);
											})}
										</div>
									) : (
										<p className='text-sm text-muted-foreground text-center py-8'>
											No peak hour data for this period
										</p>
									)}
								</CardContent>
							</Card>

							{/* Booking Trends */}
							<Card>
								<CardHeader>
									<CardTitle>📈 Booking Trends</CardTitle>
									<CardDescription>
										Daily booking activity
									</CardDescription>
								</CardHeader>
								<CardContent>
									{bookingTrends.length > 0 ? (
										<div className='space-y-2'>
											{bookingTrends
												.slice(-14)
												.map((trend) => (
													<div
														key={trend.date}
														className='flex items-center justify-between border-b pb-2 last:border-0'
													>
														<span className='text-sm'>
															{format(
																new Date(
																	trend.date
																),
																'EEE, MMM dd'
															)}
														</span>
														<div className='flex items-center gap-4'>
															<span className='text-xs text-blue-600'>
																Confirmed:{' '}
																{
																	trend.confirmed
																}
															</span>
															<span className='text-xs text-green-600'>
																Completed:{' '}
																{
																	trend.completed
																}
															</span>
															<span className='text-xs text-red-600'>
																Cancelled:{' '}
																{
																	trend.cancelled
																}
															</span>
															<span className='font-medium'>
																Total:{' '}
																{trend.total}
															</span>
														</div>
													</div>
												))}
										</div>
									) : (
										<p className='text-sm text-muted-foreground text-center py-8'>
											No booking trend data for this
											period
										</p>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						{/* SPACES TAB */}
						<TabsContent
							value='spaces'
							className='space-y-6'
						>
							<Card>
								<CardHeader className='flex flex-row items-center justify-between'>
									<div>
										<CardTitle>Space Utilization</CardTitle>
										<CardDescription>
											Performance metrics for each
											bookable space
										</CardDescription>
									</div>
									<div className='flex gap-2'>
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												exportSpaceUtilization('csv')
											}
										>
											<Download className='mr-2 h-4 w-4' />
											CSV
										</Button>
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												exportSpaceUtilization('excel')
											}
										>
											<FileSpreadsheet className='mr-2 h-4 w-4' />
											Excel
										</Button>
									</div>
								</CardHeader>
								<CardContent>
									{spaceUtilization.length > 0 ? (
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Space</TableHead>
													<TableHead>
														Capacity
													</TableHead>
													<TableHead className='text-right'>
														Bookings
													</TableHead>
													<TableHead className='text-right'>
														Hours Used
													</TableHead>
													<TableHead className='text-right'>
														Utilization
													</TableHead>
													<TableHead className='text-right'>
														Revenue
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{spaceUtilization.map(
													(space) => (
														<TableRow
															key={space.id}
														>
															<TableCell className='font-medium'>
																{space.name}
															</TableCell>
															<TableCell>
																{space.capacity}
															</TableCell>
															<TableCell className='text-right'>
																{
																	space.totalBookings
																}
															</TableCell>
															<TableCell className='text-right'>
																{
																	space.totalHours
																}
																h
															</TableCell>
															<TableCell className='text-right'>
																<Badge
																	variant={
																		space.utilizationRate >
																		70
																			? 'default'
																			: space.utilizationRate >
																			  40
																			? 'secondary'
																			: 'outline'
																	}
																>
																	{
																		space.utilizationRate
																	}
																	%
																</Badge>
															</TableCell>
															<TableCell className='text-right font-medium'>
																{formatMoney(
																	space.revenue
																)}
															</TableCell>
														</TableRow>
													)
												)}
											</TableBody>
										</Table>
									) : (
										<p className='text-sm text-muted-foreground text-center py-8'>
											No space utilization data for this
											period
										</p>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						{/* SHOP TAB */}
						<TabsContent
							value='shop'
							className='space-y-6'
						>
							<div className='grid gap-4 md:grid-cols-3'>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Shop Revenue
										</CardTitle>
										<ShoppingCart className='h-4 w-4 text-muted-foreground' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{formatMoney(
												revenueOverview?.shopRevenue ||
													0
											)}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Items Sold
										</CardTitle>
										<Package className='h-4 w-4 text-muted-foreground' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{topShopItems.reduce(
												(sum, i) =>
													sum + i.quantitySold,
												0
											)}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Top Categories
										</CardTitle>
										<Star className='h-4 w-4 text-muted-foreground' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{
												new Set(
													topShopItems.map(
														(i) => i.category
													)
												).size
											}
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Top Shop Items */}
							<Card>
								<CardHeader className='flex flex-row items-center justify-between'>
									<div>
										<CardTitle>Top Selling Items</CardTitle>
										<CardDescription>
											Best performing shop items this
											period
										</CardDescription>
									</div>
									<div className='flex gap-2'>
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												exportTopShopItems('csv')
											}
										>
											<Download className='mr-2 h-4 w-4' />
											CSV
										</Button>
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												exportTopShopItems('excel')
											}
										>
											<FileSpreadsheet className='mr-2 h-4 w-4' />
											Excel
										</Button>
									</div>
								</CardHeader>
								<CardContent>
									{topShopItems.length > 0 ? (
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className='w-12'>
														#
													</TableHead>
													<TableHead>Item</TableHead>
													<TableHead>
														Category
													</TableHead>
													<TableHead className='text-right'>
														Qty Sold
													</TableHead>
													<TableHead className='text-right'>
														Revenue
													</TableHead>
													<TableHead className='text-right'>
														Avg Price
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{topShopItems.map((item, i) => (
													<TableRow key={item.id}>
														<TableCell>
															{i === 0 && (
																<Trophy className='h-5 w-5 text-yellow-500' />
															)}
															{i > 0 && (
																<span className='text-muted-foreground'>
																	{i + 1}
																</span>
															)}
														</TableCell>
														<TableCell className='font-medium'>
															{item.name}
														</TableCell>
														<TableCell>
															<Badge variant='outline'>
																{item.category}
															</Badge>
														</TableCell>
														<TableCell className='text-right'>
															{item.quantitySold}
														</TableCell>
														<TableCell className='text-right font-medium'>
															{formatMoney(
																item.totalRevenue
															)}
														</TableCell>
														<TableCell className='text-right'>
															{formatMoney(
																item.averagePrice
															)}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									) : (
										<p className='text-sm text-muted-foreground text-center py-8'>
											No shop data for this period
										</p>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						{/* MEMBERSHIPS TAB */}
						<TabsContent
							value='memberships'
							className='space-y-6'
						>
							<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Active Memberships
										</CardTitle>
										<UserCheck className='h-4 w-4 text-green-500' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{membershipOverview?.activeMemberships ||
												0}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Expired
										</CardTitle>
										<UserX className='h-4 w-4 text-orange-500' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{membershipOverview?.expiredMemberships ||
												0}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Renewal Rate
										</CardTitle>
										<Repeat className='h-4 w-4 text-blue-500' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{membershipOverview?.renewalRate ||
												0}
											%
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Upcoming Renewals
										</CardTitle>
										<Timer className='h-4 w-4 text-purple-500' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{membershipOverview?.upcomingRenewals ||
												0}
										</div>
										<p className='text-xs text-muted-foreground'>
											Next 30 days
										</p>
									</CardContent>
								</Card>
							</div>

							{/* Additional Stats */}
							<div className='grid gap-4 md:grid-cols-3'>
								<Card>
									<CardHeader className='pb-2'>
										<CardTitle className='text-sm font-medium'>
											Total Membership Value
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{formatMoney(
												membershipOverview?.totalValue ||
													0
											)}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='pb-2'>
										<CardTitle className='text-sm font-medium'>
											Cancelled
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold text-red-500'>
											{membershipOverview?.cancelledMemberships ||
												0}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='pb-2'>
										<CardTitle className='text-sm font-medium'>
											Avg Duration
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{membershipOverview?.averageMembershipDuration ||
												0}{' '}
											days
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Popular Membership Plans */}
							<Card>
								<CardHeader className='flex flex-row items-center justify-between'>
									<div>
										<CardTitle>
											Popular Membership Plans
										</CardTitle>
										<CardDescription>
											Most subscribed plans this period
										</CardDescription>
									</div>
									<div className='flex gap-2'>
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												exportPopularMembershipPlans(
													'csv'
												)
											}
										>
											<Download className='mr-2 h-4 w-4' />
											CSV
										</Button>
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												exportPopularMembershipPlans(
													'excel'
												)
											}
										>
											<FileSpreadsheet className='mr-2 h-4 w-4' />
											Excel
										</Button>
									</div>
								</CardHeader>
								<CardContent>
									{popularMembershipPlans.length > 0 ? (
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className='w-12'>
														#
													</TableHead>
													<TableHead>Plan</TableHead>
													<TableHead>Space</TableHead>
													<TableHead>Cycle</TableHead>
													<TableHead className='text-right'>
														Subscribers
													</TableHead>
													<TableHead className='text-right'>
														Revenue
													</TableHead>
													<TableHead className='text-right'>
														Renewal Rate
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{popularMembershipPlans.map(
													(plan, i) => (
														<TableRow key={plan.id}>
															<TableCell>
																{i === 0 && (
																	<Crown className='h-5 w-5 text-yellow-500' />
																)}
																{i > 0 && (
																	<span className='text-muted-foreground'>
																		{i + 1}
																	</span>
																)}
															</TableCell>
															<TableCell className='font-medium'>
																{plan.name}
															</TableCell>
															<TableCell>
																{plan.spaceName}
															</TableCell>
															<TableCell>
																<Badge variant='outline'>
																	{
																		plan.billingCycle
																	}
																</Badge>
															</TableCell>
															<TableCell className='text-right'>
																{
																	plan.subscriberCount
																}
															</TableCell>
															<TableCell className='text-right font-medium'>
																{formatMoney(
																	plan.totalRevenue
																)}
															</TableCell>
															<TableCell className='text-right'>
																<Badge
																	variant={
																		plan.renewalRate >
																		70
																			? 'default'
																			: 'secondary'
																	}
																>
																	{
																		plan.renewalRate
																	}
																	%
																</Badge>
															</TableCell>
														</TableRow>
													)
												)}
											</TableBody>
										</Table>
									) : (
										<p className='text-sm text-muted-foreground text-center py-8'>
											No membership plan data for this
											period
										</p>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						{/* VISITORS TAB */}
						<TabsContent
							value='visitors'
							className='space-y-6'
						>
							<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Total Visitors
										</CardTitle>
										<UsersRound className='h-4 w-4 text-muted-foreground' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{visitorOverview?.totalVisitors ||
												0}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Checked In
										</CardTitle>
										<UserCheck className='h-4 w-4 text-green-500' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold text-green-500'>
											{visitorOverview?.checkedInVisitors ||
												0}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Checked Out
										</CardTitle>
										<LogIn className='h-4 w-4 text-blue-500' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{visitorOverview?.checkedOutVisitors ||
												0}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Pending
										</CardTitle>
										<Clock className='h-4 w-4 text-orange-500' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold text-orange-500'>
											{visitorOverview?.pendingVisitors ||
												0}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Avg Duration
										</CardTitle>
										<Timer className='h-4 w-4 text-purple-500' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{visitorOverview?.averageVisitDuration ||
												0}
											m
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Visitor Trends */}
							<Card>
								<CardHeader className='flex flex-row items-center justify-between'>
									<div>
										<CardTitle>Visitor Trends</CardTitle>
										<CardDescription>
											Daily visitor activity
										</CardDescription>
									</div>
									<div className='flex gap-2'>
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												exportVisitorTrends('csv')
											}
										>
											<Download className='mr-2 h-4 w-4' />
											CSV
										</Button>
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												exportVisitorTrends('excel')
											}
										>
											<FileSpreadsheet className='mr-2 h-4 w-4' />
											Excel
										</Button>
									</div>
								</CardHeader>
								<CardContent>
									{visitorTrends.length > 0 ? (
										<div className='space-y-2'>
											{visitorTrends
												.slice(-10)
												.map((trend) => (
													<div
														key={trend.date}
														className='flex items-center justify-between border-b pb-2 last:border-0'
													>
														<span className='text-sm'>
															{format(
																new Date(
																	trend.date
																),
																'MMM dd, yyyy'
															)}
														</span>
														<div className='flex items-center gap-4'>
															<span className='text-sm text-muted-foreground'>
																Total:{' '}
																{trend.total}
															</span>
															<span className='text-sm text-green-600'>
																In:{' '}
																{
																	trend.checkedIn
																}
															</span>
															<span className='text-sm text-blue-600'>
																Out:{' '}
																{
																	trend.checkedOut
																}
															</span>
														</div>
													</div>
												))}
										</div>
									) : (
										<p className='text-sm text-muted-foreground text-center py-8'>
											No visitor data for this period
										</p>
									)}
								</CardContent>
							</Card>

							{/* Repeat Visitors */}
							<Card>
								<CardHeader className='flex flex-row items-center justify-between'>
									<div>
										<CardTitle>
											🔄 Repeat Visitors
										</CardTitle>
										<CardDescription>
											Visitors who have come multiple
											times
										</CardDescription>
									</div>
									<div className='flex gap-2'>
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												exportRepeatVisitors('csv')
											}
										>
											<Download className='mr-2 h-4 w-4' />
											CSV
										</Button>
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												exportRepeatVisitors('excel')
											}
										>
											<FileSpreadsheet className='mr-2 h-4 w-4' />
											Excel
										</Button>
									</div>
								</CardHeader>
								<CardContent>
									{repeatVisitors.length > 0 ? (
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className='w-12'>
														#
													</TableHead>
													<TableHead>
														Visitor
													</TableHead>
													<TableHead>
														Company
													</TableHead>
													<TableHead className='text-right'>
														Visits
													</TableHead>
													<TableHead className='text-right'>
														Total Time
													</TableHead>
													<TableHead className='text-right'>
														Last Visit
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{repeatVisitors.map(
													(visitor, i) => (
														<TableRow
															key={visitor.id}
														>
															<TableCell className='text-muted-foreground'>
																{i + 1}
															</TableCell>
															<TableCell>
																<div>
																	<p className='font-medium'>
																		{
																			visitor.name
																		}
																	</p>
																	<p className='text-xs text-muted-foreground'>
																		{
																			visitor.email
																		}
																	</p>
																</div>
															</TableCell>
															<TableCell>
																{visitor.company ||
																	'-'}
															</TableCell>
															<TableCell className='text-right'>
																<Badge variant='secondary'>
																	{
																		visitor.visitCount
																	}
																</Badge>
															</TableCell>
															<TableCell className='text-right'>
																{Math.round(
																	visitor.totalDuration /
																		60
																)}
																h{' '}
																{visitor.totalDuration %
																	60}
																m
															</TableCell>
															<TableCell className='text-right text-muted-foreground'>
																{format(
																	new Date(
																		visitor.lastVisit
																	),
																	'MMM d'
																)}
															</TableCell>
														</TableRow>
													)
												)}
											</TableBody>
										</Table>
									) : (
										<p className='text-sm text-muted-foreground text-center py-8'>
											No repeat visitors for this period
										</p>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						{/* CHECK-INS TAB */}
						<TabsContent
							value='checkins'
							className='space-y-6'
						>
							<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Total Check-ins
										</CardTitle>
										<LogIn className='h-4 w-4 text-muted-foreground' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{checkInOverview?.totalCheckIns ||
												0}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											On-Time
										</CardTitle>
										<CheckCircle2 className='h-4 w-4 text-green-500' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold text-green-500'>
											{checkInOverview?.onTimeCheckIns ||
												0}
										</div>
										<p className='text-xs text-muted-foreground'>
											{checkInOverview?.onTimeRate || 0}%
											of scheduled
										</p>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Late
										</CardTitle>
										<XCircle className='h-4 w-4 text-red-500' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold text-red-500'>
											{checkInOverview?.lateCheckIns || 0}
										</div>
										<p className='text-xs text-muted-foreground'>
											{checkInOverview?.lateRate || 0}% of
											scheduled
										</p>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Early
										</CardTitle>
										<AlertCircle className='h-4 w-4 text-blue-500' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold text-blue-500'>
											{checkInOverview?.earlyCheckIns ||
												0}
										</div>
										<p className='text-xs text-muted-foreground'>
											{checkInOverview?.earlyRate || 0}%
											of scheduled
										</p>
									</CardContent>
								</Card>
							</div>

							{/* Check-in Type Breakdown */}
							<div className='grid gap-4 md:grid-cols-3'>
								<Card>
									<CardHeader className='pb-2'>
										<CardTitle className='text-sm font-medium'>
											Booking Check-ins
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{checkInOverview?.bookingCheckIns ||
												0}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='pb-2'>
										<CardTitle className='text-sm font-medium'>
											Membership Check-ins
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{checkInOverview?.membershipCheckIns ||
												0}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='pb-2'>
										<CardTitle className='text-sm font-medium'>
											Visitor Check-ins
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{checkInOverview?.visitorCheckIns ||
												0}
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Punctuality Overview */}
							<Card>
								<CardHeader>
									<CardTitle>Punctuality Overview</CardTitle>
									<CardDescription>
										Check-in timing distribution (±15
										minutes threshold)
									</CardDescription>
								</CardHeader>
								<CardContent className='space-y-4'>
									<div className='space-y-2'>
										<div className='flex items-center justify-between'>
											<div className='flex items-center gap-2'>
												<div className='h-3 w-3 rounded-full bg-green-500' />
												<span className='text-sm'>
													On-Time
												</span>
											</div>
											<span className='font-medium'>
												{checkInOverview?.onTimeRate ||
													0}
												%
											</span>
										</div>
										<Progress
											value={
												checkInOverview?.onTimeRate || 0
											}
											className='h-2'
										/>
									</div>
									<div className='space-y-2'>
										<div className='flex items-center justify-between'>
											<div className='flex items-center gap-2'>
												<div className='h-3 w-3 rounded-full bg-red-500' />
												<span className='text-sm'>
													Late (15+ minutes)
												</span>
											</div>
											<span className='font-medium'>
												{checkInOverview?.lateRate || 0}
												%
											</span>
										</div>
										<Progress
											value={
												checkInOverview?.lateRate || 0
											}
											className='h-2 [&>div]:bg-red-500'
										/>
									</div>
									<div className='space-y-2'>
										<div className='flex items-center justify-between'>
											<div className='flex items-center gap-2'>
												<div className='h-3 w-3 rounded-full bg-blue-500' />
												<span className='text-sm'>
													Early (15+ minutes)
												</span>
											</div>
											<span className='font-medium'>
												{checkInOverview?.earlyRate ||
													0}
												%
											</span>
										</div>
										<Progress
											value={
												checkInOverview?.earlyRate || 0
											}
											className='h-2 [&>div]:bg-blue-500'
										/>
									</div>
									<div className='pt-4 border-t'>
										<div className='flex items-center justify-between'>
											<span className='text-sm text-muted-foreground'>
												Average Delay
											</span>
											<span className='font-medium'>
												{(checkInOverview?.averageCheckInDelay ||
													0) > 0
													? '+'
													: ''}
												{checkInOverview?.averageCheckInDelay ||
													0}{' '}
												min
											</span>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Check-in Trends */}
							<Card>
								<CardHeader className='flex flex-row items-center justify-between'>
									<div>
										<CardTitle>Check-in Trends</CardTitle>
										<CardDescription>
											Daily check-in activity
										</CardDescription>
									</div>
									<div className='flex gap-2'>
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												exportCheckInTrends('csv')
											}
										>
											<Download className='mr-2 h-4 w-4' />
											CSV
										</Button>
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												exportCheckInTrends('excel')
											}
										>
											<FileSpreadsheet className='mr-2 h-4 w-4' />
											Excel
										</Button>
									</div>
								</CardHeader>
								<CardContent>
									{checkInTrends.length > 0 ? (
										<div className='space-y-2'>
											{checkInTrends
												.slice(-10)
												.map((trend) => (
													<div
														key={trend.date}
														className='flex items-center justify-between border-b pb-2 last:border-0'
													>
														<span className='text-sm'>
															{format(
																new Date(
																	trend.date
																),
																'MMM dd, yyyy'
															)}
														</span>
														<div className='flex items-center gap-3'>
															<span className='text-xs text-muted-foreground'>
																B:{' '}
																{trend.bookings}
															</span>
															<span className='text-xs text-muted-foreground'>
																M:{' '}
																{
																	trend.memberships
																}
															</span>
															<span className='text-xs text-muted-foreground'>
																V:{' '}
																{trend.visitors}
															</span>
															<span className='text-sm text-green-600'>
																✓ {trend.onTime}
															</span>
															<span className='text-sm text-red-600'>
																✗ {trend.late}
															</span>
															<span className='font-medium'>
																Total:{' '}
																{trend.total}
															</span>
														</div>
													</div>
												))}
										</div>
									) : (
										<p className='text-sm text-muted-foreground text-center py-8'>
											No check-in data for this period
										</p>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						{/* LEADERBOARD TAB */}
						<TabsContent
							value='leaderboard'
							className='space-y-6'
						>
							<div className='grid gap-6 md:grid-cols-2'>
								{/* By Revenue */}
								<Card>
									<CardHeader>
										<div className='flex items-center gap-2'>
											<Crown className='h-5 w-5 text-yellow-500' />
											<CardTitle>Top Spenders</CardTitle>
										</div>
										<CardDescription>
											Clients ranked by total spending
										</CardDescription>
									</CardHeader>
									<CardContent>
										{leaderboard?.byRevenue &&
										leaderboard.byRevenue.length > 0 ? (
											<div className='space-y-3'>
												{leaderboard.byRevenue
													.slice(0, 5)
													.map((entry) => (
														<div
															key={entry.id}
															className='flex items-center justify-between border-b pb-2 last:border-0'
														>
															<div className='flex items-center gap-3'>
																<span className='w-6 text-center font-bold'>
																	{entry.rank ===
																		1 &&
																		'🥇'}
																	{entry.rank ===
																		2 &&
																		'🥈'}
																	{entry.rank ===
																		3 &&
																		'🥉'}
																	{entry.rank >
																		3 &&
																		entry.rank}
																</span>
																<div>
																	<p className='font-medium'>
																		{
																			entry.name
																		}
																	</p>
																	<p className='text-xs text-muted-foreground'>
																		{entry.company ||
																			entry.email}
																	</p>
																</div>
															</div>
															<span className='font-bold'>
																{formatMoney(
																	entry.score
																)}
															</span>
														</div>
													))}
											</div>
										) : (
											<p className='text-sm text-muted-foreground text-center py-4'>
												No data available
											</p>
										)}
									</CardContent>
								</Card>

								{/* By Bookings */}
								<Card>
									<CardHeader>
										<div className='flex items-center gap-2'>
											<CalendarDays className='h-5 w-5 text-blue-500' />
											<CardTitle>Most Active</CardTitle>
										</div>
										<CardDescription>
											Clients ranked by booking count
										</CardDescription>
									</CardHeader>
									<CardContent>
										{leaderboard?.byBookings &&
										leaderboard.byBookings.length > 0 ? (
											<div className='space-y-3'>
												{leaderboard.byBookings
													.slice(0, 5)
													.map((entry) => (
														<div
															key={entry.id}
															className='flex items-center justify-between border-b pb-2 last:border-0'
														>
															<div className='flex items-center gap-3'>
																<span className='w-6 text-center font-bold'>
																	{entry.rank ===
																		1 &&
																		'🥇'}
																	{entry.rank ===
																		2 &&
																		'🥈'}
																	{entry.rank ===
																		3 &&
																		'🥉'}
																	{entry.rank >
																		3 &&
																		entry.rank}
																</span>
																<div>
																	<p className='font-medium'>
																		{
																			entry.name
																		}
																	</p>
																	<p className='text-xs text-muted-foreground'>
																		{entry.company ||
																			entry.email}
																	</p>
																</div>
															</div>
															<span className='font-bold'>
																{entry.score}{' '}
																bookings
															</span>
														</div>
													))}
											</div>
										) : (
											<p className='text-sm text-muted-foreground text-center py-4'>
												No data available
											</p>
										)}
									</CardContent>
								</Card>

								{/* Early Birds */}
								<Card>
									<CardHeader>
										<div className='flex items-center gap-2'>
											<Clock className='h-5 w-5 text-green-500' />
											<CardTitle>
												Early Birds 🐦
											</CardTitle>
										</div>
										<CardDescription>
											Clients who book furthest ahead
										</CardDescription>
									</CardHeader>
									<CardContent>
										{leaderboard?.byEarlyBird &&
										leaderboard.byEarlyBird.length > 0 ? (
											<div className='space-y-3'>
												{leaderboard.byEarlyBird
													.slice(0, 5)
													.map((entry) => (
														<div
															key={entry.id}
															className='flex items-center justify-between border-b pb-2 last:border-0'
														>
															<div className='flex items-center gap-3'>
																<span className='w-6 text-center font-bold'>
																	{entry.rank ===
																		1 &&
																		'🥇'}
																	{entry.rank ===
																		2 &&
																		'🥈'}
																	{entry.rank ===
																		3 &&
																		'🥉'}
																	{entry.rank >
																		3 &&
																		entry.rank}
																</span>
																<div>
																	<p className='font-medium'>
																		{
																			entry.name
																		}
																	</p>
																	<p className='text-xs text-muted-foreground'>
																		{entry.company ||
																			entry.email}
																	</p>
																</div>
															</div>
															<span className='font-bold'>
																{entry.score}{' '}
																days ahead
															</span>
														</div>
													))}
											</div>
										) : (
											<p className='text-sm text-muted-foreground text-center py-4'>
												No data available
											</p>
										)}
									</CardContent>
								</Card>

								{/* Loyalty */}
								<Card>
									<CardHeader>
										<div className='flex items-center gap-2'>
											<Star className='h-5 w-5 text-purple-500' />
											<CardTitle>Loyal Members</CardTitle>
										</div>
										<CardDescription>
											Longest active membership duration
										</CardDescription>
									</CardHeader>
									<CardContent>
										{leaderboard?.byLoyalty &&
										leaderboard.byLoyalty.length > 0 ? (
											<div className='space-y-3'>
												{leaderboard.byLoyalty
													.slice(0, 5)
													.map((entry) => (
														<div
															key={entry.id}
															className='flex items-center justify-between border-b pb-2 last:border-0'
														>
															<div className='flex items-center gap-3'>
																<span className='w-6 text-center font-bold'>
																	{entry.rank ===
																		1 &&
																		'🥇'}
																	{entry.rank ===
																		2 &&
																		'🥈'}
																	{entry.rank ===
																		3 &&
																		'🥉'}
																	{entry.rank >
																		3 &&
																		entry.rank}
																</span>
																<div>
																	<p className='font-medium'>
																		{
																			entry.name
																		}
																	</p>
																	<p className='text-xs text-muted-foreground'>
																		{entry.company ||
																			entry.email}
																	</p>
																</div>
															</div>
															<span className='font-bold'>
																{entry.score}{' '}
																days
															</span>
														</div>
													))}
											</div>
										) : (
											<p className='text-sm text-muted-foreground text-center py-4'>
												No data available
											</p>
										)}
									</CardContent>
								</Card>
							</div>
						</TabsContent>
					</Tabs>
				</div>
			</section>
		</div>
	);
}
