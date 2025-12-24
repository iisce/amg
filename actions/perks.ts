'use server';

import { prisma } from '@/lib/db';
import { getCurrentUser, getCurrentAdmin } from './auth';
import type { PerkPeriod } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import {
	startOfDay,
	startOfWeek,
	startOfMonth,
	endOfDay,
	endOfWeek,
	endOfMonth,
} from 'date-fns';

// Transaction client type
type TransactionClient = Omit<
	typeof prisma,
	'$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

// ============================================
// PLAN PERKS (Admin Management)
// ============================================

interface CreatePerkInput {
	pricingPlanId: string;
	name: string;
	description?: string;
	includedSpaceId?: string;
	durationMinutes: number;
	limitPerPeriod: number;
	periodType: PerkPeriod;
	isUnlimited: boolean;
}

export async function createPlanPerk(input: CreatePerkInput) {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, message: 'Unauthorized' };
		}

		const perk = await prisma.planPerk.create({
			data: {
				pricingPlanId: input.pricingPlanId,
				name: input.name,
				description: input.description,
				includedSpaceId: input.includedSpaceId || null,
				durationMinutes: input.durationMinutes,
				limitPerPeriod: input.limitPerPeriod,
				periodType: input.periodType,
				isUnlimited: input.isUnlimited,
			},
			include: {
				includedSpace: {
					select: { id: true, name: true, slug: true, images: true },
				},
			},
		});

		revalidatePath('/admin/spaces');
		return {
			success: true,
			message: 'Perk created successfully',
			data: perk,
		};
	} catch (error) {
		console.error('Error creating plan perk:', error);
		return { success: false, message: 'Failed to create perk' };
	}
}

export async function updatePlanPerk(
	perkId: string,
	input: Partial<CreatePerkInput>
) {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, message: 'Unauthorized' };
		}

		const perk = await prisma.planPerk.update({
			where: { id: perkId },
			data: {
				name: input.name,
				description: input.description,
				includedSpaceId: input.includedSpaceId,
				durationMinutes: input.durationMinutes,
				limitPerPeriod: input.limitPerPeriod,
				periodType: input.periodType,
				isUnlimited: input.isUnlimited,
			},
			include: {
				includedSpace: {
					select: { id: true, name: true, slug: true, images: true },
				},
			},
		});

		revalidatePath('/admin/spaces');
		return {
			success: true,
			message: 'Perk updated successfully',
			data: perk,
		};
	} catch (error) {
		console.error('Error updating plan perk:', error);
		return { success: false, message: 'Failed to update perk' };
	}
}

export async function deletePlanPerk(perkId: string) {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, message: 'Unauthorized' };
		}

		await prisma.planPerk.delete({
			where: { id: perkId },
		});

		revalidatePath('/admin/spaces');
		return { success: true, message: 'Perk deleted successfully' };
	} catch (error) {
		console.error('Error deleting plan perk:', error);
		return { success: false, message: 'Failed to delete perk' };
	}
}

export async function getPlanPerks(pricingPlanId: string) {
	try {
		const perks = await prisma.planPerk.findMany({
			where: { pricingPlanId, isActive: true },
			include: {
				includedSpace: {
					select: { id: true, name: true, slug: true, images: true },
				},
			},
			orderBy: { sortOrder: 'asc' },
		});

		return { success: true, data: perks };
	} catch (error) {
		console.error('Error fetching plan perks:', error);
		return { success: false, message: 'Failed to fetch perks', data: [] };
	}
}

// ============================================
// PERK USAGE (For Members)
// ============================================

/**
 * Get the date range for a perk period
 */
function getPeriodDateRange(
	periodType: PerkPeriod,
	membershipStartDate: Date,
	membershipEndDate: Date
): { start: Date; end: Date } {
	const now = new Date();

	switch (periodType) {
		case 'DAILY':
			return { start: startOfDay(now), end: endOfDay(now) };
		case 'WEEKLY':
			return { start: startOfWeek(now), end: endOfWeek(now) };
		case 'MONTHLY':
			return { start: startOfMonth(now), end: endOfMonth(now) };
		case 'SUBSCRIPTION_PERIOD':
			return { start: membershipStartDate, end: membershipEndDate };
		default:
			return { start: startOfMonth(now), end: endOfMonth(now) };
	}
}

/**
 * Get perk usage for a member's subscription
 */
export async function getMemberPerkUsage(membershipId: string) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return { success: false, message: 'Unauthorized', data: [] };
		}

		// Get the membership with its plan and perks
		const membership = await prisma.membership.findUnique({
			where: { id: membershipId },
			include: {
				pricingPlan: {
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
						},
					},
				},
			},
		});

		if (!membership || membership.userId !== user.id) {
			return {
				success: false,
				message: 'Membership not found',
				data: [],
			};
		}

		// Calculate usage for each perk
		const perkAllocations = await Promise.all(
			membership.pricingPlan.perks.map(async (perk) => {
				const { start, end } = getPeriodDateRange(
					perk.periodType,
					membership.startDate,
					membership.endDate
				);

				// Count usage in current period
				const usageCount = await prisma.perkUsage.count({
					where: {
						perkId: perk.id,
						membershipId: membershipId,
						usedAt: {
							gte: start,
							lte: end,
						},
					},
				});

				return {
					perkId: perk.id,
					perkName: perk.name,
					spaceName: perk.includedSpace?.name || null,
					spaceId: perk.includedSpaceId,
					totalAllowed: perk.limitPerPeriod,
					usedThisPeriod: usageCount,
					remaining: perk.isUnlimited
						? Infinity
						: Math.max(0, perk.limitPerPeriod - usageCount),
					periodType: perk.periodType,
					isUnlimited: perk.isUnlimited,
					durationMinutes: perk.durationMinutes,
				};
			})
		);

		return { success: true, data: perkAllocations };
	} catch (error) {
		console.error('Error fetching perk usage:', error);
		return {
			success: false,
			message: 'Failed to fetch perk usage',
			data: [],
		};
	}
}

/**
 * Use a perk (create a booking using perk allocation)
 */
export async function usePerk(input: {
	perkId: string;
	membershipId: string;
	bookingDate: Date;
	startTime: Date;
	endTime: Date;
	notes?: string;
}) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return { success: false, message: 'Unauthorized' };
		}

		// Get perk and membership details
		const [perk, membership] = await Promise.all([
			prisma.planPerk.findUnique({
				where: { id: input.perkId },
				include: { includedSpace: true },
			}),
			prisma.membership.findUnique({
				where: { id: input.membershipId },
			}),
		]);

		if (!perk || !membership) {
			return { success: false, message: 'Perk or membership not found' };
		}

		if (membership.userId !== user.id) {
			return { success: false, message: 'Unauthorized' };
		}

		if (membership.status !== 'ACTIVE') {
			return { success: false, message: 'Membership is not active' };
		}

		if (!perk.includedSpaceId || !perk.includedSpace) {
			return {
				success: false,
				message: 'This perk does not include space access',
			};
		}

		// Check if user has remaining allocation
		if (!perk.isUnlimited) {
			const { start, end } = getPeriodDateRange(
				perk.periodType,
				membership.startDate,
				membership.endDate
			);

			const usageCount = await prisma.perkUsage.count({
				where: {
					perkId: perk.id,
					membershipId: input.membershipId,
					usedAt: {
						gte: start,
						lte: end,
					},
				},
			});

			if (usageCount >= perk.limitPerPeriod) {
				return {
					success: false,
					message: `You have used all your ${
						perk.name
					} allocation for this ${perk.periodType.toLowerCase()}`,
				};
			}
		}

		// Calculate duration
		const durationMs = input.endTime.getTime() - input.startTime.getTime();
		const durationMinutes = Math.ceil(durationMs / (1000 * 60));

		// Check if requested duration exceeds allowed
		if (durationMinutes > perk.durationMinutes) {
			return {
				success: false,
				message: `Maximum allowed duration is ${perk.durationMinutes} minutes. You requested ${durationMinutes} minutes.`,
			};
		}

		// Get a pricing plan for the space (for booking reference)
		const spacePlan = await prisma.pricingPlan.findFirst({
			where: { spaceId: perk.includedSpaceId, isActive: true },
		});

		if (!spacePlan) {
			return {
				success: false,
				message: 'No pricing plan found for this space',
			};
		}

		// Create booking and perk usage in a transaction
		const result = await prisma.$transaction(
			async (tx: TransactionClient) => {
				// Generate booking number
				const bookingCount = await tx.booking.count();
				const bookingNumber = `AMG-BK-${String(
					bookingCount + 1
				).padStart(6, '0')}`;

				// Generate QR code
				const qrCode = `AMG-QR-${Date.now()}-${Math.random()
					.toString(36)
					.substring(2, 9)}`;

				// Create the booking (free - from perk)
				const booking = await tx.booking.create({
					data: {
						bookingNumber,
						userId: user.id,
						spaceId: perk.includedSpaceId!,
						pricingPlanId: spacePlan.id,
						bookingDate: input.bookingDate,
						startTime: input.startTime,
						endTime: input.endTime,
						attendees: 1,
						totalAmount: 0, // Free because it's from a perk
						status: 'CONFIRMED',
						paymentStatus: 'PAID', // Covered by subscription
						qrCode,
						notes: input.notes
							? `${input.notes}\n[Booked using ${perk.name} perk]`
							: `[Booked using ${perk.name} perk]`,
					},
				});

				// Record perk usage
				const usage = await tx.perkUsage.create({
					data: {
						perkId: perk.id,
						membershipId: input.membershipId,
						bookingId: booking.id,
						durationUsed: durationMinutes,
						notes: `Used for booking ${bookingNumber}`,
					},
				});

				return { booking, usage };
			}
		);

		revalidatePath('/dashboard/bookings');
		revalidatePath('/dashboard/subscriptions');

		return {
			success: true,
			message: 'Booking created using your subscription perk',
			data: result.booking,
		};
	} catch (error) {
		console.error('Error using perk:', error);
		return { success: false, message: 'Failed to use perk' };
	}
}

// ============================================
// ADD-ONS (Admin Management)
// ============================================

interface CreateAddonInput {
	name: string;
	description?: string;
	spaceId?: string;
	price: number; // In kobo
	durationMinutes: number;
	availableForAllPlans: boolean;
	availablePlanIds?: string[];
}

export async function createAddon(input: CreateAddonInput) {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, message: 'Unauthorized' };
		}

		const addon = await prisma.addon.create({
			data: {
				name: input.name,
				description: input.description,
				spaceId: input.spaceId || null,
				price: input.price,
				durationMinutes: input.durationMinutes,
				availableForAllPlans: input.availableForAllPlans,
				availablePlans: input.availablePlanIds?.length
					? {
							connect: input.availablePlanIds.map((id) => ({
								id,
							})),
					  }
					: undefined,
			},
			include: {
				space: {
					select: { id: true, name: true, slug: true, images: true },
				},
				availablePlans: {
					select: { id: true, name: true },
				},
			},
		});

		revalidatePath('/admin/addons');
		return {
			success: true,
			message: 'Add-on created successfully',
			data: addon,
		};
	} catch (error) {
		console.error('Error creating addon:', error);
		return { success: false, message: 'Failed to create add-on' };
	}
}

export async function updateAddon(
	addonId: string,
	input: Partial<CreateAddonInput>
) {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, message: 'Unauthorized' };
		}

		const addon = await prisma.addon.update({
			where: { id: addonId },
			data: {
				name: input.name,
				description: input.description,
				spaceId: input.spaceId,
				price: input.price,
				durationMinutes: input.durationMinutes,
				availableForAllPlans: input.availableForAllPlans,
				availablePlans: input.availablePlanIds
					? {
							set: input.availablePlanIds.map((id) => ({ id })),
					  }
					: undefined,
			},
			include: {
				space: {
					select: { id: true, name: true, slug: true, images: true },
				},
				availablePlans: {
					select: { id: true, name: true },
				},
			},
		});

		revalidatePath('/admin/addons');
		return {
			success: true,
			message: 'Add-on updated successfully',
			data: addon,
		};
	} catch (error) {
		console.error('Error updating addon:', error);
		return { success: false, message: 'Failed to update add-on' };
	}
}

export async function deleteAddon(addonId: string) {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, message: 'Unauthorized' };
		}

		// Soft delete by deactivating
		await prisma.addon.update({
			where: { id: addonId },
			data: { isActive: false },
		});

		revalidatePath('/admin/addons');
		return { success: true, message: 'Add-on deleted successfully' };
	} catch (error) {
		console.error('Error deleting addon:', error);
		return { success: false, message: 'Failed to delete add-on' };
	}
}

export async function getAddons(options?: {
	includeInactive?: boolean;
	pricingPlanId?: string;
}) {
	try {
		const addons = await prisma.addon.findMany({
			where: {
				isActive: options?.includeInactive ? undefined : true,
				OR: options?.pricingPlanId
					? [
							{ availableForAllPlans: true },
							{
								availablePlans: {
									some: { id: options.pricingPlanId },
								},
							},
					  ]
					: undefined,
			},
			include: {
				space: {
					select: { id: true, name: true, slug: true, images: true },
				},
				availablePlans: {
					select: { id: true, name: true },
				},
			},
			orderBy: { sortOrder: 'asc' },
		});

		return { success: true, data: addons };
	} catch (error) {
		console.error('Error fetching addons:', error);
		return { success: false, message: 'Failed to fetch add-ons', data: [] };
	}
}

// ============================================
// ADDON PURCHASES (For Members)
// ============================================

export async function purchaseAddon(input: {
	addonId: string;
	membershipId: string;
	quantity: number;
}) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return { success: false, message: 'Unauthorized' };
		}

		// Verify membership belongs to user
		const membership = await prisma.membership.findUnique({
			where: { id: input.membershipId },
		});

		if (!membership || membership.userId !== user.id) {
			return { success: false, message: 'Membership not found' };
		}

		if (membership.status !== 'ACTIVE') {
			return { success: false, message: 'Membership is not active' };
		}

		// Get addon
		const addon = await prisma.addon.findUnique({
			where: { id: input.addonId },
		});

		if (!addon || !addon.isActive) {
			return { success: false, message: 'Add-on not found or inactive' };
		}

		const totalAmount = addon.price * input.quantity;

		// Create addon purchase (pending payment)
		const purchase = await prisma.addonPurchase.create({
			data: {
				addonId: input.addonId,
				membershipId: input.membershipId,
				quantity: input.quantity,
				unitPrice: addon.price,
				totalAmount,
				status: 'PENDING',
				expiresAt: membership.endDate, // Expires with the subscription
			},
			include: {
				addon: {
					include: {
						space: {
							select: {
								id: true,
								name: true,
								slug: true,
								images: true,
							},
						},
					},
				},
			},
		});

		return {
			success: true,
			message: 'Add-on purchase created. Please complete payment.',
			data: purchase,
		};
	} catch (error) {
		console.error('Error purchasing addon:', error);
		return { success: false, message: 'Failed to purchase add-on' };
	}
}

export async function getMemberAddonPurchases(membershipId: string) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return { success: false, message: 'Unauthorized', data: [] };
		}

		// Verify membership
		const membership = await prisma.membership.findUnique({
			where: { id: membershipId },
		});

		if (!membership || membership.userId !== user.id) {
			return {
				success: false,
				message: 'Membership not found',
				data: [],
			};
		}

		const purchases = await prisma.addonPurchase.findMany({
			where: {
				membershipId,
				status: { in: ['ACTIVE', 'PENDING'] },
			},
			include: {
				addon: {
					include: {
						space: {
							select: {
								id: true,
								name: true,
								slug: true,
								images: true,
							},
						},
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		});

		return { success: true, data: purchases };
	} catch (error) {
		console.error('Error fetching addon purchases:', error);
		return {
			success: false,
			message: 'Failed to fetch purchases',
			data: [],
		};
	}
}

/**
 * Use an addon to create a booking
 */
export async function useAddon(input: {
	addonPurchaseId: string;
	bookingDate: Date;
	startTime: Date;
	endTime: Date;
	notes?: string;
}) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return { success: false, message: 'Unauthorized' };
		}

		// Get purchase with addon details
		const purchase = await prisma.addonPurchase.findUnique({
			where: { id: input.addonPurchaseId },
			include: {
				addon: {
					include: { space: true },
				},
				membership: true,
			},
		});

		if (!purchase) {
			return { success: false, message: 'Purchase not found' };
		}

		if (purchase.membership.userId !== user.id) {
			return { success: false, message: 'Unauthorized' };
		}

		if (purchase.status !== 'ACTIVE') {
			return { success: false, message: 'This add-on is not active' };
		}

		if (purchase.usedQuantity >= purchase.quantity) {
			return {
				success: false,
				message: 'All add-on uses have been consumed',
			};
		}

		if (!purchase.addon.spaceId || !purchase.addon.space) {
			return {
				success: false,
				message: 'This add-on does not include space access',
			};
		}

		// Get a pricing plan for the space
		const spacePlan = await prisma.pricingPlan.findFirst({
			where: { spaceId: purchase.addon.spaceId, isActive: true },
		});

		if (!spacePlan) {
			return {
				success: false,
				message: 'No pricing plan found for this space',
			};
		}

		// Create booking and update purchase in transaction
		const result = await prisma.$transaction(
			async (tx: TransactionClient) => {
				// Generate booking number
				const bookingCount = await tx.booking.count();
				const bookingNumber = `AMG-BK-${String(
					bookingCount + 1
				).padStart(6, '0')}`;

				// Generate QR code
				const qrCode = `AMG-QR-${Date.now()}-${Math.random()
					.toString(36)
					.substring(2, 9)}`;

				// Create the booking
				const booking = await tx.booking.create({
					data: {
						bookingNumber,
						userId: user.id,
						spaceId: purchase.addon.spaceId!,
						pricingPlanId: spacePlan.id,
						bookingDate: input.bookingDate,
						startTime: input.startTime,
						endTime: input.endTime,
						attendees: 1,
						totalAmount: 0, // Already paid via addon
						status: 'CONFIRMED',
						paymentStatus: 'PAID',
						qrCode,
						notes: input.notes
							? `${input.notes}\n[Booked using ${purchase.addon.name} add-on]`
							: `[Booked using ${purchase.addon.name} add-on]`,
					},
				});

				// Update addon purchase usage
				const updatedPurchase = await tx.addonPurchase.update({
					where: { id: input.addonPurchaseId },
					data: {
						usedQuantity: { increment: 1 },
						bookingId: booking.id,
						status:
							purchase.usedQuantity + 1 >= purchase.quantity
								? 'USED'
								: 'ACTIVE',
					},
				});

				return { booking, purchase: updatedPurchase };
			}
		);

		revalidatePath('/dashboard/bookings');
		revalidatePath('/dashboard/subscriptions');

		return {
			success: true,
			message: 'Booking created using your add-on',
			data: result.booking,
		};
	} catch (error) {
		console.error('Error using addon:', error);
		return { success: false, message: 'Failed to use add-on' };
	}
}
