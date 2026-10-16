# Glossário de nomenclaturas

Evita ambiguidade entre documentação, banco de dados e código TypeScript/Prisma.

---

## Entidades e termos gerais

| Termo no código | Significado | Não confundir com |
|-----------------|-------------|-------------------|
| `CourseModeration` | Análise do moderador para publicar curso | Avaliação do aluno |
| `CourseRating` | Avaliação do aluno (nota, comentário) — Fase 2 | Moderação |
| `CourseEnrollment` | Inscrição do aluno em curso (Hexavante) | Matrícula institucional |
| `SchoolEnrollment` | Matrícula em turma (HexaSchools) | Inscrição em curso |
| `InstructorApplication` | Solicitação para virar instrutor | — |
| `Course` | Curso da plataforma Hexavante | `SchoolCourse` |
| `SchoolCourse` | Curso institucional (HexaSchools) | `Course` |
| `coverImage` | Capa de curso ou simulado (upload local) | `thumbnailUrl` (legado) |

---

## Simulados — enums e campos

| Enum / campo | Valores | Descrição |
|--------------|---------|-----------|
| `ExamType` | `ENEM`, `VESTIBULAR`, `TECNOLOGIA` | Categoria do simulado |
| `ExamQuestionType` | `MULTIPLE_CHOICE`, `ESSAY` | Tipo da questão |
| `EssayGradeStatus` | `PENDING`, `CORRECT`, `PARTIAL`, `INCORRECT` | Correção de dissertativa |
| `ExamQuestionImageSize` | `SMALL`, `MEDIUM`, `LARGE`, `FULL` | Tamanho de exibição da imagem |
| `Exam.timeLimit` | Inteiro (min) ou `null` | Limite de tempo; `null` = cronômetro progressivo |
| `ExamQuestion.imageUrl` | URL em `/uploads/exam-questions/` | Imagem opcional do enunciado |
| `ExamQuestion.imageWidth/Height` | Inteiros | Dimensões naturais (proporção preservada) |
| `ExamAlternative` | N registros por questão | **2 a 6** alternativas dinâmicas (MC) |

---

## Status de curso (moderação)

| Status | Descrição |
|--------|-----------|
| `PENDING_REVIEW` | Aguardando análise do moderador |
| `APPROVED` | Aprovado e visível no catálogo |
| `REJECTED` | Rejeitado |
| `REVISION_REQUIRED` | Devolvido para correção pelo instrutor |

---

## Status de solicitação de instrutor

| Status | Descrição |
|--------|-----------|
| `PENDING` | Aguardando análise |
| `APPROVED` | Papel `INSTRUCTOR` concedido |
| `REJECTED` | Solicitação negada |

---

## Uploads públicos

| Caminho | Recurso |
|---------|---------|
| `/uploads/courses/` | Capa de curso |
| `/uploads/exams/` | Capa de simulado |
| `/uploads/exam-questions/` | Imagem de questão |

Validação de URL nos schemas Zod restringe caminhos a esses prefixos (segurança).

---

## Loja e economia

| Termo | Significado |
|-------|-------------|
| `StoreItem` | Item vendido na loja (`/shop`) |
| `StoreItemCategory` | `TITLE`, `AVATAR_BORDER`, `THEME`, `COSMETIC`, `BOOSTER`, `PASS`, `REVIEW_PACK` |
| `isPermanent` | Item permanente vs temporário (expira no inventário) |
| `UserInventory` | Itens comprados; `expiresAt` para temporários |
| `CoinTransaction` | Histórico de moedas (`EARN` / `SPEND`) |
| `boosterMultiplier` | Multiplicador ativo no usuário até `boosterExpiresAt` |

---

## Social e mensagens

| Termo | Significado |
|-------|-------------|
| `UserFollow` | Relação seguidor → seguido |
| `SocialActivity` | Evento automático no feed (nível, curso, simulado) |
| `ActivityLike` | Curtida em atividade |
| `DirectConversation` | Conversa privada 1:1 entre dois usuários |
| `DirectMessage` | Mensagem na conversa; `readAt` para leitura |
| `NotificationType.NEW_MESSAGE` | Notificação de nova DM |

---

## Moderação

| Termo | Significado |
|-------|-------------|
| `UserBan` | Suspensão da conta |
| `UserMute` | Silenciamento (sem interagir) |
| `ModerationLog` | Auditoria de ações admin |
