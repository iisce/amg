'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
	ArrowLeft,
	QrCode,
	CheckCircle,
	AlertCircle,
	Scan,
	MapPin,
	Clock,
	Loader2,
	XCircle,
	Navigation,
	Maximize2,
	X,
} from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { checkInMembership, checkOutMembership } from '@/actions/subscriptions';
import {
	isWithinCheckInRange,
	isWithinBusinessHours,
	getDirectionsUrl,
} from '@/lib/constants/location';
import type { MembershipWithRelations } from '@/actions/subscriptions';

interface CheckInClientProps {
	activeSubscriptions: MembershipWithRelations[];
}

type CheckInMethod = 'location' | 'scanner' | 'show-qr';

interface LocationStatus {
	loading: boolean;
	granted: boolean | null;
	withinRange: boolean;
	error?: string;
	coordinates?: { lat: number; lng: number };
}

export default function CheckInClient({
	activeSubscriptions,
}: CheckInClientProps) {
	const router = useRouter();
	const [selectedMethod, setSelectedMethod] = useState<CheckInMethod | null>(
		null
	);
	const [locationStatus, setLocationStatus] = useState<LocationStatus>({
		loading: false,
		granted: null,
		withinRange: false,
	});
	const [businessHours, setBusinessHours] = useState(isWithinBusinessHours());
	const [isCheckingIn, setIsCheckingIn] = useState(false);
	const [checkInResult, setCheckInResult] = useState<{
		success: boolean;
		message: string;
		subscription?: MembershipWithRelations;
	} | null>(null);
	const [selectedSubscription, setSelectedSubscription] =
		useState<MembershipWithRelations | null>(
			activeSubscriptions.length === 1 ? activeSubscriptions[0] : null
		);
	const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
	const [scanning, setScanning] = useState(false);
	const [showFullscreen, setShowFullscreen] = useState(false);
	const [countdown, setCountdown] = useState<{
		hours: number;
		minutes: number;
		seconds: number;
	} | null>(null);

	// Calculate time until next open
	const calculateCountdown = useCallback(() => {
		if (businessHours.isOpen || !businessHours.nextOpen) return null;

		const now = new Date();
		let targetDate = new Date();

		// Parse nextOpen string (e.g., "9:00 AM", "Monday 9:00 AM", "tomorrow 9:00 AM")
		const nextOpen = businessHours.nextOpen;
		const timeMatch = nextOpen.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);

		if (!timeMatch) return null;

		let targetHour = parseInt(timeMatch[1]);
		const targetMinute = parseInt(timeMatch[2]);
		const isPM = timeMatch[3].toUpperCase() === 'PM';

		if (isPM && targetHour !== 12) targetHour += 12;
		if (!isPM && targetHour === 12) targetHour = 0;

		// Determine the target day
		if (nextOpen.toLowerCase().includes('monday')) {
			const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
			targetDate.setDate(now.getDate() + daysUntilMonday);
		} else if (nextOpen.toLowerCase().includes('saturday')) {
			const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
			targetDate.setDate(now.getDate() + daysUntilSaturday);
		} else if (nextOpen.toLowerCase().includes('tomorrow')) {
			targetDate.setDate(now.getDate() + 1);
		}
		// Otherwise it's today

		targetDate.setHours(targetHour, targetMinute, 0, 0);

		// If target is in the past, it means we need to go to the next occurrence
		if (targetDate <= now) {
			targetDate.setDate(targetDate.getDate() + 1);
		}

		const diff = targetDate.getTime() - now.getTime();

		if (diff <= 0) return null;

		const hours = Math.floor(diff / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((diff % (1000 * 60)) / 1000);

		return { hours, minutes, seconds };
	}, [businessHours.isOpen, businessHours.nextOpen]);

	// Update countdown every second
	useEffect(() => {
		if (businessHours.isOpen) {
			setCountdown(null);
			return;
		}

		setCountdown(calculateCountdown());
		const interval = setInterval(() => {
			setCountdown(calculateCountdown());
		}, 1000);

		return () => clearInterval(interval);
	}, [businessHours.isOpen, calculateCountdown]);

	// Check business hours periodically
	useEffect(() => {
		const interval = setInterval(() => {
			setBusinessHours(isWithinBusinessHours());
		}, 60000); // Check every minute
		return () => clearInterval(interval);
	}, []);

	// Generate QR code for the selected subscription
	useEffect(() => {
		if (selectedSubscription && selectedMethod === 'show-qr') {
			const qrData = JSON.stringify({
				type: 'membership_checkin',
				membershipNumber: selectedSubscription.membershipNumber,
				membershipId: selectedSubscription.id,
				accessCode: selectedSubscription.accessCode,
			});

			QRCode.toDataURL(qrData, {
				width: 300,
				margin: 2,
				color: { dark: '#000000', light: '#ffffff' },
			})
				.then(setQrCodeDataUrl)
				.catch(console.error);
		}
	}, [selectedSubscription, selectedMethod]);

	// Get user location
	const requestLocation = useCallback(async () => {
		setLocationStatus((prev) => ({
			...prev,
			loading: true,
			error: undefined,
		}));

		if (!navigator.geolocation) {
			setLocationStatus({
				loading: false,
				granted: false,
				withinRange: false,
				error: 'Geolocation is not supported by your browser',
			});
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				const coords = {
					lat: position.coords.latitude,
					lng: position.coords.longitude,
				};
				const withinRange = isWithinCheckInRange(coords);
				setLocationStatus({
					loading: false,
					granted: true,
					withinRange,
					coordinates: coords,
				});
			},
			(error) => {
				let errorMessage = 'Unable to get your location';
				if (error.code === error.PERMISSION_DENIED) {
					errorMessage =
						'Location permission denied. Please enable location access in your browser settings.';
				} else if (error.code === error.POSITION_UNAVAILABLE) {
					errorMessage = 'Location information unavailable';
				} else if (error.code === error.TIMEOUT) {
					errorMessage = 'Location request timed out';
				}
				setLocationStatus({
					loading: false,
					granted: false,
					withinRange: false,
					error: errorMessage,
				});
			},
			{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
		);
	}, []);

	// Handle location-based check-in
	const handleLocationCheckIn = async () => {
		if (!selectedSubscription) {
			toast.error('Please select a subscription');
			return;
		}

		if (!businessHours.isOpen) {
			toast.error(businessHours.message);
			return;
		}

		if (!locationStatus.withinRange) {
			toast.error('You are not within the office premises');
			return;
		}

		setIsCheckingIn(true);
		try {
			const result = await checkInMembership(selectedSubscription.id);
			if (result.success) {
				setCheckInResult({
					success: true,
					message: result.message,
					subscription: selectedSubscription,
				});
				toast.success('Check-in successful!');
			} else {
				setCheckInResult({
					success: false,
					message: result.message,
				});
				toast.error(result.message);
			}
		} catch (error) {
			toast.error('Failed to check in');
		} finally {
			setIsCheckingIn(false);
		}
	};

	// Handle QR code scanning (simulated - in production use camera)
	const handleStartScan = () => {
		setScanning(true);
		// In production, this would activate the camera and scan QR codes
		// For now, simulate a scan after 3 seconds
		setTimeout(() => {
			setScanning(false);
			toast.info(
				'QR Scanner: In production, scan the front desk QR code'
			);
		}, 3000);
	};

	// Check if user can check in (has active subscription and within hours)
	const canCheckIn =
		activeSubscriptions.length > 0 &&
		businessHours.isOpen &&
		locationStatus.withinRange;

	// Get the currently checked-in subscription
	const checkedInSubscription = activeSubscriptions.find((sub) =>
		sub.checkIns?.some((ci) => !ci.checkOutTime)
	);

	const handleCheckOut = async () => {
		if (!checkedInSubscription) return;

		setIsCheckingIn(true);
		try {
			const result = await checkOutMembership(checkedInSubscription.id);
			if (result.success) {
				toast.success('Checked out successfully');
				router.refresh();
			} else {
				toast.error(result.message);
			}
		} catch (error) {
			toast.error('Failed to check out');
		} finally {
			setIsCheckingIn(false);
		}
	};

	// If already checked in, show check-out option
	if (checkedInSubscription) {
		return (
			<div className='min-h-screen bg-background'>
				<section className='bg-primary px-4 py-8'>
					<div className='container mx-auto max-w-2xl'>
						<Button
							variant='ghost'
							asChild
							className='mb-4 text-secondary hover:bg-secondary/10'
						>
							<Link href='/dashboard'>
								<ArrowLeft className='mr-2 h-4 w-4' />
								Back to Dashboard
							</Link>
						</Button>
						<h1 className='text-3xl font-bold text-secondary mb-2'>
							You&apos;re Checked In
						</h1>
						<p className='text-secondary/80'>
							Enjoy your workspace at AMG
						</p>
					</div>
				</section>

				<section className='px-4 py-8'>
					<div className='container mx-auto max-w-2xl'>
						<Card className='border-green-500'>
							<CardContent className='p-8 text-center'>
								<div className='flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto mb-4'>
									<CheckCircle className='h-10 w-10 text-green-600' />
								</div>
								<h3 className='text-2xl font-bold mb-2'>
									Currently Checked In
								</h3>
								<p className='text-muted-foreground mb-4'>
									{checkedInSubscription.space.name}
								</p>
								<div className='bg-muted rounded-lg p-4 mb-6 text-left'>
									<p className='text-sm text-muted-foreground mb-1'>
										Subscription
									</p>
									<p className='font-semibold'>
										{checkedInSubscription.pricingPlan.name}
									</p>
									<p className='text-sm text-muted-foreground'>
										Member #{' '}
										{checkedInSubscription.membershipNumber}
									</p>
								</div>
								<Button
									onClick={handleCheckOut}
									disabled={isCheckingIn}
									className='w-full'
									variant='outline'
								>
									{isCheckingIn ? (
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									) : (
										<XCircle className='mr-2 h-4 w-4' />
									)}
									Check Out
								</Button>
							</CardContent>
						</Card>
					</div>
				</section>
			</div>
		);
	}

	// No active subscriptions
	if (activeSubscriptions.length === 0) {
		return (
			<div className='min-h-screen bg-background'>
				<section className='bg-primary px-4 py-8'>
					<div className='container mx-auto max-w-2xl'>
						<Button
							variant='ghost'
							asChild
							className='mb-4 text-secondary hover:bg-secondary/10'
						>
							<Link href='/dashboard'>
								<ArrowLeft className='mr-2 h-4 w-4' />
								Back to Dashboard
							</Link>
						</Button>
						<h1 className='text-3xl font-bold text-secondary mb-2'>
							Check In
						</h1>
						<p className='text-secondary/80'>
							Check in to your workspace at AMG
						</p>
					</div>
				</section>

				<section className='px-4 py-8'>
					<div className='container mx-auto max-w-2xl'>
						<Card>
							<CardContent className='p-8 text-center'>
								<AlertCircle className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
								<h3 className='text-xl font-bold mb-2'>
									No Active Subscription
								</h3>
								<p className='text-muted-foreground mb-6'>
									You need an active subscription to check in.
								</p>
								<Button asChild>
									<Link href='/spaces?type=subscribe'>
										Browse Subscription Plans
									</Link>
								</Button>
							</CardContent>
						</Card>
					</div>
				</section>
			</div>
		);
	}

	// Check-in result screen
	if (checkInResult) {
		return (
			<div className='min-h-screen bg-background'>
				<section className='bg-primary px-4 py-8'>
					<div className='container mx-auto max-w-2xl'>
						<h1 className='text-3xl font-bold text-secondary mb-2'>
							Check In
						</h1>
					</div>
				</section>

				<section className='px-4 py-8'>
					<div className='container mx-auto max-w-2xl'>
						<Card
							className={
								checkInResult.success
									? 'border-green-500'
									: 'border-red-500'
							}
						>
							<CardContent className='p-8 text-center'>
								{checkInResult.success ? (
									<>
										<div className='flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto mb-4'>
											<CheckCircle className='h-10 w-10 text-green-600' />
										</div>
										<h3 className='text-2xl font-bold mb-2'>
											Check-In Successful!
										</h3>
										<p className='text-muted-foreground mb-6'>
											{checkInResult.message}
										</p>
										{checkInResult.subscription && (
											<div className='bg-muted rounded-lg p-4 mb-6 text-left'>
												<p className='text-sm text-muted-foreground mb-1'>
													Details
												</p>
												<p className='font-semibold'>
													{
														checkInResult
															.subscription.space
															.name
													}
												</p>
												<p className='text-sm text-muted-foreground'>
													{
														checkInResult
															.subscription
															.pricingPlan.name
													}
												</p>
												<p className='text-sm text-muted-foreground'>
													Member #
													{
														checkInResult
															.subscription
															.membershipNumber
													}
												</p>
											</div>
										)}
									</>
								) : (
									<>
										<div className='flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mx-auto mb-4'>
											<XCircle className='h-10 w-10 text-red-600' />
										</div>
										<h3 className='text-2xl font-bold mb-2'>
											Check-In Failed
										</h3>
										<p className='text-muted-foreground mb-6'>
											{checkInResult.message}
										</p>
									</>
								)}
								<div className='flex flex-col gap-3 sm:flex-row'>
									<Button
										asChild
										className='flex-1'
									>
										<Link href='/dashboard'>
											Go to Dashboard
										</Link>
									</Button>
									<Button
										variant='outline'
										onClick={() => setCheckInResult(null)}
										className='flex-1'
									>
										Try Again
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</section>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-background'>
			{/* Header */}
			<section className='bg-primary px-4 py-8'>
				<div className='container mx-auto max-w-2xl'>
					<Button
						variant='ghost'
						asChild
						className='mb-4 text-secondary hover:bg-secondary/10'
					>
						<Link href='/dashboard'>
							<ArrowLeft className='mr-2 h-4 w-4' />
							Back to Dashboard
						</Link>
					</Button>
					<h1 className='text-3xl font-bold text-secondary mb-2'>
						Check In
					</h1>
					<p className='text-secondary/80'>
						Check in to your workspace at AMG
					</p>
				</div>
			</section>

			{/* Business Hours Status */}
			<section className='px-4 py-4'>
				<div className='container mx-auto max-w-2xl'>
					{businessHours.isOpen ? (
						<Card className='border-green-200 bg-green-50/50'>
							<CardContent className='p-4'>
								<div className='flex items-center gap-3'>
									<div className='flex h-10 w-10 items-center justify-center rounded-full bg-green-100'>
										<CheckCircle className='h-5 w-5 text-green-600' />
									</div>
									<div>
										<p className='font-semibold text-green-800'>
											AMG Workspace is Open
										</p>
										<p className='text-sm text-green-600'>
											{businessHours.message}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					) : (
						<Card className='border-amber-200 bg-linear-to-br from-amber-50 to-orange-50'>
							<CardContent className='p-6'>
								<div className='flex flex-col items-center text-center'>
									<div className='flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 mb-4'>
										<Clock className='h-7 w-7 text-amber-600' />
									</div>
									<h3 className='text-xl font-bold text-amber-900 mb-1'>
										AMG Workspace is Closed
									</h3>
									<p className='text-amber-700 mb-4'>
										{businessHours.message}
									</p>

									{countdown && (
										<div className='mb-4'>
											<p className='text-sm text-amber-600 mb-3'>
												Opens in
											</p>
											<div className='flex items-center justify-center gap-2'>
												<div className='flex flex-col items-center'>
													<div className='bg-white rounded-lg shadow-sm border border-amber-200 px-4 py-2 min-w-16'>
														<span className='text-2xl font-bold text-amber-900 tabular-nums'>
															{String(
																countdown.hours
															).padStart(2, '0')}
														</span>
													</div>
													<span className='text-xs text-amber-600 mt-1'>
														hours
													</span>
												</div>
												<span className='text-2xl font-bold text-amber-400 -mt-5'>
													:
												</span>
												<div className='flex flex-col items-center'>
													<div className='bg-white rounded-lg shadow-sm border border-amber-200 px-4 py-2 min-w-16'>
														<span className='text-2xl font-bold text-amber-900 tabular-nums'>
															{String(
																countdown.minutes
															).padStart(2, '0')}
														</span>
													</div>
													<span className='text-xs text-amber-600 mt-1'>
														mins
													</span>
												</div>
												<span className='text-2xl font-bold text-amber-400 -mt-5'>
													:
												</span>
												<div className='flex flex-col items-center'>
													<div className='bg-white rounded-lg shadow-sm border border-amber-200 px-4 py-2 min-w-16'>
														<span className='text-2xl font-bold text-amber-900 tabular-nums'>
															{String(
																countdown.seconds
															).padStart(2, '0')}
														</span>
													</div>
													<span className='text-xs text-amber-600 mt-1'>
														secs
													</span>
												</div>
											</div>
										</div>
									)}

									{businessHours.nextOpen && (
										<div className='flex items-center gap-2 text-sm text-amber-700 bg-white/60 rounded-full px-4 py-2'>
											<Clock className='h-4 w-4' />
											<span>
												Next open:{' '}
												<strong>
													{businessHours.nextOpen}
												</strong>
											</span>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</section>

			{/* Subscription Selection */}
			{activeSubscriptions.length > 1 && (
				<section className='px-4 py-4'>
					<div className='container mx-auto max-w-2xl'>
						<Card>
							<CardHeader>
								<CardTitle className='text-lg'>
									Select Subscription
								</CardTitle>
								<CardDescription>
									Choose which subscription to check in with
								</CardDescription>
							</CardHeader>
							<CardContent className='space-y-2'>
								{activeSubscriptions.map((sub) => (
									<button
										key={sub.id}
										onClick={() =>
											setSelectedSubscription(sub)
										}
										className={`w-full p-4 rounded-lg border text-left transition-colors ${
											selectedSubscription?.id === sub.id
												? 'border-primary bg-primary/5'
												: 'border-border hover:bg-muted'
										}`}
									>
										<p className='font-semibold'>
											{sub.space.name}
										</p>
										<p className='text-sm text-muted-foreground'>
											{sub.pricingPlan.name} • #
											{sub.membershipNumber}
										</p>
									</button>
								))}
							</CardContent>
						</Card>
					</div>
				</section>
			)}

			{/* Check-in Methods */}
			<section className='px-4 py-4'>
				<div className='container mx-auto max-w-2xl space-y-4'>
					{/* Method 1: Location-based Check-in */}
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<MapPin className='h-5 w-5' />
								Check In with Location
							</CardTitle>
							<CardDescription>
								Check in automatically when you&apos;re at the
								office
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							{locationStatus.loading ? (
								<div className='flex items-center justify-center py-8'>
									<Loader2 className='h-8 w-8 animate-spin text-primary' />
									<span className='ml-2'>
										Getting your location...
									</span>
								</div>
							) : locationStatus.granted === null ? (
								<Button
									onClick={requestLocation}
									className='w-full'
									disabled={!businessHours.isOpen}
								>
									<MapPin className='mr-2 h-4 w-4' />
									Enable Location Access
								</Button>
							) : locationStatus.error ? (
								<>
									<Alert variant='destructive'>
										<AlertCircle className='h-4 w-4' />
										<AlertDescription>
											{locationStatus.error}
										</AlertDescription>
									</Alert>
									<Button
										onClick={requestLocation}
										variant='outline'
										className='w-full'
									>
										Try Again
									</Button>
								</>
							) : locationStatus.withinRange ? (
								<>
									<Alert>
										<CheckCircle className='h-4 w-4 text-green-600' />
										<AlertDescription>
											You&apos;re at AMG Workspace! Ready
											to check in.
										</AlertDescription>
									</Alert>
									<Button
										onClick={handleLocationCheckIn}
										disabled={
											isCheckingIn ||
											!businessHours.isOpen ||
											!selectedSubscription
										}
										className='w-full'
									>
										{isCheckingIn ? (
											<Loader2 className='mr-2 h-4 w-4 animate-spin' />
										) : (
											<CheckCircle className='mr-2 h-4 w-4' />
										)}
										Check In Now
									</Button>
								</>
							) : (
								<>
									<Alert variant='destructive'>
										<AlertCircle className='h-4 w-4' />
										<AlertDescription>
											You&apos;re not at the office.
											Please visit AMG Workspace to check
											in.
										</AlertDescription>
									</Alert>
									<Button
										asChild
										variant='outline'
										className='w-full'
									>
										<a
											href={getDirectionsUrl(
												locationStatus.coordinates
											)}
											target='_blank'
											rel='noopener noreferrer'
										>
											<Navigation className='mr-2 h-4 w-4' />
											Get Directions
										</a>
									</Button>
								</>
							)}
						</CardContent>
					</Card>

					{/* Method 2: Scan Front Desk QR */}
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Scan className='h-5 w-5' />
								Scan Front Desk QR Code
							</CardTitle>
							<CardDescription>
								Scan the QR code displayed at the front desk
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							{scanning ? (
								<div className='relative aspect-square max-w-sm mx-auto bg-muted rounded-lg overflow-hidden'>
									<div className='absolute inset-0 flex flex-col items-center justify-center'>
										<div className='w-48 h-48 border-4 border-primary rounded-lg relative'>
											<div className='absolute inset-0 border-t-4 border-primary animate-pulse'></div>
										</div>
										<p className='mt-4 text-sm text-muted-foreground'>
											Scanning...
										</p>
									</div>
								</div>
							) : (
								<div className='text-center py-4'>
									<Scan className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
									<p className='text-sm text-muted-foreground mb-4'>
										Point your camera at the QR code at the
										front desk
									</p>
								</div>
							)}
							<Button
								onClick={
									scanning
										? () => setScanning(false)
										: handleStartScan
								}
								variant={scanning ? 'outline' : 'default'}
								className='w-full'
								disabled={!businessHours.isOpen}
							>
								{scanning ? (
									'Cancel Scan'
								) : (
									<>
										<QrCode className='mr-2 h-4 w-4' />
										Start Scanner
									</>
								)}
							</Button>
						</CardContent>
					</Card>

					{/* Method 3: Show My QR Code */}
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<QrCode className='h-5 w-5' />
								Show My QR Code
							</CardTitle>
							<CardDescription>
								Let the front desk scan your membership QR code
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							{selectedSubscription ? (
								<>
									{qrCodeDataUrl ? (
										<>
											<div className='bg-white p-4 rounded-lg flex items-center justify-center'>
												<img
													src={qrCodeDataUrl}
													alt='Membership QR Code'
													className='max-w-64'
												/>
											</div>
											<div className='text-center'>
												<p className='font-semibold'>
													{
														selectedSubscription
															.space.name
													}
												</p>
												<p className='text-sm text-muted-foreground'>
													Member #
													{
														selectedSubscription.membershipNumber
													}
												</p>
											</div>
											<div className='flex gap-2'>
												<Button
													onClick={() =>
														setQrCodeDataUrl(null)
													}
													variant='outline'
													className='flex-1'
												>
													<XCircle className='mr-2 h-4 w-4' />
													Hide
												</Button>
												<Button
													onClick={() =>
														setShowFullscreen(true)
													}
													className='flex-1'
												>
													<Maximize2 className='mr-2 h-4 w-4' />
													Fullscreen
												</Button>
											</div>
										</>
									) : (
										<>
											<div className='text-center py-8'>
												<div className='flex h-20 w-20 items-center justify-center rounded-full bg-muted mx-auto mb-4'>
													<QrCode className='h-10 w-10 text-muted-foreground' />
												</div>
												<p className='font-semibold mb-1'>
													{
														selectedSubscription
															.space.name
													}
												</p>
												<p className='text-sm text-muted-foreground mb-4'>
													Member #
													{
														selectedSubscription.membershipNumber
													}
												</p>
												<p className='text-sm text-muted-foreground'>
													Tap the button below to
													display your QR code
												</p>
											</div>
											<Button
												onClick={() =>
													setSelectedMethod('show-qr')
												}
												className='w-full'
											>
												<QrCode className='mr-2 h-4 w-4' />
												Show My QR Code
											</Button>
										</>
									)}
								</>
							) : (
								<div className='text-center py-8'>
									<p className='text-muted-foreground'>
										Select a subscription above to show your
										QR code
									</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Help Card */}
					<Card>
						<CardHeader>
							<CardTitle>Need Help?</CardTitle>
						</CardHeader>
						<CardContent className='space-y-3 text-sm text-muted-foreground'>
							<p>
								<strong>Location check-in not working?</strong>{' '}
								Make sure you&apos;re at the office and have
								enabled location permissions.
							</p>
							<p>
								<strong>Can&apos;t scan the QR code?</strong>{' '}
								Ask the front desk staff to scan your membership
								QR code instead.
							</p>
							<p>
								<strong>Office hours:</strong> Mon-Fri 9AM-6PM,
								Saturday 11AM-4PM
							</p>
						</CardContent>
					</Card>
				</div>
			</section>

			{/* Fullscreen QR Modal */}
			{showFullscreen && qrCodeDataUrl && selectedSubscription && (
				<div
					className='fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4'
					onClick={() => setShowFullscreen(false)}
				>
					<button
						onClick={() => setShowFullscreen(false)}
						className='absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors'
						aria-label='Close fullscreen'
					>
						<X className='h-8 w-8 text-white' />
					</button>

					<div className='bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full'>
						<img
							src={qrCodeDataUrl}
							alt='Membership QR Code'
							className='w-full'
						/>
					</div>

					<div className='text-center mt-6 text-white'>
						<p className='text-2xl font-bold'>
							{selectedSubscription.space.name}
						</p>
						<p className='text-lg text-white/80 mt-1'>
							Member #{selectedSubscription.membershipNumber}
						</p>
						<p className='text-sm text-white/60 mt-4'>
							Tap anywhere to close
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
