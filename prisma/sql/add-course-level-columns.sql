-- Adiciona colunas de curso usadas pelo schema atual (sem remover tabelas legadas)
ALTER TABLE `courses`
  ADD COLUMN `level` ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED') NOT NULL DEFAULT 'BEGINNER',
  ADD COLUMN `estimated_hours` INT NULL;
