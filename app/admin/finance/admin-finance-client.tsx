'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	DollarSign,
	TrendingUp,
	TrendingDown,
	CreditCard,
	Receipt,
	Settings,
	Download,
	ArrowUpRight,
	ArrowDownRight,
	PieChart,
} from 'lucide-react';
import { AdminNavigation } from '@/components/admin/admin-navigation';
import { format } from 'date-fns';
import type {
	TransactionSummary,
	RevenueByPeriod,
	RevenueBySource,
	FinanceSettings,
} from '@/actions/finance';

interface SessionUser {
	id: string;
	email: string;
	name: string;
	role: string;
}

interface AdminFinanceClientProps {
	admin: SessionUser;
	summary: TransactionSummary | null;
	revenueByPeriod: RevenueByPeriod[];
	revenueBySource: RevenueBySource[];
	settings: FinanceSettings | null;
}

const formatCurrency = (kobo: number, symbol = '₦') => {
	return `${symbol}${(kobo / 100).toLocaleString()}`;
};

export default function AdminFinanceClient({
	admin,
	summary,
	revenueByPeriod,
	revenueBySource,
	settings,
}: AdminFinanceClientProps) {
	const [period, setPeriod] = useState('30days');

	const stats = summary || {
		totalRevenue: 0,
		totalTax: 0,
		totalTransactions: 0,
		paidTransactions: 0,
		pendingTransactions: 0,
		failedTransactions: 0,
		refundedAmount: 0,
	};

	// Calculate growth (mock for now - would need historical data)
	const revenueGrowth = 12.5;
	const transactionGrowth = 8.3;

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
									Finance Management
								</span>
							</div>
							<h1 className='text-2xl font-bold'>
								Finance Overview
							</h1>
							<p className='text-sm text-secondary-foreground/70'>
								Track revenue, transactions, and financial
								metrics
							</p>
						</div>
						<div className='flex gap-2'>
							<Select
								value={period}
								onValueChange={setPeriod}
							>
								<SelectTrigger className='w-[140px] bg-transparent border-secondary-foreground/20'>
									<SelectValue placeholder='Select period' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='7days'>
										Last 7 days
									</SelectItem>
									<SelectItem value='30days'>
										Last 30 days
									</SelectItem>
									<SelectItem value='90days'>
										Last 90 days
									</SelectItem>
									<SelectItem value='year'>
										This year
									</SelectItem>
								</SelectContent>
							</Select>
							<Link href='/admin/finance/transactions'>
								<Button
									variant='outline'
									className='bg-transparent border-secondary-foreground/20'
								>
									<Receipt className='mr-2 h-4 w-4' />
									Transactions
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Navigation */}
			<AdminNavigation />

			{/* Content */}
			<section className='px-4 py-8'>
				<div className='container mx-auto space-y-6'>
					{/* Tax Status Banner */}
					{settings && (
						<Card
							className={
								settings.taxEnabled
									? 'border-green-200 bg-green-50 dark:bg-green-950/20'
									: 'border-amber-200 bg-amber-50 dark:bg-amber-950/20'
							}
						>
							<CardContent className='flex items-center justify-between py-4'>
								<div className='flex items-center gap-3'>
									<Receipt
										className={
											settings.taxEnabled
												? 'h-5 w-5 text-green-600'
												: 'h-5 w-5 text-amber-600'
										}
									/>
									<div>
										<p className='font-medium'>
											{settings.taxEnabled
												? `${settings.taxName} (${settings.taxRate}%) is enabled`
												: 'Tax collection is disabled'}
										</p>
										<p className='text-sm text-muted-foreground'>
											{settings.taxEnabled
												? `Tax ID: ${
														settings.taxNumber ||
														'Not set'
												  }`
												: 'Enable tax in settings to start collecting taxes on transactions'}
										</p>
									</div>
								</div>
								<Link href='/admin/finance/settings'>
									<Button
										variant='outline'
										size='sm'
									>
										<Settings className='mr-2 h-4 w-4' />
										Configure
									</Button>
								</Link>
							</CardContent>
						</Card>
					)}

					{/* Stats Grid */}
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
									{formatCurrency(stats.totalRevenue)}
								</div>
								<div className='flex items-center text-xs text-muted-foreground'>
									{revenueGrowth > 0 ? (
										<>
											<ArrowUpRight className='mr-1 h-3 w-3 text-green-500' />
											<span className='text-green-500'>
												+{revenueGrowth}%
											</span>
										</>
									) : (
										<>
											<ArrowDownRight className='mr-1 h-3 w-3 text-red-500' />
											<span className='text-red-500'>
												{revenueGrowth}%
											</span>
										</>
									)}
									<span className='ml-1'>vs last period</span>
								</div>
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
									{formatCurrency(stats.totalTax)}
								</div>
								<p className='text-xs text-muted-foreground'>
									{settings?.taxEnabled
										? `${settings.taxRate}% ${settings.taxName}`
										: 'Tax disabled'}
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
								<CardTitle className='text-sm font-medium'>
									Transactions
								</CardTitle>
								<CreditCard className='h-4 w-4 text-muted-foreground' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold'>
									{stats.totalTransactions}
								</div>
								<div className='flex items-center gap-2 text-xs'>
									<Badge
										variant='secondary'
										className='bg-green-100 text-green-700'
									>
										{stats.paidTransactions} paid
									</Badge>
									{stats.pendingTransactions > 0 && (
										<Badge
											variant='secondary'
											className='bg-amber-100 text-amber-700'
										>
											{stats.pendingTransactions} pending
										</Badge>
									)}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
								<CardTitle className='text-sm font-medium'>
									Refunds
								</CardTitle>
								<TrendingDown className='h-4 w-4 text-muted-foreground' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold text-red-600'>
									{formatCurrency(stats.refundedAmount)}
								</div>
								<p className='text-xs text-muted-foreground'>
									{stats.failedTransactions} failed
									transactions
								</p>
							</CardContent>
						</Card>
					</div>

					{/* Revenue Charts */}
					<div className='grid gap-6 md:grid-cols-2'>
						{/* Revenue Trend */}
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<TrendingUp className='h-5 w-5' />
									Revenue Trend
								</CardTitle>
							</CardHeader>
							<CardContent>
								{revenueByPeriod.length > 0 ? (
									<div className='space-y-4'>
										{revenueByPeriod
											.slice(-7)
											.map((item, index) => (
												<div
													key={index}
													className='flex items-center justify-between'
												>
													<span className='text-sm text-muted-foreground'>
														{format(
															new Date(
																item.period
															),
															'MMM d'
														)}
													</span>
													<div className='flex items-center gap-4'>
														<div className='w-32 bg-muted rounded-full h-2'>
															<div
																className='bg-primary h-2 rounded-full'
																style={{
																	width: `${Math.min(
																		100,
																		(item.revenue /
																			Math.max(
																				...revenueByPeriod.map(
																					(
																						r
																					) =>
																						r.revenue
																				)
																			)) *
																			100
																	)}%`,
																}}
															/>
														</div>
														<span className='text-sm font-medium w-24 text-right'>
															{formatCurrency(
																item.revenue
															)}
														</span>
													</div>
												</div>
											))}
									</div>
								) : (
									<div className='flex flex-col items-center justify-center h-64 text-muted-foreground'>
										<TrendingUp className='h-12 w-12 mb-2 opacity-50' />
										<p>No revenue data available</p>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Revenue by Source */}
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<PieChart className='h-5 w-5' />
									Revenue by Source
								</CardTitle>
							</CardHeader>
							<CardContent>
								{revenueBySource.length > 0 ? (
									<div className='space-y-4'>
										{revenueBySource.map(
											(source, index) => (
												<div
													key={index}
													className='space-y-2'
												>
													<div className='flex items-center justify-between'>
														<span className='text-sm font-medium'>
															{source.source}
														</span>
														<span className='text-sm text-muted-foreground'>
															{source.percentage.toFixed(
																1
															)}
															%
														</span>
													</div>
													<div className='flex items-center gap-4'>
														<div className='flex-1 bg-muted rounded-full h-2'>
															<div
																className={`h-2 rounded-full ${
																	index === 0
																		? 'bg-blue-500'
																		: index ===
																		  1
																		? 'bg-green-500'
																		: 'bg-amber-500'
																}`}
																style={{
																	width: `${source.percentage}%`,
																}}
															/>
														</div>
														<span className='text-sm font-medium w-28 text-right'>
															{formatCurrency(
																source.revenue
															)}
														</span>
													</div>
													<div className='flex justify-between text-xs text-muted-foreground'>
														<span>
															{source.count}{' '}
															transactions
														</span>
														<span>
															Tax:{' '}
															{formatCurrency(
																source.tax
															)}
														</span>
													</div>
												</div>
											)
										)}
									</div>
								) : (
									<div className='flex flex-col items-center justify-center h-64 text-muted-foreground'>
										<PieChart className='h-12 w-12 mb-2 opacity-50' />
										<p>No source data available</p>
									</div>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Quick Actions */}
					<Card>
						<CardHeader>
							<CardTitle>Quick Actions</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='grid gap-4 sm:grid-cols-2 md:grid-cols-4'>
								<Link href='/admin/finance/transactions'>
									<Button
										variant='outline'
										className='w-full justify-start'
									>
										<Receipt className='mr-2 h-4 w-4' />
										View Transactions
									</Button>
								</Link>
								<Link href='/admin/finance/tax-report'>
									<Button
										variant='outline'
										className='w-full justify-start'
									>
										<FileText className='mr-2 h-4 w-4' />
										Tax Report
									</Button>
								</Link>
								<Button
									variant='outline'
									className='w-full justify-start'
								>
									<Download className='mr-2 h-4 w-4' />
									Export CSV
								</Button>
								<Link href='/admin/finance/settings'>
									<Button
										variant='outline'
										className='w-full justify-start'
									>
										<Settings className='mr-2 h-4 w-4' />
										Finance Settings
									</Button>
								</Link>
							</div>
						</CardContent>
					</Card>
				</div>
			</section>
		</div>
	);
}
