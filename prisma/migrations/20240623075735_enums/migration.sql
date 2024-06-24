-- CreateEnum
CREATE TYPE "MedicationStatus" AS ENUM ('VALID', 'EXPIRED');

-- AlterTable
ALTER TABLE "medications" ADD COLUMN     "status" "MedicationStatus" NOT NULL DEFAULT 'VALID';

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "avatar" TEXT;
