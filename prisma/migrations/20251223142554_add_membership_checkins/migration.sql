-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "daysAllowed" INTEGER;

-- CreateTable
CREATE TABLE "MembershipCheckIn" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "checkInTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutTime" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembershipCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MembershipCheckIn_membershipId_idx" ON "MembershipCheckIn"("membershipId");

-- CreateIndex
CREATE INDEX "MembershipCheckIn_checkInTime_idx" ON "MembershipCheckIn"("checkInTime");

-- AddForeignKey
ALTER TABLE "MembershipCheckIn" ADD CONSTRAINT "MembershipCheckIn_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
