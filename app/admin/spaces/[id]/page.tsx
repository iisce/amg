'use client';

import { useState, useEffect, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
	ArrowLeft,
	Edit,
	Trash2,
	Users,
	Clock,
	DollarSign,
	Settings,
	Plus,
	MoreVertical,
	Eye,
	Copy,
	CheckCircle2,
	XCircle,
	Building2,
	Loader2,
	ImageIcon,
	Star,
	TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import {
	getSpaceById,
	updateSpace,
	deleteSpace,
	createPricingPlan,
	updatePricingPlan,
	deletePricingPlan,
} from '@/actions/spaces';
import type { SpaceWithPricing } from '@/lib/types';
import type { PricingPlan, PlanType } from '@prisma/client';
import { format } from 'date-fns';

// Helper to format price from kobo
const formatPrice = (kobo: number) => {
	return `₦${(kobo / 100).toLocaleString()}`;
};

// Category display names
const CATEGORY_NAMES: Record<string, string> = {
	WORKSPACE: 'Workspace',
	OFFICE: 'Private Office',
	MEETING: 'Meeting Room',
	CREATIVE: 'Creative Studio',
	EVENT: 'Event Space',
	SOCIAL: 'Social/Lounge',
};

// Type display names
const TYPE_NAMES: Record<string, string> = {
	SUBSCRIPTION: 'Subscription',
	BOOKING: 'Hourly Booking',
};

// Plan type display names
const PLAN_TYPE_NAMES: Record<PlanType, string> = {
	DAILY: 'Daily',
	WEEKLY: 'Weekly',
	MONTHLY: 'Monthly',
	HOURLY: 'Hourly',
	CUSTOM: 'Custom',
};

export default function SpaceDetailPage() {
	const params = useParams();
	const router = useRouter();
	const spaceId = params.id as string;

	const [space, setSpace] = useState<SpaceWithPricing | null>(null);
	const [loading, setLoading] = useState(true);
	const [isPending, startTransition] = useTransition();
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [addPlanDialogOpen, setAddPlanDialogOpen] = useState(false);
	const [editPlanDialogOpen, setEditPlanDialogOpen] = useState(false);
	const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
	const [deletePlanDialogOpen, setDeletePlanDialogOpen] = useState(false);
	const [selectedImage, setSelectedImage] = useState<string | null>(null);

	// Plan form state
	const [planForm, setPlanForm] = useState({
		name: '',
		description: '',
		price: '',
		duration: '',
		unit: 'hour',
		type: 'HOURLY' as PlanType,
	});

	useEffect(() => {
		fetchSpace();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [spaceId]);

	const fetchSpace = async () => {
		setLoading(true);
		const result = await getSpaceById(spaceId);
		if (result.success && result.data && !Array.isArray(result.data)) {
			setSpace(result.data);
		} else {
			toast.error('Space not found');
			router.push('/admin/spaces');
		}
		setLoading(false);
	};

	const handleToggleActive = () => {
		if (!space) return;

		startTransition(async () => {
			const result = await updateSpace(space.id, {
				isActive: !space.isActive,
			});
			if (result.success) {
				setSpace({ ...space, isActive: !space.isActive });
				toast.success(
					`Space ${!space.isActive ? 'activated' : 'deactivated'}`
				);
			} else {
				toast.error(result.message);
			}
		});
	};

	const handleDelete = () => {
		if (!space) return;

		startTransition(async () => {
			const result = await deleteSpace(space.id);
			if (result.success) {
				toast.success('Space deleted successfully');
				router.push('/admin/spaces');
			} else {
				toast.error(result.message);
			}
			setDeleteDialogOpen(false);
		});
	};

	const handleAddPlan = () => {
		if (!space) return;

		startTransition(async () => {
			const result = await createPricingPlan({
				spaceId: space.id,
				name: planForm.name,
				description: planForm.description || undefined,
				price: Math.round(parseFloat(planForm.price) * 100), // Convert to kobo
				duration: planForm.duration
					? parseInt(planForm.duration)
					: undefined,
				unit: planForm.unit,
				type: planForm.type,
			});

			if (result.success) {
				toast.success('Pricing plan added');
				setAddPlanDialogOpen(false);
				resetPlanForm();
				fetchSpace();
			} else {
				toast.error(result.message);
			}
		});
	};

	const handleEditPlan = () => {
		if (!selectedPlan) return;

		startTransition(async () => {
			const result = await updatePricingPlan(selectedPlan.id, {
				name: planForm.name,
				description: planForm.description || undefined,
				price: Math.round(parseFloat(planForm.price) * 100),
				duration: planForm.duration
					? parseInt(planForm.duration)
					: undefined,
				unit: planForm.unit,
				type: planForm.type,
			});

			if (result.success) {
				toast.success('Pricing plan updated');
				setEditPlanDialogOpen(false);
				setSelectedPlan(null);
				resetPlanForm();
				fetchSpace();
			} else {
				toast.error(result.message);
			}
		});
	};

	const handleDeletePlan = () => {
		if (!selectedPlan) return;

		startTransition(async () => {
			const result = await deletePricingPlan(selectedPlan.id);
			if (result.success) {
				toast.success('Pricing plan deleted');
				setDeletePlanDialogOpen(false);
				setSelectedPlan(null);
				fetchSpace();
			} else {
				toast.error(result.message);
			}
		});
	};

	const openEditPlanDialog = (plan: PricingPlan) => {
		setSelectedPlan(plan);
		setPlanForm({
			name: plan.name,
			description: plan.description || '',
			price: (plan.price / 100).toString(),
			duration: plan.duration?.toString() || '',
			unit: plan.unit,
			type: plan.type,
		});
		setEditPlanDialogOpen(true);
	};

	const resetPlanForm = () => {
		setPlanForm({
			name: '',
			description: '',
			price: '',
			duration: '',
			unit: 'hour',
			type: 'HOURLY',
		});
	};

	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		toast.success(`${label} copied to clipboard`);
	};

	if (loading) {
		return <SpaceDetailSkeleton />;
	}

	if (!space) {
		return null;
	}

	return (
		<div className='min-h-screen bg-background'>
			{/* Header */}
			<section className='bg-secondary text-secondary-foreground px-4 py-6 border-b'>
				<div className='container mx-auto'>
					<Button
						variant='ghost'
						asChild
						className='mb-4 text-secondary-foreground/70 hover:text-secondary-foreground'
					>
						<Link href='/admin/spaces'>
							<ArrowLeft className='mr-2 h-4 w-4' />
							Back to Spaces
						</Link>
					</Button>
					<div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
						<div className='flex items-start gap-4'>
							<div className='relative h-20 w-20 rounded-lg overflow-hidden bg-muted shrink-0'>
								{space.images?.[0] ? (
									<Image
										src={space.images[0]}
										alt={space.name}
										fill
										className='object-cover'
									/>
								) : (
									<div className='h-full w-full flex items-center justify-center'>
										<Building2 className='h-8 w-8 text-muted-foreground' />
									</div>
								)}
							</div>
							<div>
								<div className='flex items-center gap-2 mb-1'>
									<Badge className='bg-red-600 text-white'>
										Admin
									</Badge>
									<Badge
										variant={
											space.isActive
												? 'default'
												: 'secondary'
										}
									>
										{space.isActive ? 'Active' : 'Inactive'}
									</Badge>
									<Badge variant='outline'>
										{TYPE_NAMES[space.type]}
									</Badge>
								</div>
								<h1 className='text-2xl font-bold'>
									{space.name}
								</h1>
								<p className='text-sm text-secondary-foreground/70 mt-1'>
									{CATEGORY_NAMES[space.category]} • Capacity:{' '}
									{space.capacity} people
								</p>
							</div>
						</div>
						<div className='flex flex-wrap gap-2'>
							<Button
								variant='outline'
								size='sm'
								className='bg-transparent'
								onClick={() =>
									window.open(
										`/spaces/${space.slug}`,
										'_blank'
									)
								}
							>
								<Eye className='mr-2 h-4 w-4' />
								View Public
							</Button>
							<Button
								variant='outline'
								size='sm'
								className='bg-transparent'
								asChild
							>
								<Link href={`/admin/spaces/${space.id}/edit`}>
									<Edit className='mr-2 h-4 w-4' />
									Edit Space
								</Link>
							</Button>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant='outline'
										size='sm'
										className='bg-transparent'
									>
										<Settings className='mr-2 h-4 w-4' />
										Actions
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='end'>
									<DropdownMenuItem
										onClick={() =>
											copyToClipboard(
												space.id,
												'Space ID'
											)
										}
									>
										<Copy className='mr-2 h-4 w-4' />
										Copy Space ID
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() =>
											copyToClipboard(
												space.slug,
												'Space Slug'
											)
										}
									>
										<Copy className='mr-2 h-4 w-4' />
										Copy Slug
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={handleToggleActive}
										disabled={isPending}
									>
										{space.isActive ? (
											<>
												<XCircle className='mr-2 h-4 w-4' />
												Deactivate Space
											</>
										) : (
											<>
												<CheckCircle2 className='mr-2 h-4 w-4' />
												Activate Space
											</>
										)}
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										className='text-destructive focus:text-destructive'
										onClick={() =>
											setDeleteDialogOpen(true)
										}
									>
										<Trash2 className='mr-2 h-4 w-4' />
										Delete Space
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				</div>
			</section>

			{/* Main Content */}
			<section className='px-4 py-8'>
				<div className='container mx-auto'>
					<Tabs
						defaultValue='overview'
						className='space-y-6'
					>
						<TabsList className='grid w-full grid-cols-4 lg:w-auto lg:inline-grid'>
							<TabsTrigger value='overview'>Overview</TabsTrigger>
							<TabsTrigger value='pricing'>
								Pricing Plans
							</TabsTrigger>
							<TabsTrigger value='gallery'>Gallery</TabsTrigger>
							<TabsTrigger value='settings'>Settings</TabsTrigger>
						</TabsList>

						{/* Overview Tab */}
						<TabsContent
							value='overview'
							className='space-y-6'
						>
							<div className='grid gap-6 md:grid-cols-3'>
								{/* Quick Stats */}
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Capacity
										</CardTitle>
										<Users className='h-4 w-4 text-muted-foreground' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{space.capacity}
										</div>
										<p className='text-xs text-muted-foreground'>
											Maximum people
										</p>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Pricing Plans
										</CardTitle>
										<DollarSign className='h-4 w-4 text-muted-foreground' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{space.pricingPlans?.length || 0}
										</div>
										<p className='text-xs text-muted-foreground'>
											Active plans
										</p>
									</CardContent>
								</Card>
								<Card>
									<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
										<CardTitle className='text-sm font-medium'>
											Starting Price
										</CardTitle>
										<TrendingUp className='h-4 w-4 text-muted-foreground' />
									</CardHeader>
									<CardContent>
										<div className='text-2xl font-bold'>
											{space.pricingPlans?.length > 0
												? formatPrice(
														Math.min(
															...space.pricingPlans.map(
																(p) => p.price
															)
														)
												  )
												: '—'}
										</div>
										<p className='text-xs text-muted-foreground'>
											Lowest price
										</p>
									</CardContent>
								</Card>
							</div>

							<div className='grid gap-6 lg:grid-cols-2'>
								{/* Description */}
								<Card>
									<CardHeader>
										<CardTitle>Description</CardTitle>
									</CardHeader>
									<CardContent className='space-y-4'>
										<p className='text-muted-foreground'>
											{space.description}
										</p>
										{space.fullDescription && (
											<>
												<Separator />
												<div>
													<h4 className='font-medium mb-2'>
														Full Description
													</h4>
													<p className='text-sm text-muted-foreground whitespace-pre-line'>
														{space.fullDescription}
													</p>
												</div>
											</>
										)}
									</CardContent>
								</Card>

								{/* Amenities & Features */}
								<Card>
									<CardHeader>
										<CardTitle>
											Amenities & Features
										</CardTitle>
									</CardHeader>
									<CardContent className='space-y-4'>
										{space.amenities?.length > 0 && (
											<div>
												<h4 className='text-sm font-medium mb-2'>
													Amenities
												</h4>
												<div className='flex flex-wrap gap-2'>
													{space.amenities.map(
														(amenity, i) => (
															<Badge
																key={i}
																variant='secondary'
															>
																{amenity}
															</Badge>
														)
													)}
												</div>
											</div>
										)}
										{space.features?.length > 0 && (
											<>
												<Separator />
												<div>
													<h4 className='text-sm font-medium mb-2'>
														Features
													</h4>
													<div className='flex flex-wrap gap-2'>
														{space.features.map(
															(feature, i) => (
																<Badge
																	key={i}
																	variant='outline'
																>
																	{feature}
																</Badge>
															)
														)}
													</div>
												</div>
											</>
										)}
										{!space.amenities?.length &&
											!space.features?.length && (
												<p className='text-sm text-muted-foreground'>
													No amenities or features
													added yet.
												</p>
											)}
									</CardContent>
								</Card>
							</div>

							{/* Space Details */}
							<Card>
								<CardHeader>
									<CardTitle>Space Details</CardTitle>
								</CardHeader>
								<CardContent>
									<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
										<div className='space-y-1'>
											<p className='text-sm text-muted-foreground'>
												Space ID
											</p>
											<p className='text-sm font-medium font-mono'>
												{space.id}
											</p>
										</div>
										<div className='space-y-1'>
											<p className='text-sm text-muted-foreground'>
												Slug
											</p>
											<p className='text-sm font-medium font-mono'>
												{space.slug}
											</p>
										</div>
										<div className='space-y-1'>
											<p className='text-sm text-muted-foreground'>
												Created
											</p>
											<p className='text-sm font-medium'>
												{format(
													new Date(space.createdAt),
													'PPP'
												)}
											</p>
										</div>
										<div className='space-y-1'>
											<p className='text-sm text-muted-foreground'>
												Last Updated
											</p>
											<p className='text-sm font-medium'>
												{format(
													new Date(space.updatedAt),
													'PPP'
												)}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						{/* Pricing Plans Tab */}
						<TabsContent
							value='pricing'
							className='space-y-6'
						>
							<div className='flex items-center justify-between'>
								<div>
									<h2 className='text-lg font-semibold'>
										Pricing Plans
									</h2>
									<p className='text-sm text-muted-foreground'>
										Manage pricing options for this space
									</p>
								</div>
								<Dialog
									open={addPlanDialogOpen}
									onOpenChange={setAddPlanDialogOpen}
								>
									<DialogTrigger asChild>
										<Button onClick={resetPlanForm}>
											<Plus className='mr-2 h-4 w-4' />
											Add Plan
										</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>
												Add Pricing Plan
											</DialogTitle>
											<DialogDescription>
												Create a new pricing option for{' '}
												{space.name}
											</DialogDescription>
										</DialogHeader>
										<PlanForm
											form={planForm}
											setForm={setPlanForm}
											spaceType={space.type}
										/>
										<DialogFooter>
											<Button
												variant='outline'
												onClick={() =>
													setAddPlanDialogOpen(false)
												}
											>
												Cancel
											</Button>
											<Button
												onClick={handleAddPlan}
												disabled={isPending}
											>
												{isPending && (
													<Loader2 className='mr-2 h-4 w-4 animate-spin' />
												)}
												Add Plan
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>
							</div>

							{space.pricingPlans?.length > 0 ? (
								<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
									{space.pricingPlans.map((plan) => (
										<Card
											key={plan.id}
											className={
												!plan.isActive
													? 'opacity-60'
													: ''
											}
										>
											<CardHeader className='pb-3'>
												<div className='flex items-start justify-between'>
													<div>
														<CardTitle className='text-lg'>
															{plan.name}
														</CardTitle>
														<CardDescription>
															{
																PLAN_TYPE_NAMES[
																	plan.type
																]
															}{' '}
															Plan
														</CardDescription>
													</div>
													<DropdownMenu>
														<DropdownMenuTrigger
															asChild
														>
															<Button
																variant='ghost'
																size='icon'
																className='h-8 w-8'
															>
																<MoreVertical className='h-4 w-4' />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align='end'>
															<DropdownMenuItem
																onClick={() =>
																	openEditPlanDialog(
																		plan
																	)
																}
															>
																<Edit className='mr-2 h-4 w-4' />
																Edit Plan
															</DropdownMenuItem>
															<DropdownMenuSeparator />
															<DropdownMenuItem
																className='text-destructive'
																onClick={() => {
																	setSelectedPlan(
																		plan
																	);
																	setDeletePlanDialogOpen(
																		true
																	);
																}}
															>
																<Trash2 className='mr-2 h-4 w-4' />
																Delete Plan
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
											</CardHeader>
											<CardContent className='space-y-3'>
												<div className='flex items-baseline gap-1'>
													<span className='text-3xl font-bold'>
														{formatPrice(
															plan.price
														)}
													</span>
													<span className='text-muted-foreground'>
														/{plan.unit}
													</span>
												</div>
												{plan.description && (
													<p className='text-sm text-muted-foreground'>
														{plan.description}
													</p>
												)}
												{plan.duration && (
													<p className='text-sm'>
														<Clock className='inline h-4 w-4 mr-1' />
														{plan.duration}{' '}
														{plan.unit}
														{plan.duration > 1
															? 's'
															: ''}
													</p>
												)}
												<div className='flex items-center gap-2 pt-2'>
													<Badge
														variant={
															plan.isActive
																? 'default'
																: 'secondary'
														}
													>
														{plan.isActive
															? 'Active'
															: 'Inactive'}
													</Badge>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							) : (
								<Card>
									<CardContent className='flex flex-col items-center justify-center py-12'>
										<DollarSign className='h-12 w-12 text-muted-foreground mb-4' />
										<h3 className='text-lg font-medium'>
											No Pricing Plans
										</h3>
										<p className='text-sm text-muted-foreground text-center max-w-sm mt-1'>
											Add pricing plans to make this space
											available for booking or
											subscription.
										</p>
										<Button
											className='mt-4'
											onClick={() => {
												resetPlanForm();
												setAddPlanDialogOpen(true);
											}}
										>
											<Plus className='mr-2 h-4 w-4' />
											Add First Plan
										</Button>
									</CardContent>
								</Card>
							)}
						</TabsContent>

						{/* Gallery Tab */}
						<TabsContent
							value='gallery'
							className='space-y-6'
						>
							<div className='flex items-center justify-between'>
								<div>
									<h2 className='text-lg font-semibold'>
										Image Gallery
									</h2>
									<p className='text-sm text-muted-foreground'>
										{space.images?.length || 0} images
									</p>
								</div>
								<Button
									variant='outline'
									asChild
								>
									<Link
										href={`/admin/spaces/${space.id}/edit`}
									>
										<Edit className='mr-2 h-4 w-4' />
										Manage Images
									</Link>
								</Button>
							</div>

							{space.images?.length > 0 ? (
								<>
									<div className='grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
										{space.images.map((image, index) => (
											<div
												key={index}
												className='relative aspect-video rounded-lg overflow-hidden bg-muted group cursor-pointer'
												onClick={() =>
													setSelectedImage(image)
												}
											>
												<Image
													src={image}
													alt={`${
														space.name
													} - Image ${index + 1}`}
													fill
													className='object-cover transition-transform group-hover:scale-105'
												/>
												{index === 0 && (
													<Badge className='absolute top-2 left-2'>
														<Star className='h-3 w-3 mr-1' />
														Cover
													</Badge>
												)}
												<div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
													<Eye className='h-6 w-6 text-white' />
												</div>
											</div>
										))}
									</div>

									{/* Image Preview Dialog */}
									<Dialog
										open={!!selectedImage}
										onOpenChange={() =>
											setSelectedImage(null)
										}
									>
										<DialogContent className='max-w-4xl'>
											<DialogHeader>
												<DialogTitle>
													Image Preview
												</DialogTitle>
											</DialogHeader>
											{selectedImage && (
												<div className='relative aspect-video rounded-lg overflow-hidden'>
													<Image
														src={selectedImage}
														alt='Preview'
														fill
														className='object-contain'
													/>
												</div>
											)}
										</DialogContent>
									</Dialog>
								</>
							) : (
								<Card>
									<CardContent className='flex flex-col items-center justify-center py-12'>
										<ImageIcon className='h-12 w-12 text-muted-foreground mb-4' />
										<h3 className='text-lg font-medium'>
											No Images
										</h3>
										<p className='text-sm text-muted-foreground text-center max-w-sm mt-1'>
											Add images to showcase this space to
											potential customers.
										</p>
										<Button
											className='mt-4'
											variant='outline'
											asChild
										>
											<Link
												href={`/admin/spaces/${space.id}/edit`}
											>
												<Plus className='mr-2 h-4 w-4' />
												Add Images
											</Link>
										</Button>
									</CardContent>
								</Card>
							)}
						</TabsContent>

						{/* Settings Tab */}
						<TabsContent
							value='settings'
							className='space-y-6'
						>
							<Card>
								<CardHeader>
									<CardTitle>Space Settings</CardTitle>
									<CardDescription>
										Configure space availability and display
										options
									</CardDescription>
								</CardHeader>
								<CardContent className='space-y-6'>
									<div className='flex items-center justify-between'>
										<div className='space-y-0.5'>
											<Label>Active Status</Label>
											<p className='text-sm text-muted-foreground'>
												When inactive, this space won't
												appear in public listings
											</p>
										</div>
										<Switch
											checked={space.isActive}
											onCheckedChange={handleToggleActive}
											disabled={isPending}
										/>
									</div>
									<Separator />
									<div className='flex items-center justify-between'>
										<div className='space-y-0.5'>
											<Label>Sort Order</Label>
											<p className='text-sm text-muted-foreground'>
												Display order in listings (lower
												= first)
											</p>
										</div>
										<Badge variant='outline'>
											Position {space.sortOrder}
										</Badge>
									</div>
								</CardContent>
							</Card>

							<Card className='border-destructive'>
								<CardHeader>
									<CardTitle className='text-destructive'>
										Danger Zone
									</CardTitle>
									<CardDescription>
										Irreversible actions that affect this
										space
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className='flex items-center justify-between'>
										<div className='space-y-0.5'>
											<Label>Delete Space</Label>
											<p className='text-sm text-muted-foreground'>
												Permanently remove this space
												and all its data
											</p>
										</div>
										<Button
											variant='destructive'
											size='sm'
											onClick={() =>
												setDeleteDialogOpen(true)
											}
										>
											<Trash2 className='mr-2 h-4 w-4' />
											Delete
										</Button>
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</section>

			{/* Edit Plan Dialog */}
			<Dialog
				open={editPlanDialogOpen}
				onOpenChange={setEditPlanDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Pricing Plan</DialogTitle>
						<DialogDescription>
							Update the pricing plan details
						</DialogDescription>
					</DialogHeader>
					<PlanForm
						form={planForm}
						setForm={setPlanForm}
						spaceType={space.type}
					/>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setEditPlanDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleEditPlan}
							disabled={isPending}
						>
							{isPending && (
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
							)}
							Save Changes
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Space Dialog */}
			<AlertDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Space</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete &ldquo;{space.name}
							&rdquo;? This action cannot be undone. All
							associated pricing plans will also be deleted.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
							disabled={isPending}
						>
							{isPending && (
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
							)}
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Delete Plan Dialog */}
			<AlertDialog
				open={deletePlanDialogOpen}
				onOpenChange={setDeletePlanDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Pricing Plan</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete &ldquo;
							{selectedPlan?.name}&rdquo;? This action cannot be
							undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeletePlan}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
							disabled={isPending}
						>
							{isPending && (
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
							)}
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

// Plan Form Component
function PlanForm({
	form,
	setForm,
	spaceType,
}: {
	form: {
		name: string;
		description: string;
		price: string;
		duration: string;
		unit: string;
		type: PlanType;
	};
	setForm: (form: {
		name: string;
		description: string;
		price: string;
		duration: string;
		unit: string;
		type: PlanType;
	}) => void;
	spaceType: string;
}) {
	return (
		<div className='space-y-4 py-4'>
			<div className='space-y-2'>
				<Label htmlFor='planName'>Plan Name *</Label>
				<Input
					id='planName'
					value={form.name}
					onChange={(e) => setForm({ ...form, name: e.target.value })}
					placeholder='e.g., Standard, Premium, Weekend'
				/>
			</div>
			<div className='space-y-2'>
				<Label htmlFor='planDescription'>Description</Label>
				<Textarea
					id='planDescription'
					value={form.description}
					onChange={(e) =>
						setForm({ ...form, description: e.target.value })
					}
					placeholder='Brief description of what this plan includes'
					rows={2}
				/>
			</div>
			<div className='grid gap-4 sm:grid-cols-2'>
				<div className='space-y-2'>
					<Label htmlFor='planPrice'>Price (₦) *</Label>
					<Input
						id='planPrice'
						type='number'
						min='0'
						step='0.01'
						value={form.price}
						onChange={(e) =>
							setForm({ ...form, price: e.target.value })
						}
						placeholder='0.00'
					/>
				</div>
				<div className='space-y-2'>
					<Label htmlFor='planType'>Plan Type *</Label>
					<Select
						value={form.type}
						onValueChange={(value: PlanType) =>
							setForm({ ...form, type: value })
						}
					>
						<SelectTrigger id='planType'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{spaceType === 'BOOKING' ? (
								<>
									<SelectItem value='HOURLY'>
										Hourly
									</SelectItem>
									<SelectItem value='SESSION'>
										Session
									</SelectItem>
									<SelectItem value='DAILY'>Daily</SelectItem>
								</>
							) : (
								<>
									<SelectItem value='DAILY'>Daily</SelectItem>
									<SelectItem value='WEEKLY'>
										Weekly
									</SelectItem>
									<SelectItem value='MONTHLY'>
										Monthly
									</SelectItem>
								</>
							)}
						</SelectContent>
					</Select>
				</div>
			</div>
			<div className='grid gap-4 sm:grid-cols-2'>
				<div className='space-y-2'>
					<Label htmlFor='planUnit'>Pricing Unit *</Label>
					<Select
						value={form.unit}
						onValueChange={(value) =>
							setForm({ ...form, unit: value })
						}
					>
						<SelectTrigger id='planUnit'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='hour'>Per Hour</SelectItem>
							<SelectItem value='session'>Per Session</SelectItem>
							<SelectItem value='day'>Per Day</SelectItem>
							<SelectItem value='week'>Per Week</SelectItem>
							<SelectItem value='month'>Per Month</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className='space-y-2'>
					<Label htmlFor='planDuration'>Duration (optional)</Label>
					<Input
						id='planDuration'
						type='number'
						min='1'
						value={form.duration}
						onChange={(e) =>
							setForm({ ...form, duration: e.target.value })
						}
						placeholder='e.g., 2 (hours)'
					/>
				</div>
			</div>
		</div>
	);
}

// Skeleton loader
function SpaceDetailSkeleton() {
	return (
		<div className='min-h-screen bg-background'>
			<section className='bg-secondary px-4 py-6 border-b'>
				<div className='container mx-auto'>
					<Skeleton className='h-9 w-32 mb-4' />
					<div className='flex items-start gap-4'>
						<Skeleton className='h-20 w-20 rounded-lg' />
						<div className='space-y-2'>
							<div className='flex gap-2'>
								<Skeleton className='h-5 w-16' />
								<Skeleton className='h-5 w-16' />
							</div>
							<Skeleton className='h-8 w-48' />
							<Skeleton className='h-4 w-32' />
						</div>
					</div>
				</div>
			</section>
			<section className='px-4 py-8'>
				<div className='container mx-auto'>
					<Skeleton className='h-10 w-96 mb-6' />
					<div className='grid gap-6 md:grid-cols-3'>
						<Skeleton className='h-32' />
						<Skeleton className='h-32' />
						<Skeleton className='h-32' />
					</div>
				</div>
			</section>
		</div>
	);
}
