ALTER TABLE `Homework` ADD COLUMN `studentId` VARCHAR(191) NULL;
ALTER TABLE `ProgressLog` ADD COLUMN `studentId` VARCHAR(191) NULL;

CREATE INDEX `Homework_academyId_studentId_idx` ON `Homework`(`academyId`, `studentId`);
CREATE INDEX `ProgressLog_academyId_studentId_idx` ON `ProgressLog`(`academyId`, `studentId`);

ALTER TABLE `Homework` ADD CONSTRAINT `Homework_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ProgressLog` ADD CONSTRAINT `ProgressLog_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
