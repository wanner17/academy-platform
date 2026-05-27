-- AlterTable
ALTER TABLE `Message` ADD COLUMN `deletedByReceiver` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `deletedBySender` BOOLEAN NOT NULL DEFAULT false;
