-- CreateEnum
CREATE TYPE "AppointmentMode" AS ENUM ('ONLINE', 'OFFLINE');

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "hospitalId" TEXT,
ADD COLUMN     "mode" "AppointmentMode" NOT NULL DEFAULT 'ONLINE';

-- CreateTable
CREATE TABLE "_RegisterHospital" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_RegisterHospital_AB_unique" ON "_RegisterHospital"("A", "B");

-- CreateIndex
CREATE INDEX "_RegisterHospital_B_index" ON "_RegisterHospital"("B");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RegisterHospital" ADD CONSTRAINT "_RegisterHospital_A_fkey" FOREIGN KEY ("A") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RegisterHospital" ADD CONSTRAINT "_RegisterHospital_B_fkey" FOREIGN KEY ("B") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
