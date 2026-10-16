ALTER TABLE `instructor_applications`
  ADD COLUMN `review_notes` TEXT NULL AFTER `reviewed_by`;

CREATE TABLE `notifications` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `type` ENUM('XP_EARNED', 'LEVEL_UP', 'COURSE_APPROVED', 'COURSE_REJECTED', 'INSTRUCTOR_APPROVED', 'INSTRUCTOR_REJECTED', 'CERTIFICATE_ISSUED') NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `message` TEXT NOT NULL,
  `link` VARCHAR(191) NULL,
  `read_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `notifications_user_id_read_at_idx` (`user_id`, `read_at`),
  INDEX `notifications_user_id_created_at_idx` (`user_id`, `created_at`),
  CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `xp_transactions_created_at_idx` ON `xp_transactions`(`created_at`);
