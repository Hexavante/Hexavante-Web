-- Add DailyPlan table for daily study plans
CREATE TABLE `daily_plans` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `plan_date` DATE NOT NULL,
  `tasks` JSON NOT NULL DEFAULT (JSON_ARRAY()),
  `completed_tasks` JSON NOT NULL DEFAULT (JSON_ARRAY()),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `daily_plans_user_id_plan_date_key`(`user_id`, `plan_date`),
  INDEX `daily_plans_user_id_idx`(`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign key
ALTER TABLE `daily_plans` ADD CONSTRAINT `daily_plans_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
