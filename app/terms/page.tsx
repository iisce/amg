import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Terms of Service',
	description:
		'AMG Workspace Terms of Service. Read our terms and conditions for using our coworking spaces and services.',
	robots: {
		index: true,
		follow: true,
	},
};

export default function TermsPage() {
	return (
		<main className='container mx-auto max-w-2xl py-12 px-4'>
			<h1 className='text-3xl font-bold mb-4'>Terms of Service</h1>
			<p className='mb-2'>
				This is a placeholder for the AMG Workspace Terms of Service.
				Please update with your actual terms.
			</p>
		</main>
	);
}
