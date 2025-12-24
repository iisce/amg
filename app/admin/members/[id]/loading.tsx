import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function Loading() {
	return (
		<div className='space-y-6 p-6'>
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-4'>
					<Skeleton className='h-10 w-10' />
					<div className='space-y-2'>
						<Skeleton className='h-8 w-48' />
						<Skeleton className='h-4 w-64' />
					</div>
				</div>
				<Skeleton className='h-6 w-16' />
			</div>

			<div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i}>
						<CardHeader className='space-y-0 pb-2'>
							<Skeleton className='h-4 w-24' />
						</CardHeader>
						<CardContent>
							<Skeleton className='h-8 w-16' />
						</CardContent>
					</Card>
				))}
			</div>

			<div className='grid gap-6 md:grid-cols-2'>
				<Card>
					<CardHeader>
						<Skeleton className='h-6 w-48' />
					</CardHeader>
					<CardContent className='space-y-4'>
						{Array.from({ length: 4 }).map((_, i) => (
							<div
								key={i}
								className='flex items-center gap-3'
							>
								<Skeleton className='h-5 w-5' />
								<div className='space-y-2'>
									<Skeleton className='h-4 w-20' />
									<Skeleton className='h-4 w-32' />
								</div>
							</div>
						))}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<Skeleton className='h-6 w-32' />
					</CardHeader>
					<CardContent className='space-y-4'>
						{Array.from({ length: 5 }).map((_, i) => (
							<div
								key={i}
								className='flex items-center justify-between'
							>
								<div className='space-y-2'>
									<Skeleton className='h-4 w-32' />
									<Skeleton className='h-3 w-24' />
								</div>
								<Skeleton className='h-6 w-20' />
							</div>
						))}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
