-- DropForeignKey
ALTER TABLE "prescription_attachments" DROP CONSTRAINT "prescription_attachments_patientId_fkey";

-- DropForeignKey
ALTER TABLE "prescription_attachments" DROP CONSTRAINT "prescription_attachments_prescriptionId_fkey";

-- AddForeignKey
ALTER TABLE "prescription_attachments" ADD CONSTRAINT "prescription_attachments_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_attachments" ADD CONSTRAINT "prescription_attachments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
