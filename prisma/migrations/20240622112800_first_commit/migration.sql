-- CreateEnum
CREATE TYPE "PrescriptionType" AS ENUM ('NORMAL', 'IMPORTANT');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('NORMAL', 'EMERGENCY', 'COMPLETED', 'CANCLED');

-- CreateEnum
CREATE TYPE "AppointmentMode" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "DoctorSpecialization" AS ENUM ('GENERAL_PRACTITIONER', 'ANESTHESIOLOGIST', 'CARDIOLOGIST', 'DERMATOLOGIST', 'EMERGENCY_MEDICINE_PHYSICIAN', 'ENDOCRINOLOGIST', 'FAMILY_MEDICINE_PHYSICIAN', 'GASTROENTEROLOGIST', 'GERIATRICIAN', 'GYNECOLOGIST', 'HEMATOLOGIST', 'INFECTIOUS_DISEASE_SPECIALIST', 'INTERNIST', 'NEONATOLOGIST', 'NEPHROLOGIST', 'NEUROLOGIST', 'OBSTETRICIAN_GYNECOLOGIST', 'ONCOLOGIST', 'OPHTHALMOLOGIST', 'ORTHOPEDIC_SURGEON', 'OTOLARYNGOLOGIST', 'PEDIATRICIAN', 'PHYSICAL_MEDICINE_REHABILITATION_PHYSICIAN', 'PLASTIC_SURGEON', 'PSYCHIATRIST', 'PULMONOLOGIST', 'RADIOLOGIST', 'RHEUMATOLOGIST', 'SURGEON', 'UROLOGIST', 'ALLERGIST_IMMUNOLOGIST', 'INFECTIOUS_DISEASE_PHYSICIAN');

-- CreateEnum
CREATE TYPE "HospitalSpeciality" AS ENUM ('SUPER_SPECIALTY', 'MULTI_SPECIALTY', 'FERTILITY', 'EYE_CARE', 'CARDIAC', 'NEPHROLOGY', 'ONCOLOGY', 'GENERAL', 'MATERNITY', 'ORTHOPEDIC', 'NEUROLOGY', 'PSYCHIATRY', 'PEDIATRIC', 'GERIATRIC', 'DERMATOLOGY', 'GASTROENTEROLOGY', 'PULMONOLOGY', 'RHEUMATOLOGY', 'UROLOGY', 'ENT', 'DENTAL', 'ALLERGY', 'ENDOCRINOLOGY', 'PLASTIC_SURGERY', 'REHABILITATION_CENTER');

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "patient_number" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "aadharNumber" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "email" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "password" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "doctors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "doctor_number" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "email" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "password" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "avatar" TEXT,
    "consultingFees" INTEGER NOT NULL DEFAULT 500,
    "availableStartTime" TEXT NOT NULL DEFAULT '19:00',
    "availableEndTime" TEXT NOT NULL DEFAULT '21:00',
    "availableForConsult" BOOLEAN NOT NULL DEFAULT false,
    "specialization" "DoctorSpecialization" NOT NULL DEFAULT 'GENERAL_PRACTITIONER',
    "practicingSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "education" TEXT NOT NULL DEFAULT 'MBBS',
    "attendingHospitalId" TEXT,
    "totalAppointments" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospitals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hospital_number" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "speciality" "HospitalSpeciality" NOT NULL DEFAULT 'GENERAL',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "availableForConsult" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hospitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attachments" TEXT[],
    "instructionForOtherDoctor" TEXT,
    "prescriptionType" "PrescriptionType" NOT NULL DEFAULT 'NORMAL',
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "medicine" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "numberOfTimes" INTEGER NOT NULL DEFAULT 1,
    "numberOfDays" INTEGER NOT NULL DEFAULT 1,
    "validTill" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "doctorId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'NORMAL',
    "mode" "AppointmentMode" NOT NULL DEFAULT 'ONLINE',
    "hospitalId" TEXT,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platforms" (
    "id" TEXT NOT NULL,
    "totalPrescriptions" INTEGER NOT NULL DEFAULT 0,
    "totalAppointments" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_attachments" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescription_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DoctorsHospitals" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_PatientHospitals" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "patients_patient_number_key" ON "patients"("patient_number");

-- CreateIndex
CREATE UNIQUE INDEX "patients_aadharNumber_key" ON "patients"("aadharNumber");

-- CreateIndex
CREATE UNIQUE INDEX "patients_email_key" ON "patients"("email");

-- CreateIndex
CREATE UNIQUE INDEX "medical_details_patientId_key" ON "medical_details"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "medical_details_id_patientId_key" ON "medical_details"("id", "patientId");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_doctor_number_key" ON "doctors"("doctor_number");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_email_key" ON "doctors"("email");

-- CreateIndex
CREATE UNIQUE INDEX "hospitals_hospital_number_key" ON "hospitals"("hospital_number");

-- CreateIndex
CREATE UNIQUE INDEX "hospitals_email_key" ON "hospitals"("email");

-- CreateIndex
CREATE UNIQUE INDEX "prescription_attachments_url_key" ON "prescription_attachments"("url");

-- CreateIndex
CREATE UNIQUE INDEX "_DoctorsHospitals_AB_unique" ON "_DoctorsHospitals"("A", "B");

-- CreateIndex
CREATE INDEX "_DoctorsHospitals_B_index" ON "_DoctorsHospitals"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PatientHospitals_AB_unique" ON "_PatientHospitals"("A", "B");

-- CreateIndex
CREATE INDEX "_PatientHospitals_B_index" ON "_PatientHospitals"("B");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_details" ADD CONSTRAINT "medical_details_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_attendingHospitalId_fkey" FOREIGN KEY ("attendingHospitalId") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_attachments" ADD CONSTRAINT "prescription_attachments_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_attachments" ADD CONSTRAINT "prescription_attachments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DoctorsHospitals" ADD CONSTRAINT "_DoctorsHospitals_A_fkey" FOREIGN KEY ("A") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DoctorsHospitals" ADD CONSTRAINT "_DoctorsHospitals_B_fkey" FOREIGN KEY ("B") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PatientHospitals" ADD CONSTRAINT "_PatientHospitals_A_fkey" FOREIGN KEY ("A") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PatientHospitals" ADD CONSTRAINT "_PatientHospitals_B_fkey" FOREIGN KEY ("B") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
