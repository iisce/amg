import { redirect } from 'next/navigation';

export default function BookingPage() {
	redirect('/spaces?type=book');
}
