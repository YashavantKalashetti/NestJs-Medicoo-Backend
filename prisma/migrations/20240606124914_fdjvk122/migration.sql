/*
  Warnings:

  - You are about to drop the column `medicationType` on the `prescriptions` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PrescriptionType" AS ENUM ('NORMAL', 'IMPORTANT');

-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'COMPLETED';

-- AlterTable
ALTER TABLE "prescriptions" DROP COLUMN "medicationType",
ADD COLUMN     "prescriptionType" "PrescriptionType" NOT NULL DEFAULT 'NORMAL';

-- DropEnum
DROP TYPE "MedicationType";
