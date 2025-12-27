import { Suspense } from 'react';
import { getAddonPurchases, getAddons } from '@/actions/perks';
import { getCurrentAdmin } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { AddonPurchasesClient } from './addon-purchases-client';

export const metadata = {
	title: 'Addon Purchases | AMG Workspace Admin',
	description: 'View and manage addon purchases by users',
};

function LoadingState() {
	return (
		<div className='flex items-center justify-center min-h-screen'>
			<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
		</div>
	);
}

export default async function AddonPurchasesPage() {
	const admin = await getCurrentAdmin();

	if (!admin) {
		redirect('/admin/login');
	}

	const [purchasesResult, addonsResult] = await Promise.all([
		getAddonPurchases(),
		getAddons(),
	]);

	return (
		<Suspense fallback={<LoadingState />}>
			<AddonPurchasesClient
				purchases={
					purchasesResult.success ? purchasesResult.data || [] : []
				}
				addons={addonsResult.success ? addonsResult.data || [] : []}
				admin={admin}
			/>
		</Suspense>
	);
}
