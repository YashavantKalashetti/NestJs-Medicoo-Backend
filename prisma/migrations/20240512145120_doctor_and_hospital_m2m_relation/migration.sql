/*
  Warnings:

  - You are about to drop the column `affiliatedHospitalId` on the `doctors` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "doctors" DROP CONSTRAINT "doctors_affiliatedHospitalId_fkey";

-- AlterTable
ALTER TABLE "doctors" DROP COLUMN "affiliatedHospitalId";

-- CreateTable
CREATE TABLE "_DoctorsHospitals" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_DoctorsHospitals_AB_unique" ON "_DoctorsHospitals"("A", "B");

-- CreateIndex
CREATE INDEX "_DoctorsHospitals_B_index" ON "_DoctorsHospitals"("B");

-- AddForeignKey
ALTER TABLE "_DoctorsHospitals" ADD CONSTRAINT "_DoctorsHospitals_A_fkey" FOREIGN KEY ("A") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DoctorsHospitals" ADD CONSTRAINT "_DoctorsHospitals_B_fkey" FOREIGN KEY ("B") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
