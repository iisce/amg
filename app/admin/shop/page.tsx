import { Suspense } from 'react';
import { AdminShopClient } from './admin-shop-client';
import {
	getShopCategories,
	getShopItems,
	getPendingOrders,
	getShopStats,
} from '@/actions/shop';
import { getInventoryItems } from '@/actions/inventory';
import { getCurrentAdmin } from '@/actions/auth';
import { redirect } from 'next/navigation';

export const metadata = {
	title: 'Shop Management | AMG Workspace Admin',
	description: 'Manage shop items, orders, and inventory integration',
};

function LoadingState() {
	return (
		<div className='flex items-center justify-center min-h-screen'>
			<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
		</div>
	);
}

export default async function AdminShopPage() {
	const admin = await getCurrentAdmin();

	if (!admin) {
		redirect('/admin/login');
	}

	const [
		categoriesResult,
		itemsResult,
		ordersResult,
		statsResult,
		inventoryResult,
	] = await Promise.all([
		getShopCategories({ includeItems: false }),
		getShopItems(),
		getPendingOrders(),
		getShopStats(),
		getInventoryItems({ activeOnly: true }),
	]);

	return (
		<Suspense fallback={<LoadingState />}>
			<AdminShopClient
				categories={
					categoriesResult.success && categoriesResult.data
						? categoriesResult.data
						: []
				}
				items={
					itemsResult.success && itemsResult.data
						? itemsResult.data
						: []
				}
				pendingOrders={
					ordersResult.success && ordersResult.data
						? ordersResult.data
						: []
				}
				stats={
					statsResult.success && statsResult.data
						? statsResult.data
						: null
				}
				inventoryItems={
					inventoryResult.success && inventoryResult.data
						? inventoryResult.data
						: []
				}
				admin={admin}
			/>
		</Suspense>
	);
}
