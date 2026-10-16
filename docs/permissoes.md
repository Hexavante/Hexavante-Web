# Papéis e permissões

## Hexavante (plataforma)

| Papel | Código | Descrição |
|-------|--------|-----------|
| Estudante | `USER` | Acesso padrão: cursos, simulados, perfil, XP |
| Instrutor | `INSTRUCTOR` | Cria e edita cursos (após aprovação) |
| Moderador | `MODERATOR` | Aprova instrutores, cursos e simulados; corrige dissertativas |
| Administrador | `ADMIN` | Administração geral; herda capacidades de instrutor e moderador |

Um usuário pode ter **múltiplos papéis** simultaneamente (RBAC N:N via `user_roles`).

Helpers no código (`src/lib/permissions.ts`):

| Função | Papéis aceitos |
|--------|----------------|
| `isInstructor()` | `INSTRUCTOR`, `ADMIN` |
| `canModerate()` | `MODERATOR`, `ADMIN` |
| `isAdmin()` | `ADMIN` |

---

## Matriz de acesso — recursos principais

| Recurso | USER | INSTRUCTOR | MODERATOR | ADMIN |
|---------|:----:|:----------:|:---------:|:-----:|
| Ver cursos aprovados | ✓ | ✓ | ✓ | ✓ |
| Matricular / estudar | ✓ | ✓ | ✓ | ✓ |
| Fazer simulados | ✓ | ✓ | ✓ | ✓ |
| Criar/editar curso | — | ✓ | ✓ | ✓ |
| Upload capa de curso | — | ✓ | ✓ | ✓ |
| Solicitar papel instrutor | ✓ | — | — | — |
| Aprovar instrutores/cursos | — | — | ✓ | ✓ |
| Criar/editar simulados | — | — | ✓ | ✓ |
| Upload capa/imagem de simulado | — | — | ✓ | ✓ |
| Corrigir questões dissertativas | — | — | ✓ | ✓ |
| Painel `/moderacao/*` | — | — | ✓ | ✓ |

---

## Upload de arquivos

| Endpoint | Permissão |
|----------|-----------|
| `POST /api/upload/course-cover` | `isInstructor()` |
| `POST /api/upload/exam-cover` | `canModerate()` |
| `POST /api/upload/exam-question-image` | `canModerate()` |

Arquivos são servidos apenas de `public/uploads/{courses,exams,exam-questions}/`.

---

## HexaSchools (institucional)

Projeto separado (`../hexaschools`). Hierarquia de referência:

```
Diretor
 └── Administrador
      └── Coordenador
           ├── Professor
           └── Aluno
```

Detalhes de papéis institucionais permanecem na visão de produto; não confundir com papéis da plataforma Hexavante (`USER`, `INSTRUCTOR`, etc.).

---

## Regras de relacionamento (institucional)

- Um aluno pode estar em **várias turmas/cursos** institucionais simultaneamente
- Um professor pode atuar em **várias turmas**
- Coordenador cria o curso institucional; professor produz as aulas
