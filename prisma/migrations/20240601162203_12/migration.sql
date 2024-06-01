/*
  Warnings:

  - You are about to drop the column `hospitalId` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `mode` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the `_PatientHospitals` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_PatientHospitals" DROP CONSTRAINT "_PatientHospitals_A_fkey";

-- DropForeignKey
ALTER TABLE "_PatientHospitals" DROP CONSTRAINT "_PatientHospitals_B_fkey";

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_hospitalId_fkey";

-- AlterTable
ALTER TABLE "appointments" DROP COLUMN "hospitalId",
DROP COLUMN "mode";

-- DropTable
DROP TABLE "_PatientHospitals";

-- DropEnum
DROP TYPE "AppointmentMode";
