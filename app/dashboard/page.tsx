import { redirect } from 'next/navigation';
import {
	getCurrentUser,
	getUserBookings,
	getUserSubscriptions,
	logout,
} from '@/actions';
import DashboardClient from './dashboard-client';

export default async function DashboardPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect('/login');
	}

	// Fetch user's bookings and subscriptions
	const [bookingsResult, subscriptionsResult] = await Promise.all([
		getUserBookings(),
		getUserSubscriptions(),
	]);

	const bookings =
		bookingsResult.success && bookingsResult.data
			? Array.isArray(bookingsResult.data)
				? bookingsResult.data
				: [bookingsResult.data]
			: [];
	const subscriptions =
		subscriptionsResult.success && subscriptionsResult.data
			? Array.isArray(subscriptionsResult.data)
				? subscriptionsResult.data
				: [subscriptionsResult.data]
			: [];

	// Separate bookings by status
	const upcomingBookings = bookings.filter(
		(b) => b.status === 'CONFIRMED' || b.status === 'PENDING'
	);
	const pastBookings = bookings.filter(
		(b) => b.status === 'COMPLETED' || b.status === 'CANCELLED'
	);

	// Separate subscriptions by status
	const activeSubscriptions = subscriptions.filter(
		(s) => s.status === 'ACTIVE'
	);
	const expiredSubscriptions = subscriptions.filter(
		(s) => s.status === 'EXPIRED' || s.status === 'CANCELLED'
	);

	return (
		<DashboardClient
			user={user}
			upcomingBookings={upcomingBookings}
			pastBookings={pastBookings}
			activeSubscriptions={activeSubscriptions}
			expiredSubscriptions={expiredSubscriptions}
			logoutAction={logout}
		/>
	);
}
