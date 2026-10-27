-- AlterEnum
ALTER TYPE "PaymentProvider" ADD VALUE 'CASH';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "settledAt" TIMESTAMP(3),
ADD COLUMN "settledById" TEXT;
