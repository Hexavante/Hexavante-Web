-- Cargo SUPERADMIN para moderação avançada (impersonate, manutenção)
-- Executar: npm run db:superadmin

INSERT INTO `roles` (`id`, `name`, `description`)
SELECT 'role_superadmin_hexavante', 'SUPERADMIN', 'Controle total da plataforma'
WHERE NOT EXISTS (
  SELECT 1 FROM `roles` WHERE `name` = 'SUPERADMIN'
);
