-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "familyDoctorId" TEXT;

-- CreateTable
CREATE TABLE "_PrimaryDoctorAndPatients" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PrimaryDoctorAndPatients_AB_unique" ON "_PrimaryDoctorAndPatients"("A", "B");

-- CreateIndex
CREATE INDEX "_PrimaryDoctorAndPatients_B_index" ON "_PrimaryDoctorAndPatients"("B");

-- AddForeignKey
ALTER TABLE "_PrimaryDoctorAndPatients" ADD CONSTRAINT "_PrimaryDoctorAndPatients_A_fkey" FOREIGN KEY ("A") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PrimaryDoctorAndPatients" ADD CONSTRAINT "_PrimaryDoctorAndPatients_B_fkey" FOREIGN KEY ("B") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
