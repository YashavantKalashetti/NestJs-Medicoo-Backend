-- AlterTable
ALTER TABLE "doctors" ADD COLUMN     "attendingHospitalId" TEXT;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_attendingHospitalId_fkey" FOREIGN KEY ("attendingHospitalId") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
