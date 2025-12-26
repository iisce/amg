'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
	Camera,
	CameraOff,
	User,
	MapPin,
	Clock,
	LogIn,
	LogOut,
	History,
	AlertTriangle,
	RefreshCw,
} from 'lucide-react';
import {
	adminCheckInByCode,
	getMembershipByCode,
	type AdminCheckInResult,
	type MembershipWithRelations,
} from '@/actions/subscriptions';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface MembershipData {
	membership: MembershipWithRelations;
	isCheckedIn: boolean;
	attendance: {
		totalVisits: number;
		thisMonthVisits: number;
		daysAllowed: number | null;
		daysRemaining: number | null;
		recentCheckIns: Array<{
			id: string;
			checkInTime: Date;
			checkOutTime: Date | null;
		}>;
	};
}

export default function QRScannerClient() {
	const [manualCode, setManualCode] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isScanning, setIsScanning] = useState(false);
	const [cameraError, setCameraError] = useState<string | null>(null);
	const [lastResult, setLastResult] = useState<AdminCheckInResult | null>(
		null
	);
	const [membershipData, setMembershipData] = useState<MembershipData | null>(
		null
	);
	const [activeTab, setActiveTab] = useState<'scanner' | 'manual'>('scanner');

	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

	const stopCamera = useCallback(() => {
		if (scanIntervalRef.current) {
			clearInterval(scanIntervalRef.current);
			scanIntervalRef.current = null;
		}
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		}
		setIsScanning(false);
	}, []);

	// Clean up camera on unmount
	useEffect(() => {
		return () => {
			stopCamera();
		};
	}, [stopCamera]);

	const processCheckIn = async (code: string) => {
		if (!code.trim() || isLoading) return;

		setIsLoading(true);
		setLastResult(null);
		setMembershipData(null);

		try {
			const result = await adminCheckInByCode(code.trim());

			if (result.success && result.data) {
				setLastResult(result);
				toast.success(result.message);

				// Fetch full membership data for display
				const membershipResult = await getMembershipByCode(code.trim());
				if (membershipResult.success && membershipResult.data) {
					setMembershipData(membershipResult.data);
				}
			} else {
				setLastResult(result);
				toast.error(result.message);
			}
		} catch (error) {
			console.error('Check-in error:', error);
			toast.error('An error occurred. Please try again.');
		} finally {
			setIsLoading(false);
			setManualCode('');
		}
	};

	const handleCodeScanned = async (rawCode: string) => {
		if (isLoading) return;

		let code = rawCode;

		// Try to parse as JSON (QR code format from client app)
		try {
			const parsed = JSON.parse(rawCode);
			if (parsed.membershipNumber) {
				code = parsed.membershipNumber;
			} else if (parsed.accessCode) {
				code = parsed.accessCode;
			}
		} catch {
			// Not JSON, use raw code
		}

		await processCheckIn(code);
	};

	const scanQRCode = useCallback(async () => {
		if (!videoRef.current || !canvasRef.current || isLoading) return;

		const video = videoRef.current;
		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');

		if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;

		// Set canvas size to match video
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;

		// Draw current video frame to canvas
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

		// Use jsQR library (works in all browsers)
		const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
			inversionAttempts: 'dontInvert',
		});

		if (qrCode && qrCode.data) {
			await handleCodeScanned(qrCode.data);
			return;
		}

		// Fallback: Try BarcodeDetector API if available (Chrome/Edge)
		if ('BarcodeDetector' in window) {
			try {
				// @ts-expect-error - BarcodeDetector is not in TypeScript types yet
				const barcodeDetector = new window.BarcodeDetector({
					formats: ['qr_code'],
				});
				const barcodes = await barcodeDetector.detect(imageData);

				if (barcodes.length > 0) {
					const code = barcodes[0].rawValue;
					await handleCodeScanned(code);
				}
			} catch {
				// BarcodeDetector failed, silently continue
			}
		}
	}, [isLoading]);

	const startScanning = useCallback(() => {
		if (scanIntervalRef.current) return;

		scanIntervalRef.current = setInterval(() => {
			scanQRCode();
		}, 250); // Scan 4 times per second
	}, [scanQRCode]);

	// Attach stream to video element when isScanning becomes true
	useEffect(() => {
		if (
			isScanning &&
			streamRef.current &&
			videoRef.current &&
			!videoRef.current.srcObject
		) {
			videoRef.current.srcObject = streamRef.current;

			videoRef.current.onloadedmetadata = async () => {
				try {
					await videoRef.current?.play();
					startScanning();
				} catch (playError) {
					console.error('Video play error:', playError);
					setCameraError('Could not start video playback.');
					setIsScanning(false);
				}
			};
		}
	}, [isScanning, startScanning]);

	const startCamera = async () => {
		try {
			setCameraError(null);

			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: 'environment',
					width: { ideal: 1280 },
					height: { ideal: 720 },
				},
			});

			streamRef.current = stream;
			setIsScanning(true); // This will trigger the useEffect above to attach stream
		} catch (error) {
			console.error('Camera error:', error);
			setCameraError(
				'Could not access camera. Please ensure you have granted camera permissions.'
			);
			setIsScanning(false);
		}
	};

	const handleManualSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await processCheckIn(manualCode);
	};

	const handleLookup = async () => {
		if (!manualCode.trim()) {
			toast.error('Please enter a membership code');
			return;
		}

		setIsLoading(true);
		setLastResult(null);
		setMembershipData(null);

		try {
			const result = await getMembershipByCode(manualCode.trim());

			if (result.success && result.data) {
				setMembershipData(result.data);
				toast.success('Membership found');
			} else {
				toast.error(result.message);
			}
		} catch (error) {
			console.error('Lookup error:', error);
			toast.error('Failed to lookup membership');
		} finally {
			setIsLoading(false);
		}
	};

	const handleReset = () => {
		setLastResult(null);
		setMembershipData(null);
		setManualCode('');
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'ACTIVE':
				return <Badge className='bg-green-600'>Active</Badge>;
			case 'PAUSED':
				return <Badge variant='secondary'>Paused</Badge>;
			case 'EXPIRED':
				return <Badge variant='destructive'>Expired</Badge>;
			case 'CANCELLED':
				return <Badge variant='destructive'>Cancelled</Badge>;
			default:
				return <Badge variant='outline'>{status}</Badge>;
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
								Member Check-In Scanner
							</h1>
							<p className='text-sm text-muted-foreground mt-1'>
								Scan member QR codes or enter membership numbers
								to check in/out
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
							Scanner
						</Link>
					</nav>
				</div>
			</section>

			{/* Content */}
			<section className='px-4 py-8'>
				<div className='container mx-auto max-w-6xl'>
					<div className='grid gap-6 lg:grid-cols-2'>
						{/* Scanner / Input Section */}
						<div className='space-y-6'>
							<Tabs
								value={activeTab}
								onValueChange={(v) =>
									setActiveTab(v as 'scanner' | 'manual')
								}
							>
								<TabsList className='grid w-full grid-cols-2'>
									<TabsTrigger
										value='scanner'
										className='flex items-center gap-2'
									>
										<Camera className='h-4 w-4' />
										Camera Scanner
									</TabsTrigger>
									<TabsTrigger
										value='manual'
										className='flex items-center gap-2'
									>
										<Keyboard className='h-4 w-4' />
										Manual Entry
									</TabsTrigger>
								</TabsList>

								<TabsContent
									value='scanner'
									className='mt-4'
								>
									<Card>
										<CardHeader>
											<CardTitle className='flex items-center gap-2'>
												<QrCode className='h-5 w-5' />
												Scan Member QR Code
											</CardTitle>
											<CardDescription>
												Point the camera at the
												member&apos;s QR code to
												check-in or check-out
											</CardDescription>
										</CardHeader>
										<CardContent>
											<div className='space-y-4'>
												{/* Camera View */}
												<div className='relative aspect-video bg-muted rounded-lg overflow-hidden'>
													{isScanning ? (
														<>
															<video
																ref={videoRef}
																className='absolute inset-0 w-full h-full object-cover z-0'
																autoPlay
																playsInline
																muted
															/>
															{/* Scanning overlay - pointer-events-none so it doesn't block video */}
															<div className='absolute inset-0 flex items-center justify-center pointer-events-none z-10'>
																<div className='w-48 h-48 border-2 border-primary rounded-lg animate-pulse' />
															</div>
															{isLoading && (
																<div className='absolute inset-0 bg-black/50 flex items-center justify-center z-20'>
																	<Loader2 className='h-8 w-8 animate-spin text-white' />
																</div>
															)}
														</>
													) : (
														<div className='absolute inset-0 flex flex-col items-center justify-center text-muted-foreground'>
															{cameraError ? (
																<>
																	<CameraOff className='h-12 w-12 mb-2' />
																	<p className='text-sm text-center px-4'>
																		{
																			cameraError
																		}
																	</p>
																</>
															) : (
																<>
																	<Camera className='h-12 w-12 mb-2' />
																	<p className='text-sm'>
																		Camera
																		not
																		active
																	</p>
																</>
															)}
														</div>
													)}
												</div>

												{/* Hidden canvas for QR processing */}
												<canvas
													ref={canvasRef}
													className='hidden'
												/>

												{/* Camera controls */}
												<div className='flex gap-2'>
													{isScanning ? (
														<Button
															variant='outline'
															onClick={stopCamera}
															className='flex-1'
														>
															<CameraOff className='mr-2 h-4 w-4' />
															Stop Camera
														</Button>
													) : (
														<Button
															onClick={
																startCamera
															}
															className='flex-1'
														>
															<Camera className='mr-2 h-4 w-4' />
															Start Camera
														</Button>
													)}
												</div>

												{/* Note about browser support */}
												<p className='text-xs text-muted-foreground text-center'>
													QR scanning requires a
													modern browser with camera
													access and BarcodeDetector
													API support.
												</p>
											</div>
										</CardContent>
									</Card>
								</TabsContent>

								<TabsContent
									value='manual'
									className='mt-4'
								>
									<Card>
										<CardHeader>
											<CardTitle className='flex items-center gap-2'>
												<Keyboard className='h-5 w-5' />
												Manual Entry
											</CardTitle>
											<CardDescription>
												Enter the membership number or
												access code
											</CardDescription>
										</CardHeader>
										<CardContent>
											<form
												onSubmit={handleManualSubmit}
												className='space-y-4'
											>
												<div className='space-y-2'>
													<Label htmlFor='membershipCode'>
														Membership Code
													</Label>
													<Input
														id='membershipCode'
														placeholder='AMG-MB-XXXXX or access code'
														value={manualCode}
														onChange={(e) =>
															setManualCode(
																e.target.value.toUpperCase()
															)
														}
														disabled={isLoading}
														autoComplete='off'
														className='font-mono'
													/>
													<p className='text-xs text-muted-foreground'>
														Enter membership number
														(AMG-MB-...) or 8-digit
														access code
													</p>
												</div>
												<div className='flex gap-2'>
													<Button
														type='submit'
														className='flex-1'
														disabled={
															isLoading ||
															!manualCode.trim()
														}
													>
														{isLoading ? (
															<Loader2 className='mr-2 h-4 w-4 animate-spin' />
														) : (
															<QrCode className='mr-2 h-4 w-4' />
														)}
														Check In/Out
													</Button>
													<Button
														type='button'
														variant='outline'
														onClick={handleLookup}
														disabled={
															isLoading ||
															!manualCode.trim()
														}
													>
														Lookup
													</Button>
												</div>
											</form>
										</CardContent>
									</Card>
								</TabsContent>
							</Tabs>

							{/* Instructions */}
							<Card>
								<CardHeader>
									<CardTitle className='text-lg'>
										How It Works
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
													Scan or Enter Code
												</p>
												<p className='text-sm text-muted-foreground'>
													Use the camera to scan the
													member&apos;s QR code or
													enter their membership
													number manually
												</p>
											</div>
										</div>
										<div className='flex gap-3'>
											<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold'>
												2
											</div>
											<div>
												<p className='font-medium'>
													Automatic Toggle
												</p>
												<p className='text-sm text-muted-foreground'>
													The system automatically
													checks in if not checked in,
													or checks out if already
													checked in
												</p>
											</div>
										</div>
										<div className='flex gap-3'>
											<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold'>
												3
											</div>
											<div>
												<p className='font-medium'>
													View Details
												</p>
												<p className='text-sm text-muted-foreground'>
													See member info,
													subscription status, and
													usage statistics
												</p>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Result Section */}
						<div className='space-y-6'>
							{/* Result Display */}
							{lastResult && (
								<Card
									className={
										lastResult.success
											? 'border-green-500'
											: 'border-red-500'
									}
								>
									<CardContent className='pt-6'>
										<div className='flex items-start gap-4'>
											{lastResult.success ? (
												<div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100'>
													{lastResult.data?.action ===
													'checked_in' ? (
														<LogIn className='h-6 w-6 text-green-600' />
													) : (
														<LogOut className='h-6 w-6 text-green-600' />
													)}
												</div>
											) : (
												<div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100'>
													<XCircle className='h-6 w-6 text-red-600' />
												</div>
											)}
											<div className='flex-1'>
												<h3 className='text-xl font-bold'>
													{lastResult.success
														? lastResult.data
																?.action ===
														  'checked_in'
															? 'Checked In'
															: 'Checked Out'
														: 'Error'}
												</h3>
												<p className='text-muted-foreground'>
													{lastResult.message}
												</p>
											</div>
											<Button
												variant='ghost'
												size='sm'
												onClick={handleReset}
											>
												<RefreshCw className='h-4 w-4' />
											</Button>
										</div>
									</CardContent>
								</Card>
							)}

							{/* Member Details */}
							{membershipData && (
								<Card>
									<CardHeader>
										<div className='flex items-center justify-between'>
											<CardTitle className='flex items-center gap-2'>
												<User className='h-5 w-5' />
												Member Details
											</CardTitle>
											{getStatusBadge(
												membershipData.membership.status
											)}
										</div>
									</CardHeader>
									<CardContent className='space-y-6'>
										{/* Member Info */}
										<div className='grid gap-4 sm:grid-cols-2'>
											<div>
												<p className='text-sm font-medium text-muted-foreground'>
													Name
												</p>
												<p className='text-lg font-semibold'>
													{
														membershipData
															.membership.user
															.name
													}
												</p>
											</div>
											<div>
												<p className='text-sm font-medium text-muted-foreground'>
													Email
												</p>
												<p className='font-medium'>
													{
														membershipData
															.membership.user
															.email
													}
												</p>
											</div>
											<div>
												<p className='text-sm font-medium text-muted-foreground'>
													Phone
												</p>
												<p className='font-medium'>
													{membershipData.membership
														.user.phone || 'N/A'}
												</p>
											</div>
											<div>
												<p className='text-sm font-medium text-muted-foreground'>
													Membership #
												</p>
												<p className='font-mono font-medium'>
													{
														membershipData
															.membership
															.membershipNumber
													}
												</p>
											</div>
										</div>

										<Separator />

										{/* Subscription Info */}
										<div className='space-y-3'>
											<h4 className='font-semibold flex items-center gap-2'>
												<MapPin className='h-4 w-4' />
												Subscription
											</h4>
											<div className='grid gap-4 sm:grid-cols-2'>
												<div>
													<p className='text-sm text-muted-foreground'>
														Space
													</p>
													<p className='font-medium'>
														{
															membershipData
																.membership
																.space.name
														}
													</p>
												</div>
												<div>
													<p className='text-sm text-muted-foreground'>
														Plan
													</p>
													<p className='font-medium'>
														{
															membershipData
																.membership
																.pricingPlan
																.name
														}
													</p>
												</div>
												<div>
													<p className='text-sm text-muted-foreground'>
														Valid Until
													</p>
													<p className='font-medium'>
														{format(
															new Date(
																membershipData.membership.endDate
															),
															'MMM d, yyyy'
														)}
													</p>
												</div>
												<div>
													<p className='text-sm text-muted-foreground'>
														Current Status
													</p>
													<div className='flex items-center gap-2'>
														{membershipData.isCheckedIn ? (
															<Badge className='bg-green-600'>
																<CheckCircle2 className='mr-1 h-3 w-3' />
																Checked In
															</Badge>
														) : (
															<Badge variant='outline'>
																Not Checked In
															</Badge>
														)}
													</div>
												</div>
											</div>
										</div>

										<Separator />

										{/* Usage Statistics */}
										<div className='space-y-3'>
											<h4 className='font-semibold flex items-center gap-2'>
												<Clock className='h-4 w-4' />
												Usage Statistics
											</h4>
											<div className='grid gap-4 grid-cols-2 sm:grid-cols-4'>
												<div className='bg-muted rounded-lg p-3 text-center'>
													<p className='text-2xl font-bold'>
														{
															membershipData
																.attendance
																.totalVisits
														}
													</p>
													<p className='text-xs text-muted-foreground'>
														Total Visits
													</p>
												</div>
												<div className='bg-muted rounded-lg p-3 text-center'>
													<p className='text-2xl font-bold'>
														{
															membershipData
																.attendance
																.thisMonthVisits
														}
													</p>
													<p className='text-xs text-muted-foreground'>
														This Month
													</p>
												</div>
												{membershipData.attendance
													.daysAllowed !== null && (
													<>
														<div className='bg-muted rounded-lg p-3 text-center'>
															<p className='text-2xl font-bold'>
																{
																	membershipData
																		.attendance
																		.daysAllowed
																}
															</p>
															<p className='text-xs text-muted-foreground'>
																Days Allowed
															</p>
														</div>
														<div className='bg-muted rounded-lg p-3 text-center'>
															<p
																className={`text-2xl font-bold ${
																	membershipData
																		.attendance
																		.daysRemaining ===
																	0
																		? 'text-red-600'
																		: ''
																}`}
															>
																{
																	membershipData
																		.attendance
																		.daysRemaining
																}
															</p>
															<p className='text-xs text-muted-foreground'>
																Days Remaining
															</p>
														</div>
													</>
												)}
											</div>

											{membershipData.attendance
												.daysRemaining === 0 &&
												membershipData.attendance
													.daysAllowed !== null && (
													<div className='flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg'>
														<AlertTriangle className='h-4 w-4' />
														<p className='text-sm'>
															Member has used all
															allocated days for
															this period
														</p>
													</div>
												)}
										</div>

										<Separator />

										{/* Recent Check-ins */}
										<div className='space-y-3'>
											<h4 className='font-semibold flex items-center gap-2'>
												<History className='h-4 w-4' />
												Recent Activity
											</h4>
											{membershipData.attendance
												.recentCheckIns.length > 0 ? (
												<div className='space-y-2 max-h-48 overflow-y-auto'>
													{membershipData.attendance.recentCheckIns.map(
														(checkIn) => (
															<div
																key={checkIn.id}
																className='flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-2'
															>
																<div className='flex items-center gap-2'>
																	<LogIn className='h-3 w-3 text-green-600' />
																	<span>
																		{format(
																			new Date(
																				checkIn.checkInTime
																			),
																			'MMM d, h:mm a'
																		)}
																	</span>
																</div>
																{checkIn.checkOutTime ? (
																	<div className='flex items-center gap-2 text-muted-foreground'>
																		<LogOut className='h-3 w-3' />
																		<span>
																			{format(
																				new Date(
																					checkIn.checkOutTime
																				),
																				'h:mm a'
																			)}
																		</span>
																	</div>
																) : (
																	<Badge
																		variant='outline'
																		className='text-xs'
																	>
																		Active
																	</Badge>
																)}
															</div>
														)
													)}
												</div>
											) : (
												<p className='text-sm text-muted-foreground'>
													No recent activity
												</p>
											)}
										</div>

										{/* Quick Action */}
										{membershipData.membership.status ===
											'ACTIVE' && (
											<Button
												onClick={() =>
													processCheckIn(
														membershipData
															.membership
															.membershipNumber
													)
												}
												disabled={isLoading}
												className='w-full'
												variant={
													membershipData.isCheckedIn
														? 'outline'
														: 'default'
												}
											>
												{isLoading ? (
													<Loader2 className='mr-2 h-4 w-4 animate-spin' />
												) : membershipData.isCheckedIn ? (
													<LogOut className='mr-2 h-4 w-4' />
												) : (
													<LogIn className='mr-2 h-4 w-4' />
												)}
												{membershipData.isCheckedIn
													? 'Check Out'
													: 'Check In'}
											</Button>
										)}
									</CardContent>
								</Card>
							)}

							{/* Empty state */}
							{!lastResult && !membershipData && (
								<Card className='border-dashed'>
									<CardContent className='py-12 text-center'>
										<QrCode className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
										<h3 className='font-semibold mb-2'>
											Ready to Scan
										</h3>
										<p className='text-sm text-muted-foreground'>
											Scan a member&apos;s QR code or
											enter their membership number to get
											started
										</p>
									</CardContent>
								</Card>
							)}
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
