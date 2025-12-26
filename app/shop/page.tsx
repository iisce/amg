import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getShopCategories, getShopItems } from '@/actions/shop';
import { getCurrentUser } from '@/actions/auth';
import { ShopClient } from './shop-client';

export const metadata: Metadata = {
	title: 'Shop - AMG Workspace',
	description:
		'Order drinks, snacks, and refreshments at AMG Workspace. Browse our menu and place your order online.',
	keywords: [
		'coworking cafe',
		'workspace refreshments',
		'office coffee Lagos',
		'workspace snacks',
	],
	openGraph: {
		title: 'Shop - AMG Workspace',
		description: 'Order drinks, snacks, and refreshments at AMG Workspace.',
	},
};

export default async function ShopPage() {
	// Require authentication
	const user = await getCurrentUser();
	if (!user) {
		redirect('/login?callbackUrl=/shop');
	}

	const [categoriesResult, itemsResult] = await Promise.all([
		getShopCategories({ activeOnly: true, includeItems: false }),
		getShopItems({ activeOnly: true, includeComponents: false }),
	]);

	const categories = categoriesResult.success ? categoriesResult.data : [];
	const items = itemsResult.success ? itemsResult.data : [];

	return (
		<ShopClient
			categories={categories}
			items={items}
			user={user}
		/>
	);
}
