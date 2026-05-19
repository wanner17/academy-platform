-- AlterTable
ALTER TABLE `FileAsset` ADD COLUMN `noticeId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `FileAsset_noticeId_idx` ON `FileAsset`(`noticeId`);

-- AddForeignKey
ALTER TABLE `FileAsset` ADD CONSTRAINT `FileAsset_noticeId_fkey` FOREIGN KEY (`noticeId`) REFERENCES `Notice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
