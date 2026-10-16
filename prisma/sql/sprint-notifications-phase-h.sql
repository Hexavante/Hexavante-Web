ALTER TABLE `notifications`
  MODIFY COLUMN `type` ENUM(
    'XP_EARNED',
    'COIN_EARNED',
    'LEVEL_UP',
    'COURSE_APPROVED',
    'COURSE_REJECTED',
    'COURSE_UPDATED',
    'INSTRUCTOR_APPROVED',
    'INSTRUCTOR_REJECTED',
    'CERTIFICATE_ISSUED',
    'SYSTEM_ANNOUNCEMENT',
    'MODERATION_ACTION',
    'NEW_MESSAGE',
    'COMMUNITY_REPLY',
    'SOLUTION_ACCEPTED'
  ) NOT NULL;

CREATE TABLE IF NOT EXISTS `user_notification_settings` (
  `user_id` VARCHAR(191) NOT NULL,
  `learning_progress` BOOLEAN NOT NULL DEFAULT true,
  `certificates` BOOLEAN NOT NULL DEFAULT true,
  `course_updates` BOOLEAN NOT NULL DEFAULT true,
  `messages` BOOLEAN NOT NULL DEFAULT true,
  `community` BOOLEAN NOT NULL DEFAULT true,
  `moderation` BOOLEAN NOT NULL DEFAULT true,
  `coins_and_rewards` BOOLEAN NOT NULL DEFAULT true,
  `ranking_season` BOOLEAN NOT NULL DEFAULT true,
  `system_announcements` BOOLEAN NOT NULL DEFAULT true,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`user_id`),
  CONSTRAINT `user_notification_settings_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
