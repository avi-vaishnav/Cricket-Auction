-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PlayerStatus" ADD VALUE 'AVAILABLE';
ALTER TYPE "PlayerStatus" ADD VALUE 'SKIPPED';

-- AlterTable
ALTER TABLE "Auction" ADD COLUMN     "customBidIncrements" JSONB,
ADD COLUMN     "maxBidAmount" DOUBLE PRECISION,
ADD COLUMN     "maxTeams" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "minBidAmount" DOUBLE PRECISION NOT NULL DEFAULT 100,
ADD COLUMN     "minTeams" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "ownerId" TEXT;

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "number" INTEGER,
ADD COLUMN     "photoUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "auctionLimit" INTEGER,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL DEFAULT 'global-settings',
    "loginEnabled" BOOLEAN NOT NULL DEFAULT true,
    "signupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultAuctionLimit" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionState" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "currentPlayerId" TEXT,
    "currentBidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentTeamId" TEXT,
    "currentRound" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'IDLE',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuctionState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "playerId" TEXT,
    "teamId" TEXT,
    "amount" DOUBLE PRECISION,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuctionState_auctionId_key" ON "AuctionState"("auctionId");

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionState" ADD CONSTRAINT "AuctionState_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
