-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_patientId_fkey";

-- AlterTable
ALTER TABLE "appointments" ALTER COLUMN "patientId" DROP NOT NULL,
ALTER COLUMN "doctorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "doctors" ADD COLUMN     "availableForConsult" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "hospitals" ADD COLUMN     "availabeForConsult" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
