'use client';

import type React from 'react';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function NewSpacePage() {
	const router = useRouter();
	const [amenities, setAmenities] = useState<string[]>([]);
	const [newAmenity, setNewAmenity] = useState('');

	const handleAddAmenity = () => {
		if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
			setAmenities([...amenities, newAmenity.trim()]);
			setNewAmenity('');
		}
	};

	const handleRemoveAmenity = (amenity: string) => {
		setAmenities(amenities.filter((a) => a !== amenity));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		toast.success('Space created successfully!');
		router.push('/admin/spaces');
	};

	return (
		<div className='min-h-screen bg-background'>
			{/* Admin Header */}
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
					<div>
						<div className='flex items-center gap-2 mb-2'>
							<Badge className='bg-red-600 text-white'>
								Admin
							</Badge>
						</div>
						<h1 className='text-2xl font-bold'>Add New Space</h1>
						<p className='text-sm text-secondary-foreground/70'>
							Create a new bookable space
						</p>
					</div>
				</div>
			</section>

			{/* Form */}
			<section className='px-4 py-8'>
				<div className='container mx-auto max-w-3xl'>
					<form
						onSubmit={handleSubmit}
						className='space-y-6'
					>
						{/* Basic Information */}
						<Card>
							<CardHeader>
								<CardTitle>Basic Information</CardTitle>
								<CardDescription>
									General details about the space
								</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='space-y-2'>
									<Label htmlFor='name'>Space Name *</Label>
									<Input
										id='name'
										placeholder='e.g., Board Room'
										required
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='type'>Space Type *</Label>
									<Select required>
										<SelectTrigger id='type'>
											<SelectValue placeholder='Select type' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='booking'>
												Booking (Hourly)
											</SelectItem>
											<SelectItem value='subscription'>
												Subscription (Monthly)
											</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='category'>Category *</Label>
									<Select required>
										<SelectTrigger id='category'>
											<SelectValue placeholder='Select category' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='meeting-room'>
												Meeting Room
											</SelectItem>
											<SelectItem value='private-office'>
												Private Office
											</SelectItem>
											<SelectItem value='shared-desk'>
												Shared Desk
											</SelectItem>
											<SelectItem value='studio'>
												Studio
											</SelectItem>
											<SelectItem value='training'>
												Training Room
											</SelectItem>
											<SelectItem value='lounge'>
												Lounge
											</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='description'>
										Description *
									</Label>
									<Textarea
										id='description'
										placeholder='Describe the space and its features...'
										rows={4}
										required
									/>
								</div>

								<div className='grid gap-4 sm:grid-cols-2'>
									<div className='space-y-2'>
										<Label htmlFor='capacity'>
											Capacity *
										</Label>
										<Input
											id='capacity'
											type='number'
											min='1'
											placeholder='e.g., 6'
											required
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='size'>
											Size (sq ft)
										</Label>
										<Input
											id='size'
											type='number'
											placeholder='e.g., 200'
										/>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Pricing */}
						<Card>
							<CardHeader>
								<CardTitle>Pricing</CardTitle>
								<CardDescription>
									Set pricing for this space
								</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='grid gap-4 sm:grid-cols-2'>
									<div className='space-y-2'>
										<Label htmlFor='price'>
											Base Price (₦) *
										</Label>
										<Input
											id='price'
											type='number'
											min='0'
											placeholder='e.g., 15000'
											required
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='unit'>
											Pricing Unit *
										</Label>
										<Select required>
											<SelectTrigger id='unit'>
												<SelectValue placeholder='Select unit' />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value='hour'>
													Per Hour
												</SelectItem>
												<SelectItem value='day'>
													Per Day
												</SelectItem>
												<SelectItem value='week'>
													Per Week
												</SelectItem>
												<SelectItem value='month'>
													Per Month
												</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Amenities */}
						<Card>
							<CardHeader>
								<CardTitle>Amenities</CardTitle>
								<CardDescription>
									Add features and amenities included with
									this space
								</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='flex gap-2'>
									<Input
										placeholder='e.g., WiFi, Projector, Whiteboard'
										value={newAmenity}
										onChange={(e) =>
											setNewAmenity(e.target.value)
										}
										onKeyPress={(e) =>
											e.key === 'Enter' &&
											(e.preventDefault(),
											handleAddAmenity())
										}
									/>
									<Button
										type='button'
										onClick={handleAddAmenity}
									>
										<Plus className='h-4 w-4' />
									</Button>
								</div>

								{amenities.length > 0 && (
									<div className='flex flex-wrap gap-2'>
										{amenities.map((amenity) => (
											<Badge
												key={amenity}
												variant='secondary'
												className='gap-1'
											>
												{amenity}
												<button
													title='Remove amenity'
													type='button'
													onClick={() =>
														handleRemoveAmenity(
															amenity
														)
													}
													className='ml-1'
												>
													<X className='h-3 w-3' />
												</button>
											</Badge>
										))}
									</div>
								)}
							</CardContent>
						</Card>

						{/* Availability */}
						<Card>
							<CardHeader>
								<CardTitle>Availability</CardTitle>
								<CardDescription>
									Set operating hours and availability
								</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='grid gap-4 sm:grid-cols-2'>
									<div className='space-y-2'>
										<Label htmlFor='openTime'>
											Opening Time
										</Label>
										<Input
											id='openTime'
											type='time'
											defaultValue='08:00'
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='closeTime'>
											Closing Time
										</Label>
										<Input
											id='closeTime'
											type='time'
											defaultValue='18:00'
										/>
									</div>
								</div>

								<div className='flex items-center justify-between'>
									<div>
										<Label htmlFor='active'>
											Active Status
										</Label>
										<p className='text-sm text-muted-foreground'>
											Make this space available for
											booking
										</p>
									</div>
									<Switch
										id='active'
										defaultChecked
									/>
								</div>
							</CardContent>
						</Card>

						{/* Actions */}
						<div className='flex gap-3'>
							<Button
								type='submit'
								className='flex-1'
							>
								Create Space
							</Button>
							<Button
								type='button'
								variant='outline'
								asChild
								className='flex-1 bg-transparent'
							>
								<Link href='/admin/spaces'>Cancel</Link>
							</Button>
						</div>
					</form>
				</div>
			</section>
		</div>
	);
}
