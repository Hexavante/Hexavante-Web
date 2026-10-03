-- AlterTable
ALTER TABLE `coin_transactions` MODIFY `source` ENUM('EXAM_CORRECT', 'SHOP_PURCHASE', 'LESSON', 'MODULE', 'COURSE', 'PREMIUM_GRANT', 'LEAGUE_REWARD', 'ADMIN', 'PAYMENT') NOT NULL;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL DEFAULT 'mercadopago',
    `mp_payment_id` VARCHAR(191) NULL,
    `mp_preference_id` VARCHAR(191) NULL,
    `product_id` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BRL',
    `coins` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `status_detail` VARCHAR(191) NULL,
    `paid_at` DATETIME(3) NULL,
    `raw` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payments_mp_payment_id_key`(`mp_payment_id`),
    INDEX `payments_user_id_idx`(`user_id`),
    INDEX `payments_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

