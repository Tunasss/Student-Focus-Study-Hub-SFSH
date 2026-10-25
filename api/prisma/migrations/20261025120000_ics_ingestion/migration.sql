-- AlterTable
ALTER TABLE `courses` ADD COLUMN `course_key` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `schedules` ADD COLUMN `ends_at_utc` DATETIME(3) NULL,
    ADD COLUMN `exdates` JSON NULL,
    ADD COLUMN `ics_uid` VARCHAR(255) NULL,
    ADD COLUMN `interval_weeks` TINYINT NOT NULL DEFAULT 1,
    ADD COLUMN `starts_at_utc` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `courses_user_id_course_key_key` ON `courses`(`user_id`, `course_key`);

