import type {
	User,
	Space,
	Booking,
	Payment,
	Membership,
	PricingPlan,
	ActivityLog,
	Session,
	UserRole,
	SpaceCategory,
	SpaceType,
	PlanType,
	BookingStatus,
	PaymentStatus,
	PaymentMethod,
	MembershipType,
	MembershipStatus,
	PlanPerk,
	PerkUsage,
	Addon,
	AddonPurchase,
	PerkPeriod,
	AddonPurchaseStatus,
	MembershipCheckIn,
	MembershipMember,
	Tour,
	TourStatus,
	// Inventory & Shop types
	InventoryCategory,
	InventoryItem,
	InventoryTransaction,
	ShopCategory,
	ShopItem,
	ShopItemComponent,
	ShopOrder,
	ShopOrderItem,
	ShopOrderStatus,
} from '@prisma/client';

// Re-export Prisma types for convenience
export type {
	User,
	Space,
	Booking,
	Payment,
	Membership,
	PricingPlan,
	ActivityLog,
	Session,
	UserRole,
	SpaceCategory,
	SpaceType,
	PlanType,
	BookingStatus,
	PaymentStatus,
	PaymentMethod,
	MembershipType,
	MembershipStatus,
	PlanPerk,
	PerkUsage,
	Addon,
	AddonPurchase,
	PerkPeriod,
	AddonPurchaseStatus,
	MembershipCheckIn,
	MembershipMember,
	Tour,
	TourStatus,
	// Inventory & Shop types
	InventoryCategory,
	InventoryItem,
	InventoryTransaction,
	ShopCategory,
	ShopItem,
	ShopItemComponent,
	ShopOrder,
	ShopOrderItem,
	ShopOrderStatus,
};

// API Response types
export interface ApiResponse<T = unknown> {
	success: boolean;
	message: string;
	data?: T;
	error?: string;
}

// Extended types with relations
export interface BookingWithRelations extends Booking {
	user: Pick<User, 'id' | 'name' | 'email' | 'phone'>;
	space: Pick<Space, 'id' | 'name' | 'slug' | 'images'>;
	pricingPlan: Pick<PricingPlan, 'id' | 'name' | 'price' | 'unit'>;
	payment?: Payment | null;
}

export interface SpaceWithPricing extends Space {
	pricingPlans: PricingPlan[];
}

export interface MembershipWithRelations extends Membership {
	user: Pick<User, 'id' | 'name' | 'email' | 'phone'>;
	space: Pick<Space, 'id' | 'name' | 'slug' | 'images'>;
	pricingPlan: Pick<PricingPlan, 'id' | 'name' | 'price' | 'unit'>;
	payments?: Payment[];
	perkUsages?: PerkUsage[];
	addonPurchases?: AddonPurchaseWithAddon[];
	checkIns?: MembershipCheckIn[];
	teamMembers?: { id: string }[];
	_count?: {
		teamMembers?: number;
	};
}

export interface PaymentWithRelations extends Payment {
	user: Pick<User, 'id' | 'name' | 'email'>;
	booking?: {
		id: string;
		bookingNumber: string;
		space: { name: string };
	} | null;
	membership?: {
		id: string;
		membershipNumber: string;
		space: { name: string };
	} | null;
}

export interface UserWithStats extends Omit<User, 'password'> {
	_count?: {
		bookings: number;
		memberships: number;
	};
}

// Plan Perk types
export interface PlanPerkWithSpace extends PlanPerk {
	includedSpace?: Pick<Space, 'id' | 'name' | 'slug' | 'images'> | null;
}

export interface PricingPlanWithPerks extends PricingPlan {
	perks: PlanPerkWithSpace[];
	availableAddons?: Addon[];
}

export interface SpaceWithPricingAndPerks extends Space {
	pricingPlans: PricingPlanWithPerks[];
}

// Addon types
export interface AddonWithSpace extends Addon {
	space?: Pick<Space, 'id' | 'name' | 'slug' | 'images'> | null;
}

export interface AddonPurchaseWithAddon extends AddonPurchase {
	addon: AddonWithSpace;
}

// Perk usage tracking
export interface PerkUsageWithDetails extends PerkUsage {
	perk: PlanPerkWithSpace;
	booking?: Pick<Booking, 'id' | 'bookingNumber' | 'bookingDate'> | null;
}

// Helper to calculate remaining perk allocation
export interface PerkAllocation {
	perkId: string;
	perkName: string;
	spaceName: string | null;
	spaceId: string | null;
	totalAllowed: number; // Per period
	usedThisPeriod: number;
	remaining: number;
	periodType: PerkPeriod;
	isUnlimited: boolean;
	durationMinutes: number;
}

// Form types
export interface LoginFormData {
	email: string;
	password: string;
}

export interface RegisterFormData {
	email: string;
	password: string;
	name: string;
	phone?: string;
	company?: string;
}

export interface BookingFormData {
	spaceId: string;
	pricingPlanId: string;
	bookingDate: Date;
	startTime: Date;
	endTime: Date;
	attendees?: number;
	notes?: string;
	contactName?: string;
	contactEmail?: string;
	contactPhone?: string;
}

export interface SubscriptionFormData {
	spaceId: string;
	pricingPlanId: string;
	type: MembershipType;
	startDate: Date;
	autoRenew?: boolean;
}

export interface ProfileFormData {
	name: string;
	phone?: string;
	company?: string;
}

export interface ChangePasswordFormData {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
}

// Dashboard stats
export interface DashboardStats {
	totalBookings: number;
	activeBookings: number;
	completedBookings: number;
	totalSubscriptions: number;
	activeSubscriptions: number;
	totalSpent: number;
}

export interface AdminDashboardStats {
	totalUsers: number;
	newUsersThisMonth: number;
	totalBookings: number;
	bookingsThisMonth: number;
	totalSubscriptions: number;
	activeSubscriptions: number;
	totalRevenue: number;
	revenueThisMonth: number;
	occupancyRate: number;
	checkedInToday: number;
}

// Inventory types with relations
export interface InventoryItemWithCategory extends InventoryItem {
	category: InventoryCategory;
}

export interface InventoryItemWithTransactions
	extends InventoryItemWithCategory {
	transactions: InventoryTransaction[];
}

// Shop types with relations
export interface ShopItemWithCategory extends ShopItem {
	category: ShopCategory;
}

export interface ShopItemComponentWithInventory extends ShopItemComponent {
	inventoryItem: InventoryItem;
}

export interface ShopItemWithComponents extends ShopItemWithCategory {
	components: ShopItemComponentWithInventory[];
}

export interface ShopOrderItemWithShopItem extends ShopOrderItem {
	shopItem: ShopItem;
}

export interface ShopOrderWithItems extends ShopOrder {
	items: ShopOrderItemWithShopItem[];
}

export interface ShopOrderWithRelations extends ShopOrder {
	items: Array<
		ShopOrderItem & {
			shopItem: ShopItem;
		}
	>;
	user?: Pick<User, 'id' | 'name' | 'email'> | null;
}

// Inventory stats type
export interface InventoryStats {
	totalCategories: number;
	totalItems: number;
	lowStockItems: number;
	outOfStockItems: number;
	totalValue: number;
}

// Shop stats type
export interface ShopStats {
	totalCategories: number;
	totalItems: number;
	availableItems: number;
	pendingOrders: number;
	todayOrders: number;
	todayRevenue: number;
}

// Space data based on AMG pricing
export const AMG_SPACES = [
	{
		name: 'Work Solo',
		slug: 'work-solo',
		description: 'Private workspace perfect for focused individual work',
		capacity: 1,
		amenities: [
			'WiFi',
			'Power Outlets',
			'Air Conditioning',
			'Natural Light',
		],
		category: 'individual',
	},
	{
		name: 'Board Room',
		slug: 'board-room',
		description: '6-seater meeting space for teams and collaborations',
		capacity: 6,
		amenities: [
			'WiFi',
			'Projector',
			'Whiteboard',
			'Air Conditioning',
			'Video Conferencing',
		],
		category: 'meeting',
	},
	{
		name: 'Photo Studio',
		slug: 'photo-studio',
		description: 'Professional studio with lighting and video equipment',
		capacity: 10,
		amenities: [
			'Lighting Equipment',
			'Backdrop',
			'WiFi',
			'Power Outlets',
			'Props',
		],
		category: 'creative',
	},
	{
		name: 'Training Room',
		slug: 'training-room',
		description: 'Large space for workshops, training, and events',
		capacity: 25,
		amenities: [
			'WiFi',
			'Projector',
			'Sound System',
			'Air Conditioning',
			'Seating',
		],
		category: 'event',
	},
	{
		name: 'Conference Room',
		slug: 'conference-room',
		description: 'Premium conference space for 20-25 people',
		capacity: 25,
		amenities: [
			'WiFi',
			'Video Conferencing',
			'Projector',
			'Whiteboard',
			'Air Conditioning',
		],
		category: 'meeting',
	},
	{
		name: 'Shared Desk Space',
		slug: 'shared-desk',
		description: 'Flexible desk in collaborative environment',
		capacity: 1,
		amenities: ['WiFi', 'Power Outlets', 'Air Conditioning', 'Locker'],
		category: 'shared',
	},
	{
		name: 'Office Space',
		slug: 'office-space',
		description: 'Private office for teams',
		capacity: 8,
		amenities: ['WiFi', 'Power Outlets', 'Air Conditioning', 'Storage'],
		category: 'office',
	},
	{
		name: 'Lounge',
		slug: 'lounge',
		description: 'Casual meeting and relaxation space',
		capacity: 15,
		amenities: [
			'WiFi',
			'Comfortable Seating',
			'Air Conditioning',
			'Coffee',
		],
		category: 'social',
	},
] as const;
