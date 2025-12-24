/**
 * Fix subscription type script
 *
 * This script fixes subscriptions that were created with the wrong type.
 * Run with: npx tsx scripts/fix-subscription-type.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

// Create PostgreSQL connection pool
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function fixSubscriptionTypes() {
	console.log('🔍 Finding subscriptions with mismatched types...\n');

	// Get all memberships with their pricing plans
	const memberships = await prisma.membership.findMany({
		include: {
			pricingPlan: {
				select: {
					id: true,
					name: true,
					unit: true,
					daysAllowed: true,
				},
			},
			user: {
				select: { name: true, email: true },
			},
			space: {
				select: { name: true },
			},
		},
	});

	const mismatched: Array<{
		id: string;
		membershipNumber: string;
		currentType: string;
		shouldBeType: string;
		planName: string;
		planUnit: string;
		userName: string;
	}> = [];

	// Map pricing plan unit to membership type
	const unitToType: Record<string, string> = {
		hour: 'DAILY', // Hourly plans are typically daily
		day: 'DAILY',
		week: 'WEEKLY',
		month: 'MONTHLY',
	};

	for (const membership of memberships) {
		const expectedType =
			unitToType[membership.pricingPlan.unit] || 'MONTHLY';

		if (membership.type !== expectedType) {
			mismatched.push({
				id: membership.id,
				membershipNumber: membership.membershipNumber,
				currentType: membership.type,
				shouldBeType: expectedType,
				planName: membership.pricingPlan.name,
				planUnit: membership.pricingPlan.unit,
				userName: membership.user.name,
			});
		}
	}

	if (mismatched.length === 0) {
		console.log('✅ No mismatched subscriptions found!');
		return;
	}

	console.log(`Found ${mismatched.length} mismatched subscription(s):\n`);

	for (const m of mismatched) {
		console.log(`📋 ${m.membershipNumber}`);
		console.log(`   User: ${m.userName}`);
		console.log(`   Plan: ${m.planName} (unit: ${m.planUnit})`);
		console.log(`   Current Type: ${m.currentType}`);
		console.log(`   Should Be: ${m.shouldBeType}`);
		console.log('');
	}

	// Ask for confirmation (in a real script, you'd use readline)
	console.log('Fixing subscriptions...\n');

	for (const m of mismatched) {
		// Calculate the correct end date based on the correct type
		const membership = await prisma.membership.findUnique({
			where: { id: m.id },
		});

		if (!membership) continue;

		const startDate = membership.startDate;
		let endDate = new Date(startDate);

		switch (m.shouldBeType) {
			case 'DAILY':
				endDate.setDate(endDate.getDate() + 1);
				break;
			case 'WEEKLY':
				endDate.setDate(endDate.getDate() + 7);
				break;
			case 'MONTHLY':
				endDate.setMonth(endDate.getMonth() + 1);
				break;
			case 'QUARTERLY':
				endDate.setMonth(endDate.getMonth() + 3);
				break;
			case 'ANNUAL':
				endDate.setFullYear(endDate.getFullYear() + 1);
				break;
		}

		// Get pricing plan for daysAllowed
		const pricingPlan = await prisma.pricingPlan.findUnique({
			where: { id: membership.pricingPlanId },
			select: { daysAllowed: true },
		});

		await prisma.membership.update({
			where: { id: m.id },
			data: {
				type: m.shouldBeType as any,
				endDate,
				daysAllowed: pricingPlan?.daysAllowed ?? membership.daysAllowed,
			},
		});

		console.log(
			`✅ Fixed ${m.membershipNumber}: ${m.currentType} → ${m.shouldBeType}`
		);
		console.log(`   New end date: ${endDate.toISOString()}`);
	}

	console.log('\n🎉 All subscriptions fixed!');
}

fixSubscriptionTypes()
	.catch(console.error)
	.finally(() => prisma.$disconnect());
