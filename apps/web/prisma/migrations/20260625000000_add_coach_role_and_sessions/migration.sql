-- Add COACH to Role enum
ALTER TYPE "Role" ADD VALUE 'COACH';

-- CreateEnum
CREATE TYPE "SessionRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateTable: CoachProfile
CREATE TABLE "CoachProfile" (
    "id" TEXT NOT NULL,
    "bio" TEXT,
    "specialties" TEXT,
    "city" TEXT,
    "photoUrl" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "phone" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CoachProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CoachProfile_userId_key" ON "CoachProfile"("userId");

ALTER TABLE "CoachProfile" ADD CONSTRAINT "CoachProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: SessionRequest
CREATE TABLE "SessionRequest" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "SessionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionRequest_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SessionRequest" ADD CONSTRAINT "SessionRequest_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SessionRequest" ADD CONSTRAINT "SessionRequest_coachId_fkey"
    FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
