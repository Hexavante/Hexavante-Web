# Stack técnica — Hexavante

Documento de referência da arquitetura **implementada** no repositório.

---

## Visão geral

| Camada | Tecnologia | Versão (referência) |
|--------|------------|---------------------|
| Framework | Next.js (App Router) | 16.x |
| Linguagem | TypeScript | 6.x |
| UI | React | 19.x |
| Estilização | Tailwind CSS | 4.x |
| Banco relacional | MariaDB / MySQL | 10.6+ / 8+ |
| ORM | Prisma | 6.x |
| Autenticação | Sessão validada na API (cookie) + token interno (`jose`) | `AUTH_SECRET` |
| Validação | Zod | 4.x |
| Testes | Vitest + Testing Library | 2.x |
| Processamento de imagem | sharp | uploads locais |

---

## Arquitetura em camadas

```
┌─────────────────────────────────────────┐
│           Browser (React 19)             │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│         Next.js 16 — App Router          │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │ RSC / Pages │  │ Server Actions   │  │
│  │ + Client    │  │ + Route Handlers │  │
│  └─────────────┘  └────────┬─────────┘  │
└────────────────────────────┼────────────┘
                             │
┌────────────────────────────▼────────────┐
│              src/services/               │
│        (regras de negócio, orquestração)  │
└────────────────────────────┬────────────┘
                             │
┌────────────────────────────▼────────────┐
│     Prisma Client → MariaDB (mysql)      │
└─────────────────────────────────────────┘
```

### Responsabilidades por pasta

| Pasta | Responsabilidade |
|-------|------------------|
| `src/app/` | Rotas, layouts, páginas, API Routes (`/api/*`) |
| `src/components/` | Componentes de UI (inclui `ui/` estilo shadcn) |
| `src/hooks/` | Hooks client-side (cronômetro, timers) |
| `src/lib/` | Prisma singleton, auth, validações Zod, helpers |
| `src/services/` | Lógica de negócio pura — **sem JSX** |
| `prisma/` | `schema.prisma`, seeds, scripts SQL em `sql/` |
| `public/uploads/` | Arquivos estáticos enviados pelo admin |

---

## Next.js — padrões adotados

- **App Router** com Route Groups: `(main)`, `(auth)`, etc.
- **Server Actions** para formulários (cursos, simulados, moderação).
- **Route Handlers** para uploads (`/api/upload/*`), auth interna (`/api/v1/auth/*`), PDF de certificados.
- **React Server Components** nas páginas de listagem; componentes `"use client"` onde há estado (formulários, cronômetro).

---

## Prisma e banco de dados

- Provider: `mysql` (compatível com MariaDB).
- Schema oficial: `prisma/schema.prisma` — espelha [der-logico.md](der-logico.md).
- Migrations versionadas em `prisma/migrations/` + scripts SQL avulsos em `prisma/sql/` (`db:features`, `db:exam-cover`, etc.).
- Client gerado em `node_modules/.prisma/client` — requer `npx prisma generate` após mudanças no schema.

> Guia completo de setup: [instalacao-e-desenvolvimento.md](instalacao-e-desenvolvimento.md)

---

## Autenticação

Login/senha e OAuth acontecem **na API** (`api.hexavante.com.br`); o web só consome resultado.

| Método | Status |
|--------|--------|
| E-mail + senha | Implementado (na API) |
| OAuth Google | Implementado (na API) |
| OAuth GitHub | Implementado (na API) |
| OAuth Microsoft | Implementado (na API) |
| OAuth Discord | Implementado (na API) |

- Botões sociais em `src/components/auth/oauth-buttons.tsx` → `${API_URL}/oauth/{provider}`; lista de providers vem de `GET {API_URL}/oauth/providers` (`src/lib/oauth.ts`).
- Sessão lida da API: `GET {API_URL}/api/v1/auth/session` (`src/lib/auth-session.ts`) no cookie `__Secure-hexavante.session_token`.
- Rotas próprias `/api/v1/*` assinam/verificam token interno com `AUTH_SECRET` (`src/lib/api-auth.ts`, `src/lib/auth-env.ts`).
- Sessões e papéis RBAC via tabelas `users`, `roles`, `user_roles`.
- Helpers: `isInstructor()`, `canModerate()`, `isAdmin()` em `src/lib/permissions.ts`

---

## Validação (Zod)

Schemas centralizados em `src/lib/validations/`:

| Arquivo | Domínio |
|---------|---------|
| `course.ts` | Cursos, módulos, aulas |
| `exam.ts` | Simulados, questões, correção dissertativa |

Exemplo — questões de múltipla escolha aceitam **2 a 6 alternativas** dinâmicas (`alternatives: string[]`), não mais campos fixos `altA`–`altD`.

---

## Upload de imagens

| Recurso | Endpoint | Pasta pública |
|---------|----------|---------------|
| Capa de curso | `POST /api/upload/course-cover` | `/uploads/courses/` |
| Capa de simulado | `POST /api/upload/exam-cover` | `/uploads/exams/` |
| Imagem de questão | `POST /api/upload/exam-question-image` | `/uploads/exam-questions/` |

- Formatos: JPEG, PNG, WebP — máx. 5 MB
- Redimensionamento com **sharp** (proporção preservada)
- Proteção: instrutor/moderador conforme o recurso

---

## Simulados — recursos implementados

| Recurso | Detalhe técnico |
|---------|-----------------|
| Tipos de questão | `MULTIPLE_CHOICE` \| `ESSAY` (`ExamQuestionType`) |
| Alternativas dinâmicas | 2–6 por questão (`ExamAlternative` N:1 `ExamQuestion`) |
| Imagem na questão | `imageUrl`, `imageWidth`, `imageHeight`, `imageDisplaySize` |
| Tamanho de exibição | Enum `SMALL` \| `MEDIUM` \| `LARGE` \| `FULL` |
| Tempo limite | `Exam.timeLimit` (minutos); cronômetro com `sessionStorage` |
| Dissertativas | Correção manual pelo moderador (`EssayGradeStatus`) |
| Capa do simulado | `Exam.coverImage` |

---

## Economia, loja e premium

| Recurso | Detalhe técnico |
|---------|-----------------|
| Moedas | `User.coins`, transações em `CoinTransaction` |
| Loja | `StoreItem`, `UserInventory`, catálogo em `src/lib/shop-catalog.ts` |
| Categorias | Títulos, molduras, temas, cosméticos, boosters, passes, pacotes de revisão |
| Premium trial | `User.isPremium`, `premiumExpiresAt`; ativação demonstrativa |
| Boosters | `boosterMultiplier` + `boosterExpiresAt` no usuário |

---

## Social e mensagens

| Recurso | Detalhe técnico |
|---------|-----------------|
| Seguidores | `UserFollow` |
| Feed | `SocialActivity` gerado por XP, matrícula, simulados |
| Curtidas | `ActivityLike` |
| DMs | `DirectConversation`, `DirectMessage`; polling 4s |
| Notificações | `Notification` com tipo `NEW_MESSAGE` |

---

## Salas ao vivo

| Recurso | Detalhe técnico |
|---------|-----------------|
| Salas | `LiveRoom`, status `SCHEDULED` / `LIVE` / `ENDED` |
| Chat | `LiveChatMessage` — polling, não WebSocket |

---

## Variáveis de ambiente

```env
# Obrigatórias
DATABASE_URL="mysql://user:pass@host:3306/hexavante"
AUTH_SECRET="..."          # usada pelo código (mesmo nome no .env.example)
NEXT_PUBLIC_API_URL="https://api.hexavante.com.br"
NEXT_PUBLIC_APP_URL="https://app.hexavante.com.br"

# E-mails (Resend)
RESEND_API_KEY=""
RESEND_FROM=""

# Opcional
NEXT_PUBLIC_TUTORIAL_VIDEO_URL="/videos/tutorial.mp4"
AUTH_URL="http://localhost:3000"
```

> O OAuth (Google/Microsoft/GitHub/Discord) é configurado **na API**, não neste repo.

---

## Fora do escopo atual (referência)

| Item | Fase |
|------|------|
| Redis / filas | Fase 2 |
| WebSocket (chat/DMs em tempo real) | Fase 2 — hoje usa polling |
| Upload de vídeo próprio | — (vídeos externos: YouTube/Vimeo) |
| Marketplace de cursos e cobrança recorrente | Fase 2 (compra de moedas e assinatura Hexa já usam Mercado Pago) |
| App mobile/desktop nativos | Feito — `Hexavante-Mobile` e `Hexavante-Desktop` são repos separados |

Escopo do TCC: [escopo-mvp.md](escopo-mvp.md).
