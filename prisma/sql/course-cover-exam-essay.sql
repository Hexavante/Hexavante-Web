ALTER TABLE `courses`
  ADD COLUMN `cover_image` VARCHAR(500) NULL AFTER `thumbnail_url`;

UPDATE `courses`
SET `cover_image` = `thumbnail_url`
WHERE `thumbnail_url` IS NOT NULL AND `cover_image` IS NULL;

ALTER TABLE `exam_questions`
  ADD COLUMN `type` ENUM('MULTIPLE_CHOICE', 'ESSAY') NOT NULL DEFAULT 'MULTIPLE_CHOICE' AFTER `points`;

ALTER TABLE `exam_questions`
  ADD COLUMN `expected_answer` TEXT NULL AFTER `type`;

ALTER TABLE `exam_answers`
  MODIFY COLUMN `alternative_id` VARCHAR(191) NULL;

ALTER TABLE `exam_answers`
  ADD COLUMN `essay_answer` TEXT NULL AFTER `alternative_id`;

ALTER TABLE `exam_answers`
  ADD COLUMN `essay_status` ENUM('PENDING', 'CORRECT', 'PARTIAL', 'INCORRECT') NULL AFTER `essay_answer`;

ALTER TABLE `exam_answers`
  ADD COLUMN `essay_comment` TEXT NULL AFTER `essay_status`;
