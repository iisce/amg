import type { Metadata } from 'next';
import HomeClient from './home-client';

export const metadata: Metadata = {
	title: 'AMG Workspace - Premium Coworking Space in Lagos, Nigeria',
	description:
		'Do more than just work. Create. Innovate. AMG Workspace offers flexible coworking spaces, private offices, meeting rooms, and event venues in Lagos, Nigeria. Book your perfect workspace today.',
	keywords: [
		'coworking space Lagos',
		'office space Lagos Nigeria',
		'shared workspace Lagos',
		'private office rental Lagos',
		'meeting room Lagos',
		'hot desk Lagos',
		'flexible workspace Nigeria',
		'AMG Workspace Lagos',
	],
	alternates: {
		canonical: '/',
	},
	openGraph: {
		title: 'AMG Workspace - Premium Coworking Space in Lagos, Nigeria',
		description:
			'Do more than just work. Create. Innovate. Book flexible coworking spaces, private offices, meeting rooms, and event venues in Lagos.',
		url: '/',
		images: [
			{
				url: '/images/entire-office.jpg',
				width: 1200,
				height: 630,
				alt: 'AMG Workspace - Modern coworking space in Lagos, Nigeria',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'AMG Workspace - Premium Coworking Space in Lagos',
		description:
			'Do more than just work. Create. Innovate. Book flexible workspace solutions in Lagos, Nigeria.',
		images: ['/images/entire-office.jpg'],
	},
};

export default function HomePage() {
	return <HomeClient />;
}
