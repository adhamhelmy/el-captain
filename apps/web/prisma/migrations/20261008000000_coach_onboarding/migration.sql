-- CreateEnum
CREATE TYPE "CoachStatus" AS ENUM ('INCOMPLETE', 'PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SportStatus" AS ENUM ('PENDING', 'APPROVED');

-- AlterTable
ALTER TABLE "CoachProfile" DROP COLUMN "photoUrl",
DROP COLUMN "specialties",
DROP COLUMN "website",
ADD COLUMN     "locale" TEXT,
ADD COLUMN     "photoPath" TEXT,
ADD COLUMN     "status" "CoachStatus" NOT NULL DEFAULT 'INCOMPLETE',
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "tiktok" TEXT;

-- CreateTable
CREATE TABLE "CoachLink" (
    "id" TEXT NOT NULL,
    "coachProfileId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "CoachLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "coachProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sport" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT,
    "key" TEXT NOT NULL,
    "status" "SportStatus" NOT NULL DEFAULT 'APPROVED',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachSport" (
    "coachProfileId" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,

    CONSTRAINT "CoachSport_pkey" PRIMARY KEY ("coachProfileId","sportId")
);

-- CreateTable
CREATE TABLE "CoachStatusEvent" (
    "id" TEXT NOT NULL,
    "coachProfileId" TEXT NOT NULL,
    "from" "CoachStatus",
    "to" "CoachStatus" NOT NULL,
    "reason" TEXT,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachLink_coachProfileId_idx" ON "CoachLink"("coachProfileId");

-- CreateIndex
CREATE INDEX "Certification_coachProfileId_idx" ON "Certification"("coachProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Sport_key_key" ON "Sport"("key");

-- CreateIndex
CREATE INDEX "CoachStatusEvent_coachProfileId_createdAt_idx" ON "CoachStatusEvent"("coachProfileId", "createdAt");

-- AddForeignKey
ALTER TABLE "CoachLink" ADD CONSTRAINT "CoachLink_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "CoachProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "CoachProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachSport" ADD CONSTRAINT "CoachSport_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "CoachProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachSport" ADD CONSTRAINT "CoachSport_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachStatusEvent" ADD CONSTRAINT "CoachStatusEvent_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "CoachProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

