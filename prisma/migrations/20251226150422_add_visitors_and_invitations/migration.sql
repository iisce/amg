-- CreateEnum
CREATE TYPE "PerkPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'SUBSCRIPTION_PERIOD');

-- CreateEnum
CREATE TYPE "AddonPurchaseStatus" AS ENUM ('PENDING', 'ACTIVE', 'USED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VisitorStatus" AS ENUM ('PENDING', 'CHECKED_IN', 'CHECKED_OUT', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TourStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- AlterEnum
ALTER TYPE "MembershipStatus" ADD VALUE 'PAUSED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'FRONT_DESK';
ALTER TYPE "UserRole" ADD VALUE 'FRONT_DESK_ASSISTANT';

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "currentOccupancy" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxMembers" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "pauseHistory" JSONB,
ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "totalPausedDays" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "MembershipCheckIn" ADD COLUMN     "checkedInBy" TEXT,
ADD COLUMN     "memberId" TEXT;

-- AlterTable
ALTER TABLE "PricingPlan" ADD COLUMN     "carryOver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dayRestriction" TEXT,
ADD COLUMN     "daysAllowed" INTEGER,
ADD COLUMN     "maxPauseDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "timeRestriction" TEXT;

-- CreateTable
CREATE TABLE "PlanPerk" (
    "id" TEXT NOT NULL,
    "pricingPlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "includedSpaceId" TEXT,
    "durationMinutes" INTEGER NOT NULL,
    "limitPerPeriod" INTEGER NOT NULL DEFAULT 1,
    "periodType" "PerkPeriod" NOT NULL DEFAULT 'WEEKLY',
    "isUnlimited" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanPerk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerkUsage" (
    "id" TEXT NOT NULL,
    "perkId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "bookingId" TEXT,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationUsed" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerkUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Addon" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "spaceId" TEXT,
    "price" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "availableForAllPlans" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Addon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddonPurchase" (
    "id" TEXT NOT NULL,
    "addonId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "paymentId" TEXT,
    "bookingId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "usedQuantity" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "status" "AddonPurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AddonPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipMember" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "accessCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "invitationToken" TEXT,
    "invitationSentAt" TIMESTAMP(3),
    "invitationExpires" TIMESTAMP(3),
    "qrCodeSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "purpose" TEXT,
    "hostId" TEXT NOT NULL,
    "hostMembershipId" TEXT,
    "accessCode" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "maxDuration" INTEGER NOT NULL DEFAULT 480,
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "checkedInBy" TEXT,
    "status" "VisitorStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicHoliday" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicHoliday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tour" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "preferredDate" TIMESTAMP(3) NOT NULL,
    "confirmedDate" TIMESTAMP(3),
    "duration" INTEGER NOT NULL DEFAULT 30,
    "interestedIn" TEXT,
    "groupSize" INTEGER NOT NULL DEFAULT 1,
    "budget" TEXT,
    "source" TEXT,
    "message" TEXT,
    "status" "TourStatus" NOT NULL DEFAULT 'PENDING',
    "confirmedBy" TEXT,
    "conductedBy" TEXT,
    "feedback" TEXT,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "convertedToMembershipId" TEXT,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AddonPlans" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AddonPlans_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "PlanPerk_pricingPlanId_idx" ON "PlanPerk"("pricingPlanId");

-- CreateIndex
CREATE INDEX "PlanPerk_includedSpaceId_idx" ON "PlanPerk"("includedSpaceId");

-- CreateIndex
CREATE INDEX "PlanPerk_isActive_idx" ON "PlanPerk"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PerkUsage_bookingId_key" ON "PerkUsage"("bookingId");

-- CreateIndex
CREATE INDEX "PerkUsage_perkId_idx" ON "PerkUsage"("perkId");

-- CreateIndex
CREATE INDEX "PerkUsage_membershipId_idx" ON "PerkUsage"("membershipId");

-- CreateIndex
CREATE INDEX "PerkUsage_usedAt_idx" ON "PerkUsage"("usedAt");

-- CreateIndex
CREATE INDEX "Addon_spaceId_idx" ON "Addon"("spaceId");

-- CreateIndex
CREATE INDEX "Addon_isActive_idx" ON "Addon"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AddonPurchase_bookingId_key" ON "AddonPurchase"("bookingId");

-- CreateIndex
CREATE INDEX "AddonPurchase_addonId_idx" ON "AddonPurchase"("addonId");

-- CreateIndex
CREATE INDEX "AddonPurchase_membershipId_idx" ON "AddonPurchase"("membershipId");

-- CreateIndex
CREATE INDEX "AddonPurchase_status_idx" ON "AddonPurchase"("status");

-- CreateIndex
CREATE INDEX "AddonPurchase_expiresAt_idx" ON "AddonPurchase"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipMember_accessCode_key" ON "MembershipMember"("accessCode");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipMember_invitationToken_key" ON "MembershipMember"("invitationToken");

-- CreateIndex
CREATE INDEX "MembershipMember_membershipId_idx" ON "MembershipMember"("membershipId");

-- CreateIndex
CREATE INDEX "MembershipMember_userId_idx" ON "MembershipMember"("userId");

-- CreateIndex
CREATE INDEX "MembershipMember_accessCode_idx" ON "MembershipMember"("accessCode");

-- CreateIndex
CREATE INDEX "MembershipMember_isActive_idx" ON "MembershipMember"("isActive");

-- CreateIndex
CREATE INDEX "MembershipMember_invitationToken_idx" ON "MembershipMember"("invitationToken");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipMember_membershipId_email_key" ON "MembershipMember"("membershipId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Visitor_accessCode_key" ON "Visitor"("accessCode");

-- CreateIndex
CREATE INDEX "Visitor_hostId_idx" ON "Visitor"("hostId");

-- CreateIndex
CREATE INDEX "Visitor_hostMembershipId_idx" ON "Visitor"("hostMembershipId");

-- CreateIndex
CREATE INDEX "Visitor_accessCode_idx" ON "Visitor"("accessCode");

-- CreateIndex
CREATE INDEX "Visitor_status_idx" ON "Visitor"("status");

-- CreateIndex
CREATE INDEX "Visitor_validFrom_validUntil_idx" ON "Visitor"("validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "Visitor_checkInTime_idx" ON "Visitor"("checkInTime");

-- CreateIndex
CREATE INDEX "PublicHoliday_date_idx" ON "PublicHoliday"("date");

-- CreateIndex
CREATE INDEX "PublicHoliday_isActive_idx" ON "PublicHoliday"("isActive");

-- CreateIndex
CREATE INDEX "Tour_email_idx" ON "Tour"("email");

-- CreateIndex
CREATE INDEX "Tour_status_idx" ON "Tour"("status");

-- CreateIndex
CREATE INDEX "Tour_preferredDate_idx" ON "Tour"("preferredDate");

-- CreateIndex
CREATE INDEX "Tour_confirmedDate_idx" ON "Tour"("confirmedDate");

-- CreateIndex
CREATE INDEX "Tour_createdAt_idx" ON "Tour"("createdAt");

-- CreateIndex
CREATE INDEX "_AddonPlans_B_index" ON "_AddonPlans"("B");

-- CreateIndex
CREATE INDEX "Membership_companyName_idx" ON "Membership"("companyName");

-- CreateIndex
CREATE INDEX "MembershipCheckIn_memberId_idx" ON "MembershipCheckIn"("memberId");

-- AddForeignKey
ALTER TABLE "PlanPerk" ADD CONSTRAINT "PlanPerk_pricingPlanId_fkey" FOREIGN KEY ("pricingPlanId") REFERENCES "PricingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanPerk" ADD CONSTRAINT "PlanPerk_includedSpaceId_fkey" FOREIGN KEY ("includedSpaceId") REFERENCES "Space"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerkUsage" ADD CONSTRAINT "PerkUsage_perkId_fkey" FOREIGN KEY ("perkId") REFERENCES "PlanPerk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerkUsage" ADD CONSTRAINT "PerkUsage_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerkUsage" ADD CONSTRAINT "PerkUsage_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Addon" ADD CONSTRAINT "Addon_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddonPurchase" ADD CONSTRAINT "AddonPurchase_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "Addon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddonPurchase" ADD CONSTRAINT "AddonPurchase_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddonPurchase" ADD CONSTRAINT "AddonPurchase_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddonPurchase" ADD CONSTRAINT "AddonPurchase_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipMember" ADD CONSTRAINT "MembershipMember_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipMember" ADD CONSTRAINT "MembershipMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipCheckIn" ADD CONSTRAINT "MembershipCheckIn_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "MembershipMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_hostMembershipId_fkey" FOREIGN KEY ("hostMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AddonPlans" ADD CONSTRAINT "_AddonPlans_A_fkey" FOREIGN KEY ("A") REFERENCES "Addon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AddonPlans" ADD CONSTRAINT "_AddonPlans_B_fkey" FOREIGN KEY ("B") REFERENCES "PricingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
