ALTER TABLE `user_xp`
  ADD COLUMN `league` ENUM('BRONZE', 'SILVER', 'GOLD') NOT NULL DEFAULT 'BRONZE';

CREATE INDEX `user_xp_league_idx` ON `user_xp`(`league`);

CREATE TABLE `ranking_seasons` (
  `season_key` VARCHAR(7) NOT NULL,
  `starts_at` DATETIME(3) NOT NULL,
  `ends_at` DATETIME(3) NOT NULL,
  `processed_at` DATETIME(3) NULL,
  PRIMARY KEY (`season_key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ranking_season_results` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `season_key` VARCHAR(7) NOT NULL,
  `league` ENUM('BRONZE', 'SILVER', 'GOLD') NOT NULL,
  `season_xp` INT NOT NULL DEFAULT 0,
  `final_rank` INT NOT NULL,
  `promoted` BOOLEAN NOT NULL DEFAULT false,
  `demoted` BOOLEAN NOT NULL DEFAULT false,
  `reward_coins` INT NOT NULL DEFAULT 0,
  `reward_claimed_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ranking_season_results_user_id_season_key_key` (`user_id`, `season_key`),
  INDEX `ranking_season_results_season_key_league_idx` (`season_key`, `league`),
  CONSTRAINT `ranking_season_results_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `coin_transactions`
  MODIFY `source` ENUM('EXAM_CORRECT', 'SHOP_PURCHASE', 'LESSON', 'MODULE', 'COURSE', 'PREMIUM_GRANT', 'LEAGUE_REWARD', 'ADMIN') NOT NULL;
