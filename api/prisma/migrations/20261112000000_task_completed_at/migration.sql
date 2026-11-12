-- WBS 3.4: when a task was completed (analytics: tasks completed per day / range).
-- AlterTable
ALTER TABLE `tasks` ADD COLUMN `completed_at` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `tasks_user_id_completed_at_idx` ON `tasks`(`user_id`, `completed_at`);
