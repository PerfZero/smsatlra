-- CreateTable
CREATE TABLE "TourPackage" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "images" TEXT[],
    "duration" TEXT NOT NULL,
    "flight" TEXT NOT NULL,
    "hotelMeccaName" TEXT NOT NULL,
    "hotelMeccaDistance" TEXT NOT NULL,
    "hotelMedinaName" TEXT NOT NULL,
    "hotelMedinaDistance" TEXT NOT NULL,
    "transfer" TEXT NOT NULL,
    "food" TEXT NOT NULL,
    "additionalServices" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourPackage_pkey" PRIMARY KEY ("id")
);
