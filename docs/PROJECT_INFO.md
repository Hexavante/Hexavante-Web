# Hexavante — Informações Cruciais do Projeto

> Última atualização: 2026-08-28
> Repositório principal: `Hexavante/Hexavante` (Web) + `Hexavante/Hexavante-api` (API)

---

## 1. Visão Geral

Plataforma educacional com:
- **Web** Next.js 16 (Turbopack) — `https://app.hexavante.com.br`
- **API** Fastify — `https://api.hexavante.com.br` (local `http://187.127.54.55:3045`)
- **Desktop** Tauri (migração de Electron)
- **Mobile** Capacitor (migração de React Native) — WebView compartilhando mesma UI web

Auth é **sessão pura** (Prisma + bcryptjs, sem framework). OAuth (Google/GitHub) re-implementado manualmente, atualmente **desabilitado** até configurar credenciais no Google Cloud/GitHub.

Comunidade (`/social`, discussões, reações) **completamente removida** de API e Web.

---

## 2. Stack Técnico

| Camada | Tecnologia |
|--------|------------|
| Web | Next.js 16.2.7, React 19, Tailwind, Prisma 6.19.3, Turbopack |
| API | Fastify, Prisma, MySQL, Redis, bcryptjs |
| DB | MySQL 8 (container `hexavante-mysql`), Redis |
| Auth | Sessão custom `src/lib/session.ts` + `src/lib/password.ts` (bcryptjs) |
| Upload | base64 em `LONGTEXT` (`avatar_url`, `banner_url`), Server Actions |
| Deploy | Docker Compose, Nginx, VPS Ubuntu |

---

## 3. Repositórios

- Org GitHub: `Hexavante`
  - `Hexavante` (Web) — `/home/kirsch/Programação/Hexavante-varias-versoes/Hexavante`
  - `Hexavante-api` — `/home/kirsch/Programação/Hexavante-varias-versoes/Hexavante-api`
  - `Hexavante-Desktop` (público, Tauri)
  - `Hexavante-Mobile` (privado, Capacitor)

---

## 4. Infraestrutura e Deploy

### VPS
- **IP:** `187.127.54.55` — user `root`, senha `<REDACTED — ver cofre>`
- **Compose:** `/opt/hexavante/docker-compose.yml` — services `web`, `api`, `mysql`, `redis`
- **Repos no VPS:** `/opt/hexavante/web`, `/opt/hexavante/api`
- **Containers:** `hexavante-web` (3000), `hexavante-api` (3045), `hexavante-mysql`, `hexavante-redis`
- **Nginx:** `proxy_buffer_size 128k; proxy_buffers 4 256k;` (fix 502)

### Deploy Manual
```bash
# Web
cd /opt/hexavante/web && git fetch origin && git reset --hard origin/main
cd /opt/hexavante && docker compose build web && docker compose up -d web

# API
cd /opt/hexavante/api && git pull origin main
cd /opt/hexavante && docker compose build --no-cache api && docker compose up -d api

# Limpeza se faltar espaço
docker builder prune -af
```

### Domínios
- Web prod: `https://app.hexavante.com.br`
- API prod: `https://api.hexavante.com.br`
- Legado (301 → app): `hexavante.com.br`, `www.hexavante.com.br` (`src/middleware.ts:90`)
- Local: `http://localhost:3000` (web), `http://localhost:3045` (api)

---

## 5. Banco de Dados

### MySQL
- **Host:** container `hexavante-mysql`
- **User:** `hexavante` / **Senha:** `<REDACTED — ver cofre>` / **DB:** `hexavante`
- **Conexão local:** via `DATABASE_URL` env

### Prisma Schema Crucial
- `prisma/schema.prisma:12` — `User` model:
  - `id String @id @default(cuid())`
  - `username String? @unique`, `fullName`, `email @unique`, `passwordHash String?`
  - `avatarUrl String? @map("avatar_url") @db.LongText`
  - `bannerUrl String? @map("banner_url") @db.LongText` — **novo (2026-08-28)**
  - `birthDate String? @map("birth_date")` — **varchar(191), não DateTime!** (fix 500)
  - `profileVisibility String @default("private")`, `role String @default("user")`
  - `banned Boolean @default(false)`, `coins Int @default(0)`
- `Category` (`prisma/schema.prisma:329`): `id, name @unique, description, courses[]`
- `Course` (`prisma/schema.prisma:338`): `categoryId String @map("category_id")` (FK obrigatória), `status CourseStatus @default(PENDING_REVIEW)`
- Seed categorias (`prisma/seed.ts:21`): `ENEM`, `Vestibulares`, `Programação`, `Desenvolvimento Web`, `Banco de Dados`, `Matemática`, `Português`

### Usuários Importantes
| User | id | username | Roles | Senha/Hash |
|------|----|----------|-------|------------|
| Nicolas | `tMpmRnH1UsLfQl3UUdV7ZkrYvmvr2sLf` | `nicolasmazzini` | `USER` + `MODERATOR` | OAuth only (sem senha) |
| Moderador | `cmtd77tw1000fs701waic13fh` | `Moderador` | `USER` + `MODERATOR` | seed |
| Teste Login | `teste-login-123` | `testelogin` | `[]` (sem role) | `teste123` |
| Seed | — | `instrutor@hexavante.com` etc. | — | `admin123`/`teacher123`/`mod123`/`user123` (só seed local) |

### Roles
- `USER`, `MODERATOR`, `ADMIN`, `SUPERADMIN`, `INSTRUCTOR` (tabela `roles`, `user_roles`)

---

## 6. Autenticação e Sessão

### Fluxo
- **API:** `POST /api/v1/auth/login`, `/register`, `/logout`, `GET /session` (`src/modules/auth/routes/auth.routes.ts`)
- **Web Server Actions:** `src/app/actions/auth.ts` (`loginAction`, `registerAction`) → `fetch ${API_URL}/api/v1/auth/login` → `cookies().set(...)`
- **Middleware:** `src/middleware.ts:70` — `getSessionUser(cookieHeader)` → `fetch ${API_URL}/api/v1/auth/session` — redireciona pra `/login` se não autenticado
- **Auth helper:** `src/auth.ts:1` → `export { getApiSession as auth } from "@/lib/auth-session"` — `src/lib/auth-session.ts:33`

### Cookie
- Nome: `__Secure-hexavante.session_token`
- Valor: token base64url aleatório (não JWT)
- Opções: `httpOnly: true, secure: prod=true, sameSite: lax, path: /, maxAge: 7d, domain: .hexavante.com.br` (prod)
- `AUTH_SECRET=<REDACTED — ver cofre>`

### OAuth (Desabilitado)
- Config: `Hexavante-api/src/config/oauth.ts` — Google + GitHub, Microsoft placeholder
- Rotas API: `GET /oauth/:provider`, `GET /oauth/callback/:provider`
- Web: `src/lib/oauth.ts` — providers comentados, `src/components/auth/oauth-buttons.tsx` oculto
- **Para habilitar:** descomentar em `src/lib/oauth.ts` + configurar no VPS `docker-compose.yml`
- **Credenciais no VPS:**
  - `GOOGLE_CLIENT_ID=<REDACTED — ver Google Cloud Console>`
  - `GOOGLE_CLIENT_SECRET=<REDACTED — ver Google Cloud Console>`
- **Pendente:** adicionar `https://api.hexavante.com.br/oauth/callback/google` em Google Cloud Console → OAuth 2.0 Client → Authorized redirect URIs (erro `redirect_uri_mismatch` atual)

---

## 7. Sistema de Cargos e Permissões

### Middleware de Rota
- `src/middleware.ts:4` — `MODERATOR_REQUIRED = /^\/moderacao(\/|$)/` — requer `MODERATOR|ADMIN|SUPERADMIN`

### Permissões de Terminal
- `src/lib/moderation/permissions.ts:5` — `PERMISSIONS`:
  ```ts
  addcargo: ["moderador","admin","superadmin"] // liberado pra moderador em 2026-08-28
  removecargo: ["moderador","admin","superadmin"]
  addxp, addmoedas, ban, mute, warn: ["moderador",...]
  removexp, setxp, unban, broadcast: ["admin",...]
  manutencao, impersonate: ["superadmin"]
  ```
- `src/lib/permissions.ts:19` — `canModerate = MODERATOR|ADMIN|SUPERADMIN`, `isAdmin = ADMIN|SUPERADMIN`

### Terminal de Moderação
- Service: `src/services/moderation-admin.service.ts:384` — `executeModerationCommand(raw, moderatorId, roles)`
- API: `POST /api/moderation/terminal` (`src/app/api/moderation/terminal/route.ts`) — **recriado em 2026-08-28** (pasta existia vazia)
- UI: `src/components/moderation/user-table.tsx` — botão "Cargo" → `UserActionModals` → `/addcargo @user ROLE`
- Comandos: `/addcargo @u <cargo>`, `/removecargo`, `/ban`, `/mute`, `/addxp`, etc. (`src/services/moderation-admin.service.ts:900`)

### Instrutores
- Solicitação: `src/app/(main)/instructor/apply/page.tsx`
- Moderação: `src/app/(main)/moderacao/instrutores/page.tsx` — `approveInstructorAction` / `rejectInstructorAction` (`src/app/actions/moderation.ts:66`) — requer `canModerate` (MODERATOR ok)
- Guard: `src/lib/moderation/guards.ts:10` — `requireModeratorAccount` → `canModerate`

---

## 8. Perfil e Social

### Página de Perfil
- Rota: `src/app/(main)/perfil/[username]/page.tsx:13` — `auth()` + `getPublicProfile(username, viewer)` + `listUserEnrollments`
- Service: `src/services/public-profile.service.ts:13` — `getUserByUsername` (select `avatarUrl, bannerUrl`), `getPublicProfile` (xp, rank, followCounts, etc.)
- View: `src/components/profile/public-profile-view.tsx:60` — `hx-profile-card` + `hx-profile-banner` (180px, `background-size: cover` se `bannerUrl`)
- Banner: upload em `src/components/profile/profile-banner-upload.tsx` — 8MB max, base64 `LONGTEXT`
- Foto: `src/components/profile/profile-photo-upload.tsx` — resize client 512px JPEG 0.85, 5MB max, `updateProfilePhotoAction` (`src/app/actions/profile.ts:121`)

### Configurações
- `src/app/(main)/configuracoes/perfil/page.tsx:11` — `getUserProfile` (`src/services/student.service.ts:11` select `avatarUrl, bannerUrl`), `ProfilePhotoUpload` + `ProfileBannerUpload`
- Actions: `src/app/actions/profile.ts` — `updateProfileAction`, `updateProfilePhotoAction`, `updateProfileBannerAction` (8MB), `removeProfileBannerAction`

### CSS
- `src/styles/components.css:708` — `.hx-profile-banner { border-radius, gradient, minHeight 180px }`
- Animações: `src/lib/animations.ts`, `src/styles/animations.css`, `src/lib/theme-ui.ts`

---

## 9. Cursos

- Criação: `src/app/(main)/instructor/courses/new/page.tsx:16` → `listCategories()` → `NewCourseForm` → `CourseFormShell`
- Form: `src/components/courses/course-form-shell.tsx:82` — `<select name="categoryId" required>` com categorias do DB
- Validação: `src/lib/validations/course.ts:9` — `categoryId: z.string().min(1, "Selecione uma categoria")`
- Action: `src/app/actions/course.ts:34` — `createCourseAction` (requer `INSTRUCTOR`)
- Service: `src/services/course.service.ts:93` — `listCategories()`, `createCourse` (FK `categoryId`)

---

## 10. Páginas e Rotas Principais

| Rota | Arquivo | Proteção |
|------|---------|----------|
| `/login`, `/register` | `src/app/(auth)/` | pública |
| `/` (dashboard) | `src/app/(main)/page.tsx` | auth |
| `/perfil/[username]` | `src/app/(main)/perfil/[username]/page.tsx` | auth (middleware) |
| `/perfil` (redirect) | — | auth |
| `/configuracoes/perfil` | `src/app/(main)/configuracoes/perfil/page.tsx` | auth |
| `/instructor/courses` | `src/app/(main)/instructor/courses/page.tsx` | `isInstructor` |
| `/moderacao/*` | `src/app/(main)/moderacao/*` | `MODERATOR|ADMIN|SUPERADMIN` |
| `/moderacao/instrutores` | `src/app/(main)/moderacao/instrutores/page.tsx` | moderador |
| `/moderacao/usuarios` | `src/app/(main)/moderacao/usuarios/page.tsx` | moderador |
| `/moderacao/terminal` | `src/app/(main)/moderacao/terminal/page.tsx` | moderador |
| `/social` | `src/app/(main)/social/page.tsx` | simplificada (sem comunidade) |
| `/api/moderation/*` | `src/app/api/moderation/*` | `canModerate` |
| `/api/v1/auth/*` | `src/app/api/v1/auth/*` | — |

### Error Pages
- `src/app/global-error.tsx`, `src/app/not-found.tsx`, `src/app/error.tsx`

---

## 11. Variáveis de Ambiente

### Web (`/opt/hexavante/web/.env` / `docker-compose.yml`)
- `DATABASE_URL=mysql://...`
- `AUTH_API_URL=https://api.hexavante.com.br` (ou `http://localhost:3045` dev)
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL=https://app.hexavante.com.br`
- `INTERNAL_APP_URL=http://127.0.0.1:3000`
- `WEB_ORIGIN`
- `PORT=3000`, `NODE_ENV=production`

### API (`/opt/hexavante/api/.env`)
- `DATABASE_URL`
- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (se habilitado)
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `NODE_ENV=production`, `PORT=3045`

### Nginx CSP Relevante
```
img-src 'self' data: blob: https://assets.hexavante.com.br https://cdn.discordapp.com https://media.discordapp.net https://avatars.githubusercontent.com https://lh3.googleusercontent.com
connect-src 'self' https://api.hexavante.com.br wss://api.hexavante.com.br
```

---

## 12. Prisma — Migrations Recentes

- **2026-08-28:** `birthDate String?` (era `DateTime? @db.Date`) — fix 500 em `/perfil` (coluna MySQL é `varchar(191)`)
- **2026-08-28:** `bannerUrl String? @map("banner_url") @db.LongText` — `ALTER TABLE users ADD COLUMN banner_url LONGTEXT NULL AFTER avatar_url` (via `prisma.$executeRawUnsafe` no VPS, sem `DATABASE_URL` local)

Gerar client: `npx prisma generate` (local e no Docker `RUN npx prisma generate`)

---

## 13. Correções Recentes (2026-08)

1. **Auth refeito** — Better Auth removido, sessão pura (`src/lib/session.ts`, `src/lib/password.ts`), plugins `authenticate`/`optionalAuth` atualizados
2. **OAuth manual** — sem `arctic`, `oauth.service.ts` + `oauth.routes.ts`, botões desabilitados
3. **Comunidade removida** — deletado `src/modules/community/` (API), 17+ arquivos web (community lib/services/components), `social-feed.tsx` simplificado, sidebar/dashboard sem `/social`
4. **Security audit** — 21 fixes, `proxy_buffer_size` no Nginx
5. **Error pages** — `global-error`, `not-found`, `error`
6. **Profile 500 fix** — `birthDate` alinhado com MySQL `varchar`
7. **Banner** — `bannerUrl` + upload 8MB + display no perfil + link editar só dono
8. **Terminal** — `src/app/api/moderation/terminal/route.ts` recriado, `addcargo` liberado pra moderador
9. **Deploy** — `git fetch && git reset --hard origin/main` (pull falhava), `docker compose build web` + `up -d web`

Commits relevantes: `855854b` (terminal), `8ba0df2` (banner), `ae36f94` (birthDate), `0a8cf99` (comunidade), `aefbfa0` (api)

---

## 14. Pendências e Próximos Passos

- [ ] **OAuth:** configurar `https://api.hexavante.com.br/oauth/callback/google` no Google Cloud + habilitar em `src/lib/oauth.ts`
- [ ] **GitHub OAuth:** callback `https://api.hexavante.com.br/oauth/callback/github`
- [ ] **Tauri:** instalar deps sistema (`sudo apt ...`) pra compilar desktop
- [ ] **Impersonation:** dead code em `user-table.tsx` / `moderation-admin.service.ts` ainda referencia endpoints removidos (falha silenciosa)
- [ ] **Testes:** `cd Hexavante-api && npx vitest run`
- [ ] **Limpeza:** `avatar_url` já `longtext` (ok), verificar `banner_url` em seed

---

## 15. Comandos Úteis

```bash
# Local
npm run dev              # web (3000)
npx prisma generate
npx prisma studio
npx next build           # test build (checagem TS)
npm run db:avatar        # fix coluna avatar se "Data too long"

# VPS
sshpass -p '<REDACTED>' ssh -o StrictHostKeyChecking=no root@187.127.54.55 "docker logs hexavante-web --tail 50"
sshpass -p '<REDACTED>' ssh -o StrictHostKeyChecking=no root@187.127.54.55 "docker exec hexavante-api node -e '...prisma...'"

# CB
npx vitest run
```

---

## 16. Estrutura de Pastas Relevante (Web)

```
src/
  app/
    (auth)/login, register
    (main)/perfil/[username], configuracoes/perfil, moderacao/*, instructor/*
    actions/auth.ts, profile.ts, course.ts, moderation.ts
    api/moderation/terminal, users, logs, stats
    api/v1/auth/*, courses/*
  components/
    auth/oauth-buttons.tsx
    profile/public-profile-view.tsx, profile-photo-upload.tsx, profile-banner-upload.tsx
    moderation/user-table.tsx, action-modals.tsx
    social/social-feed.tsx, activity-*.tsx
  lib/
    auth-session.ts, session.ts, password.ts, oauth.ts, prisma.ts, permissions.ts
    moderation/permissions.ts, moderation/guards.ts
  services/
    public-profile.service.ts, student.service.ts, course.service.ts
    moderation.service.ts, moderation-admin.service.ts
  middleware.ts, auth.ts
prisma/
  schema.prisma, seed.ts
```

---

*Gerado automaticamente — revisar antes de compartilhar externamente (contém segredos de produção).*
