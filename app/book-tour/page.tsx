'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
	CalendarIcon,
	Check,
	Building2,
	Users,
	Clock,
	MapPin,
	Phone,
	Mail,
	Loader2,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { requestTour } from '@/actions/tours';

const tourFormSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters'),
	email: z.string().email('Please enter a valid email address'),
	phone: z.string().optional(),
	company: z.string().optional(),
	preferredDate: z.date({
		required_error: 'Please select a preferred date',
	}),
	preferredTime: z.string({
		required_error: 'Please select a preferred time',
	}),
	interestedIn: z.string().optional(),
	groupSize: z.coerce.number().min(1).max(20).default(1),
	budget: z.string().optional(),
	source: z.string().optional(),
	message: z.string().optional(),
});

type TourFormValues = z.infer<typeof tourFormSchema>;

const timeSlots = [
	'09:00 AM',
	'09:30 AM',
	'10:00 AM',
	'10:30 AM',
	'11:00 AM',
	'11:30 AM',
	'12:00 PM',
	'12:30 PM',
	'01:00 PM',
	'01:30 PM',
	'02:00 PM',
	'02:30 PM',
	'03:00 PM',
	'03:30 PM',
	'04:00 PM',
	'04:30 PM',
];

const spaceOptions = [
	'Shared Desk / Hot Desk',
	'Dedicated Desk',
	'Private Office (1-2 people)',
	'Private Office (3-4 people)',
	'Team Office (5+ people)',
	'Meeting Room',
	'Training Room',
	'Virtual Office',
	'Not sure yet',
];

const budgetOptions = [
	'Under ₦50,000/month',
	'₦50,000 - ₦100,000/month',
	'₦100,000 - ₦200,000/month',
	'₦200,000 - ₦500,000/month',
	'Above ₦500,000/month',
	'Prefer not to say',
];

const sourceOptions = [
	'Google Search',
	'Instagram',
	'Facebook',
	'Twitter/X',
	'LinkedIn',
	'Friend/Colleague Referral',
	'Walked by the office',
	'Event/Conference',
	'Other',
];

export default function BookTourPage() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	const form = useForm<TourFormValues>({
		resolver: zodResolver(tourFormSchema),
		defaultValues: {
			name: '',
			email: '',
			phone: '',
			company: '',
			groupSize: 1,
			message: '',
		},
	});

	const onSubmit = async (data: TourFormValues) => {
		setIsSubmitting(true);

		try {
			// Combine date and time
			const [time, period] = data.preferredTime.split(' ');
			const [hours, minutes] = time.split(':').map(Number);
			let hour24 = hours;
			if (period === 'PM' && hours !== 12) hour24 += 12;
			if (period === 'AM' && hours === 12) hour24 = 0;

			const preferredDate = new Date(data.preferredDate);
			preferredDate.setHours(hour24, minutes, 0, 0);

			const result = await requestTour({
				name: data.name,
				email: data.email,
				phone: data.phone,
				company: data.company,
				preferredDate,
				interestedIn: data.interestedIn,
				groupSize: data.groupSize,
				budget: data.budget,
				source: data.source,
				message: data.message,
			});

			if (result.success) {
				setIsSuccess(true);
				toast.success('Tour request submitted successfully!');
			} else {
				toast.error(result.message);
			}
		} catch {
			toast.error('Something went wrong. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	// Success state
	if (isSuccess) {
		return (
			<div className='min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4'>
				<Card className='max-w-md w-full text-center'>
					<CardHeader>
						<div className='mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4'>
							<Check className='h-8 w-8 text-green-600' />
						</div>
						<CardTitle className='text-2xl'>
							Tour Request Submitted!
						</CardTitle>
						<CardDescription>
							Thank you for your interest in AMG Workspace
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<p className='text-muted-foreground'>
							We&apos;ve received your tour request and will
							contact you shortly to confirm your appointment.
						</p>
						<p className='text-sm text-muted-foreground'>
							A confirmation email has been sent to your email
							address.
						</p>
						<div className='pt-4'>
							<Link href='/'>
								<Button
									variant='outline'
									className='mr-2'
								>
									Back to Home
								</Button>
							</Link>
							<Link href='/spaces'>
								<Button>Explore Spaces</Button>
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-12 px-4'>
			<div className='max-w-4xl mx-auto'>
				{/* Header */}
				<div className='text-center mb-10'>
					<h1 className='text-4xl font-bold mb-4'>
						Book a Workspace Tour
					</h1>
					<p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
						See our spaces in person and find the perfect fit for
						you or your team. Tours are free and typically last 30
						minutes.
					</p>
				</div>

				<div className='grid md:grid-cols-3 gap-8'>
					{/* Form */}
					<div className='md:col-span-2'>
						<Card>
							<CardHeader>
								<CardTitle>Request a Tour</CardTitle>
								<CardDescription>
									Fill in your details and we&apos;ll confirm
									your appointment
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Form {...form}>
									<form
										onSubmit={form.handleSubmit(onSubmit)}
										className='space-y-6'
									>
										{/* Contact Info */}
										<div className='space-y-4'>
											<h3 className='font-semibold text-lg flex items-center gap-2'>
												<Users className='h-5 w-5' />
												Contact Information
											</h3>

											<div className='grid sm:grid-cols-2 gap-4'>
												<FormField
													control={form.control}
													name='name'
													render={({ field }) => (
														<FormItem>
															<FormLabel>
																Full Name *
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
												<FormField
													control={form.control}
													name='email'
													render={({ field }) => (
														<FormItem>
															<FormLabel>
																Email *
															</FormLabel>
															<FormControl>
																<Input
																	type='email'
																	placeholder='john@example.com'
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>

											<div className='grid sm:grid-cols-2 gap-4'>
												<FormField
													control={form.control}
													name='phone'
													render={({ field }) => (
														<FormItem>
															<FormLabel>
																Phone Number
															</FormLabel>
															<FormControl>
																<Input
																	placeholder='+234 xxx xxx xxxx'
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name='company'
													render={({ field }) => (
														<FormItem>
															<FormLabel>
																Company/Organization
															</FormLabel>
															<FormControl>
																<Input
																	placeholder='Your company name'
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
										</div>

										{/* Schedule */}
										<div className='space-y-4'>
											<h3 className='font-semibold text-lg flex items-center gap-2'>
												<Clock className='h-5 w-5' />
												Preferred Schedule
											</h3>

											<div className='grid sm:grid-cols-2 gap-4'>
												<FormField
													control={form.control}
													name='preferredDate'
													render={({ field }) => (
														<FormItem className='flex flex-col'>
															<FormLabel>
																Preferred Date *
															</FormLabel>
															<Popover>
																<PopoverTrigger
																	asChild
																>
																	<FormControl>
																		<Button
																			variant='outline'
																			className={cn(
																				'w-full pl-3 text-left font-normal',
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
																					Pick
																					a
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
																		disabled={(
																			date
																		) =>
																			date <
																				new Date() ||
																			date.getDay() ===
																				0 ||
																			date.getDay() ===
																				6
																		}
																		initialFocus
																	/>
																</PopoverContent>
															</Popover>
															<FormDescription>
																Monday - Friday
																only
															</FormDescription>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name='preferredTime'
													render={({ field }) => (
														<FormItem>
															<FormLabel>
																Preferred Time *
															</FormLabel>
															<Select
																onValueChange={
																	field.onChange
																}
																defaultValue={
																	field.value
																}
															>
																<FormControl>
																	<SelectTrigger>
																		<SelectValue placeholder='Select time' />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{timeSlots.map(
																		(
																			slot
																		) => (
																			<SelectItem
																				key={
																					slot
																				}
																				value={
																					slot
																				}
																			>
																				{
																					slot
																				}
																			</SelectItem>
																		)
																	)}
																</SelectContent>
															</Select>
															<FormDescription>
																9 AM - 5 PM
															</FormDescription>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
										</div>

										{/* Interests */}
										<div className='space-y-4'>
											<h3 className='font-semibold text-lg flex items-center gap-2'>
												<Building2 className='h-5 w-5' />
												What Are You Looking For?
											</h3>

											<div className='grid sm:grid-cols-2 gap-4'>
												<FormField
													control={form.control}
													name='interestedIn'
													render={({ field }) => (
														<FormItem>
															<FormLabel>
																Space Type
															</FormLabel>
															<Select
																onValueChange={
																	field.onChange
																}
																defaultValue={
																	field.value
																}
															>
																<FormControl>
																	<SelectTrigger>
																		<SelectValue placeholder='Select option' />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{spaceOptions.map(
																		(
																			option
																		) => (
																			<SelectItem
																				key={
																					option
																				}
																				value={
																					option
																				}
																			>
																				{
																					option
																				}
																			</SelectItem>
																		)
																	)}
																</SelectContent>
															</Select>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name='groupSize'
													render={({ field }) => (
														<FormItem>
															<FormLabel>
																How many people?
															</FormLabel>
															<FormControl>
																<Input
																	type='number'
																	min={1}
																	max={20}
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>

											<div className='grid sm:grid-cols-2 gap-4'>
												<FormField
													control={form.control}
													name='budget'
													render={({ field }) => (
														<FormItem>
															<FormLabel>
																Budget Range
															</FormLabel>
															<Select
																onValueChange={
																	field.onChange
																}
																defaultValue={
																	field.value
																}
															>
																<FormControl>
																	<SelectTrigger>
																		<SelectValue placeholder='Select budget' />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{budgetOptions.map(
																		(
																			option
																		) => (
																			<SelectItem
																				key={
																					option
																				}
																				value={
																					option
																				}
																			>
																				{
																					option
																				}
																			</SelectItem>
																		)
																	)}
																</SelectContent>
															</Select>
															<FormMessage />
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name='source'
													render={({ field }) => (
														<FormItem>
															<FormLabel>
																How did you hear
																about us?
															</FormLabel>
															<Select
																onValueChange={
																	field.onChange
																}
																defaultValue={
																	field.value
																}
															>
																<FormControl>
																	<SelectTrigger>
																		<SelectValue placeholder='Select source' />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{sourceOptions.map(
																		(
																			option
																		) => (
																			<SelectItem
																				key={
																					option
																				}
																				value={
																					option
																				}
																			>
																				{
																					option
																				}
																			</SelectItem>
																		)
																	)}
																</SelectContent>
															</Select>
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
										</div>

										{/* Message */}
										<FormField
											control={form.control}
											name='message'
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														Questions or Comments
													</FormLabel>
													<FormControl>
														<Textarea
															placeholder="Any specific requirements or questions you'd like us to address during the tour?"
															className='min-h-25'
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<Button
											type='submit'
											className='w-full'
											size='lg'
											disabled={isSubmitting}
										>
											{isSubmitting ? (
												<>
													<Loader2 className='mr-2 h-4 w-4 animate-spin' />
													Submitting...
												</>
											) : (
												'Request Tour'
											)}
										</Button>
									</form>
								</Form>
							</CardContent>
						</Card>
					</div>

					{/* Sidebar */}
					<div className='space-y-6'>
						{/* What to Expect */}
						<Card>
							<CardHeader>
								<CardTitle className='text-lg'>
									What to Expect
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ul className='space-y-3 text-sm'>
									<li className='flex items-start gap-2'>
										<Check className='h-4 w-4 mt-0.5 text-green-600 shrink-0' />
										<span>
											Full tour of workspace facilities
										</span>
									</li>
									<li className='flex items-start gap-2'>
										<Check className='h-4 w-4 mt-0.5 text-green-600 shrink-0' />
										<span>
											Overview of membership options
										</span>
									</li>
									<li className='flex items-start gap-2'>
										<Check className='h-4 w-4 mt-0.5 text-green-600 shrink-0' />
										<span>Q&A with our team</span>
									</li>
									<li className='flex items-start gap-2'>
										<Check className='h-4 w-4 mt-0.5 text-green-600 shrink-0' />
										<span>No obligation to sign up</span>
									</li>
									<li className='flex items-start gap-2'>
										<Clock className='h-4 w-4 mt-0.5 text-muted-foreground shrink-0' />
										<span>~30 minutes duration</span>
									</li>
								</ul>
							</CardContent>
						</Card>

						{/* Location */}
						<Card>
							<CardHeader>
								<CardTitle className='text-lg flex items-center gap-2'>
									<MapPin className='h-5 w-5' />
									Location
								</CardTitle>
							</CardHeader>
							<CardContent className='text-sm space-y-2'>
								<p className='font-medium'>AMG Workspace</p>
								<p className='text-muted-foreground'>
									Lagos, Nigeria
								</p>
							</CardContent>
						</Card>

						{/* Contact */}
						<Card>
							<CardHeader>
								<CardTitle className='text-lg'>
									Need Help?
								</CardTitle>
							</CardHeader>
							<CardContent className='text-sm space-y-3'>
								<a
									href='mailto:amgworkspace@gmail.com'
									className='flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors'
								>
									<Mail className='h-4 w-4' />
									amgworkspace@gmail.com
								</a>
								<a
									href='tel:+2349134011777'
									className='flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors'
								>
									<Phone className='h-4 w-4' />
									+234 913 401 1777
								</a>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
