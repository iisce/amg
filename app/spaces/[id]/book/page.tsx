import { notFound, redirect } from 'next/navigation';
import { getSpaceBySlug, getSpaceById } from '@/actions';
import BookSpaceClient from './book-space-client';

export default async function BookSpacePage({
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

	// If this is a subscription space, redirect to subscribe page
	if (space.type === 'SUBSCRIPTION') {
		redirect(`/spaces/${space.id}/subscribe`);
	}

	return <BookSpaceClient space={space} />;
}
