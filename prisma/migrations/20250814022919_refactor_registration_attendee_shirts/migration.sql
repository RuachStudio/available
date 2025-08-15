/*
  Warnings:

  - The `shirtSize` column on the `Attendee` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `Registration` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ShirtSize" AS ENUM ('XS', 'S', 'M', 'L', 'XL', '2XL', '3XL');

-- AlterTable
ALTER TABLE "public"."Attendee" ADD COLUMN     "wantsShirt" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "phone" DROP NOT NULL,
DROP COLUMN "shirtSize",
ADD COLUMN     "shirtSize" "public"."ShirtSize";

-- AlterTable
ALTER TABLE "public"."Registration" ADD COLUMN     "primaryShirtSize" "public"."ShirtSize",
ADD COLUMN     "primaryWantsShirt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "contactPhone" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Attendee_registrationId_idx" ON "public"."Attendee"("registrationId");

-- CreateIndex
CREATE INDEX "Registration_contactEmail_idx" ON "public"."Registration"("contactEmail");

-- CreateIndex
CREATE INDEX "Registration_contactPhone_idx" ON "public"."Registration"("contactPhone");
