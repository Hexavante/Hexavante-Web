# DER conceitual (MVP+)

Visão macro das entidades. Nomenclatura oficial: [glossario.md](glossario.md). Detalhamento relacional: [der-logico.md](der-logico.md).

---

## Diagrama de entidades

```
USER
│
├── USER_ROLE → ROLE
├── USER_XP / USER_WALLET
├── COURSE_ENROLLMENT → COURSE
├── LESSON_PROGRESS → LESSON
├── EXAM_ATTEMPT → EXAM
├── CERTIFICATE
└── INSTRUCTOR_APPLICATION

CATEGORY
└── COURSE
    ├── cover_image, thumbnail_url
    ├── COURSE_INSTRUCTOR → USER
    ├── MODULE
    │   ├── LESSON
    │   ├── MATERIAL
    │   └── QUIZ → QUESTION → ALTERNATIVE
    ├── COURSE_MODERATION
    └── CERTIFICATE

EXAM
├── cover_image
├── EXAM_QUESTION
│   ├── type: MULTIPLE_CHOICE | ESSAY
│   ├── image (url + dimensões + display_size)
│   └── EXAM_ALTERNATIVE (2–6, dinâmico)
└── EXAM_ATTEMPT → EXAM_ANSWER

SCHOOL (HexaSchools — referência)
├── SCHOOL_USER
├── SCHOOL_COURSE → SCHOOL_CLASS → SCHOOL_ENROLLMENT
```

---

## Entidades do MVP (implementadas)

| Domínio | Entidades |
|---------|-----------|
| Usuários | `User`, `Role`, `UserRole`, `UserXP`, `UserWallet` |
| Cursos | `Category`, `Course`, `CourseInstructor`, `Module`, `Lesson`, `Material` |
| Matrícula | `CourseEnrollment`, `LessonProgress` |
| Quiz (módulo) | `Quiz`, `Question`, `Alternative`, `QuizAttempt` |
| Simulados | `Exam`, `ExamQuestion`, `ExamAlternative`, `ExamAttempt`, `ExamAnswer` |
| Certificados | `Certificate` |
| Moderação | `InstructorApplication`, `CourseModeration` |
| Notificações | `Notification` |
| Ao vivo | `LiveRoom`, `LiveChatMessage`, `LiveRoomParticipant` |

---

## Simulados — modelo conceitual

```
EXAM (1) ──< EXAM_QUESTION (N)
                │
                ├── type = MULTIPLE_CHOICE ──< EXAM_ALTERNATIVE (2..6)
                │
                └── type = ESSAY (sem alternativas; expected_answer para referência)

EXAM (1) ──< EXAM_ATTEMPT (N) ──< EXAM_ANSWER (N)
                                      ├── alternative_id (MC)
                                      └── essay_answer + essay_status (ESSAY)
```

> Simulados **não** compartilham a tabela de questões do quiz de módulo. Cada `ExamQuestion` pertence a um único `Exam`.

---

## Entidades fora do MVP (Fase 2)

| Entidade | Motivo |
|----------|--------|
| `CourseRating` | Avaliações de alunos |
| `SubscriptionPlan`, marketplace | Monetização real |
| `StoreItem` | Loja de moedas completa |

Não implementar no escopo inicial do TCC — ver [escopo-mvp.md](escopo-mvp.md).
