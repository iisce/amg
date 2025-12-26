'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GoogleMap } from '@/components/map';
import {
	WORKSPACE_LOCATION,
	getDirectionsUrl,
	getMapSearchUrl,
} from '@/lib/constants/location';
import {
	ArrowRight,
	CheckCircle2,
	Users,
	Wifi,
	Coffee,
	Clock,
	MapPin,
} from 'lucide-react';

const features = [
	{
		icon: Wifi,
		title: 'High-Speed WiFi',
		description: 'Reliable internet connectivity for all your work needs',
	},
	{
		icon: Coffee,
		title: 'Refreshments',
		description: 'Complimentary coffee, tea, and water throughout the day',
	},
	{
		icon: Users,
		title: 'Networking',
		description: 'Connect with like-minded professionals and entrepreneurs',
	},
	{
		icon: Clock,
		title: 'Flexible Hours',
		description:
			'Access during business hours with various plans available',
	},
];

const spaceHighlights = [
	{
		title: 'Shared Desk Space',
		description: 'Flexible workspace with daily, weekly, or monthly plans',
		image: '/images/shared-desk-space.jpg',
		type: 'Subscription',
	},
	{
		title: 'Private Offices',
		description: 'Dedicated offices for solo professionals and small teams',
		image: '/images/private-office.jpg',
		type: 'Subscription',
	},
	{
		title: 'Board Room',
		description: 'Professional meeting space for team discussions',
		image: '/images/board-room.jpg',
		type: 'Hourly Booking',
	},
	{
		title: 'Photo Studio',
		description: 'Equipped studio for photography and videography',
		image: '/images/photo-studio.jpg',
		type: 'Hourly Booking',
	},
];

const businessHours = [
	{ day: 'Monday - Friday', hours: '9:00 AM - 6:00 PM' },
	{ day: 'Saturday', hours: '11:00 AM - 4:00 PM' },
	{ day: 'Sunday', hours: 'Closed' },
];

const amenities = [
	'High-speed WiFi',
	'Air conditioning',
	'Power outlets',
	'Printing facilities',
	'Coffee & tea',
	'Kitchen access',
	'Meeting room access',
	'Secure access',
	'Cleaning services',
];

export default function HomePage() {
	return (
		<div className='min-h-screen bg-background'>
			{/* Hero Section */}
			<section className='bg-primary px-4 py-16 sm:py-24'>
				<div className='container mx-auto max-w-6xl text-center'>
					<h1 className='text-4xl font-bold text-secondary sm:text-5xl lg:text-6xl mb-4'>
						Do more than just work.
						<br />
						<span className='text-secondary/90'>
							Create. Innovate.
						</span>
					</h1>
					<p className='text-lg text-secondary/80 max-w-2xl mx-auto mb-8'>
						Whether you&apos;re a team of one or a growing startup,
						we have flexible workspace solutions made for the way
						you work.
					</p>
					<div className='flex flex-col sm:flex-row gap-4 justify-center'>
						<Button
							size='lg'
							asChild
							className='bg-secondary text-secondary-foreground hover:bg-secondary/90'
						>
							<Link href='/spaces'>
								Browse Spaces
								<ArrowRight className='ml-2 h-4 w-4' />
							</Link>
						</Button>
						<Button
							size='lg'
							variant='outline'
							asChild
							className='border-secondary text-secondary hover:bg-secondary/10 bg-transparent'
						>
							<Link href='/pricing'>View Pricing</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className='px-4 py-16 bg-muted/50'>
				<div className='container mx-auto max-w-6xl'>
					<h2 className='text-3xl font-bold text-center mb-12'>
						Why Choose AMG Workspace?
					</h2>
					<div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
						{features.map((feature) => (
							<Card
								key={feature.title}
								className='text-center'
							>
								<CardContent className='p-6'>
									<feature.icon className='h-12 w-12 mx-auto mb-4 text-primary' />
									<h3 className='font-bold text-lg mb-2'>
										{feature.title}
									</h3>
									<p className='text-sm text-muted-foreground'>
										{feature.description}
									</p>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Space Highlights */}
			<section className='px-4 py-16'>
				<div className='container mx-auto max-w-6xl'>
					<div className='text-center mb-12'>
						<h2 className='text-3xl font-bold mb-4'>Our Spaces</h2>
						<p className='text-muted-foreground max-w-2xl mx-auto'>
							From shared desks to private offices, meeting rooms
							to creative studios - find the perfect space for
							your needs.
						</p>
					</div>

					<div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
						{spaceHighlights.map((space) => (
							<Card
								key={space.title}
								className='overflow-hidden hover:shadow-lg transition-shadow group py-0'
							>
								<div className='relative aspect-4/3'>
									<Image
										src={space.image}
										alt={space.title}
										fill
										className='object-cover group-hover:scale-105 transition-transform duration-300'
									/>
									<Badge className='absolute top-3 left-3 bg-primary text-primary-foreground'>
										{space.type}
									</Badge>
								</div>
								<CardContent className='p-4'>
									<h3 className='font-bold mb-1'>
										{space.title}
									</h3>
									<p className='text-sm text-muted-foreground'>
										{space.description}
									</p>
								</CardContent>
							</Card>
						))}
					</div>

					<div className='text-center mt-8'>
						<Button
							size='lg'
							asChild
						>
							<Link href='/spaces'>
								View All Spaces
								<ArrowRight className='ml-2 h-4 w-4' />
							</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Business Hours & Location */}
			<section
				id='location'
				className='px-4 py-16 bg-muted/50'
			>
				<div className='container mx-auto max-w-6xl'>
					<div className='grid gap-8'>
						{/* Location */}
						<Card>
							<CardContent className='p-6'>
								<div className='grid gap-8 lg:grid-cols-2'>
									<div className=''>
										<div className='flex items-center gap-2 mb-6'>
											<Clock className='h-6 w-6 text-primary' />
											<h3 className='text-xl font-bold'>
												Business Hours
											</h3>
										</div>
										<div className=''>
											{businessHours.map((item) => (
												<div
													key={item.day}
													className='flex gap-6 items-center'
												>
													<span className='font-medium'>
														{item.day}
													</span>
													<span className='text-muted-foreground'>
														{item.hours}
													</span>
												</div>
											))}
										</div>
									</div>
									<div className=''>
										<div className='flex items-center gap-2 mb-4'>
											<MapPin className='h-6 w-6 text-primary' />
											<h3 className='text-xl font-bold'>
												Location
											</h3>
										</div>
										<address className='not-italic text-muted-foreground mb-4'>
											<p className='font-medium text-foreground mb-1'>
												{WORKSPACE_LOCATION.name}
											</p>
											<p>
												{
													WORKSPACE_LOCATION.address
														.street
												}
											</p>
											<p>
												{
													WORKSPACE_LOCATION.address
														.area
												}
												,{' '}
												{
													WORKSPACE_LOCATION.address
														.city
												}{' '}
												{
													WORKSPACE_LOCATION.address
														.postalCode
												}
											</p>
										</address>
									</div>
								</div>

								{/* Embedded Map with Distance Calculator */}
								<GoogleMap
									className='mb-4'
									showDistanceCalculator={true}
								/>

								<div className='flex flex-col sm:flex-row gap-2'>
									<Button
										variant='outline'
										asChild
									>
										<a
											href={getDirectionsUrl()}
											target='_blank'
											rel='noopener noreferrer'
										>
											Get Directions
											<ArrowRight className='ml-2 h-4 w-4' />
										</a>
									</Button>
									<Button
										variant='ghost'
										asChild
									>
										<a
											href={getMapSearchUrl()}
											target='_blank'
											rel='noopener noreferrer'
										>
											View on Map
										</a>
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className='px-4 py-16'>
				<div className='container mx-auto max-w-4xl'>
					<Card className='bg-primary text-primary-foreground'>
						<CardContent className='p-8 md:p-12 text-center'>
							<h2 className='text-2xl md:text-3xl font-bold mb-4 text-secondary'>
								Ready to Get Started?
							</h2>
							<p className='text-secondary/80 mb-8 max-w-2xl mx-auto'>
								Join our community of professionals,
								entrepreneurs, and creatives. Find your perfect
								workspace today.
							</p>
							<div className='flex flex-col sm:flex-row gap-4 justify-center'>
								<Button
									size='lg'
									asChild
									className='bg-secondary text-secondary-foreground hover:bg-secondary/90'
								>
									<Link href='/spaces'>
										Browse Spaces
										<ArrowRight className='ml-2 h-4 w-4' />
									</Link>
								</Button>
								<Button
									size='lg'
									variant='outline'
									asChild
									className='border-secondary text-secondary hover:bg-secondary/10 bg-transparent'
								>
									<Link href='/register'>Create Account</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</section>

			{/* Amenities List */}
			<section className='px-4 py-16 bg-muted/50'>
				<div className='container mx-auto max-w-6xl'>
					<h2 className='text-3xl font-bold text-center mb-12'>
						All Spaces Include
					</h2>
					<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
						{amenities.map((amenity) => (
							<div
								key={amenity}
								className='flex items-center gap-3 p-4 bg-background rounded-lg'
							>
								<CheckCircle2 className='h-5 w-5 text-primary shrink-0' />
								<span>{amenity}</span>
							</div>
						))}
					</div>
				</div>
			</section>
		</div>
	);
}
