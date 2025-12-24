'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	QrCode,
	CheckCircle2,
	XCircle,
	Keyboard,
	LayoutGrid,
	Calendar,
	UserCog,
	FileText,
	Loader2,
} from 'lucide-react';
import { checkInByQRCode } from '@/actions';
import type { BookingWithRelations } from '@/actions/bookings';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CheckInResult {
	success: boolean;
	booking?: BookingWithRelations;
	message: string;
}

export default function QRScannerClient() {
	const [manualCode, setManualCode] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [scanResult, setScanResult] = useState<CheckInResult | null>(null);

	const handleManualCheckIn = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!manualCode.trim()) {
			toast.error('Please enter a booking code');
			return;
		}

		setIsLoading(true);
		setScanResult(null);

		try {
			const result = await checkInByQRCode(manualCode.trim());

			if (result.success && result.data) {
				// Handle both single booking and array of bookings
				const booking = Array.isArray(result.data)
					? result.data[0]
					: result.data;

				setScanResult({
					success: true,
					booking: booking,
					message: result.message || 'Check-in successful!',
				});
				toast.success('Check-in successful!');
				setManualCode('');
			} else {
				setScanResult({
					success: false,
					message:
						result.error ||
						result.message ||
						'Invalid booking code',
				});
				toast.error(
					result.error || result.message || 'Invalid booking code'
				);
			}
		} catch (error) {
			console.error('Check-in error:', error);
			setScanResult({
				success: false,
				message: 'An error occurred during check-in',
			});
			toast.error('An error occurred during check-in');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='min-h-screen bg-background'>
			{/* Admin Header */}
			<section className='bg-secondary text-secondary-foreground px-4 py-6 border-b'>
				<div className='container mx-auto'>
					<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
						<div>
							<div className='flex items-center gap-2 mb-2'>
								<Badge className='bg-red-600 text-white'>
									Admin
								</Badge>
							</div>
							<h1 className='text-2xl font-bold'>
								QR Code Scanner
							</h1>
							<p className='text-sm text-muted-foreground mt-1'>
								Check in guests with their booking QR codes
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Navigation */}
			<section className='border-b bg-muted/30'>
				<div className='container mx-auto px-4'>
					<nav className='flex gap-1 overflow-x-auto'>
						<Link
							href='/admin/dashboard'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<LayoutGrid className='h-4 w-4' />
							Overview
						</Link>
						<Link
							href='/admin/bookings'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<Calendar className='h-4 w-4' />
							Bookings
						</Link>
						<Link
							href='/admin/spaces'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<LayoutGrid className='h-4 w-4' />
							Spaces
						</Link>
						<Link
							href='/admin/members'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<UserCog className='h-4 w-4' />
							Members
						</Link>
						<Link
							href='/admin/reports'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50'
						>
							<FileText className='h-4 w-4' />
							Reports
						</Link>
						<Link
							href='/admin/scanner'
							className='flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-primary text-foreground'
						>
							<QrCode className='h-4 w-4' />
							QR Scanner
						</Link>
					</nav>
				</div>
			</section>

			{/* Content */}
			<section className='px-4 py-8'>
				<div className='container mx-auto max-w-4xl'>
					<div className='grid gap-6 md:grid-cols-2'>
						{/* Manual Entry */}
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Keyboard className='h-5 w-5' />
									Manual Entry
								</CardTitle>
							</CardHeader>
							<CardContent>
								<form
									onSubmit={handleManualCheckIn}
									className='space-y-4'
								>
									<div className='space-y-2'>
										<Label htmlFor='bookingCode'>
											Booking Code
										</Label>
										<Input
											id='bookingCode'
											placeholder='Enter QR code or booking number'
											value={manualCode}
											onChange={(e) =>
												setManualCode(e.target.value)
											}
											disabled={isLoading}
											autoComplete='off'
										/>
										<p className='text-xs text-muted-foreground'>
											Enter the code from the guest's
											booking confirmation
										</p>
									</div>
									<Button
										type='submit'
										className='w-full'
										disabled={
											isLoading || !manualCode.trim()
										}
									>
										{isLoading && (
											<Loader2 className='mr-2 h-4 w-4 animate-spin' />
										)}
										Check In
									</Button>
								</form>
							</CardContent>
						</Card>

						{/* Instructions */}
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<QrCode className='h-5 w-5' />
									How to Use
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='space-y-4'>
									<div className='flex gap-3'>
										<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold'>
											1
										</div>
										<div>
											<p className='font-medium'>
												Get the Code
											</p>
											<p className='text-sm text-muted-foreground'>
												Ask the guest for their booking
												QR code or booking number
											</p>
										</div>
									</div>
									<div className='flex gap-3'>
										<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold'>
											2
										</div>
										<div>
											<p className='font-medium'>
												Enter Code
											</p>
											<p className='text-sm text-muted-foreground'>
												Type the code in the manual
												entry field
											</p>
										</div>
									</div>
									<div className='flex gap-3'>
										<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold'>
											3
										</div>
										<div>
											<p className='font-medium'>
												Verify
											</p>
											<p className='text-sm text-muted-foreground'>
												Confirm the guest details match
												and check them in
											</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Result Display */}
					{scanResult && (
						<Card className='mt-6'>
							<CardContent className='pt-6'>
								{scanResult.success && scanResult.booking ? (
									<div className='space-y-4'>
										<div className='flex items-center gap-3 text-green-600'>
											<CheckCircle2 className='h-8 w-8' />
											<div>
												<h3 className='text-xl font-bold'>
													Check-in Successful!
												</h3>
												<p className='text-sm text-muted-foreground'>
													{scanResult.message}
												</p>
											</div>
										</div>

										<div className='grid gap-4 md:grid-cols-2 pt-4 border-t'>
											<div>
												<p className='text-sm font-medium text-muted-foreground'>
													Guest Name
												</p>
												<p className='text-lg font-semibold'>
													{
														scanResult.booking.user
															.name
													}
												</p>
											</div>
											<div>
												<p className='text-sm font-medium text-muted-foreground'>
													Email
												</p>
												<p className='text-lg font-semibold'>
													{
														scanResult.booking.user
															.email
													}
												</p>
											</div>
											<div>
												<p className='text-sm font-medium text-muted-foreground'>
													Space
												</p>
												<p className='text-lg font-semibold'>
													{
														scanResult.booking.space
															.name
													}
												</p>
											</div>
											<div>
												<p className='text-sm font-medium text-muted-foreground'>
													Booking Number
												</p>
												<p className='text-lg font-semibold'>
													{
														scanResult.booking
															.bookingNumber
													}
												</p>
											</div>
											<div>
												<p className='text-sm font-medium text-muted-foreground'>
													Time Slot
												</p>
												<p className='text-lg font-semibold'>
													{format(
														new Date(
															scanResult.booking.startTime
														),
														'h:mm a'
													)}{' '}
													-{' '}
													{format(
														new Date(
															scanResult.booking.endTime
														),
														'h:mm a'
													)}
												</p>
											</div>
											<div>
												<p className='text-sm font-medium text-muted-foreground'>
													Status
												</p>
												<Badge variant='default'>
													{scanResult.booking.status}
												</Badge>
											</div>
										</div>
									</div>
								) : (
									<div className='flex items-center gap-3 text-destructive'>
										<XCircle className='h-8 w-8' />
										<div>
											<h3 className='text-xl font-bold'>
												Check-in Failed
											</h3>
											<p className='text-sm text-muted-foreground'>
												{scanResult.message}
											</p>
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					)}
				</div>
			</section>
		</div>
	);
}
