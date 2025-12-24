import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/actions';
import QRScannerClient from './scanner-client';

export default async function QRScannerPage() {
	const admin = await getCurrentAdmin();

	if (!admin) {
		redirect('/admin/login');
	}

	return <QRScannerClient />;
}
