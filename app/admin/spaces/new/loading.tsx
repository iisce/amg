import { Skeleton } from '@/components/ui/skeleton';

export default function NewSpaceLoading() {
	return (
		<div className='min-h-screen bg-background'>
			<div className='container mx-auto px-4 py-8 max-w-4xl'>
				{/* Header */}
				<div className='mb-8'>
					<Skeleton className='h-10 w-32 mb-4' />
					<Skeleton className='h-8 w-48 mb-2' />
					<Skeleton className='h-6 w-96' />
				</div>

				{/* Form Card */}
				<div className='rounded-lg border bg-card p-6'>
					<div className='space-y-6'>
						{/* Basic Info Section */}
						<div>
							<Skeleton className='h-6 w-32 mb-4' />
							<div className='space-y-4'>
								<div>
									<Skeleton className='h-4 w-24 mb-2' />
									<Skeleton className='h-10 w-full' />
								</div>
								<div>
									<Skeleton className='h-4 w-24 mb-2' />
									<Skeleton className='h-24 w-full' />
								</div>
								<div className='grid gap-4 md:grid-cols-2'>
									<div>
										<Skeleton className='h-4 w-20 mb-2' />
										<Skeleton className='h-10 w-full' />
									</div>
									<div>
										<Skeleton className='h-4 w-20 mb-2' />
										<Skeleton className='h-10 w-full' />
									</div>
								</div>
							</div>
						</div>

						<Skeleton className='h-px w-full' />

						{/* Image Section */}
						<div>
							<Skeleton className='h-6 w-24 mb-4' />
							<Skeleton className='h-32 w-full rounded-lg' />
						</div>

						<Skeleton className='h-px w-full' />

						{/* Amenities Section */}
						<div>
							<Skeleton className='h-6 w-32 mb-4' />
							<div className='grid gap-3 md:grid-cols-2'>
								{Array.from({ length: 6 }).map((_, i) => (
									<Skeleton
										key={i}
										className='h-10 w-full'
									/>
								))}
							</div>
						</div>

						<Skeleton className='h-px w-full' />

						{/* Actions */}
						<div className='flex justify-end gap-4'>
							<Skeleton className='h-10 w-24' />
							<Skeleton className='h-10 w-32' />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
