# Instalação e desenvolvimento

Guia para configurar o ambiente local, sincronizar o banco de dados e contribuir com o projeto.

> **Nota:** a documentação oficial fica em `docs/` (não `doc/`).

---

## Pré-requisitos

| Requisito | Versão mínima |
|-----------|---------------|
| Node.js | 20 LTS |
| npm | 10+ |
| MariaDB | 10.6+ (ou MySQL 8+) |
| Git | Qualquer versão recente |

---

## 1. Clonar e instalar dependências

```bash
git clone <url-do-repositorio> hexavante
cd hexavante
npm install
```

---

## 2. Variáveis de ambiente

Copie o template e preencha os valores:

```bash
cp .env.example .env        # Linux/macOS
copy .env.example .env      # Windows (CMD)
```

### Variáveis obrigatórias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | Conexão MariaDB/MySQL (provider Prisma: `mysql`) | `mysql://root:senha@127.0.0.1:3306/hexavante` |
| `AUTH_SECRET` | Assinatura dos tokens internos das rotas `/api/v1/*` — gere com o comando abaixo (mesmo nome no `.env.example`) | string base64 de 32 bytes |
| `NEXT_PUBLIC_API_URL` | API pública (server + browser) | `http://localhost:3045` (dev) |
| `NEXT_PUBLIC_APP_URL` | URL do app | `http://localhost:3000` (dev) |

Gerar `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### OAuth — configurado na API

Login social (Google, Microsoft, GitHub e Discord) roda inteiro na API
(`Hexavante-api`): credenciais `GOOGLE_*`, `GITHUB_*`, `MICROSOFT_*`, `DISCORD_*`
e redirect `http://localhost:3045/oauth/callback/{provider}` em dev.
Este repo apenas redireciona para `${API_URL}/oauth/{provider}`.

---

## 3. Banco de dados

### Criar o database

O schema Prisma **não cria** o database — apenas as tabelas. Crie manualmente:

```sql
CREATE DATABASE hexavante CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Opção A — desenvolvimento rápido (`db push`)

Sincroniza o `prisma/schema.prisma` diretamente com o banco:

```bash
npx prisma db push
npx prisma generate
npm run db:seed
```

### Opção B — scripts SQL incrementais (ambientes existentes)

O projeto mantém migrations SQL em `prisma/sql/`. Use quando o banco já existe e precisa apenas de colunas novas:

| Script npm | Arquivo SQL | Conteúdo |
|------------|-------------|----------|
| `npm run db:sync` | `add-course-level-columns.sql` | `level`, `estimated_hours` em cursos |
| `npm run db:features` | `course-cover-exam-essay.sql` | Capa de curso, dissertativas, timer |
| `npm run db:exam-cover` | `exam-cover-image.sql` | Capa de simulado |
| `npm run db:exam-questions` | `exam-question-image.sql` + `exam-question-image-size.sql` | Imagem de questão |
| `npm run db:economy` | `economy-shop-premium.sql` | Loja, moedas, premium |
| `npm run db:booster` | `user-booster-fields.sql` | Boosters temporários no usuário |
| `npm run db:social` | `social-features.sql` | Seguidores, feed, curtidas |
| `npm run db:moderation` | `moderation-admin.sql` | Ban, mute, logs admin |
| `npm run db:superadmin` | `superadmin-role.sql` | Papel superadmin |
| `npm run db:exam-daily-rewards` | `exam-daily-reward-fields.sql` | Recompensas diárias de simulado |
| `npm run db:shop-expand` | `shop-expand-categories.sql` | Passes, pacotes de revisão, `isPermanent` |
| `npm run db:direct-messages` | `direct-messages.sql` | Mensagens privadas (DMs) |
| `npm run db:avatar` | `avatar-url-longtext.sql` | Avatar em LONGTEXT |
| `npm run db:certificates` | `certificate-user-course-unique.sql` | Unique certificado por curso |

Execução individual:

```bash
npm run db:exam-cover
npm run db:exam-questions
```

> Se aparecer **Duplicate column**, a migration já foi aplicada — siga para `npx prisma generate`.

### Opção C — Prisma Migrate (fluxo formal)

```bash
npx prisma migrate dev --name descricao_da_mudanca
npx prisma generate
```

---

## 4. Regenerar o Prisma Client

**Sempre** após alterar `prisma/schema.prisma` ou rodar migrations:

```bash
npx prisma generate
```

### Erro `EPERM` no Windows

O arquivo `query_engine-windows.dll.node` fica bloqueado quando o dev server está ativo.

```powershell
# 1. Pare npm run dev (Ctrl+C)
# 2. Regenere
npx prisma generate

# Se ainda falhar:
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Remove-Item -Recurse -Force node_modules\.prisma\client -ErrorAction SilentlyContinue
npx prisma generate
```

> **Sintoma:** `Unknown argument coverImage` ou `Unknown argument imageWidth` em runtime — o client em memória está desatualizado. Pare o servidor, rode `npx prisma generate` e reinicie.

---

## 5. Executar a aplicação

```bash
npm run dev      # http://localhost:3000
```

Outros comandos úteis:

| Comando | Função |
|---------|--------|
| `npm run build` | Build de produção + checagem TypeScript |
| `npm run start` | Servidor de produção (após build) |
| `npm run lint` | ESLint |
| `npm test` | Vitest |
| `npm run db:studio` | Prisma Studio (GUI do banco) |
| `npm run db:seed` | Papéis e dados iniciais |

---

## 6. Contas de demonstração

Após `npm run db:seed`:

| Papel | E-mail | Senha |
|-------|--------|-------|
| Aluno | `aluno@hexavante.com` | `Aluno123!` |
| Instrutor | `instrutor@hexavante.com` | `Instrutor123!` |
| Moderador | `moderador@hexavante.com` | `Moderador123!` |
| Admin | `admin@hexavante.com` | `Admin123!` |

---

## 7. Uploads locais

Arquivos enviados ficam em `public/uploads/`:

| Pasta | Uso | API |
|-------|-----|-----|
| `public/uploads/courses/` | Capa de curso | `POST /api/upload/course-cover` |
| `public/uploads/exams/` | Capa de simulado | `POST /api/upload/exam-cover` |
| `public/uploads/exam-questions/` | Imagem de questão | `POST /api/upload/exam-question-image` |

Processamento com **sharp** (redimensionamento, WebP). Em produção, garanta permissão de escrita nessas pastas.

---

## 8. Estrutura de código (referência rápida)

```
src/
├── app/              # App Router (páginas, layouts, API routes)
├── components/       # Componentes React
├── hooks/            # Hooks customizados (ex.: cronômetro de simulado)
├── lib/              # Prisma, auth, validações Zod, utilitários
└── services/         # Regras de negócio (sem JSX)
prisma/
├── schema.prisma     # Fonte de verdade do modelo (espelha der-logico.md)
└── sql/              # Scripts SQL incrementais
```

---

## 9. Fluxo de contribuição

1. Crie uma branch a partir de `main`.
2. Implemente a mudança seguindo as convenções em [stack.md](stack.md).
3. Se alterar o schema: atualize `prisma/schema.prisma`, rode migration/SQL, `npx prisma generate`.
4. Atualize a documentação em `docs/` quando o comportamento ou o modelo mudar.
5. Rode `npm run build` e `npm test` antes do PR.
6. Descreva migrations manuais necessárias no PR.

---

## 10. Troubleshooting

| Problema | Solução |
|----------|---------|
| `The column X does not exist` | Rode `npx prisma db push` ou o script SQL correspondente em `package.json` |
| `Unknown argument` no Prisma | `npx prisma generate` com dev server **parado** |
| Pré-visualização de imagem não aparece | Verifique blob URL; reinicie o dev server após mudanças no upload |
| OAuth "Access Denied" | Confira `AUTH_URL` e callbacks nos consoles Google/GitHub |
| Porta 3000 em uso | Encerre o processo ou use outra porta: `npm run dev -- -p 3001` |

Deploy em produção: [deploy-producao.md](deploy-producao.md).
