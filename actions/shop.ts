'use server';

import { prisma } from '@/lib/db';
import { getCurrentAdmin, getCurrentUser } from './auth';
import { revalidatePath } from 'next/cache';
import type {
	Prisma,
	ShopOrderStatus,
	PaymentStatus,
	PaymentMethod,
} from '@prisma/client';

// ============================================
// TYPES
// ============================================

export type ShopCategoryWithItems = Prisma.ShopCategoryGetPayload<{
	include: { items: true };
}>;

export type ShopItemWithCategory = Prisma.ShopItemGetPayload<{
	include: { category: true };
}>;

export type ShopItemWithRelations = Prisma.ShopItemGetPayload<{
	include: {
		category: true;
		components: {
			include: { inventoryItem: true };
		};
		inventoryItem: true;
	};
}>;

export type ShopOrderWithItems = Prisma.ShopOrderGetPayload<{
	include: {
		items: {
			include: { shopItem: true };
		};
	};
}>;

// ============================================
// SHOP CATEGORIES
// ============================================

export async function getShopCategories(options?: {
	includeItems?: boolean;
	activeOnly?: boolean;
}) {
	try {
		const categories = await prisma.shopCategory.findMany({
			where: options?.activeOnly ? { isActive: true } : undefined,
			include: options?.includeItems
				? {
						items: {
							where: { isActive: true },
							orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
						},
				  }
				: undefined,
			orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
		});

		return { success: true, data: categories };
	} catch (error) {
		console.error('Error fetching shop categories:', error);
		return { success: false, error: 'Failed to fetch categories' };
	}
}

export async function createShopCategory(data: {
	name: string;
	description?: string;
	image?: string;
	sortOrder?: number;
}) {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, error: 'Unauthorized' };
		}

		const existing = await prisma.shopCategory.findUnique({
			where: { name: data.name },
		});

		if (existing) {
			return {
				success: false,
				error: 'Category with this name already exists',
			};
		}

		const category = await prisma.shopCategory.create({
			data: {
				name: data.name,
				description: data.description,
				image: data.image,
				sortOrder: data.sortOrder ?? 0,
			},
		});

		revalidatePath('/admin/shop');
		revalidatePath('/shop');
		return { success: true, data: category };
	} catch (error) {
		console.error('Error creating shop category:', error);
		return { success: false, error: 'Failed to create category' };
	}
}

export async function updateShopCategory(
	id: string,
	data: {
		name?: string;
		description?: string;
		image?: string;
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
			const existing = await prisma.shopCategory.findFirst({
				where: { name: data.name, NOT: { id } },
			});
			if (existing) {
				return {
					success: false,
					error: 'Category with this name already exists',
				};
			}
		}

		const category = await prisma.shopCategory.update({
			where: { id },
			data,
		});

		revalidatePath('/admin/shop');
		revalidatePath('/shop');
		return { success: true, data: category };
	} catch (error) {
		console.error('Error updating shop category:', error);
		return { success: false, error: 'Failed to update category' };
	}
}

export async function deleteShopCategory(id: string) {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, error: 'Unauthorized' };
		}

		const itemCount = await prisma.shopItem.count({
			where: { categoryId: id },
		});

		if (itemCount > 0) {
			return {
				success: false,
				error: `Cannot delete category with ${itemCount} items. Move or delete items first.`,
			};
		}

		await prisma.shopCategory.delete({ where: { id } });

		revalidatePath('/admin/shop');
		revalidatePath('/shop');
		return { success: true };
	} catch (error) {
		console.error('Error deleting shop category:', error);
		return { success: false, error: 'Failed to delete category' };
	}
}

// ============================================
// SHOP ITEMS
// ============================================

export async function getShopItems(options?: {
	categoryId?: string;
	activeOnly?: boolean;
	availableOnly?: boolean;
	search?: string;
	includeInventoryItems?: boolean; // Also include inventory items with showInShop=true
}) {
	try {
		const where: Prisma.ShopItemWhereInput = {};

		if (options?.categoryId) {
			where.categoryId = options.categoryId;
		}

		if (options?.activeOnly) {
			where.isActive = true;
		}

		if (options?.availableOnly) {
			where.isAvailable = true;
		}

		if (options?.search) {
			where.OR = [
				{ name: { contains: options.search, mode: 'insensitive' } },
				{
					description: {
						contains: options.search,
						mode: 'insensitive',
					},
				},
			];
		}

		const shopItems = await prisma.shopItem.findMany({
			where,
			include: {
				category: true,
				components: {
					include: { inventoryItem: true },
				},
				inventoryItem: true,
			},
			orderBy: [
				{ category: { sortOrder: 'asc' } },
				{ sortOrder: 'asc' },
				{ name: 'asc' },
			],
		});

		// Also include inventory items with showInShop=true that don't have a linked ShopItem
		// These are direct sale items from inventory
		const linkedInventoryItemIds = shopItems
			.filter((item) => item.inventoryItemId)
			.map((item) => item.inventoryItemId as string);

		const inventoryItemsForShop = await prisma.inventoryItem.findMany({
			where: {
				showInShop: true,
				isActive: true,
				id: { notIn: linkedInventoryItemIds },
				...(options?.availableOnly ? { currentStock: { gt: 0 } } : {}),
				...(options?.search
					? {
							OR: [
								{
									name: {
										contains: options.search,
										mode: 'insensitive',
									},
								},
								{
									description: {
										contains: options.search,
										mode: 'insensitive',
									},
								},
							],
					  }
					: {}),
			},
			include: { category: true },
			orderBy: [{ name: 'asc' }],
		});

		// Convert inventory items to ShopItem-like structure
		// Use a virtual structure that the shop client can handle
		const inventoryAsShopItems = inventoryItemsForShop.map((invItem) => ({
			id: `inv_${invItem.id}`, // Prefix to distinguish from real shop items
			categoryId: invItem.categoryId,
			name: invItem.name,
			description: invItem.description,
			image: null as string | null,
			price: invItem.costPerUnit, // Use cost as price (admin should set proper shop price)
			isComposite: false,
			inventoryItemId: invItem.id,
			preparationTime: null as number | null,
			isActive: true,
			isAvailable: invItem.currentStock > 0,
			sortOrder: 999, // Put inventory items at the end
			createdAt: invItem.createdAt,
			updatedAt: invItem.updatedAt,
			// Relations - use inventoryCategory as a proxy for shop category
			category: {
				id: `inv_cat_${invItem.category.id}`,
				name: invItem.category.name,
				description: invItem.category.description,
				image: null,
				isActive: true,
				sortOrder: 999,
				createdAt: invItem.category.createdAt,
				updatedAt: invItem.category.updatedAt,
			},
			components: [],
			inventoryItem: invItem,
			// Mark as inventory-sourced for special handling
			_isFromInventory: true,
			_inventoryStock: invItem.currentStock,
			_inventoryUnit: invItem.baseUnit,
		}));

		// Combine both lists
		const allItems = [...shopItems, ...inventoryAsShopItems];

		return { success: true, data: allItems };
	} catch (error) {
		console.error('Error fetching shop items:', error);
		return { success: false, error: 'Failed to fetch items' };
	}
}

export async function getShopItemById(id: string) {
	try {
		const item = await prisma.shopItem.findUnique({
			where: { id },
			include: {
				category: true,
				components: {
					include: { inventoryItem: { include: { category: true } } },
				},
				inventoryItem: { include: { category: true } },
			},
		});

		if (!item) {
			return { success: false, error: 'Item not found' };
		}

		return { success: true, data: item };
	} catch (error) {
		console.error('Error fetching shop item:', error);
		return { success: false, error: 'Failed to fetch item' };
	}
}

export async function createShopItem(data: {
	categoryId: string;
	name: string;
	description?: string;
	image?: string;
	price: number;
	isComposite: boolean;
	inventoryItemId?: string;
	preparationTime?: number;
	components?: { inventoryItemId: string; quantity: number }[];
}) {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, error: 'Unauthorized' };
		}

		// Validate based on type
		if (data.isComposite) {
			if (!data.components || data.components.length === 0) {
				return {
					success: false,
					error: 'Composite items must have at least one component',
				};
			}
		} else {
			if (!data.inventoryItemId) {
				return {
					success: false,
					error: 'Standalone items must be linked to an inventory item',
				};
			}
			// Check if inventory item is already linked
			const existing = await prisma.shopItem.findUnique({
				where: { inventoryItemId: data.inventoryItemId },
			});
			if (existing) {
				return {
					success: false,
					error: 'This inventory item is already linked to a shop item',
				};
			}
		}

		// Check component availability for composite items
		let isAvailable = true;
		if (data.isComposite && data.components) {
			for (const comp of data.components) {
				const invItem = await prisma.inventoryItem.findUnique({
					where: { id: comp.inventoryItemId },
				});
				if (!invItem || invItem.currentStock < comp.quantity) {
					isAvailable = false;
					break;
				}
			}
		} else if (data.inventoryItemId) {
			const invItem = await prisma.inventoryItem.findUnique({
				where: { id: data.inventoryItemId },
			});
			isAvailable = invItem ? invItem.currentStock > 0 : false;
		}

		const item = await prisma.shopItem.create({
			data: {
				categoryId: data.categoryId,
				name: data.name,
				description: data.description,
				image: data.image,
				price: data.price,
				isComposite: data.isComposite,
				inventoryItemId: data.isComposite
					? undefined
					: data.inventoryItemId,
				preparationTime: data.isComposite
					? data.preparationTime
					: undefined,
				isAvailable,
				components: data.isComposite
					? {
							create: data.components?.map((c) => ({
								inventoryItemId: c.inventoryItemId,
								quantity: c.quantity,
							})),
					  }
					: undefined,
			},
			include: {
				category: true,
				components: { include: { inventoryItem: true } },
				inventoryItem: true,
			},
		});

		revalidatePath('/admin/shop');
		revalidatePath('/shop');
		return { success: true, data: item };
	} catch (error) {
		console.error('Error creating shop item:', error);
		return { success: false, error: 'Failed to create item' };
	}
}

export async function updateShopItem(
	id: string,
	data: {
		categoryId?: string;
		name?: string;
		description?: string;
		image?: string;
		price?: number;
		preparationTime?: number;
		sortOrder?: number;
		isActive?: boolean;
	}
) {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, error: 'Unauthorized' };
		}

		const item = await prisma.shopItem.update({
			where: { id },
			data,
			include: {
				category: true,
				components: { include: { inventoryItem: true } },
				inventoryItem: true,
			},
		});

		revalidatePath('/admin/shop');
		revalidatePath('/shop');
		return { success: true, data: item };
	} catch (error) {
		console.error('Error updating shop item:', error);
		return { success: false, error: 'Failed to update item' };
	}
}

export async function updateShopItemComponents(
	itemId: string,
	components: { inventoryItemId: string; quantity: number }[]
) {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, error: 'Unauthorized' };
		}

		const item = await prisma.shopItem.findUnique({
			where: { id: itemId },
		});
		if (!item || !item.isComposite) {
			return {
				success: false,
				error: 'Item not found or is not a composite item',
			};
		}

		// Delete existing components and create new ones
		await prisma.$transaction([
			prisma.shopItemComponent.deleteMany({
				where: { shopItemId: itemId },
			}),
			...components.map((c) =>
				prisma.shopItemComponent.create({
					data: {
						shopItemId: itemId,
						inventoryItemId: c.inventoryItemId,
						quantity: c.quantity,
					},
				})
			),
		]);

		// Update availability
		await updateShopItemAvailability(itemId);

		revalidatePath('/admin/shop');
		revalidatePath('/shop');
		return { success: true };
	} catch (error) {
		console.error('Error updating shop item components:', error);
		return { success: false, error: 'Failed to update components' };
	}
}

export async function deleteShopItem(id: string) {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, error: 'Unauthorized' };
		}

		// Check if item has orders
		const orderCount = await prisma.shopOrderItem.count({
			where: { shopItemId: id },
		});

		if (orderCount > 0) {
			// Soft delete - just deactivate
			await prisma.shopItem.update({
				where: { id },
				data: { isActive: false },
			});
		} else {
			// Hard delete
			await prisma.shopItemComponent.deleteMany({
				where: { shopItemId: id },
			});
			await prisma.shopItem.delete({ where: { id } });
		}

		revalidatePath('/admin/shop');
		revalidatePath('/shop');
		return { success: true };
	} catch (error) {
		console.error('Error deleting shop item:', error);
		return { success: false, error: 'Failed to delete item' };
	}
}

// ============================================
// AVAILABILITY CHECK
// ============================================

export async function updateShopItemAvailability(itemId: string) {
	const item = await prisma.shopItem.findUnique({
		where: { id: itemId },
		include: {
			components: { include: { inventoryItem: true } },
			inventoryItem: true,
		},
	});

	if (!item) return;

	let isAvailable = true;

	if (item.isComposite) {
		// Check all components have enough stock
		for (const comp of item.components) {
			if (comp.inventoryItem.currentStock < comp.quantity) {
				isAvailable = false;
				break;
			}
		}
	} else if (item.inventoryItem) {
		isAvailable = item.inventoryItem.currentStock > 0;
	}

	await prisma.shopItem.update({
		where: { id: itemId },
		data: { isAvailable },
	});
}

export async function updateAllShopItemsAvailability() {
	const items = await prisma.shopItem.findMany({
		where: { isActive: true },
		include: {
			components: { include: { inventoryItem: true } },
			inventoryItem: true,
		},
	});

	for (const item of items) {
		let isAvailable = true;

		if (item.isComposite) {
			for (const comp of item.components) {
				if (comp.inventoryItem.currentStock < comp.quantity) {
					isAvailable = false;
					break;
				}
			}
		} else if (item.inventoryItem) {
			isAvailable = item.inventoryItem.currentStock > 0;
		}

		if (item.isAvailable !== isAvailable) {
			await prisma.shopItem.update({
				where: { id: item.id },
				data: { isAvailable },
			});
		}
	}

	revalidatePath('/shop');
}

// ============================================
// SHOP ORDERS
// ============================================

function generateOrderNumber(): string {
	const timestamp = Date.now().toString(36).toUpperCase();
	const random = Math.random().toString(36).substring(2, 6).toUpperCase();
	return `AMG-SHP-${timestamp}${random}`;
}

export async function createShopOrder(data: {
	items: { shopItemId: string; quantity: number; notes?: string }[];
	customerName?: string;
	customerEmail?: string;
	customerPhone?: string;
}) {
	try {
		const user = await getCurrentUser();

		if (data.items.length === 0) {
			return {
				success: false,
				error: 'Order must have at least one item',
			};
		}

		// Calculate totals and validate availability
		let subtotal = 0;
		let maxPrepTime = 0;
		const orderItems: {
			shopItemId: string;
			quantity: number;
			unitPrice: number;
			totalPrice: number;
			notes?: string;
		}[] = [];

		// Track inventory items that need stock deduction (for direct inventory sales)
		const inventoryDeductions: { id: string; quantity: number }[] = [];

		for (const item of data.items) {
			// Check if this is an inventory-sourced item (prefixed with inv_)
			const isInventoryItem = item.shopItemId.startsWith('inv_');
			const actualId = isInventoryItem
				? item.shopItemId.slice(4) // Remove 'inv_' prefix
				: item.shopItemId;

			if (isInventoryItem) {
				// Handle direct inventory item sale
				const invItem = await prisma.inventoryItem.findUnique({
					where: { id: actualId },
				});

				if (!invItem || !invItem.isActive || !invItem.showInShop) {
					return {
						success: false,
						error: `Item not available: ${item.shopItemId}`,
					};
				}

				if (invItem.currentStock < item.quantity) {
					return {
						success: false,
						error: `Insufficient stock for ${invItem.name}. Only ${invItem.currentStock} available.`,
					};
				}

				// For inventory items, we need to create a temporary ShopItem or handle differently
				// For now, we'll create an ad-hoc shop item for this inventory item
				let shopItem = await prisma.shopItem.findUnique({
					where: { inventoryItemId: actualId },
				});

				if (!shopItem) {
					// Find or create a default category for inventory items
					let defaultCategory = await prisma.shopCategory.findFirst({
						where: { name: 'Inventory Items' },
					});

					if (!defaultCategory) {
						defaultCategory = await prisma.shopCategory.create({
							data: {
								name: 'Inventory Items',
								description:
									'Items sold directly from inventory',
								sortOrder: 999,
							},
						});
					}

					// Create a shop item linked to this inventory item
					shopItem = await prisma.shopItem.create({
						data: {
							categoryId: defaultCategory.id,
							name: invItem.name,
							description: invItem.description,
							price: invItem.costPerUnit, // Use cost as price
							isComposite: false,
							inventoryItemId: actualId,
							isActive: true,
							isAvailable: true,
						},
					});
				}

				const totalPrice = shopItem.price * item.quantity;
				subtotal += totalPrice;

				orderItems.push({
					shopItemId: shopItem.id,
					quantity: item.quantity,
					unitPrice: shopItem.price,
					totalPrice,
					notes: item.notes,
				});

				inventoryDeductions.push({
					id: actualId,
					quantity: item.quantity,
				});
			} else {
				// Handle regular shop item
				const shopItem = await prisma.shopItem.findUnique({
					where: { id: actualId },
					include: {
						components: { include: { inventoryItem: true } },
						inventoryItem: true,
					},
				});

				if (!shopItem || !shopItem.isActive) {
					return {
						success: false,
						error: `Item not found: ${item.shopItemId}`,
					};
				}

				// Check availability for the requested quantity
				if (shopItem.isComposite) {
					for (const comp of shopItem.components) {
						const needed = comp.quantity * item.quantity;
						if (comp.inventoryItem.currentStock < needed) {
							return {
								success: false,
								error: `Insufficient stock for ${
									shopItem.name
								}. Only ${Math.floor(
									comp.inventoryItem.currentStock /
										comp.quantity
								)} available.`,
							};
						}
					}
					if (shopItem.preparationTime) {
						maxPrepTime = Math.max(
							maxPrepTime,
							shopItem.preparationTime
						);
					}
				} else if (shopItem.inventoryItem) {
					if (shopItem.inventoryItem.currentStock < item.quantity) {
						return {
							success: false,
							error: `Insufficient stock for ${shopItem.name}. Only ${shopItem.inventoryItem.currentStock} available.`,
						};
					}
				}

				const totalPrice = shopItem.price * item.quantity;
				subtotal += totalPrice;

				orderItems.push({
					shopItemId: shopItem.id,
					quantity: item.quantity,
					unitPrice: shopItem.price,
					totalPrice,
					notes: item.notes,
				});
			}
		}

		const estimatedReadyAt =
			maxPrepTime > 0 ? new Date(Date.now() + maxPrepTime * 60000) : null;

		// Create order
		const order = await prisma.shopOrder.create({
			data: {
				orderNumber: generateOrderNumber(),
				userId: user?.id,
				customerName: data.customerName || user?.name,
				customerEmail: data.customerEmail || user?.email,
				customerPhone: data.customerPhone || user?.phone,
				subtotal,
				totalAmount: subtotal, // Add tax logic here if needed
				estimatedReadyAt,
				items: {
					create: orderItems,
				},
			},
			include: {
				items: { include: { shopItem: true } },
			},
		});

		revalidatePath('/admin/shop/orders');
		return { success: true, data: order };
	} catch (error) {
		console.error('Error creating shop order:', error);
		return { success: false, error: 'Failed to create order' };
	}
}

export async function getShopOrders(options?: {
	status?: ShopOrderStatus;
	paymentStatus?: PaymentStatus;
	userId?: string;
	fromDate?: Date;
	toDate?: Date;
	limit?: number;
}) {
	try {
		const where: Prisma.ShopOrderWhereInput = {};

		if (options?.status) {
			where.status = options.status;
		}

		if (options?.paymentStatus) {
			where.paymentStatus = options.paymentStatus;
		}

		if (options?.userId) {
			where.userId = options.userId;
		}

		if (options?.fromDate || options?.toDate) {
			where.createdAt = {};
			if (options.fromDate) where.createdAt.gte = options.fromDate;
			if (options.toDate) where.createdAt.lte = options.toDate;
		}

		const orders = await prisma.shopOrder.findMany({
			where,
			include: {
				items: { include: { shopItem: true } },
			},
			orderBy: { createdAt: 'desc' },
			take: options?.limit ?? 100,
		});

		return { success: true, data: orders };
	} catch (error) {
		console.error('Error fetching shop orders:', error);
		return { success: false, error: 'Failed to fetch orders' };
	}
}

// Get orders for the currently logged in user
export async function getUserShopOrders() {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return { success: false, error: 'Not authenticated' };
		}

		const orders = await prisma.shopOrder.findMany({
			where: { userId: user.id },
			include: {
				items: { include: { shopItem: true } },
			},
			orderBy: { createdAt: 'desc' },
		});

		return { success: true, data: orders };
	} catch (error) {
		console.error('Error fetching user shop orders:', error);
		return { success: false, error: 'Failed to fetch your orders' };
	}
}

export async function getShopOrderById(id: string) {
	try {
		const order = await prisma.shopOrder.findUnique({
			where: { id },
			include: {
				items: {
					include: {
						shopItem: {
							include: {
								components: {
									include: { inventoryItem: true },
								},
							},
						},
					},
				},
			},
		});

		if (!order) {
			return { success: false, error: 'Order not found' };
		}

		return { success: true, data: order };
	} catch (error) {
		console.error('Error fetching shop order:', error);
		return { success: false, error: 'Failed to fetch order' };
	}
}

export async function getShopOrderByNumber(orderNumber: string) {
	try {
		const order = await prisma.shopOrder.findUnique({
			where: { orderNumber },
			include: {
				items: { include: { shopItem: true } },
			},
		});

		if (!order) {
			return { success: false, error: 'Order not found' };
		}

		return { success: true, data: order };
	} catch (error) {
		console.error('Error fetching shop order:', error);
		return { success: false, error: 'Failed to fetch order' };
	}
}

// ============================================
// PAYMENT & ORDER STATUS UPDATES
// ============================================

export async function confirmShopOrderPayment(
	orderId: string,
	data: {
		paymentRef: string;
		paymentMethod: PaymentMethod;
	}
) {
	try {
		const order = await prisma.shopOrder.findUnique({
			where: { id: orderId },
			include: {
				items: {
					include: {
						shopItem: {
							include: {
								components: {
									include: { inventoryItem: true },
								},
								inventoryItem: true,
							},
						},
					},
				},
			},
		});

		if (!order) {
			return { success: false, error: 'Order not found' };
		}

		if (order.paymentStatus === 'PAID') {
			return { success: false, error: 'Order already paid' };
		}

		// Deduct inventory for all items
		const inventoryUpdates: Promise<unknown>[] = [];
		const transactions: Promise<unknown>[] = [];

		for (const orderItem of order.items) {
			const shopItem = orderItem.shopItem;

			if (shopItem.isComposite) {
				// Deduct each component
				for (const comp of shopItem.components) {
					const deductQuantity = comp.quantity * orderItem.quantity;

					inventoryUpdates.push(
						prisma.inventoryItem.update({
							where: { id: comp.inventoryItemId },
							data: {
								currentStock: { decrement: deductQuantity },
							},
						})
					);

					transactions.push(
						prisma.inventoryTransaction.create({
							data: {
								inventoryItemId: comp.inventoryItemId,
								type: 'SALE',
								quantity: -deductQuantity,
								previousStock: comp.inventoryItem.currentStock,
								newStock:
									comp.inventoryItem.currentStock -
									deductQuantity,
								referenceType: 'SHOP_ORDER',
								referenceId: orderId,
								notes: `Sold: ${orderItem.quantity}x ${shopItem.name}`,
							},
						})
					);
				}
			} else if (shopItem.inventoryItem) {
				// Deduct direct inventory item
				inventoryUpdates.push(
					prisma.inventoryItem.update({
						where: { id: shopItem.inventoryItemId! },
						data: {
							currentStock: { decrement: orderItem.quantity },
						},
					})
				);

				transactions.push(
					prisma.inventoryTransaction.create({
						data: {
							inventoryItemId: shopItem.inventoryItemId!,
							type: 'SALE',
							quantity: -orderItem.quantity,
							previousStock: shopItem.inventoryItem.currentStock,
							newStock:
								shopItem.inventoryItem.currentStock -
								orderItem.quantity,
							referenceType: 'SHOP_ORDER',
							referenceId: orderId,
							notes: `Sold: ${orderItem.quantity}x ${shopItem.name}`,
						},
					})
				);
			}
		}

		// Execute all updates
		await prisma.$transaction([
			...inventoryUpdates,
			...transactions,
			prisma.shopOrder.update({
				where: { id: orderId },
				data: {
					paymentStatus: 'PAID',
					paymentRef: data.paymentRef,
					paymentMethod: data.paymentMethod,
					paidAt: new Date(),
					status: 'PAID',
				},
			}),
		] as Prisma.PrismaPromise<unknown>[]);

		// Update shop item availability
		await updateAllShopItemsAvailability();

		revalidatePath('/admin/shop/orders');
		revalidatePath('/shop');
		return { success: true };
	} catch (error) {
		console.error('Error confirming payment:', error);
		return { success: false, error: 'Failed to confirm payment' };
	}
}

export async function updateShopOrderStatus(
	orderId: string,
	status: ShopOrderStatus,
	data?: {
		preparedBy?: string;
		servedBy?: string;
		notes?: string;
	}
) {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, error: 'Unauthorized' };
		}

		const updateData: Prisma.ShopOrderUpdateInput = { status };

		if (status === 'PREPARING') {
			updateData.preparedBy = data?.preparedBy || admin.id;
		} else if (status === 'READY') {
			updateData.preparedAt = new Date();
		} else if (status === 'SERVED') {
			updateData.servedBy = data?.servedBy || admin.id;
			updateData.servedAt = new Date();
		}

		if (data?.notes) {
			updateData.notes = data.notes;
		}

		const order = await prisma.shopOrder.update({
			where: { id: orderId },
			data: updateData,
			include: {
				items: { include: { shopItem: true } },
			},
		});

		revalidatePath('/admin/shop/orders');
		return { success: true, data: order };
	} catch (error) {
		console.error('Error updating order status:', error);
		return { success: false, error: 'Failed to update order status' };
	}
}

export async function cancelShopOrder(orderId: string, reason?: string) {
	try {
		const admin = await getCurrentAdmin();
		if (!admin) {
			return { success: false, error: 'Unauthorized' };
		}

		const order = await prisma.shopOrder.findUnique({
			where: { id: orderId },
		});

		if (!order) {
			return { success: false, error: 'Order not found' };
		}

		// If already paid, we'd need refund logic here
		if (order.paymentStatus === 'PAID') {
			// TODO: Implement refund
			return {
				success: false,
				error: 'Cannot cancel paid order. Process refund instead.',
			};
		}

		await prisma.shopOrder.update({
			where: { id: orderId },
			data: {
				status: 'CANCELLED',
				notes: reason ? `Cancelled: ${reason}` : 'Order cancelled',
			},
		});

		revalidatePath('/admin/shop/orders');
		return { success: true };
	} catch (error) {
		console.error('Error cancelling order:', error);
		return { success: false, error: 'Failed to cancel order' };
	}
}

// ============================================
// FRONT DESK - PENDING ORDERS
// ============================================

export async function getPendingOrders() {
	try {
		const orders = await prisma.shopOrder.findMany({
			where: {
				status: { in: ['PAID', 'PREPARING', 'READY'] },
			},
			include: {
				items: { include: { shopItem: true } },
			},
			orderBy: { createdAt: 'asc' },
		});

		return { success: true, data: orders };
	} catch (error) {
		console.error('Error fetching pending orders:', error);
		return { success: false, error: 'Failed to fetch pending orders' };
	}
}

// ============================================
// SHOP STATS
// ============================================

export async function getShopStats(options?: {
	fromDate?: Date;
	toDate?: Date;
}) {
	try {
		// Get today's date range
		const todayStart = new Date();
		todayStart.setHours(0, 0, 0, 0);
		const todayEnd = new Date();
		todayEnd.setHours(23, 59, 59, 999);

		const [
			totalShopItems,
			totalInventoryShopItems,
			totalCategories,
			pendingOrdersCount,
			todayOrders,
			todayRevenue,
		] = await Promise.all([
			// Count all shop items
			prisma.shopItem.count(),
			// Count inventory items marked for shop
			prisma.inventoryItem.count({
				where: { showInShop: true },
			}),
			// Count all categories
			prisma.shopCategory.count(),
			// Count pending orders (not completed/cancelled)
			prisma.shopOrder.count({
				where: {
					status: { in: ['PENDING', 'PAID', 'PREPARING', 'READY'] },
				},
			}),
			// Count today's orders
			prisma.shopOrder.count({
				where: {
					createdAt: { gte: todayStart, lte: todayEnd },
				},
			}),
			// Sum today's revenue (paid orders only)
			prisma.shopOrder.aggregate({
				_sum: { totalAmount: true },
				where: {
					createdAt: { gte: todayStart, lte: todayEnd },
					paymentStatus: 'PAID',
				},
			}),
		]);

		return {
			success: true,
			data: {
				totalItems: totalShopItems + totalInventoryShopItems,
				totalCategories,
				pendingOrders: pendingOrdersCount,
				todayOrders,
				todayRevenue: todayRevenue._sum.totalAmount || 0,
			},
		};
	} catch (error) {
		console.error('Error fetching shop stats:', error);
		return { success: false, error: 'Failed to fetch stats' };
	}
}

// ============================================
// PAYSTACK INTEGRATION FOR SHOP
// ============================================

export async function initializeShopPayment(orderId: string) {
	try {
		const order = await prisma.shopOrder.findUnique({
			where: { id: orderId },
		});

		if (!order) {
			return { success: false, error: 'Order not found' };
		}

		if (order.paymentStatus === 'PAID') {
			return { success: false, error: 'Order already paid' };
		}

		const email = order.customerEmail || 'guest@amgworkspace.com';

		// Initialize Paystack payment
		const response = await fetch(
			'https://api.paystack.co/transaction/initialize',
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email,
					amount: order.totalAmount,
					reference: order.orderNumber,
					callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/shop/payment/callback?orderId=${orderId}`,
					metadata: {
						orderId,
						orderNumber: order.orderNumber,
						type: 'shop_order',
					},
				}),
			}
		);

		const data = await response.json();

		if (!data.status) {
			return {
				success: false,
				error: data.message || 'Failed to initialize payment',
			};
		}

		return {
			success: true,
			data: {
				authorizationUrl: data.data.authorization_url,
				reference: data.data.reference,
				accessCode: data.data.access_code,
			},
		};
	} catch (error) {
		console.error('Error initializing shop payment:', error);
		return { success: false, error: 'Failed to initialize payment' };
	}
}

export async function verifyShopPayment(reference: string) {
	try {
		const response = await fetch(
			`https://api.paystack.co/transaction/verify/${reference}`,
			{
				headers: {
					Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
				},
			}
		);

		const data = await response.json();

		if (!data.status || data.data.status !== 'success') {
			return { success: false, error: 'Payment verification failed' };
		}

		// Find order by reference (orderNumber)
		const order = await prisma.shopOrder.findUnique({
			where: { orderNumber: reference },
			include: {
				items: {
					include: { shopItem: true },
				},
			},
		});

		if (!order) {
			return { success: false, error: 'Order not found' };
		}

		// If already paid, just return success with order
		if (order.paymentStatus === 'PAID') {
			return { success: true, data: order };
		}

		// Confirm payment
		const result = await confirmShopOrderPayment(order.id, {
			paymentRef: data.data.reference,
			paymentMethod: 'CARD',
		});

		if (!result.success) {
			return result;
		}

		// Refetch the updated order
		const updatedOrder = await prisma.shopOrder.findUnique({
			where: { id: order.id },
			include: {
				items: {
					include: { shopItem: true },
				},
			},
		});

		return { success: true, data: updatedOrder };
	} catch (error) {
		console.error('Error verifying shop payment:', error);
		return { success: false, error: 'Failed to verify payment' };
	}
}
