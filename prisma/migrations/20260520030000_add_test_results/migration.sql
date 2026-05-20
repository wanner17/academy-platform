CREATE TABLE `TestResult` (
    `id` VARCHAR(191) NOT NULL,
    `academyId` VARCHAR(191) NOT NULL,
    `programId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `testName` VARCHAR(191) NOT NULL,
    `score` VARCHAR(191) NOT NULL,
    `testedAt` DATETIME(3) NOT NULL,
    `memo` TEXT NULL,
    `isVisible` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TestResult_academyId_programId_testedAt_idx`(`academyId`, `programId`, `testedAt`),
    INDEX `TestResult_academyId_studentId_testedAt_idx`(`academyId`, `studentId`, `testedAt`),
    INDEX `TestResult_academyId_testName_idx`(`academyId`, `testName`),
    INDEX `TestResult_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `TestResult` ADD CONSTRAINT `TestResult_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `Program`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `TestResult` ADD CONSTRAINT `TestResult_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `TestResult` ADD CONSTRAINT `TestResult_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
