import { Skeleton } from '@/components/ui/skeleton';

export default function EditSpaceLoading() {
	return (
		<div className='min-h-screen bg-background'>
			<section className='bg-secondary px-4 py-6 border-b'>
				<div className='container mx-auto'>
					<div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
						<div className='flex items-center gap-4'>
							<Skeleton className='h-10 w-10 rounded' />
							<div className='space-y-2'>
								<div className='flex gap-2'>
									<Skeleton className='h-5 w-16' />
									<Skeleton className='h-5 w-20' />
								</div>
								<Skeleton className='h-6 w-48' />
							</div>
						</div>
						<div className='flex gap-2'>
							<Skeleton className='h-10 w-24' />
							<Skeleton className='h-10 w-32' />
						</div>
					</div>
				</div>
			</section>
			<section className='px-4 py-8'>
				<div className='container mx-auto max-w-4xl space-y-8'>
					{/* Basic Information Card */}
					<div className='rounded-lg border bg-card'>
						<div className='p-6 space-y-2 border-b'>
							<Skeleton className='h-6 w-40' />
							<Skeleton className='h-4 w-60' />
						</div>
						<div className='p-6 space-y-6'>
							<Skeleton className='h-10 w-full' />
							<div className='grid gap-4 sm:grid-cols-2'>
								<Skeleton className='h-10 w-full' />
								<Skeleton className='h-10 w-full' />
							</div>
							<Skeleton className='h-20 w-full' />
							<Skeleton className='h-32 w-full' />
						</div>
					</div>

					{/* Category & Type Card */}
					<div className='rounded-lg border bg-card'>
						<div className='p-6 space-y-2 border-b'>
							<Skeleton className='h-6 w-36' />
							<Skeleton className='h-4 w-52' />
						</div>
						<div className='p-6'>
							<div className='grid gap-6 sm:grid-cols-2'>
								<Skeleton className='h-10 w-full' />
								<Skeleton className='h-10 w-full' />
							</div>
						</div>
					</div>

					{/* Amenities Card */}
					<div className='rounded-lg border bg-card'>
						<div className='p-6 space-y-2 border-b'>
							<Skeleton className='h-6 w-24' />
							<Skeleton className='h-4 w-48' />
						</div>
						<div className='p-6 space-y-4'>
							<div className='flex flex-wrap gap-2'>
								{Array.from({ length: 6 }).map((_, i) => (
									<Skeleton
										key={i}
										className='h-6 w-20'
									/>
								))}
							</div>
							<Skeleton className='h-10 w-full' />
						</div>
					</div>

					{/* Features Card */}
					<div className='rounded-lg border bg-card'>
						<div className='p-6 space-y-2 border-b'>
							<Skeleton className='h-6 w-20' />
							<Skeleton className='h-4 w-56' />
						</div>
						<div className='p-6 space-y-4'>
							<div className='flex flex-wrap gap-2'>
								{Array.from({ length: 4 }).map((_, i) => (
									<Skeleton
										key={i}
										className='h-6 w-24'
									/>
								))}
							</div>
							<Skeleton className='h-10 w-full' />
						</div>
					</div>

					{/* Images Card */}
					<div className='rounded-lg border bg-card'>
						<div className='p-6 space-y-2 border-b'>
							<Skeleton className='h-6 w-20' />
							<Skeleton className='h-4 w-56' />
						</div>
						<div className='p-6 space-y-4'>
							<div className='grid gap-4 grid-cols-2 md:grid-cols-3'>
								{Array.from({ length: 3 }).map((_, i) => (
									<Skeleton
										key={i}
										className='aspect-video rounded-lg'
									/>
								))}
							</div>
							<Skeleton className='h-10 w-full' />
						</div>
					</div>

					{/* Display Settings Card */}
					<div className='rounded-lg border bg-card'>
						<div className='p-6 space-y-2 border-b'>
							<Skeleton className='h-6 w-36' />
							<Skeleton className='h-4 w-60' />
						</div>
						<div className='p-6 space-y-6'>
							<Skeleton className='h-20 w-full rounded-lg' />
							<Skeleton className='h-10 w-full' />
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
