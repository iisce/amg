import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileLoading() {
	return (
		<div className='min-h-screen bg-background'>
			<div className='container mx-auto px-4 py-8 max-w-4xl'>
				{/* Header */}
				<div className='mb-8'>
					<Skeleton className='h-10 w-48 mb-2' />
					<Skeleton className='h-6 w-96' />
				</div>

				<div className='grid gap-6 lg:grid-cols-3'>
					{/* Profile Card */}
					<div className='rounded-lg border bg-card p-6'>
						<div className='text-center mb-6'>
							<Skeleton className='h-24 w-24 rounded-full mx-auto mb-4' />
							<Skeleton className='h-6 w-32 mx-auto mb-2' />
							<Skeleton className='h-4 w-24 mx-auto' />
						</div>
						<div className='space-y-4'>
							<div>
								<Skeleton className='h-4 w-16 mb-2' />
								<Skeleton className='h-5 w-full' />
							</div>
							<div>
								<Skeleton className='h-4 w-16 mb-2' />
								<Skeleton className='h-5 w-full' />
							</div>
							<div>
								<Skeleton className='h-4 w-16 mb-2' />
								<Skeleton className='h-5 w-full' />
							</div>
						</div>
					</div>

					{/* Form Section */}
					<div className='lg:col-span-2 space-y-6'>
						{/* Personal Info */}
						<div className='rounded-lg border bg-card p-6'>
							<Skeleton className='h-6 w-48 mb-6' />
							<div className='space-y-4'>
								<div>
									<Skeleton className='h-4 w-20 mb-2' />
									<Skeleton className='h-10 w-full' />
								</div>
								<div>
									<Skeleton className='h-4 w-20 mb-2' />
									<Skeleton className='h-10 w-full' />
								</div>
								<div>
									<Skeleton className='h-4 w-20 mb-2' />
									<Skeleton className='h-10 w-full' />
								</div>
								<Skeleton className='h-10 w-32' />
							</div>
						</div>

						{/* Change Password */}
						<div className='rounded-lg border bg-card p-6'>
							<Skeleton className='h-6 w-48 mb-6' />
							<div className='space-y-4'>
								<div>
									<Skeleton className='h-4 w-32 mb-2' />
									<Skeleton className='h-10 w-full' />
								</div>
								<div>
									<Skeleton className='h-4 w-32 mb-2' />
									<Skeleton className='h-10 w-full' />
								</div>
								<div>
									<Skeleton className='h-4 w-32 mb-2' />
									<Skeleton className='h-10 w-full' />
								</div>
								<Skeleton className='h-10 w-32' />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
