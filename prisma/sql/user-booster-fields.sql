-- Campos de booster temporário no usuário

ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `booster_multiplier` DOUBLE NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS `booster_expires_at` DATETIME(3) NULL;

-- Sincroniza boosters ativos do inventário (migração única)
UPDATE `users` u
INNER JOIN (
  SELECT ui.user_id, MAX(ui.expires_at) AS expires_at
  FROM `user_inventory` ui
  INNER JOIN `store_items` si ON si.id = ui.store_item_id
  WHERE si.category = 'BOOSTER'
    AND ui.is_equipped = true
    AND ui.expires_at > NOW()
  GROUP BY ui.user_id
) active ON active.user_id = u.id
SET
  u.booster_multiplier = 2.0,
  u.booster_expires_at = active.expires_at
WHERE u.booster_expires_at IS NULL OR u.booster_expires_at < active.expires_at;
