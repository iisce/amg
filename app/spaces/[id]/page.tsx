import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSpaceBySlug, getSpaceById } from '@/actions';
import SpaceDetailsClient from './space-details-client';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://amgworkspace.com';

// Helper to format price from kobo
function formatPrice(kobo: number): string {
	return `₦${(kobo / 100).toLocaleString()}`;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;

	// Try fetching by slug first, then by ID
	let result = await getSpaceBySlug(id);
	if (!result.success || !result.data) {
		result = await getSpaceById(id);
	}

	if (!result.success || !result.data) {
		return {
			title: 'Space Not Found | AMG Workspace',
			description: 'The requested workspace could not be found.',
		};
	}

	const space = Array.isArray(result.data) ? result.data[0] : result.data;

	// Get pricing info
	const lowestPrice = space.pricingPlans?.length
		? Math.min(...space.pricingPlans.map((p) => p.price))
		: null;
	const lowestPlan = space.pricingPlans?.find((p) => p.price === lowestPrice);

	const priceText = lowestPlan
		? `Starting from ${formatPrice(lowestPlan.price)}/${lowestPlan.unit}`
		: '';

	const spaceType =
		space.type === 'SUBSCRIPTION' ? 'Subscription' : 'Hourly Booking';

	// Create SEO-optimized description
	const description = `${space.name} at AMG Workspace Lagos. ${
		space.description?.slice(0, 120) || ''
	} ${priceText}. Capacity: ${space.capacity} ${
		space.capacity === 1 ? 'person' : 'people'
	}. ${spaceType} available.`;

	// Use first image or default
	const ogImage = space.images?.[0] || '/images/og-default.jpg';
	const fullOgImage = ogImage.startsWith('http')
		? ogImage
		: `${BASE_URL}${ogImage}`;

	return {
		title: `${space.name} | AMG Workspace Lagos`,
		description: description.trim(),
		keywords: [
			space.name,
			'coworking space Lagos',
			'workspace Lagos Nigeria',
			'office space Lagos',
			spaceType.toLowerCase(),
			...(space.amenities || []),
		],
		openGraph: {
			title: `${space.name} - ${spaceType} | AMG Workspace`,
			description: description.trim(),
			url: `${BASE_URL}/spaces/${space.slug || space.id}`,
			siteName: 'AMG Workspace',
			images: [
				{
					url: fullOgImage,
					width: 1200,
					height: 630,
					alt: `${space.name} - AMG Workspace Lagos`,
				},
			],
			locale: 'en_NG',
			type: 'website',
		},
		twitter: {
			card: 'summary_large_image',
			title: `${space.name} | AMG Workspace Lagos`,
			description: description.trim(),
			images: [fullOgImage],
		},
		alternates: {
			canonical: `${BASE_URL}/spaces/${space.slug || space.id}`,
		},
		other: {
			'price:amount': lowestPrice ? String(lowestPrice / 100) : '',
			'price:currency': 'NGN',
		},
	};
}

export default async function SpaceDetailsPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	// Await params in Next.js 16
	const { id } = await params;

	// Try fetching by slug first (most common), then by ID
	let result = await getSpaceBySlug(id);

	if (!result.success || !result.data) {
		result = await getSpaceById(id);
	}

	if (!result.success || !result.data) {
		notFound();
	}

	const space = Array.isArray(result.data) ? result.data[0] : result.data;

	// Get lowest price for structured data
	const lowestPrice = space.pricingPlans?.length
		? Math.min(...space.pricingPlans.map((p) => p.price))
		: null;

	// JSON-LD structured data for better SEO
	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'LocalBusiness',
		name: space.name,
		description: space.description,
		image: space.images?.[0]
			? space.images[0].startsWith('http')
				? space.images[0]
				: `${BASE_URL}${space.images[0]}`
			: `${BASE_URL}/images/og-default.jpg`,
		address: {
			'@type': 'PostalAddress',
			streetAddress: '20 Adeola Odeku Street',
			addressLocality: 'Victoria Island',
			addressRegion: 'Lagos',
			postalCode: '101241',
			addressCountry: 'NG',
		},
		geo: {
			'@type': 'GeoCoordinates',
			latitude: 6.4281,
			longitude: 3.4219,
		},
		url: `${BASE_URL}/spaces/${space.slug || space.id}`,
		priceRange: lowestPrice ? `₦${lowestPrice / 100}+` : '₦₦',
		amenityFeature: space.amenities?.map((amenity) => ({
			'@type': 'LocationFeatureSpecification',
			name: amenity,
			value: true,
		})),
		maximumAttendeeCapacity: space.capacity,
		openingHoursSpecification: [
			{
				'@type': 'OpeningHoursSpecification',
				dayOfWeek: [
					'Monday',
					'Tuesday',
					'Wednesday',
					'Thursday',
					'Friday',
				],
				opens: '09:00',
				closes: '18:00',
			},
			{
				'@type': 'OpeningHoursSpecification',
				dayOfWeek: 'Saturday',
				opens: '11:00',
				closes: '16:00',
			},
		],
	};

	return (
		<>
			<script
				type='application/ld+json'
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<SpaceDetailsClient space={space} />
		</>
	);
}
