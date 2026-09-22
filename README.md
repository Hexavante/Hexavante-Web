<p align="center">
  <img src="public/brand/hexavante-logo.png" width="120" alt="Hexavante" />
</p>

<h1 align="center">Hexavante Web</h1>

<p align="center">
  <strong>Plataforma educacional principal da Hexavante.</strong><br/>
  <em>Main educational platform: courses, exams, gamification and moderation.</em>
</p>

<p align="center">
  <a href="https://app.hexavante.com.br">🚀 Demo ao vivo</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/MariaDB-11-003545?logo=mariadb&logoColor=white" alt="MariaDB" />
  <img src="https://img.shields.io/badge/Resend-000?logo=resend&logoColor=white" alt="Resend" />
</p>

<p align="center">
  <a href="https://app.hexavante.com.br">Demo</a> · <a href="#funcionalidades">Funcionalidades</a> · <a href="#setup">Setup</a> · <a href="#deploy">Deploy</a> · <a href="docs/visão-geral.md">Docs</a>
</p>

<p align="center">
  <a href="#português">🇧🇷 Português</a> · <a href="#english">🇺🇸 English</a> · <a href="docs/visão-geral.md">Docs</a>
</p>

---

<a id="português"></a>

## Português

### Índice

- [Sobre](#sobre)
- [Arquitetura](#arquitetura)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Rotas principais](#rotas-principais)
- [Setup](#setup)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Scripts](#scripts)
- [Funcionalidades](#funcionalidades)
- [Temas e acessibilidade](#temas-e-acessibilidade)
- [Deploy](#deploy)
- [Solução de problemas](#solução-de-problemas)
- [Como contribuir](#como-contribuir)
- [Ecossistema Hexavante](#ecossistema-hexavante)

### Sobre

App web servido em `app.hexavante.com.br` (porta 3000, Docker standalone). É onde o aluno estuda (cursos, simulados, ranking, loja), o instrutor gerencia conteúdo e o moderador administra a plataforma. Autenticação por sessão validada na API (`__Secure-hexavante.session_token`, domínio `.hexavante.com.br`).

### Arquitetura

```
Navegador ──HTTPS──▶ Nginx ──▶ hexavante-app:3000 (Next.js standalone)
                              │  ├─ Server Components + Server Actions → Prisma → MySQL
                              │  └─ Chamadas à API pública (auth/sessão, rankings)
                              ▼
                    api.hexavante.com.br:3045 (Fastify)
```

Renderização híbrida: páginas de catálogo e painel são dinâmicas (`force-dynamic`); autenticação sempre validada no servidor (`middleware.ts` + layouts).

### Estrutura de pastas

```
src/
├── app/
│   ├── (main)/        # App com sidebar: app, courses, tutorials, simulados,
│   │                  # perfil, ranking, shop, estatisticas, instructor/*,
│   │                  # admin/*, configuracoes/*, live-rooms, certificados...
│   ├── (landing)/     # Páginas públicas sem sidebar: home, cursos, ajuda, hexa
│   └── (auth)/        # login, register, verificar-dispositivo, recuperar-senha
├── app/api/upload/   # Upload de capas (course/exam/tutorial/question)
├── components/        # ui, courses, exams, tutorials, shop, gamification,
│                      # moderation, profile, home, landing, presence, settings
├── services/          # Acesso a dados via Prisma
├── app/actions/       # Server Actions (CRUD, moderação, uploads, segurança)
├── lib/               # auth-session, permissions, cosmetics (temas), rate-limit,
│                      # email (Resend), upload-client, account-switcher, client-device
├── middleware.ts      # Sessão, manutenção, rotas públicas, /admin* (cookie admin)
└── styles/            # themes, components (hx-*), animations, flavors, light-mode
prisma/
├── schema.prisma      # Espelha a API em cobertura (ver docs/der-logico.md)
└── migrations/        # Migrações versionadas do web
```

### Rotas principais

| Rota | Acesso | O quê |
|---|---|---|
| `/app` | Logado | Painel do estudante |
| `/courses`, `/tutorials`, `/simulados` | Mista | Catálogos internos (mesmo estilo) |
| `/instructor/gerenciar` | Instrutor | Criar/editar/excluir conteúdo |
| `/admin/*` | Moderador | Moderação (sessão `hx_admin_session` + código e-mail) |
| `/configuracoes/*` | Logado | Perfil, segurança/2FA, dispositivos, contas, notificações |
| `/login`, `/register`, `/verificar-dispositivo` | Pública | Auth com olhinho, cadastro completo, código de dispositivo |

### Setup

```bash
npm install
cp .env.example .env
npx prisma generate
npm run dev            # http://localhost:3000
```

**Conta de teste:**

| E-mail | Senha |
|---|---|
| `teste@hexavante.com` | `teste123` |

### Variáveis de ambiente

| Variável | Obrigatória | Para que |
|---|---|---|
| `DATABASE_URL` | Sim (`mysql://...` com `%2F` no lugar da `/` da senha) | Banco MySQL/MariaDB |
| `NEXTAUTH_SECRET` | Sim | Assinatura de sessão |
| `NEXT_PUBLIC_API_URL` | Sim | `https://api.hexavante.com.br` |
| `NEXT_PUBLIC_APP_URL` | Sim | `https://app.hexavante.com.br` |
| `NEXT_PUBLIC_LANDING_URL` | Não | `https://hexavante.com.br` |
| `RESEND_API_KEY` | Sim (e-mails) | Envio via Resend |
| `RESEND_FROM` | Sim | Remetente verificado (ex. `Hexavante <seguranca@hexavante.com.br>`) |

### Scripts

| Comando | Para que |
|---|---|
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build de produção (**obrigatório** antes de commitar UI) |
| `npm start` | Roda o standalone |
| `npx prisma migrate dev` | Nova migration (depois espelhar na API) |
| `npx prisma studio` | Visualizar o banco |

### Funcionalidades

| Área | Descrição |
|---|---|
| 🎓 **Cursos** | Catálogo moderado, módulos, aulas em vídeo (YouTube/Vimeo/TeraBox/mp4), progresso, materiais, capas com upload. |
| 🎬 **Tutoriais** | Vídeos curtos da comunidade com miniaturas, views e tags. |
| 📝 **Simulados** | Objetivas + dissertativas (correção manual), cronômetro, imagens, histórico. |
| 🎮 **Gamificação** | XP, níveis, moedas, boosters, loja (13 categorias), inventário, ranking por temporada (fallback all-time), conquistas. |
| 🎖️ **Certificados** | Emissão automática com código verificável + PDF. |
| 💬 **Social/tempo real** | Salas ao vivo com chat, perfis com cosméticos, presença (online/ausente/estudando/não perturbe/invisível). |
| 🔐 **Segurança** | 2FA por e-mail, código em dispositivo novo, multiconta, dispositivos conectados, brute-force limitado. |
| 🛡️ **Moderação** (`/admin`) | Usuários, conteúdo, tutoriais, logs, terminal CLI, broadcast, manutenção. |

### Temas e acessibilidade

16 temas (`src/lib/cosmetics.ts`): 12 escuros com assinatura visual própria + 4 claros (Neve, Luz do Dia, Creme, Pérola) com remap de legibilidade (`theme-light.css`). Fonte Space Grotesk global. Respeite `[data-theme-mode="light"]` em qualquer classe nova com cor hardcoded.

### Deploy

Container `hexavante-app` na VPS (`/opt/hexavante`):

```bash
git fetch origin && git reset --hard origin/main
docker build --no-cache -t hexavante-web .
docker stop hexavante-app && docker rm hexavante-app
docker run -d --name hexavante-app --network hexavante_default -p 3000:3000 \
  -v hexavante_uploads:/app/public/uploads \
  -e DATABASE_URL='...' -e NEXTAUTH_SECRET='...' \
  -e NEXT_PUBLIC_API_URL='https://api.hexavante.com.br' \
  -e NEXT_PUBLIC_APP_URL='https://app.hexavante.com.br' \
  -e RESEND_API_KEY='...' -e RESEND_FROM='...' \
  --restart unless-stopped hexavante-web
```

Verificação: `curl` em `/`, `/login`, `/tutorials` + `docker logs` sem erro.

### Solução de problemas

| Sintoma | Causa provável | Ação |
|---|---|---|
| `Unexpected token ... is not valid JSON` no upload | Rota retornou texto (500) | Ver `docker logs`; rotas de upload sempre retornam JSON |
| Login volta para `/login` | Sessão sem cookie / `Response.ok` true para 202 | Checar `status === 202` antes de `!res.ok`; validar cookie |
| `/admin` volta ao login | `getAdminSession` nulo ou middleware sem cookie admin | Ver sessão `hx_admin_session` e papéis |
| `db push` quer derrubar tabela | Schema divergente | Alinhar com o outro repo, nunca `--accept-data-loss` |
| `Failed to find Server Action` | JS antigo no navegador após deploy | `Ctrl+Shift+R` |

### Como contribuir

1. Branch a partir de `main`, commits curtos em português.
2. `npx next build` verde antes do PR.
3. Mudança de banco? Atualizar os dois schemas + validar `migrate diff` vazio.
4. Nunca commitar `.env`, chaves, senhas ou `node_modules`.

### Ecossistema Hexavante

| Projeto | Repo | Onde roda |
|---|---|---|
| API | [Hexavante-Api](https://github.com/Hexavante/Hexavante-Api) | `api.hexavante.com.br` |
| Landing | [Hexavante-landing](https://github.com/Hexavante/Hexavante-landing) | `hexavante.com.br` |
| Admin | [Hexavante-admin](https://github.com/Hexavante/Hexavante-admin) | `painel.hexavante.com.br` |
| Desktop | [Hexavante-Desktop](https://github.com/Hexavante/Hexavante-Desktop) | app desktop (Electron) |
| Mobile | [Hexavante-Mobile](https://github.com/Hexavante/Hexavante-Mobile) | app mobile (Expo) |

### Documentação técnica (`docs/`)

`visão-geral`, `requisitos-funcionais`, `regras-de-negocio`, `casos-de-uso`, `der-conceitual`, `der-logico`, `glossario`, `stack`, `permissoes`, `instalacao-e-desenvolvimento`, `deploy-producao`, `escopo-mvp` (+ `publicacao-cursos`, `PROJECT_INFO`).

---

<a id="english"></a>

## English (summary)

Main Hexavante web app: Next.js 16 App Router + Tailwind v4 + Prisma/MariaDB, session auth via the API cookie, standalone Docker on `:3000` (`app.hexavante.com.br`). Courses, tutorials, exams, gamification, shop, live rooms, certificates, moderation (`/admin`) and full account security (2FA, devices, multi-account, presence). Build with `npm run build`; see `docs/` (in Portuguese) for the full technical documentation.
