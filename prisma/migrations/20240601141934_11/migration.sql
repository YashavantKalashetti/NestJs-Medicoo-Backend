-- CreateEnum
CREATE TYPE "AppointmentMode" AS ENUM ('ONLINE', 'OFFLINE');

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "mode" "AppointmentMode" NOT NULL DEFAULT 'ONLINE';
