import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/actions';
import { getRevenueReport, getSpaceUtilization } from '@/actions/admin';
import { prisma } from '@/lib/db';
import AdminReportsClient from './admin-reports-client';

export default async function AdminReportsPage() {
	const admin = await getCurrentAdmin();

	if (!admin) {
		redirect('/admin/login');
	}

	// Get report data
	const now = new Date();
	const thirtyDaysAgo = new Date(now);
	thirtyDaysAgo.setDate(now.getDate() - 30);

	const [
		revenueResult,
		utilizationResult,
		totalRevenue,
		totalBookings,
		totalUsers,
	] = await Promise.all([
		getRevenueReport({
			startDate: thirtyDaysAgo,
			endDate: now,
			groupBy: 'day',
		}),
		getSpaceUtilization(),
		prisma.payment.aggregate({
			where: { status: 'PAID' },
			_sum: { amount: true },
		}),
		prisma.booking.count({ where: { status: 'COMPLETED' } }),
		prisma.user.count({ where: { role: 'CLIENT' } }),
	]);

	const revenueData = revenueResult.success ? revenueResult.data! : [];
	const spaceUtilization = utilizationResult.success
		? utilizationResult.data!
		: [];

	return (
		<AdminReportsClient
			revenueData={revenueData}
			spaceUtilization={spaceUtilization}
			totalRevenue={totalRevenue._sum?.amount || 0}
			totalBookings={totalBookings}
			totalUsers={totalUsers}
		/>
	);
}
