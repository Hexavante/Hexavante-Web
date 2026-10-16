ALTER TABLE `social_activities`
  ADD COLUMN `tags` JSON NULL,
  ADD COLUMN `accepted_comment_id` VARCHAR(191) NULL;

ALTER TABLE `social_activities`
  MODIFY `type` ENUM(
    'COURSE_COMPLETED',
    'SIMULADO_PASSED',
    'LEVEL_UP',
    'ACHIEVEMENT',
    'STREAK',
    'DISCUSSION'
  ) NOT NULL;

CREATE INDEX `social_activities_type_created_at_idx` ON `social_activities`(`type`, `created_at`);

ALTER TABLE `activity_comments`
  ADD COLUMN `is_accepted` BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE `activity_reactions` (
  `id` VARCHAR(191) NOT NULL,
  `activity_id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `type` ENUM('CLAP', 'FIRE', 'IDEA') NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `activity_reactions_activity_id_user_id_type_key` (`activity_id`, `user_id`, `type`),
  INDEX `activity_reactions_activity_id_idx` (`activity_id`),
  CONSTRAINT `activity_reactions_activity_id_fkey` FOREIGN KEY (`activity_id`) REFERENCES `social_activities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `activity_reactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `activity_comment_likes` (
  `id` VARCHAR(191) NOT NULL,
  `comment_id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `activity_comment_likes_comment_id_user_id_key` (`comment_id`, `user_id`),
  CONSTRAINT `activity_comment_likes_comment_id_fkey` FOREIGN KEY (`comment_id`) REFERENCES `activity_comments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `activity_comment_likes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `notifications`
  MODIFY `type` ENUM(
    'XP_EARNED',
    'COIN_EARNED',
    'LEVEL_UP',
    'COURSE_APPROVED',
    'COURSE_REJECTED',
    'INSTRUCTOR_APPROVED',
    'INSTRUCTOR_REJECTED',
    'CERTIFICATE_ISSUED',
    'SYSTEM_ANNOUNCEMENT',
    'MODERATION_ACTION',
    'NEW_MESSAGE',
    'COMMUNITY_REPLY',
    'SOLUTION_ACCEPTED'
  ) NOT NULL;
