import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SHOP_CATALOG } from "../src/lib/shop-catalog";
import {
  DEPRECATED_PARTIAL_ENEM_SLUGS,
  FULL_ENEM_EXAMS,
  SUBJECT_MARATHON_EXAMS,
  type SeedExamQuestion,
  type SeedFullEnemExam,
} from "./seed-enem-full";

const prisma = new PrismaClient();

const roles = [
  { name: "USER", description: "Estudante padrão" },
  { name: "INSTRUCTOR", description: "Cria cursos após aprovação" },
  { name: "MODERATOR", description: "Aprova instrutores e cursos" },
  { name: "ADMIN", description: "Administração geral" },
  { name: "SUPERADMIN", description: "Controle total da plataforma" },
];

const categories = [
  { name: "ENEM", description: "Vestibulares e Preparatórios" },
  { name: "Vestibulares", description: "Vestibulares e Preparatórios" },
  { name: "Programação", description: "Tecnologia da Informação" },
  { name: "Desenvolvimento Web", description: "Tecnologia da Informação" },
  { name: "Banco de Dados", description: "Tecnologia da Informação" },
  { name: "Matemática", description: "Disciplinas Fundamentais" },
  { name: "Português", description: "Disciplinas Fundamentais" },
];

type SeedLesson = {
  title: string;
  description?: string;
  videoUrl?: string;
  videoProvider?: "youtube" | "vimeo" | "other";
  duration?: number;
};

type SeedModule = {
  title: string;
  description?: string;
  lessons: SeedLesson[];
  materials?: { title: string; fileUrl: string; fileType?: string }[];
};

type SeedCourse = {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  estimatedHours: number;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  courseType?: "FREE" | "PAID" | "PREMIUM";
  modules: SeedModule[];
};

const ENEM_TEST_COURSES: SeedCourse[] = [
  {
    title: "ENEM Linguagens — Interpretação e Gramática Aplicada",
    slug: "enem-linguagens-interpretacao-e-gramatica-aplicada",
    shortDescription:
      "Domine interpretação textual, variação linguística e gramática no contexto do ENEM.",
    description:
      "Curso focado em leitura estratégica, inferência, coesão e temas gramaticais mais cobrados na prova de Linguagens do ENEM.",
    estimatedHours: 24,
    level: "BEGINNER",
    modules: [
      {
        title: "Leitura e interpretação de textos",
        description: "Técnicas para leitura ativa e identificação de tese, argumentos e intencionalidade.",
        lessons: [
          {
            title: "Estratégias de leitura ativa para o ENEM",
            description: "Como ganhar velocidade sem perder compreensão.",
            videoUrl: "https://www.youtube.com/watch?v=8mei6uVttho",
            videoProvider: "youtube",
            duration: 780,
          },
          {
            title: "Inferência, implícitos e efeitos de sentido",
            description: "Como resolver questões de interpretação com mais precisão.",
            videoUrl: "https://www.youtube.com/watch?v=6tNS--WetLI",
            videoProvider: "youtube",
            duration: 820,
          },
        ],
      },
      {
        title: "Gramática no contexto",
        description: "Classes gramaticais, concordância e pontuação com foco em aplicação.",
        lessons: [
          {
            title: "Concordância e regência em textos do ENEM",
            videoUrl: "https://www.youtube.com/watch?v=3JfB0TuN06g",
            videoProvider: "youtube",
            duration: 760,
          },
          {
            title: "Pontuação e coesão textual",
            videoUrl: "https://www.youtube.com/watch?v=6tNS--WetLI",
            videoProvider: "youtube",
            duration: 740,
          },
        ],
        materials: [
          {
            title: "Resumo rápido de gramática aplicada",
            fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            fileType: "pdf",
          },
        ],
      },
    ],
  },
  {
    title: "ENEM Matemática — Fundamentos e Questões",
    slug: "enem-matematica-fundamentos-e-questoes",
    shortDescription: "Reforce os tópicos-base de Matemática e aplique em questões estilo ENEM.",
    description:
      "Curso para consolidar porcentagem, razão, proporção, função e estatística básica com resolução guiada.",
    estimatedHours: 28,
    level: "BEGINNER",
    modules: [
      {
        title: "Aritmética e proporcionalidade",
        lessons: [
          {
            title: "Porcentagem e juros em problemas do cotidiano",
            videoUrl: "https://www.youtube.com/watch?v=8mei6uVttho",
            videoProvider: "youtube",
            duration: 810,
          },
          {
            title: "Razão, proporção e regra de três",
            videoUrl: "https://www.youtube.com/watch?v=3JfB0TuN06g",
            videoProvider: "youtube",
            duration: 840,
          },
        ],
      },
      {
        title: "Funções e estatística",
        lessons: [
          {
            title: "Função afim e leitura de gráficos",
            videoUrl: "https://www.youtube.com/watch?v=6tNS--WetLI",
            videoProvider: "youtube",
            duration: 890,
          },
          {
            title: "Média, mediana e análise de tabelas",
            videoUrl: "https://www.youtube.com/watch?v=3JfB0TuN06g",
            videoProvider: "youtube",
            duration: 760,
          },
        ],
      },
    ],
  },
  {
    title: "ENEM Ciências da Natureza — Física, Química e Biologia",
    slug: "enem-ciencias-da-natureza-fisica-quimica-biologia",
    shortDescription: "Conceitos essenciais de Natureza com abordagem interdisciplinar.",
    description:
      "Curso com foco nos temas mais recorrentes em Física, Química e Biologia no ENEM, contextualizados em situações reais.",
    estimatedHours: 30,
    level: "INTERMEDIATE",
    modules: [
      {
        title: "Física e energia",
        lessons: [
          {
            title: "Cinemática e interpretação de gráficos",
            videoUrl: "https://www.youtube.com/watch?v=8mei6uVttho",
            videoProvider: "youtube",
            duration: 860,
          },
          {
            title: "Energia, potência e eficiência",
            videoUrl: "https://www.youtube.com/watch?v=6tNS--WetLI",
            videoProvider: "youtube",
            duration: 830,
          },
        ],
      },
      {
        title: "Química e biologia aplicada",
        lessons: [
          {
            title: "pH, soluções e reações químicas",
            videoUrl: "https://www.youtube.com/watch?v=3JfB0TuN06g",
            videoProvider: "youtube",
            duration: 790,
          },
          {
            title: "Ecologia e cadeias alimentares",
            videoUrl: "https://www.youtube.com/watch?v=8mei6uVttho",
            videoProvider: "youtube",
            duration: 780,
          },
        ],
      },
    ],
  },
  {
    title: "ENEM Ciências Humanas — História, Geografia e Sociologia",
    slug: "enem-ciencias-humanas-historia-geografia-sociologia",
    shortDescription: "Estude processos históricos e fenômenos sociais com leitura crítica.",
    description:
      "Curso para revisão de conteúdos de Humanas, relacionando temas históricos e geopolíticos com cidadania e sociedade.",
    estimatedHours: 26,
    level: "BEGINNER",
    modules: [
      {
        title: "História e formação do Brasil",
        lessons: [
          {
            title: "Brasil Colônia e Império em questões",
            videoUrl: "https://www.youtube.com/watch?v=6tNS--WetLI",
            videoProvider: "youtube",
            duration: 780,
          },
          {
            title: "República, industrialização e cidadania",
            videoUrl: "https://www.youtube.com/watch?v=8mei6uVttho",
            videoProvider: "youtube",
            duration: 810,
          },
        ],
      },
      {
        title: "Geografia e sociedade",
        lessons: [
          {
            title: "Globalização e blocos econômicos",
            videoUrl: "https://www.youtube.com/watch?v=3JfB0TuN06g",
            videoProvider: "youtube",
            duration: 760,
          },
          {
            title: "Urbanização, desigualdade e território",
            videoUrl: "https://www.youtube.com/watch?v=6tNS--WetLI",
            videoProvider: "youtube",
            duration: 790,
          },
        ],
      },
    ],
  },
  {
    title: "ENEM Redação Nota 1000 — Estrutura e Repertório",
    slug: "enem-redacao-nota-1000-estrutura-e-repertorio",
    shortDescription: "Aprenda a construir redações com argumentação sólida e proposta de intervenção.",
    description:
      "Curso direcionado às 5 competências da redação do ENEM, com foco em planejamento, repertório sociocultural e revisão.",
    estimatedHours: 20,
    level: "INTERMEDIATE",
    modules: [
      {
        title: "Base da redação ENEM",
        lessons: [
          {
            title: "Competências e estrutura dissertativo-argumentativa",
            videoUrl: "https://www.youtube.com/watch?v=8mei6uVttho",
            videoProvider: "youtube",
            duration: 900,
          },
          {
            title: "Introdução e tese com clareza",
            videoUrl: "https://www.youtube.com/watch?v=6tNS--WetLI",
            videoProvider: "youtube",
            duration: 760,
          },
        ],
      },
      {
        title: "Desenvolvimento e fechamento",
        lessons: [
          {
            title: "Argumentação e repertório produtivo",
            videoUrl: "https://www.youtube.com/watch?v=3JfB0TuN06g",
            videoProvider: "youtube",
            duration: 840,
          },
          {
            title: "Proposta de intervenção completa",
            videoUrl: "https://www.youtube.com/watch?v=8mei6uVttho",
            videoProvider: "youtube",
            duration: 790,
          },
        ],
      },
    ],
  },
];

async function upsertEnemCourse(course: SeedCourse, categoryId: string, instructorId: string) {
  const moduleCreates = course.modules.map((module, moduleIdx) => ({
    title: module.title,
    description: module.description,
    orderNumber: moduleIdx + 1,
    lessons: {
      create: module.lessons.map((lesson, lessonIdx) => ({
        title: lesson.title,
        description: lesson.description,
        videoUrl: lesson.videoUrl,
        videoProvider: lesson.videoProvider,
        duration: lesson.duration,
        orderNumber: lessonIdx + 1,
      })),
    },
    ...(module.materials?.length
      ? {
          materials: {
            create: module.materials.map((material) => ({
              title: material.title,
              fileUrl: material.fileUrl,
              fileType: material.fileType ?? "pdf",
            })),
          },
        }
      : {}),
  }));

  await prisma.course.upsert({
    where: { slug: course.slug },
    update: {
      title: course.title,
      categoryId,
      shortDescription: course.shortDescription,
      description: course.description,
      courseType: course.courseType ?? "FREE",
      level: course.level,
      estimatedHours: course.estimatedHours,
      progressionType: "PROGRESSIVE",
      status: "APPROVED",
      instructors: {
        deleteMany: {},
        create: { userId: instructorId },
      },
      modules: {
        deleteMany: {},
        create: moduleCreates,
      },
    },
    create: {
      title: course.title,
      slug: course.slug,
      categoryId,
      shortDescription: course.shortDescription,
      description: course.description,
      courseType: course.courseType ?? "FREE",
      level: course.level,
      estimatedHours: course.estimatedHours,
      progressionType: "PROGRESSIVE",
      status: "APPROVED",
      instructors: {
        create: { userId: instructorId },
      },
      modules: {
        create: moduleCreates,
      },
    },
  });
}

function mapSeedQuestion(question: SeedExamQuestion, orderNumber: number) {
  if (question.type === "ESSAY") {
    return {
      statement: question.statement,
      orderNumber,
      points: 1000,
      type: "ESSAY" as const,
      expectedAnswer: question.expectedAnswer ?? null,
      subject: "Redação",
      explanation: null,
      difficulty: 3,
    };
  }

  return {
    statement: question.statement,
    orderNumber,
    points: 1,
    type: "MULTIPLE_CHOICE" as const,
    subject: question.subject ?? null,
    explanation: question.explanation ?? null,
    difficulty: question.difficulty ?? 2,
    alternatives: {
      create: question.alternatives,
    },
  };
}

async function upsertEnemExam(exam: SeedFullEnemExam) {
  const questionCreates = exam.questions.map((question, idx) =>
    mapSeedQuestion(question, idx + 1),
  );

  await prisma.exam.upsert({
    where: { slug: exam.slug },
    update: {
      title: exam.title,
      examType: exam.examType,
      description: exam.description,
      timeLimit: exam.timeLimit,
      isPublished: true,
      isPremiumOnly: exam.isPremiumOnly ?? false,
      questions: {
        deleteMany: {},
        create: questionCreates,
      },
    },
    create: {
      title: exam.title,
      slug: exam.slug,
      examType: exam.examType,
      description: exam.description,
      timeLimit: exam.timeLimit,
      isPublished: true,
      isPremiumOnly: exam.isPremiumOnly ?? false,
      questions: {
        create: questionCreates,
      },
    },
  });
}

async function main() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: cat,
    });
  }

  const instructorRole = await prisma.role.findUnique({ where: { name: "INSTRUCTOR" } });
  const userRole = await prisma.role.findUnique({ where: { name: "USER" } });
  const progCategory = await prisma.category.findUnique({ where: { name: "Programação" } });
  const enemCategory = await prisma.category.findUnique({ where: { name: "ENEM" } });

  if (!instructorRole || !userRole || !progCategory || !enemCategory) {
    throw new Error("Seed incompleto: roles ou categorias não encontradas.");
  }

  const passwordHash = await bcrypt.hash("Instrutor123!", 12);

  const instructor = await prisma.user.upsert({
    where: { email: "instrutor@hexavante.com" },
    update: {},
    create: {
      username: "instrutor_demo",
      fullName: "Instrutor Demo",
      email: "instrutor@hexavante.com",
      passwordHash,
      birthDate: "1995-01-15",
      roles: {
        create: [{ roleId: userRole.id }, { roleId: instructorRole.id }],
      },
      xp: { create: {} },
      wallet: { create: {} },
    },
  });

  const existingCourse = await prisma.course.findUnique({
    where: { slug: "introducao-a-logica-de-programacao" },
  });

  if (!existingCourse) {
    await prisma.course.create({
      data: {
        title: "Introdução à Lógica de Programação",
        slug: "introducao-a-logica-de-programacao",
        categoryId: progCategory.id,
        shortDescription: "Aprenda os fundamentos da programação do zero.",
        description:
          "Curso introdutório com conceitos de variáveis, condicionais, laços e resolução de problemas. Ideal para iniciantes em TI.",
        courseType: "FREE",
        level: "BEGINNER",
        estimatedHours: 12,
        progressionType: "PROGRESSIVE",
        status: "APPROVED",
        instructors: {
          create: { userId: instructor.id },
        },
        modules: {
          create: [
            {
              title: "Primeiros passos",
              description: "Conceitos iniciais",
              orderNumber: 1,
              lessons: {
                create: [
                  {
                    title: "O que é programação?",
                    description: "Visão geral sobre lógica e algoritmos.",
                    videoUrl: "https://www.youtube.com/watch?v=8mei6uVttho",
                    videoProvider: "youtube",
                    duration: 600,
                    orderNumber: 1,
                  },
                  {
                    title: "Variáveis e tipos de dados",
                    description: "Como armazenar informações.",
                    videoUrl: "https://www.youtube.com/watch?v=3JfB0TuN06g",
                    videoProvider: "youtube",
                    duration: 720,
                    orderNumber: 2,
                  },
                ],
              },
              materials: {
                create: [
                  {
                    title: "Apostila - Lógica de Programação",
                    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                    fileType: "pdf",
                  },
                ],
              },
            },
            {
              title: "Estruturas de controle",
              orderNumber: 2,
              lessons: {
                create: [
                  {
                    title: "Condicionais if/else",
                    videoUrl: "https://www.youtube.com/watch?v=6tNS--WetLI",
                    videoProvider: "youtube",
                    orderNumber: 1,
                  },
                ],
              },
            },
          ],
        },
      },
    });
  }

  const demoQuestions = [
    {
      statement: "O que é um algoritmo?",
      orderNumber: 1,
      subject: "Algoritmos",
      explanation:
        "Algoritmo é uma sequência finita e ordenada de passos para resolver um problema. Não é linguagem, banco de dados nem sistema operacional.",
      difficulty: 1,
      alternatives: {
        create: [
          { text: "Uma sequência finita de passos para resolver um problema", isCorrect: true },
          { text: "Um tipo de linguagem de programação", isCorrect: false },
          { text: "Um banco de dados relacional", isCorrect: false },
          { text: "Um sistema operacional", isCorrect: false },
        ],
      },
    },
    {
      statement:
        "Qual estrutura é usada para repetir um bloco de código enquanto uma condição for verdadeira?",
      orderNumber: 2,
      subject: "Estruturas de repetição",
      explanation:
        "Laços como while e for repetem um bloco enquanto a condição permanece verdadeira. if executa uma vez; switch seleciona entre casos.",
      difficulty: 1,
      alternatives: {
        create: [
          { text: "while", isCorrect: true },
          { text: "if", isCorrect: false },
          { text: "switch", isCorrect: false },
          { text: "return", isCorrect: false },
        ],
      },
    },
    {
      statement: "Em programação, uma variável serve para:",
      orderNumber: 3,
      subject: "Variáveis",
      explanation:
        "Variáveis armazenam valores na memória para uso posterior no programa. Compilar, conectar ao banco e estilizar interface são outras tarefas.",
      difficulty: 1,
      alternatives: {
        create: [
          { text: "Armazenar um valor na memória", isCorrect: true },
          { text: "Compilar o código-fonte", isCorrect: false },
          { text: "Conectar ao banco de dados", isCorrect: false },
          { text: "Estilizar a interface do usuário", isCorrect: false },
        ],
      },
    },
    {
      statement: "Qual operador compara se dois valores são iguais em JavaScript?",
      orderNumber: 4,
      subject: "Operadores",
      explanation:
        "O operador === compara valor e tipo. = atribui valor; => define arrow function; && é operador lógico E.",
      difficulty: 2,
      alternatives: {
        create: [
          { text: "===", isCorrect: true },
          { text: "=", isCorrect: false },
          { text: "=>", isCorrect: false },
          { text: "&&", isCorrect: false },
        ],
      },
    },
    {
      statement: "O que significa 'debugging'?",
      orderNumber: 5,
      subject: "Depuração",
      explanation:
        "Debugging é o processo de encontrar e corrigir erros (bugs) no código. Publicar, desenhar interface e fazer backup são atividades distintas.",
      difficulty: 2,
      alternatives: {
        create: [
          { text: "Encontrar e corrigir erros no código", isCorrect: true },
          { text: "Publicar a aplicação em produção", isCorrect: false },
          { text: "Criar o design da interface", isCorrect: false },
          { text: "Fazer backup do banco de dados", isCorrect: false },
        ],
      },
    },
  ];

  await prisma.exam.upsert({
    where: { slug: "logica-programacao-basica" },
    update: {
      title: "Simulado — Lógica de Programação",
      examType: "TECNOLOGIA",
      description:
        "Questões objetivas sobre algoritmos, variáveis, condicionais e estruturas de repetição.",
      timeLimit: 20,
      isPublished: true,
      questions: {
        deleteMany: {},
        create: demoQuestions,
      },
    },
    create: {
      title: "Simulado — Lógica de Programação",
      slug: "logica-programacao-basica",
      examType: "TECNOLOGIA",
      description:
        "Questões objetivas sobre algoritmos, variáveis, condicionais e estruturas de repetição.",
      timeLimit: 20,
      isPublished: true,
      questions: {
        create: demoQuestions,
      },
    },
  });

  for (const course of ENEM_TEST_COURSES) {
    await upsertEnemCourse(course, enemCategory.id, instructor.id);
  }

  if (DEPRECATED_PARTIAL_ENEM_SLUGS.length > 0) {
    await prisma.exam.deleteMany({
      where: { slug: { in: DEPRECATED_PARTIAL_ENEM_SLUGS } },
    });
  }

  for (const exam of [...FULL_ENEM_EXAMS, ...SUBJECT_MARATHON_EXAMS]) {
    await upsertEnemExam(exam);
  }

  const moderatorRole = await prisma.role.findUnique({ where: { name: "MODERATOR" } });
  const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });

  if (moderatorRole && userRole) {
    const modPassword = await bcrypt.hash("Moderador123!", 12);
    await prisma.user.upsert({
      where: { email: "moderador@hexavante.com" },
      update: {},
      create: {
        username: "moderador_demo",
        fullName: "Moderador Demo",
        email: "moderador@hexavante.com",
        passwordHash: modPassword,
        birthDate: "1990-05-20",
        roles: {
          create: [{ roleId: userRole.id }, { roleId: moderatorRole.id }],
        },
        xp: { create: {} },
        wallet: { create: {} },
      },
    });
  }

  if (adminRole && userRole) {
    const adminPassword = await bcrypt.hash("Admin123!", 12);
    await prisma.user.upsert({
      where: { email: "admin@hexavante.com" },
      update: {},
      create: {
        username: "admin_demo",
        fullName: "Administrador Demo",
        email: "admin@hexavante.com",
        passwordHash: adminPassword,
        birthDate: "1988-01-01",
        roles: {
          create: [{ roleId: userRole.id }, { roleId: adminRole.id }],
        },
        xp: { create: {} },
        wallet: { create: {} },
      },
    });
  }

  const superAdminRole = await prisma.role.findUnique({ where: { name: "SUPERADMIN" } });
  if (superAdminRole && userRole) {
    const superPassword = await bcrypt.hash(process.env.SEED_SUPERADMIN_PASSWORD || "Superadmin123!", 12);
    await prisma.user.upsert({
      where: { email: "superadmin@hexavante.com" },
      update: {},
      create: {
        username: "superadmin_demo",
        fullName: "Superadmin Demo",
        email: "superadmin@hexavante.com",
        passwordHash: superPassword,
        birthDate: "1985-03-10",
        roles: {
          create: [{ roleId: userRole.id }, { roleId: superAdminRole.id }],
        },
        xp: { create: {} },
        wallet: { create: {} },
      },
    });
  }

  const demoCourse = await prisma.course.findUnique({
    where: { slug: "introducao-a-logica-de-programacao" },
  });

  if (userRole && demoCourse) {
    const alunoPassword = await bcrypt.hash("Aluno123!", 12);

    await prisma.user.upsert({
      where: { email: "aluno@hexavante.com" },
      update: {},
      create: {
        username: "aluno_demo",
        fullName: "Aluno Demo",
        email: "aluno@hexavante.com",
        passwordHash: alunoPassword,
        birthDate: "2006-08-15",
        roles: { create: [{ roleId: userRole.id }] },
        xp: { create: {} },
        wallet: { create: {} },
      },
    });

    const alunoDemo = await prisma.user.findUniqueOrThrow({
      where: { email: "aluno@hexavante.com" },
      select: { id: true },
    });

    await prisma.courseEnrollment.upsert({
      where: {
        userId_courseId: {
          userId: alunoDemo.id,
          courseId: demoCourse.id,
        },
      },
      update: {},
      create: {
        userId: alunoDemo.id,
        courseId: demoCourse.id,
      },
    });

    for (const course of ENEM_TEST_COURSES.slice(0, 3)) {
      const dbCourse = await prisma.course.findUnique({
        where: { slug: course.slug },
        select: { id: true },
      });
      if (!dbCourse) continue;

      await prisma.courseEnrollment.upsert({
        where: {
          userId_courseId: {
            userId: alunoDemo.id,
            courseId: dbCourse.id,
          },
        },
        update: {},
        create: {
          userId: alunoDemo.id,
          courseId: dbCourse.id,
        },
      });
    }
  }

  for (const item of SHOP_CATALOG) {
    await prisma.storeItem.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        cost: item.cost,
        category: item.category,
        imageUrl: item.imageUrl ?? null,
        isPremiumOnly: item.isPremiumOnly ?? false,
        isPermanent: item.isPermanent ?? true,
        metadata: item.metadata ?? undefined,
        isActive: true,
      },
      create: {
        slug: item.slug,
        name: item.name,
        description: item.description,
        cost: item.cost,
        category: item.category,
        imageUrl: item.imageUrl ?? null,
        isPremiumOnly: item.isPremiumOnly ?? false,
        isPermanent: item.isPermanent ?? true,
        metadata: item.metadata ?? undefined,
      },
    });
  }

  const premiumExam = await prisma.exam.findUnique({
    where: { slug: "desafio-premium-logica-avancada" },
  });
  if (!premiumExam) {
    await prisma.exam.create({
      data: {
        title: "Desafio Premium — Lógica Avançada",
        slug: "desafio-premium-logica-avancada",
        examType: "TECNOLOGIA",
        description: "Simulado exclusivo para assinantes Premium com estatísticas avançadas.",
        isPremiumOnly: true,
        timeLimit: 45,
        questions: {
          create: [
            {
              statement: "Qual estrutura de dados usa LIFO?",
              orderNumber: 1,
              alternatives: {
                create: [
                  { text: "Pilha (Stack)", isCorrect: true },
                  { text: "Fila (Queue)", isCorrect: false },
                  { text: "Lista ligada", isCorrect: false },
                ],
              },
            },
            {
              statement: "Big-O de busca binária em array ordenado:",
              orderNumber: 2,
              alternatives: {
                create: [
                  { text: "O(log n)", isCorrect: true },
                  { text: "O(n)", isCorrect: false },
                  { text: "O(n log n)", isCorrect: false },
                ],
              },
            },
          ],
        },
      },
    });
  }

  const aluno = await prisma.user.findUnique({ where: { email: "aluno@hexavante.com" } });
  if (aluno) {
    await prisma.user.update({
      where: { id: aluno.id },
      data: { coins: 500 },
    });
    await prisma.userWallet.upsert({
      where: { userId: aluno.id },
      create: { userId: aluno.id, coins: 500 },
      update: { coins: 500 },
    });
  }

  console.log("Seed concluído:");
  console.log("- Roles:", roles.map((r) => r.name).join(", "));
  console.log("- Categorias:", categories.length);
  console.log("- Superadmin demo: superadmin@hexavante.com");
  console.log("  (Senha definida via variável de ambiente SEED_SUPERADMIN_PASSWORD)");
  console.log("- Simulado demo: /simulados/logica-programacao-basica");
  console.log("- Simulado Premium: /simulados/desafio-premium-logica-avancada");
  console.log("- Loja: /shop (aluno demo com 500 moedas)");
  console.log(`- Cursos ENEM de teste: ${ENEM_TEST_COURSES.length}`);
  console.log(`- Simulados ENEM completos: ${FULL_ENEM_EXAMS.length} (100 questões + Redação cada)`);
  for (const exam of FULL_ENEM_EXAMS) {
    console.log(`  • /simulados/${exam.slug}`);
  }
  console.log(`- Simulados de disciplina: ${SUBJECT_MARATHON_EXAMS.length} (100 questões cada)`);
  for (const exam of SUBJECT_MARATHON_EXAMS) {
    console.log(`  • /simulados/${exam.slug}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
