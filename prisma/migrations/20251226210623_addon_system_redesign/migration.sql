/*
  Warnings:

  - Added the required column `userId` to the `AddonPurchase` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AddonType" AS ENUM ('SUBSCRIPTION', 'BOOKING', 'SHOP', 'UNIVERSAL');

-- CreateEnum
CREATE TYPE "AddonUnitType" AS ENUM ('QUANTITY', 'HOURS', 'DAYS', 'ACCESS');

-- AlterEnum
ALTER TYPE "AddonPurchaseStatus" ADD VALUE 'PARTIALLY_USED';

-- AlterTable
ALTER TABLE "Addon" ADD COLUMN     "category" TEXT,
ADD COLUMN     "maxQuantityPerPurchase" INTEGER,
ADD COLUMN     "type" "AddonType" NOT NULL DEFAULT 'UNIVERSAL',
ADD COLUMN     "unitLabel" TEXT,
ADD COLUMN     "unitType" "AddonUnitType" NOT NULL DEFAULT 'QUANTITY';

-- AlterTable
ALTER TABLE "AddonPurchase" ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "membershipId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Addon_type_idx" ON "Addon"("type");

-- CreateIndex
CREATE INDEX "Addon_category_idx" ON "Addon"("category");

-- CreateIndex
CREATE INDEX "AddonPurchase_userId_idx" ON "AddonPurchase"("userId");

-- AddForeignKey
ALTER TABLE "AddonPurchase" ADD CONSTRAINT "AddonPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
