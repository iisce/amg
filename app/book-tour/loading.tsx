import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function BookTourLoading() {
	return (
		<div className='min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-12 px-4'>
			<div className='max-w-4xl mx-auto'>
				{/* Header */}
				<div className='text-center mb-10'>
					<Skeleton className='h-10 w-80 mx-auto mb-4' />
					<Skeleton className='h-6 w-full max-w-2xl mx-auto' />
				</div>

				<div className='grid md:grid-cols-3 gap-8'>
					{/* Form Skeleton */}
					<div className='md:col-span-2'>
						<Card>
							<CardHeader>
								<Skeleton className='h-6 w-40' />
								<Skeleton className='h-4 w-72' />
							</CardHeader>
							<CardContent className='space-y-6'>
								{/* Contact Section */}
								<div className='space-y-4'>
									<Skeleton className='h-5 w-48' />
									<div className='grid sm:grid-cols-2 gap-4'>
										<div className='space-y-2'>
											<Skeleton className='h-4 w-20' />
											<Skeleton className='h-10 w-full' />
										</div>
										<div className='space-y-2'>
											<Skeleton className='h-4 w-20' />
											<Skeleton className='h-10 w-full' />
										</div>
									</div>
									<div className='grid sm:grid-cols-2 gap-4'>
										<div className='space-y-2'>
											<Skeleton className='h-4 w-24' />
											<Skeleton className='h-10 w-full' />
										</div>
										<div className='space-y-2'>
											<Skeleton className='h-4 w-28' />
											<Skeleton className='h-10 w-full' />
										</div>
									</div>
								</div>

								{/* Schedule Section */}
								<div className='space-y-4'>
									<Skeleton className='h-5 w-44' />
									<div className='grid sm:grid-cols-2 gap-4'>
										<div className='space-y-2'>
											<Skeleton className='h-4 w-28' />
											<Skeleton className='h-10 w-full' />
										</div>
										<div className='space-y-2'>
											<Skeleton className='h-4 w-28' />
											<Skeleton className='h-10 w-full' />
										</div>
									</div>
								</div>

								{/* Interests Section */}
								<div className='space-y-4'>
									<Skeleton className='h-5 w-56' />
									<div className='grid sm:grid-cols-2 gap-4'>
										<div className='space-y-2'>
											<Skeleton className='h-4 w-20' />
											<Skeleton className='h-10 w-full' />
										</div>
										<div className='space-y-2'>
											<Skeleton className='h-4 w-32' />
											<Skeleton className='h-10 w-full' />
										</div>
									</div>
								</div>

								{/* Message */}
								<div className='space-y-2'>
									<Skeleton className='h-4 w-40' />
									<Skeleton className='h-24 w-full' />
								</div>

								{/* Submit Button */}
								<Skeleton className='h-12 w-full' />
							</CardContent>
						</Card>
					</div>

					{/* Sidebar Skeletons */}
					<div className='space-y-6'>
						<Card>
							<CardHeader>
								<Skeleton className='h-5 w-32' />
							</CardHeader>
							<CardContent className='space-y-3'>
								{[1, 2, 3, 4, 5].map((i) => (
									<div
										key={i}
										className='flex items-center gap-2'
									>
										<Skeleton className='h-4 w-4' />
										<Skeleton className='h-4 w-full' />
									</div>
								))}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<Skeleton className='h-5 w-24' />
							</CardHeader>
							<CardContent className='space-y-2'>
								<Skeleton className='h-4 w-32' />
								<Skeleton className='h-4 w-40' />
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<Skeleton className='h-5 w-28' />
							</CardHeader>
							<CardContent className='space-y-3'>
								<Skeleton className='h-4 w-44' />
								<Skeleton className='h-4 w-36' />
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
