# Escopo MVP — TCC Hexavante

Documento único e oficial do que será desenvolvido no TCC. Tudo fora desta lista fica em **Fase 2** ou **Fase 3**.

## Objetivo do MVP

Entregar um fluxo completo e demonstrável:

```
Cadastro → Login → Matricular em curso → Assistir aula → Fazer simulado → Ver XP
```

Com moderação de instrutores/cursos e versão básica do HexaSchools.

---

## Priorização

### P0 — Obrigatório (sem isso não há TCC)

| Módulo | Funcionalidades | RF relacionados |
|--------|-----------------|-----------------|
| **Autenticação** | Cadastro, login e-mail/senha, login Google, perfil editável | RF001–RF003, RF006–RF007 |
| **Cursos (core)** | Categorias, cursos, módulos, aulas (vídeo externo), materiais PDF | RF008–RF012, RF013, RF015 |
| **Matrícula** | Inscrição em curso, progresso básico | RF009–RF010 |

**Critério de pronto:** usuário logado navega um curso com módulos/aulas e vê seu progresso.

---

### P1 — Importante (diferencial do projeto)

| Módulo | Funcionalidades | RF relacionados |
|--------|-----------------|-----------------|
| **Simulados** | Múltipla escolha (2–6 alternativas dinâmicas), dissertativas com correção manual, cronômetro com/sem limite, imagem no enunciado com tamanho configurável, capa do simulado, histórico e revisão com gabarito | RF027–RF030, RF048–RF051 |
| **Moderação** | Solicitação de instrutor, aprovação de instrutor, aprovação de curso, correção de dissertativas | RN006–RN010 |
| **Instrutor** | Criar/editar curso com capa (status pendente até aprovação) | RF011–RF012 |

**Critério de pronto:** instrutor aprovado cria curso com capa; moderador aprova; moderador cria simulado com questões MC e dissertativas; aluno realiza simulado com cronômetro e vê resultado/revisão.

---

### P2 — Desejável (se o tempo permitir)

| Módulo | Funcionalidades | RF relacionados |
|--------|-----------------|-----------------|
| **Gamificação** | XP por ações, moedas, ranking simples | RF035 (parcial) |
| **HexaSchools básico** | Instituição, turmas, professores, alunos, cursos institucionais | RF037–RF040 |
| **Certificados** | Emissão básica com código de verificação | RF031, RN015–RN017 |

**Critério de pronto:** escola cria turma com alunos; aluno ganha XP ao concluir aula.

---

### P3 — Stretch (só se P0–P1 estiverem 100%)

| Item | Motivo do corte |
|------|-----------------|
| Avaliações de curso (nota + comentário) | Conflita com tempo; Fase 2 |
| Quiz por módulo com moedas | Simplificar para quiz básico ou simulado apenas |
| Perfil especial de instrutor (métricas) | UI extra; dados podem ser mockados |

---

## Implementado além do escopo MVP original

Estes módulos foram entregues após o escopo inicial do TCC e estão **ativos no código**:

| Módulo | Entregas |
|--------|----------|
| **Loja Hexavante** | Moedas, itens permanentes/temporários, boosters, passes, pacotes de revisão |
| **Premium trial** | Ativação demonstrativa de benefícios premium |
| **Social** | Seguidores, feed de atividades, curtidas |
| **Mensagens privadas** | Inbox, threads 1:1, notificações `NEW_MESSAGE` |
| **Recompensas diárias** | Multiplicador decrescente por simulado no mesmo dia |
| **Moderação avançada** | Ban, mute, impersonate, modo manutenção, superadmin |
| **Salas ao vivo** | Agendamento, participantes, chat de sala |

Documentação técnica: [stack.md](stack.md), [glossario.md](glossario.md).

---

## Fora do MVP (Fase 2 — pós-TCC)

> **Revisão 2026-10-04:** saíram desta lista (hoje implementados) — loja com catálogo e inventário,
> pagamentos reais via Mercado Pago (pacotes de moedas + premium 30d), aulas ao vivo com chat,
> notificações in-app/push/e-mail, login Microsoft e Discord, apps desktop e mobile.

| Funcionalidade | Motivo |
|----------------|--------|
| Marketplace de cursos pagos | Compra individual de curso, split 85/15 (código ainda não existe) |
| Renovação recorrente da assinatura | Premium hoje é recarga de 30d via Mercado Pago, sem auto-renovação |
| WebRTC nas aulas ao vivo | Salas com chat existem; falta transmissão de vídeo |
| Chat em tempo real (WebSocket) | Polling usado em chat ao vivo e DMs |
| Download offline | App mobile + sync |
| Planner (metas e tarefas) | RF021–RF026 |
| Redação e IA | Escopo futuro |
| Correção automática de código | Escopo futuro |

## Fora do MVP (Fase 3 — visão longo prazo)

- IA para redação e correção de código
- Analytics avançado
- Sistema financeiro completo (HexaSchools + marketplace)

---

## Visão final do produto (referência)

Para contexto, a visão completa inclui: Hexavante, HexaSchools, marketplace, simulados, redação, aulas ao vivo, loja, XP, moedas, cursos premium, certificados, IA, apps mobile/desktop.

Isso **não** entra no MVP. Está documentado em [visão-geral.md](visão-geral.md).

---

## Ordem sugerida de implementação

```
Sprint 1  → Auth + User/Role (Prisma)
Sprint 2  → Categorias + Cursos + Módulos + Aulas
Sprint 3  → Matrícula + Progresso
Sprint 4  → Simulados + Tentativas + Dissertativas + Timer
Sprint 5  → Moderação (instrutor + curso + correções)
Sprint 6  → Gamificação (XP básico) + Uploads (capas/imagens)
Sprint 7  → HexaSchools básico (se houver tempo)
```

Setup e migrations: [instalacao-e-desenvolvimento.md](instalacao-e-desenvolvimento.md).

---

## Métricas de sucesso do TCC

1. Demonstração ao vivo do fluxo P0 completo
2. Pelo menos um módulo P1 funcionando (simulados ou moderação)
3. DER implementado no Prisma com migrations
4. Documentação alinhada com o código entregue
