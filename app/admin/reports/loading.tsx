import { Skeleton } from '@/components/ui/skeleton';

export default function AdminReportsLoading() {
	return (
		<div className='min-h-screen bg-background'>
			<div className='container mx-auto px-4 py-8'>
				{/* Header */}
				<div className='flex justify-between items-center mb-8'>
					<div>
						<Skeleton className='h-10 w-48 mb-2' />
						<Skeleton className='h-6 w-96' />
					</div>
					<div className='flex gap-2'>
						<Skeleton className='h-10 w-32' />
						<Skeleton className='h-10 w-32' />
					</div>
				</div>

				{/* Stats Cards */}
				<div className='grid gap-6 md:grid-cols-3 mb-8'>
					{Array.from({ length: 3 }).map((_, i) => (
						<div
							key={i}
							className='rounded-lg border bg-card p-6'
						>
							<div className='flex justify-between items-start mb-2'>
								<Skeleton className='h-4 w-32' />
								<Skeleton className='h-8 w-8 rounded-md' />
							</div>
							<Skeleton className='h-8 w-32 mb-2' />
							<Skeleton className='h-3 w-24' />
						</div>
					))}
				</div>

				{/* Revenue Chart */}
				<div className='rounded-lg border bg-card p-6 mb-8'>
					<div className='flex justify-between items-center mb-6'>
						<Skeleton className='h-6 w-48' />
						<Skeleton className='h-10 w-40' />
					</div>
					<Skeleton className='h-80 w-full' />
				</div>

				{/* Space Utilization Table */}
				<div className='rounded-lg border bg-card p-6'>
					<div className='flex justify-between items-center mb-6'>
						<Skeleton className='h-6 w-48' />
						<Skeleton className='h-10 w-32' />
					</div>
					<div className='space-y-4'>
						{Array.from({ length: 6 }).map((_, i) => (
							<div
								key={i}
								className='flex items-center gap-4 pb-4 border-b last:border-0'
							>
								<Skeleton className='h-12 w-12 rounded-md' />
								<div className='flex-1'>
									<Skeleton className='h-5 w-48 mb-2' />
									<Skeleton className='h-4 w-32' />
								</div>
								<Skeleton className='h-8 w-20' />
								<Skeleton className='h-8 w-20' />
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
