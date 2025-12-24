import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Subscription data for long-term spaces (shared desks, private offices)
interface SubscriptionData {
	type: 'subscription';
	spaceId: string;
	spaceName: string;
	planId: string;
	planName: string;
	unit: string; // day, week, month - determines MembershipType
	amount: number; // In Naira (display value)
	capacity: number;
	amenities: string[];
	notes?: string; // Optional special requests
}

// Booking data for short-term spaces (board room, training room, etc.)
interface BookingData {
	type: 'booking';
	spaceId: string;
	spaceName: string;
	planId: string;
	planName: string;
	date: string; // ISO string
	startTime: string; // HH:mm format
	endTime: string; // HH:mm format
	duration: number;
	unit: string;
	attendees: number;
	rate: number; // In Naira (display value)
	total: number; // In Naira (display value)
	amenities: string[];
	notes?: string; // Optional special requests
}

interface BookingStore {
	subscriptionData: SubscriptionData | null;
	bookingData: BookingData | null;
	setSubscriptionData: (data: SubscriptionData) => void;
	setBookingData: (data: BookingData) => void;
	updateNotes: (notes: string) => void;
	clearData: () => void;
}

export const useBookingStore = create<BookingStore>()(
	persist(
		(set, get) => ({
			subscriptionData: null,
			bookingData: null,
			setSubscriptionData: (data) =>
				set({ subscriptionData: data, bookingData: null }),
			setBookingData: (data) =>
				set({ bookingData: data, subscriptionData: null }),
			updateNotes: (notes) => {
				const { subscriptionData, bookingData } = get();
				if (subscriptionData) {
					set({ subscriptionData: { ...subscriptionData, notes } });
				} else if (bookingData) {
					set({ bookingData: { ...bookingData, notes } });
				}
			},
			clearData: () => set({ subscriptionData: null, bookingData: null }),
		}),
		{
			name: 'amg-booking-storage',
		}
	)
);

export type { SubscriptionData, BookingData };
