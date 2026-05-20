CREATE TABLE `AcademyGalleryImage` (
  `id` VARCHAR(191) NOT NULL,
  `academyId` VARCHAR(191) NOT NULL,
  `imageUrl` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NULL,
  `description` TEXT NULL,
  `order` INTEGER NOT NULL DEFAULT 0,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `AcademyGalleryImage_academyId_order_idx`(`academyId`, `order`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `AcademyGalleryImage`
  ADD CONSTRAINT `AcademyGalleryImage_academyId_fkey`
  FOREIGN KEY (`academyId`) REFERENCES `Academy`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
