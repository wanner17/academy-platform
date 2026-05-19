-- AlterEnum
ALTER TABLE `User` MODIFY `role` ENUM('SUPER_ADMIN', 'ADMIN', 'STAFF', 'TEACHER') NOT NULL DEFAULT 'ADMIN';

-- AlterTable
ALTER TABLE `Teacher` ADD COLUMN `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Program` ADD COLUMN `teacherId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Schedule` ADD COLUMN `programId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Teacher_userId_key` ON `Teacher`(`userId`);

-- CreateIndex
CREATE INDEX `Program_academyId_teacherId_idx` ON `Program`(`academyId`, `teacherId`);

-- CreateIndex
CREATE INDEX `Schedule_academyId_programId_idx` ON `Schedule`(`academyId`, `programId`);

-- AddForeignKey
ALTER TABLE `Teacher` ADD CONSTRAINT `Teacher_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Program` ADD CONSTRAINT `Program_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Teacher`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Schedule` ADD CONSTRAINT `Schedule_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `Program`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
