import type { Metadata } from 'next';
import { getSpaces } from '@/actions';
import SpacesClient from './spaces-client';

export const metadata: Metadata = {
	title: 'Browse Spaces - Coworking & Office Rentals',
	description:
		'Explore our flexible workspace options in Lagos. From shared desks and private offices to meeting rooms and event venues. Find your perfect workspace at AMG Workspace.',
	keywords: [
		'coworking space Lagos',
		'office rental Lagos',
		'shared desk Lagos',
		'private office Festac',
		'meeting room rental',
		'workspace Lagos Nigeria',
	],
	openGraph: {
		title: 'Browse Spaces - AMG Workspace Lagos',
		description:
			'Explore flexible coworking spaces, private offices, meeting rooms, and event venues in Lagos, Nigeria.',
		images: ['/images/entire-office.jpg'],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Browse Spaces - AMG Workspace Lagos',
		description:
			'Explore flexible coworking spaces, private offices, meeting rooms, and event venues in Lagos.',
		images: ['/images/entire-office.jpg'],
	},
};

interface SpacesPageProps {
	searchParams: Promise<{ type?: string }>;
}

export default async function SpacesPage({ searchParams }: SpacesPageProps) {
	const params = await searchParams;
	const result = await getSpaces({ activeOnly: true });
	const spaces =
		result.success && result.data
			? Array.isArray(result.data)
				? result.data
				: [result.data]
			: [];

	// Determine default tab based on query param
	const defaultTab =
		params.type === 'book'
			? 'booking'
			: params.type === 'subscribe'
			? 'subscription'
			: 'subscription';

	return (
		<SpacesClient
			spaces={spaces}
			defaultTab={defaultTab}
		/>
	);
}
