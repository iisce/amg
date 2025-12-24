'use client';

import { useState, useEffect, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
	ArrowLeft,
	Save,
	Plus,
	X,
	Loader2,
	ImagePlus,
	GripVertical,
	Trash2,
	AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { getSpaceById, updateSpace } from '@/actions/spaces';
import type { SpaceWithPricing } from '@/lib/types';
import type { SpaceCategory, SpaceType } from '@prisma/client';

// Validation schema
const spaceFormSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters'),
	slug: z
		.string()
		.min(2, 'Slug must be at least 2 characters')
		.regex(
			/^[a-z0-9-]+$/,
			'Slug can only contain lowercase letters, numbers, and hyphens'
		),
	description: z
		.string()
		.min(10, 'Description must be at least 10 characters'),
	fullDescription: z.string().optional(),
	capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
	category: z.enum([
		'WORKSPACE',
		'OFFICE',
		'MEETING',
		'CREATIVE',
		'EVENT',
		'SOCIAL',
	]),
	type: z.enum(['SUBSCRIPTION', 'BOOKING']),
	isActive: z.boolean(),
	sortOrder: z.coerce.number().min(0),
});

type SpaceFormValues = z.infer<typeof spaceFormSchema>;

// Category options
const CATEGORY_OPTIONS: { value: SpaceCategory; label: string }[] = [
	{ value: 'WORKSPACE', label: 'Workspace' },
	{ value: 'OFFICE', label: 'Private Office' },
	{ value: 'MEETING', label: 'Meeting Room' },
	{ value: 'CREATIVE', label: 'Creative Studio' },
	{ value: 'EVENT', label: 'Event Space' },
	{ value: 'SOCIAL', label: 'Social/Lounge' },
];

// Type options
const TYPE_OPTIONS: { value: SpaceType; label: string; description: string }[] =
	[
		{
			value: 'SUBSCRIPTION',
			label: 'Subscription',
			description: 'Long-term membership (daily/weekly/monthly)',
		},
		{
			value: 'BOOKING',
			label: 'Hourly Booking',
			description: 'Short-term booking with time slots',
		},
	];

export default function EditSpacePage() {
	const params = useParams();
	const router = useRouter();
	const spaceId = params.id as string;

	const [space, setSpace] = useState<SpaceWithPricing | null>(null);
	const [loading, setLoading] = useState(true);
	const [isPending, startTransition] = useTransition();
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [showLeaveDialog, setShowLeaveDialog] = useState(false);
	const [pendingNavigation, setPendingNavigation] = useState<string | null>(
		null
	);

	// Amenities state
	const [amenities, setAmenities] = useState<string[]>([]);
	const [newAmenity, setNewAmenity] = useState('');

	// Features state
	const [features, setFeatures] = useState<string[]>([]);
	const [newFeature, setNewFeature] = useState('');

	// Images state
	const [images, setImages] = useState<string[]>([]);
	const [newImageUrl, setNewImageUrl] = useState('');

	const form = useForm<SpaceFormValues>({
		resolver: zodResolver(spaceFormSchema),
		defaultValues: {
			name: '',
			slug: '',
			description: '',
			fullDescription: '',
			capacity: 1,
			category: 'WORKSPACE',
			type: 'SUBSCRIPTION',
			isActive: true,
			sortOrder: 0,
		},
	});

	// Watch form changes
	useEffect(() => {
		const subscription = form.watch(() => {
			setHasUnsavedChanges(true);
		});
		return () => subscription.unsubscribe();
	}, [form]);

	// Fetch space data
	useEffect(() => {
		const fetchSpace = async () => {
			setLoading(true);
			const result = await getSpaceById(spaceId);
			if (result.success && result.data && !Array.isArray(result.data)) {
				const data = result.data;
				setSpace(data);
				form.reset({
					name: data.name,
					slug: data.slug,
					description: data.description,
					fullDescription: data.fullDescription || '',
					capacity: data.capacity,
					category: data.category,
					type: data.type,
					isActive: data.isActive,
					sortOrder: data.sortOrder,
				});
				setAmenities(data.amenities || []);
				setFeatures(data.features || []);
				setImages(data.images || []);
				setHasUnsavedChanges(false);
			} else {
				toast.error('Space not found');
				router.push('/admin/spaces');
			}
			setLoading(false);
		};
		fetchSpace();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [spaceId]);

	// Handle navigation with unsaved changes
	const handleNavigation = (href: string) => {
		if (hasUnsavedChanges) {
			setPendingNavigation(href);
			setShowLeaveDialog(true);
		} else {
			router.push(href);
		}
	};

	const confirmNavigation = () => {
		if (pendingNavigation) {
			router.push(pendingNavigation);
		}
		setShowLeaveDialog(false);
	};

	// Generate slug from name
	const generateSlug = () => {
		const name = form.getValues('name');
		const slug = name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');
		form.setValue('slug', slug);
		setHasUnsavedChanges(true);
	};

	// Amenities handlers
	const handleAddAmenity = () => {
		if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
			setAmenities([...amenities, newAmenity.trim()]);
			setNewAmenity('');
			setHasUnsavedChanges(true);
		}
	};

	const handleRemoveAmenity = (amenity: string) => {
		setAmenities(amenities.filter((a) => a !== amenity));
		setHasUnsavedChanges(true);
	};

	// Features handlers
	const handleAddFeature = () => {
		if (newFeature.trim() && !features.includes(newFeature.trim())) {
			setFeatures([...features, newFeature.trim()]);
			setNewFeature('');
			setHasUnsavedChanges(true);
		}
	};

	const handleRemoveFeature = (feature: string) => {
		setFeatures(features.filter((f) => f !== feature));
		setHasUnsavedChanges(true);
	};

	// Images handlers
	const handleAddImage = () => {
		if (newImageUrl.trim() && !images.includes(newImageUrl.trim())) {
			setImages([...images, newImageUrl.trim()]);
			setNewImageUrl('');
			setHasUnsavedChanges(true);
		}
	};

	const handleRemoveImage = (index: number) => {
		setImages(images.filter((_, i) => i !== index));
		setHasUnsavedChanges(true);
	};

	const handleMoveImage = (index: number, direction: 'up' | 'down') => {
		const newImages = [...images];
		const newIndex = direction === 'up' ? index - 1 : index + 1;
		if (newIndex >= 0 && newIndex < images.length) {
			[newImages[index], newImages[newIndex]] = [
				newImages[newIndex],
				newImages[index],
			];
			setImages(newImages);
			setHasUnsavedChanges(true);
		}
	};

	// Submit handler
	const onSubmit = (values: SpaceFormValues) => {
		if (!space) return;

		startTransition(async () => {
			const result = await updateSpace(space.id, {
				...values,
				amenities,
				features,
				images,
			});

			if (result.success) {
				toast.success('Space updated successfully');
				setHasUnsavedChanges(false);
				router.push(`/admin/spaces/${space.id}`);
			} else {
				toast.error(result.message || 'Failed to update space');
			}
		});
	};

	if (loading) {
		return <EditSpaceSkeleton />;
	}

	if (!space) {
		return null;
	}

	return (
		<div className='min-h-screen bg-background'>
			{/* Header */}
			<section className='bg-secondary text-secondary-foreground px-4 py-6 border-b sticky top-0 z-10'>
				<div className='container mx-auto'>
					<div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
						<div className='flex items-center gap-4'>
							<Button
								variant='ghost'
								size='icon'
								className='text-secondary-foreground/70 hover:text-secondary-foreground'
								onClick={() =>
									handleNavigation(
										`/admin/spaces/${space.id}`
									)
								}
							>
								<ArrowLeft className='h-5 w-5' />
							</Button>
							<div>
								<div className='flex items-center gap-2 mb-1'>
									<Badge className='bg-red-600 text-white'>
										Admin
									</Badge>
									<Badge variant='outline'>Edit Mode</Badge>
									{hasUnsavedChanges && (
										<Badge
											variant='secondary'
											className='bg-yellow-500/20 text-yellow-600'
										>
											<AlertCircle className='h-3 w-3 mr-1' />
											Unsaved Changes
										</Badge>
									)}
								</div>
								<h1 className='text-xl font-bold'>
									Edit: {space.name}
								</h1>
							</div>
						</div>
						<div className='flex gap-2'>
							<Button
								variant='outline'
								className='bg-transparent'
								onClick={() =>
									handleNavigation(
										`/admin/spaces/${space.id}`
									)
								}
							>
								Cancel
							</Button>
							<Button
								onClick={form.handleSubmit(onSubmit)}
								disabled={isPending}
							>
								{isPending ? (
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
								) : (
									<Save className='mr-2 h-4 w-4' />
								)}
								Save Changes
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Main Content */}
			<section className='px-4 py-8'>
				<div className='container mx-auto max-w-4xl'>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className='space-y-8'
						>
							{/* Basic Information */}
							<Card>
								<CardHeader>
									<CardTitle>Basic Information</CardTitle>
									<CardDescription>
										General details about the space
									</CardDescription>
								</CardHeader>
								<CardContent className='space-y-6'>
									<FormField
										control={form.control}
										name='name'
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Space Name *
												</FormLabel>
												<FormControl>
													<Input
														{...field}
														placeholder='e.g., Private Office 4-Man'
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<div className='grid gap-4 sm:grid-cols-2'>
										<FormField
											control={form.control}
											name='slug'
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														URL Slug *
													</FormLabel>
													<FormControl>
														<div className='flex gap-2'>
															<Input
																{...field}
																placeholder='private-office-4-man'
															/>
															<Button
																type='button'
																variant='outline'
																size='sm'
																onClick={
																	generateSlug
																}
															>
																Generate
															</Button>
														</div>
													</FormControl>
													<FormDescription>
														Used in the URL:
														/spaces/
														{field.value ||
															'your-slug'}
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name='capacity'
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														Capacity *
													</FormLabel>
													<FormControl>
														<Input
															type='number'
															min={1}
															{...field}
														/>
													</FormControl>
													<FormDescription>
														Maximum number of people
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<FormField
										control={form.control}
										name='description'
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Short Description *
												</FormLabel>
												<FormControl>
													<Textarea
														{...field}
														placeholder='Brief description shown in listings...'
														rows={2}
													/>
												</FormControl>
												<FormDescription>
													{field.value?.length || 0}
													/200 characters recommended
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name='fullDescription'
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Full Description
												</FormLabel>
												<FormControl>
													<Textarea
														{...field}
														placeholder='Detailed description shown on the space page...'
														rows={5}
													/>
												</FormControl>
												<FormDescription>
													Shown on the space detail
													page
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>

							{/* Category & Type */}
							<Card>
								<CardHeader>
									<CardTitle>Category & Type</CardTitle>
									<CardDescription>
										How this space is categorized and booked
									</CardDescription>
								</CardHeader>
								<CardContent className='space-y-6'>
									<div className='grid gap-6 sm:grid-cols-2'>
										<FormField
											control={form.control}
											name='category'
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														Category *
													</FormLabel>
													<Select
														onValueChange={
															field.onChange
														}
														value={field.value}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder='Select category' />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{CATEGORY_OPTIONS.map(
																(option) => (
																	<SelectItem
																		key={
																			option.value
																		}
																		value={
																			option.value
																		}
																	>
																		{
																			option.label
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
											name='type'
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														Booking Type *
													</FormLabel>
													<Select
														onValueChange={
															field.onChange
														}
														value={field.value}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder='Select type' />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{TYPE_OPTIONS.map(
																(option) => (
																	<SelectItem
																		key={
																			option.value
																		}
																		value={
																			option.value
																		}
																	>
																		<div>
																			<div className='font-medium'>
																				{
																					option.label
																				}
																			</div>
																			<div className='text-xs text-muted-foreground'>
																				{
																					option.description
																				}
																			</div>
																		</div>
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
								</CardContent>
							</Card>

							{/* Amenities */}
							<Card>
								<CardHeader>
									<CardTitle>Amenities</CardTitle>
									<CardDescription>
										Facilities included with this space
									</CardDescription>
								</CardHeader>
								<CardContent className='space-y-4'>
									<div className='flex flex-wrap gap-2'>
										{amenities.map((amenity, index) => (
											<Badge
												key={index}
												variant='secondary'
												className='pr-1.5 text-sm'
											>
												{amenity}
												<button
													type='button'
													title={`Remove ${amenity}`}
													onClick={() =>
														handleRemoveAmenity(
															amenity
														)
													}
													className='ml-1.5 hover:text-destructive rounded-full'
												>
													<X className='h-3 w-3' />
												</button>
											</Badge>
										))}
									</div>
									<div className='flex gap-2'>
										<Input
											value={newAmenity}
											onChange={(e) =>
												setNewAmenity(e.target.value)
											}
											placeholder='e.g., High-Speed WiFi, Air Conditioning'
											onKeyDown={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													handleAddAmenity();
												}
											}}
										/>
										<Button
											type='button'
											variant='outline'
											onClick={handleAddAmenity}
										>
											<Plus className='h-4 w-4' />
										</Button>
									</div>
									<p className='text-xs text-muted-foreground'>
										Press Enter or click + to add. Common
										amenities: WiFi, Air Conditioning,
										Projector, Whiteboard, Coffee/Tea,
										Printing.
									</p>
								</CardContent>
							</Card>

							{/* Features */}
							<Card>
								<CardHeader>
									<CardTitle>Features</CardTitle>
									<CardDescription>
										Special features or highlights of this
										space
									</CardDescription>
								</CardHeader>
								<CardContent className='space-y-4'>
									<div className='flex flex-wrap gap-2'>
										{features.map((feature, index) => (
											<Badge
												key={index}
												variant='outline'
												className='pr-1.5 text-sm'
											>
												{feature}
												<button
													type='button'
													title={`Remove ${feature}`}
													onClick={() =>
														handleRemoveFeature(
															feature
														)
													}
													className='ml-1.5 hover:text-destructive rounded-full'
												>
													<X className='h-3 w-3' />
												</button>
											</Badge>
										))}
									</div>
									<div className='flex gap-2'>
										<Input
											value={newFeature}
											onChange={(e) =>
												setNewFeature(e.target.value)
											}
											placeholder='e.g., Natural Lighting, Panoramic View'
											onKeyDown={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													handleAddFeature();
												}
											}}
										/>
										<Button
											type='button'
											variant='outline'
											onClick={handleAddFeature}
										>
											<Plus className='h-4 w-4' />
										</Button>
									</div>
									<p className='text-xs text-muted-foreground'>
										Press Enter or click + to add. Features
										highlight what makes this space special.
									</p>
								</CardContent>
							</Card>

							{/* Images */}
							<Card>
								<CardHeader>
									<CardTitle>Images</CardTitle>
									<CardDescription>
										Photos of this space. First image is the
										cover.
									</CardDescription>
								</CardHeader>
								<CardContent className='space-y-4'>
									{images.length > 0 && (
										<div className='grid gap-4 grid-cols-2 md:grid-cols-3'>
											{images.map((image, index) => (
												<div
													key={index}
													className='relative group'
												>
													<div className='relative aspect-video rounded-lg overflow-hidden bg-muted'>
														<Image
															src={image}
															alt={`Space image ${
																index + 1
															}`}
															fill
															className='object-cover'
														/>
														{index === 0 && (
															<Badge className='absolute top-2 left-2 bg-primary'>
																Cover
															</Badge>
														)}
													</div>
													<div className='absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
														{index > 0 && (
															<Button
																type='button'
																size='icon'
																variant='secondary'
																className='h-7 w-7'
																onClick={() =>
																	handleMoveImage(
																		index,
																		'up'
																	)
																}
															>
																<GripVertical className='h-3 w-3 rotate-90' />
															</Button>
														)}
														<Button
															type='button'
															size='icon'
															variant='destructive'
															className='h-7 w-7'
															onClick={() =>
																handleRemoveImage(
																	index
																)
															}
														>
															<Trash2 className='h-3 w-3' />
														</Button>
													</div>
													<p className='text-xs text-muted-foreground mt-1 truncate'>
														{image}
													</p>
												</div>
											))}
										</div>
									)}

									<Separator />

									<div className='space-y-2'>
										<Label>Add Image by URL</Label>
										<div className='flex gap-2'>
											<Input
												value={newImageUrl}
												onChange={(e) =>
													setNewImageUrl(
														e.target.value
													)
												}
												placeholder='https://example.com/image.jpg'
												onKeyDown={(e) => {
													if (e.key === 'Enter') {
														e.preventDefault();
														handleAddImage();
													}
												}}
											/>
											<Button
												type='button'
												variant='outline'
												onClick={handleAddImage}
											>
												<ImagePlus className='h-4 w-4 mr-2' />
												Add
											</Button>
										</div>
										<p className='text-xs text-muted-foreground'>
											Enter the URL of an image to add to
											the gallery.
										</p>
									</div>
								</CardContent>
							</Card>

							{/* Display Settings */}
							<Card>
								<CardHeader>
									<CardTitle>Display Settings</CardTitle>
									<CardDescription>
										Control how this space appears in
										listings
									</CardDescription>
								</CardHeader>
								<CardContent className='space-y-6'>
									<FormField
										control={form.control}
										name='isActive'
										render={({ field }) => (
											<FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
												<div className='space-y-0.5'>
													<FormLabel className='text-base'>
														Active Status
													</FormLabel>
													<FormDescription>
														When inactive, this
														space won't appear in
														public listings
													</FormDescription>
												</div>
												<FormControl>
													<Switch
														checked={field.value}
														onCheckedChange={
															field.onChange
														}
													/>
												</FormControl>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name='sortOrder'
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Sort Order
												</FormLabel>
												<FormControl>
													<Input
														type='number'
														min={0}
														{...field}
													/>
												</FormControl>
												<FormDescription>
													Lower numbers appear first
													in listings (0 = top)
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>

							{/* Submit Button (Bottom) */}
							<div className='flex justify-end gap-4 pt-4'>
								<Button
									type='button'
									variant='outline'
									onClick={() =>
										handleNavigation(
											`/admin/spaces/${space.id}`
										)
									}
								>
									Cancel
								</Button>
								<Button
									type='submit'
									disabled={isPending}
								>
									{isPending ? (
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									) : (
										<Save className='mr-2 h-4 w-4' />
									)}
									Save Changes
								</Button>
							</div>
						</form>
					</Form>
				</div>
			</section>

			{/* Unsaved Changes Dialog */}
			<AlertDialog
				open={showLeaveDialog}
				onOpenChange={setShowLeaveDialog}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
						<AlertDialogDescription>
							You have unsaved changes. Are you sure you want to
							leave? Your changes will be lost.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							onClick={() => setPendingNavigation(null)}
						>
							Stay
						</AlertDialogCancel>
						<AlertDialogAction onClick={confirmNavigation}>
							Leave
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

// Skeleton loader
function EditSpaceSkeleton() {
	return (
		<div className='min-h-screen bg-background'>
			<section className='bg-secondary px-4 py-6 border-b'>
				<div className='container mx-auto'>
					<div className='flex items-center gap-4'>
						<Skeleton className='h-10 w-10 rounded' />
						<div className='space-y-2'>
							<div className='flex gap-2'>
								<Skeleton className='h-5 w-16' />
								<Skeleton className='h-5 w-20' />
							</div>
							<Skeleton className='h-6 w-48' />
						</div>
					</div>
				</div>
			</section>
			<section className='px-4 py-8'>
				<div className='container mx-auto max-w-4xl space-y-8'>
					<Skeleton className='h-64 w-full rounded-lg' />
					<Skeleton className='h-48 w-full rounded-lg' />
					<Skeleton className='h-32 w-full rounded-lg' />
				</div>
			</section>
		</div>
	);
}
