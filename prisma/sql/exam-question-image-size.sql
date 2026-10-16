ALTER TABLE `exam_questions`
  ADD COLUMN `image_width` INT NULL AFTER `image_url`,
  ADD COLUMN `image_height` INT NULL AFTER `image_width`,
  ADD COLUMN `image_display_size` ENUM('SMALL', 'MEDIUM', 'LARGE', 'FULL') NULL DEFAULT 'MEDIUM' AFTER `image_height`;
