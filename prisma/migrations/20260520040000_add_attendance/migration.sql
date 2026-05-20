CREATE TABLE `AttendanceSetting` (
    `id` VARCHAR(191) NOT NULL,
    `academyId` VARCHAR(191) NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT false,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `radiusMeters` INTEGER NOT NULL DEFAULT 100,
    `startTime` VARCHAR(191) NULL,
    `endTime` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AttendanceSetting_academyId_key`(`academyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AttendanceRecord` (
    `id` VARCHAR(191) NOT NULL,
    `academyId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `attendanceDate` DATETIME(3) NOT NULL,
    `checkedAt` DATETIME(3) NULL,
    `status` ENUM('PRESENT', 'LATE', 'ABSENT', 'EXCUSED') NOT NULL DEFAULT 'PRESENT',
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `accuracyMeters` DOUBLE NULL,
    `distanceMeters` DOUBLE NULL,
    `source` ENUM('STUDENT_LOCATION', 'ADMIN_MANUAL') NOT NULL DEFAULT 'STUDENT_LOCATION',
    `memo` TEXT NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AttendanceRecord_studentId_attendanceDate_key`(`studentId`, `attendanceDate`),
    INDEX `AttendanceRecord_academyId_attendanceDate_status_idx`(`academyId`, `attendanceDate`, `status`),
    INDEX `AttendanceRecord_academyId_studentId_attendanceDate_idx`(`academyId`, `studentId`, `attendanceDate`),
    INDEX `AttendanceRecord_updatedById_idx`(`updatedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `AttendanceSetting` ADD CONSTRAINT `AttendanceSetting_academyId_fkey` FOREIGN KEY (`academyId`) REFERENCES `Academy`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AttendanceRecord` ADD CONSTRAINT `AttendanceRecord_academyId_fkey` FOREIGN KEY (`academyId`) REFERENCES `Academy`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AttendanceRecord` ADD CONSTRAINT `AttendanceRecord_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AttendanceRecord` ADD CONSTRAINT `AttendanceRecord_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
