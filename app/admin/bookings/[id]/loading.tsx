import { Skeleton } from '@/components/ui/skeleton';

export default function AdminBookingDetailLoading() {
	return (
		<div className='min-h-screen bg-background'>
			<div className='container mx-auto px-4 py-8 max-w-4xl'>
				{/* Header */}
				<div className='flex justify-between items-start mb-8'>
					<div>
						<Skeleton className='h-10 w-32 mb-4' />
						<Skeleton className='h-8 w-64 mb-2' />
						<Skeleton className='h-6 w-48' />
					</div>
					<Skeleton className='h-8 w-24' />
				</div>

				{/* User Info Card */}
				<div className='rounded-lg border bg-card p-6 mb-6'>
					<Skeleton className='h-6 w-32 mb-4' />
					<div className='grid gap-4 md:grid-cols-2'>
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i}>
								<Skeleton className='h-4 w-20 mb-2' />
								<Skeleton className='h-5 w-full' />
							</div>
						))}
					</div>
				</div>

				{/* Booking Details Card */}
				<div className='rounded-lg border bg-card p-6 mb-6'>
					<Skeleton className='h-6 w-40 mb-4' />
					<div className='grid gap-4 md:grid-cols-2'>
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i}>
								<Skeleton className='h-4 w-24 mb-2' />
								<Skeleton className='h-5 w-full' />
							</div>
						))}
					</div>
				</div>

				{/* Payment Info Card */}
				<div className='rounded-lg border bg-card p-6 mb-6'>
					<Skeleton className='h-6 w-40 mb-4' />
					<div className='grid gap-4 md:grid-cols-2'>
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i}>
								<Skeleton className='h-4 w-24 mb-2' />
								<Skeleton className='h-5 w-full' />
							</div>
						))}
					</div>
				</div>

				{/* Actions */}
				<div className='flex gap-4'>
					<Skeleton className='h-10 w-32' />
					<Skeleton className='h-10 w-32' />
					<Skeleton className='h-10 w-32' />
				</div>
			</div>
		</div>
	);
}
