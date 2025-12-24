import { getSpaces } from '@/actions';
import SpacesClient from './spaces-client';

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
