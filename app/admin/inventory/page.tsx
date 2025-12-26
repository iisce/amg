import { Suspense } from 'react';
import { AdminInventoryClient } from './admin-inventory-client';
import {
	getInventoryCategories,
	getInventoryItems,
	getInventoryStats,
	getLowStockItems,
} from '@/actions/inventory';
import { getCurrentAdmin } from '@/actions/auth';
import { redirect } from 'next/navigation';

export const metadata = {
	title: 'Inventory Management | AMG Workspace Admin',
	description: 'Manage inventory items, stock levels, and categories',
};

function LoadingState() {
	return (
		<div className='flex items-center justify-center min-h-screen'>
			<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
		</div>
	);
}

export default async function AdminInventoryPage() {
	const admin = await getCurrentAdmin();

	if (!admin) {
		redirect('/admin/login');
	}

	const [categoriesResult, itemsResult, statsResult, lowStockResult] =
		await Promise.all([
			getInventoryCategories({ includeItems: false }),
			getInventoryItems(),
			getInventoryStats(),
			getLowStockItems(),
		]);

	return (
		<Suspense fallback={<LoadingState />}>
			<AdminInventoryClient
				categories={
					categoriesResult.success ? categoriesResult.data : []
				}
				items={itemsResult.success ? itemsResult.data : []}
				stats={statsResult.success ? statsResult.data : null}
				lowStockItems={
					lowStockResult.success ? lowStockResult.data : []
				}
				admin={admin}
			/>
		</Suspense>
	);
}
