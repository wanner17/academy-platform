-- CreateTable
CREATE TABLE `SchoolExamResult` (
    `id` VARCHAR(191) NOT NULL,
    `academyId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `examType` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `score` INTEGER NULL,
    `grade` INTEGER NULL,
    `examYear` INTEGER NOT NULL,
    `semester` INTEGER NOT NULL,
    `schoolYear` INTEGER NULL,
    `memo` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SchoolExamResult_academyId_studentId_idx`(`academyId`, `studentId`),
    INDEX `SchoolExamResult_academyId_examYear_semester_idx`(`academyId`, `examYear`, `semester`),
    INDEX `SchoolExamResult_academyId_subject_idx`(`academyId`, `subject`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SchoolExamResult` ADD CONSTRAINT `SchoolExamResult_academyId_fkey` FOREIGN KEY (`academyId`) REFERENCES `Academy`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SchoolExamResult` ADD CONSTRAINT `SchoolExamResult_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
