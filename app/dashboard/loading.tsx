import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
	return (
		<div className='min-h-screen bg-background'>
			<div className='container mx-auto px-4 py-8'>
				{/* Welcome Header */}
				<div className='mb-8'>
					<Skeleton className='h-10 w-64 mb-2' />
					<Skeleton className='h-6 w-96' />
				</div>

				{/* Stats Cards */}
				<div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8'>
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className='rounded-lg border bg-card p-6'
						>
							<Skeleton className='h-4 w-24 mb-2' />
							<Skeleton className='h-8 w-16 mb-2' />
							<Skeleton className='h-3 w-32' />
						</div>
					))}
				</div>

				{/* Tabs */}
				<div className='mb-6'>
					<div className='flex gap-4 border-b'>
						<Skeleton className='h-10 w-32' />
						<Skeleton className='h-10 w-32' />
					</div>
				</div>

				{/* Content Cards */}
				<div className='space-y-4'>
					{Array.from({ length: 3 }).map((_, i) => (
						<div
							key={i}
							className='rounded-lg border bg-card p-6'
						>
							<div className='flex justify-between items-start mb-4'>
								<div className='flex-1'>
									<Skeleton className='h-6 w-48 mb-2' />
									<Skeleton className='h-4 w-32' />
								</div>
								<Skeleton className='h-8 w-20' />
							</div>
							<div className='grid gap-2 md:grid-cols-2'>
								<Skeleton className='h-4 w-full' />
								<Skeleton className='h-4 w-full' />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
