import { notFound, redirect } from 'next/navigation';
import { getSpaceBySlug, getSpaceById } from '@/actions';
import SubscribeSpaceClient from './subscribe-space-client';

export default async function SubscribeSpacePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	// Try fetching by slug first, then by ID
	let result = await getSpaceBySlug(id);

	if (!result.success || !result.data) {
		result = await getSpaceById(id);
	}

	if (!result.success || !result.data) {
		notFound();
	}

	const space = Array.isArray(result.data) ? result.data[0] : result.data;

	// If this is a booking space, redirect to book page
	if (space.type === 'BOOKING') {
		redirect(`/spaces/${space.id}/book`);
	}

	return <SubscribeSpaceClient space={space} />;
}
