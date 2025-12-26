'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
	Users,
	MoreHorizontal,
	Mail,
	Building2,
	Search,
	LogIn,
	LogOut,
	Clock,
	AlertCircle,
	XCircle,
	RefreshCw,
	Copy,
	Eye,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
	getVisitors,
	getTodaysVisitors,
	checkInVisitor,
	checkOutVisitor,
	cancelVisitor,
	resendVisitorInvitation,
	type VisitorWithRelations,
} from '@/actions/visitors';

function getStatusBadge(status: string) {
	switch (status) {
		case 'PENDING':
			return (
				<Badge variant='secondary'>
					<Clock className='mr-1 h-3 w-3' />
					Pending
				</Badge>
			);
		case 'CHECKED_IN':
			return (
				<Badge
					variant='default'
					className='bg-green-600'
				>
					<LogIn className='mr-1 h-3 w-3' />
					Checked In
				</Badge>
			);
		case 'CHECKED_OUT':
			return (
				<Badge variant='outline'>
					<LogOut className='mr-1 h-3 w-3' />
					Checked Out
				</Badge>
			);
		case 'EXPIRED':
			return (
				<Badge variant='destructive'>
					<AlertCircle className='mr-1 h-3 w-3' />
					Expired
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
			return <Badge variant='secondary'>{status}</Badge>;
	}
}

export default function AdminVisitorsPage() {
	const { toast } = useToast();
	const [allVisitors, setAllVisitors] = useState<VisitorWithRelations[]>([]);
	const [todaysVisitors, setTodaysVisitors] = useState<
		VisitorWithRelations[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedVisitor, setSelectedVisitor] =
		useState<VisitorWithRelations | null>(null);
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [activeTab, setActiveTab] = useState('today');

	const fetchVisitors = async () => {
		setLoading(true);
		const [allResult, todayResult] = await Promise.all([
			getVisitors({ limit: 100 }),
			getTodaysVisitors(),
		]);

		if (allResult.success && allResult.data) {
			setAllVisitors(allResult.data as VisitorWithRelations[]);
		}
		if (todayResult.success && todayResult.data) {
			setTodaysVisitors(todayResult.data as VisitorWithRelations[]);
		}
		setLoading(false);
	};

	useEffect(() => {
		fetchVisitors();
	}, []);

	const handleCheckIn = async (id: string) => {
		const result = await checkInVisitor(id);
		if (result.success) {
			toast({
				title: 'Checked in',
				description: 'Visitor has been checked in',
			});
			fetchVisitors();
		} else {
			toast({
				title: 'Error',
				description: result.message,
				variant: 'destructive',
			});
		}
	};

	const handleCheckOut = async (id: string) => {
		const result = await checkOutVisitor(id);
		if (result.success) {
			toast({
				title: 'Checked out',
				description: 'Visitor has been checked out',
			});
			fetchVisitors();
		} else {
			toast({
				title: 'Error',
				description: result.message,
				variant: 'destructive',
			});
		}
	};

	const handleCancel = async (id: string) => {
		const result = await cancelVisitor(id);
		if (result.success) {
			toast({
				title: 'Cancelled',
				description: 'Visitor pass has been cancelled',
			});
			fetchVisitors();
		} else {
			toast({
				title: 'Error',
				description: result.message,
				variant: 'destructive',
			});
		}
	};

	const handleResendInvitation = async (id: string) => {
		const result = await resendVisitorInvitation(id);
		if (result.success) {
			toast({
				title: 'Sent',
				description: 'Invitation email sent',
			});
		} else {
			toast({
				title: 'Error',
				description: result.message,
				variant: 'destructive',
			});
		}
	};

	const copyAccessCode = (code: string) => {
		navigator.clipboard.writeText(code);
		toast({
			title: 'Copied',
			description: 'Access code copied to clipboard',
		});
	};

	const filterVisitors = (visitors: VisitorWithRelations[]) => {
		if (!searchQuery) return visitors;
		const query = searchQuery.toLowerCase();
		return visitors.filter(
			(v) =>
				v.name.toLowerCase().includes(query) ||
				v.accessCode.toLowerCase().includes(query) ||
				v.email?.toLowerCase().includes(query) ||
				v.company?.toLowerCase().includes(query) ||
				v.host.name?.toLowerCase().includes(query)
		);
	};

	const pendingCount = todaysVisitors.filter(
		(v) => v.status === 'PENDING'
	).length;
	const checkedInCount = todaysVisitors.filter(
		(v) => v.status === 'CHECKED_IN'
	).length;
	const checkedOutCount = todaysVisitors.filter(
		(v) => v.status === 'CHECKED_OUT'
	).length;

	const renderVisitorRow = (visitor: VisitorWithRelations) => (
		<TableRow key={visitor.id}>
			<TableCell>
				<div>
					<p className='font-medium'>{visitor.name}</p>
					{visitor.company && (
						<p className='text-sm text-muted-foreground flex items-center gap-1'>
							<Building2 className='h-3 w-3' />
							{visitor.company}
						</p>
					)}
				</div>
			</TableCell>
			<TableCell>
				<div className='flex items-center gap-2'>
					<code className='text-xs bg-muted px-2 py-1 rounded'>
						{visitor.accessCode}
					</code>
					<Button
						variant='ghost'
						size='icon'
						className='h-6 w-6'
						onClick={() => copyAccessCode(visitor.accessCode)}
					>
						<Copy className='h-3 w-3' />
					</Button>
				</div>
			</TableCell>
			<TableCell>
				<div>
					<p className='font-medium'>{visitor.host.name}</p>
					<p className='text-sm text-muted-foreground'>
						{visitor.host.email}
					</p>
				</div>
			</TableCell>
			<TableCell className='max-w-[200px] truncate'>
				{visitor.purpose}
			</TableCell>
			<TableCell>
				<div className='text-sm'>
					<p>{format(new Date(visitor.validFrom), 'MMM d')}</p>
					<p className='text-muted-foreground'>
						to {format(new Date(visitor.validUntil), 'MMM d')}
					</p>
				</div>
			</TableCell>
			<TableCell>{getStatusBadge(visitor.status)}</TableCell>
			<TableCell>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant='ghost'
							size='icon'
						>
							<MoreHorizontal className='h-4 w-4' />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align='end'>
						<DropdownMenuItem
							onClick={() => {
								setSelectedVisitor(visitor);
								setDetailsOpen(true);
							}}
						>
							<Eye className='mr-2 h-4 w-4' />
							View Details
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => copyAccessCode(visitor.accessCode)}
						>
							<Copy className='mr-2 h-4 w-4' />
							Copy Access Code
						</DropdownMenuItem>
						{visitor.email && visitor.status === 'PENDING' && (
							<DropdownMenuItem
								onClick={() =>
									handleResendInvitation(visitor.id)
								}
							>
								<Mail className='mr-2 h-4 w-4' />
								Resend Invitation
							</DropdownMenuItem>
						)}
						<DropdownMenuSeparator />
						{visitor.status === 'PENDING' && (
							<DropdownMenuItem
								onClick={() => handleCheckIn(visitor.id)}
							>
								<LogIn className='mr-2 h-4 w-4 text-green-600' />
								<span className='text-green-600'>Check In</span>
							</DropdownMenuItem>
						)}
						{visitor.status === 'CHECKED_IN' && (
							<DropdownMenuItem
								onClick={() => handleCheckOut(visitor.id)}
							>
								<LogOut className='mr-2 h-4 w-4' />
								Check Out
							</DropdownMenuItem>
						)}
						{(visitor.status === 'PENDING' ||
							visitor.status === 'CHECKED_IN') && (
							<DropdownMenuItem
								onClick={() => handleCancel(visitor.id)}
								className='text-destructive'
							>
								<XCircle className='mr-2 h-4 w-4' />
								Cancel Pass
							</DropdownMenuItem>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</TableCell>
		</TableRow>
	);

	if (loading) {
		return (
			<div className='p-6 space-y-6'>
				<Skeleton className='h-8 w-48' />
				<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
					<Skeleton className='h-24' />
					<Skeleton className='h-24' />
					<Skeleton className='h-24' />
					<Skeleton className='h-24' />
				</div>
				<Skeleton className='h-96' />
			</div>
		);
	}

	return (
		<div className='p-6 space-y-6'>
			{/* Header */}
			<div>
				<h1 className='text-2xl font-bold flex items-center gap-2'>
					<Users className='h-6 w-6' />
					Visitor Management
				</h1>
				<p className='text-muted-foreground'>
					Manage visitor check-ins and passes
				</p>
			</div>

			{/* Today's Stats */}
			<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
				<Card>
					<CardHeader className='pb-2'>
						<CardTitle className='text-sm font-medium text-muted-foreground'>
							Today&apos;s Visitors
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{todaysVisitors.length}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='pb-2'>
						<CardTitle className='text-sm font-medium text-muted-foreground'>
							Pending Check-in
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-yellow-600'>
							{pendingCount}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='pb-2'>
						<CardTitle className='text-sm font-medium text-muted-foreground'>
							Currently Checked In
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-green-600'>
							{checkedInCount}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='pb-2'>
						<CardTitle className='text-sm font-medium text-muted-foreground'>
							Checked Out
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{checkedOutCount}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Search */}
			<div className='flex items-center gap-4'>
				<div className='relative flex-1 max-w-md'>
					<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
					<Input
						placeholder='Search by name, code, company, or host...'
						className='pl-9'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
				<Button
					variant='outline'
					onClick={fetchVisitors}
				>
					<RefreshCw className='mr-2 h-4 w-4' />
					Refresh
				</Button>
			</div>

			{/* Tabs */}
			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
			>
				<TabsList>
					<TabsTrigger value='today'>
						Today ({todaysVisitors.length})
					</TabsTrigger>
					<TabsTrigger value='all'>
						All Visitors ({allVisitors.length})
					</TabsTrigger>
				</TabsList>

				<TabsContent
					value='today'
					className='mt-4'
				>
					<Card>
						<CardHeader>
							<CardTitle>Today&apos;s Visitors</CardTitle>
							<CardDescription>
								{format(new Date(), 'EEEE, MMMM d, yyyy')}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{filterVisitors(todaysVisitors).length === 0 ? (
								<div className='text-center py-12'>
									<Users className='mx-auto h-12 w-12 text-muted-foreground/50' />
									<h3 className='mt-4 text-lg font-semibold'>
										No visitors today
									</h3>
									<p className='text-muted-foreground'>
										No visitors have been registered for
										today
									</p>
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Visitor</TableHead>
											<TableHead>Access Code</TableHead>
											<TableHead>Host</TableHead>
											<TableHead>Purpose</TableHead>
											<TableHead>Valid Period</TableHead>
											<TableHead>Status</TableHead>
											<TableHead className='w-[50px]'></TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filterVisitors(todaysVisitors).map(
											renderVisitorRow
										)}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent
					value='all'
					className='mt-4'
				>
					<Card>
						<CardHeader>
							<CardTitle>All Visitors</CardTitle>
							<CardDescription>
								Complete visitor history
							</CardDescription>
						</CardHeader>
						<CardContent>
							{filterVisitors(allVisitors).length === 0 ? (
								<div className='text-center py-12'>
									<Users className='mx-auto h-12 w-12 text-muted-foreground/50' />
									<h3 className='mt-4 text-lg font-semibold'>
										No visitors found
									</h3>
									<p className='text-muted-foreground'>
										{searchQuery
											? 'No visitors match your search'
											: 'No visitors have been registered yet'}
									</p>
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Visitor</TableHead>
											<TableHead>Access Code</TableHead>
											<TableHead>Host</TableHead>
											<TableHead>Purpose</TableHead>
											<TableHead>Valid Period</TableHead>
											<TableHead>Status</TableHead>
											<TableHead className='w-[50px]'></TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filterVisitors(allVisitors).map(
											renderVisitorRow
										)}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Visitor Details Dialog */}
			<Dialog
				open={detailsOpen}
				onOpenChange={setDetailsOpen}
			>
				<DialogContent className='max-w-lg'>
					<DialogHeader>
						<DialogTitle>Visitor Details</DialogTitle>
						<DialogDescription>
							Full information about this visitor
						</DialogDescription>
					</DialogHeader>
					{selectedVisitor && (
						<div className='space-y-6'>
							{/* QR Code */}
							<div className='flex justify-center'>
								<div className='p-4 bg-white rounded-lg border'>
									<QRCodeSVG
										value={selectedVisitor.accessCode}
										size={150}
										level='H'
									/>
								</div>
							</div>

							<div className='text-center'>
								<code className='text-lg font-mono font-bold'>
									{selectedVisitor.accessCode}
								</code>
								<Button
									variant='ghost'
									size='sm'
									onClick={() =>
										copyAccessCode(
											selectedVisitor.accessCode
										)
									}
								>
									<Copy className='h-4 w-4' />
								</Button>
							</div>

							<Separator />

							{/* Visitor Info */}
							<div className='space-y-3'>
								<h4 className='font-semibold'>
									Visitor Information
								</h4>
								<div className='grid grid-cols-2 gap-4 text-sm'>
									<div>
										<p className='text-muted-foreground'>
											Name
										</p>
										<p className='font-medium'>
											{selectedVisitor.name}
										</p>
									</div>
									{selectedVisitor.email && (
										<div>
											<p className='text-muted-foreground'>
												Email
											</p>
											<p className='font-medium'>
												{selectedVisitor.email}
											</p>
										</div>
									)}
									{selectedVisitor.phone && (
										<div>
											<p className='text-muted-foreground'>
												Phone
											</p>
											<p className='font-medium'>
												{selectedVisitor.phone}
											</p>
										</div>
									)}
									{selectedVisitor.company && (
										<div>
											<p className='text-muted-foreground'>
												Company
											</p>
											<p className='font-medium'>
												{selectedVisitor.company}
											</p>
										</div>
									)}
								</div>
							</div>

							<Separator />

							{/* Visit Info */}
							<div className='space-y-3'>
								<h4 className='font-semibold'>
									Visit Information
								</h4>
								<div className='text-sm space-y-2'>
									<div>
										<p className='text-muted-foreground'>
											Purpose
										</p>
										<p className='font-medium'>
											{selectedVisitor.purpose}
										</p>
									</div>
									<div className='grid grid-cols-2 gap-4'>
										<div>
											<p className='text-muted-foreground'>
												Valid From
											</p>
											<p className='font-medium'>
												{format(
													new Date(
														selectedVisitor.validFrom
													),
													'PPP'
												)}
											</p>
										</div>
										<div>
											<p className='text-muted-foreground'>
												Valid Until
											</p>
											<p className='font-medium'>
												{format(
													new Date(
														selectedVisitor.validUntil
													),
													'PPP'
												)}
											</p>
										</div>
									</div>
									<div className='flex items-center gap-2'>
										<p className='text-muted-foreground'>
											Status:
										</p>
										{getStatusBadge(selectedVisitor.status)}
									</div>
								</div>
							</div>

							<Separator />

							{/* Host Info */}
							<div className='space-y-3'>
								<h4 className='font-semibold'>Host</h4>
								<div className='text-sm'>
									<p className='font-medium'>
										{selectedVisitor.host.name}
									</p>
									<p className='text-muted-foreground'>
										{selectedVisitor.host.email}
									</p>
								</div>
							</div>

							{/* Check-in/out times */}
							{(selectedVisitor.checkInTime ||
								selectedVisitor.checkOutTime) && (
								<>
									<Separator />
									<div className='space-y-3'>
										<h4 className='font-semibold'>
											Activity
										</h4>
										<div className='grid grid-cols-2 gap-4 text-sm'>
											{selectedVisitor.checkInTime && (
												<div>
													<p className='text-muted-foreground'>
														Check-in
													</p>
													<p className='font-medium'>
														{format(
															new Date(
																selectedVisitor.checkInTime
															),
															'PPpp'
														)}
													</p>
												</div>
											)}
											{selectedVisitor.checkOutTime && (
												<div>
													<p className='text-muted-foreground'>
														Check-out
													</p>
													<p className='font-medium'>
														{format(
															new Date(
																selectedVisitor.checkOutTime
															),
															'PPpp'
														)}
													</p>
												</div>
											)}
										</div>
									</div>
								</>
							)}

							{/* Actions */}
							<div className='flex gap-2 justify-end pt-4'>
								{selectedVisitor.status === 'PENDING' && (
									<Button
										onClick={() => {
											handleCheckIn(selectedVisitor.id);
											setDetailsOpen(false);
										}}
									>
										<LogIn className='mr-2 h-4 w-4' />
										Check In
									</Button>
								)}
								{selectedVisitor.status === 'CHECKED_IN' && (
									<Button
										variant='outline'
										onClick={() => {
											handleCheckOut(selectedVisitor.id);
											setDetailsOpen(false);
										}}
									>
										<LogOut className='mr-2 h-4 w-4' />
										Check Out
									</Button>
								)}
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
