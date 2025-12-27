import { redirect } from 'next/navigation';
import { getCurrentAdmin, getSubscriptions, getSpaces } from '@/actions';
import AdminMembershipsClient from './admin-memberships-client';

export default async function AdminMembershipsPage() {
	const admin = await getCurrentAdmin();

	if (!admin) {
		redirect('/admin/login');
	}

	// Get all memberships with relations
	const membershipsResult = await getSubscriptions({ limit: 500 });
	const spacesResult = await getSpaces({ type: 'SUBSCRIPTION' });

	const memberships =
		membershipsResult.success && membershipsResult.data
			? Array.isArray(membershipsResult.data)
				? membershipsResult.data
				: [membershipsResult.data]
			: [];

	const spaces =
		spacesResult.success && spacesResult.data
			? Array.isArray(spacesResult.data)
				? spacesResult.data
				: [spacesResult.data]
			: [];

	return (
		<AdminMembershipsClient
			memberships={memberships}
			spaces={spaces}
			currentUserRole={admin.role}
		/>
	);
}
