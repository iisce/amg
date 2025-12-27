// scripts/update-subtotals.ts
// This script updates existing records to set subtotal = totalAmount (or amount for Payment)
// Run with: npx tsx scripts/update-subtotals.ts

import { prisma } from '../lib/db';

async function main() {
	console.log('🔄 Updating subtotals for existing records...\n');

	// Update Bookings
	const bookings = await prisma.booking.updateMany({
		where: {
			subtotal: 0,
		},
		data: {
			// Since subtotal was 0 (default), set it to totalAmount
			// This assumes no tax was applied previously
		},
	});

	// We need to do this with raw SQL since we can't reference another column in updateMany
	const bookingResult = await prisma.$executeRaw`
    UPDATE "Booking"
    SET "subtotal" = "totalAmount"
    WHERE "subtotal" = 0
  `;
	console.log(`✅ Updated ${bookingResult} booking records`);

	// Update Memberships
	const membershipResult = await prisma.$executeRaw`
    UPDATE "Membership"
    SET "subtotal" = "totalAmount"
    WHERE "subtotal" = 0
  `;
	console.log(`✅ Updated ${membershipResult} membership records`);

	// Update Payments
	const paymentResult = await prisma.$executeRaw`
    UPDATE "Payment"
    SET "subtotal" = "amount"
    WHERE "subtotal" = 0
  `;
	console.log(`✅ Updated ${paymentResult} payment records`);

	console.log('\n✨ All subtotals updated successfully!');
}

main().catch((e) => {
	console.error('❌ Error updating subtotals:', e);
	process.exit(1);
});
