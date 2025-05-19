-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "packageId" INTEGER;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "TourPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
