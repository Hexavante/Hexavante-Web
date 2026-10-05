# Hexavante — visão geral

## Descrição

A Hexavante é uma plataforma educacional voltada a estudantes do ensino médio técnico, universitários de TI e candidatos ao ENEM e vestibulares.

A plataforma integra cursos com vídeo externo, simulados (objetivos e dissertativos), gamificação (XP e moedas), certificados, loja virtual, comunidade social com mensagens privadas, aulas ao vivo e moderação de conteúdo.

**Stack atual:** Next.js 16, TypeScript, Prisma, MariaDB, sessão validada na API (cookie + `AUTH_SECRET`), Tailwind. Ver [stack.md](stack.md) e [instalacao-e-desenvolvimento.md](instalacao-e-desenvolvimento.md).

---

## Features implementadas (estado atual do código)

| Área | Funcionalidades |
|------|-----------------|
| **Autenticação** | Cadastro, login e-mail/senha, login social (Google, Microsoft, GitHub e Discord — fluxo de OAuth na API), perfil editável, visibilidade pública/privada |
| **Cursos** | Catálogo moderado, módulos, aulas (vídeo externo), capa, progresso, matrícula, histórico de cursos |
| **Simulados** | MC (2–6 alternativas), dissertativas, cronômetro, imagens, capa, histórico, recompensas diárias de XP, maratona de disciplina |
| **Gamificação** | XP, níveis, moedas, ranking, boosters temporários, conquistas com celebração (ex.: Maratona Hexavante) |
| **Loja** | Títulos, molduras, temas, cosméticos, boosters, passes, pacotes de revisão; premium trial |
| **Pagamentos** | Compra de moedas e assinatura Hexa via Mercado Pago (checkout + retorno em `/pagamento/retorno`) |
| **Onboarding** | Abertura animada da marca e tutorial em vídeo com 100 moedas |
| **Social** | Seguidores, feed de atividades, curtidas, player de música flutuante |
| **Mensagens** | DMs privadas 1:1 com inbox e notificações |
| **Ao vivo** | Salas agendadas com chat público |
| **Certificados** | Emissão ao concluir curso, verificação por código (página pública sem login) |
| **Moderação** | Aprovação instrutor/curso, correção dissertativas, ban/mute, painel admin |

Itens ainda **planejados** (não completos): planner de estudos, WebSocket em tempo real, avaliações de curso com nota.

---

## Produtos

### Hexavante

Aplicação destinada aos estudantes.

A plataforma oferece:

* Cursos produzidos pela equipe Hexavante e por instrutores aprovados.
* Aulas gravadas (vídeo externo) e salas ao vivo.
* Simulados com gamificação.
* Loja de itens virtuais e comunidade.
* Plano gratuito com limitações e benefícios premium (trial demonstrativo).

> Escopo do TCC: [escopo-mvp.md](escopo-mvp.md). Índice da documentação: [README.md](README.md).

### HexaSchools

Aplicação destinada a instituições de ensino (projeto separado em `../hexaschools`).

Permite que escolas, faculdades e cursos preparatórios criem e gerenciem seu próprio ambiente educacional.

---

## Público-alvo

* Estudantes do ensino médio técnico.
* Estudantes universitários da área de tecnologia.
* Candidatos ao ENEM e vestibulares.
* Instituições de ensino (via HexaSchools).

---

## Diferenciais

* Plataforma web responsiva (Next.js App Router).
* Sistema integrado de cursos, simulados e gamificação.
* Economia virtual (moedas, loja, boosters) ligada ao estudo.
* Comunidade com feed e mensagens privadas.
* Moderação e RBAC para conteúdo gerado por usuários.
* Modelo SaaS institucional planejado (HexaSchools).

---

## English summary

Hexavante is a student-facing learning platform combining moderated courses, gamified practice exams, XP/coins, a virtual shop, community feed, private messaging, live rooms, certificates, and an admin moderation panel. Built with Next.js 16, Prisma, and MariaDB. Institutional features live in the separate HexaSchools project.
