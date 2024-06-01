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
