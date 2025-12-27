import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/actions';
import {
	getRevenueOverview,
	getRevenueTrends,
	getClientOverview,
	getTopClientsByRevenue,
	getBookingOverview,
	getPopularSpaces,
	getTopShopItems,
	getMembershipOverview,
	getReportSpaceUtilization,
	getClientLeaderboard,
	getEarlyBirdClients,
	getPopularMembershipPlans,
	getVisitorOverview,
	getVisitorTrends,
	getRepeatVisitors,
	getCheckInOverview,
	getCheckInTrends,
	getBookingTrends,
	getPeakBookingHours,
	type TimeFrame,
} from '@/actions/reports';
import AdminReportsClient from './admin-reports-client';

interface SearchParams {
	timeframe?: string;
	start?: string;
	end?: string;
	tab?: string;
}

export default async function AdminReportsPage({
	searchParams,
}: {
	searchParams: Promise<SearchParams>;
}) {
	const admin = await getCurrentAdmin();
	if (!admin) {
		redirect('/admin/login');
	}

	const params = await searchParams;
	const timeFrame = (params.timeframe as TimeFrame) || 'last30days';
	const customRange =
		params.start && params.end
			? { start: params.start, end: params.end }
			: undefined;
	const activeTab = params.tab || 'overview';

	// Fetch all data in parallel
	const [
		revenueOverview,
		revenueTrends,
		clientOverview,
		topClients,
		bookingOverview,
		popularSpaces,
		topShopItems,
		membershipOverview,
		spaceUtilization,
		leaderboard,
		earlyBirds,
		popularMembershipPlans,
		visitorOverview,
		visitorTrends,
		repeatVisitors,
		checkInOverview,
		checkInTrends,
		bookingTrends,
		peakHours,
	] = await Promise.all([
		getRevenueOverview(timeFrame, customRange),
		getRevenueTrends(timeFrame, customRange),
		getClientOverview(timeFrame, customRange),
		getTopClientsByRevenue(timeFrame, customRange, 10),
		getBookingOverview(timeFrame, customRange),
		getPopularSpaces(timeFrame, customRange, 10),
		getTopShopItems(timeFrame, customRange, 10),
		getMembershipOverview(timeFrame, customRange),
		getReportSpaceUtilization(timeFrame, customRange),
		getClientLeaderboard(timeFrame, customRange, 10),
		getEarlyBirdClients(timeFrame, customRange, 10),
		getPopularMembershipPlans(timeFrame, customRange, 10),
		getVisitorOverview(timeFrame, customRange),
		getVisitorTrends(timeFrame, customRange),
		getRepeatVisitors(timeFrame, customRange, 10),
		getCheckInOverview(timeFrame, customRange),
		getCheckInTrends(timeFrame, customRange),
		getBookingTrends(timeFrame, customRange),
		getPeakBookingHours(timeFrame, customRange),
	]);

	return (
		<AdminReportsClient
			admin={admin}
			timeFrame={timeFrame}
			customRange={customRange}
			activeTab={activeTab}
			revenueOverview={revenueOverview.data || null}
			revenueTrends={revenueTrends.data || []}
			clientOverview={clientOverview.data || null}
			topClients={topClients.data || []}
			bookingOverview={bookingOverview.data || null}
			popularSpaces={popularSpaces.data || []}
			topShopItems={topShopItems.data || []}
			membershipOverview={membershipOverview.data || null}
			spaceUtilization={spaceUtilization.data || []}
			leaderboard={leaderboard.data || null}
			earlyBirds={earlyBirds.data || []}
			popularMembershipPlans={popularMembershipPlans.data || []}
			visitorOverview={visitorOverview.data || null}
			visitorTrends={visitorTrends.data || []}
			repeatVisitors={repeatVisitors.data || []}
			checkInOverview={checkInOverview.data || null}
			checkInTrends={checkInTrends.data || []}
			bookingTrends={bookingTrends.data || []}
			peakHours={peakHours.data || []}
		/>
	);
}
