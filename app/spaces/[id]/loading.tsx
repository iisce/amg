import { Skeleton } from '@/components/ui/skeleton';

export default function SpaceDetailLoading() {
	return (
		<div className='min-h-screen bg-background'>
			<div className='container mx-auto px-4 py-8 lg:px-8'>
				{/* Back Button */}
				<Skeleton className='h-10 w-32 mb-6' />

				<div className='grid gap-8 lg:grid-cols-2'>
					{/* Image Gallery */}
					<div>
						<Skeleton className='h-96 w-full rounded-lg mb-4' />
						<div className='grid grid-cols-4 gap-2'>
							{Array.from({ length: 4 }).map((_, i) => (
								<Skeleton
									key={i}
									className='h-20 w-full rounded-md'
								/>
							))}
						</div>
					</div>

					{/* Details */}
					<div>
						<Skeleton className='h-8 w-3/4 mb-4' />
						<Skeleton className='h-6 w-24 mb-4' />
						<Skeleton className='h-4 w-full mb-2' />
						<Skeleton className='h-4 w-full mb-2' />
						<Skeleton className='h-4 w-5/6 mb-6' />

						{/* Pricing Plans */}
						<div className='space-y-4'>
							<Skeleton className='h-6 w-32 mb-4' />
							{Array.from({ length: 3 }).map((_, i) => (
								<div
									key={i}
									className='border rounded-lg p-4'
								>
									<div className='flex justify-between items-center mb-2'>
										<Skeleton className='h-5 w-24' />
										<Skeleton className='h-6 w-20' />
									</div>
									<Skeleton className='h-4 w-full' />
								</div>
							))}
						</div>

						{/* Book Button */}
						<Skeleton className='h-12 w-full mt-6' />
					</div>
				</div>
			</div>
		</div>
	);
}
