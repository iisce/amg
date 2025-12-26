'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
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
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import {
	Users,
	Plus,
	MoreHorizontal,
	Mail,
	Building2,
	Calendar as CalendarIcon,
	Clock,
	Copy,
	XCircle,
	RefreshCw,
	AlertCircle,
	LogIn,
	LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
	getVisitorHistory,
	createVisitor,
	cancelVisitor,
	resendVisitorInvitation,
	type VisitorWithRelations,
} from '@/actions/visitors';

const visitorSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters'),
	email: z.string().email('Invalid email').optional().or(z.literal('')),
	phone: z.string().optional(),
	company: z.string().optional(),
	purpose: z.string().min(5, 'Please describe the purpose of visit'),
	validFrom: z.date({ required_error: 'Please select a date' }),
	validUntil: z.date({ required_error: 'Please select an end date' }),
	notes: z.string().optional(),
});

type VisitorFormData = z.infer<typeof visitorSchema>;

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

export default function VisitorsPage() {
	const { toast } = useToast();
	const [visitors, setVisitors] = useState<VisitorWithRelations[]>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const form = useForm<VisitorFormData>({
		resolver: zodResolver(visitorSchema),
		defaultValues: {
			name: '',
			email: '',
			phone: '',
			company: '',
			purpose: '',
			notes: '',
		},
	});

	const fetchVisitors = async () => {
		setLoading(true);
		const result = await getVisitorHistory({ limit: 100 });
		if (result.success && result.data) {
			setVisitors(
				Array.isArray(result.data) ? result.data : [result.data]
			);
		}
		setLoading(false);
	};

	useEffect(() => {
		fetchVisitors();
	}, []);

	const handleCreateVisitor = async (data: VisitorFormData) => {
		setSubmitting(true);
		const result = await createVisitor({
			name: data.name,
			email: data.email || undefined,
			phone: data.phone || undefined,
			company: data.company || undefined,
			purpose: data.purpose,
			validFrom: data.validFrom,
			validUntil: data.validUntil,
			notes: data.notes || undefined,
		});

		if (result.success) {
			toast({
				title: 'Visitor registered',
				description: result.message,
			});
			setDialogOpen(false);
			form.reset();
			fetchVisitors();
		} else {
			toast({
				title: 'Error',
				description: result.message,
				variant: 'destructive',
			});
		}
		setSubmitting(false);
	};

	const handleCancelVisitor = async (id: string) => {
		const result = await cancelVisitor(id);
		if (result.success) {
			toast({
				title: 'Visitor cancelled',
				description: result.message,
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
				title: 'Invitation sent',
				description: result.message,
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

	const pendingCount = visitors.filter((v) => v.status === 'PENDING').length;
	const checkedInCount = visitors.filter(
		(v) => v.status === 'CHECKED_IN'
	).length;

	if (loading) {
		return (
			<div className='container mx-auto py-6 space-y-6'>
				<Skeleton className='h-8 w-48' />
				<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
					<Skeleton className='h-24' />
					<Skeleton className='h-24' />
					<Skeleton className='h-24' />
				</div>
				<Skeleton className='h-96' />
			</div>
		);
	}

	return (
		<div className='container mx-auto py-6 space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-bold flex items-center gap-2'>
						<Users className='h-6 w-6' />
						Visitors
					</h1>
					<p className='text-muted-foreground'>
						Register and manage visitors to AMG Workspace
					</p>
				</div>
				<Dialog
					open={dialogOpen}
					onOpenChange={setDialogOpen}
				>
					<DialogTrigger asChild>
						<Button>
							<Plus className='mr-2 h-4 w-4' />
							Register Visitor
						</Button>
					</DialogTrigger>
					<DialogContent className='max-w-lg max-h-[90vh] overflow-y-auto'>
						<DialogHeader>
							<DialogTitle>Register a Visitor</DialogTitle>
							<DialogDescription>
								Pre-register someone who will be visiting you at
								AMG Workspace
							</DialogDescription>
						</DialogHeader>
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(
									handleCreateVisitor
								)}
								className='space-y-4'
							>
								<FormField
									control={form.control}
									name='name'
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Visitor Name *
											</FormLabel>
											<FormControl>
												<Input
													placeholder='John Doe'
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className='grid grid-cols-2 gap-4'>
									<FormField
										control={form.control}
										name='email'
										render={({ field }) => (
											<FormItem>
												<FormLabel>Email</FormLabel>
												<FormControl>
													<Input
														type='email'
														placeholder='visitor@example.com'
														{...field}
													/>
												</FormControl>
												<FormDescription>
													Invitation will be sent if
													provided
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name='phone'
										render={({ field }) => (
											<FormItem>
												<FormLabel>Phone</FormLabel>
												<FormControl>
													<Input
														placeholder='+234...'
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name='company'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Company</FormLabel>
											<FormControl>
												<Input
													placeholder='Company name'
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name='purpose'
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Purpose of Visit *
											</FormLabel>
											<FormControl>
												<Textarea
													placeholder='Meeting, Interview, Delivery, etc.'
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className='grid grid-cols-2 gap-4'>
									<FormField
										control={form.control}
										name='validFrom'
										render={({ field }) => (
											<FormItem className='flex flex-col'>
												<FormLabel>
													Valid From *
												</FormLabel>
												<Popover>
													<PopoverTrigger asChild>
														<FormControl>
															<Button
																variant='outline'
																className={cn(
																	'pl-3 text-left font-normal',
																	!field.value &&
																		'text-muted-foreground'
																)}
															>
																{field.value ? (
																	format(
																		field.value,
																		'PPP'
																	)
																) : (
																	<span>
																		Pick a
																		date
																	</span>
																)}
																<CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
															</Button>
														</FormControl>
													</PopoverTrigger>
													<PopoverContent
														className='w-auto p-0'
														align='start'
													>
														<Calendar
															mode='single'
															selected={
																field.value
															}
															onSelect={
																field.onChange
															}
															disabled={(date) =>
																date <
																new Date(
																	new Date().setHours(
																		0,
																		0,
																		0,
																		0
																	)
																)
															}
															initialFocus
														/>
													</PopoverContent>
												</Popover>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name='validUntil'
										render={({ field }) => (
											<FormItem className='flex flex-col'>
												<FormLabel>
													Valid Until *
												</FormLabel>
												<Popover>
													<PopoverTrigger asChild>
														<FormControl>
															<Button
																variant='outline'
																className={cn(
																	'pl-3 text-left font-normal',
																	!field.value &&
																		'text-muted-foreground'
																)}
															>
																{field.value ? (
																	format(
																		field.value,
																		'PPP'
																	)
																) : (
																	<span>
																		Pick a
																		date
																	</span>
																)}
																<CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
															</Button>
														</FormControl>
													</PopoverTrigger>
													<PopoverContent
														className='w-auto p-0'
														align='start'
													>
														<Calendar
															mode='single'
															selected={
																field.value
															}
															onSelect={
																field.onChange
															}
															disabled={(date) =>
																date <
																(form.getValues(
																	'validFrom'
																) || new Date())
															}
															initialFocus
														/>
													</PopoverContent>
												</Popover>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name='notes'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Notes</FormLabel>
											<FormControl>
												<Textarea
													placeholder='Any additional information...'
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className='flex justify-end gap-2 pt-4'>
									<Button
										type='button'
										variant='outline'
										onClick={() => setDialogOpen(false)}
									>
										Cancel
									</Button>
									<Button
										type='submit'
										disabled={submitting}
									>
										{submitting ? (
											<RefreshCw className='mr-2 h-4 w-4 animate-spin' />
										) : (
											<Plus className='mr-2 h-4 w-4' />
										)}
										Register Visitor
									</Button>
								</div>
							</form>
						</Form>
					</DialogContent>
				</Dialog>
			</div>

			{/* Stats */}
			<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
				<Card>
					<CardHeader className='pb-2'>
						<CardTitle className='text-sm font-medium text-muted-foreground'>
							Total Visitors
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{visitors.length}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='pb-2'>
						<CardTitle className='text-sm font-medium text-muted-foreground'>
							Pending
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
			</div>

			{/* Visitors Table */}
			<Card>
				<CardHeader>
					<CardTitle>Your Visitors</CardTitle>
					<CardDescription>
						People you&apos;ve registered to visit AMG Workspace
					</CardDescription>
				</CardHeader>
				<CardContent>
					{visitors.length === 0 ? (
						<div className='text-center py-12'>
							<Users className='mx-auto h-12 w-12 text-muted-foreground/50' />
							<h3 className='mt-4 text-lg font-semibold'>
								No visitors yet
							</h3>
							<p className='text-muted-foreground'>
								Register your first visitor to get started
							</p>
							<Button
								className='mt-4'
								onClick={() => setDialogOpen(true)}
							>
								<Plus className='mr-2 h-4 w-4' />
								Register Visitor
							</Button>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Visitor</TableHead>
									<TableHead>Access Code</TableHead>
									<TableHead>Valid Period</TableHead>
									<TableHead>Purpose</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className='w-[50px]'></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{visitors.map((visitor) => (
									<TableRow key={visitor.id}>
										<TableCell>
											<div>
												<p className='font-medium'>
													{visitor.name}
												</p>
												{visitor.email && (
													<p className='text-sm text-muted-foreground flex items-center gap-1'>
														<Mail className='h-3 w-3' />
														{visitor.email}
													</p>
												)}
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
												<code className='text-sm bg-muted px-2 py-1 rounded'>
													{visitor.accessCode}
												</code>
												<Button
													variant='ghost'
													size='icon'
													className='h-6 w-6'
													onClick={() =>
														copyAccessCode(
															visitor.accessCode
														)
													}
												>
													<Copy className='h-3 w-3' />
												</Button>
											</div>
										</TableCell>
										<TableCell>
											<div className='text-sm'>
												<p>
													{format(
														new Date(
															visitor.validFrom
														),
														'MMM d, yyyy'
													)}
												</p>
												<p className='text-muted-foreground'>
													to{' '}
													{format(
														new Date(
															visitor.validUntil
														),
														'MMM d, yyyy'
													)}
												</p>
											</div>
										</TableCell>
										<TableCell>
											<span className='text-sm'>
												{visitor.purpose}
											</span>
										</TableCell>
										<TableCell>
											{getStatusBadge(visitor.status)}
										</TableCell>
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
														onClick={() =>
															copyAccessCode(
																visitor.accessCode
															)
														}
													>
														<Copy className='mr-2 h-4 w-4' />
														Copy Access Code
													</DropdownMenuItem>
													{visitor.email &&
														visitor.status ===
															'PENDING' && (
															<DropdownMenuItem
																onClick={() =>
																	handleResendInvitation(
																		visitor.id
																	)
																}
															>
																<Mail className='mr-2 h-4 w-4' />
																Resend
																Invitation
															</DropdownMenuItem>
														)}
													{visitor.status ===
														'PENDING' && (
														<DropdownMenuItem
															onClick={() =>
																handleCancelVisitor(
																	visitor.id
																)
															}
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
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
