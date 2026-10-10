ALTER TABLE `users`
  ADD COLUMN `registration_intent` VARCHAR(32) NULL,
  ADD COLUMN `registration_preferences` JSON NULL;
