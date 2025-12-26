import { notFound } from 'next/navigation';
import { getCurrentAdmin, getSubscriptionById } from '@/actions';
import { AdminTeamManagement } from './admin-team-management';

interface PageProps {
	params: Promise<{ id: string; membershipId: string }>;
}

export default async function AdminTeamPage({ params }: PageProps) {
	const { id, membershipId } = await params;

	// Check admin auth
	const admin = await getCurrentAdmin();
	if (!admin) {
		notFound();
	}

	// Fetch subscription
	const result = await getSubscriptionById(membershipId);
	if (!result.success || !result.data) {
		notFound();
	}

	const subscription = result.data;

	// Verify user ID matches
	if (subscription.user.id !== id) {
		notFound();
	}

	return (
		<div className='container mx-auto py-6 max-w-5xl'>
			<AdminTeamManagement
				membershipId={membershipId}
				membershipNumber={subscription.membershipNumber}
				companyName={subscription.companyName}
				maxMembers={subscription.maxMembers}
				spaceName={subscription.space.name}
				userName={subscription.user.name || subscription.user.email}
				userId={id}
			/>
		</div>
	);
}
