/*
  Warnings:

  - You are about to drop the `_RegisterHospital` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_RegisterHospital" DROP CONSTRAINT "_RegisterHospital_A_fkey";

-- DropForeignKey
ALTER TABLE "_RegisterHospital" DROP CONSTRAINT "_RegisterHospital_B_fkey";

-- DropTable
DROP TABLE "_RegisterHospital";

-- CreateTable
CREATE TABLE "_PatientHospitals" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PatientHospitals_AB_unique" ON "_PatientHospitals"("A", "B");

-- CreateIndex
CREATE INDEX "_PatientHospitals_B_index" ON "_PatientHospitals"("B");

-- AddForeignKey
ALTER TABLE "_PatientHospitals" ADD CONSTRAINT "_PatientHospitals_A_fkey" FOREIGN KEY ("A") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PatientHospitals" ADD CONSTRAINT "_PatientHospitals_B_fkey" FOREIGN KEY ("B") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
