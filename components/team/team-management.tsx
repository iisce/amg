'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
	Trash2,
	Edit,
	QrCode,
	RefreshCw,
	Users,
	UserPlus,
	UserMinus,
	Mail,
	Phone,
	Copy,
	Check,
	Loader2,
	AlertCircle,
	Crown,
	Download,
	Send,
	Link,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
	getTeamMembers,
	addTeamMember,
	updateTeamMember,
	removeTeamMember,
	regenerateAccessCode,
	getCurrentOccupancy,
	type TeamMember,
} from '@/actions/team-members';
import {
	sendTeamMemberInvitation,
	sendTeamMemberQRCode,
} from '@/actions/subscriptions';
import QRCode from 'qrcode';

interface TeamManagementProps {
	membershipId: string;
	membershipNumber: string;
	companyName?: string | null;
	maxMembers: number;
	isAdmin?: boolean;
}

export function TeamManagement({
	membershipId,
	membershipNumber,
	companyName,
	maxMembers,
	isAdmin = false,
}: TeamManagementProps) {
	const router = useRouter();
	const [members, setMembers] = useState<TeamMember[]>([]);
	const [loading, setLoading] = useState(true);
	const [occupancy, setOccupancy] = useState<{
		current: number;
		max: number;
		checkedInMembers: Array<{
			id: string;
			name: string;
			checkInTime: Date;
		}>;
	} | null>(null);

	// Dialog states
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [qrDialogOpen, setQrDialogOpen] = useState(false);
	const [selectedMember, setSelectedMember] = useState<TeamMember | null>(
		null
	);
	const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
	const [qrLoading, setQrLoading] = useState(false);

	// Form states
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		phone: '',
	});
	const [submitting, setSubmitting] = useState(false);
	const [copiedCode, setCopiedCode] = useState<string | null>(null);

	// Fetch team members
	const fetchMembers = async () => {
		setLoading(true);
		try {
			const [membersResult, occupancyResult] = await Promise.all([
				getTeamMembers(membershipId),
				getCurrentOccupancy(membershipId),
			]);

			if (membersResult.success && membersResult.data) {
				setMembers(membersResult.data);
			}
			if (occupancyResult.success && occupancyResult.data) {
				setOccupancy({
					current: occupancyResult.data.currentOccupancy,
					max: occupancyResult.data.maxMembers,
					checkedInMembers: occupancyResult.data.checkedInMembers,
				});
			}
		} catch (error) {
			console.error('Failed to fetch team data:', error);
			toast.error('Failed to load team members');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchMembers();
	}, [membershipId]);

	// Add member handler
	const handleAddMember = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name.trim()) {
			toast.error('Name is required');
			return;
		}

		setSubmitting(true);
		try {
			const result = await addTeamMember({
				membershipId,
				name: formData.name.trim(),
				email: formData.email.trim() || undefined,
				phone: formData.phone.trim() || undefined,
			});

			if (result.success) {
				toast.success('Team member added successfully');
				setAddDialogOpen(false);
				setFormData({ name: '', email: '', phone: '' });
				fetchMembers();
			} else {
				toast.error(result.message);
			}
		} catch (error) {
			toast.error('Failed to add team member');
		} finally {
			setSubmitting(false);
		}
	};

	// Update member handler
	const handleUpdateMember = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedMember || !formData.name.trim()) {
			toast.error('Name is required');
			return;
		}

		setSubmitting(true);
		try {
			const result = await updateTeamMember(selectedMember.id, {
				name: formData.name.trim(),
				email: formData.email.trim() || undefined,
				phone: formData.phone.trim() || undefined,
			});

			if (result.success) {
				toast.success('Team member updated successfully');
				setEditDialogOpen(false);
				setSelectedMember(null);
				setFormData({ name: '', email: '', phone: '' });
				fetchMembers();
			} else {
				toast.error(result.message);
			}
		} catch (error) {
			toast.error('Failed to update team member');
		} finally {
			setSubmitting(false);
		}
	};

	// Remove member handler
	const handleRemoveMember = async (member: TeamMember) => {
		try {
			const result = await removeTeamMember(member.id);
			if (result.success) {
				toast.success('Team member removed');
				fetchMembers();
			} else {
				toast.error(result.message);
			}
		} catch (error) {
			toast.error('Failed to remove team member');
		}
	};

	// Toggle member active status
	const handleToggleActive = async (member: TeamMember) => {
		try {
			const result = await updateTeamMember(member.id, {
				isActive: !member.isActive,
			});
			if (result.success) {
				toast.success(
					member.isActive
						? 'Team member deactivated'
						: 'Team member activated'
				);
				fetchMembers();
			} else {
				toast.error(result.message);
			}
		} catch (error) {
			toast.error('Failed to update member status');
		}
	};

	// Regenerate access code
	const handleRegenerateCode = async (member: TeamMember) => {
		try {
			const result = await regenerateAccessCode(member.id);
			if (result.success) {
				toast.success('New QR code generated');
				fetchMembers();
			} else {
				toast.error(result.message);
			}
		} catch (error) {
			toast.error('Failed to regenerate code');
		}
	};

	// Send invitation email to team member
	const handleSendInvitation = async (member: TeamMember) => {
		if (!member.email) {
			toast.error('Member has no email address');
			return;
		}
		try {
			const result = await sendTeamMemberInvitation(member.id);
			if (result.success) {
				toast.success('Invitation sent successfully');
			} else {
				toast.error(result.message);
			}
		} catch (error) {
			toast.error('Failed to send invitation');
		}
	};

	// Send QR code via email
	const handleSendQREmail = async (member: TeamMember) => {
		if (!member.email) {
			toast.error('Member has no email address');
			return;
		}
		try {
			const result = await sendTeamMemberQRCode(member.id);
			if (result.success) {
				toast.success('QR code sent to email');
			} else {
				toast.error(result.message);
			}
		} catch (error) {
			toast.error('Failed to send QR code email');
		}
	};

	// Copy portal link
	const copyPortalLink = async (member: TeamMember) => {
		const portalUrl = `${window.location.origin}/team/portal/${member.accessCode}`;
		try {
			await navigator.clipboard.writeText(portalUrl);
			toast.success('Portal link copied to clipboard');
		} catch (error) {
			toast.error('Failed to copy link');
		}
	};

	// Copy to clipboard
	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedCode(text);
			setTimeout(() => setCopiedCode(null), 2000);
			toast.success('Copied to clipboard');
		} catch (error) {
			toast.error('Failed to copy');
		}
	};

	// Open edit dialog
	const openEditDialog = (member: TeamMember) => {
		setSelectedMember(member);
		setFormData({
			name: member.name,
			email: member.email || '',
			phone: member.phone || '',
		});
		setEditDialogOpen(true);
	};

	// Open QR dialog and generate QR code
	const openQrDialog = async (member: TeamMember) => {
		setSelectedMember(member);
		setQrCodeDataUrl(null);
		setQrLoading(true);
		setQrDialogOpen(true);

		try {
			const qrData = JSON.stringify({
				accessCode: member.accessCode,
				type: 'team_member',
			});

			const dataUrl = await QRCode.toDataURL(qrData, {
				width: 250,
				margin: 2,
				color: { dark: '#000000', light: '#ffffff' },
			});
			setQrCodeDataUrl(dataUrl);
		} catch (error) {
			console.error('Failed to generate QR code:', error);
			toast.error('Failed to generate QR code');
		} finally {
			setQrLoading(false);
		}
	};

	// Download QR code
	const downloadQRCode = () => {
		if (!qrCodeDataUrl || !selectedMember) return;
		const link = document.createElement('a');
		link.href = qrCodeDataUrl;
		link.download = `${selectedMember.name.replace(
			/\s+/g,
			'-'
		)}-qrcode.png`;
		link.click();
		toast.success('QR code downloaded!');
	};

	if (loading) {
		return (
			<Card>
				<CardContent className='flex items-center justify-center py-12'>
					<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
				</CardContent>
			</Card>
		);
	}

	const activeMembers = members.filter((m) => m.isActive);
	const canAddMore = activeMembers.length < maxMembers;

	return (
		<div className='space-y-6'>
			{/* Header Card */}
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div>
							<CardTitle className='flex items-center gap-2'>
								<Users className='h-5 w-5' />
								Team Members
								{companyName && (
									<Badge
										variant='outline'
										className='ml-2'
									>
										{companyName}
									</Badge>
								)}
							</CardTitle>
							<CardDescription className='mt-1'>
								Manage team members for subscription #
								{membershipNumber}
							</CardDescription>
						</div>
						<Dialog
							open={addDialogOpen}
							onOpenChange={setAddDialogOpen}
						>
							<DialogTrigger asChild>
								<Button disabled={!canAddMore}>
									<UserPlus className='h-4 w-4 mr-2' />
									Add Member
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Add Team Member</DialogTitle>
									<DialogDescription>
										Add a new member to your team
										subscription. They will receive their
										own QR code for check-in.
									</DialogDescription>
								</DialogHeader>
								<form onSubmit={handleAddMember}>
									<div className='space-y-4 py-4'>
										<div className='space-y-2'>
											<Label htmlFor='name'>
												Full Name *
											</Label>
											<Input
												id='name'
												placeholder='John Doe'
												value={formData.name}
												onChange={(e) =>
													setFormData({
														...formData,
														name: e.target.value,
													})
												}
												required
											/>
										</div>
										<div className='space-y-2'>
											<Label htmlFor='email'>Email</Label>
											<Input
												id='email'
												type='email'
												placeholder='john@company.com'
												value={formData.email}
												onChange={(e) =>
													setFormData({
														...formData,
														email: e.target.value,
													})
												}
											/>
										</div>
										<div className='space-y-2'>
											<Label htmlFor='phone'>Phone</Label>
											<Input
												id='phone'
												type='tel'
												placeholder='+234 801 234 5678'
												value={formData.phone}
												onChange={(e) =>
													setFormData({
														...formData,
														phone: e.target.value,
													})
												}
											/>
										</div>
									</div>
									<DialogFooter>
										<Button
											type='button'
											variant='outline'
											onClick={() =>
												setAddDialogOpen(false)
											}
										>
											Cancel
										</Button>
										<Button
											type='submit'
											disabled={submitting}
										>
											{submitting ? (
												<Loader2 className='h-4 w-4 mr-2 animate-spin' />
											) : (
												<UserPlus className='h-4 w-4 mr-2' />
											)}
											Add Member
										</Button>
									</DialogFooter>
								</form>
							</DialogContent>
						</Dialog>
					</div>
				</CardHeader>
				<CardContent>
					{/* Capacity Progress */}
					<div className='space-y-2 mb-6'>
						<div className='flex justify-between text-sm'>
							<span className='text-muted-foreground'>
								Team Capacity
							</span>
							<span className='font-medium'>
								{activeMembers.length} / {maxMembers} members
							</span>
						</div>
						<Progress
							value={(activeMembers.length / maxMembers) * 100}
							className='h-2'
						/>
						{!canAddMore && (
							<p className='text-xs text-muted-foreground'>
								Maximum team size reached. Contact support to
								add more seats.
							</p>
						)}
					</div>

					{/* Current Occupancy */}
					{occupancy && (
						<div className='bg-muted/50 rounded-lg p-4 mb-6'>
							<div className='flex items-center justify-between mb-2'>
								<h4 className='font-medium flex items-center gap-2'>
									<Users className='h-4 w-4' />
									Current Occupancy
								</h4>
								<Badge
									variant={
										occupancy.current >= occupancy.max
											? 'destructive'
											: 'secondary'
									}
								>
									{occupancy.current} / {occupancy.max}{' '}
									present
								</Badge>
							</div>
							{occupancy.checkedInMembers.length > 0 ? (
								<div className='flex flex-wrap gap-2'>
									{occupancy.checkedInMembers.map((m) => (
										<Badge
											key={m.id}
											variant='outline'
											className='bg-green-50 text-green-700 border-green-200'
										>
											{m.name}
										</Badge>
									))}
								</div>
							) : (
								<p className='text-sm text-muted-foreground'>
									No team members currently checked in
								</p>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Members Table */}
			<Card>
				<CardContent className='pt-6'>
					{members.length === 0 ? (
						<div className='text-center py-12'>
							<Users className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
							<h3 className='font-semibold mb-2'>
								No team members yet
							</h3>
							<p className='text-sm text-muted-foreground mb-4'>
								Add team members to share this subscription
							</p>
							<Button onClick={() => setAddDialogOpen(true)}>
								<UserPlus className='h-4 w-4 mr-2' />
								Add First Member
							</Button>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Member</TableHead>
									<TableHead>Contact</TableHead>
									<TableHead>Access Code</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className='text-right'>
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{members.map((member) => (
									<TableRow
										key={member.id}
										className={
											!member.isActive ? 'opacity-50' : ''
										}
									>
										<TableCell>
											<div className='flex items-center gap-3'>
												<Avatar className='h-9 w-9'>
													{member.user?.avatar ? (
														<AvatarImage
															src={
																member.user
																	.avatar
															}
															alt={member.name}
														/>
													) : null}
													<AvatarFallback>
														{member.name
															.split(' ')
															.map((n) => n[0])
															.join('')
															.toUpperCase()
															.slice(0, 2)}
													</AvatarFallback>
												</Avatar>
												<div>
													<p className='font-medium flex items-center gap-2'>
														{member.name}
														{member.isPrimary && (
															<Crown className='h-4 w-4 text-amber-500' />
														)}
													</p>
													{member.isPrimary && (
														<p className='text-xs text-muted-foreground'>
															Primary Account
															Holder
														</p>
													)}
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div className='space-y-1'>
												{member.email && (
													<p className='text-sm flex items-center gap-1'>
														<Mail className='h-3 w-3 text-muted-foreground' />
														{member.email}
													</p>
												)}
												{member.phone && (
													<p className='text-sm flex items-center gap-1'>
														<Phone className='h-3 w-3 text-muted-foreground' />
														{member.phone}
													</p>
												)}
												{!member.email &&
													!member.phone && (
														<p className='text-sm text-muted-foreground'>
															No contact info
														</p>
													)}
											</div>
										</TableCell>
										<TableCell>
											<div className='flex items-center gap-2'>
												<code className='text-xs bg-muted px-2 py-1 rounded font-mono'>
													{member.accessCode}
												</code>
												<Button
													variant='ghost'
													size='icon'
													className='h-7 w-7'
													onClick={() =>
														copyToClipboard(
															member.accessCode
														)
													}
												>
													{copiedCode ===
													member.accessCode ? (
														<Check className='h-3 w-3 text-green-600' />
													) : (
														<Copy className='h-3 w-3' />
													)}
												</Button>
												<Button
													variant='ghost'
													size='icon'
													className='h-7 w-7'
													onClick={() =>
														openQrDialog(member)
													}
												>
													<QrCode className='h-3 w-3' />
												</Button>
											</div>
										</TableCell>
										<TableCell>
											{member.isActive ? (
												<Badge className='bg-green-100 text-green-700 border-green-200'>
													Active
												</Badge>
											) : (
												<Badge variant='secondary'>
													Inactive
												</Badge>
											)}
										</TableCell>
										<TableCell className='text-right'>
											{member.isPrimary ? (
												<div className='flex items-center justify-end gap-2'>
													<Button
														variant='ghost'
														size='icon'
														onClick={() =>
															openQrDialog(member)
														}
														title='View QR Code'
													>
														<QrCode className='h-4 w-4' />
													</Button>
													<Badge
														variant='outline'
														className='text-xs'
													>
														Owner
													</Badge>
												</div>
											) : (
												<DropdownMenu>
													<DropdownMenuTrigger
														asChild
													>
														<Button
															variant='ghost'
															size='icon'
														>
															<Edit className='h-4 w-4' />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align='end'>
														<DropdownMenuItem
															onClick={() =>
																openEditDialog(
																	member
																)
															}
														>
															<Edit className='h-4 w-4 mr-2' />
															Edit Details
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																openQrDialog(
																	member
																)
															}
														>
															<QrCode className='h-4 w-4 mr-2' />
															View QR Code
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																copyPortalLink(
																	member
																)
															}
														>
															<Link className='h-4 w-4 mr-2' />
															Copy Portal Link
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														{member.email &&
															!member.userId && (
																<DropdownMenuItem
																	onClick={() =>
																		handleSendInvitation(
																			member
																		)
																	}
																>
																	<Send className='h-4 w-4 mr-2' />
																	Send
																	Invitation
																</DropdownMenuItem>
															)}
														{member.email && (
															<DropdownMenuItem
																onClick={() =>
																	handleSendQREmail(
																		member
																	)
																}
															>
																<Mail className='h-4 w-4 mr-2' />
																Email QR Code
															</DropdownMenuItem>
														)}
														<DropdownMenuItem
															onClick={() =>
																handleRegenerateCode(
																	member
																)
															}
														>
															<RefreshCw className='h-4 w-4 mr-2' />
															Regenerate Code
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															onClick={() =>
																handleToggleActive(
																	member
																)
															}
														>
															{member.isActive ? (
																<>
																	<UserMinus className='h-4 w-4 mr-2' />
																	Deactivate
																</>
															) : (
																<>
																	<UserPlus className='h-4 w-4 mr-2' />
																	Activate
																</>
															)}
														</DropdownMenuItem>
														<AlertDialog>
															<AlertDialogTrigger
																asChild
															>
																<DropdownMenuItem
																	onSelect={(
																		e
																	) =>
																		e.preventDefault()
																	}
																	className='text-red-600'
																>
																	<Trash2 className='h-4 w-4 mr-2' />
																	Remove
																</DropdownMenuItem>
															</AlertDialogTrigger>
															<AlertDialogContent>
																<AlertDialogHeader>
																	<AlertDialogTitle>
																		Remove
																		Team
																		Member
																	</AlertDialogTitle>
																	<AlertDialogDescription>
																		Are you
																		sure you
																		want to
																		remove{' '}
																		{
																			member.name
																		}{' '}
																		from the
																		team?
																		This
																		action
																		cannot
																		be
																		undone.
																	</AlertDialogDescription>
																</AlertDialogHeader>
																<AlertDialogFooter>
																	<AlertDialogCancel>
																		Cancel
																	</AlertDialogCancel>
																	<AlertDialogAction
																		className='bg-red-600 hover:bg-red-700'
																		onClick={() =>
																			handleRemoveMember(
																				member
																			)
																		}
																	>
																		Remove
																	</AlertDialogAction>
																</AlertDialogFooter>
															</AlertDialogContent>
														</AlertDialog>
													</DropdownMenuContent>
												</DropdownMenu>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* Edit Member Dialog */}
			<Dialog
				open={editDialogOpen}
				onOpenChange={setEditDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Team Member</DialogTitle>
						<DialogDescription>
							Update team member information.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleUpdateMember}>
						<div className='space-y-4 py-4'>
							<div className='space-y-2'>
								<Label htmlFor='edit-name'>Full Name *</Label>
								<Input
									id='edit-name'
									placeholder='John Doe'
									value={formData.name}
									onChange={(e) =>
										setFormData({
											...formData,
											name: e.target.value,
										})
									}
									required
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='edit-email'>Email</Label>
								<Input
									id='edit-email'
									type='email'
									placeholder='john@company.com'
									value={formData.email}
									onChange={(e) =>
										setFormData({
											...formData,
											email: e.target.value,
										})
									}
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='edit-phone'>Phone</Label>
								<Input
									id='edit-phone'
									type='tel'
									placeholder='+234 801 234 5678'
									value={formData.phone}
									onChange={(e) =>
										setFormData({
											...formData,
											phone: e.target.value,
										})
									}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								type='button'
								variant='outline'
								onClick={() => setEditDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button
								type='submit'
								disabled={submitting}
							>
								{submitting ? (
									<Loader2 className='h-4 w-4 mr-2 animate-spin' />
								) : (
									<Check className='h-4 w-4 mr-2' />
								)}
								Save Changes
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* QR Code Dialog */}
			<Dialog
				open={qrDialogOpen}
				onOpenChange={setQrDialogOpen}
			>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle>Member QR Code</DialogTitle>
						<DialogDescription>
							{selectedMember?.name}&apos;s personal check-in code
						</DialogDescription>
					</DialogHeader>
					{selectedMember && (
						<div className='flex flex-col items-center py-6'>
							<div className='bg-white p-4 rounded-lg border'>
								{qrLoading ? (
									<div className='w-[200px] h-[200px] flex items-center justify-center'>
										<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
									</div>
								) : qrCodeDataUrl ? (
									<img
										src={qrCodeDataUrl}
										alt={`QR Code for ${selectedMember.name}`}
										className='w-[200px] h-[200px]'
									/>
								) : (
									<div className='w-[200px] h-[200px] flex items-center justify-center bg-muted rounded'>
										<AlertCircle className='h-8 w-8 text-muted-foreground' />
									</div>
								)}
							</div>
							<p className='mt-4 font-mono text-lg font-semibold'>
								{selectedMember.accessCode}
							</p>
							<p className='text-sm text-muted-foreground mt-1'>
								Scan at front desk to check in
							</p>
							<div className='flex gap-2 mt-4'>
								<Button
									variant='outline'
									onClick={() =>
										copyToClipboard(
											selectedMember.accessCode
										)
									}
								>
									<Copy className='h-4 w-4 mr-2' />
									Copy Code
								</Button>
								<Button
									onClick={downloadQRCode}
									disabled={!qrCodeDataUrl}
								>
									<Download className='h-4 w-4 mr-2' />
									Download
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
