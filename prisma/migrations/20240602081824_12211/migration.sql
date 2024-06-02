/*
  Warnings:

  - You are about to drop the column `attachment` on the `prescriptions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "prescriptions" DROP COLUMN "attachment",
ADD COLUMN     "attachments" TEXT[];
