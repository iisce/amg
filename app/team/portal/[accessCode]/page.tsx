'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Building2,
	QrCode,
	Clock,
	Calendar,
	CheckCircle2,
	XCircle,
	RefreshCw,
	Download,
	User,
} from 'lucide-react';
import { getTeamMemberByAccessCode } from '@/actions/subscriptions';

interface TeamMemberData {
	member: {
		id: string;
		name: string;
		email: string | null;
		phone: string | null;
		accessCode: string;
		isPrimary: boolean;
		isActive: boolean;
	};
	membership: {
		id: string;
		membershipNumber: string;
		companyName: string | null;
		status: string;
		space: {
			id: string;
			name: string;
			images: string[];
		};
	};
	checkIns: Array<{
		id: string;
		checkInTime: Date;
		checkOutTime: Date | null;
	}>;
}

export default function TeamMemberPortalPage() {
	const params = useParams();
	const accessCode = params.accessCode as string;

	const [data, setData] = useState<TeamMemberData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = async () => {
		setLoading(true);
		setError(null);

		const result = await getTeamMemberByAccessCode(accessCode);

		if (result.success && result.data) {
			setData(result.data);
		} else {
			setError(result.message || 'Invalid access code');
		}

		setLoading(false);
	};

	useEffect(() => {
		if (accessCode) {
			fetchData();
		}
	}, [accessCode]);

	const downloadQRCode = () => {
		const svg = document.getElementById('qr-code-svg');
		if (!svg) return;

		const svgData = new XMLSerializer().serializeToString(svg);
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		const img = new window.Image();

		img.onload = () => {
			canvas.width = img.width;
			canvas.height = img.height;
			ctx?.drawImage(img, 0, 0);
			const pngFile = canvas.toDataURL('image/png');
			const downloadLink = document.createElement('a');
			downloadLink.download = `AMG-QR-${accessCode}.png`;
			downloadLink.href = pngFile;
			downloadLink.click();
		};

		img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
	};

	if (loading) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4'>
				<div className='max-w-2xl mx-auto space-y-6'>
					<Skeleton className='h-12 w-48' />
					<Skeleton className='h-64 w-full' />
					<Skeleton className='h-48 w-full' />
				</div>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4'>
				<Card className='max-w-md w-full'>
					<CardHeader className='text-center'>
						<div className='mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4'>
							<XCircle className='h-8 w-8 text-red-600' />
						</div>
						<CardTitle>Access Denied</CardTitle>
						<CardDescription>
							{error ||
								'Invalid or expired access code. Please check your code and try again.'}
						</CardDescription>
					</CardHeader>
					<CardContent className='text-center'>
						<Button
							onClick={fetchData}
							variant='outline'
						>
							<RefreshCw className='mr-2 h-4 w-4' />
							Try Again
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	const { member, membership, checkIns } = data;
	const isCurrentlyCheckedIn = checkIns[0] && !checkIns[0].checkOutTime;

	return (
		<div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4'>
			<div className='max-w-2xl mx-auto space-y-6'>
				{/* Header */}
				<div className='text-center'>
					<div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4'>
						<Building2 className='h-8 w-8 text-primary' />
					</div>
					<h1 className='text-2xl font-bold'>
						{membership.companyName || membership.space.name}
					</h1>
					<p className='text-muted-foreground'>Team Member Portal</p>
				</div>

				{/* Member Info Card */}
				<Card>
					<CardHeader className='pb-3'>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-3'>
								<div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center'>
									<User className='h-6 w-6 text-primary' />
								</div>
								<div>
									<CardTitle className='text-lg'>
										{member.name}
									</CardTitle>
									<CardDescription>
										{member.isPrimary
											? 'Team Owner'
											: 'Team Member'}
									</CardDescription>
								</div>
							</div>
							<div className='flex flex-col items-end gap-1'>
								<Badge
									variant={
										member.isActive
											? 'default'
											: 'secondary'
									}
								>
									{member.isActive ? 'Active' : 'Inactive'}
								</Badge>
								{isCurrentlyCheckedIn && (
									<Badge
										variant='outline'
										className='bg-green-50 text-green-700 border-green-200'
									>
										<CheckCircle2 className='mr-1 h-3 w-3' />
										Checked In
									</Badge>
								)}
							</div>
						</div>
					</CardHeader>
					<CardContent className='pt-0'>
						<div className='grid grid-cols-2 gap-4 text-sm'>
							{member.email && (
								<div>
									<p className='text-muted-foreground'>
										Email
									</p>
									<p className='font-medium'>
										{member.email}
									</p>
								</div>
							)}
							{member.phone && (
								<div>
									<p className='text-muted-foreground'>
										Phone
									</p>
									<p className='font-medium'>
										{member.phone}
									</p>
								</div>
							)}
							<div>
								<p className='text-muted-foreground'>
									Workspace
								</p>
								<p className='font-medium'>
									{membership.space.name}
								</p>
							</div>
							<div>
								<p className='text-muted-foreground'>Status</p>
								<Badge
									variant={
										membership.status === 'ACTIVE'
											? 'default'
											: 'secondary'
									}
								>
									{membership.status}
								</Badge>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* QR Code Card */}
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<QrCode className='h-5 w-5' />
							Your QR Code
						</CardTitle>
						<CardDescription>
							Show this QR code at reception for check-in
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='flex flex-col items-center space-y-4'>
							<div className='p-4 bg-white rounded-xl border-2 border-primary/20'>
								<QRCodeSVG
									id='qr-code-svg'
									value={member.accessCode}
									size={200}
									level='H'
									includeMargin
								/>
							</div>
							<div className='text-center'>
								<p className='text-xs text-muted-foreground mb-1'>
									Access Code
								</p>
								<p className='text-2xl font-mono font-bold tracking-wider'>
									{member.accessCode}
								</p>
							</div>
							<Button
								onClick={downloadQRCode}
								variant='outline'
								className='w-full'
							>
								<Download className='mr-2 h-4 w-4' />
								Download QR Code
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Check-in History */}
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Clock className='h-5 w-5' />
							Check-in History
						</CardTitle>
						<CardDescription>
							Your recent workspace visits
						</CardDescription>
					</CardHeader>
					<CardContent>
						{checkIns.length === 0 ? (
							<div className='text-center py-8 text-muted-foreground'>
								<Calendar className='mx-auto h-12 w-12 mb-2 opacity-50' />
								<p>No check-ins yet</p>
							</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Date</TableHead>
										<TableHead>Check In</TableHead>
										<TableHead>Check Out</TableHead>
										<TableHead>Duration</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{checkIns.map((checkIn) => {
										const checkInTime = new Date(
											checkIn.checkInTime
										);
										const checkOutTime =
											checkIn.checkOutTime
												? new Date(checkIn.checkOutTime)
												: null;
										const duration = checkOutTime
											? Math.round(
													(checkOutTime.getTime() -
														checkInTime.getTime()) /
														60000
											  )
											: null;
										const hours = duration
											? Math.floor(duration / 60)
											: 0;
										const mins = duration
											? duration % 60
											: 0;

										return (
											<TableRow key={checkIn.id}>
												<TableCell className='font-medium'>
													{format(
														checkInTime,
														'MMM d, yyyy'
													)}
												</TableCell>
												<TableCell>
													{format(
														checkInTime,
														'h:mm a'
													)}
												</TableCell>
												<TableCell>
													{checkOutTime ? (
														format(
															checkOutTime,
															'h:mm a'
														)
													) : (
														<Badge
															variant='outline'
															className='text-green-600'
														>
															Active
														</Badge>
													)}
												</TableCell>
												<TableCell>
													{duration
														? `${
																hours > 0
																	? `${hours}h `
																	: ''
														  }${mins}m`
														: '-'}
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>

				{/* Footer */}
				<div className='text-center text-sm text-muted-foreground'>
					<p>AMG Workspace · Lagos, Nigeria</p>
					<p className='mt-1'>
						Need help?{' '}
						<a
							href='mailto:support@amgworkspace.com'
							className='text-primary hover:underline'
						>
							Contact Support
						</a>
					</p>
				</div>
			</div>
		</div>
	);
}
