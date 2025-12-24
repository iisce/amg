'use client';

import type React from 'react';
import { useEffect, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
	Form,
	FormControl,
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
import { Skeleton } from '@/components/ui/skeleton';
import {
	MessageSquare,
	Send,
	Loader2,
	CheckCircle,
	ArrowRight,
	MapPin,
	Phone,
	Mail,
	Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { createEnquiry, getSpaces } from '@/actions';

const enquirySchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters'),
	email: z.string().email('Invalid email address'),
	phone: z.string().optional(),
	company: z.string().optional(),
	spaceId: z.string().optional(),
	subject: z.string().min(3, 'Subject must be at least 3 characters'),
	message: z.string().min(10, 'Message must be at least 10 characters'),
});

type EnquiryFormData = z.infer<typeof enquirySchema>;

interface Space {
	id: string;
	name: string;
}

export default function EnquiryPage() {
	const searchParams = useSearchParams();
	const preselectedSpaceId = searchParams.get('space');
	const preselectedSubject = searchParams.get('subject');

	const { user, isLoading: authLoading } = useAuth();
	const [isPending, startTransition] = useTransition();
	const [isSuccess, setIsSuccess] = useState(false);
	const [spaces, setSpaces] = useState<Space[]>([]);
	const [loadingSpaces, setLoadingSpaces] = useState(true);

	const form = useForm<EnquiryFormData>({
		resolver: zodResolver(enquirySchema),
		defaultValues: {
			name: '',
			email: '',
			phone: '',
			company: '',
			spaceId: preselectedSpaceId || '',
			subject: preselectedSubject || '',
			message: '',
		},
	});

	// Load spaces for dropdown
	useEffect(() => {
		const loadSpaces = async () => {
			try {
				const result = await getSpaces({ activeOnly: true });
				if (result.success && result.data) {
					const spaceData = Array.isArray(result.data)
						? result.data
						: [result.data];
					setSpaces(
						spaceData.map((s: { id: string; name: string }) => ({
							id: s.id,
							name: s.name,
						}))
					);
				}
			} catch (error) {
				console.error('Failed to load spaces:', error);
			} finally {
				setLoadingSpaces(false);
			}
		};
		loadSpaces();
	}, []);

	// Pre-fill form when user data loads
	useEffect(() => {
		if (user) {
			form.setValue('name', user.name || '');
			form.setValue('email', user.email || '');
			form.setValue('phone', user.phone || '');
			form.setValue('company', user.company || '');
		}
	}, [user, form]);

	// Set preselected values from URL params
	useEffect(() => {
		if (preselectedSpaceId) {
			form.setValue('spaceId', preselectedSpaceId);
		}
		if (preselectedSubject) {
			form.setValue('subject', decodeURIComponent(preselectedSubject));
		}
	}, [preselectedSpaceId, preselectedSubject, form]);

	const onSubmit = (data: EnquiryFormData) => {
		startTransition(async () => {
			try {
				const result = await createEnquiry({
					...data,
					spaceId: data.spaceId || undefined,
					phone: data.phone || undefined,
					company: data.company || undefined,
				});

				if (result.success) {
					setIsSuccess(true);
					toast.success(result.message);
				} else {
					toast.error(result.message);
				}
			} catch (error) {
				console.error('Enquiry submission error:', error);
				toast.error('An error occurred. Please try again.');
			}
		});
	};

	// Success state
	if (isSuccess) {
		return (
			<div className='min-h-screen bg-background'>
				<section className='bg-primary px-4 py-16'>
					<div className='container mx-auto max-w-4xl text-center'>
						<div className='w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6'>
							<CheckCircle className='h-10 w-10 text-primary' />
						</div>
						<h1 className='text-3xl font-bold text-secondary sm:text-4xl mb-4'>
							Thank You!
						</h1>
						<p className='text-secondary/80 text-lg max-w-xl mx-auto'>
							Your enquiry has been submitted successfully. Our
							team will review your message and get back to you
							within 24-48 hours.
						</p>
					</div>
				</section>

				<section className='px-4 py-12'>
					<div className='container mx-auto max-w-4xl'>
						<Card>
							<CardContent className='p-8 text-center'>
								<h2 className='text-xl font-semibold mb-4'>
									What happens next?
								</h2>
								<div className='grid md:grid-cols-3 gap-6 text-left'>
									<div className='flex gap-4'>
										<div className='shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
											<span className='text-primary font-semibold'>
												1
											</span>
										</div>
										<div>
											<h3 className='font-medium mb-1'>
												Review
											</h3>
											<p className='text-sm text-muted-foreground'>
												Our team reviews your enquiry
											</p>
										</div>
									</div>
									<div className='flex gap-4'>
										<div className='shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
											<span className='text-primary font-semibold'>
												2
											</span>
										</div>
										<div>
											<h3 className='font-medium mb-1'>
												Response
											</h3>
											<p className='text-sm text-muted-foreground'>
												We&apos;ll reach out via email or phone
											</p>
										</div>
									</div>
									<div className='flex gap-4'>
										<div className='shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
											<span className='text-primary font-semibold'>
												3
											</span>
										</div>
										<div>
											<h3 className='font-medium mb-1'>
												Solution
											</h3>
											<p className='text-sm text-muted-foreground'>
												Get personalized recommendations
											</p>
										</div>
									</div>
								</div>

								<div className='flex flex-col sm:flex-row gap-4 justify-center mt-8'>
									<Button asChild>
										<Link href='/spaces'>
											Browse Spaces
											<ArrowRight className='ml-2 h-4 w-4' />
										</Link>
									</Button>
									<Button variant='outline' asChild>
										<Link href='/'>Return Home</Link>
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</section>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-background'>
			{/* Header */}
			<section className='bg-primary px-4 py-12'>
				<div className='container mx-auto max-w-4xl'>
					<div className='flex items-center gap-3 mb-4'>
						<div className='p-2 bg-secondary/20 rounded-lg'>
							<MessageSquare className='h-6 w-6 text-secondary' />
						</div>
						<h1 className='text-3xl font-bold text-secondary sm:text-4xl'>
							Make an Enquiry
						</h1>
					</div>
					<p className='text-secondary/80 max-w-2xl'>
						Have questions about our spaces, pricing, or services?
						Fill out the form below and our team will get back to
						you promptly.
					</p>
				</div>
			</section>

			{/* Form Section */}
			<section className='px-4 py-8'>
				<div className='container mx-auto max-w-4xl'>
					<div className='grid lg:grid-cols-3 gap-8'>
						{/* Form */}
						<div className='lg:col-span-2'>
							<Card>
								<CardHeader>
									<CardTitle>Send us a message</CardTitle>
									<CardDescription>
										{user
											? 'Your contact details are pre-filled from your profile.'
											: 'Fill in your details and message below.'}
									</CardDescription>
								</CardHeader>
								<CardContent>
									{authLoading ? (
										<div className='space-y-4'>
											<Skeleton className='h-10 w-full' />
											<Skeleton className='h-10 w-full' />
											<Skeleton className='h-10 w-full' />
											<Skeleton className='h-32 w-full' />
										</div>
									) : (
										<Form {...form}>
											<form
												onSubmit={form.handleSubmit(
													onSubmit
												)}
												className='space-y-6'
											>
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
																		placeholder='Your name'
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
																	Email
																	Address *
																</FormLabel>
																<FormControl>
																	<Input
																		type='email'
																		placeholder='you@example.com'
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
																		placeholder='+234...'
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
																	Company
																</FormLabel>
																<FormControl>
																	<Input
																		placeholder='Your company'
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
													name='spaceId'
													render={({ field }) => (
														<FormItem>
															<FormLabel>
																Space of Interest
															</FormLabel>
															<Select
																onValueChange={
																	field.onChange
																}
																value={
																	field.value
																}
															>
																<FormControl>
																	<SelectTrigger>
																		<SelectValue placeholder='Select a space (optional)' />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	<SelectItem value='general'>
																		General
																		Enquiry
																	</SelectItem>
																	{loadingSpaces ? (
																		<SelectItem
																			value='loading'
																			disabled
																		>
																			Loading
																			spaces...
																		</SelectItem>
																	) : (
																		spaces.map(
																			(
																				space
																			) => (
																				<SelectItem
																					key={
																						space.id
																					}
																					value={
																						space.id
																					}
																				>
																					{
																						space.name
																					}
																				</SelectItem>
																			)
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
													name='subject'
													render={({ field }) => (
														<FormItem>
															<FormLabel>
																Subject *
															</FormLabel>
															<FormControl>
																<Input
																	placeholder='What is your enquiry about?'
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name='message'
													render={({ field }) => (
														<FormItem>
															<FormLabel>
																Message *
															</FormLabel>
															<FormControl>
																<Textarea
																	placeholder='Tell us more about your enquiry...'
																	rows={6}
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
													disabled={isPending}
												>
													{isPending ? (
														<>
															<Loader2 className='mr-2 h-4 w-4 animate-spin' />
															Submitting...
														</>
													) : (
														<>
															<Send className='mr-2 h-4 w-4' />
															Submit Enquiry
														</>
													)}
												</Button>
											</form>
										</Form>
									)}
								</CardContent>
							</Card>
						</div>

						{/* Contact Info Sidebar */}
						<div className='space-y-6'>
							<Card>
								<CardHeader>
									<CardTitle className='text-lg'>
										Contact Information
									</CardTitle>
								</CardHeader>
								<CardContent className='space-y-4'>
									<div className='flex items-start gap-3'>
										<MapPin className='h-5 w-5 text-primary mt-0.5' />
										<div>
											<p className='font-medium'>
												Address
											</p>
											<p className='text-sm text-muted-foreground'>
												AMG Workspace, Victoria Island,
												Lagos, Nigeria
											</p>
										</div>
									</div>
									<div className='flex items-start gap-3'>
										<Phone className='h-5 w-5 text-primary mt-0.5' />
										<div>
											<p className='font-medium'>Phone</p>
											<p className='text-sm text-muted-foreground'>
												+234 (0) 123 456 7890
											</p>
										</div>
									</div>
									<div className='flex items-start gap-3'>
										<Mail className='h-5 w-5 text-primary mt-0.5' />
										<div>
											<p className='font-medium'>Email</p>
											<p className='text-sm text-muted-foreground'>
												hello@amgworkspace.com
											</p>
										</div>
									</div>
									<div className='flex items-start gap-3'>
										<Clock className='h-5 w-5 text-primary mt-0.5' />
										<div>
											<p className='font-medium'>Hours</p>
											<p className='text-sm text-muted-foreground'>
												Mon - Fri: 8am - 8pm
												<br />
												Sat: 9am - 5pm
												<br />
												Sun: Closed
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle className='text-lg'>
										Quick Links
									</CardTitle>
								</CardHeader>
								<CardContent className='space-y-2'>
									<Button
										variant='ghost'
										className='w-full justify-start'
										asChild
									>
										<Link href='/spaces'>
											Browse All Spaces
										</Link>
									</Button>
									<Button
										variant='ghost'
										className='w-full justify-start'
										asChild
									>
										<Link href='/pricing'>
											View Pricing
										</Link>
									</Button>
									<Button
										variant='ghost'
										className='w-full justify-start'
										asChild
									>
										<Link href='/booking'>
											Make a Booking
										</Link>
									</Button>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
