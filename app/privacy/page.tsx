import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Privacy Policy',
	description:
		'AMG Workspace Privacy Policy. Learn how we collect, use, and protect your personal information.',
	robots: {
		index: true,
		follow: true,
	},
};

export default function PrivacyPage() {
	return (
		<main className='container mx-auto max-w-2xl py-12 px-4'>
			<h1 className='text-3xl font-bold mb-4'>Privacy Policy</h1>
			<p className='mb-2'>
				This is a placeholder for the AMG Workspace Privacy Policy.
				Please update with your actual privacy policy.
			</p>
		</main>
	);
}
