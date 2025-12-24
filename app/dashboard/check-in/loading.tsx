import { Skeleton } from '@/components/ui/skeleton';

export default function CheckInLoading() {
	return (
		<div className='min-h-screen bg-background'>
			<div className='container mx-auto px-4 py-8 max-w-2xl'>
				{/* Header */}
				<div className='text-center mb-8'>
					<Skeleton className='h-10 w-48 mx-auto mb-4' />
					<Skeleton className='h-6 w-96 mx-auto' />
				</div>

				{/* QR Scanner Card */}
				<div className='rounded-lg border bg-card p-8'>
					<Skeleton className='h-96 w-full mb-6 rounded-lg' />
					<Skeleton className='h-12 w-full' />
				</div>

				{/* Instructions */}
				<div className='mt-6 space-y-2'>
					<Skeleton className='h-4 w-full' />
					<Skeleton className='h-4 w-full' />
					<Skeleton className='h-4 w-3/4' />
				</div>
			</div>
		</div>
	);
}
