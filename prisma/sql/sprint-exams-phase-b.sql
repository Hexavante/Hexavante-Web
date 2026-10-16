ALTER TABLE `exam_questions`
  ADD COLUMN `subject` VARCHAR(120) NULL,
  ADD COLUMN `explanation` TEXT NULL,
  ADD COLUMN `difficulty` INT NOT NULL DEFAULT 2;

ALTER TABLE `exam_attempts`
  ADD COLUMN `study_mode` VARCHAR(191) NOT NULL DEFAULT 'FULL';

CREATE TABLE `exam_question_favorites` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `question_id` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `exam_question_favorites_user_id_question_id_key` (`user_id`, `question_id`),
  INDEX `exam_question_favorites_user_id_idx` (`user_id`),
  CONSTRAINT `exam_question_favorites_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `exam_question_favorites_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `exam_questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
