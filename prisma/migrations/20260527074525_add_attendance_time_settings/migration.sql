-- AlterTable
ALTER TABLE `AttendanceSetting` ADD COLUMN `earlyCheckinMinutes` INTEGER NOT NULL DEFAULT 30,
    ADD COLUMN `lateGraceMinutes` INTEGER NOT NULL DEFAULT 5;
