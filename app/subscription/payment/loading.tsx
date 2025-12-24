import { Skeleton } from '@/components/ui/skeleton';

export default function SubscriptionPaymentLoading() {
	return (
		<div className='min-h-screen bg-background'>
			<div className='container mx-auto px-4 py-8 max-w-4xl'>
				{/* Header */}
				<div className='text-center mb-8'>
					<Skeleton className='h-10 w-64 mx-auto mb-4' />
					<Skeleton className='h-6 w-96 mx-auto' />
				</div>

				<div className='grid gap-6 lg:grid-cols-3'>
					{/* Summary Card */}
					<div className='lg:col-span-2 rounded-lg border bg-card p-6'>
						<Skeleton className='h-6 w-48 mb-6' />
						<div className='space-y-4'>
							<div className='flex justify-between'>
								<Skeleton className='h-5 w-32' />
								<Skeleton className='h-5 w-24' />
							</div>
							<div className='flex justify-between'>
								<Skeleton className='h-5 w-32' />
								<Skeleton className='h-5 w-24' />
							</div>
							<div className='flex justify-between'>
								<Skeleton className='h-5 w-32' />
								<Skeleton className='h-5 w-24' />
							</div>
							<Skeleton className='h-px w-full' />
							<div className='flex justify-between'>
								<Skeleton className='h-6 w-24' />
								<Skeleton className='h-6 w-32' />
							</div>
						</div>
					</div>

					{/* Payment Card */}
					<div className='rounded-lg border bg-card p-6'>
						<Skeleton className='h-6 w-32 mb-6' />
						<div className='space-y-4'>
							<Skeleton className='h-10 w-full' />
							<Skeleton className='h-10 w-full' />
							<Skeleton className='h-12 w-full' />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
