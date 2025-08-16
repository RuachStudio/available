/*
  Warnings:

  - A unique constraint covering the columns `[contactPhoneLast10]` on the table `Registration` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Attendee" ADD COLUMN     "phoneLast10" TEXT;

-- AlterTable
ALTER TABLE "public"."Registration" ADD COLUMN     "contactPhoneLast10" TEXT;

-- CreateIndex
CREATE INDEX "Attendee_phoneLast10_idx" ON "public"."Attendee"("phoneLast10");

-- CreateIndex
CREATE INDEX "Attendee_email_idx" ON "public"."Attendee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_contactPhoneLast10_key" ON "public"."Registration"("contactPhoneLast10");
