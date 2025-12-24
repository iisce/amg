'use client';
import { useState } from 'react';
import {
	AlertDialogFooter,
	AlertDialogCancel,
	AlertDialogAction,
} from '@/components/ui/alert-dialog';

export function CancelSubscriptionForm({
	subscriptionId,
}: {
	subscriptionId: string;
}) {
	const [confirm, setConfirm] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault();
				setLoading(true);
				setError('');
				const res = await fetch('/api/cancel-subscription', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ id: subscriptionId }),
				});
				setLoading(false);
				if (res.ok) {
					window.location.reload();
				} else {
					setError(
						'Failed to cancel subscription. Please try again.'
					);
				}
			}}
		>
			<input
				name='confirm'
				autoComplete='off'
				className='w-full border rounded px-3 py-2 mt-2 mb-4'
				placeholder='Type CONFIRM to cancel'
				value={confirm}
				onChange={(e) => setConfirm(e.target.value)}
				required
			/>
			{error && <div className='text-red-600 text-sm mb-2'>{error}</div>}
			<AlertDialogFooter>
				<AlertDialogCancel disabled={loading}>
					Never mind
				</AlertDialogCancel>
				<AlertDialogAction
					type='submit'
					className='bg-red-600 hover:bg-red-700 text-white'
					disabled={confirm !== 'CONFIRM' || loading}
				>
					{loading ? 'Cancelling...' : 'Cancel Subscription'}
				</AlertDialogAction>
			</AlertDialogFooter>
		</form>
	);
}
