-- AlterTable
ALTER TABLE `Homework` ADD COLUMN `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `startDate` DATETIME(3) NULL;
