# Publicação de cursos por instrutores

## Fluxo oficial (dupla moderação)

```
Usuário
  ↓ solicita instrutor (InstructorApplication)
Moderador analisa
  ↓ aprovado → papel INSTRUCTOR
Instrutor cria curso (status: PENDING_REVIEW)
  ↓ opcional: upload de capa (coverImage)
Moderador analisa (CourseModeration)
  ↓ aprovado → status APPROVED
Curso visível no catálogo (/courses)
```

---

## Conteúdo do curso

| Campo | Obrigatório | Observação |
|-------|-------------|------------|
| Título, categoria, descrição | Sim | — |
| Módulos e aulas | Sim | Vídeo via URL externa (YouTube/Vimeo) |
| **Capa (`coverImage`)** | Não | Upload em `/uploads/courses/`; fallback: `thumbnailUrl` legado |
| Nível, carga horária, progressão | Recomendado | `BEGINNER` / `INTERMEDIATE` / `ADVANCED` |

Upload de capa: componente no formulário de criar/editar curso (`/instructor/courses/new`, `/instructor/courses/[id]/edit`). Apenas usuários com papel **INSTRUCTOR** ou **ADMIN**.

---

## Critérios de análise do moderador

- Conformidade com diretrizes da plataforma
- Qualidade mínima do conteúdo
- Correspondência entre descrição e conteúdo entregue
- Ausência de materiais proibidos ou inadequados
- Capa adequada (quando presente)

---

## Resultado da análise

| Resultado | Status no banco | Efeito |
|-----------|-----------------|--------|
| Aprovado | `APPROVED` | Curso publicável no catálogo |
| Reprovado | `REJECTED` | Não visível aos estudantes |
| Devolvido | `REVISION_REQUIRED` | Instrutor corrige e reenvia |

> Somente cursos com `status = APPROVED` aparecem em `/courses`.

---

## Rotas relacionadas

| Rota | Papel |
|------|-------|
| `/instructor/apply` | USER — solicitar instrutor |
| `/instructor/courses` | INSTRUCTOR — listar e editar cursos |
| `/moderacao/instrutores` | MODERATOR — aprovar instrutores |
| `/moderacao/cursos` | MODERATOR — aprovar cursos |

Permissões detalhadas: [permissoes.md](permissoes.md).
