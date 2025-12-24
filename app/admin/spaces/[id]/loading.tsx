import { Skeleton } from '@/components/ui/skeleton';

export default function AdminSpaceDetailLoading() {
	return (
		<div className='min-h-screen bg-background'>
			<div className='container mx-auto px-4 py-8'>
				{/* Header */}
				<div className='flex justify-between items-center mb-8'>
					<div>
						<Skeleton className='h-10 w-32 mb-4' />
						<Skeleton className='h-8 w-64 mb-2' />
						<Skeleton className='h-6 w-48' />
					</div>
					<div className='flex gap-2'>
						<Skeleton className='h-10 w-24' />
						<Skeleton className='h-10 w-24' />
					</div>
				</div>

				<div className='grid gap-6 lg:grid-cols-3'>
					{/* Main Content */}
					<div className='lg:col-span-2 space-y-6'>
						{/* Image */}
						<div className='rounded-lg border bg-card p-6'>
							<Skeleton className='h-64 w-full rounded-lg' />
						</div>

						{/* Details */}
						<div className='rounded-lg border bg-card p-6'>
							<Skeleton className='h-6 w-32 mb-6' />
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
					</div>

					{/* Sidebar */}
					<div className='space-y-6'>
						{/* Status */}
						<div className='rounded-lg border bg-card p-6'>
							<Skeleton className='h-6 w-24 mb-4' />
							<Skeleton className='h-10 w-full' />
						</div>

						{/* Pricing Plans */}
						<div className='rounded-lg border bg-card p-6'>
							<Skeleton className='h-6 w-32 mb-4' />
							<div className='space-y-3'>
								{Array.from({ length: 3 }).map((_, i) => (
									<div
										key={i}
										className='p-3 border rounded-md'
									>
										<Skeleton className='h-5 w-24 mb-2' />
										<Skeleton className='h-6 w-20' />
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
