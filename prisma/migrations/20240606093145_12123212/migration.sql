-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "endTime" TEXT NOT NULL DEFAULT '19:20',
ADD COLUMN     "startTime" TEXT NOT NULL DEFAULT '19:00';

-- AlterTable
ALTER TABLE "doctors" ADD COLUMN     "availableEndTime" TEXT NOT NULL DEFAULT '21:00',
ADD COLUMN     "availableStartTime" TEXT NOT NULL DEFAULT '19:00';
