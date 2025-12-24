import { Skeleton } from '@/components/ui/skeleton';

export default function PricingLoading() {
	return (
		<div className='min-h-screen bg-background'>
			<div className='container mx-auto px-4 py-12 lg:px-8'>
				{/* Header */}
				<div className='text-center mb-12'>
					<Skeleton className='h-12 w-64 mx-auto mb-4' />
					<Skeleton className='h-6 w-96 mx-auto' />
				</div>

				{/* Pricing Categories */}
				<div className='space-y-12'>
					{Array.from({ length: 3 }).map((_, categoryIndex) => (
						<div key={categoryIndex}>
							<Skeleton className='h-8 w-48 mb-6' />
							<div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
								{Array.from({ length: 6 }).map(
									(_, planIndex) => (
										<div
											key={planIndex}
											className='rounded-lg border bg-card p-6'
										>
											<Skeleton className='h-6 w-32 mb-2' />
											<Skeleton className='h-10 w-24 mb-4' />
											<Skeleton className='h-4 w-20 mb-4' />
											<Skeleton className='h-10 w-full' />
										</div>
									)
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
