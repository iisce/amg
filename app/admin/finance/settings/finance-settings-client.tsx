'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, Receipt, DollarSign } from 'lucide-react';
import { AdminNavigation } from '@/components/admin/admin-navigation';
import { toast } from 'sonner';
import { updateFinanceSettings, type FinanceSettings } from '@/actions/finance';

interface SessionUser {
	id: string;
	email: string;
	name: string;
	role: string;
}

interface FinanceSettingsClientProps {
	admin: SessionUser;
	settings: FinanceSettings | null;
}

const CURRENCIES = [
	{ code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
	{ code: 'USD', symbol: '$', name: 'US Dollar' },
	{ code: 'GBP', symbol: '£', name: 'British Pound' },
	{ code: 'EUR', symbol: '€', name: 'Euro' },
	{ code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
	{ code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
];

export default function FinanceSettingsClient({
	admin,
	settings,
}: FinanceSettingsClientProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	// Form state
	const [taxEnabled, setTaxEnabled] = useState(settings?.taxEnabled ?? false);
	const [taxRate, setTaxRate] = useState(String(settings?.taxRate ?? 7.5));
	const [taxName, setTaxName] = useState(settings?.taxName ?? 'VAT');
	const [taxNumber, setTaxNumber] = useState(settings?.taxNumber ?? '');
	const [currency, setCurrency] = useState(settings?.currency ?? 'NGN');
	const [invoicePrefix, setInvoicePrefix] = useState(
		settings?.invoicePrefix ?? 'INV'
	);
	const [invoiceFooter, setInvoiceFooter] = useState(
		settings?.invoiceFooter ?? 'Thank you for your business!'
	);

	const selectedCurrency = CURRENCIES.find((c) => c.code === currency);

	const handleSave = () => {
		startTransition(async () => {
			const result = await updateFinanceSettings({
				taxEnabled,
				taxRate: parseFloat(taxRate) || 0,
				taxName,
				taxNumber,
				currency,
				currencySymbol: selectedCurrency?.symbol || '₦',
				invoicePrefix,
				invoiceFooter,
			});

			if (result.success) {
				toast.success('Settings saved successfully');
				router.refresh();
			} else {
				toast.error(result.message || 'Failed to save settings');
			}
		});
	};

	return (
		<div className='min-h-screen bg-background'>
			{/* Admin Header */}
			<section className='bg-secondary text-secondary-foreground px-4 py-6 border-b'>
				<div className='container mx-auto'>
					<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
						<div>
							<div className='flex items-center gap-2 mb-2'>
								<Badge className='bg-red-600 text-white'>
									Admin
								</Badge>
								<span className='text-sm text-secondary-foreground/70'>
									Finance Settings
								</span>
							</div>
							<h1 className='text-2xl font-bold'>
								Finance Settings
							</h1>
							<p className='text-sm text-secondary-foreground/70'>
								Configure tax, currency, and invoice settings
							</p>
						</div>
						<div className='flex gap-2'>
							<Link href='/admin/finance'>
								<Button
									variant='outline'
									className='bg-transparent border-secondary-foreground/20'
								>
									<ArrowLeft className='mr-2 h-4 w-4' />
									Back to Finance
								</Button>
							</Link>
							<Button
								onClick={handleSave}
								disabled={isPending}
								className='bg-primary text-primary-foreground'
							>
								{isPending ? (
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
								) : (
									<Save className='mr-2 h-4 w-4' />
								)}
								Save Changes
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Navigation */}
			<AdminNavigation />

			{/* Content */}
			<section className='px-4 py-8'>
				<div className='container mx-auto max-w-4xl space-y-6'>
					{/* Tax Settings */}
					<Card>
						<CardHeader>
							<div className='flex items-center gap-2'>
								<Receipt className='h-5 w-5 text-primary' />
								<CardTitle>Tax Settings</CardTitle>
							</div>
							<CardDescription>
								Configure tax collection for bookings and
								subscriptions
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-6'>
							{/* Tax Enable Toggle */}
							<div className='flex items-center justify-between rounded-lg border p-4'>
								<div className='space-y-0.5'>
									<Label className='text-base'>
										Enable Tax Collection
									</Label>
									<p className='text-sm text-muted-foreground'>
										When enabled, tax will be calculated and
										added to all transactions
									</p>
								</div>
								<Switch
									checked={taxEnabled}
									onCheckedChange={setTaxEnabled}
								/>
							</div>

							{/* Tax Configuration (shown when enabled) */}
							{taxEnabled && (
								<div className='grid gap-4 md:grid-cols-2 pt-4 border-t'>
									<div className='space-y-2'>
										<Label htmlFor='taxName'>
											Tax Name
										</Label>
										<Input
											id='taxName'
											value={taxName}
											onChange={(e) =>
												setTaxName(e.target.value)
											}
											placeholder='e.g., VAT, Sales Tax, GST'
										/>
										<p className='text-xs text-muted-foreground'>
											This name will appear on invoices
											and receipts
										</p>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='taxRate'>
											Tax Rate (%)
										</Label>
										<Input
											id='taxRate'
											type='number'
											step='0.01'
											min='0'
											max='100'
											value={taxRate}
											onChange={(e) =>
												setTaxRate(e.target.value)
											}
											placeholder='e.g., 7.5'
										/>
										<p className='text-xs text-muted-foreground'>
											Percentage to apply to subtotal
										</p>
									</div>

									<div className='space-y-2 md:col-span-2'>
										<Label htmlFor='taxNumber'>
											Tax ID / Registration Number
										</Label>
										<Input
											id='taxNumber'
											value={taxNumber}
											onChange={(e) =>
												setTaxNumber(e.target.value)
											}
											placeholder='e.g., TIN-123456789'
										/>
										<p className='text-xs text-muted-foreground'>
											Your business tax identification
											number (displayed on invoices)
										</p>
									</div>
								</div>
							)}

							{/* Tax Preview */}
							{taxEnabled && (
								<div className='rounded-lg bg-muted/50 p-4 mt-4'>
									<h4 className='font-medium mb-2'>
										Preview
									</h4>
									<div className='text-sm space-y-1'>
										<div className='flex justify-between'>
											<span>Subtotal:</span>
											<span>
												{selectedCurrency?.symbol}
												10,000.00
											</span>
										</div>
										<div className='flex justify-between text-muted-foreground'>
											<span>
												{taxName} ({taxRate}%):
											</span>
											<span>
												{selectedCurrency?.symbol}
												{(
													(10000 *
														parseFloat(
															taxRate || '0'
														)) /
													100
												).toFixed(2)}
											</span>
										</div>
										<div className='flex justify-between font-medium border-t pt-1'>
											<span>Total:</span>
											<span>
												{selectedCurrency?.symbol}
												{(
													10000 +
													(10000 *
														parseFloat(
															taxRate || '0'
														)) /
														100
												).toFixed(2)}
											</span>
										</div>
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Currency Settings */}
					<Card>
						<CardHeader>
							<div className='flex items-center gap-2'>
								<DollarSign className='h-5 w-5 text-primary' />
								<CardTitle>Currency Settings</CardTitle>
							</div>
							<CardDescription>
								Set the default currency for your workspace
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='space-y-2'>
								<Label htmlFor='currency'>Currency</Label>
								<Select
									value={currency}
									onValueChange={setCurrency}
								>
									<SelectTrigger>
										<SelectValue placeholder='Select currency' />
									</SelectTrigger>
									<SelectContent>
										{CURRENCIES.map((c) => (
											<SelectItem
												key={c.code}
												value={c.code}
											>
												<span className='flex items-center gap-2'>
													<span className='font-medium'>
														{c.symbol}
													</span>
													<span>
														{c.name} ({c.code})
													</span>
												</span>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<p className='text-xs text-muted-foreground'>
									All prices will be displayed in this
									currency
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Invoice Settings */}
					<Card>
						<CardHeader>
							<div className='flex items-center gap-2'>
								<FileText className='h-5 w-5 text-primary' />
								<CardTitle>Invoice Settings</CardTitle>
							</div>
							<CardDescription>
								Customize invoice appearance and numbering
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='space-y-2'>
								<Label htmlFor='invoicePrefix'>
									Invoice Number Prefix
								</Label>
								<Input
									id='invoicePrefix'
									value={invoicePrefix}
									onChange={(e) =>
										setInvoicePrefix(e.target.value)
									}
									placeholder='e.g., INV, AMG'
									className='w-48'
								/>
								<p className='text-xs text-muted-foreground'>
									Invoices will be numbered as {invoicePrefix}
									-0001, {invoicePrefix}
									-0002, etc.
								</p>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='invoiceFooter'>
									Invoice Footer Message
								</Label>
								<Textarea
									id='invoiceFooter'
									value={invoiceFooter}
									onChange={(e) =>
										setInvoiceFooter(e.target.value)
									}
									placeholder='Thank you message or payment instructions...'
									rows={3}
								/>
								<p className='text-xs text-muted-foreground'>
									This message will appear at the bottom of
									all invoices
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Save Button (Mobile) */}
					<div className='flex justify-end md:hidden'>
						<Button
							onClick={handleSave}
							disabled={isPending}
							className='w-full'
						>
							{isPending ? (
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
							) : (
								<Save className='mr-2 h-4 w-4' />
							)}
							Save Changes
						</Button>
					</div>
				</div>
			</section>
		</div>
	);
}
