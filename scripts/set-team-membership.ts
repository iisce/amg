/**
 * Script to update a membership to support team members
 *
 * Usage:
 *   npx tsx scripts/set-team-membership.ts <membershipId> <maxMembers>
 *
 * Example:
 *   npx tsx scripts/set-team-membership.ts clxyz123 4
 */

import { config } from 'dotenv';
config(); // Load .env before importing prisma

import { prisma } from '../lib/db';

async function main() {
	const [membershipId, maxMembersStr] = process.argv.slice(2);

	if (!membershipId) {
		// List all memberships if no ID provided
		console.log('\n📋 Listing all memberships:\n');
		const memberships = await prisma.membership.findMany({
			select: {
				id: true,
				membershipNumber: true,
				maxMembers: true,
				status: true,
				companyName: true,
				user: { select: { name: true, email: true } },
				space: { select: { name: true } },
			},
			orderBy: { createdAt: 'desc' },
			take: 10,
		});

		if (memberships.length === 0) {
			console.log('No memberships found.');
			return;
		}

		console.log('ID | Membership # | Max Members | Status | Space | User');
		console.log('-'.repeat(80));
		for (const m of memberships) {
			console.log(
				`${m.id} | ${m.membershipNumber} | ${m.maxMembers} | ${
					m.status
				} | ${m.space.name} | ${m.user.name || m.user.email}`
			);
		}
		console.log(
			'\n💡 To update, run: npx tsx scripts/set-team-membership.ts <membershipId> <maxMembers>'
		);
		return;
	}

	const maxMembers = parseInt(maxMembersStr || '4', 10);

	if (isNaN(maxMembers) || maxMembers < 1) {
		console.error('❌ maxMembers must be a positive number');
		process.exit(1);
	}

	// Find the membership
	const membership = await prisma.membership.findUnique({
		where: { id: membershipId },
		select: {
			id: true,
			membershipNumber: true,
			maxMembers: true,
			space: { select: { name: true } },
			user: { select: { name: true, email: true } },
		},
	});

	if (!membership) {
		console.error(`❌ Membership not found: ${membershipId}`);
		process.exit(1);
	}

	console.log(`\n📝 Found membership:`);
	console.log(`   Number: ${membership.membershipNumber}`);
	console.log(`   Space: ${membership.space.name}`);
	console.log(`   User: ${membership.user.name || membership.user.email}`);
	console.log(`   Current maxMembers: ${membership.maxMembers}`);

	// Update the membership
	const updated = await prisma.membership.update({
		where: { id: membershipId },
		data: { maxMembers },
	});

	console.log(
		`\n✅ Updated maxMembers: ${membership.maxMembers} → ${updated.maxMembers}`
	);
	console.log(
		'\n🎉 Team Management UI should now be visible for this subscription!'
	);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
