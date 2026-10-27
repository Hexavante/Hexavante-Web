-- Smart Notes: favoritos na biblioteca central de anotações.
-- Aplicar ANTES de subir o serviço Go que lê/escreve `is_favorite`.
ALTER TABLE `lesson_notes`
  ADD COLUMN `is_favorite` BOOLEAN NOT NULL DEFAULT false AFTER `content`;

CREATE INDEX `lesson_notes_user_id_is_favorite_idx` ON `lesson_notes`(`user_id`, `is_favorite`);
