'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { TeamManagement } from '@/components/team/team-management';
import { updateTeamSettings } from '@/actions/subscriptions';
import { toast } from 'sonner';

interface AdminTeamManagementProps {
	membershipId: string;
	membershipNumber: string;
	companyName?: string | null;
	maxMembers: number;
	spaceName: string;
	userName: string;
	userId: string;
}

export function AdminTeamManagement({
	membershipId,
	membershipNumber,
	companyName: initialCompanyName,
	maxMembers: initialMaxMembers,
	spaceName,
	userName,
	userId,
}: AdminTeamManagementProps) {
	const router = useRouter();
	const [maxMembers, setMaxMembers] = useState(initialMaxMembers);
	const [companyName, setCompanyName] = useState(initialCompanyName || '');
	const [settingsDialogOpen, setSettingsDialogOpen] = useState(
		initialMaxMembers === 1
	);
	const [isSaving, setIsSaving] = useState(false);
	const [newMaxMembers, setNewMaxMembers] = useState(
		initialMaxMembers > 1 ? initialMaxMembers.toString() : '4'
	);
	const [newCompanyName, setNewCompanyName] = useState(
		initialCompanyName || ''
	);

	const handleSaveSettings = async () => {
		const maxMembersNum = parseInt(newMaxMembers, 10);
		if (isNaN(maxMembersNum) || maxMembersNum < 1) {
			toast.error('Max members must be at least 1');
			return;
		}

		setIsSaving(true);
		try {
			const result = await updateTeamSettings(membershipId, {
				maxMembers: maxMembersNum,
				companyName: newCompanyName || null,
			});

			if (result.success) {
				toast.success('Team settings updated successfully');
				setMaxMembers(maxMembersNum);
				setCompanyName(newCompanyName);
				setSettingsDialogOpen(false);
				router.refresh();
			} else {
				toast.error(result.message || 'Failed to update settings');
			}
		} catch (error) {
			toast.error('An error occurred');
		} finally {
			setIsSaving(false);
		}
	};
	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-4'>
					<Button
						variant='ghost'
						size='icon'
						asChild
					>
						<Link href={`/admin/members/${userId}`}>
							<ArrowLeft className='h-5 w-5' />
						</Link>
					</Button>
					<div>
						<h1 className='text-2xl font-bold'>Team Management</h1>
						<p className='text-muted-foreground'>
							Manage team members for subscription #
							{membershipNumber}
						</p>
					</div>
				</div>
				<Dialog
					open={settingsDialogOpen}
					onOpenChange={setSettingsDialogOpen}
				>
					<DialogTrigger asChild>
						<Button
							variant='outline'
							size='sm'
						>
							<Settings className='h-4 w-4 mr-2' />
							Team Settings
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Team Settings</DialogTitle>
							<DialogDescription>
								Configure team membership settings for this
								subscription
							</DialogDescription>
						</DialogHeader>
						<div className='space-y-4 py-4'>
							<div className='space-y-2'>
								<Label htmlFor='maxMembers'>
									Maximum Team Members
								</Label>
								<Input
									id='maxMembers'
									type='number'
									min='1'
									max='50'
									value={newMaxMembers}
									onChange={(e) =>
										setNewMaxMembers(e.target.value)
									}
									placeholder='e.g., 4'
								/>
								<p className='text-xs text-muted-foreground'>
									The maximum number of people who can use
									this subscription
								</p>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='companyName'>
									Company/Team Name (optional)
								</Label>
								<Input
									id='companyName'
									value={newCompanyName}
									onChange={(e) =>
										setNewCompanyName(e.target.value)
									}
									placeholder='e.g., ISCE Digital Concepts'
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								variant='outline'
								onClick={() => setSettingsDialogOpen(false)}
								disabled={isSaving}
							>
								Cancel
							</Button>
							<Button
								onClick={handleSaveSettings}
								disabled={isSaving}
							>
								{isSaving && (
									<Loader2 className='h-4 w-4 mr-2 animate-spin' />
								)}
								Save Settings
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{/* Context Card */}
			<div className='bg-muted/50 rounded-lg p-4 flex flex-wrap items-center gap-4'>
				<div className='flex items-center gap-2'>
					<Building2 className='h-4 w-4 text-muted-foreground' />
					<span className='font-medium'>{spaceName}</span>
				</div>
				<Badge variant='outline'>{userName}</Badge>
				{companyName && (
					<Badge variant='secondary'>{companyName}</Badge>
				)}
				<Badge>
					Max {maxMembers} member{maxMembers > 1 ? 's' : ''}
				</Badge>
			</div>

			{/* Show setup card if maxMembers is 1 */}
			{maxMembers === 1 ? (
				<Card>
					<CardHeader>
						<CardTitle>Enable Team Membership</CardTitle>
						<CardDescription>
							This subscription currently only allows 1 member.
							Enable team membership to allow multiple people to
							share this subscription.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button onClick={() => setSettingsDialogOpen(true)}>
							<Settings className='h-4 w-4 mr-2' />
							Configure Team Settings
						</Button>
					</CardContent>
				</Card>
			) : (
				/* Team Management Component */
				<TeamManagement
					membershipId={membershipId}
					membershipNumber={membershipNumber}
					companyName={companyName}
					maxMembers={maxMembers}
					isAdmin={true}
				/>
			)}
		</div>
	);
}
