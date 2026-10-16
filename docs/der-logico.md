# DER lógico (oficial)

Espelho do `prisma/schema.prisma`. Convenções: **PK** = chave primária, **FK** = chave estrangeira.

> **Correção v1.1:** `COURSE_REVIEWS` renomeado para `COURSE_MODERATIONS`.  
> **Atualização v1.2:** modelo de simulados independente (não referencia quiz); suporte a dissertativas, imagens e alternativas dinâmicas.

---

## Módulo de usuários

### USERS

```
PK id
username UNIQUE
full_name, email UNIQUE
password_hash (nullable — OAuth)
provider, provider_id
avatar_url (LONGTEXT)
birth_date, phone, city, state, bio
profile_visibility, is_verified
created_at, updated_at, last_login
```

### ROLES / USER_ROLES

```
ROLES: PK id, name UNIQUE, description
USER_ROLES: PK id, FK user_id, FK role_id, assigned_at, assigned_by
Cardinalidade: USER N:N ROLE
```

Papéis: `USER`, `INSTRUCTOR`, `MODERATOR`, `ADMIN`.

### USER_XP / USER_WALLET

```
USER_XP: PK id, FK user_id UNIQUE, level, current_xp, total_xp
USER_WALLET: PK id, FK user_id UNIQUE, coins
Cardinalidade: USER 1:1 USER_XP, USER 1:1 USER_WALLET
```

---

## Cursos

### CATEGORIES → COURSES

```
CATEGORIES: PK id, name UNIQUE, description

COURSES: PK id, FK category_id, title, slug UNIQUE
  short_description, description
  thumbnail_url, cover_image          ← capa upload (/uploads/courses/)
  course_type (FREE | PAID | PREMIUM)
  level (BEGINNER | INTERMEDIATE | ADVANCED)
  estimated_hours
  progression_type (FREE | PROGRESSIVE)
  status (PENDING_REVIEW | APPROVED | REJECTED | REVISION_REQUIRED)
  created_at, updated_at

Cardinalidade: CATEGORY 1:N COURSES
```

### COURSE_INSTRUCTORS → MODULES → LESSONS / MATERIALS

```
COURSE_INSTRUCTORS: PK id, FK course_id, FK user_id
Cardinalidade: COURSE N:N USER (instrutores)

MODULES: PK id, FK course_id, title, description, order_number
Cardinalidade: COURSE 1:N MODULES

LESSONS: PK id, FK module_id, title, description
  video_url, video_provider, duration, order_number
Cardinalidade: MODULE 1:N LESSONS

MATERIALS: PK id, FK module_id, title, file_url, file_type
Cardinalidade: MODULE 1:N MATERIALS
```

### COURSE_ENROLLMENTS / LESSON_PROGRESS

```
COURSE_ENROLLMENTS: PK id, FK user_id, FK course_id
  progress, enrolled_at, completed_at
Cardinalidade: USER N:N COURSE

LESSON_PROGRESS: PK id, FK user_id, FK lesson_id, completed_at
Cardinalidade: USER N:N LESSON (progresso por aula)
```

---

## Quiz (por módulo)

```
QUIZZES: PK id, FK module_id, title, passing_score
QUESTIONS: PK id, FK quiz_id, statement, question_type, points
ALTERNATIVES: PK id, FK question_id, text, is_correct
QUIZ_ATTEMPTS: PK id, FK quiz_id, FK user_id, score, started_at, finished_at
```

> Quiz de módulo é **independente** do módulo de simulados (`EXAMS`).

---

## Simulados (implementado)

### EXAMS

```
PK id, title, slug UNIQUE
exam_type (ENEM | VESTIBULAR | TECNOLOGIA)
description, cover_image              ← capa upload (/uploads/exams/)
time_limit (minutos, nullable)        ← null = sem limite; cronômetro progressivo
is_published, created_at
```

### EXAM_QUESTIONS

```
PK id, FK exam_id
statement
image_url, image_width, image_height
image_display_size (SMALL | MEDIUM | LARGE | FULL)   ← tamanho de exibição
order_number, points
type (MULTIPLE_CHOICE | ESSAY)
expected_answer (nullable — gabarito de referência para ESSAY)

Cardinalidade: EXAM 1:N EXAM_QUESTIONS
```

### EXAM_ALTERNATIVES

```
PK id, FK question_id, text, is_correct
Cardinalidade: EXAM_QUESTION 1:N EXAM_ALTERNATIVES (2 a 6 por questão MC)
```

> Alternativas são **dinâmicas** — não há limite fixo de 4. A sequência A–F é definida pela ordem de criação.

### EXAM_ATTEMPTS / EXAM_ANSWERS

```
EXAM_ATTEMPTS: PK id, FK exam_id, FK user_id
  score, correct_answers, total_questions
  started_at, finished_at

EXAM_ANSWERS: PK id, FK attempt_id, FK question_id
  FK alternative_id (nullable — questões MC)
  essay_answer (nullable — questões ESSAY)
  essay_status (PENDING | CORRECT | PARTIAL | INCORRECT)
  essay_comment
  is_correct

Cardinalidade: ATTEMPT 1:N ANSWERS; UNIQUE (attempt_id, question_id)
```

---

## Certificados

```
CERTIFICATES: PK id, FK user_id, FK course_id
certificate_number UNIQUE, verification_code UNIQUE, issue_date
```

---

## Moderação

### INSTRUCTOR_APPLICATIONS

```
PK id, FK user_id, motivation, experience, portfolio_url
status (PENDING | APPROVED | REJECTED), created_at, reviewed_at
```

### COURSE_MODERATIONS

```
PK id, FK course_id, FK moderator_id
status, review_notes, reviewed_at
```

---

## Notificações e aulas ao vivo (implementado parcialmente)

```
NOTIFICATIONS: PK id, FK user_id, title, body, read_at, created_at
LIVE_ROOMS, LIVE_CHAT_MESSAGES, LIVE_ROOM_PARTICIPANTS — ver schema Prisma
```

---

## HexaSchools (referência — projeto separado)

Entidades documentadas para visão de produto; implementação principal em `../hexaschools`.

```
SCHOOLS, SCHOOL_USERS, SCHOOL_COURSES, SCHOOL_CLASSES, SCHOOL_ENROLLMENTS
```

---

## Fase 2 (referência — não priorizar no MVP)

- `COURSE_RATINGS` — avaliação do aluno (≠ moderação)
- `SUBSCRIPTION_PLANS`, marketplace, loja de moedas

---

## Diagrama resumido

```
USERS
 ├── USER_ROLES ── ROLES
 ├── USER_XP / USER_WALLET
 ├── COURSE_ENROLLMENTS ── COURSES
 ├── LESSON_PROGRESS
 ├── EXAM_ATTEMPTS
 ├── CERTIFICATES
 └── INSTRUCTOR_APPLICATIONS

CATEGORIES → COURSES
 ├── cover_image, thumbnail_url
 ├── MODULES → LESSONS, MATERIALS, QUIZZES
 ├── COURSE_INSTRUCTORS
 ├── COURSE_MODERATIONS
 └── CERTIFICATES

EXAMS
 ├── cover_image
 ├── EXAM_QUESTIONS
 │    ├── image_url + dimensões + image_display_size
 │    ├── type (MC | ESSAY)
 │    └── EXAM_ALTERNATIVES (2–6, dinâmico)
 └── EXAM_ATTEMPTS → EXAM_ANSWERS
```

Fonte de verdade no código: `prisma/schema.prisma`.
