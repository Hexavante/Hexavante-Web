// Executar dentro do container Web. Sem --apply, faz somente diagnóstico.
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

const db = new PrismaClient();
const apply = process.argv.includes("--apply");
const migration = "20261028000000_course_notebook";

try {
  const tables = await db.$queryRaw`
    SELECT TABLE_NAME AS name FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notebook_pages'
  `;
  if (tables.length === 0) {
    console.log("CONFIRMADO: a tabela notebook_pages não existe no banco usado pelo Web.");
    if (!apply) {
      console.log("Nenhuma alteração realizada. Use --apply para criar apenas a tabela do caderno.");
      process.exitCode = 2;
    } else {
      // Conferir os tipos reais antes de adicionar as duas chaves estrangeiras.
      const parents = await db.$queryRaw`
        SELECT c.TABLE_NAME AS name, c.COLUMN_TYPE AS type, c.COLLATION_NAME AS collation, t.ENGINE AS engine
        FROM information_schema.COLUMNS c JOIN information_schema.TABLES t
          ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME
        WHERE c.TABLE_SCHEMA = DATABASE() AND c.TABLE_NAME IN ('users', 'courses') AND c.COLUMN_NAME = 'id'
      `;
      if (parents.length !== 2 || parents.some((p) => p.type.toLowerCase() !== "varchar(191)" || p.collation !== "utf8mb4_unicode_ci" || p.engine.toLowerCase() !== "innodb")) {
        throw new Error("Os tipos ou collations de users/courses diferem da migração. Nenhuma alteração realizada; revisar o schema real.");
      }
      const sql = readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8").trim();
      // Só a migração conhecida, com uma única instrução CREATE TABLE.
      if (!sql.startsWith("CREATE TABLE `notebook_pages` (") || sql.split(";").filter((part) => part.trim()).length !== 1) {
        throw new Error("Arquivo da migração inesperado. Nenhuma alteração realizada.");
      }
      await db.$executeRawUnsafe(sql);
      console.log("Tabela notebook_pages criada. Nenhuma outra migração foi executada.");
    }
  }
  if (tables.length || apply && process.exitCode !== 2) {
    await db.$queryRaw`SELECT id, user_id, course_id, title, content, version, created_at, updated_at FROM notebook_pages WHERE 1 = 0`;
    console.log("OK: tabela e colunas do caderno acessíveis pelo Web. Atualize a página do caderno.");
    console.log(`Se a tabela foi criada manualmente, reconciliar ${migration} com o histórico Prisma após revisar migrate status. Este script não altera _prisma_migrations.`);
  }
} catch (error) {
  // Não imprimir URLs de conexão nem os detalhes de conexão do Prisma.
  console.error("Diagnóstico/reparo não concluído:", error?.code || (error?.name === "Error" ? error.message : "Falha ao acessar o banco. Verifique o log do servidor."));
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
