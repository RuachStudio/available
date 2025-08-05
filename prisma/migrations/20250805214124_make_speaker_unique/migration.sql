/*
  Warnings:

  - A unique constraint covering the columns `[speaker]` on the table `SpeakerPoll` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SpeakerPoll_speaker_key" ON "public"."SpeakerPoll"("speaker");
