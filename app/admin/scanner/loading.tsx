import { Skeleton } from '@/components/ui/skeleton';

export default function AdminScannerLoading() {
	return (
		<div className='min-h-screen bg-background'>
			<div className='container mx-auto px-4 py-8 max-w-3xl'>
				{/* Header */}
				<div className='text-center mb-8'>
					<Skeleton className='h-10 w-48 mx-auto mb-4' />
					<Skeleton className='h-6 w-96 mx-auto' />
				</div>

				{/* Scanner Card */}
				<div className='rounded-lg border bg-card p-8 mb-6'>
					<Skeleton className='h-6 w-40 mb-4' />
					<Skeleton className='h-12 w-full mb-4' />
					<Skeleton className='h-10 w-32' />
				</div>

				{/* Instructions Card */}
				<div className='rounded-lg border bg-card p-6'>
					<Skeleton className='h-6 w-40 mb-4' />
					<div className='space-y-3'>
						<div className='flex gap-3'>
							<Skeleton className='h-6 w-6 rounded-full' />
							<Skeleton className='h-4 w-full' />
						</div>
						<div className='flex gap-3'>
							<Skeleton className='h-6 w-6 rounded-full' />
							<Skeleton className='h-4 w-full' />
						</div>
						<div className='flex gap-3'>
							<Skeleton className='h-6 w-6 rounded-full' />
							<Skeleton className='h-4 w-full' />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
