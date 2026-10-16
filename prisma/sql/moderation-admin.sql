-- Moderação admin: bans, mutes, warnings, logs, platform settings
-- Executar: npm run db:moderation

ALTER TABLE `xp_transactions` MODIFY COLUMN `source` ENUM('LESSON','MODULE','COURSE','EXAM','ADMIN') NOT NULL;

ALTER TABLE `notifications` MODIFY COLUMN `type` ENUM(
  'XP_EARNED','COIN_EARNED','LEVEL_UP',
  'COURSE_APPROVED','COURSE_REJECTED',
  'INSTRUCTOR_APPROVED','INSTRUCTOR_REJECTED',
  'CERTIFICATE_ISSUED','SYSTEM_ANNOUNCEMENT','MODERATION_ACTION'
) NOT NULL;

CREATE TABLE IF NOT EXISTS `user_bans` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `moderator_id` VARCHAR(191) NOT NULL,
  `reason` TEXT NOT NULL,
  `expires_at` DATETIME(3) NULL,
  `lifted_at` DATETIME(3) NULL,
  `lifted_by_id` VARCHAR(191) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `user_bans_user_id_is_active_idx` (`user_id`, `is_active`),
  INDEX `user_bans_created_at_idx` (`created_at`),
  CONSTRAINT `user_bans_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `user_bans_moderator_id_fkey` FOREIGN KEY (`moderator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_mutes` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `moderator_id` VARCHAR(191) NOT NULL,
  `reason` TEXT NOT NULL,
  `expires_at` DATETIME(3) NULL,
  `lifted_at` DATETIME(3) NULL,
  `lifted_by_id` VARCHAR(191) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `user_mutes_user_id_is_active_idx` (`user_id`, `is_active`),
  INDEX `user_mutes_created_at_idx` (`created_at`),
  CONSTRAINT `user_mutes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `user_mutes_moderator_id_fkey` FOREIGN KEY (`moderator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_warnings` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `moderator_id` VARCHAR(191) NOT NULL,
  `reason` TEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `user_warnings_user_id_idx` (`user_id`),
  INDEX `user_warnings_created_at_idx` (`created_at`),
  CONSTRAINT `user_warnings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `user_warnings_moderator_id_fkey` FOREIGN KEY (`moderator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `moderation_logs` (
  `id` VARCHAR(191) NOT NULL,
  `moderator_id` VARCHAR(191) NOT NULL,
  `target_user_id` VARCHAR(191) NULL,
  `action` ENUM(
    'XP_ADD','XP_REMOVE','XP_SET','LEVEL_SET',
    'COIN_ADD','COIN_REMOVE','COIN_SET',
    'ROLE_ADD','ROLE_REMOVE',
    'BAN','UNBAN','MUTE','UNMUTE','WARN',
    'BROADCAST','MAINTENANCE','GLOBAL_BOOSTER',
    'COURSE_PUBLISH','COURSE_UNPUBLISH','EXAM_RESET',
    'PASSWORD_RESET','IMPERSONATE','OTHER'
  ) NOT NULL,
  `description` TEXT NOT NULL,
  `metadata` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `moderation_logs_moderator_id_idx` (`moderator_id`),
  INDEX `moderation_logs_target_user_id_idx` (`target_user_id`),
  INDEX `moderation_logs_action_idx` (`action`),
  INDEX `moderation_logs_created_at_idx` (`created_at`),
  CONSTRAINT `moderation_logs_moderator_id_fkey` FOREIGN KEY (`moderator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `moderation_logs_target_user_id_fkey` FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `platform_settings` (
  `key` VARCHAR(191) NOT NULL,
  `value` JSON NOT NULL,
  `updated_at` DATETIME(3) NOT NULL,
  `updated_by_id` VARCHAR(191) NULL,
  PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
