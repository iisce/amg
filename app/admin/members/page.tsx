import { redirect } from 'next/navigation';
import { getCurrentAdmin, getUsers, getSubscriptions } from '@/actions';
import AdminMembersClient from './admin-members-client';

export default async function AdminMembersPage() {
	const admin = await getCurrentAdmin();

	if (!admin) {
		redirect('/admin/login');
	}

	// Get users and their subscriptions
	const usersResult = await getUsers({ limit: 100 });
	const subscriptionsResult = await getSubscriptions({ limit: 100 });

	const users =
		usersResult.success && usersResult.data
			? Array.isArray(usersResult.data)
				? usersResult.data
				: [usersResult.data]
			: [];
	const subscriptions =
		subscriptionsResult.success && subscriptionsResult.data
			? Array.isArray(subscriptionsResult.data)
				? subscriptionsResult.data
				: [subscriptionsResult.data]
			: [];

	return (
		<AdminMembersClient
			users={users}
			subscriptions={subscriptions}
			currentUserRole={admin.role}
		/>
	);
}
