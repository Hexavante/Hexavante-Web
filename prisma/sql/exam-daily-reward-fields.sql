ALTER TABLE `exam_attempts`
  ADD COLUMN `daily_attempt_index` INT NULL AFTER `finished_at`,
  ADD COLUMN `daily_reward_multiplier` DOUBLE NULL AFTER `daily_attempt_index`;

CREATE INDEX `exam_attempts_user_finished_at_idx`
  ON `exam_attempts` (`user_id`, `finished_at`);
