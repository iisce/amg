import { redirect } from 'next/navigation';
import {
	getCurrentAdmin,
	getDashboardStats,
	getTodayOverview,
	adminLogout,
} from '@/actions';
import AdminDashboardClient from './admin-dashboard-client';

export default async function AdminDashboardPage() {
	const admin = await getCurrentAdmin();

	if (!admin) {
		redirect('/admin/login');
	}

	// Fetch dashboard data
	const [statsResult, overviewResult] = await Promise.all([
		getDashboardStats(),
		getTodayOverview(),
	]);

	const stats =
		statsResult.success && statsResult.data ? statsResult.data : null;
	const overview =
		overviewResult.success && overviewResult.data
			? overviewResult.data
			: null;

	return (
		<AdminDashboardClient
			admin={admin}
			stats={stats}
			overview={overview}
			logoutAction={adminLogout}
		/>
	);
}
