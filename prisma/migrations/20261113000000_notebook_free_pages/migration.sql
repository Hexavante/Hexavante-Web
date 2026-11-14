-- Caderno: anotações livres (sem curso) e preservação das páginas quando
-- um curso é apagado. Não remove nem altera dados existentes.
ALTER TABLE `notebook_pages` DROP FOREIGN KEY `notebook_pages_course_id_fkey`;

ALTER TABLE `notebook_pages` MODIFY `course_id` VARCHAR(191) NULL;

ALTER TABLE `notebook_pages`
  ADD CONSTRAINT `notebook_pages_course_id_fkey`
  FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
