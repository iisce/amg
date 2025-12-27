import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function Loading() {
	return (
		<div className='min-h-screen bg-background'>
			{/* Header Skeleton */}
			<section className='bg-secondary text-secondary-foreground px-4 py-6 border-b'>
				<div className='container mx-auto'>
					<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
						<div>
							<Skeleton className='h-6 w-16 mb-2' />
							<Skeleton className='h-8 w-48' />
						</div>
						<div className='flex gap-2'>
							<Skeleton className='h-9 w-32' />
							<Skeleton className='h-9 w-32' />
						</div>
					</div>
				</div>
			</section>

			{/* Navigation Skeleton */}
			<section className='border-b bg-muted/30'>
				<div className='container mx-auto px-4'>
					<div className='flex gap-4 py-3'>
						{[1, 2, 3, 4, 5].map((i) => (
							<Skeleton
								key={i}
								className='h-6 w-24'
							/>
						))}
					</div>
				</div>
			</section>

			{/* Content Skeleton */}
			<section className='px-4 py-8'>
				<div className='container mx-auto space-y-6'>
					{/* Stats Grid */}
					<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
						{[1, 2, 3, 4].map((i) => (
							<Card key={i}>
								<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
									<Skeleton className='h-4 w-24' />
									<Skeleton className='h-4 w-4' />
								</CardHeader>
								<CardContent>
									<Skeleton className='h-8 w-32 mb-2' />
									<Skeleton className='h-3 w-20' />
								</CardContent>
							</Card>
						))}
					</div>

					{/* Charts Grid */}
					<div className='grid gap-6 md:grid-cols-2'>
						<Card>
							<CardHeader>
								<Skeleton className='h-6 w-32' />
							</CardHeader>
							<CardContent>
								<Skeleton className='h-64 w-full' />
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<Skeleton className='h-6 w-32' />
							</CardHeader>
							<CardContent>
								<Skeleton className='h-64 w-full' />
							</CardContent>
						</Card>
					</div>
				</div>
			</section>
		</div>
	);
}
