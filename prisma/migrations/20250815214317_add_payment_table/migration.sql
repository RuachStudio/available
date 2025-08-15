-- DropForeignKey
ALTER TABLE "public"."Attendee" DROP CONSTRAINT "Attendee_registrationId_fkey";

-- DropIndex
DROP INDEX "public"."Attendee_email_key";

-- DropIndex
DROP INDEX "public"."Attendee_phone_key";

-- CreateIndex
CREATE INDEX "Attendee_wantsShirt_shirtSize_idx" ON "public"."Attendee"("wantsShirt", "shirtSize");

-- CreateIndex
CREATE INDEX "Registration_createdAt_idx" ON "public"."Registration"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."Attendee" ADD CONSTRAINT "Attendee_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "public"."Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
