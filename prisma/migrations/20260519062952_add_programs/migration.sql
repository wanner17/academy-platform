-- CreateTable
CREATE TABLE `Program` (
    `id` VARCHAR(191) NOT NULL,
    `academyId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `mode` ENUM('SCHOOL_EXAM', 'LEVEL') NOT NULL,
    `targetLevel` ENUM('ELEMENTARY', 'MIDDLE', 'HIGH') NOT NULL,
    `schoolName` VARCHAR(191) NULL,
    `grade` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Program_academyId_mode_targetLevel_order_idx`(`academyId`, `mode`, `targetLevel`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Program` ADD CONSTRAINT `Program_academyId_fkey` FOREIGN KEY (`academyId`) REFERENCES `Academy`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
