'use server';

import { prisma } from '@/lib/db';
import { getCurrentAdmin } from './auth';
import { revalidatePath } from 'next/cache';
import type { Prisma, InventoryTransactionType } from '@prisma/client';

// ============================================
// TYPES
// ============================================

export type InventoryCategoryWithItems = Prisma.InventoryCategoryGetPayload<{
	include: { items: true };
}>;

export type InventoryItemWithCategory = Prisma.InventoryItemGetPayload<{
	include: { category: true };
}>;

export type InventoryItemWithRelations = Prisma.InventoryItemGetPayload<{
	include: {
		category: true;
		transactions: {
			orderBy: { createdAt: 'desc' };
			take: 10;
		};
	};
}>;

export type InventoryTransactionWithItem =
	Prisma.InventoryTransactionGetPayload<{
		include: { inventoryItem: true };
	}>;

// ============================================
// INVENTORY CATEGORIES
// ============================================

export async function getInventoryCategories(options?: {
	includeItems?: boolean;
	activeOnly?: boolean;
}) {
	try {
		const categories = await prisma.inventoryCategory.findMany({
			where: options?.activeOnly ? { isActive: true } : undefined,
			include: options?.includeItems ? { items: true } : undefined,
			orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
		});

		return { success: true, data: categories };
	} catch (error) {
		console.error('Error fetching inventory categories:', error);
		return { success: false, error: 'Failed to fetch categories' };
	}
}

export async function createInventoryCategory(data: {
	name: string;
	description?: string;
	sortOrder?: number;
}) {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, error: 'Unauthorized' };
		}

		const existing = await prisma.inventoryCategory.findUnique({
			where: { name: data.name },
		});

		if (existing) {
			return {
				success: false,
				error: 'Category with this name already exists',
			};
		}

		const category = await prisma.inventoryCategory.create({
			data: {
				name: data.name,
				description: data.description,
				sortOrder: data.sortOrder ?? 0,
			},
		});

		revalidatePath('/admin/inventory');
		return { success: true, data: category };
	} catch (error) {
		console.error('Error creating inventory category:', error);
		return { success: false, error: 'Failed to create category' };
	}
}

export async function updateInventoryCategory(
	id: string,
	data: {
		name?: string;
		description?: string;
		sortOrder?: number;
		isActive?: boolean;
	}
) {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, error: 'Unauthorized' };
		}

		if (data.name) {
			const existing = await prisma.inventoryCategory.findFirst({
				where: { name: data.name, NOT: { id } },
			});
			if (existing) {
				return {
					success: false,
					error: 'Category with this name already exists',
				};
			}
		}

		const category = await prisma.inventoryCategory.update({
			where: { id },
			data,
		});

		revalidatePath('/admin/inventory');
		return { success: true, data: category };
	} catch (error) {
		console.error('Error updating inventory category:', error);
		return { success: false, error: 'Failed to update category' };
	}
}

export async function deleteInventoryCategory(id: string) {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, error: 'Unauthorized' };
		}

		// Check if category has items
		const itemCount = await prisma.inventoryItem.count({
			where: { categoryId: id },
		});

		if (itemCount > 0) {
			return {
				success: false,
				error: `Cannot delete category with ${itemCount} items. Move or delete items first.`,
			};
		}

		await prisma.inventoryCategory.delete({ where: { id } });

		revalidatePath('/admin/inventory');
		return { success: true };
	} catch (error) {
		console.error('Error deleting inventory category:', error);
		return { success: false, error: 'Failed to delete category' };
	}
}

// ============================================
// INVENTORY ITEMS
// ============================================

export async function getInventoryItems(options?: {
	categoryId?: string;
	activeOnly?: boolean;
	lowStockOnly?: boolean;
	showInShopOnly?: boolean;
	search?: string;
}) {
	try {
		const where: Prisma.InventoryItemWhereInput = {};

		if (options?.categoryId) {
			where.categoryId = options.categoryId;
		}

		if (options?.activeOnly) {
			where.isActive = true;
		}

		if (options?.showInShopOnly) {
			where.showInShop = true;
		}

		if (options?.lowStockOnly) {
			where.currentStock = {
				lte: prisma.inventoryItem.fields.reorderLevel,
			};
		}

		if (options?.search) {
			where.OR = [
				{ name: { contains: options.search, mode: 'insensitive' } },
				{ sku: { contains: options.search, mode: 'insensitive' } },
				{
					description: {
						contains: options.search,
						mode: 'insensitive',
					},
				},
			];
		}

		const items = await prisma.inventoryItem.findMany({
			where,
			include: { category: true },
			orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
		});

		return { success: true, data: items };
	} catch (error) {
		console.error('Error fetching inventory items:', error);
		return { success: false, error: 'Failed to fetch items' };
	}
}

export async function getInventoryItemById(id: string) {
	try {
		const item = await prisma.inventoryItem.findUnique({
			where: { id },
			include: {
				category: true,
				transactions: {
					orderBy: { createdAt: 'desc' },
					take: 20,
				},
				shopItemComponents: {
					include: { shopItem: true },
				},
				shopItem: true,
			},
		});

		if (!item) {
			return { success: false, error: 'Item not found' };
		}

		return { success: true, data: item };
	} catch (error) {
		console.error('Error fetching inventory item:', error);
		return { success: false, error: 'Failed to fetch item' };
	}
}

function generateSKU(categoryName: string, itemName: string): string {
	const categoryCode = categoryName.substring(0, 3).toUpperCase();
	const itemCode = itemName.substring(0, 3).toUpperCase();
	const random = Math.random().toString(36).substring(2, 6).toUpperCase();
	return `INV-${categoryCode}-${itemCode}-${random}`;
}

export async function createInventoryItem(data: {
	categoryId: string;
	name: string;
	description?: string;
	baseUnit: string;
	packageUnit?: string;
	unitsPerPackage?: number;
	currentStock?: number;
	reorderLevel?: number;
	optimalStock?: number;
	costPerUnit?: number;
	showInShop?: boolean;
}) {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, error: 'Unauthorized' };
		}

		// Get category for SKU generation
		const category = await prisma.inventoryCategory.findUnique({
			where: { id: data.categoryId },
		});

		if (!category) {
			return { success: false, error: 'Category not found' };
		}

		const sku = generateSKU(category.name, data.name);

		const item = await prisma.inventoryItem.create({
			data: {
				categoryId: data.categoryId,
				name: data.name,
				sku,
				description: data.description,
				baseUnit: data.baseUnit,
				packageUnit: data.packageUnit,
				unitsPerPackage: data.unitsPerPackage ?? 1,
				currentStock: data.currentStock ?? 0,
				reorderLevel: data.reorderLevel ?? 10,
				optimalStock: data.optimalStock ?? 100,
				costPerUnit: data.costPerUnit ?? 0,
				showInShop: data.showInShop ?? false,
			},
			include: { category: true },
		});

		// If initial stock was set, create a transaction
		if (data.currentStock && data.currentStock > 0) {
			await prisma.inventoryTransaction.create({
				data: {
					inventoryItemId: item.id,
					type: 'RESTOCK',
					quantity: data.currentStock,
					previousStock: 0,
					newStock: data.currentStock,
					notes: 'Initial stock',
					performedBy: admin.id,
				},
			});
		}

		revalidatePath('/admin/inventory');
		return { success: true, data: item };
	} catch (error) {
		console.error('Error creating inventory item:', error);
		return { success: false, error: 'Failed to create item' };
	}
}

export async function updateInventoryItem(
	id: string,
	data: {
		categoryId?: string;
		name?: string;
		description?: string;
		baseUnit?: string;
		packageUnit?: string;
		unitsPerPackage?: number;
		reorderLevel?: number;
		optimalStock?: number;
		costPerUnit?: number;
		showInShop?: boolean;
		isActive?: boolean;
	}
) {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, error: 'Unauthorized' };
		}

		const item = await prisma.inventoryItem.update({
			where: { id },
			data,
			include: { category: true },
		});

		revalidatePath('/admin/inventory');
		return { success: true, data: item };
	} catch (error) {
		console.error('Error updating inventory item:', error);
		return { success: false, error: 'Failed to update item' };
	}
}

export async function deleteInventoryItem(id: string) {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, error: 'Unauthorized' };
		}

		// Check if item is used in shop components
		const componentCount = await prisma.shopItemComponent.count({
			where: { inventoryItemId: id },
		});

		if (componentCount > 0) {
			return {
				success: false,
				error: `Cannot delete item used in ${componentCount} shop products. Remove from shop items first.`,
			};
		}

		// Delete related shop item if exists
		await prisma.shopItem.deleteMany({ where: { inventoryItemId: id } });

		// Delete transactions
		await prisma.inventoryTransaction.deleteMany({
			where: { inventoryItemId: id },
		});

		// Delete item
		await prisma.inventoryItem.delete({ where: { id } });

		revalidatePath('/admin/inventory');
		return { success: true };
	} catch (error) {
		console.error('Error deleting inventory item:', error);
		return { success: false, error: 'Failed to delete item' };
	}
}

// ============================================
// STOCK MANAGEMENT
// ============================================

export async function adjustStock(
	itemId: string,
	data: {
		quantity: number; // Positive to add, negative to remove (in base units)
		type: InventoryTransactionType;
		notes?: string;
		referenceType?: string;
		referenceId?: string;
		costPerUnit?: number;
	}
) {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, error: 'Unauthorized' };
		}

		const item = await prisma.inventoryItem.findUnique({
			where: { id: itemId },
		});

		if (!item) {
			return { success: false, error: 'Item not found' };
		}

		const previousStock = item.currentStock;
		const newStock = previousStock + data.quantity;

		if (newStock < 0) {
			return {
				success: false,
				error: `Insufficient stock. Current: ${previousStock}, Requested: ${Math.abs(
					data.quantity
				)}`,
			};
		}

		// Update stock and create transaction
		const [updatedItem, transaction] = await prisma.$transaction([
			prisma.inventoryItem.update({
				where: { id: itemId },
				data: { currentStock: newStock },
				include: { category: true },
			}),
			prisma.inventoryTransaction.create({
				data: {
					inventoryItemId: itemId,
					type: data.type,
					quantity: data.quantity,
					previousStock,
					newStock,
					notes: data.notes,
					referenceType: data.referenceType,
					referenceId: data.referenceId,
					performedBy: admin.id,
					costPerUnit: data.costPerUnit,
					totalCost: data.costPerUnit
						? data.costPerUnit * Math.abs(data.quantity)
						: undefined,
				},
			}),
		]);

		revalidatePath('/admin/inventory');
		return { success: true, data: { item: updatedItem, transaction } };
	} catch (error) {
		console.error('Error adjusting stock:', error);
		return { success: false, error: 'Failed to adjust stock' };
	}
}

export async function restockItem(
	itemId: string,
	data: {
		packages: number; // Number of packages being added
		costPerPackage?: number; // Cost per package in kobo
		notes?: string;
	}
) {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, error: 'Unauthorized' };
		}

		const item = await prisma.inventoryItem.findUnique({
			where: { id: itemId },
		});

		if (!item) {
			return { success: false, error: 'Item not found' };
		}

		const unitsToAdd = data.packages * item.unitsPerPackage;
		const costPerUnit = data.costPerPackage
			? Math.round(data.costPerPackage / item.unitsPerPackage)
			: undefined;

		return adjustStock(itemId, {
			quantity: unitsToAdd,
			type: 'RESTOCK',
			notes:
				data.notes ||
				`Restocked ${data.packages} ${item.packageUnit || 'packages'}`,
			costPerUnit,
		});
	} catch (error) {
		console.error('Error restocking item:', error);
		return { success: false, error: 'Failed to restock item' };
	}
}

// ============================================
// INVENTORY TRANSACTIONS
// ============================================

export async function getInventoryTransactions(options?: {
	itemId?: string;
	type?: InventoryTransactionType;
	fromDate?: Date;
	toDate?: Date;
	limit?: number;
}) {
	try {
		const where: Prisma.InventoryTransactionWhereInput = {};

		if (options?.itemId) {
			where.inventoryItemId = options.itemId;
		}

		if (options?.type) {
			where.type = options.type;
		}

		if (options?.fromDate || options?.toDate) {
			where.createdAt = {};
			if (options.fromDate) where.createdAt.gte = options.fromDate;
			if (options.toDate) where.createdAt.lte = options.toDate;
		}

		const transactions = await prisma.inventoryTransaction.findMany({
			where,
			include: { inventoryItem: true },
			orderBy: { createdAt: 'desc' },
			take: options?.limit ?? 100,
		});

		return { success: true, data: transactions };
	} catch (error) {
		console.error('Error fetching transactions:', error);
		return { success: false, error: 'Failed to fetch transactions' };
	}
}

// ============================================
// LOW STOCK ALERTS
// ============================================

export async function getLowStockItems() {
	try {
		// Using raw query to compare fields
		const items = await prisma.$queryRaw<InventoryItemWithCategory[]>`
			SELECT i.*, row_to_json(c.*) as category
			FROM "InventoryItem" i
			JOIN "InventoryCategory" c ON i."categoryId" = c.id
			WHERE i."currentStock" <= i."reorderLevel"
			AND i."isActive" = true
			ORDER BY (i."currentStock"::float / NULLIF(i."reorderLevel", 0)) ASC
		`;

		return { success: true, data: items };
	} catch (error) {
		console.error('Error fetching low stock items:', error);

		// Fallback to regular query
		const items = await prisma.inventoryItem.findMany({
			where: { isActive: true },
			include: { category: true },
		});

		const lowStock = items.filter(
			(item) => item.currentStock <= item.reorderLevel
		);
		return { success: true, data: lowStock };
	}
}

// ============================================
// INVENTORY STATS
// ============================================

export async function getInventoryStats() {
	try {
		const [totalItems, totalCategories, lowStockCount, totalValue] =
			await Promise.all([
				prisma.inventoryItem.count({ where: { isActive: true } }),
				prisma.inventoryCategory.count({ where: { isActive: true } }),
				prisma.inventoryItem.count({
					where: {
						isActive: true,
						// This is a simplified check - ideally compare fields
					},
				}),
				prisma.inventoryItem.aggregate({
					_sum: {
						currentStock: true,
					},
					where: { isActive: true },
				}),
			]);

		// Get actual low stock count
		const items = await prisma.inventoryItem.findMany({
			where: { isActive: true },
			select: {
				currentStock: true,
				reorderLevel: true,
				costPerUnit: true,
			},
		});

		const lowStock = items.filter(
			(i) => i.currentStock <= i.reorderLevel
		).length;
		const inventoryValue = items.reduce(
			(sum, item) => sum + item.currentStock * item.costPerUnit,
			0
		);

		return {
			success: true,
			data: {
				totalItems,
				totalCategories,
				lowStockCount: lowStock,
				totalInventoryValue: inventoryValue,
			},
		};
	} catch (error) {
		console.error('Error fetching inventory stats:', error);
		return { success: false, error: 'Failed to fetch stats' };
	}
}
