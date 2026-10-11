-- Add LightningChallengeAttempt table for daily lightning challenge minigame
CREATE TABLE `lightning_challenge_attempts` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `challenge_date` DATE NOT NULL,
  `score` INT NOT NULL DEFAULT 0,
  `total_questions` INT NOT NULL DEFAULT 0,
  `time_used_seconds` INT NOT NULL DEFAULT 0,
  `xp_awarded` INT NOT NULL DEFAULT 0,
  `coins_awarded` INT NOT NULL DEFAULT 0,
  `completed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE INDEX `lightning_challenge_attempts_user_id_date_key`(`user_id`, `challenge_date`),
  INDEX `lightning_challenge_attempts_user_id_idx`(`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `lightning_challenge_attempts`
  ADD CONSTRAINT `lightning_challenge_attempts_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
