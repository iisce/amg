import { redirect } from 'next/navigation';

export default function SubscriptionPage() {
	redirect('/spaces?type=subscribe');
}
