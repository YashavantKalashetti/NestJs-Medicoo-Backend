-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "parentId" TEXT;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
