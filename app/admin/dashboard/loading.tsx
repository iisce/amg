import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboardLoading() {
	return (
		<div className='min-h-screen bg-background'>
			<div className='container mx-auto px-4 py-8'>
				{/* Header */}
				<div className='mb-8'>
					<Skeleton className='h-10 w-64 mb-2' />
					<Skeleton className='h-6 w-96' />
				</div>

				{/* Stats Grid */}
				<div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8'>
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className='rounded-lg border bg-card p-6'
						>
							<div className='flex justify-between items-start mb-2'>
								<Skeleton className='h-4 w-24' />
								<Skeleton className='h-8 w-8 rounded-md' />
							</div>
							<Skeleton className='h-8 w-20 mb-2' />
							<Skeleton className='h-3 w-32' />
						</div>
					))}
				</div>

				{/* Charts Section */}
				<div className='grid gap-6 lg:grid-cols-2 mb-8'>
					<div className='rounded-lg border bg-card p-6'>
						<Skeleton className='h-6 w-48 mb-6' />
						<Skeleton className='h-64 w-full' />
					</div>
					<div className='rounded-lg border bg-card p-6'>
						<Skeleton className='h-6 w-48 mb-6' />
						<Skeleton className='h-64 w-full' />
					</div>
				</div>

				{/* Recent Activity */}
				<div className='rounded-lg border bg-card p-6'>
					<Skeleton className='h-6 w-48 mb-6' />
					<div className='space-y-4'>
						{Array.from({ length: 5 }).map((_, i) => (
							<div
								key={i}
								className='flex items-center gap-4 pb-4 border-b last:border-0'
							>
								<Skeleton className='h-10 w-10 rounded-full' />
								<div className='flex-1'>
									<Skeleton className='h-4 w-64 mb-2' />
									<Skeleton className='h-3 w-32' />
								</div>
								<Skeleton className='h-8 w-20' />
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
