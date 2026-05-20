ALTER TABLE `Teacher`
  ADD COLUMN `introVideoUrls` TEXT NULL;

UPDATE `Teacher`
SET `introVideoUrls` = `introVideoUrl`
WHERE `introVideoUrl` IS NOT NULL AND `introVideoUrl` <> '';
