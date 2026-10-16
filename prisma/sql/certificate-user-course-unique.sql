ALTER TABLE `certificates`
  ADD UNIQUE INDEX `certificates_user_id_course_id_key` (`user_id`, `course_id`);
