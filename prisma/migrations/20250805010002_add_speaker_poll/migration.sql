-- CreateTable
CREATE TABLE "public"."SpeakerPoll" (
    "id" SERIAL NOT NULL,
    "speaker" TEXT NOT NULL,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpeakerPoll_pkey" PRIMARY KEY ("id")
);
