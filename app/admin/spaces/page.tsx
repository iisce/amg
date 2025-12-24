import { redirect } from 'next/navigation';
import { getCurrentAdmin, getSpaces } from '@/actions';
import AdminSpacesClient from './admin-spaces-client';

export default async function AdminSpacesPage() {
	const admin = await getCurrentAdmin();

	if (!admin) {
		redirect('/admin/login');
	}

	const spacesResult = await getSpaces({ activeOnly: false });
	const spaces =
		spacesResult.success && spacesResult.data
			? Array.isArray(spacesResult.data)
				? spacesResult.data
				: [spacesResult.data]
			: [];

	return <AdminSpacesClient spaces={spaces} />;
}
