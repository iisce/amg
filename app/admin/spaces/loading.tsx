import { Skeleton } from '@/components/ui/skeleton';

export default function AdminSpacesLoading() {
	return (
		<div className='min-h-screen bg-background'>
			<div className='container mx-auto px-4 py-8'>
				{/* Header */}
				<div className='flex justify-between items-center mb-8'>
					<div>
						<Skeleton className='h-10 w-48 mb-2' />
						<Skeleton className='h-6 w-96' />
					</div>
					<Skeleton className='h-10 w-40' />
				</div>

				{/* Filters */}
				<div className='mb-6 flex gap-4'>
					<Skeleton className='h-10 w-64' />
					<Skeleton className='h-10 w-32' />
					<Skeleton className='h-10 w-32' />
				</div>

				{/* Table */}
				<div className='rounded-lg border bg-card'>
					<div className='p-4 border-b'>
						<div className='flex gap-4'>
							{Array.from({ length: 5 }).map((_, i) => (
								<Skeleton
									key={i}
									className='h-4 flex-1'
								/>
							))}
						</div>
					</div>
					{Array.from({ length: 8 }).map((_, i) => (
						<div
							key={i}
							className='p-4 border-b last:border-0'
						>
							<div className='flex gap-4 items-center'>
								<Skeleton className='h-16 w-16 rounded-md' />
								<div className='flex-1 space-y-2'>
									<Skeleton className='h-5 w-48' />
									<Skeleton className='h-4 w-full' />
								</div>
								<Skeleton className='h-6 w-20' />
								<Skeleton className='h-8 w-24' />
								<Skeleton className='h-8 w-8' />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
