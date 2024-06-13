/*
  Warnings:

  - You are about to drop the column `documentProofs` on the `doctors` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "doctors" DROP COLUMN "documentProofs",
ADD COLUMN     "education" TEXT NOT NULL DEFAULT 'MBBS',
ADD COLUMN     "practicingSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
