'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
	Blocks,
	Calendar,
	CalendarDays,
	CreditCard,
	FileText,
	LayoutGrid,
	Package,
	QrCode,
	ShoppingCart,
	Users,
	UserPlus,
	Wallet,
} from 'lucide-react';

const navItems = [
	{ href: '/admin/dashboard', label: 'Overview', icon: LayoutGrid },
	{ href: '/admin/addons', label: 'Add-ons', icon: Blocks },
	{ href: '/admin/bookings', label: 'Bookings', icon: Calendar },
	{ href: '/admin/finance', label: 'Finance', icon: Wallet },
	{ href: '/admin/inventory', label: 'Inventory', icon: Package },
	{ href: '/admin/members', label: 'Members', icon: Users },
	{ href: '/admin/memberships', label: 'Memberships', icon: CreditCard },
	{ href: '/admin/reports', label: 'Reports', icon: FileText },
	{ href: '/admin/scanner', label: 'Scanner', icon: QrCode },
	{ href: '/admin/shop', label: 'Shop', icon: ShoppingCart },
	{ href: '/admin/spaces', label: 'Spaces', icon: LayoutGrid },
	{ href: '/admin/tours', label: 'Tours', icon: CalendarDays },
	{ href: '/admin/visitors', label: 'Visitors', icon: UserPlus },
];

interface AdminNavigationProps {
	className?: string;
}

export function AdminNavigation({ className }: AdminNavigationProps) {
	const pathname = usePathname();

	const isActive = (href: string) => {
		if (href === '/admin/dashboard') {
			return pathname === '/admin/dashboard';
		}
		return pathname.startsWith(href);
	};

	return (
		<section className={cn('border-b bg-muted/30', className)}>
			<div className='container mx-auto px-4'>
				<nav className='flex gap-1 overflow-x-auto'>
					{navItems.map((item) => {
						const Icon = item.icon;
						const active = isActive(item.href);

						return (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors',
									active
										? 'border-b-2 border-primary bg-background text-foreground'
										: 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
								)}
							>
								<Icon className='h-4 w-4' />
								{item.label}
							</Link>
						);
					})}
				</nav>
			</div>
		</section>
	);
}
