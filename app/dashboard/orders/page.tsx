import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/actions/auth';
import { getUserShopOrders } from '@/actions/shop';
import { OrdersClient } from './orders-client';

export const metadata: Metadata = {
	title: 'My Orders',
	description: 'View your shop order history',
};

export default async function OrdersPage() {
	const user = await getCurrentUser();
	if (!user) {
		redirect('/login?callbackUrl=/dashboard/orders');
	}

	const ordersResult = await getUserShopOrders();
	const orders = ordersResult.success ? ordersResult.data ?? [] : [];

	return <OrdersClient orders={orders} />;
}
