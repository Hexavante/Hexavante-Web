-- Social: seguir usuários, feed de atividades, curtidas e comentários

CREATE TABLE IF NOT EXISTS `user_follows` (
  `id` VARCHAR(191) NOT NULL,
  `follower_id` VARCHAR(191) NOT NULL,
  `following_id` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `user_follows_follower_id_following_id_key` (`follower_id`, `following_id`),
  INDEX `user_follows_follower_id_idx` (`follower_id`),
  INDEX `user_follows_following_id_idx` (`following_id`),
  CONSTRAINT `user_follows_follower_id_fkey` FOREIGN KEY (`follower_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_follows_following_id_fkey` FOREIGN KEY (`following_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `social_activities` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `type` ENUM('COURSE_COMPLETED', 'SIMULADO_PASSED', 'LEVEL_UP', 'ACHIEVEMENT', 'STREAK') NOT NULL,
  `source_key` VARCHAR(191) NULL,
  `metadata` JSON NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `social_activities_user_id_source_key_key` (`user_id`, `source_key`),
  INDEX `social_activities_user_id_created_at_idx` (`user_id`, `created_at`),
  INDEX `social_activities_created_at_idx` (`created_at`),
  CONSTRAINT `social_activities_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `activity_likes` (
  `id` VARCHAR(191) NOT NULL,
  `activity_id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `activity_likes_activity_id_user_id_key` (`activity_id`, `user_id`),
  CONSTRAINT `activity_likes_activity_id_fkey` FOREIGN KEY (`activity_id`) REFERENCES `social_activities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `activity_likes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `activity_comments` (
  `id` VARCHAR(191) NOT NULL,
  `activity_id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `content` VARCHAR(500) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `activity_comments_activity_id_idx` (`activity_id`),
  CONSTRAINT `activity_comments_activity_id_fkey` FOREIGN KEY (`activity_id`) REFERENCES `social_activities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `activity_comments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
