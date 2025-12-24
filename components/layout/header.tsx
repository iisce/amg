'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { logout, getAuthStatus } from '@/actions/auth';
import { toast } from 'sonner';

export function Header() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	const pathname = usePathname();

	const checkAuth = useCallback(async () => {
		try {
			const { isAuthenticated, isAdmin } = await getAuthStatus();
			setIsAuthenticated(isAuthenticated);
			setIsAdmin(isAdmin);
		} catch (error) {
			setIsAuthenticated(false);
			setIsAdmin(false);
		}
	}, []);

	// Check auth status on mount and when pathname changes
	useEffect(() => {
		checkAuth();
	}, [pathname, checkAuth]);

	const handleLogout = async () => {
		try {
			setIsLoading(true);
			const result = await logout();
			if (result.success) {
				toast.success('Logged out successfully');
				setIsAuthenticated(false);
				router.push('/');
				router.refresh();
			}
		} catch (error) {
			toast.error('Failed to logout');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<header className='sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60'>
			<nav className='container mx-auto flex h-16 items-center justify-between px-4 lg:px-8'>
				{/* Logo */}
				<Link
					href='/'
					className='flex items-center gap-2'
				>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-white border-2 border-secondary'>
						<span className='text-xs font-bold text-secondary'>
							AMG
						</span>
					</div>
					<span className='text-lg font-bold text-secondary hidden sm:inline'>
						WORKSPACE
					</span>
				</Link>

				{/* Desktop Navigation */}
				<div className='hidden items-center gap-6 md:flex'>
					<Link
						href='/spaces'
						className='text-sm font-medium text-foreground hover:text-primary transition-colors'
					>
						Spaces
					</Link>
					<Link
						href='/pricing'
						className='text-sm font-medium text-foreground hover:text-primary transition-colors'
					>
						Pricing
					</Link>
					{isAuthenticated && (
						<Link
							href={isAdmin ? '/admin/dashboard' : '/dashboard'}
							className='text-sm font-medium text-foreground hover:text-primary transition-colors'
						>
							Dashboard
						</Link>
					)}
				</div>

				{/* Desktop Actions */}
				<div className='hidden items-center gap-3 md:flex'>
					{isAuthenticated ? (
						<>
							<Button
								variant='ghost'
								asChild
							>
								<Link
									href={
										isAdmin
											? '/admin/dashboard'
											: '/dashboard'
									}
								>
									Dashboard
								</Link>
							</Button>
							<Button
								variant='outline'
								onClick={handleLogout}
								disabled={isLoading}
							>
								<LogOut className='mr-2 h-4 w-4' />
								{isLoading ? 'Logging out...' : 'Logout'}
							</Button>
						</>
					) : (
						<>
							<Button
								variant='ghost'
								asChild
							>
								<Link href='/login'>Login</Link>
							</Button>
							<Button
								asChild
								className='bg-primary text-primary-foreground hover:bg-primary/90'
							>
								<Link href='/spaces'>Book Now</Link>
							</Button>
						</>
					)}
				</div>

				{/* Mobile Menu Button */}
				<button
					className='md:hidden'
					onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
				>
					{mobileMenuOpen ? (
						<X className='h-6 w-6' />
					) : (
						<Menu className='h-6 w-6' />
					)}
				</button>
			</nav>

			{/* Mobile Menu */}
			{mobileMenuOpen && (
				<div className='border-t bg-white md:hidden'>
					<div className='container mx-auto space-y-1 px-4 py-4'>
						<Link
							href='/spaces'
							className='block px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md'
							onClick={() => setMobileMenuOpen(false)}
						>
							Spaces
						</Link>
						<Link
							href='/pricing'
							className='block px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md'
							onClick={() => setMobileMenuOpen(false)}
						>
							Pricing
						</Link>
						{isAuthenticated && (
							<Link
								href={
									isAdmin ? '/admin/dashboard' : '/dashboard'
								}
								className='block px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md'
								onClick={() => setMobileMenuOpen(false)}
							>
								Dashboard
							</Link>
						)}
						<div className='flex flex-col gap-2 pt-4 border-t'>
							{isAuthenticated ? (
								<>
									<Button
										variant='outline'
										asChild
										onClick={() => setMobileMenuOpen(false)}
									>
										<Link
											href={
												isAdmin
													? '/admin/dashboard'
													: '/dashboard'
											}
										>
											Dashboard
										</Link>
									</Button>
									<Button
										variant='outline'
										onClick={() => {
											setMobileMenuOpen(false);
											handleLogout();
										}}
										disabled={isLoading}
									>
										<LogOut className='mr-2 h-4 w-4' />
										{isLoading
											? 'Logging out...'
											: 'Logout'}
									</Button>
								</>
							) : (
								<>
									<Button
										variant='outline'
										asChild
										onClick={() => setMobileMenuOpen(false)}
									>
										<Link href='/login'>Login</Link>
									</Button>
									<Button
										asChild
										className='bg-primary text-primary-foreground hover:bg-primary/90'
										onClick={() => setMobileMenuOpen(false)}
									>
										<Link href='/spaces'>Book Now</Link>
									</Button>
								</>
							)}
						</div>
					</div>
				</div>
			)}
		</header>
	);
}
