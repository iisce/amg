import { PrismaClient, UserRole, TourStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { config } from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables
config();

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
	console.log('🌱 Starting database seed...');

	// Clear existing data (order matters due to foreign keys)
	console.log('🗑️  Clearing existing data...');
	await prisma.visitor.deleteMany();
	await prisma.tour.deleteMany();
	await prisma.membershipCheckIn.deleteMany();
	await prisma.membershipMember.deleteMany();
	await prisma.payment.deleteMany();
	await prisma.booking.deleteMany();
	await prisma.membership.deleteMany();
	await prisma.pricingPlan.deleteMany();
	await prisma.timeSlot.deleteMany();
	await prisma.space.deleteMany();
	await prisma.publicHoliday.deleteMany();
	await prisma.session.deleteMany();
	await prisma.account.deleteMany();
	await prisma.passwordResetToken.deleteMany();
	await prisma.activityLog.deleteMany();
	await prisma.enquiry.deleteMany();
	await prisma.user.deleteMany();

	// ============================================
	// ADMIN & STAFF USERS
	// ============================================
	console.log('👤 Creating admin and staff users...');

	// Hash password for all admin users (default: Admin@123)
	const defaultPassword = await bcrypt.hash('Admin@123', 12);

	// Super Admin - Full system access
	const superAdmin = await prisma.user.create({
		data: {
			email: 'superadmin@amgworkspace.com',
			password: defaultPassword,
			name: 'Super Admin',
			phone: '+234 800 000 0001',
			role: UserRole.SUPER_ADMIN,
			isActive: true,
			emailVerified: new Date(),
		},
	});

	// Admin - Administrative access
	const admin = await prisma.user.create({
		data: {
			email: 'admin@amgworkspace.com',
			password: defaultPassword,
			name: 'Admin User',
			phone: '+234 800 000 0002',
			role: UserRole.ADMIN,
			isActive: true,
			emailVerified: new Date(),
		},
	});

	// Front Desk - Reception and check-in management
	const frontDesk = await prisma.user.create({
		data: {
			email: 'frontdesk@amgworkspace.com',
			password: defaultPassword,
			name: 'Front Desk Officer',
			phone: '+234 800 000 0003',
			role: UserRole.FRONT_DESK,
			isActive: true,
			emailVerified: new Date(),
		},
	});

	// Front Desk Assistant - Limited reception access
	const frontDeskAssistant = await prisma.user.create({
		data: {
			email: 'assistant@amgworkspace.com',
			password: defaultPassword,
			name: 'Front Desk Assistant',
			phone: '+234 800 000 0004',
			role: UserRole.FRONT_DESK_ASSISTANT,
			isActive: true,
			emailVerified: new Date(),
		},
	});

	console.log('✅ Admin users created:');
	console.log(`   - Super Admin: ${superAdmin.email}`);
	console.log(`   - Admin: ${admin.email}`);
	console.log(`   - Front Desk: ${frontDesk.email}`);
	console.log(`   - Front Desk Assistant: ${frontDeskAssistant.email}`);
	console.log('   📝 Default password for all: Admin@123');

	// ============================================
	// SUBSCRIPTION SPACES
	// ============================================
	console.log('📍 Creating subscription spaces...');

	// Shared Desk Space - Main subscription space
	const sharedDeskSpace = await prisma.space.create({
		data: {
			name: 'Shared Desk Space',
			slug: 'shared-desk-space',
			description:
				'Flexible coworking space with hot desks in a vibrant community environment',
			fullDescription:
				'Our shared desk space offers a dynamic coworking environment perfect for freelancers, remote workers, and small teams. Enjoy a professional atmosphere with all essential amenities, networking opportunities, and flexible plans to match your work style.',
			capacity: 30,
			amenities: [
				'High-Speed WiFi',
				'Power Outlets',
				'Air Conditioning',
				'Natural Light',
				'Kitchen Access',
			],
			features: [
				'24/7 Access (Monthly Plan)',
				'Printing Services',
				'Free Coffee & Tea',
				'Locker Storage',
				'Community Events',
				'Mail Handling',
			],
			images: ['/images/shared-desk-space.jpg'],
			category: 'WORKSPACE',
			type: 'SUBSCRIPTION',
			sortOrder: 1,
		},
	});

	// Private Office 1 (1-Man)
	const office1 = await prisma.space.create({
		data: {
			name: 'Office Space 1',
			slug: 'office-space-1',
			description: 'Private office space for 1 person',
			fullDescription:
				'A private, secure office space perfect for solo professionals who need their own dedicated workspace. Fully furnished with a desk, chair, and storage.',
			capacity: 1,
			amenities: [
				'High-Speed WiFi',
				'Air Conditioning',
				'Natural Light',
				'Dedicated Power',
			],
			features: [
				'Private & Secure',
				'24/7 Access',
				'Lockable Door',
				'Personalization Allowed',
			],
			images: ['/images/office-space-1.jpg'],
			category: 'OFFICE',
			type: 'SUBSCRIPTION',
			sortOrder: 2,
		},
	});

	// Private Office 2 (2-Man)
	const office2 = await prisma.space.create({
		data: {
			name: 'Office Space 2',
			slug: 'office-space-2',
			description: 'Private office space for 2 persons',
			fullDescription:
				'A private office ideal for small teams or partners. Equipped with two workstations and ample space for collaboration.',
			capacity: 2,
			amenities: [
				'High-Speed WiFi',
				'Air Conditioning',
				'Natural Light',
				'Dedicated Power',
			],
			features: [
				'Private & Secure',
				'24/7 Access',
				'Lockable Door',
				'Meeting Table',
			],
			images: ['/images/office-space-2.jpg'],
			category: 'OFFICE',
			type: 'SUBSCRIPTION',
			sortOrder: 3,
		},
	});

	// Private Office 3 (4-Man)
	const office3 = await prisma.space.create({
		data: {
			name: 'Office Space 3',
			slug: 'office-space-3',
			description: 'Private office space for 4 persons',
			fullDescription:
				'A spacious private office perfect for growing teams. Includes four workstations, meeting area, and storage space.',
			capacity: 4,
			amenities: [
				'High-Speed WiFi',
				'Air Conditioning',
				'Natural Light',
				'Dedicated Power',
			],
			features: [
				'Private & Secure',
				'24/7 Access',
				'Lockable Door',
				'Meeting Corner',
				'Whiteboard',
			],
			images: ['/images/office-space-3.jpg'],
			category: 'OFFICE',
			type: 'SUBSCRIPTION',
			sortOrder: 4,
		},
	});

	// ============================================
	// BOOKING SPACES
	// ============================================
	console.log('📍 Creating booking spaces...');

	// Board Room
	const boardRoom = await prisma.space.create({
		data: {
			name: 'Board Room',
			slug: 'board-room',
			description:
				'Professional meeting room for presentations and client meetings',
			fullDescription:
				'Our professional boardroom is perfect for important meetings, presentations, and client engagements. Equipped with state-of-the-art technology for video conferencing and presentations.',
			capacity: 10,
			amenities: [
				'High-Speed WiFi',
				'65" Display Screen',
				'Whiteboard',
				'Air Conditioning',
				'Video Conferencing',
			],
			features: [
				'Conference Phone',
				'Presentation Clicker',
				'Water & Refreshments',
				'HDMI/USB-C Connectivity',
			],
			images: ['/images/board-room.jpg'],
			category: 'MEETING',
			type: 'BOOKING',
			sortOrder: 5,
		},
	});

	// Photo Studio
	const photoStudio = await prisma.space.create({
		data: {
			name: 'Photo Studio',
			slug: 'photo-studio',
			description:
				'Professional studio with lighting and backdrop equipment',
			fullDescription:
				'A fully equipped photography studio with professional lighting, backdrops, and equipment. Perfect for photoshoots, content creation, and video production.',
			capacity: 8,
			amenities: [
				'Professional Lighting',
				'Multiple Backdrops',
				'High-Speed WiFi',
				'Air Conditioning',
			],
			features: [
				'Softbox Lighting',
				'Ring Lights',
				'Props Available',
				'Changing Room',
			],
			images: ['/images/photo-studio.jpg'],
			category: 'CREATIVE',
			type: 'BOOKING',
			sortOrder: 6,
		},
	});

	// Training Room
	const trainingRoom = await prisma.space.create({
		data: {
			name: 'Training Room',
			slug: 'training-room',
			description: 'Large space for workshops, training, and events',
			fullDescription:
				'Our spacious training room is ideal for workshops, seminars, training sessions, and corporate events. Flexible seating arrangement with full AV support.',
			capacity: 50,
			amenities: [
				'High-Speed WiFi',
				'Projector & Screen',
				'Microphone System',
				'Air Conditioning',
			],
			features: [
				'Flexible Seating',
				'Podium',
				'Multiple Power Points',
				'Catering Available',
			],
			images: ['/images/training-room.jpg'],
			category: 'EVENT',
			type: 'BOOKING',
			sortOrder: 7,
		},
	});

	// Lounge
	const lounge = await prisma.space.create({
		data: {
			name: 'Lounge',
			slug: 'lounge',
			description: 'Comfortable space for casual meetings and networking',
			fullDescription:
				'Our stylish lounge provides a relaxed atmosphere for informal meetings, networking, and creative brainstorming sessions.',
			capacity: 15,
			amenities: [
				'High-Speed WiFi',
				'Comfortable Seating',
				'Air Conditioning',
				'Ambient Lighting',
			],
			features: [
				'Coffee & Tea Station',
				'Snack Bar',
				'Background Music',
				'Phone Booths Nearby',
			],
			images: ['/images/lounge.jpg'],
			category: 'SOCIAL',
			type: 'BOOKING',
			sortOrder: 8,
		},
	});

	// Half Shared Desk Space (for booking)
	const halfSharedSpace = await prisma.space.create({
		data: {
			name: 'Half Shared Desk Space',
			slug: 'half-shared-desk-space',
			description:
				'Book half of the shared workspace for your team or event',
			fullDescription:
				'Need space for a larger group? Book half of our shared workspace for team meetings, workshops, or collaborative sessions. Includes exclusive use of approximately 15 desks.',
			capacity: 15,
			amenities: [
				'High-Speed WiFi',
				'Power Outlets',
				'Air Conditioning',
				'Whiteboard',
			],
			features: [
				'Semi-Private Setup',
				'Flexible Arrangement',
				'Kitchen Access',
				'Printer Access',
			],
			images: ['/images/shared-desk-space.jpg'],
			category: 'EVENT',
			type: 'BOOKING',
			sortOrder: 9,
		},
	});

	// Full Shared Desk Space (for booking)
	const fullSharedSpace = await prisma.space.create({
		data: {
			name: 'Full Shared Desk Space',
			slug: 'full-shared-desk-space',
			description: 'Book the entire shared workspace for your event',
			fullDescription:
				'Take over the entire shared workspace for large meetings, corporate events, or team retreats. Exclusive access to all 30 desks and common areas.',
			capacity: 30,
			amenities: [
				'High-Speed WiFi',
				'Power Outlets',
				'Air Conditioning',
				'Kitchen',
			],
			features: [
				'Exclusive Access',
				'Flexible Layout',
				'Full Kitchen Use',
				'All Amenities Included',
			],
			images: ['/images/shared-desk-space.jpg'],
			category: 'EVENT',
			type: 'BOOKING',
			sortOrder: 10,
		},
	});

	// Entire Office Space (Saturdays Only)
	const entireOffice = await prisma.space.create({
		data: {
			name: 'Entire Office Space',
			slug: 'entire-office-space',
			description: 'Book the entire office space for Saturdays',
			fullDescription:
				'Have exclusive access to the entire AMG Workspace facility on Saturdays. Perfect for large corporate events, product launches, or private functions.',
			capacity: 100,
			amenities: [
				'High-Speed WiFi',
				'All Meeting Rooms',
				'Kitchen',
				'Air Conditioning',
			],
			features: [
				'Exclusive Building Access',
				'All Spaces Included',
				'Parking Available',
				'Security Included',
			],
			images: ['/images/entire-office.jpg'],
			category: 'EVENT',
			type: 'BOOKING',
			sortOrder: 11,
		},
	});

	// ============================================
	// PRICING PLANS - SHARED DESK SUBSCRIPTIONS
	// ============================================
	console.log('💰 Creating pricing plans for Shared Desk Space...');

	// All prices in kobo (multiply by 100)
	await Promise.all([
		// Daily Plans - ₦5,500
		prisma.pricingPlan.create({
			data: {
				spaceId: sharedDeskSpace.id,
				name: 'Daily Plans',
				description: 'Pay as you use, single day access',
				price: 550000, // ₦5,500
				unit: 'day',
				type: 'DAILY',
				daysAllowed: 1,
				maxPauseDays: 0,
				carryOver: false,
				sortOrder: 1,
			},
		}),

		// Saturday Plans - ₦9,000
		prisma.pricingPlan.create({
			data: {
				spaceId: sharedDeskSpace.id,
				name: 'Saturday Plans',
				description: 'Saturday only access',
				price: 900000, // ₦9,000
				unit: 'day',
				type: 'DAILY',
				daysAllowed: 1,
				maxPauseDays: 0,
				carryOver: false,
				dayRestriction: 'SATURDAY',
				sortOrder: 2,
			},
		}),

		// Evening Plan - ₦7,000
		prisma.pricingPlan.create({
			data: {
				spaceId: sharedDeskSpace.id,
				name: 'Evening Plan',
				description: '6pm to 9pm daily access',
				price: 700000, // ₦7,000
				unit: 'day',
				type: 'DAILY',
				daysAllowed: 1,
				maxPauseDays: 0,
				carryOver: false,
				timeRestriction: '18:00-21:00',
				sortOrder: 3,
			},
		}),

		// Hybrid Weekly - ₦15,000
		prisma.pricingPlan.create({
			data: {
				spaceId: sharedDeskSpace.id,
				name: 'Hybrid Weekly',
				description: '3 days within the week, no carry over',
				price: 1500000, // ₦15,000
				unit: 'week',
				type: 'WEEKLY',
				daysAllowed: 3,
				maxPauseDays: 0,
				carryOver: false,
				sortOrder: 4,
			},
		}),

		// Full Weekly - ₦21,500
		prisma.pricingPlan.create({
			data: {
				spaceId: sharedDeskSpace.id,
				name: 'Full Weekly',
				description: 'Monday to Saturday access',
				price: 2150000, // ₦21,500
				unit: 'week',
				type: 'WEEKLY',
				daysAllowed: 6,
				maxPauseDays: 0,
				carryOver: false,
				sortOrder: 5,
			},
		}),

		// Hybrid Flexi - ₦28,750
		prisma.pricingPlan.create({
			data: {
				spaceId: sharedDeskSpace.id,
				name: 'Hybrid Flexi',
				description: '10 working days within a month, no carry over',
				price: 2875000, // ₦28,750
				unit: 'month',
				type: 'MONTHLY',
				daysAllowed: 10,
				maxPauseDays: 3,
				carryOver: false,
				sortOrder: 6,
			},
		}),

		// Half Flexi Monthly - ₦33,000
		prisma.pricingPlan.create({
			data: {
				spaceId: sharedDeskSpace.id,
				name: 'Half Flexi Monthly',
				description: '15 working days within a month, no carry over',
				price: 3300000, // ₦33,000
				unit: 'month',
				type: 'MONTHLY',
				daysAllowed: 15,
				maxPauseDays: 5,
				carryOver: false,
				sortOrder: 7,
			},
		}),

		// Monthly Plan - ₦46,500
		prisma.pricingPlan.create({
			data: {
				spaceId: sharedDeskSpace.id,
				name: 'Monthly Plan',
				description: 'Full access Monday to Saturday',
				price: 4650000, // ₦46,500
				unit: 'month',
				type: 'MONTHLY',
				daysAllowed: null, // Unlimited
				maxPauseDays: 10,
				carryOver: false,
				sortOrder: 8,
			},
		}),
	]);

	// ============================================
	// PRICING PLANS - PRIVATE OFFICES
	// ============================================
	console.log('💰 Creating pricing plans for Private Offices...');

	// Office Space 1 (1-Man)
	await Promise.all([
		prisma.pricingPlan.create({
			data: {
				spaceId: office1.id,
				name: '1 Month',
				description: 'Monthly subscription for 1-person office',
				price: 9000000, // ₦90,000
				unit: 'month',
				type: 'MONTHLY',
				daysAllowed: null,
				maxPauseDays: 0, // No pause for private offices
				carryOver: false,
				sortOrder: 1,
			},
		}),
		prisma.pricingPlan.create({
			data: {
				spaceId: office1.id,
				name: '2 Months',
				description:
					'2-month subscription for 1-person office (save ₦15,000)',
				price: 16500000, // ₦165,000
				unit: 'month',
				type: 'MONTHLY',
				daysAllowed: null,
				maxPauseDays: 0,
				carryOver: false,
				sortOrder: 2,
			},
		}),
	]);

	// Office Space 2 (2-Man)
	await Promise.all([
		prisma.pricingPlan.create({
			data: {
				spaceId: office2.id,
				name: '1 Month',
				description: 'Monthly subscription for 2-person office',
				price: 13500000, // ₦135,000
				unit: 'month',
				type: 'MONTHLY',
				daysAllowed: null,
				maxPauseDays: 0,
				carryOver: false,
				sortOrder: 1,
			},
		}),
		prisma.pricingPlan.create({
			data: {
				spaceId: office2.id,
				name: '2 Months',
				description:
					'2-month subscription for 2-person office (save ₦30,000)',
				price: 24000000, // ₦240,000
				unit: 'month',
				type: 'MONTHLY',
				daysAllowed: null,
				maxPauseDays: 0,
				carryOver: false,
				sortOrder: 2,
			},
		}),
	]);

	// Office Space 3 (4-Man)
	await Promise.all([
		prisma.pricingPlan.create({
			data: {
				spaceId: office3.id,
				name: '1 Month',
				description: 'Monthly subscription for 4-person office',
				price: 15500000, // ₦155,000
				unit: 'month',
				type: 'MONTHLY',
				daysAllowed: null,
				maxPauseDays: 0,
				carryOver: false,
				sortOrder: 1,
			},
		}),
		prisma.pricingPlan.create({
			data: {
				spaceId: office3.id,
				name: '2 Months',
				description:
					'2-month subscription for 4-person office (save ₦20,000)',
				price: 29000000, // ₦290,000
				unit: 'month',
				type: 'MONTHLY',
				daysAllowed: null,
				maxPauseDays: 0,
				carryOver: false,
				sortOrder: 2,
			},
		}),
	]);

	// ============================================
	// PRICING PLANS - BOOKING SPACES
	// ============================================
	console.log('💰 Creating pricing plans for Booking Spaces...');

	// Board Room - ₦15,000 for 2 hours
	await prisma.pricingPlan.create({
		data: {
			spaceId: boardRoom.id,
			name: '2 Hours',
			description: 'Book the board room for 2 hours',
			price: 1500000, // ₦15,000
			duration: 2,
			unit: 'hour',
			type: 'HOURLY',
			sortOrder: 1,
		},
	});

	// Photo Studio - ₦10,000 for 1 hour
	await prisma.pricingPlan.create({
		data: {
			spaceId: photoStudio.id,
			name: '1 Hour',
			description: 'Book the photo studio for 1 hour',
			price: 1000000, // ₦10,000
			duration: 1,
			unit: 'hour',
			type: 'HOURLY',
			sortOrder: 1,
		},
	});

	// Training Room - ₦200,000 per session (full day)
	await prisma.pricingPlan.create({
		data: {
			spaceId: trainingRoom.id,
			name: 'Full Day Session',
			description: 'Book the training room for a full day session',
			price: 20000000, // ₦200,000
			duration: 8,
			unit: 'day',
			type: 'DAILY',
			sortOrder: 1,
		},
	});

	// Lounge - ₦25,000 per hour
	await prisma.pricingPlan.create({
		data: {
			spaceId: lounge.id,
			name: '1 Hour',
			description: 'Book the lounge for 1 hour',
			price: 2500000, // ₦25,000
			duration: 1,
			unit: 'hour',
			type: 'HOURLY',
			sortOrder: 1,
		},
	});

	// Half Shared Desk Space - ₦100,000 per day
	await prisma.pricingPlan.create({
		data: {
			spaceId: halfSharedSpace.id,
			name: 'Full Day',
			description: 'Book half of the shared workspace for a full day',
			price: 10000000, // ₦100,000
			duration: 8,
			unit: 'day',
			type: 'DAILY',
			sortOrder: 1,
		},
	});

	// Full Shared Desk Space - ₦180,000 per day
	await prisma.pricingPlan.create({
		data: {
			spaceId: fullSharedSpace.id,
			name: 'Full Day',
			description: 'Book the entire shared workspace for a full day',
			price: 18000000, // ₦180,000
			duration: 8,
			unit: 'day',
			type: 'DAILY',
			sortOrder: 1,
		},
	});

	// Entire Office Space - ₦500,000 (Saturdays Only)
	await prisma.pricingPlan.create({
		data: {
			spaceId: entireOffice.id,
			name: 'Saturday Booking',
			description: 'Book the entire office space for Saturday',
			price: 50000000, // ₦500,000
			duration: 8,
			unit: 'day',
			type: 'DAILY',
			dayRestriction: 'SATURDAY',
			sortOrder: 1,
		},
	});

	// ============================================
	// TIME SLOTS FOR BOOKING SPACES
	// ============================================
	console.log('⏰ Creating time slots...');

	const bookingSpaces = [boardRoom, photoStudio, lounge];
	const timeSlots = [
		{ startTime: '08:00', endTime: '10:00' },
		{ startTime: '10:00', endTime: '12:00' },
		{ startTime: '12:00', endTime: '14:00' },
		{ startTime: '14:00', endTime: '16:00' },
		{ startTime: '16:00', endTime: '18:00' },
		{ startTime: '18:00', endTime: '20:00' },
	];

	for (const space of bookingSpaces) {
		for (const slot of timeSlots) {
			await prisma.timeSlot.create({
				data: {
					spaceId: space.id,
					startTime: slot.startTime,
					endTime: slot.endTime,
				},
			});
		}
	}

	// ============================================
	// PUBLIC HOLIDAYS (Nigerian Holidays 2024-2025)
	// ============================================
	console.log('📅 Creating public holidays...');

	const holidays = [
		// 2024 Holidays
		{ name: "New Year's Day", date: '2024-01-01', isRecurring: true },
		{ name: 'Good Friday', date: '2024-03-29', isRecurring: false },
		{ name: 'Easter Monday', date: '2024-04-01', isRecurring: false },
		{ name: "Workers' Day", date: '2024-05-01', isRecurring: true },
		{ name: 'Democracy Day', date: '2024-06-12', isRecurring: true },
		{ name: 'Eid el-Fitr', date: '2024-04-10', isRecurring: false },
		{ name: 'Eid el-Kabir', date: '2024-06-17', isRecurring: false },
		{ name: 'Independence Day', date: '2024-10-01', isRecurring: true },
		{ name: 'Christmas Day', date: '2024-12-25', isRecurring: true },
		{ name: 'Boxing Day', date: '2024-12-26', isRecurring: true },

		// 2025 Holidays
		{ name: "New Year's Day 2025", date: '2025-01-01', isRecurring: false },
		{ name: 'Good Friday 2025', date: '2025-04-18', isRecurring: false },
		{ name: 'Easter Monday 2025', date: '2025-04-21', isRecurring: false },
		{ name: "Workers' Day 2025", date: '2025-05-01', isRecurring: false },
		{ name: 'Democracy Day 2025', date: '2025-06-12', isRecurring: false },
		{ name: 'Eid el-Fitr 2025', date: '2025-03-31', isRecurring: false },
		{ name: 'Eid el-Kabir 2025', date: '2025-06-07', isRecurring: false },
		{
			name: 'Independence Day 2025',
			date: '2025-10-01',
			isRecurring: false,
		},
		{ name: 'Christmas Day 2025', date: '2025-12-25', isRecurring: false },
		{ name: 'Boxing Day 2025', date: '2025-12-26', isRecurring: false },
	];

	for (const holiday of holidays) {
		await prisma.publicHoliday.create({
			data: {
				name: holiday.name,
				date: new Date(holiday.date),
				isRecurring: holiday.isRecurring,
			},
		});
	}

	// ============================================
	// TOUR BOOKINGS (Sample workspace inspections)
	// ============================================
	console.log('🏢 Creating sample tour bookings...');

	const tours = [
		{
			name: 'Oluwaseun Adeyemi',
			email: 'seun.adeyemi@techstartup.ng',
			phone: '+234 801 234 5678',
			company: 'Tech Startup Nigeria',
			preferredDate: new Date('2025-01-02T10:00:00'),
			confirmedDate: new Date('2025-01-02T10:00:00'),
			interestedIn: 'Private Office',
			groupSize: 3,
			budget: '₦150,000 - ₦250,000/month',
			source: 'Google Search',
			message: 'Looking for a 4-person office for our dev team',
			status: TourStatus.CONFIRMED,
			confirmedBy: 'admin@amgworkspace.com',
		},
		{
			name: 'Amara Okonkwo',
			email: 'amara@creativestudio.com',
			phone: '+234 802 345 6789',
			company: 'Creative Studio Lagos',
			preferredDate: new Date('2025-01-03T14:00:00'),
			interestedIn: 'Shared Desk',
			groupSize: 1,
			budget: '₦30,000 - ₦50,000/month',
			source: 'Instagram',
			message: 'Freelance designer looking for flexible workspace',
			status: TourStatus.PENDING,
		},
		{
			name: 'Chukwuemeka Nwosu',
			email: 'emeka@lawfirm.ng',
			phone: '+234 803 456 7890',
			company: 'Nwosu & Associates',
			preferredDate: new Date('2024-12-20T11:00:00'),
			confirmedDate: new Date('2024-12-20T11:00:00'),
			interestedIn: 'Board Room',
			groupSize: 6,
			source: 'Referral',
			message: 'Need meeting space for client consultations',
			status: TourStatus.COMPLETED,
			confirmedBy: 'admin@amgworkspace.com',
			conductedBy: 'frontdesk@amgworkspace.com',
			feedback:
				'Very interested in monthly board room package. Will follow up.',
			converted: true,
		},
		{
			name: 'Fatima Ibrahim',
			email: 'fatima@fintechng.com',
			phone: '+234 804 567 8901',
			company: 'FinTech Nigeria',
			preferredDate: new Date('2024-12-18T09:00:00'),
			confirmedDate: new Date('2024-12-18T09:00:00'),
			interestedIn: 'Private Office',
			groupSize: 8,
			budget: '₦400,000+/month',
			source: 'LinkedIn',
			status: TourStatus.NO_SHOW,
			confirmedBy: 'admin@amgworkspace.com',
		},
		{
			name: 'David Oyelaran',
			email: 'david@consultingfirm.ng',
			phone: '+234 805 678 9012',
			company: 'Oyelaran Consulting',
			preferredDate: new Date('2024-12-15T15:00:00'),
			interestedIn: 'Training Room',
			groupSize: 2,
			source: 'Google Search',
			message: 'Looking for venue for monthly team trainings',
			status: TourStatus.CANCELLED,
		},
	];

	for (const tour of tours) {
		await prisma.tour.create({ data: tour });
	}

	console.log(`✅ Created ${tours.length} sample tour bookings`);

	console.log('✅ Database seed completed successfully!');
	console.log('');
	console.log('📊 Summary:');
	console.log(
		'   - 4 Admin/Staff Users (Super Admin, Admin, Front Desk, Assistant)'
	);
	console.log('   - 4 Subscription Spaces (Shared Desk + 3 Private Offices)');
	console.log('   - 7 Booking Spaces');
	console.log('   - 8 Shared Desk Plans');
	console.log('   - 6 Private Office Plans');
	console.log('   - 7 Booking Plans');
	console.log('   - Time Slots for booking spaces');
	console.log('   - 20 Public Holidays');
	console.log('   - 5 Sample Tour Bookings');
	console.log('');
	console.log('🔐 Admin Credentials:');
	console.log('   Email: superadmin@amgworkspace.com | Role: SUPER_ADMIN');
	console.log('   Email: admin@amgworkspace.com | Role: ADMIN');
	console.log('   Email: frontdesk@amgworkspace.com | Role: FRONT_DESK');
	console.log(
		'   Email: assistant@amgworkspace.com | Role: FRONT_DESK_ASSISTANT'
	);
	console.log('   Password (all): Admin@123');
}

main()
	.catch((e) => {
		console.error('❌ Error seeding database:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
		await pool.end();
	});
