'use client';

import { useEffect, useState, useCallback } from 'react';
import { format, isToday, isTomorrow } from 'date-fns';
import {
	CalendarDays,
	Clock,
	Users,
	TrendingUp,
	Check,
	X,
	Calendar,
	Send,
	Eye,
	MoreHorizontal,
	Search,
	Loader2,
	Building2,
	Mail,
	Phone,
	RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
	getTours,
	getTourStats,
	confirmTour,
	rescheduleTour,
	completeTour,
	cancelTour,
	markTourNoShow,
	sendTourReminder,
} from '@/actions/tours';

type TourStatus =
	| 'PENDING'
	| 'CONFIRMED'
	| 'COMPLETED'
	| 'CANCELLED'
	| 'NO_SHOW';

// Tour type definition
interface Tour {
	id: string;
	name: string;
	email: string;
	phone: string | null;
	company: string | null;
	preferredDate: Date;
	confirmedDate: Date | null;
	duration: number;
	interestedIn: string | null;
	groupSize: number;
	budget: string | null;
	source: string | null;
	message: string | null;
	status: TourStatus;
	confirmedBy: string | null;
	conductedBy: string | null;
	feedback: string | null;
	converted: boolean;
	convertedToMembershipId: string | null;
	reminderSent: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const statusConfig: Record<
	TourStatus,
	{
		label: string;
		variant: 'default' | 'secondary' | 'destructive' | 'outline';
	}
> = {
	PENDING: { label: 'Pending', variant: 'outline' },
	CONFIRMED: { label: 'Confirmed', variant: 'default' },
	COMPLETED: { label: 'Completed', variant: 'secondary' },
	CANCELLED: { label: 'Cancelled', variant: 'destructive' },
	NO_SHOW: { label: 'No Show', variant: 'destructive' },
};

const timeSlots = [
	'09:00',
	'09:30',
	'10:00',
	'10:30',
	'11:00',
	'11:30',
	'12:00',
	'12:30',
	'13:00',
	'13:30',
	'14:00',
	'14:30',
	'15:00',
	'15:30',
	'16:00',
	'16:30',
];

export default function AdminToursPage() {
	const [tours, setTours] = useState<Tour[]>([]);
	const [stats, setStats] = useState({
		total: 0,
		pending: 0,
		confirmed: 0,
		completed: 0,
		cancelled: 0,
		noShow: 0,
		converted: 0,
		conversionRate: 0,
		todayCount: 0,
		thisWeekCount: 0,
		thisMonthCount: 0,
	});
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState<TourStatus | 'ALL'>('ALL');
	const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
	const [showDetailsDialog, setShowDetailsDialog] = useState(false);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
	const [showCompleteDialog, setShowCompleteDialog] = useState(false);
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [confirmDate, setConfirmDate] = useState<Date | undefined>();
	const [confirmTime, setConfirmTime] = useState('');
	const [feedback, setFeedback] = useState('');
	const [cancelReason, setCancelReason] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const fetchData = useCallback(async () => {
		setIsLoading(true);
		try {
			const [toursResult, statsResult] = await Promise.all([
				getTours({
					status: statusFilter !== 'ALL' ? statusFilter : undefined,
				}),
				getTourStats(),
			]);

			if (toursResult.success && toursResult.data) {
				// Ensure data is an array
				const tourData = Array.isArray(toursResult.data)
					? toursResult.data
					: [toursResult.data];
				setTours(tourData as Tour[]);
			}
			if (statsResult.success && statsResult.data) {
				setStats(statsResult.data);
			}
		} catch {
			toast.error('Failed to load tours');
		} finally {
			setIsLoading(false);
		}
	}, [statusFilter]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const filteredTours = tours.filter((tour) => {
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			return (
				tour.name.toLowerCase().includes(query) ||
				tour.email.toLowerCase().includes(query) ||
				(tour.company?.toLowerCase().includes(query) ?? false)
			);
		}
		return true;
	});

	const handleConfirmTour = async () => {
		if (!selectedTour || !confirmDate || !confirmTime) return;

		setIsSubmitting(true);
		try {
			const [hours, minutes] = confirmTime.split(':').map(Number);
			const confirmedDate = new Date(confirmDate);
			confirmedDate.setHours(hours, minutes, 0, 0);

			const result = await confirmTour(selectedTour.id, confirmedDate);
			if (result.success) {
				toast.success('Tour confirmed successfully');
				setShowConfirmDialog(false);
				fetchData();
			} else {
				toast.error(result.message);
			}
		} catch {
			toast.error('Failed to confirm tour');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleRescheduleTour = async () => {
		if (!selectedTour || !confirmDate || !confirmTime) return;

		setIsSubmitting(true);
		try {
			const [hours, minutes] = confirmTime.split(':').map(Number);
			const newDate = new Date(confirmDate);
			newDate.setHours(hours, minutes, 0, 0);

			const result = await rescheduleTour(selectedTour.id, newDate);
			if (result.success) {
				toast.success('Tour rescheduled successfully');
				setShowRescheduleDialog(false);
				fetchData();
			} else {
				toast.error(result.message);
			}
		} catch {
			toast.error('Failed to reschedule tour');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCompleteTour = async () => {
		if (!selectedTour) return;

		setIsSubmitting(true);
		try {
			const result = await completeTour(
				selectedTour.id,
				undefined,
				feedback || undefined
			);
			if (result.success) {
				toast.success('Tour marked as completed');
				setShowCompleteDialog(false);
				setFeedback('');
				fetchData();
			} else {
				toast.error(result.message);
			}
		} catch {
			toast.error('Failed to complete tour');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancelTour = async () => {
		if (!selectedTour) return;

		setIsSubmitting(true);
		try {
			const result = await cancelTour(
				selectedTour.id,
				cancelReason || undefined
			);
			if (result.success) {
				toast.success('Tour cancelled');
				setShowCancelDialog(false);
				setCancelReason('');
				fetchData();
			} else {
				toast.error(result.message);
			}
		} catch {
			toast.error('Failed to cancel tour');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleMarkNoShow = async (tour: Tour) => {
		try {
			const result = await markTourNoShow(tour.id);
			if (result.success) {
				toast.success('Tour marked as no-show');
				fetchData();
			} else {
				toast.error(result.message);
			}
		} catch {
			toast.error('Failed to mark as no-show');
		}
	};

	const handleSendReminder = async (tour: Tour) => {
		try {
			const result = await sendTourReminder(tour.id);
			if (result.success) {
				toast.success('Reminder sent successfully');
				fetchData();
			} else {
				toast.error(result.message);
			}
		} catch {
			toast.error('Failed to send reminder');
		}
	};

	const getDateDisplay = (date: Date) => {
		if (isToday(date)) return 'Today';
		if (isTomorrow(date)) return 'Tomorrow';
		return format(date, 'MMM d, yyyy');
	};

	return (
		<div className='p-6 space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold'>Tour Requests</h1>
					<p className='text-muted-foreground'>
						Manage workspace tour appointments
					</p>
				</div>
				<Button
					onClick={fetchData}
					variant='outline'
					size='sm'
				>
					<RefreshCw className='h-4 w-4 mr-2' />
					Refresh
				</Button>
			</div>

			{/* Stats */}
			<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardTitle className='text-sm font-medium'>
							Pending
						</CardTitle>
						<Clock className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{stats.pending}
						</div>
						<p className='text-xs text-muted-foreground'>
							Awaiting confirmation
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardTitle className='text-sm font-medium'>
							Confirmed
						</CardTitle>
						<CalendarDays className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{stats.confirmed}
						</div>
						<p className='text-xs text-muted-foreground'>
							Upcoming tours
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardTitle className='text-sm font-medium'>
							Today&apos;s Tours
						</CardTitle>
						<Users className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{stats.todayCount}
						</div>
						<p className='text-xs text-muted-foreground'>
							Scheduled today
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardTitle className='text-sm font-medium'>
							Conversion Rate
						</CardTitle>
						<TrendingUp className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{stats.conversionRate.toFixed(1)}%
						</div>
						<p className='text-xs text-muted-foreground'>
							Tours to memberships
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardHeader>
					<CardTitle>Tour Requests</CardTitle>
					<CardDescription>
						View and manage all tour requests
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Tabs
						defaultValue='all'
						className='w-full'
					>
						<div className='flex flex-col sm:flex-row gap-4 mb-4'>
							<TabsList>
								<TabsTrigger
									value='all'
									onClick={() => setStatusFilter('ALL')}
								>
									All
								</TabsTrigger>
								<TabsTrigger
									value='pending'
									onClick={() => setStatusFilter('PENDING')}
								>
									Pending
								</TabsTrigger>
								<TabsTrigger
									value='confirmed'
									onClick={() => setStatusFilter('CONFIRMED')}
								>
									Confirmed
								</TabsTrigger>
								<TabsTrigger
									value='completed'
									onClick={() => setStatusFilter('COMPLETED')}
								>
									Completed
								</TabsTrigger>
							</TabsList>
							<div className='flex-1 flex items-center gap-2'>
								<div className='relative flex-1 max-w-sm'>
									<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
									<Input
										placeholder='Search by name, email, or company...'
										value={searchQuery}
										onChange={(e) =>
											setSearchQuery(e.target.value)
										}
										className='pl-9'
									/>
								</div>
							</div>
						</div>

						<TabsContent
							value='all'
							className='mt-0'
						>
							<TourTable
								tours={filteredTours}
								isLoading={isLoading}
								onView={(tour) => {
									setSelectedTour(tour);
									setShowDetailsDialog(true);
								}}
								onConfirm={(tour) => {
									setSelectedTour(tour);
									setConfirmDate(tour.preferredDate);
									setShowConfirmDialog(true);
								}}
								onReschedule={(tour) => {
									setSelectedTour(tour);
									setConfirmDate(
										tour.confirmedDate || tour.preferredDate
									);
									setShowRescheduleDialog(true);
								}}
								onComplete={(tour) => {
									setSelectedTour(tour);
									setShowCompleteDialog(true);
								}}
								onCancel={(tour) => {
									setSelectedTour(tour);
									setShowCancelDialog(true);
								}}
								onNoShow={handleMarkNoShow}
								onSendReminder={handleSendReminder}
								getDateDisplay={getDateDisplay}
							/>
						</TabsContent>
						<TabsContent
							value='pending'
							className='mt-0'
						>
							<TourTable
								tours={filteredTours}
								isLoading={isLoading}
								onView={(tour) => {
									setSelectedTour(tour);
									setShowDetailsDialog(true);
								}}
								onConfirm={(tour) => {
									setSelectedTour(tour);
									setConfirmDate(tour.preferredDate);
									setShowConfirmDialog(true);
								}}
								onReschedule={(tour) => {
									setSelectedTour(tour);
									setConfirmDate(
										tour.confirmedDate || tour.preferredDate
									);
									setShowRescheduleDialog(true);
								}}
								onComplete={(tour) => {
									setSelectedTour(tour);
									setShowCompleteDialog(true);
								}}
								onCancel={(tour) => {
									setSelectedTour(tour);
									setShowCancelDialog(true);
								}}
								onNoShow={handleMarkNoShow}
								onSendReminder={handleSendReminder}
								getDateDisplay={getDateDisplay}
							/>
						</TabsContent>
						<TabsContent
							value='confirmed'
							className='mt-0'
						>
							<TourTable
								tours={filteredTours}
								isLoading={isLoading}
								onView={(tour) => {
									setSelectedTour(tour);
									setShowDetailsDialog(true);
								}}
								onConfirm={(tour) => {
									setSelectedTour(tour);
									setConfirmDate(tour.preferredDate);
									setShowConfirmDialog(true);
								}}
								onReschedule={(tour) => {
									setSelectedTour(tour);
									setConfirmDate(
										tour.confirmedDate || tour.preferredDate
									);
									setShowRescheduleDialog(true);
								}}
								onComplete={(tour) => {
									setSelectedTour(tour);
									setShowCompleteDialog(true);
								}}
								onCancel={(tour) => {
									setSelectedTour(tour);
									setShowCancelDialog(true);
								}}
								onNoShow={handleMarkNoShow}
								onSendReminder={handleSendReminder}
								getDateDisplay={getDateDisplay}
							/>
						</TabsContent>
						<TabsContent
							value='completed'
							className='mt-0'
						>
							<TourTable
								tours={filteredTours}
								isLoading={isLoading}
								onView={(tour) => {
									setSelectedTour(tour);
									setShowDetailsDialog(true);
								}}
								onConfirm={(tour) => {
									setSelectedTour(tour);
									setConfirmDate(tour.preferredDate);
									setShowConfirmDialog(true);
								}}
								onReschedule={(tour) => {
									setSelectedTour(tour);
									setConfirmDate(
										tour.confirmedDate || tour.preferredDate
									);
									setShowRescheduleDialog(true);
								}}
								onComplete={(tour) => {
									setSelectedTour(tour);
									setShowCompleteDialog(true);
								}}
								onCancel={(tour) => {
									setSelectedTour(tour);
									setShowCancelDialog(true);
								}}
								onNoShow={handleMarkNoShow}
								onSendReminder={handleSendReminder}
								getDateDisplay={getDateDisplay}
							/>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>

			{/* View Details Dialog */}
			<Dialog
				open={showDetailsDialog}
				onOpenChange={setShowDetailsDialog}
			>
				<DialogContent className='max-w-lg'>
					<DialogHeader>
						<DialogTitle>Tour Request Details</DialogTitle>
						<DialogDescription>
							Submitted on{' '}
							{selectedTour &&
								format(selectedTour.createdAt, 'PPP')}
						</DialogDescription>
					</DialogHeader>
					{selectedTour && (
						<div className='space-y-4'>
							<div className='flex items-center justify-between'>
								<span className='font-semibold text-lg'>
									{selectedTour.name}
								</span>
								<Badge
									variant={
										statusConfig[
											selectedTour.status as TourStatus
										].variant
									}
								>
									{
										statusConfig[
											selectedTour.status as TourStatus
										].label
									}
								</Badge>
							</div>

							<div className='grid grid-cols-2 gap-4 text-sm'>
								<div className='flex items-center gap-2'>
									<Mail className='h-4 w-4 text-muted-foreground' />
									<span>{selectedTour.email}</span>
								</div>
								{selectedTour.phone && (
									<div className='flex items-center gap-2'>
										<Phone className='h-4 w-4 text-muted-foreground' />
										<span>{selectedTour.phone}</span>
									</div>
								)}
								{selectedTour.company && (
									<div className='flex items-center gap-2'>
										<Building2 className='h-4 w-4 text-muted-foreground' />
										<span>{selectedTour.company}</span>
									</div>
								)}
								<div className='flex items-center gap-2'>
									<Users className='h-4 w-4 text-muted-foreground' />
									<span>
										{selectedTour.groupSize} person(s)
									</span>
								</div>
							</div>

							<div className='border-t pt-4 space-y-2'>
								<div className='flex justify-between'>
									<span className='text-muted-foreground'>
										Preferred Date:
									</span>
									<span>
										{format(
											selectedTour.preferredDate,
											'PPP p'
										)}
									</span>
								</div>
								{selectedTour.confirmedDate && (
									<div className='flex justify-between'>
										<span className='text-muted-foreground'>
											Confirmed Date:
										</span>
										<span className='font-medium text-green-600'>
											{format(
												selectedTour.confirmedDate,
												'PPP p'
											)}
										</span>
									</div>
								)}
								{selectedTour.interestedIn && (
									<div className='flex justify-between'>
										<span className='text-muted-foreground'>
											Interested In:
										</span>
										<span>{selectedTour.interestedIn}</span>
									</div>
								)}
								{selectedTour.budget && (
									<div className='flex justify-between'>
										<span className='text-muted-foreground'>
											Budget:
										</span>
										<span>{selectedTour.budget}</span>
									</div>
								)}
								{selectedTour.source && (
									<div className='flex justify-between'>
										<span className='text-muted-foreground'>
											Source:
										</span>
										<span>{selectedTour.source}</span>
									</div>
								)}
							</div>

							{selectedTour.message && (
								<div className='border-t pt-4'>
									<span className='text-muted-foreground text-sm'>
										Message:
									</span>
									<p className='mt-1 text-sm'>
										{selectedTour.message}
									</p>
								</div>
							)}

							{selectedTour.feedback && (
								<div className='border-t pt-4'>
									<span className='text-muted-foreground text-sm'>
										Feedback:
									</span>
									<p className='mt-1 text-sm'>
										{selectedTour.feedback}
									</p>
								</div>
							)}
						</div>
					)}
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setShowDetailsDialog(false)}
						>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Confirm Tour Dialog */}
			<Dialog
				open={showConfirmDialog}
				onOpenChange={setShowConfirmDialog}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirm Tour</DialogTitle>
						<DialogDescription>
							Set the confirmed date and time for this tour
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4'>
						<div className='space-y-2'>
							<Label>Date</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant='outline'
										className={cn(
											'w-full justify-start text-left font-normal',
											!confirmDate &&
												'text-muted-foreground'
										)}
									>
										<Calendar className='mr-2 h-4 w-4' />
										{confirmDate
											? format(confirmDate, 'PPP')
											: 'Pick a date'}
									</Button>
								</PopoverTrigger>
								<PopoverContent className='w-auto p-0'>
									<CalendarComponent
										mode='single'
										selected={confirmDate}
										onSelect={setConfirmDate}
										disabled={(date) =>
											date < new Date() ||
											date.getDay() === 0 ||
											date.getDay() === 6
										}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
						</div>
						<div className='space-y-2'>
							<Label>Time</Label>
							<Select
								value={confirmTime}
								onValueChange={setConfirmTime}
							>
								<SelectTrigger>
									<SelectValue placeholder='Select time' />
								</SelectTrigger>
								<SelectContent>
									{timeSlots.map((slot) => (
										<SelectItem
											key={slot}
											value={slot}
										>
											{slot}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setShowConfirmDialog(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleConfirmTour}
							disabled={
								isSubmitting || !confirmDate || !confirmTime
							}
						>
							{isSubmitting && (
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
							)}
							Confirm Tour
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Reschedule Dialog */}
			<Dialog
				open={showRescheduleDialog}
				onOpenChange={setShowRescheduleDialog}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reschedule Tour</DialogTitle>
						<DialogDescription>
							Select a new date and time for this tour
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4'>
						<div className='space-y-2'>
							<Label>New Date</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant='outline'
										className={cn(
											'w-full justify-start text-left font-normal',
											!confirmDate &&
												'text-muted-foreground'
										)}
									>
										<Calendar className='mr-2 h-4 w-4' />
										{confirmDate
											? format(confirmDate, 'PPP')
											: 'Pick a date'}
									</Button>
								</PopoverTrigger>
								<PopoverContent className='w-auto p-0'>
									<CalendarComponent
										mode='single'
										selected={confirmDate}
										onSelect={setConfirmDate}
										disabled={(date) =>
											date < new Date() ||
											date.getDay() === 0 ||
											date.getDay() === 6
										}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
						</div>
						<div className='space-y-2'>
							<Label>New Time</Label>
							<Select
								value={confirmTime}
								onValueChange={setConfirmTime}
							>
								<SelectTrigger>
									<SelectValue placeholder='Select time' />
								</SelectTrigger>
								<SelectContent>
									{timeSlots.map((slot) => (
										<SelectItem
											key={slot}
											value={slot}
										>
											{slot}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setShowRescheduleDialog(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleRescheduleTour}
							disabled={
								isSubmitting || !confirmDate || !confirmTime
							}
						>
							{isSubmitting && (
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
							)}
							Reschedule
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Complete Tour Dialog */}
			<Dialog
				open={showCompleteDialog}
				onOpenChange={setShowCompleteDialog}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Complete Tour</DialogTitle>
						<DialogDescription>
							Mark this tour as completed and add any feedback
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4'>
						<div className='space-y-2'>
							<Label>Feedback (optional)</Label>
							<Textarea
								placeholder='How did the tour go? Any notes about the prospect?'
								value={feedback}
								onChange={(e) => setFeedback(e.target.value)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setShowCompleteDialog(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleCompleteTour}
							disabled={isSubmitting}
						>
							{isSubmitting && (
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
							)}
							Mark Complete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Cancel Tour Dialog */}
			<Dialog
				open={showCancelDialog}
				onOpenChange={setShowCancelDialog}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Cancel Tour</DialogTitle>
						<DialogDescription>
							Are you sure you want to cancel this tour request?
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4'>
						<div className='space-y-2'>
							<Label>Reason (optional)</Label>
							<Textarea
								placeholder='Why is this tour being cancelled?'
								value={cancelReason}
								onChange={(e) =>
									setCancelReason(e.target.value)
								}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setShowCancelDialog(false)}
						>
							Keep Tour
						</Button>
						<Button
							variant='destructive'
							onClick={handleCancelTour}
							disabled={isSubmitting}
						>
							{isSubmitting && (
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
							)}
							Cancel Tour
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// Tour Table Component
function TourTable({
	tours,
	isLoading,
	onView,
	onConfirm,
	onReschedule,
	onComplete,
	onCancel,
	onNoShow,
	onSendReminder,
	getDateDisplay,
}: {
	tours: Tour[];
	isLoading: boolean;
	onView: (tour: Tour) => void;
	onConfirm: (tour: Tour) => void;
	onReschedule: (tour: Tour) => void;
	onComplete: (tour: Tour) => void;
	onCancel: (tour: Tour) => void;
	onNoShow: (tour: Tour) => void;
	onSendReminder: (tour: Tour) => void;
	getDateDisplay: (date: Date) => string;
}) {
	if (isLoading) {
		return (
			<div className='flex items-center justify-center py-10'>
				<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
			</div>
		);
	}

	if (tours.length === 0) {
		return (
			<div className='flex flex-col items-center justify-center py-10 text-muted-foreground'>
				<CalendarDays className='h-12 w-12 mb-4' />
				<p>No tour requests found</p>
			</div>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Contact</TableHead>
					<TableHead>Preferred Date</TableHead>
					<TableHead>Group Size</TableHead>
					<TableHead>Status</TableHead>
					<TableHead className='text-right'>Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{tours.map((tour) => (
					<TableRow key={tour.id}>
						<TableCell>
							<div>
								<p className='font-medium'>{tour.name}</p>
								{tour.company && (
									<p className='text-sm text-muted-foreground'>
										{tour.company}
									</p>
								)}
							</div>
						</TableCell>
						<TableCell>
							<div className='text-sm'>
								<p>{tour.email}</p>
								{tour.phone && (
									<p className='text-muted-foreground'>
										{tour.phone}
									</p>
								)}
							</div>
						</TableCell>
						<TableCell>
							<div>
								<p className='font-medium'>
									{getDateDisplay(
										tour.confirmedDate || tour.preferredDate
									)}
								</p>
								<p className='text-sm text-muted-foreground'>
									{format(
										tour.confirmedDate ||
											tour.preferredDate,
										'p'
									)}
								</p>
							</div>
						</TableCell>
						<TableCell>{tour.groupSize}</TableCell>
						<TableCell>
							<Badge
								variant={
									statusConfig[tour.status as TourStatus]
										.variant
								}
							>
								{statusConfig[tour.status as TourStatus].label}
							</Badge>
						</TableCell>
						<TableCell className='text-right'>
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
									<DropdownMenuLabel>
										Actions
									</DropdownMenuLabel>
									<DropdownMenuItem
										onClick={() => onView(tour)}
									>
										<Eye className='mr-2 h-4 w-4' />
										View Details
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									{tour.status === 'PENDING' && (
										<DropdownMenuItem
											onClick={() => onConfirm(tour)}
										>
											<Check className='mr-2 h-4 w-4' />
											Confirm Tour
										</DropdownMenuItem>
									)}
									{tour.status === 'CONFIRMED' && (
										<>
											<DropdownMenuItem
												onClick={() =>
													onReschedule(tour)
												}
											>
												<Calendar className='mr-2 h-4 w-4' />
												Reschedule
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => onComplete(tour)}
											>
												<Check className='mr-2 h-4 w-4' />
												Mark Complete
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => onNoShow(tour)}
											>
												<X className='mr-2 h-4 w-4' />
												Mark No-Show
											</DropdownMenuItem>
											{!tour.reminderSent && (
												<DropdownMenuItem
													onClick={() =>
														onSendReminder(tour)
													}
												>
													<Send className='mr-2 h-4 w-4' />
													Send Reminder
												</DropdownMenuItem>
											)}
										</>
									)}
									{(tour.status === 'PENDING' ||
										tour.status === 'CONFIRMED') && (
										<>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={() => onCancel(tour)}
												className='text-destructive'
											>
												<X className='mr-2 h-4 w-4' />
												Cancel Tour
											</DropdownMenuItem>
										</>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
