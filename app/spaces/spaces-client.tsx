'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Users, Clock, Calendar, ArrowRight, Eye } from 'lucide-react';
import type { SpaceWithPricing } from '@/actions/spaces';

interface SpacesClientProps {
	spaces: SpaceWithPricing[];
	defaultTab?: 'subscription' | 'booking';
}

export default function SpacesClient({
	spaces,
	defaultTab = 'subscription',
}: SpacesClientProps) {
	const [sortBy, setSortBy] = useState('name');

	// Separate spaces by type
	const subscriptionSpaces = spaces.filter((s) => s.type === 'SUBSCRIPTION');
	const bookingSpaces = spaces.filter((s) => s.type === 'BOOKING');

	const sortSpaces = (spacesToSort: SpaceWithPricing[]) => {
		return [...spacesToSort].sort((a, b) => {
			if (sortBy === 'name') return a.name.localeCompare(b.name);
			if (sortBy === 'price-low') {
				const priceA = a.pricingPlans[0]?.price ?? 0;
				const priceB = b.pricingPlans[0]?.price ?? 0;
				return priceA - priceB;
			}
			if (sortBy === 'price-high') {
				const priceA = a.pricingPlans[0]?.price ?? 0;
				const priceB = b.pricingPlans[0]?.price ?? 0;
				return priceB - priceA;
			}
			if (sortBy === 'capacity') return b.capacity - a.capacity;
			return a.sortOrder - b.sortOrder;
		});
	};

	// Helper to format price from kobo
	const formatPrice = (kobo: number) => {
		return (kobo / 100).toLocaleString();
	};

	// Get the lowest price from pricing plans
	const getLowestPrice = (space: SpaceWithPricing) => {
		if (!space.pricingPlans.length) return null;
		const sorted = [...space.pricingPlans].sort(
			(a, b) => a.price - b.price
		);
		return sorted[0];
	};

	const renderSpaceCard = (space: SpaceWithPricing) => {
		const isSubscription = space.type === 'SUBSCRIPTION';
		const lowestPlan = getLowestPrice(space);
		const href = isSubscription
			? `/spaces/${space.id}/subscribe`
			: `/spaces/${space.id}/book`;

		return (
			<Card
				key={space.id}
				className='overflow-hidden hover:shadow-lg transition-shadow group pt-0'
			>
				<div className='relative aspect-4/3'>
					<Image
						src={space.images?.[0] || '/placeholder.svg'}
						alt={space.name}
						fill
						className='object-cover group-hover:scale-105 transition-transform duration-300'
					/>
					<div className='absolute top-3 left-3'>
						<Badge
							className={
								isSubscription
									? 'bg-primary text-primary-foreground'
									: 'bg-secondary text-secondary-foreground'
							}
						>
							{isSubscription ? 'Subscription' : 'Hourly Booking'}
						</Badge>
					</div>
				</div>
				<CardContent className='p-6'>
					<h3 className='font-bold text-xl mb-2'>{space.name}</h3>
					<p className='text-sm text-muted-foreground mb-4 line-clamp-2'>
						{space.description}
					</p>

					<div className='flex items-center gap-4 mb-4 text-sm text-muted-foreground'>
						<div className='flex items-center gap-1'>
							<Users className='h-4 w-4' />
							<span>
								{space.capacity === 1
									? '1 person'
									: `Up to ${space.capacity}`}
							</span>
						</div>
						<div className='flex items-center gap-1'>
							{isSubscription ? (
								<Calendar className='h-4 w-4' />
							) : (
								<Clock className='h-4 w-4' />
							)}
							<span>
								{isSubscription ? 'Monthly' : 'Per Hour'}
							</span>
						</div>
					</div>

					{/* Amenities Preview */}
					<div className='flex flex-wrap gap-1 mb-4'>
						{space.amenities.slice(0, 3).map((amenity, i) => (
							<Badge
								key={i}
								variant='outline'
								className='text-xs'
							>
								{amenity}
							</Badge>
						))}
						{space.amenities.length > 3 && (
							<Badge
								variant='outline'
								className='text-xs'
							>
								+{space.amenities.length - 3} more
							</Badge>
						)}
					</div>

					{/* Pricing */}
					<div className='border-t pt-4 mb-4'>
						{lowestPlan && (
							<div className='flex items-baseline gap-1'>
								<span className='text-2xl font-bold text-primary'>
									₦{formatPrice(lowestPlan.price)}
								</span>
								<span className='text-sm text-muted-foreground'>
									/{lowestPlan.unit}
								</span>
							</div>
						)}
						{space.pricingPlans.length > 1 && (
							<p className='text-xs text-muted-foreground mt-1'>
								{space.pricingPlans.length} plans available
							</p>
						)}
					</div>

					<div className='flex gap-2'>
						<Button
							variant='outline'
							className='flex-1'
							asChild
						>
							<Link href={`/spaces/${space.id}`}>
								<Eye className='mr-2 h-4 w-4' />
								View
							</Link>
						</Button>
						<Button
							className='flex-1'
							asChild
						>
							<Link href={href}>
								{isSubscription ? 'Subscribe' : 'Book Now'}
								<ArrowRight className='ml-2 h-4 w-4' />
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	};

	return (
		<div className='min-h-screen bg-background'>
			{/* Header */}
			<section className='bg-primary px-4 py-12 lg:py-16'>
				<div className='container mx-auto'>
					<h1 className='text-balance text-4xl font-bold text-secondary sm:text-5xl mb-4'>
						Our Spaces
					</h1>
					<p className='text-pretty text-lg text-secondary/80 max-w-2xl'>
						Find the perfect workspace for your needs. Choose from
						subscription plans for regular use or book spaces by the
						hour.
					</p>
				</div>
			</section>

			{/* Main Content */}
			<section className='px-4 py-8'>
				<div className='container mx-auto'>
					{/* Sort Controls */}
					<div className='flex items-center justify-end gap-3 mb-8'>
						<label className='text-sm font-medium'>Sort by:</label>
						<Select
							value={sortBy}
							onValueChange={setSortBy}
						>
							<SelectTrigger className='w-[180px]'>
								<SelectValue placeholder='Sort order' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='default'>Default</SelectItem>
								<SelectItem value='name'>Name (A-Z)</SelectItem>
								<SelectItem value='price-low'>
									Price (Low to High)
								</SelectItem>
								<SelectItem value='price-high'>
									Price (High to Low)
								</SelectItem>
								<SelectItem value='capacity'>
									Capacity
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Tabs for Subscription vs Booking */}
					<Tabs
						defaultValue={defaultTab}
						className='space-y-8'
					>
						<TabsList className='grid w-full max-w-md mx-auto grid-cols-2'>
							<TabsTrigger
								value='subscription'
								className='text-base'
							>
								<Calendar className='mr-2 h-4 w-4' />
								Subscriptions
							</TabsTrigger>
							<TabsTrigger
								value='booking'
								className='text-base'
							>
								<Clock className='mr-2 h-4 w-4' />
								Hourly Booking
							</TabsTrigger>
						</TabsList>

						<TabsContent value='subscription'>
							<div className='mb-6'>
								<h2 className='text-2xl font-bold mb-2'>
									Subscription Spaces
								</h2>
								<p className='text-muted-foreground'>
									Dedicated workspaces with flexible plans -
									daily, weekly, or monthly subscriptions.
								</p>
							</div>

							{subscriptionSpaces.length === 0 ? (
								<div className='text-center py-12'>
									<p className='text-muted-foreground'>
										No subscription spaces available.
									</p>
								</div>
							) : (
								<div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
									{sortSpaces(subscriptionSpaces).map(
										renderSpaceCard
									)}
								</div>
							)}
						</TabsContent>

						<TabsContent value='booking'>
							<div className='mb-6'>
								<h2 className='text-2xl font-bold mb-2'>
									Hourly Booking Spaces
								</h2>
								<p className='text-muted-foreground'>
									Meeting rooms, studios, and event spaces
									available for hourly or daily booking.
								</p>
							</div>

							{bookingSpaces.length === 0 ? (
								<div className='text-center py-12'>
									<p className='text-muted-foreground'>
										No booking spaces available.
									</p>
								</div>
							) : (
								<div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
									{sortSpaces(bookingSpaces).map(
										renderSpaceCard
									)}
								</div>
							)}
						</TabsContent>
					</Tabs>
				</div>
			</section>

			{/* Business Hours Info */}
			<section className='px-4 py-8 bg-muted/50'>
				<div className='container mx-auto'>
					<Card>
						<CardContent className='p-6'>
							<h3 className='font-bold text-lg mb-4'>
								Business Hours
							</h3>
							<div className='grid gap-4 sm:grid-cols-3'>
								<div>
									<p className='font-medium'>
										Monday - Friday
									</p>
									<p className='text-muted-foreground'>
										9:00 AM - 6:00 PM
									</p>
								</div>
								<div>
									<p className='font-medium'>Saturday</p>
									<p className='text-muted-foreground'>
										11:00 AM - 4:00 PM
									</p>
								</div>
								<div>
									<p className='font-medium'>Sunday</p>
									<p className='text-muted-foreground'>
										Closed
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</section>
		</div>
	);
}
