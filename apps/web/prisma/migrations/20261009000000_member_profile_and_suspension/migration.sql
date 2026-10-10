-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "suspendedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "FavouriteSport" (
    "userId" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,

    CONSTRAINT "FavouriteSport_pkey" PRIMARY KEY ("userId","sportId")
);

-- AddForeignKey
ALTER TABLE "FavouriteSport" ADD CONSTRAINT "FavouriteSport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavouriteSport" ADD CONSTRAINT "FavouriteSport_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

