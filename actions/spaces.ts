'use server';

import { prisma } from '@/lib/db';
import type {
	Space,
	PricingPlan,
	SpaceCategory,
	SpaceType,
	PlanType,
} from '@prisma/client';
import { revalidatePath } from 'next/cache';

// ============================================
// TYPES
// ============================================

export interface SpaceWithPricing extends Space {
	pricingPlans: PricingPlan[];
	timeSlots?: Array<{
		id: string;
		startTime: string;
		endTime: string;
		isActive: boolean;
	}>;
}

export interface SpaceResult {
	success: boolean;
	message: string;
	data?: SpaceWithPricing | SpaceWithPricing[];
	error?: string;
}

export interface CreateSpaceInput {
	name: string;
	slug: string;
	description: string;
	fullDescription?: string;
	capacity: number;
	amenities: string[];
	features: string[];
	images: string[];
	category: SpaceCategory;
	type: SpaceType;
	isActive?: boolean;
	sortOrder?: number;
}

export interface CreatePricingPlanInput {
	spaceId: string;
	name: string;
	description?: string;
	price: number; // in kobo
	duration?: number;
	unit: string;
	type: PlanType;
	sortOrder?: number;
}

// ============================================
// READ ACTIONS
// ============================================

export async function getSpaces(options?: {
	category?: SpaceCategory;
	type?: SpaceType;
	activeOnly?: boolean;
}): Promise<SpaceResult> {
	try {
		const { category, type, activeOnly = true } = options || {};

		const spaces = await prisma.space.findMany({
			where: {
				...(activeOnly && { isActive: true }),
				...(category && { category }),
				...(type && { type }),
			},
			include: {
				pricingPlans: {
					where: { isActive: true },
					orderBy: { sortOrder: 'asc' },
				},
			},
			orderBy: { sortOrder: 'asc' },
		});

		return {
			success: true,
			message: 'Spaces fetched successfully',
			data: spaces,
		};
	} catch (error) {
		console.error('Get spaces error:', error);
		return {
			success: false,
			message: 'Failed to fetch spaces',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getSpaceBySlug(slug: string): Promise<SpaceResult> {
	try {
		const space = await prisma.space.findUnique({
			where: { slug },
			include: {
				pricingPlans: {
					where: { isActive: true },
					orderBy: { sortOrder: 'asc' },
					include: {
						perks: {
							where: { isActive: true },
							include: {
								includedSpace: {
									select: {
										id: true,
										name: true,
										slug: true,
										images: true,
									},
								},
							},
							orderBy: { sortOrder: 'asc' },
						},
					},
				},
				timeSlots: {
					where: { isActive: true },
				},
			},
		});

		if (!space) {
			return {
				success: false,
				message: 'Space not found',
			};
		}

		return {
			success: true,
			message: 'Space fetched successfully',
			data: space as SpaceWithPricing,
		};
	} catch (error) {
		console.error('Get space by slug error:', error);
		return {
			success: false,
			message: 'Failed to fetch space',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getSpaceById(id: string): Promise<SpaceResult> {
	try {
		const space = await prisma.space.findUnique({
			where: { id },
			include: {
				pricingPlans: {
					orderBy: { sortOrder: 'asc' },
					include: {
						perks: {
							where: { isActive: true },
							include: {
								includedSpace: {
									select: {
										id: true,
										name: true,
										slug: true,
										images: true,
									},
								},
							},
							orderBy: { sortOrder: 'asc' },
						},
					},
				},
				timeSlots: true,
			},
		});

		if (!space) {
			return {
				success: false,
				message: 'Space not found',
			};
		}

		return {
			success: true,
			message: 'Space fetched successfully',
			data: space as SpaceWithPricing,
		};
	} catch (error) {
		console.error('Get space by id error:', error);
		return {
			success: false,
			message: 'Failed to fetch space',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function getSubscriptionSpaces(): Promise<SpaceResult> {
	return getSpaces({ type: 'SUBSCRIPTION' });
}

export async function getBookingSpaces(): Promise<SpaceResult> {
	return getSpaces({ type: 'BOOKING' });
}

// ============================================
// ADMIN ACTIONS
// ============================================

export async function createSpace(
	input: CreateSpaceInput
): Promise<SpaceResult> {
	try {
		// Check if slug is unique
		const existingSpace = await prisma.space.findUnique({
			where: { slug: input.slug },
		});

		if (existingSpace) {
			return {
				success: false,
				message: 'A space with this slug already exists',
			};
		}

		const space = await prisma.space.create({
			data: {
				...input,
				sortOrder: input.sortOrder || 0,
			},
			include: {
				pricingPlans: true,
			},
		});

		await prisma.activityLog.create({
			data: {
				action: 'space.created',
				entityType: 'Space',
				entityId: space.id,
				metadata: { name: space.name },
			},
		});

		revalidatePath('/spaces');
		revalidatePath('/admin/spaces');

		return {
			success: true,
			message: 'Space created successfully',
			data: space as SpaceWithPricing,
		};
	} catch (error) {
		console.error('Create space error:', error);
		return {
			success: false,
			message: 'Failed to create space',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function updateSpace(
	id: string,
	input: Partial<CreateSpaceInput>
): Promise<SpaceResult> {
	try {
		// Check if slug is unique (if being updated)
		if (input.slug) {
			const existingSpace = await prisma.space.findFirst({
				where: {
					slug: input.slug,
					NOT: { id },
				},
			});

			if (existingSpace) {
				return {
					success: false,
					message: 'A space with this slug already exists',
				};
			}
		}

		const space = await prisma.space.update({
			where: { id },
			data: input,
			include: {
				pricingPlans: true,
			},
		});

		await prisma.activityLog.create({
			data: {
				action: 'space.updated',
				entityType: 'Space',
				entityId: space.id,
				metadata: { name: space.name },
			},
		});

		revalidatePath('/spaces');
		revalidatePath(`/spaces/${space.slug}`);
		revalidatePath('/admin/spaces');

		return {
			success: true,
			message: 'Space updated successfully',
			data: space as SpaceWithPricing,
		};
	} catch (error) {
		console.error('Update space error:', error);
		return {
			success: false,
			message: 'Failed to update space',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function deleteSpace(id: string): Promise<SpaceResult> {
	try {
		// Check for existing bookings
		const bookingsCount = await prisma.booking.count({
			where: { spaceId: id },
		});

		if (bookingsCount > 0) {
			return {
				success: false,
				message:
					'Cannot delete space with existing bookings. Deactivate it instead.',
			};
		}

		const space = await prisma.space.delete({
			where: { id },
			include: { pricingPlans: true },
		});

		await prisma.activityLog.create({
			data: {
				action: 'space.deleted',
				entityType: 'Space',
				entityId: id,
				metadata: { name: space.name },
			},
		});

		revalidatePath('/spaces');
		revalidatePath('/admin/spaces');

		return {
			success: true,
			message: 'Space deleted successfully',
		};
	} catch (error) {
		console.error('Delete space error:', error);
		return {
			success: false,
			message: 'Failed to delete space',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function toggleSpaceActive(id: string): Promise<SpaceResult> {
	try {
		const space = await prisma.space.findUnique({ where: { id } });

		if (!space) {
			return {
				success: false,
				message: 'Space not found',
			};
		}

		const updatedSpace = await prisma.space.update({
			where: { id },
			data: { isActive: !space.isActive },
			include: { pricingPlans: true },
		});

		await prisma.activityLog.create({
			data: {
				action: updatedSpace.isActive
					? 'space.activated'
					: 'space.deactivated',
				entityType: 'Space',
				entityId: id,
				metadata: { name: updatedSpace.name },
			},
		});

		revalidatePath('/spaces');
		revalidatePath('/admin/spaces');

		return {
			success: true,
			message: `Space ${
				updatedSpace.isActive ? 'activated' : 'deactivated'
			} successfully`,
			data: updatedSpace as SpaceWithPricing,
		};
	} catch (error) {
		console.error('Toggle space active error:', error);
		return {
			success: false,
			message: 'Failed to update space',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// ============================================
// PRICING PLAN ACTIONS
// ============================================

export async function createPricingPlan(
	input: CreatePricingPlanInput
): Promise<{
	success: boolean;
	message: string;
	data?: PricingPlan;
	error?: string;
}> {
	try {
		const plan = await prisma.pricingPlan.create({
			data: {
				...input,
				sortOrder: input.sortOrder || 0,
			},
		});

		await prisma.activityLog.create({
			data: {
				action: 'pricing_plan.created',
				entityType: 'PricingPlan',
				entityId: plan.id,
				metadata: { name: plan.name, spaceId: plan.spaceId },
			},
		});

		revalidatePath('/spaces');
		revalidatePath('/admin/spaces');

		return {
			success: true,
			message: 'Pricing plan created successfully',
			data: plan,
		};
	} catch (error) {
		console.error('Create pricing plan error:', error);
		return {
			success: false,
			message: 'Failed to create pricing plan',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function updatePricingPlan(
	id: string,
	input: Partial<CreatePricingPlanInput>
): Promise<{
	success: boolean;
	message: string;
	data?: PricingPlan;
	error?: string;
}> {
	try {
		const plan = await prisma.pricingPlan.update({
			where: { id },
			data: input,
		});

		await prisma.activityLog.create({
			data: {
				action: 'pricing_plan.updated',
				entityType: 'PricingPlan',
				entityId: plan.id,
				metadata: { name: plan.name },
			},
		});

		revalidatePath('/spaces');
		revalidatePath('/admin/spaces');

		return {
			success: true,
			message: 'Pricing plan updated successfully',
			data: plan,
		};
	} catch (error) {
		console.error('Update pricing plan error:', error);
		return {
			success: false,
			message: 'Failed to update pricing plan',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function deletePricingPlan(
	id: string
): Promise<{ success: boolean; message: string; error?: string }> {
	try {
		// Check for existing bookings
		const bookingsCount = await prisma.booking.count({
			where: { pricingPlanId: id },
		});

		if (bookingsCount > 0) {
			return {
				success: false,
				message:
					'Cannot delete pricing plan with existing bookings. Deactivate it instead.',
			};
		}

		await prisma.pricingPlan.delete({
			where: { id },
		});

		await prisma.activityLog.create({
			data: {
				action: 'pricing_plan.deleted',
				entityType: 'PricingPlan',
				entityId: id,
			},
		});

		revalidatePath('/spaces');
		revalidatePath('/admin/spaces');

		return {
			success: true,
			message: 'Pricing plan deleted successfully',
		};
	} catch (error) {
		console.error('Delete pricing plan error:', error);
		return {
			success: false,
			message: 'Failed to delete pricing plan',
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}
