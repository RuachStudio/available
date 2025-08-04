-- CreateTable
CREATE TABLE "public"."Registration" (
    "id" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactAddress" TEXT,
    "prayerRequest" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attendee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "shirtSize" TEXT NOT NULL,
    "notes" TEXT,
    "registrationId" TEXT NOT NULL,

    CONSTRAINT "Attendee_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Attendee" ADD CONSTRAINT "Attendee_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "public"."Registration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
