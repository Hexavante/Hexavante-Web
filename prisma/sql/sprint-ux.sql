ALTER TABLE `users`
  ADD COLUMN `onboarding_completed_at` DATETIME(3) NULL,
  ADD COLUMN `last_study_course_slug` VARCHAR(191) NULL,
  ADD COLUMN `last_study_lesson_id` VARCHAR(191) NULL,
  ADD COLUMN `last_study_at` DATETIME(3) NULL;

CREATE TABLE `user_achievements` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `achievement_key` VARCHAR(191) NOT NULL,
  `unlocked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `user_achievements_user_id_achievement_key_key` (`user_id`, `achievement_key`),
  INDEX `user_achievements_user_id_idx` (`user_id`),
  CONSTRAINT `user_achievements_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
