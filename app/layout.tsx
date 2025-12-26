import type React from 'react';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from '@/components/ui/sonner';

const _geist = Geist({ subsets: ['latin'] });
const _geistMono = Geist_Mono({ subsets: ['latin'] });

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://amgworkspace.com';

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	title: {
		default: 'AMG Workspace - Premium Coworking Space in Lagos, Nigeria',
		template: '%s | AMG Workspace',
	},
	description:
		'Do more than just work. Create. Innovate. AMG Workspace offers flexible coworking spaces, private offices, meeting rooms, and event venues in Lagos, Nigeria. Book your perfect workspace today.',
	keywords: [
		'coworking space Lagos',
		'office space Lagos',
		'shared workspace Nigeria',
		'private office Lagos',
		'meeting room rental Lagos',
		'hot desk Lagos',
		'flexible workspace Nigeria',
		'AMG Workspace',
		'workspace booking',
		'office rental Lagos',
		'business center Lagos',
		'training room Lagos',
		'event space Lagos',
		'boardroom rental',
		'virtual office Lagos',
	],
	authors: [{ name: 'AMG Workspace', url: siteUrl }],
	creator: 'AMG Workspace',
	publisher: 'AMG Workspace',
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	alternates: {
		canonical: '/',
	},
	openGraph: {
		type: 'website',
		locale: 'en_NG',
		url: siteUrl,
		siteName: 'AMG Workspace',
		title: 'AMG Workspace - Premium Coworking Space in Lagos, Nigeria',
		description:
			'Do more than just work. Create. Innovate. Book flexible coworking spaces, private offices, meeting rooms, and event venues in Lagos, Nigeria.',
		images: [
			{
				url: '/images/entire-office.jpg',
				width: 1200,
				height: 630,
				alt: 'AMG Workspace - Modern coworking space in Lagos, Nigeria',
				type: 'image/jpeg',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'AMG Workspace - Premium Coworking Space in Lagos',
		description:
			'Do more than just work. Create. Innovate. Book flexible workspace solutions in Lagos, Nigeria.',
		images: ['/images/entire-office.jpg'],
		creator: '@amgworkspace',
		site: '@amgworkspace',
	},
	robots: {
		index: true,
		follow: true,
		nocache: false,
		googleBot: {
			index: true,
			follow: true,
			noimageindex: false,
			'max-video-preview': -1,
			'max-image-preview': 'large',
			'max-snippet': -1,
		},
	},
	verification: {
		// Add your verification codes here when available
		// google: 'your-google-verification-code',
		// yandex: 'your-yandex-verification-code',
	},
	category: 'business',
	icons: {
		icon: [
			{
				url: '/icon-light-32x32.png',
				media: '(prefers-color-scheme: light)',
			},
			{
				url: '/icon-dark-32x32.png',
				media: '(prefers-color-scheme: dark)',
			},
			{
				url: '/icon.svg',
				type: 'image/svg+xml',
			},
		],
		apple: '/apple-icon.png',
	},
};

// JSON-LD structured data for SEO
const jsonLd = {
	'@context': 'https://schema.org',
	'@type': 'LocalBusiness',
	'@id': `${siteUrl}/#organization`,
	name: 'AMG Workspace',
	alternateName: 'AMG Coworking Space',
	description:
		'Premium coworking space offering flexible workspace solutions including shared desks, private offices, meeting rooms, and event venues in Lagos, Nigeria.',
	url: siteUrl,
	logo: `${siteUrl}/icon.svg`,
	image: `${siteUrl}/images/entire-office.jpg`,
	telephone: '+234-913-401-1777',
	email: 'amgworkspace@gmail.com',
	address: {
		'@type': 'PostalAddress',
		streetAddress: 'Festac Tower, 22 Rd',
		addressLocality: 'Festac Town',
		addressRegion: 'Lagos',
		postalCode: '102102',
		addressCountry: 'NG',
	},
	geo: {
		'@type': 'GeoCoordinates',
		latitude: 6.4650909,
		longitude: 3.2850825,
	},
	openingHoursSpecification: [
		{
			'@type': 'OpeningHoursSpecification',
			dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
			opens: '09:00',
			closes: '18:00',
		},
		{
			'@type': 'OpeningHoursSpecification',
			dayOfWeek: 'Saturday',
			opens: '11:00',
			closes: '16:00',
		},
	],
	priceRange: '₦₦',
	currenciesAccepted: 'NGN',
	paymentAccepted: 'Cash, Credit Card, Bank Transfer',
	areaServed: {
		'@type': 'City',
		name: 'Lagos',
	},
	sameAs: [
		'https://www.instagram.com/amgworkspace',
		'https://ng.linkedin.com/company/amg-workspace',
	],
	hasOfferCatalog: {
		'@type': 'OfferCatalog',
		name: 'Workspace Solutions',
		itemListElement: [
			{
				'@type': 'Offer',
				itemOffered: {
					'@type': 'Service',
					name: 'Shared Coworking Space',
					description:
						'Flexible hot desks in a collaborative environment',
				},
			},
			{
				'@type': 'Offer',
				itemOffered: {
					'@type': 'Service',
					name: 'Private Office',
					description: 'Dedicated private office spaces for teams',
				},
			},
			{
				'@type': 'Offer',
				itemOffered: {
					'@type': 'Service',
					name: 'Meeting Room',
					description: 'Professional meeting and conference rooms',
				},
			},
			{
				'@type': 'Offer',
				itemOffered: {
					'@type': 'Service',
					name: 'Event Venue',
					description: 'Spaces for workshops, training, and events',
				},
			},
		],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en'>
			<head>
				<script
					type='application/ld+json'
					dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
				/>
			</head>
			<body className={`font-sans antialiased`}>
				<Header />
				<main>{children}</main>
				<Footer />
				<Toaster />
				<Analytics />
			</body>
		</html>
	);
}
