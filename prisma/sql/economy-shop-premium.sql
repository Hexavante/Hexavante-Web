-- Economia: Premium, moedas no User, loja e transações

ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `is_premium` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS `premium_expires_at` DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS `coins` INT NOT NULL DEFAULT 0;

UPDATE `users` u
LEFT JOIN `user_wallets` w ON w.user_id = u.id
SET u.coins = GREATEST(u.coins, COALESCE(w.coins, 0))
WHERE w.coins IS NOT NULL AND w.coins > 0;

ALTER TABLE `exams`
  ADD COLUMN IF NOT EXISTS `is_premium_only` BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS `store_items` (
  `id` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NOT NULL,
  `cost` INT NOT NULL DEFAULT 0,
  `category` ENUM('TITLE', 'AVATAR_BORDER', 'THEME', 'COSMETIC', 'BOOSTER') NOT NULL,
  `image_url` VARCHAR(500) NULL,
  `is_premium_only` BOOLEAN NOT NULL DEFAULT false,
  `metadata` JSON NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `store_items_slug_key` (`slug`),
  INDEX `store_items_category_idx` (`category`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_inventory` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `store_item_id` VARCHAR(191) NOT NULL,
  `is_equipped` BOOLEAN NOT NULL DEFAULT false,
  `expires_at` DATETIME(3) NULL,
  `purchased_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `user_inventory_user_id_store_item_id_key` (`user_id`, `store_item_id`),
  INDEX `user_inventory_user_id_idx` (`user_id`),
  CONSTRAINT `user_inventory_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_inventory_store_item_id_fkey` FOREIGN KEY (`store_item_id`) REFERENCES `store_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `coin_transactions` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `amount` INT NOT NULL,
  `type` ENUM('EARN', 'SPEND') NOT NULL,
  `source` ENUM('EXAM_CORRECT', 'SHOP_PURCHASE', 'LESSON', 'MODULE', 'COURSE', 'PREMIUM_GRANT', 'ADMIN') NOT NULL,
  `source_id` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `coin_transactions_user_id_source_source_id_key` (`user_id`, `source`, `source_id`),
  INDEX `coin_transactions_user_id_idx` (`user_id`),
  INDEX `coin_transactions_created_at_idx` (`created_at`),
  CONSTRAINT `coin_transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
