'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
	Plus,
	Edit,
	Users,
	DollarSign,
	LayoutGrid,
	Calendar,
	CalendarDays,
	UserCog,
	FileText,
	QrCode,
	Loader2,
	Package,
	ShoppingCart,
} from 'lucide-react';
import { toast } from 'sonner';
import { updateSpace } from '@/actions';
import type { SpaceWithPricing } from '@/lib/types';

interface AdminSpacesClientProps {
	spaces: SpaceWithPricing[];
}

// Helper to format price from kobo
const formatPrice = (kobo: number) => {
	return (kobo / 100).toLocaleString();
};

export default function AdminSpacesClient({
	spaces: initialSpaces,
}: AdminSpacesClientProps) {
	const router = useRouter();
	const [spaces, setSpaces] = useState(initialSpaces);
	const [isPending, startTransition] = useTransition();
	const [togglingId, setTogglingId] = useState<string | null>(null);

	const toggleSpaceStatus = (id: string, currentStatus: boolean) => {
		setTogglingId(id);
		startTransition(async () => {
			const result = await updateSpace(id, { isActive: !currentStatus });

			if (result.success) {
				setSpaces((prev) =>
					prev.map((space) =>
						space.id === id
							? { ...space, isActive: !currentStatus }
							: space
					)
				);
				toast.success(
					`Space ${
						!currentStatus ? 'activated' : 'deactivated'
					} successfully`
				);
				router.refresh();
			} else {
				toast.error(result.message || 'Failed to update space status');
			}
			setTogglingId(null);
		});
	};

	// Get the lowest price for a space
	const getLowestPrice = (space: SpaceWithPricing) => {
		if (!space.pricingPlans || space.pricingPlans.length === 0) return 0;
		return Math.min(...space.pricingPlans.map((p) => p.price));
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
							</div>
							<h1 className='text-2xl font-bold'>
								Space Management
							</h1>
						</div>
						<Button asChild>
							<Link href='/admin/spaces/new'>
								<Plus className='mr-2 h-4 w-4' />
								Add New Space
							</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Navigation */}
			<section className='border-b bg-muted/30'>
				<div className='container mx-auto px-4'>
					<nav className='flex gap-1 overflow-x-auto'>
						<Link
							href='/admin/dashboard'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<LayoutGrid className='h-4 w-4' />
							Overview
						</Link>
						<Link
							href='/admin/bookings'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<Calendar className='h-4 w-4' />
							Bookings
						</Link>
						<Link
							href='/admin/spaces'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-primary bg-background'
						>
							<LayoutGrid className='h-4 w-4' />
							Spaces
						</Link>
						<Link
							href='/admin/members'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<UserCog className='h-4 w-4' />
							Members
						</Link>
						<Link
							href='/admin/tours'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<CalendarDays className='h-4 w-4' />
							Tours
						</Link>
						<Link
							href='/admin/inventory'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<Package className='h-4 w-4' />
							Inventory
						</Link>
						<Link
							href='/admin/shop'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<ShoppingCart className='h-4 w-4' />
							Shop
						</Link>
						<Link
							href='/admin/reports'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<FileText className='h-4 w-4' />
							Reports
						</Link>
						<Link
							href='/admin/scanner'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<QrCode className='h-4 w-4' />
							QR Scanner
						</Link>
					</nav>
				</div>
			</section>

			{/* Content */}
			<section className='px-4 py-8'>
				<div className='container mx-auto'>
					<div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
						{spaces.length > 0 ? (
							spaces.map((space) => (
								<Card
									key={space.id}
									className='overflow-hidden pt-0'
								>
									<div className='relative aspect-video'>
										<Image
											src={
												space.images[0] ||
												'/placeholder.jpg'
											}
											alt={space.name}
											fill
											className='object-cover'
										/>
										<div className='absolute top-2 right-2'>
											<Badge
												variant={
													space.isActive
														? 'default'
														: 'secondary'
												}
											>
												{space.isActive
													? 'Active'
													: 'Inactive'}
											</Badge>
										</div>
									</div>
									<CardContent className='p-4 space-y-4'>
										<div>
											<h3 className='font-bold text-lg'>
												{space.name}
											</h3>
											<p className='text-sm text-muted-foreground line-clamp-2'>
												{space.description}
											</p>
										</div>

										<div className='flex items-center justify-between text-sm'>
											<div className='flex items-center gap-1'>
												<Users className='h-4 w-4 text-muted-foreground' />
												<span>
													Capacity: {space.capacity}
												</span>
											</div>
											<div className='flex items-center gap-1'>
												<DollarSign className='h-4 w-4 text-muted-foreground' />
												<span>
													From ₦
													{formatPrice(
														getLowestPrice(space)
													)}
												</span>
											</div>
										</div>

										<div className='flex items-center justify-between pt-2 border-t'>
											<div className='flex items-center gap-2'>
												{togglingId === space.id ? (
													<Loader2 className='h-4 w-4 animate-spin' />
												) : (
													<Switch
														checked={space.isActive}
														onCheckedChange={() =>
															toggleSpaceStatus(
																space.id,
																space.isActive
															)
														}
														disabled={isPending}
													/>
												)}
												<span className='text-sm text-muted-foreground'>
													{space.isActive
														? 'Active'
														: 'Inactive'}
												</span>
											</div>
											<Button
												size='sm'
												variant='outline'
												asChild
											>
												<Link
													href={`/admin/spaces/${space.id}`}
												>
													<Edit className='mr-2 h-4 w-4' />
													Edit
												</Link>
											</Button>
										</div>
									</CardContent>
								</Card>
							))
						) : (
							<div className='col-span-full'>
								<Card>
									<CardContent className='py-12 text-center'>
										<LayoutGrid className='h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50' />
										<h3 className='text-lg font-semibold mb-2'>
											No spaces found
										</h3>
										<p className='text-muted-foreground mb-4'>
											Get started by adding your first
											space
										</p>
										<Button asChild>
											<Link href='/admin/spaces/new'>
												<Plus className='mr-2 h-4 w-4' />
												Add New Space
											</Link>
										</Button>
									</CardContent>
								</Card>
							</div>
						)}
					</div>
				</div>
			</section>
		</div>
	);
}
