-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('GROUP', 'PRIVATE');

-- CreateEnum
CREATE TYPE "SessionLevel" AS ENUM ('ALL_LEVELS', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CancelledBy" AS ENUM ('MEMBER', 'COACH', 'ADMIN');

-- CreateEnum
CREATE TYPE "PrivateRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_userId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_classId_fkey";

-- DropForeignKey
ALTER TABLE "SessionRequest" DROP CONSTRAINT "SessionRequest_userId_fkey";

-- DropForeignKey
ALTER TABLE "SessionRequest" DROP CONSTRAINT "SessionRequest_coachId_fkey";

-- DropIndex
DROP INDEX "Booking_userId_classId_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "locale" TEXT;

-- AlterTable
ALTER TABLE "CoachProfile" ADD COLUMN     "privateDuration" INTEGER,
ADD COLUMN     "privatePrice" INTEGER;

-- Old class bookings are test data and point at the dropped Class table.
DELETE FROM "Booking";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "classId",
DROP COLUMN "userId",
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledBy" "CancelledBy",
ADD COLUMN     "memberId" TEXT NOT NULL,
ADD COLUMN     "sessionId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Class";

-- DropTable
DROP TABLE "SessionRequest";

-- DropEnum
DROP TYPE "SessionRequestStatus";

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "mapUrl" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "type" "SessionType" NOT NULL,
    "level" "SessionLevel",
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "seriesId" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateRequest" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "message" TEXT,
    "status" "PrivateRequestStatus" NOT NULL DEFAULT 'PENDING',
    "responseNote" TEXT,
    "respondedAt" TIMESTAMP(3),
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivateRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Venue_coachId_idx" ON "Venue"("coachId");

-- CreateIndex
CREATE INDEX "Session_coachId_startsAt_idx" ON "Session"("coachId", "startsAt");

-- CreateIndex
CREATE INDEX "Session_status_startsAt_idx" ON "Session"("status", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateRequest_sessionId_key" ON "PrivateRequest"("sessionId");

-- CreateIndex
CREATE INDEX "PrivateRequest_coachId_status_idx" ON "PrivateRequest"("coachId", "status");

-- CreateIndex
CREATE INDEX "PrivateRequest_memberId_status_idx" ON "PrivateRequest"("memberId", "status");

-- CreateIndex
CREATE INDEX "Booking_memberId_idx" ON "Booking"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_sessionId_memberId_key" ON "Booking"("sessionId", "memberId");

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateRequest" ADD CONSTRAINT "PrivateRequest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateRequest" ADD CONSTRAINT "PrivateRequest_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateRequest" ADD CONSTRAINT "PrivateRequest_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateRequest" ADD CONSTRAINT "PrivateRequest_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateRequest" ADD CONSTRAINT "PrivateRequest_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

