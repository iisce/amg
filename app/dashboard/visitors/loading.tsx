import { Skeleton } from '@/components/ui/skeleton';

export default function VisitorsLoading() {
	return (
		<div className='container mx-auto py-6 space-y-6'>
			<div className='flex items-center justify-between'>
				<div className='space-y-2'>
					<Skeleton className='h-8 w-48' />
					<Skeleton className='h-4 w-72' />
				</div>
				<Skeleton className='h-10 w-36' />
			</div>

			<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
				<Skeleton className='h-24' />
				<Skeleton className='h-24' />
				<Skeleton className='h-24' />
			</div>

			<Skeleton className='h-96' />
		</div>
	);
}
