/*
  Warnings:

  - You are about to drop the column `availabeForConsult` on the `hospitals` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "hospitals" DROP COLUMN "availabeForConsult",
ADD COLUMN     "availableForConsult" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "medications" ADD COLUMN     "numberOfTimes" INTEGER NOT NULL DEFAULT 1;
