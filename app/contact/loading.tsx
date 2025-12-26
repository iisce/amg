import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function ContactLoading() {
	return (
		<div className='min-h-screen bg-background'>
			{/* Header */}
			<section className='bg-primary px-4 py-12'>
				<div className='container mx-auto max-w-6xl'>
					<Skeleton className='h-10 w-48 bg-secondary/20 mb-4' />
					<Skeleton className='h-6 w-96 bg-secondary/20' />
				</div>
			</section>

			{/* Content */}
			<section className='px-4 py-12'>
				<div className='container mx-auto max-w-6xl'>
					<div className='grid lg:grid-cols-2 gap-8'>
						<div className='space-y-6'>
							<Card>
								<CardHeader>
									<Skeleton className='h-6 w-32' />
								</CardHeader>
								<CardContent className='space-y-6'>
									{[1, 2, 3, 4].map((i) => (
										<div
											key={i}
											className='flex gap-4'
										>
											<Skeleton className='h-10 w-10 rounded-lg' />
											<div className='space-y-2 flex-1'>
												<Skeleton className='h-4 w-24' />
												<Skeleton className='h-4 w-full' />
											</div>
										</div>
									))}
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<Skeleton className='h-6 w-32' />
								</CardHeader>
								<CardContent className='space-y-3'>
									<Skeleton className='h-10 w-full' />
									<Skeleton className='h-10 w-full' />
									<Skeleton className='h-10 w-full' />
								</CardContent>
							</Card>
						</div>

						<div>
							<Card>
								<CardHeader>
									<Skeleton className='h-6 w-24' />
								</CardHeader>
								<CardContent className='p-0'>
									<Skeleton className='h-[500px] w-full' />
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
