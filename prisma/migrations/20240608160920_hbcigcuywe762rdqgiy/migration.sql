-- CreateTable
CREATE TABLE "medical_details" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "bloodGroup" TEXT NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "allergies" TEXT[],
    "medicalHistory" TEXT[],
    "systolic" INTEGER NOT NULL,
    "diastolic" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "medical_details_patientId_key" ON "medical_details"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "medical_details_id_patientId_key" ON "medical_details"("id", "patientId");

-- AddForeignKey
ALTER TABLE "medical_details" ADD CONSTRAINT "medical_details_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
