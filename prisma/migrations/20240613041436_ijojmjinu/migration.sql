/*
  Warnings:

  - The values [CANCER_TREATMENT] on the enum `HospitalSpeciality` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "HospitalSpeciality_new" AS ENUM ('SUPER_SPECIALTY', 'MULTI_SPECIALTY', 'FERTILITY', 'EYE_CARE', 'CARDIAC', 'NEPHROLOGY', 'ONCOLOGY', 'GENERAL', 'CHILDRENS_SPECIALTY', 'MATERNITY', 'ORTHOPEDIC', 'NEUROLOGY', 'PSYCHIATRY', 'GERIATRIC', 'DERMATOLOGY', 'GASTROENTEROLOGY', 'PULMONOLOGY', 'RHEUMATOLOGY', 'UROLOGY', 'ENT', 'DENTAL', 'ALLERGY', 'ENDOCRINOLOGY', 'PLASTIC_SURGERY', 'REHABILITATION_CENTER');
ALTER TABLE "hospitals" ALTER COLUMN "speciality" DROP DEFAULT;
ALTER TABLE "hospitals" ALTER COLUMN "speciality" TYPE "HospitalSpeciality_new" USING ("speciality"::text::"HospitalSpeciality_new");
ALTER TYPE "HospitalSpeciality" RENAME TO "HospitalSpeciality_old";
ALTER TYPE "HospitalSpeciality_new" RENAME TO "HospitalSpeciality";
DROP TYPE "HospitalSpeciality_old";
ALTER TABLE "hospitals" ALTER COLUMN "speciality" SET DEFAULT 'GENERAL';
COMMIT;
