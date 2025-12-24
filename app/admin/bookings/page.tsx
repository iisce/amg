import { redirect } from 'next/navigation';
import { getCurrentAdmin, getBookings } from '@/actions';
import AdminBookingsClient from './admin-bookings-client';

export default async function AdminBookingsPage() {
	const admin = await getCurrentAdmin();

	if (!admin) {
		redirect('/admin/login');
	}

	const bookingsResult = await getBookings({ limit: 100 });
	const bookings =
		bookingsResult.success && bookingsResult.data
			? Array.isArray(bookingsResult.data)
				? bookingsResult.data
				: [bookingsResult.data]
			: [];

	return <AdminBookingsClient bookings={bookings} />;
}
