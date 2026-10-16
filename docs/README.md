# Documentação Hexavante

Índice oficial da documentação do projeto.

> Os arquivos ficam em **`docs/`** (plural). Não existe pasta `doc/` na raiz do repositório.

**Idiomas:** a maioria dos documentos está em português. O [README.md](../README.md) na raiz é **bilíngue (PT/EN)**.

---

## Comece aqui (desenvolvedores)

| Documento | Conteúdo |
|-----------|----------|
| **[instalacao-e-desenvolvimento.md](instalacao-e-desenvolvimento.md)** | Setup local, `.env`, Prisma, migrations, troubleshooting |
| [stack.md](stack.md) | Arquitetura, tecnologias e convenções de código |
| [der-logico.md](der-logico.md) | **DER oficial** — espelho do `prisma/schema.prisma` |
| [deploy-producao.md](deploy-producao.md) | Docker, VPS, Cloudflare Tunnel, DNS no IP próprio |

---

## Produto

| Documento | Conteúdo |
|-----------|----------|
| [visão-geral.md](visão-geral.md) | Descrição, produtos, público-alvo, features implementadas |
| [escopo-mvp.md](escopo-mvp.md) | **Escopo oficial do TCC** (priorização P0–P3) |
| [categorias.md](categorias.md) | Categorias iniciais de cursos |
| [monetizacao.md](monetizacao.md) | Modelo de negócio |
| [publicacao-cursos.md](publicacao-cursos.md) | Fluxo de instrutores, moderação e capa |

---

## Requisitos e regras

| Documento | Conteúdo |
|-----------|----------|
| [requisitos-funcionais.md](requisitos-funcionais.md) | RF001–RF053 + extensões implementadas |
| [casos-de-uso.md](casos-de-uso.md) | UC001–UC071 — fluxos por ator, RF/RN e rotas |
| [regras-de-negocio.md](regras-de-negocio.md) | RN001–RN037 |
| [permissoes.md](permissoes.md) | Papéis, RBAC e matriz de acesso |

---

## Técnico

| Documento | Conteúdo |
|-----------|----------|
| [stack.md](stack.md) | Stack e arquitetura |
| [der-conceitual.md](der-conceitual.md) | Modelo conceitual (visão macro) |
| [der-logico.md](der-logico.md) | DER relacional detalhado |
| [glossario.md](glossario.md) | Nomenclaturas, enums e status |
| [deploy-producao.md](deploy-producao.md) | Deploy com domínio, Docker e Cloudflare |

---

## Módulos implementados (referência rápida)

| Módulo | Rotas / serviços |
|--------|------------------|
| Cursos | `/courses`, `enrollment.service.ts` |
| Simulados | `/simulados`, `exam.service.ts`, recompensas diárias |
| Gamificação | XP, moedas, ranking, boosters |
| Loja | `/shop`, `shop.service.ts`, passes e pacotes de revisão |
| Social | `/social`, seguidores, feed de atividades |
| Mensagens | `/mensagens`, `direct-message.service.ts` |
| Ao vivo | `/live-rooms`, chat de sala |
| Moderação | `/moderacao`, ban/mute, impersonate |
| Certificados | `/certificados`, verificação por código |

---

## Arquivo

| Pasta | Conteúdo |
|-------|----------|
| [archive/](archive/) | Histórico de decisões (referência) |

---

## Manutenção da documentação

Ao implementar uma feature que altere modelo, API ou fluxo de usuário:

1. Atualize `prisma/schema.prisma` e [der-logico.md](der-logico.md).
2. Documente scripts SQL novos em [instalacao-e-desenvolvimento.md](instalacao-e-desenvolvimento.md) e `package.json`.
3. Ajuste [stack.md](stack.md) se mudar arquitetura ou dependências.
4. Registre requisitos novos em [requisitos-funcionais.md](requisitos-funcionais.md) e o fluxo em [casos-de-uso.md](casos-de-uso.md) quando aplicável.
5. Atualize o [README.md](../README.md) se mudar setup, features visíveis ou deploy.
