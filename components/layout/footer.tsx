import Link from 'next/link';
import {
	Facebook,
	Instagram,
	Twitter,
	Linkedin,
	Mail,
	Phone,
	MapPin,
} from 'lucide-react';

export function Footer() {
	return (
		<footer className='border-t bg-secondary text-secondary-foreground'>
			<div className='container mx-auto px-4 py-8 lg:px-8 lg:py-12'>
				<div className='grid gap-8 md:grid-cols-2 lg:grid-cols-4'>
					{/* Brand */}
					<div className='space-y-4'>
						<div className='flex items-center gap-2'>
							<div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary border-2 border-primary'>
								<span className='text-xs font-bold text-primary-foreground'>
									AMG
								</span>
							</div>
							<span className='text-lg font-bold'>WORKSPACE</span>
						</div>
						<p className='text-sm text-secondary-foreground/80'>
							Do more than just work. Create. Innovate.
						</p>
						<div className='flex gap-3'>
							<a
								href='#'
								className='hover:text-primary transition-colors'
							>
								<Facebook className='h-5 w-5' />
							</a>
							<a
								href='#'
								className='hover:text-primary transition-colors'
							>
								<Instagram className='h-5 w-5' />
							</a>
							<a
								href='#'
								className='hover:text-primary transition-colors'
							>
								<Twitter className='h-5 w-5' />
							</a>
							<a
								href='#'
								className='hover:text-primary transition-colors'
							>
								<Linkedin className='h-5 w-5' />
							</a>
						</div>
					</div>

					{/* Quick Links */}
					<div className='space-y-4'>
						<h3 className='text-sm font-semibold'>Quick Links</h3>
						<ul className='space-y-2 text-sm text-secondary-foreground/80'>
							<li>
								<Link
									href='/spaces'
									className='hover:text-primary transition-colors'
								>
									Browse Spaces
								</Link>
							</li>
							<li>
								<Link
									href='/pricing'
									className='hover:text-primary transition-colors'
								>
									Pricing Plans
								</Link>
							</li>
							<li>
								<Link
									href='/contact'
									className='hover:text-primary transition-colors'
								>
									Contact Us
								</Link>
							</li>
							<li>
								<Link
									href='/dashboard'
									className='hover:text-primary transition-colors'
								>
									My Dashboard
								</Link>
							</li>
						</ul>
					</div>

					{/* Spaces */}
					<div className='space-y-4'>
						<h3 className='text-sm font-semibold'>Our Spaces</h3>
						<ul className='space-y-2 text-sm text-secondary-foreground/80'>
							<li>Work Solo</li>
							<li>Board Room</li>
							<li>Training Room</li>
							<li>Photo Studio</li>
							<li>Office Spaces</li>
							<li>Shared Desk</li>
						</ul>
					</div>

					{/* Contact */}
					<div className='space-y-4'>
						<h3 className='text-sm font-semibold'>Contact Us</h3>
						<ul className='space-y-3 text-sm text-secondary-foreground/80'>
							<li className='flex items-start gap-2'>
								<MapPin className='h-4 w-4 mt-0.5 shrink-0' />
								<Link
									href='/#location'
									className='hover:text-primary transition-colors'
								>
									Festac Tower, 22 Rd, Festac Town, Lagos
								</Link>
							</li>
							<li className='flex items-center gap-2'>
								<Phone className='h-4 w-4 shrink-0' />
								<a
									href='tel:+2349134011777'
									className='hover:text-primary transition-colors'
								>
									+234 913 401 1777
								</a>
							</li>
							<li className='flex items-center gap-2'>
								<Mail className='h-4 w-4 shrink-0' />
								<a
									href='mailto:amgworkspace@gmail.com'
									className='hover:text-primary transition-colors'
								>
									amgworkspace@gmail.com
								</a>
							</li>
						</ul>
					</div>
				</div>

				<div className='mt-8 border-t border-secondary-foreground/20 pt-8 text-center text-sm text-secondary-foreground/60'>
					<p>
						&copy; {new Date().getFullYear()} AMG Workspace. All
						rights reserved.
					</p>
				</div>
			</div>
		</footer>
	);
}
