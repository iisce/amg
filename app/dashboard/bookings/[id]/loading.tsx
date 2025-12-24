import { Skeleton } from '@/components/ui/skeleton';

export default function BookingDetailLoading() {
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

				{/* Main Card */}
				<div className='rounded-lg border bg-card p-6 mb-6'>
					{/* Status Badge */}
					<Skeleton className='h-6 w-24 mb-6' />

					{/* Details Grid */}
					<div className='grid gap-6 md:grid-cols-2'>
						<div className='space-y-4'>
							<div>
								<Skeleton className='h-4 w-20 mb-2' />
								<Skeleton className='h-6 w-full' />
							</div>
							<div>
								<Skeleton className='h-4 w-20 mb-2' />
								<Skeleton className='h-6 w-full' />
							</div>
							<div>
								<Skeleton className='h-4 w-20 mb-2' />
								<Skeleton className='h-6 w-full' />
							</div>
						</div>
						<div className='space-y-4'>
							<div>
								<Skeleton className='h-4 w-20 mb-2' />
								<Skeleton className='h-6 w-full' />
							</div>
							<div>
								<Skeleton className='h-4 w-20 mb-2' />
								<Skeleton className='h-6 w-full' />
							</div>
							<div>
								<Skeleton className='h-4 w-20 mb-2' />
								<Skeleton className='h-6 w-full' />
							</div>
						</div>
					</div>
				</div>

				{/* QR Code Section */}
				<div className='rounded-lg border bg-card p-6 text-center'>
					<Skeleton className='h-6 w-32 mx-auto mb-4' />
					<Skeleton className='h-64 w-64 mx-auto mb-4' />
					<Skeleton className='h-4 w-48 mx-auto' />
				</div>
			</div>
		</div>
	);
}
