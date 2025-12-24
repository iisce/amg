import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/actions/auth';
import { getUserSubscriptions } from '@/actions/subscriptions';
import type { MembershipWithRelations } from '@/actions/subscriptions';
import CheckInClient from './check-in-client';

export const metadata: Metadata = {
	title: 'Check In | AMG Workspace Dashboard',
	description: 'Check in to your workspace at AMG',
};

export default async function CheckInPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect('/login?redirect=/dashboard/check-in');
	}

	// Get user's active subscriptions
	const subscriptionsResult = await getUserSubscriptions();

	let activeSubscriptions: MembershipWithRelations[] = [];
	if (subscriptionsResult.success && subscriptionsResult.data) {
		const data = Array.isArray(subscriptionsResult.data)
			? subscriptionsResult.data
			: [subscriptionsResult.data];
		activeSubscriptions = data.filter(
			(sub: MembershipWithRelations) => sub.status === 'ACTIVE'
		);
	}

	return <CheckInClient activeSubscriptions={activeSubscriptions} />;
}
