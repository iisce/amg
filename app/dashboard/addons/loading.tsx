import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function MyAddonsLoading() {
	return (
		<div className='min-h-screen bg-background'>
			{/* Header */}
			<section className='bg-primary text-primary-foreground px-4 py-8'>
				<div className='container mx-auto'>
					<Skeleton className='h-8 w-48 bg-primary-foreground/20 mb-2' />
					<Skeleton className='h-4 w-72 bg-primary-foreground/20' />
				</div>
			</section>

			<div className='container mx-auto px-4 py-8'>
				{/* Stats Cards */}
				<div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'>
					{[...Array(4)].map((_, i) => (
						<Card key={i}>
							<CardContent className='p-6'>
								<Skeleton className='h-4 w-24 mb-2' />
								<Skeleton className='h-8 w-12' />
							</CardContent>
						</Card>
					))}
				</div>

				{/* Tabs */}
				<div className='mb-6'>
					<Skeleton className='h-10 w-96' />
				</div>

				{/* Table */}
				<Card>
					<CardHeader>
						<Skeleton className='h-6 w-48' />
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							{[...Array(5)].map((_, i) => (
								<div
									key={i}
									className='flex items-center justify-between p-4 border rounded-lg'
								>
									<div className='flex-1 space-y-2'>
										<Skeleton className='h-5 w-48' />
										<Skeleton className='h-4 w-32' />
									</div>
									<Skeleton className='h-8 w-24' />
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
