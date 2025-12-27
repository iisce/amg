import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/actions';
import { getFinanceSettings } from '@/actions/finance';
import FinanceSettingsClient from './finance-settings-client';

export default async function FinanceSettingsPage() {
	const admin = await getCurrentAdmin();

	if (!admin) {
		redirect('/admin/login');
	}

	const settingsResult = await getFinanceSettings();

	return (
		<FinanceSettingsClient
			admin={admin}
			settings={settingsResult.data || null}
		/>
	);
}
