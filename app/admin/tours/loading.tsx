import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function AdminToursLoading() {
	return (
		<div className='p-6 space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<Skeleton className='h-9 w-48' />
					<Skeleton className='h-5 w-64 mt-2' />
				</div>
				<Skeleton className='h-9 w-24' />
			</div>

			{/* Stats */}
			<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
				{[1, 2, 3, 4].map((i) => (
					<Card key={i}>
						<CardHeader className='flex flex-row items-center justify-between pb-2'>
							<Skeleton className='h-4 w-20' />
							<Skeleton className='h-4 w-4' />
						</CardHeader>
						<CardContent>
							<Skeleton className='h-8 w-12 mb-1' />
							<Skeleton className='h-3 w-28' />
						</CardContent>
					</Card>
				))}
			</div>

			{/* Table */}
			<Card>
				<CardHeader>
					<Skeleton className='h-6 w-32' />
					<Skeleton className='h-4 w-48' />
				</CardHeader>
				<CardContent>
					<div className='flex items-center gap-4 mb-4'>
						<Skeleton className='h-10 w-64' />
						<Skeleton className='h-10 w-80' />
					</div>
					<div className='space-y-4'>
						{[1, 2, 3, 4, 5].map((i) => (
							<div
								key={i}
								className='flex items-center justify-between py-4 border-b'
							>
								<div className='flex items-center gap-4 flex-1'>
									<div>
										<Skeleton className='h-4 w-32 mb-1' />
										<Skeleton className='h-3 w-24' />
									</div>
									<div>
										<Skeleton className='h-4 w-40 mb-1' />
										<Skeleton className='h-3 w-28' />
									</div>
									<div>
										<Skeleton className='h-4 w-24 mb-1' />
										<Skeleton className='h-3 w-16' />
									</div>
									<Skeleton className='h-4 w-8' />
									<Skeleton className='h-6 w-20' />
								</div>
								<Skeleton className='h-8 w-8' />
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
