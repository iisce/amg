import { redirect } from 'next/navigation';
import { getCurrentUser, getUserSubscriptions } from '@/actions';
import { ProfileClient } from './profile-client';

export default async function ProfilePage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect('/login');
	}

	// Fetch user's subscriptions
	const subscriptionsResult = await getUserSubscriptions();
	const subscriptions = subscriptionsResult.success
		? subscriptionsResult.data || []
		: [];

	// Map to client-friendly format
	const formattedSubscriptions = subscriptions.map((sub) => ({
		id: sub.id,
		membershipNumber: sub.membershipNumber,
		accessCode: sub.accessCode,
		status: sub.status,
		startDate: sub.startDate.toISOString(),
		endDate: sub.endDate.toISOString(),
		space: {
			name: sub.space.name,
			slug: sub.space.slug,
		},
		pricingPlan: {
			name: sub.pricingPlan.name,
		},
	}));

	return (
		<ProfileClient
			user={{
				id: user.id,
				name: user.name,
				email: user.email,
				phone: user.phone,
				company: user.company,
			}}
			subscriptions={formattedSubscriptions}
		/>
	);
}
