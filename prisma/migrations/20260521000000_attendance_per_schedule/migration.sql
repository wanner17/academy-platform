-- AttendanceRecord: scheduleId 추가
ALTER TABLE `AttendanceRecord` ADD COLUMN `scheduleId` VARCHAR(191) NULL;

-- 신규 unique 먼저 생성 (studentId leftmost → FK 지원 가능)
CREATE UNIQUE INDEX `AttendanceRecord_studentId_scheduleId_attendanceDate_key` ON `AttendanceRecord`(`studentId`, `scheduleId`, `attendanceDate`);

-- scheduleId 인덱스 추가
CREATE INDEX `AttendanceRecord_scheduleId_idx` ON `AttendanceRecord`(`scheduleId`);

-- 기존 unique 삭제 (신규 인덱스가 studentId FK 지원하므로 안전)
DROP INDEX `AttendanceRecord_studentId_attendanceDate_key` ON `AttendanceRecord`;

-- scheduleId FK 추가
ALTER TABLE `AttendanceRecord` ADD CONSTRAINT `AttendanceRecord_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `Schedule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AttendanceSetting: startTime, endTime 제거
ALTER TABLE `AttendanceSetting` DROP COLUMN `startTime`;
ALTER TABLE `AttendanceSetting` DROP COLUMN `endTime`;
