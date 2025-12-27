import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/actions';
import {
	getTransactionSummary,
	getRevenueByPeriod,
	getRevenueBySource,
	getFinanceSettings,
} from '@/actions/finance';
import AdminFinanceClient from './admin-finance-client';

export default async function AdminFinancePage() {
	const admin = await getCurrentAdmin();

	if (!admin) {
		redirect('/admin/login');
	}

	// Get date range for last 30 days
	const now = new Date();
	const thirtyDaysAgo = new Date(now);
	thirtyDaysAgo.setDate(now.getDate() - 30);

	const [summaryResult, revenueResult, sourceResult, settingsResult] =
		await Promise.all([
			getTransactionSummary({
				startDate: thirtyDaysAgo,
				endDate: now,
			}),
			getRevenueByPeriod({
				startDate: thirtyDaysAgo,
				endDate: now,
				groupBy: 'day',
			}),
			getRevenueBySource({
				startDate: thirtyDaysAgo,
				endDate: now,
			}),
			getFinanceSettings(),
		]);

	return (
		<AdminFinanceClient
			admin={admin}
			summary={summaryResult.data || null}
			revenueByPeriod={revenueResult.data || []}
			revenueBySource={sourceResult.data || []}
			settings={settingsResult.data || null}
		/>
	);
}
