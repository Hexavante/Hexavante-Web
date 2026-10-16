-- Garante que avatar_url aceita imagens em base64 (data URL)
ALTER TABLE `users` MODIFY COLUMN `avatar_url` LONGTEXT NULL;
