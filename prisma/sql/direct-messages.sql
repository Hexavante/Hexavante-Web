-- Mensagens privadas (DMs) estilo Instagram/Twitter

CREATE TABLE IF NOT EXISTS `direct_conversations` (
  `id` VARCHAR(191) NOT NULL,
  `participant_a_id` VARCHAR(191) NOT NULL,
  `participant_b_id` VARCHAR(191) NOT NULL,
  `last_message_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `direct_conversations_participant_a_id_participant_b_id_key` (`participant_a_id`, `participant_b_id`),
  INDEX `direct_conversations_participant_a_id_last_message_at_idx` (`participant_a_id`, `last_message_at`),
  INDEX `direct_conversations_participant_b_id_last_message_at_idx` (`participant_b_id`, `last_message_at`),
  CONSTRAINT `direct_conversations_participant_a_id_fkey` FOREIGN KEY (`participant_a_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `direct_conversations_participant_b_id_fkey` FOREIGN KEY (`participant_b_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `direct_messages` (
  `id` VARCHAR(191) NOT NULL,
  `conversation_id` VARCHAR(191) NOT NULL,
  `sender_id` VARCHAR(191) NOT NULL,
  `body` VARCHAR(2000) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `read_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  INDEX `direct_messages_conversation_id_created_at_idx` (`conversation_id`, `created_at`),
  INDEX `direct_messages_sender_id_idx` (`sender_id`),
  CONSTRAINT `direct_messages_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `direct_conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `direct_messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `notifications`
  MODIFY COLUMN `type` ENUM(
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
    'NEW_MESSAGE'
  ) NOT NULL;
