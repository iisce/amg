import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function EnquiryLoading() {
	return (
		<div className='min-h-screen bg-background'>
			{/* Header */}
			<section className='bg-primary px-4 py-12'>
				<div className='container mx-auto max-w-4xl'>
					<Skeleton className='h-10 w-64 bg-secondary/20 mb-4' />
					<Skeleton className='h-5 w-96 bg-secondary/20' />
				</div>
			</section>

			{/* Form Section */}
			<section className='px-4 py-8'>
				<div className='container mx-auto max-w-4xl'>
					<div className='grid lg:grid-cols-3 gap-8'>
						{/* Form */}
						<div className='lg:col-span-2'>
							<Card>
								<CardHeader>
									<Skeleton className='h-6 w-48' />
									<Skeleton className='h-4 w-64' />
								</CardHeader>
								<CardContent className='space-y-6'>
									<div className='grid sm:grid-cols-2 gap-4'>
										<Skeleton className='h-10 w-full' />
										<Skeleton className='h-10 w-full' />
									</div>
									<div className='grid sm:grid-cols-2 gap-4'>
										<Skeleton className='h-10 w-full' />
										<Skeleton className='h-10 w-full' />
									</div>
									<Skeleton className='h-10 w-full' />
									<Skeleton className='h-10 w-full' />
									<Skeleton className='h-32 w-full' />
									<Skeleton className='h-12 w-full' />
								</CardContent>
							</Card>
						</div>

						{/* Sidebar */}
						<div className='space-y-6'>
							<Card>
								<CardHeader>
									<Skeleton className='h-5 w-40' />
								</CardHeader>
								<CardContent className='space-y-4'>
									<Skeleton className='h-16 w-full' />
									<Skeleton className='h-12 w-full' />
									<Skeleton className='h-12 w-full' />
									<Skeleton className='h-16 w-full' />
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
