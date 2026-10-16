import { cpSync, existsSync } from "node:fs";
import { join } from "node:path";

const standaloneDir = ".next/standalone";

if (!existsSync(join(standaloneDir, "server.js"))) {
  console.log("[prepare-standalone] Build standalone não encontrado; ignorando.");
  process.exit(0);
}

cpSync(".next/static", join(standaloneDir, ".next/static"), { recursive: true });

if (existsSync("public")) {
  cpSync("public", join(standaloneDir, "public"), { recursive: true });
}

console.log("[prepare-standalone] Arquivos estáticos copiados para .next/standalone");
