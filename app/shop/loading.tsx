import { Skeleton } from '@/components/ui/skeleton';

export default function ShopLoading() {
	return (
		<div className='min-h-screen bg-background'>
			{/* Hero Skeleton */}
			<section className='bg-secondary py-12 px-4'>
				<div className='container mx-auto'>
					<Skeleton className='h-10 w-48 mb-4' />
					<Skeleton className='h-5 w-96' />
				</div>
			</section>

			{/* Categories Skeleton */}
			<section className='container mx-auto px-4 py-8'>
				<div className='flex gap-2 mb-8 overflow-x-auto'>
					{[...Array(5)].map((_, i) => (
						<Skeleton
							key={i}
							className='h-10 w-24 rounded-full shrink-0'
						/>
					))}
				</div>

				{/* Items Grid Skeleton */}
				<div className='grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
					{[...Array(8)].map((_, i) => (
						<div
							key={i}
							className='border rounded-lg overflow-hidden'
						>
							<Skeleton className='aspect-square' />
							<div className='p-4 space-y-2'>
								<Skeleton className='h-5 w-3/4' />
								<Skeleton className='h-4 w-1/2' />
								<Skeleton className='h-6 w-20' />
							</div>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}
