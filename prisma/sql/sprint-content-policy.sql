CREATE TABLE IF NOT EXISTS `content_policy_violations` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NULL,
  `context` VARCHAR(40) NOT NULL,
  `field` VARCHAR(80) NOT NULL,
  `preview` VARCHAR(200) NOT NULL,
  `matched_term` VARCHAR(80) NOT NULL,
  `identifier` VARCHAR(120) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `content_policy_violations_user_id_idx` (`user_id`),
  INDEX `content_policy_violations_created_at_idx` (`created_at`),
  CONSTRAINT `content_policy_violations_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
