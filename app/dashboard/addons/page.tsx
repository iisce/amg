import { Suspense } from 'react';
import { getUserAddonPurchases, getAddons } from '@/actions/perks';
import { getUserSubscriptions } from '@/actions/subscriptions';
import { getCurrentUser } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { MyAddonsClient } from './my-addons-client';

export const metadata = {
	title: 'My Add-ons | AMG Workspace',
	description: 'View and manage your add-on purchases',
};

function LoadingState() {
	return (
		<div className='flex items-center justify-center min-h-100'>
			<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
		</div>
	);
}

export default async function MyAddonsPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect('/login?from=/dashboard/addons');
	}

	const [purchasesResult, addonsResult, subscriptionsResult] =
		await Promise.all([
			getUserAddonPurchases(),
			getAddons({ type: 'SHOP' }), // Get shop addons for standalone purchase
			getUserSubscriptions(),
		]);

	// Normalize subscriptions data to array (API can return single object or array)
	const subscriptionsArray =
		subscriptionsResult.success && subscriptionsResult.data
			? Array.isArray(subscriptionsResult.data)
				? subscriptionsResult.data
				: [subscriptionsResult.data]
			: [];

	// Also get subscription-eligible addons if user has an active subscription
	const hasActiveSubscription = subscriptionsArray.some(
		(sub) => sub.status === 'ACTIVE'
	);

	let subscriptionAddons: typeof addonsResult.data = [];
	if (hasActiveSubscription) {
		const subAddonsResult = await getAddons({ type: 'SUBSCRIPTION' });
		subscriptionAddons = subAddonsResult.success
			? subAddonsResult.data || []
			: [];
	}

	return (
		<Suspense fallback={<LoadingState />}>
			<MyAddonsClient
				purchases={
					purchasesResult.success ? purchasesResult.data || [] : []
				}
				shopAddons={addonsResult.success ? addonsResult.data || [] : []}
				subscriptionAddons={subscriptionAddons || []}
				subscriptions={subscriptionsArray}
				hasActiveSubscription={hasActiveSubscription}
			/>
		</Suspense>
	);
}
