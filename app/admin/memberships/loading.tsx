import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function Loading() {
	return (
		<div className='min-h-screen bg-background'>
			{/* Header Skeleton */}
			<section className='bg-secondary text-secondary-foreground px-4 py-6 border-b'>
				<div className='container mx-auto'>
					<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
						<div className='space-y-2'>
							<Skeleton className='h-5 w-40' />
							<Skeleton className='h-8 w-56' />
							<Skeleton className='h-4 w-72' />
						</div>
						<Skeleton className='h-9 w-32' />
					</div>

					{/* Navigation Skeleton */}
					<div className='flex gap-4 mt-6'>
						{Array.from({ length: 7 }).map((_, i) => (
							<Skeleton
								key={i}
								className='h-10 w-24'
							/>
						))}
					</div>
				</div>
			</section>

			{/* Main Content */}
			<main className='container mx-auto px-4 py-8'>
				{/* Stats Overview Skeleton */}
				<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 mb-8'>
					{Array.from({ length: 7 }).map((_, i) => (
						<Card key={i}>
							<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
								<Skeleton className='h-4 w-16' />
								<Skeleton className='h-4 w-4' />
							</CardHeader>
							<CardContent>
								<Skeleton className='h-8 w-12' />
							</CardContent>
						</Card>
					))}
				</div>

				{/* Filters Skeleton */}
				<Card className='mb-6'>
					<CardContent className='pt-6'>
						<div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
							<Skeleton className='h-10 flex-1' />
							<Skeleton className='h-10 w-[150px]' />
							<Skeleton className='h-10 w-[180px]' />
						</div>
					</CardContent>
				</Card>

				{/* Tabs Skeleton */}
				<div className='flex gap-2 mb-4'>
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton
							key={i}
							className='h-9 w-24'
						/>
					))}
				</div>

				{/* Table Skeleton */}
				<Card>
					<CardContent className='pt-6'>
						<div className='space-y-4'>
							{/* Header */}
							<div className='flex gap-4 border-b pb-4'>
								<Skeleton className='h-4 w-28' />
								<Skeleton className='h-4 w-32' />
								<Skeleton className='h-4 w-24' />
								<Skeleton className='h-4 w-20' />
								<Skeleton className='h-4 w-32' />
								<Skeleton className='h-4 w-20' />
								<Skeleton className='h-4 w-16' />
							</div>
							{/* Rows */}
							{Array.from({ length: 8 }).map((_, i) => (
								<div
									key={i}
									className='flex gap-4 items-center py-2'
								>
									<Skeleton className='h-5 w-28' />
									<div className='space-y-1'>
										<Skeleton className='h-4 w-32' />
										<Skeleton className='h-3 w-40' />
									</div>
									<div className='space-y-1'>
										<Skeleton className='h-4 w-24' />
										<Skeleton className='h-3 w-28' />
									</div>
									<Skeleton className='h-6 w-20' />
									<div className='space-y-1'>
										<Skeleton className='h-4 w-24' />
										<Skeleton className='h-3 w-24' />
									</div>
									<Skeleton className='h-5 w-20' />
									<Skeleton className='h-8 w-8' />
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
