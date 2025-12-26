'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	MapPin,
	Phone,
	Mail,
	Clock,
	MessageSquare,
	ExternalLink,
} from 'lucide-react';
import { GoogleMap } from '@/components/map';
import { WORKSPACE_LOCATION, BUSINESS_HOURS } from '@/lib/constants/location';

// Contact information
const CONTACT_INFO = {
	email: 'amgworkspace@gmail.com',
	phone: '+2349134011777',
	whatsapp: '+2349134011777',
};

export default function ContactPage() {
	const formatPhoneForDisplay = (phone: string) => {
		// Format: +234 913 401 1777
		return phone.replace(/(\+234)(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
	};

	const getWhatsAppLink = (phone: string, message?: string) => {
		const cleanPhone = phone.replace(/\+/g, '');
		const encodedMessage = message
			? `?text=${encodeURIComponent(message)}`
			: '';
		return `https://wa.me/${cleanPhone}${encodedMessage}`;
	};

	return (
		<div className='min-h-screen bg-background'>
			{/* Header */}
			<section className='bg-primary px-4 py-12'>
				<div className='container mx-auto max-w-6xl'>
					<div className='flex items-center gap-3 mb-4'>
						<div className='p-2 bg-secondary/20 rounded-lg'>
							<Phone className='h-6 w-6 text-secondary' />
						</div>
						<h1 className='text-3xl font-bold text-secondary sm:text-4xl'>
							Contact Us
						</h1>
					</div>
					<p className='text-secondary/80 max-w-2xl'>
						Get in touch with us. We&apos;re here to help with any
						questions about our coworking spaces, memberships, or
						bookings.
					</p>
				</div>
			</section>

			{/* Contact Section */}
			<section className='px-4 py-12'>
				<div className='container mx-auto max-w-6xl'>
					<div className='grid lg:grid-cols-2 gap-8'>
						{/* Contact Information */}
						<div className='space-y-6'>
							<Card>
								<CardHeader>
									<CardTitle>Get In Touch</CardTitle>
								</CardHeader>
								<CardContent className='space-y-6'>
									{/* Address */}
									<div className='flex items-start gap-4'>
										<div className='p-2 bg-primary/10 rounded-lg'>
											<MapPin className='h-5 w-5 text-primary' />
										</div>
										<div>
											<p className='font-medium mb-1'>
												Office Address
											</p>
											<p className='text-muted-foreground'>
												{WORKSPACE_LOCATION.name}
												<br />
												{
													WORKSPACE_LOCATION.address
														.street
												}
												<br />
												{
													WORKSPACE_LOCATION.address
														.area
												}
												,{' '}
												{
													WORKSPACE_LOCATION.address
														.city
												}
												<br />
												{
													WORKSPACE_LOCATION.address
														.state
												}
												,{' '}
												{
													WORKSPACE_LOCATION.address
														.country
												}
											</p>
										</div>
									</div>

									{/* Phone */}
									<div className='flex items-start gap-4'>
										<div className='p-2 bg-primary/10 rounded-lg'>
											<Phone className='h-5 w-5 text-primary' />
										</div>
										<div>
											<p className='font-medium mb-1'>
												Phone
											</p>
											<a
												href={`tel:${CONTACT_INFO.phone}`}
												className='text-muted-foreground hover:text-primary transition-colors'
											>
												{formatPhoneForDisplay(
													CONTACT_INFO.phone
												)}
											</a>
											<p className='text-sm text-muted-foreground mt-1'>
												Available for calls and WhatsApp
											</p>
										</div>
									</div>

									{/* Email */}
									<div className='flex items-start gap-4'>
										<div className='p-2 bg-primary/10 rounded-lg'>
											<Mail className='h-5 w-5 text-primary' />
										</div>
										<div>
											<p className='font-medium mb-1'>
												Email
											</p>
											<a
												href={`mailto:${CONTACT_INFO.email}`}
												className='text-muted-foreground hover:text-primary transition-colors'
											>
												{CONTACT_INFO.email}
											</a>
										</div>
									</div>

									{/* Business Hours */}
									<div className='flex items-start gap-4'>
										<div className='p-2 bg-primary/10 rounded-lg'>
											<Clock className='h-5 w-5 text-primary' />
										</div>
										<div>
											<p className='font-medium mb-1'>
												Business Hours
											</p>
											<div className='text-muted-foreground space-y-1'>
												<p>
													Monday - Friday:{' '}
													{
														BUSINESS_HOURS.weekdays
															.open
													}
													:00 AM -{' '}
													{
														BUSINESS_HOURS.weekdays
															.close
													}
													:00 PM
												</p>
												<p>
													Saturday:{' '}
													{
														BUSINESS_HOURS.saturday
															.open
													}
													:00 AM -{' '}
													{
														BUSINESS_HOURS.saturday
															.close
													}
													:00 PM
												</p>
												<p>Sunday: Closed</p>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Quick Actions */}
							<Card>
								<CardHeader>
									<CardTitle>Quick Actions</CardTitle>
								</CardHeader>
								<CardContent className='space-y-3'>
									<Button
										className='w-full justify-start'
										asChild
									>
										<a
											href={getWhatsAppLink(
												CONTACT_INFO.whatsapp,
												'Hello! I have a question about AMG Workspace.'
											)}
											target='_blank'
											rel='noopener noreferrer'
										>
											<MessageSquare className='mr-2 h-4 w-4' />
											Chat on WhatsApp
											<ExternalLink className='ml-auto h-4 w-4' />
										</a>
									</Button>
									<Button
										variant='outline'
										className='w-full justify-start'
										asChild
									>
										<Link href='/enquiry'>
											<Mail className='mr-2 h-4 w-4' />
											Send an Enquiry
										</Link>
									</Button>
									<Button
										variant='outline'
										className='w-full justify-start'
										asChild
									>
										<a href={`tel:${CONTACT_INFO.phone}`}>
											<Phone className='mr-2 h-4 w-4' />
											Call Us
										</a>
									</Button>
								</CardContent>
							</Card>

							{/* Quick Links */}
							<Card>
								<CardHeader>
									<CardTitle>Helpful Links</CardTitle>
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

						{/* Map */}
						<div className='space-y-6'>
							<Card className='overflow-hidden'>
								<CardHeader>
									<CardTitle>Find Us</CardTitle>
								</CardHeader>
								<CardContent className='p-0'>
									<GoogleMap
										className='h-125'
										showDistanceCalculator={true}
									/>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
