import { Suspense } from 'react';
import { AdminAddonsClient } from './admin-addons-client';
import { getAddons } from '@/actions/perks';
import { getSpaces } from '@/actions/spaces';
import { getCurrentAdmin } from '@/actions/auth';
import { redirect } from 'next/navigation';

export const metadata = {
	title: 'Add-ons Management | AMG Workspace Admin',
	description: 'Manage subscription add-ons and pricing',
};

function LoadingState() {
	return (
		<div className='flex items-center justify-center min-h-screen'>
			<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
		</div>
	);
}

export default async function AdminAddonsPage() {
	const admin = await getCurrentAdmin();

	if (!admin) {
		redirect('/admin/login');
	}

	const [addonsResult, spacesResult] = await Promise.all([
		getAddons({ includeInactive: true }),
		getSpaces(),
	]);

	// Get spaces as array
	const spacesArray =
		spacesResult.success && spacesResult.data
			? Array.isArray(spacesResult.data)
				? spacesResult.data
				: [spacesResult.data]
			: [];

	// Get all pricing plans from spaces
	const pricingPlans = spacesArray.flatMap((space) =>
		space.pricingPlans.map((plan) => ({
			id: plan.id,
			name: `${space.name} - ${plan.name}`,
			spaceId: space.id,
			spaceName: space.name,
		}))
	);

	return (
		<Suspense fallback={<LoadingState />}>
			<AdminAddonsClient
				addons={addonsResult.success ? addonsResult.data || [] : []}
				spaces={spacesArray}
				pricingPlans={pricingPlans}
				admin={admin}
			/>
		</Suspense>
	);
}
