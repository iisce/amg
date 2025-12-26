'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { QrCode, Download, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';

interface SubscriptionQRCodeProps {
	membershipId: string;
	membershipNumber: string;
	accessCode: string;
	spaceName: string;
}

export function SubscriptionQRCode({
	membershipId,
	membershipNumber,
	accessCode,
	spaceName,
}: SubscriptionQRCodeProps) {
	const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		const generateQRCode = async () => {
			try {
				const qrData = JSON.stringify({
					type: 'membership_checkin',
					membershipNumber,
					membershipId,
					accessCode,
				});

				const dataUrl = await QRCode.toDataURL(qrData, {
					width: 250,
					margin: 2,
					color: { dark: '#000000', light: '#ffffff' },
				});
				setQrCodeDataUrl(dataUrl);
			} catch (error) {
				console.error('Failed to generate QR code:', error);
			} finally {
				setIsLoading(false);
			}
		};

		generateQRCode();
	}, [membershipId, membershipNumber, accessCode]);

	const handleCopy = () => {
		navigator.clipboard.writeText(accessCode);
		setCopied(true);
		toast.success('Access code copied!');
		setTimeout(() => setCopied(false), 2000);
	};

	const handleDownload = () => {
		if (!qrCodeDataUrl) return;
		const link = document.createElement('a');
		link.href = qrCodeDataUrl;
		link.download = `amg-membership-${membershipNumber}.png`;
		link.click();
		toast.success('QR code downloaded!');
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<QrCode className='h-5 w-5' />
					Check-in QR Code
				</CardTitle>
			</CardHeader>
			<CardContent className='space-y-4'>
				<p className='text-sm text-muted-foreground'>
					Show this QR code to staff for quick check-in at AMG
					Workspace.
				</p>

				{/* QR Code Display */}
				<div className='flex justify-center'>
					{isLoading ? (
						<Skeleton className='w-[250px] h-[250px] rounded-lg' />
					) : qrCodeDataUrl ? (
						<img
							src={qrCodeDataUrl}
							alt={`QR Code for ${spaceName}`}
							className='w-[250px] h-[250px] rounded-lg border'
						/>
					) : (
						<div className='w-[250px] h-[250px] bg-muted rounded-lg flex items-center justify-center'>
							<span className='text-sm text-muted-foreground'>
								Failed to generate QR
							</span>
						</div>
					)}
				</div>

				{/* Access Code */}
				<div className='text-center'>
					<p className='text-xs text-muted-foreground mb-1'>
						Access Code
					</p>
					<div className='flex items-center justify-center gap-2'>
						<code className='bg-muted px-4 py-2 rounded text-lg font-mono font-bold'>
							{accessCode}
						</code>
						<Button
							variant='ghost'
							size='icon'
							className='h-8 w-8'
							onClick={handleCopy}
						>
							{copied ? (
								<CheckCircle className='h-4 w-4 text-green-600' />
							) : (
								<Copy className='h-4 w-4' />
							)}
						</Button>
					</div>
				</div>

				{/* Actions */}
				{qrCodeDataUrl && (
					<div className='flex justify-center'>
						<Button
							variant='outline'
							size='sm'
							onClick={handleDownload}
						>
							<Download className='mr-2 h-4 w-4' />
							Download QR Code
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
