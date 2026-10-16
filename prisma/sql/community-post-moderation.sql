-- Comunidade: fixar publicações e denúncias

ALTER TABLE `social_activities`
  ADD COLUMN IF NOT EXISTS `is_pinned` BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS `pinned_at` DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS `pinned_by_id` VARCHAR(191) NULL;

CREATE INDEX IF NOT EXISTS `social_activities_is_pinned_pinned_at_idx`
  ON `social_activities` (`is_pinned`, `pinned_at`);

ALTER TABLE `social_activities`
  ADD CONSTRAINT `social_activities_pinned_by_id_fkey`
  FOREIGN KEY (`pinned_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS `community_reports` (
  `id` VARCHAR(191) NOT NULL,
  `activity_id` VARCHAR(191) NOT NULL,
  `reporter_id` VARCHAR(191) NOT NULL,
  `reason` ENUM('SPAM', 'HARASSMENT', 'INAPPROPRIATE', 'MISINFORMATION', 'OTHER') NOT NULL,
  `details` VARCHAR(500) NULL,
  `status` ENUM('PENDING', 'REVIEWED', 'DISMISSED') NOT NULL DEFAULT 'PENDING',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `community_reports_activity_id_reporter_id_key` (`activity_id`, `reporter_id`),
  INDEX `community_reports_status_created_at_idx` (`status`, `created_at`),
  INDEX `community_reports_activity_id_idx` (`activity_id`),
  CONSTRAINT `community_reports_activity_id_fkey` FOREIGN KEY (`activity_id`) REFERENCES `social_activities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `community_reports_reporter_id_fkey` FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
