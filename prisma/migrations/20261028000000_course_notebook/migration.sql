CREATE TABLE `notebook_pages` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `course_id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(120) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `version` INTEGER NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `notebook_pages_user_id_course_id_updated_at_idx` (`user_id`, `course_id`, `updated_at`),
  PRIMARY KEY (`id`),
  CONSTRAINT `notebook_pages_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `notebook_pages_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
