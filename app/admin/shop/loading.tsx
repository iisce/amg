import { Skeleton } from '@/components/ui/skeleton';

export default function AdminShopLoading() {
	return (
		<div className='min-h-screen bg-background'>
			{/* Header Skeleton */}
			<section className='bg-secondary text-secondary-foreground px-4 py-6 border-b'>
				<div className='container mx-auto'>
					<Skeleton className='h-6 w-20 mb-2' />
					<Skeleton className='h-8 w-48 mb-2' />
					<Skeleton className='h-4 w-64' />
				</div>
			</section>

			{/* Navigation Skeleton */}
			<section className='border-b bg-muted/30'>
				<div className='container mx-auto px-4'>
					<div className='flex gap-4 py-3'>
						{[...Array(10)].map((_, i) => (
							<Skeleton
								key={i}
								className='h-6 w-20'
							/>
						))}
					</div>
				</div>
			</section>

			{/* Content Skeleton */}
			<main className='container mx-auto px-4 py-8'>
				{/* Stats Cards */}
				<div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
					{[...Array(4)].map((_, i) => (
						<div
							key={i}
							className='p-4 border rounded-lg'
						>
							<Skeleton className='h-4 w-24 mb-2' />
							<Skeleton className='h-8 w-16' />
						</div>
					))}
				</div>

				{/* Table Skeleton */}
				<div className='border rounded-lg'>
					<div className='p-4 border-b'>
						<Skeleton className='h-6 w-32' />
					</div>
					<div className='p-4 space-y-4'>
						{[...Array(5)].map((_, i) => (
							<div
								key={i}
								className='flex items-center gap-4'
							>
								<Skeleton className='h-12 w-12 rounded' />
								<div className='flex-1'>
									<Skeleton className='h-4 w-48 mb-2' />
									<Skeleton className='h-3 w-32' />
								</div>
								<Skeleton className='h-8 w-24' />
							</div>
						))}
					</div>
				</div>
			</main>
		</div>
	);
}
