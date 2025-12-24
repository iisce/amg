import { Skeleton } from '@/components/ui/skeleton';

export default function SpacesLoading() {
	return (
		<div className='min-h-screen bg-background'>
			<div className='container mx-auto px-4 py-8 lg:px-8'>
				{/* Header */}
				<div className='mb-8'>
					<Skeleton className='h-10 w-64 mb-4' />
					<Skeleton className='h-6 w-96' />
				</div>

				{/* Filters */}
				<div className='mb-8 flex flex-wrap gap-4'>
					<Skeleton className='h-10 w-32' />
					<Skeleton className='h-10 w-32' />
					<Skeleton className='h-10 w-32' />
				</div>

				{/* Spaces Grid */}
				<div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
					{Array.from({ length: 6 }).map((_, i) => (
						<div
							key={i}
							className='rounded-lg border bg-card p-4'
						>
							<Skeleton className='h-48 w-full mb-4 rounded-md' />
							<Skeleton className='h-6 w-3/4 mb-2' />
							<Skeleton className='h-4 w-full mb-2' />
							<Skeleton className='h-4 w-5/6 mb-4' />
							<div className='flex justify-between items-center'>
								<Skeleton className='h-8 w-24' />
								<Skeleton className='h-10 w-28' />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
