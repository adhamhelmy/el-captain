-- AlterTable
ALTER TABLE "ClientProfile" ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "website" TEXT,
ALTER COLUMN "city" DROP NOT NULL;
