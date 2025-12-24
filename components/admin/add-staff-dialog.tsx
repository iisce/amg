'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { createStaff } from '@/actions';
import { toast } from 'sonner';
import type { UserRole } from '@prisma/client';
import { getAssignableRoles, getRoleDisplayName } from '@/lib/permissions';

// All staff roles that can be created
const STAFF_ROLES = [
	'FRONT_DESK_ASSISTANT',
	'FRONT_DESK',
	'STAFF',
	'ADMIN',
	'SUPER_ADMIN',
] as const;

type StaffRole = (typeof STAFF_ROLES)[number];

const staffFormSchema = z
	.object({
		name: z.string().min(2, 'Name must be at least 2 characters'),
		email: z.string().email('Invalid email address'),
		password: z.string().min(8, 'Password must be at least 8 characters'),
		confirmPassword: z.string(),
		phone: z.string().optional(),
		role: z.enum(STAFF_ROLES),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword'],
	});

type StaffFormData = z.infer<typeof staffFormSchema>;

// Role descriptions for the form
const ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
	FRONT_DESK_ASSISTANT: 'Basic check-in/out operations only',
	FRONT_DESK: 'Reception operations, payments, bookings',
	STAFF: 'Extended operations, reports, user management',
	ADMIN: 'Full management except system settings',
	SUPER_ADMIN: 'Complete access including system settings',
};

interface AddStaffDialogProps {
	currentUserRole: UserRole;
}

export function AddStaffDialog({ currentUserRole }: AddStaffDialogProps) {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	// Get roles that the current user can assign
	const assignableRoles = getAssignableRoles(currentUserRole).filter(
		(role) => role !== 'CLIENT'
	) as StaffRole[];

	// Default to the lowest assignable role
	const defaultRole = assignableRoles[0] || 'STAFF';

	const form = useForm<StaffFormData>({
		resolver: zodResolver(staffFormSchema),
		defaultValues: {
			name: '',
			email: '',
			password: '',
			confirmPassword: '',
			phone: '',
			role: defaultRole,
		},
	});

	async function onSubmit(data: StaffFormData) {
		setIsLoading(true);
		try {
			const result = await createStaff({
				name: data.name,
				email: data.email,
				password: data.password,
				phone: data.phone,
				role: data.role,
			});

			if (result.success) {
				toast.success(
					result.message || 'Staff member created successfully'
				);
				setOpen(false);
				form.reset();
			} else {
				toast.error(result.error || 'Failed to create staff member');
			}
		} catch (error) {
			toast.error('An unexpected error occurred');
			console.error('Create staff error:', error);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={setOpen}
		>
			<DialogTrigger asChild>
				<Button>
					<UserPlus className='mr-2 h-4 w-4' />
					Add Staff
				</Button>
			</DialogTrigger>
			<DialogContent className='max-w-md'>
				<DialogHeader>
					<DialogTitle>Add New Staff Member</DialogTitle>
					<DialogDescription>
						Create a new admin or staff account for AMG Workspace.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className='space-y-4'
					>
						<FormField
							control={form.control}
							name='name'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Full Name</FormLabel>
									<FormControl>
										<Input
											placeholder='John Doe'
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='email'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											type='email'
											placeholder='john@amgworkspace.com'
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='phone'
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Phone Number (Optional)
									</FormLabel>
									<FormControl>
										<Input
											type='tel'
											placeholder='+234 801 234 5678'
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='role'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Role</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder='Select a role' />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{assignableRoles.map((role) => (
												<SelectItem
													key={role}
													value={role}
												>
													{getRoleDisplayName(role)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormDescription>
										{ROLE_DESCRIPTIONS[
											field.value as StaffRole
										] || 'Select a role to see description'}
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='password'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<Input
											type='password'
											placeholder='••••••••'
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='confirmPassword'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Confirm Password</FormLabel>
									<FormControl>
										<Input
											type='password'
											placeholder='••••••••'
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button
								type='button'
								variant='outline'
								onClick={() => setOpen(false)}
								disabled={isLoading}
							>
								Cancel
							</Button>
							<Button
								type='submit'
								disabled={isLoading}
							>
								{isLoading && (
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
								)}
								Create Staff
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
