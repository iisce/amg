import type React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: {
		template: '%s | Admin | AMG Workspace',
		default: 'Admin | AMG Workspace',
	},
	robots: {
		index: false,
		follow: false,
		noarchive: true,
		nosnippet: true,
	},
};

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
