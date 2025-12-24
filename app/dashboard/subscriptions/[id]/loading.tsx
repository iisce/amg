import { Skeleton } from '@/components/ui/skeleton';

export default function SubscriptionDetailLoading() {
	return (
		<div className='min-h-screen bg-background'>
			<div className='container mx-auto px-4 py-8 max-w-4xl'>
				{/* Back Button */}
				<Skeleton className='h-10 w-32 mb-6' />

				{/* Header */}
				<div className='mb-8'>
					<Skeleton className='h-8 w-64 mb-2' />
					<Skeleton className='h-6 w-32' />
				</div>

				{/* Stats Cards */}
				<div className='grid gap-6 md:grid-cols-3 mb-6'>
					{Array.from({ length: 3 }).map((_, i) => (
						<div
							key={i}
							className='rounded-lg border bg-card p-6'
						>
							<Skeleton className='h-4 w-20 mb-2' />
							<Skeleton className='h-8 w-24 mb-2' />
							<Skeleton className='h-3 w-16' />
						</div>
					))}
				</div>

				{/* Details Card */}
				<div className='rounded-lg border bg-card p-6 mb-6'>
					<Skeleton className='h-6 w-48 mb-6' />
					<div className='grid gap-4 md:grid-cols-2'>
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i}>
								<Skeleton className='h-4 w-24 mb-2' />
								<Skeleton className='h-6 w-full' />
							</div>
						))}
					</div>
				</div>

				{/* Actions */}
				<div className='flex gap-4'>
					<Skeleton className='h-10 w-32' />
					<Skeleton className='h-10 w-32' />
				</div>
			</div>
		</div>
	);
}
