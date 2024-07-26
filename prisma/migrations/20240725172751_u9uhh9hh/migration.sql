/*
  Warnings:

  - You are about to drop the column `hospitalDescription` on the `hospitals` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "hospitals" DROP COLUMN "hospitalDescription",
ADD COLUMN     "description" TEXT NOT NULL DEFAULT 'Hospital';
