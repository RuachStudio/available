/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `Attendee` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Attendee` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[contactPhone]` on the table `Registration` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[contactEmail]` on the table `Registration` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Attendee_phone_key" ON "public"."Attendee"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Attendee_email_key" ON "public"."Attendee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_contactPhone_key" ON "public"."Registration"("contactPhone");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_contactEmail_key" ON "public"."Registration"("contactEmail");
