'use client';

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
	Users,
	Calendar,
	Clock,
	Building2,
	Download,
	Mail,
	Phone,
	FileText,
	MapPin,
	AlertCircle,
	XCircle,
	LogIn,
	LogOut,
} from 'lucide-react';
import {
	getVisitorByAccessCode,
	type VisitorWithRelations,
} from '@/actions/visitors';

function getStatusBadge(status: string) {
	switch (status) {
		case 'PENDING':
			return (
				<Badge
					variant='secondary'
					className='text-lg px-4 py-1'
				>
					<Clock className='mr-2 h-4 w-4' />
					Pending Check-in
				</Badge>
			);
		case 'CHECKED_IN':
			return (
				<Badge
					variant='default'
					className='bg-green-600 text-lg px-4 py-1'
				>
					<LogIn className='mr-2 h-4 w-4' />
					Checked In
				</Badge>
			);
		case 'CHECKED_OUT':
			return (
				<Badge
					variant='outline'
					className='text-lg px-4 py-1'
				>
					<LogOut className='mr-2 h-4 w-4' />
					Checked Out
				</Badge>
			);
		case 'EXPIRED':
			return (
				<Badge
					variant='destructive'
					className='text-lg px-4 py-1'
				>
					<AlertCircle className='mr-2 h-4 w-4' />
					Expired
				</Badge>
			);
		case 'CANCELLED':
			return (
				<Badge
					variant='destructive'
					className='text-lg px-4 py-1'
				>
					<XCircle className='mr-2 h-4 w-4' />
					Cancelled
				</Badge>
			);
		default:
			return <Badge variant='secondary'>{status}</Badge>;
	}
}

interface VisitorPortalPageProps {
	params: Promise<{ accessCode: string }>;
}

export default function VisitorPortalPage({ params }: VisitorPortalPageProps) {
	const { toast } = useToast();
	const [visitor, setVisitor] = useState<VisitorWithRelations | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const qrRef = useRef<HTMLDivElement>(null);
	const [accessCode, setAccessCode] = useState<string>('');

	useEffect(() => {
		async function resolveParams() {
			const resolvedParams = await params;
			setAccessCode(resolvedParams.accessCode);
		}
		resolveParams();
	}, [params]);

	useEffect(() => {
		if (!accessCode) return;

		async function fetchVisitor() {
			setLoading(true);
			const result = await getVisitorByAccessCode(accessCode);
			if (result.success && result.data) {
				setVisitor(result.data as VisitorWithRelations);
			} else {
				setError(result.message || 'Visitor pass not found');
			}
			setLoading(false);
		}
		fetchVisitor();
	}, [accessCode]);

	const downloadQRCode = () => {
		if (!qrRef.current || !visitor) return;

		const svg = qrRef.current.querySelector('svg');
		if (!svg) return;

		const svgData = new XMLSerializer().serializeToString(svg);
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		const img = new Image();

		img.onload = () => {
			canvas.width = img.width * 2;
			canvas.height = img.height * 2;
			if (ctx) {
				ctx.fillStyle = 'white';
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

				const link = document.createElement('a');
				link.download = `visitor-pass-${visitor.accessCode}.png`;
				link.href = canvas.toDataURL('image/png');
				link.click();
			}
		};

		img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
		toast({
			title: 'Downloaded',
			description: 'Your visitor pass QR code has been downloaded',
		});
	};

	if (loading) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4'>
				<Card className='w-full max-w-lg'>
					<CardHeader className='text-center'>
						<Skeleton className='h-8 w-48 mx-auto' />
						<Skeleton className='h-4 w-64 mx-auto mt-2' />
					</CardHeader>
					<CardContent className='space-y-6'>
						<Skeleton className='h-64 w-64 mx-auto' />
						<Skeleton className='h-24' />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (error || !visitor) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4'>
				<Card className='w-full max-w-lg'>
					<CardHeader className='text-center'>
						<div className='mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4'>
							<AlertCircle className='h-8 w-8 text-red-600' />
						</div>
						<CardTitle className='text-2xl text-red-600'>
							Pass Not Found
						</CardTitle>
						<CardDescription className='text-base'>
							{error ||
								'This visitor pass does not exist or has been removed.'}
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	const isActive =
		visitor.status === 'PENDING' || visitor.status === 'CHECKED_IN';
	const isValid =
		new Date(visitor.validFrom) <= new Date() &&
		new Date(visitor.validUntil) >= new Date();

	return (
		<div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4'>
			<div className='max-w-2xl mx-auto space-y-6'>
				{/* Header */}
				<div className='text-center'>
					<h1 className='text-3xl font-bold'>AMG Workspace</h1>
					<p className='text-muted-foreground'>Visitor Pass</p>
				</div>

				{/* Status */}
				<div className='flex justify-center'>
					{getStatusBadge(visitor.status)}
				</div>

				{/* QR Code Card */}
				<Card className='overflow-hidden'>
					<div className='bg-primary text-primary-foreground p-4 text-center'>
						<h2 className='text-xl font-semibold'>
							Visitor QR Code
						</h2>
						<p className='text-sm opacity-90'>
							Present this at reception for check-in
						</p>
					</div>
					<CardContent className='pt-6'>
						<div className='flex flex-col items-center'>
							<div
								ref={qrRef}
								className={`p-4 bg-white rounded-xl border-4 ${
									isActive && isValid
										? 'border-green-500'
										: 'border-gray-300'
								}`}
							>
								<QRCodeSVG
									value={visitor.accessCode}
									size={200}
									level='H'
									includeMargin={false}
								/>
							</div>
							<p className='mt-4 text-2xl font-mono font-bold tracking-wider'>
								{visitor.accessCode}
							</p>
							{isActive && (
								<Button
									onClick={downloadQRCode}
									className='mt-4'
								>
									<Download className='mr-2 h-4 w-4' />
									Download Pass
								</Button>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Visitor Details */}
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Users className='h-5 w-5' />
							Visitor Information
						</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div>
								<p className='text-sm text-muted-foreground'>
									Name
								</p>
								<p className='font-medium text-lg'>
									{visitor.name}
								</p>
							</div>
							{visitor.email && (
								<div>
									<p className='text-sm text-muted-foreground flex items-center gap-1'>
										<Mail className='h-3 w-3' /> Email
									</p>
									<p className='font-medium'>
										{visitor.email}
									</p>
								</div>
							)}
							{visitor.phone && (
								<div>
									<p className='text-sm text-muted-foreground flex items-center gap-1'>
										<Phone className='h-3 w-3' /> Phone
									</p>
									<p className='font-medium'>
										{visitor.phone}
									</p>
								</div>
							)}
							{visitor.company && (
								<div>
									<p className='text-sm text-muted-foreground flex items-center gap-1'>
										<Building2 className='h-3 w-3' />{' '}
										Company
									</p>
									<p className='font-medium'>
										{visitor.company}
									</p>
								</div>
							)}
						</div>

						<Separator />

						<div>
							<p className='text-sm text-muted-foreground flex items-center gap-1'>
								<FileText className='h-3 w-3' /> Purpose of
								Visit
							</p>
							<p className='font-medium'>{visitor.purpose}</p>
						</div>

						<Separator />

						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div>
								<p className='text-sm text-muted-foreground flex items-center gap-1'>
									<Calendar className='h-3 w-3' /> Valid From
								</p>
								<p className='font-medium'>
									{format(
										new Date(visitor.validFrom),
										'EEEE, MMMM d, yyyy'
									)}
								</p>
							</div>
							<div>
								<p className='text-sm text-muted-foreground flex items-center gap-1'>
									<Calendar className='h-3 w-3' /> Valid Until
								</p>
								<p className='font-medium'>
									{format(
										new Date(visitor.validUntil),
										'EEEE, MMMM d, yyyy'
									)}
								</p>
							</div>
						</div>

						{(visitor.checkInTime || visitor.checkOutTime) && (
							<>
								<Separator />
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									{visitor.checkInTime && (
										<div>
											<p className='text-sm text-muted-foreground flex items-center gap-1'>
												<LogIn className='h-3 w-3' />{' '}
												Check-in Time
											</p>
											<p className='font-medium'>
												{format(
													new Date(
														visitor.checkInTime
													),
													'PPpp'
												)}
											</p>
										</div>
									)}
									{visitor.checkOutTime && (
										<div>
											<p className='text-sm text-muted-foreground flex items-center gap-1'>
												<LogOut className='h-3 w-3' />{' '}
												Check-out Time
											</p>
											<p className='font-medium'>
												{format(
													new Date(
														visitor.checkOutTime
													),
													'PPpp'
												)}
											</p>
										</div>
									)}
								</div>
							</>
						)}
					</CardContent>
				</Card>

				{/* Host Information */}
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Users className='h-5 w-5' />
							Host Information
						</CardTitle>
						<CardDescription>
							Your host at AMG Workspace
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-2'>
							<p className='font-medium text-lg'>
								{visitor.host.name}
							</p>
							{visitor.host.email && (
								<p className='text-muted-foreground flex items-center gap-2'>
									<Mail className='h-4 w-4' />
									{visitor.host.email}
								</p>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Location */}
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<MapPin className='h-5 w-5' />
							Location
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='space-y-2'>
							<p className='font-medium'>AMG Workspace</p>
							<p className='text-muted-foreground'>
								31 Aromire Avenue, off Adeniyi Jones,
								<br />
								Ikeja, Lagos, Nigeria
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Footer */}
				<div className='text-center text-sm text-muted-foreground'>
					<p>
						Please present this QR code at the reception desk upon
						arrival.
					</p>
					<p className='mt-1'>
						For any queries, contact your host or call +234 XXX XXX
						XXXX
					</p>
				</div>
			</div>
		</div>
	);
}
