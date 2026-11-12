-- Knowledge-tree columns on topics. The schema gained them in be90814 (WBS 2.3 / multi-file syllabus)
-- without a migration, so `prisma migrate deploy` built databases without them (P2022 on topics.parent_id).

-- AlterTable
ALTER TABLE `topics` ADD COLUMN `parent_id` INTEGER NULL,
    ADD COLUMN `source_file` VARCHAR(255) NULL;

-- CreateIndex: the course_id foreign key needs its own index before the old unique index is dropped.
CREATE INDEX `topics_course_id_idx` ON `topics`(`course_id`);

-- DropIndex
DROP INDEX `topics_course_id_sort_order_key` ON `topics`;

-- CreateIndex
CREATE UNIQUE INDEX `topics_course_id_parent_id_sort_order_key` ON `topics`(`course_id`, `parent_id`, `sort_order`);

-- CreateIndex
CREATE INDEX `topics_parent_id_idx` ON `topics`(`parent_id`);

-- AddForeignKey
ALTER TABLE `topics` ADD CONSTRAINT `topics_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `topics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
