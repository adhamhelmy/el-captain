-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('PHOTO', 'VIDEO');

-- CreateTable
CREATE TABLE "CoachMedia" (
    "id" TEXT NOT NULL,
    "coachProfileId" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "filePath" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "caption" TEXT,
    "sportId" TEXT,
    "durationSec" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachMedia_coachProfileId_idx" ON "CoachMedia"("coachProfileId");

-- AddForeignKey
ALTER TABLE "CoachMedia" ADD CONSTRAINT "CoachMedia_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "CoachProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachMedia" ADD CONSTRAINT "CoachMedia_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
