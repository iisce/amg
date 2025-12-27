import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function FinanceSettingsLoading() {
	return (
		<div className='min-h-screen bg-background'>
			{/* Admin Header Skeleton */}
			<section className='bg-secondary text-secondary-foreground px-4 py-6 border-b'>
				<div className='container mx-auto'>
					<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
						<div className='space-y-2'>
							<div className='flex items-center gap-2'>
								<Skeleton className='h-5 w-14 rounded-full' />
								<Skeleton className='h-4 w-24' />
							</div>
							<Skeleton className='h-8 w-48' />
							<Skeleton className='h-4 w-72' />
						</div>
						<div className='flex gap-2'>
							<Skeleton className='h-10 w-36' />
							<Skeleton className='h-10 w-32' />
						</div>
					</div>
				</div>
			</section>

			{/* Navigation Skeleton */}
			<section className='border-b bg-muted/30'>
				<div className='container mx-auto px-4'>
					<nav className='flex gap-1'>
						{[1, 2, 3, 4, 5].map((i) => (
							<Skeleton
								key={i}
								className='h-10 w-24'
							/>
						))}
					</nav>
				</div>
			</section>

			{/* Content Skeleton */}
			<section className='px-4 py-8'>
				<div className='container mx-auto max-w-4xl space-y-6'>
					{/* Tax Settings Card */}
					<Card>
						<CardHeader>
							<Skeleton className='h-6 w-32' />
							<Skeleton className='h-4 w-64' />
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='flex items-center justify-between rounded-lg border p-4'>
								<div className='space-y-2'>
									<Skeleton className='h-5 w-40' />
									<Skeleton className='h-4 w-72' />
								</div>
								<Skeleton className='h-6 w-12 rounded-full' />
							</div>
							<div className='grid gap-4 md:grid-cols-2 pt-4'>
								<div className='space-y-2'>
									<Skeleton className='h-4 w-20' />
									<Skeleton className='h-10 w-full' />
								</div>
								<div className='space-y-2'>
									<Skeleton className='h-4 w-20' />
									<Skeleton className='h-10 w-full' />
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Currency Settings Card */}
					<Card>
						<CardHeader>
							<Skeleton className='h-6 w-40' />
							<Skeleton className='h-4 w-56' />
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='space-y-2'>
								<Skeleton className='h-4 w-20' />
								<Skeleton className='h-10 w-full' />
							</div>
						</CardContent>
					</Card>

					{/* Invoice Settings Card */}
					<Card>
						<CardHeader>
							<Skeleton className='h-6 w-36' />
							<Skeleton className='h-4 w-60' />
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='space-y-2'>
								<Skeleton className='h-4 w-32' />
								<Skeleton className='h-10 w-48' />
							</div>
							<div className='space-y-2'>
								<Skeleton className='h-4 w-36' />
								<Skeleton className='h-24 w-full' />
							</div>
						</CardContent>
					</Card>
				</div>
			</section>
		</div>
	);
}
