// Importações necessárias para o serviço de cursos
import { prisma } from "@/lib/prisma";
import { enforceCleanContent } from "@/services/content-policy.service";
import { notifyEnrolledUsersOfCourseUpdate } from "@/services/course-notification.service"; // Cliente Prisma para banco de dados
import { slugify } from "@/lib/slug"; // Função para gerar slugs amigáveis
import type {
  CourseInput,
  LessonInput,
  MaterialInput,
  ModuleInput,
} from "@/lib/validations/course"; // Tipos de entrada para validação

// Função auxiliar para gerar slug único
// Adiciona número ao final se o slug já existir
async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "curso"; // Gera slug base do título
  let slug = base;
  let counter = 1;

  // Verifica se slug já existe e adiciona número se necessário
  while (await prisma.course.findUnique({ where: { slug } })) {
    slug = `${base}-${counter}`;
    counter++;
  }

  return slug;
}

async function validateCourseText(
  userId: string,
  fields: { label: string; text?: string | null }[],
) {
  for (const field of fields) {
    if (!field.text?.trim()) continue;
    await enforceCleanContent({
      userId,
      text: field.text,
      fieldLabel: field.label,
      context: "COURSE",
    });
  }
}

// Função para listar cursos aprovados
// Retorna cursos com status APPROVED, opcionalmente filtrados por categoria
export async function listApprovedCourses(categoryId?: string) {
  return searchApprovedCourses({ categoryId });
}

export type CourseSearchParams = {
  categoryId?: string;
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  q?: string;
  sort?: "recent" | "popular";
};

export async function searchApprovedCourses({
  categoryId,
  level,
  q,
  sort = "recent",
}: CourseSearchParams = {}) {
  const query = q?.trim();

  return prisma.course.findMany({
    where: {
      status: "APPROVED",
      isPublished: true,
      ...(categoryId ? { categoryId } : {}),
      ...(level ? { level } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query } },
              { shortDescription: { contains: query } },
              { description: { contains: query } },
            ],
          }
        : {}),
    },
    include: {
      category: true,
      instructors: {
        include: {
          user: { select: { fullName: true, username: true } },
        },
      },
      _count: { select: { modules: true, enrollments: true } },
    },
    orderBy: sort === "popular" ? { enrollments: { _count: "desc" } } : { createdAt: "desc" },
  });
}

// Função para listar categorias de cursos
// Retorna apenas categorias aprovadas (para o seletor do formulário)
export async function listCategories() {
  return prisma.category.findMany({ where: { isApproved: true }, orderBy: { name: "asc" } });
}

// Cria ou reutiliza uma categoria a partir do nome informado pelo instrutor.
// Categorias novas ficam pendentes de aprovação do moderador (isApproved: false).
export async function upsertCategoryByName(name: string, suggestedById?: string) {
  const clean = name.trim();
  if (!clean) throw new Error("Nome da categoria inválido.");

  const existing = await prisma.category.findFirst({ where: { name: clean } });
  if (existing) return existing;

  try {
    return await prisma.category.create({
      data: { name: clean, isApproved: false, suggestedById },
    });
  } catch {
    const retry = await prisma.category.findFirst({ where: { name: clean } });
    if (retry) return retry;
    throw new Error("Não foi possível criar a categoria.");
  }
}

// Lista categorias pendentes de aprovação (moderação)
export async function listPendingCategories() {
  return prisma.category.findMany({
    where: { isApproved: false },
    orderBy: { name: "asc" },
  });
}

export async function approveCategory(id: string) {
  return prisma.category.update({ where: { id }, data: { isApproved: true } });
}

export async function rejectCategory(id: string) {
  return prisma.category.delete({ where: { id } });
}

// Define as tags de um curso a partir de uma lista de nomes (cria as tags inexistentes).
export async function setCourseTags(courseId: string, names: string[]) {
  const clean = [...new Set(names.map((n) => n.trim()).filter(Boolean))].slice(0, 15);

  const tags: { id: string }[] = [];
  for (const name of clean) {
    const tag = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    tags.push(tag);
  }

  await prisma.courseTag.deleteMany({ where: { courseId } });
  if (tags.length > 0) {
    await prisma.courseTag.createMany({
      data: tags.map((t) => ({ courseId, tagId: t.id })),
    });
  }
}

// Função para obter curso aprovado pelo slug (páginas públicas)
export async function getApprovedCourseBySlug(slug: string) {
  return prisma.course.findFirst({
    where: { slug, status: "APPROVED", isPublished: true },
    include: {
      category: true,
      instructors: {
        include: {
          user: { select: { fullName: true, username: true } },
        },
      },
      modules: {
        orderBy: { orderNumber: "asc" },
        include: {
          lessons: { orderBy: { orderNumber: "asc" } },
          materials: true,
        },
      },
      courseTags: { include: { tag: true } },
    },
  });
}

// Função para obter curso pelo slug
// Retorna curso com todos os dados incluindo módulos, aulas e materiais
export async function getCourseBySlug(slug: string) {
  return prisma.course.findUnique({
    where: { slug },
    include: {
      category: true,
      instructors: {
        include: {
          user: { select: { fullName: true, username: true } },
        },
      },
      modules: {
        orderBy: { orderNumber: "asc" },
        include: {
          lessons: { orderBy: { orderNumber: "asc" } },
          materials: true,
        },
      },
      courseTags: { include: { tag: true } },
    },
  });
}

// Função para obter curso pelo ID
// Retorna curso com verificação se o usuário é instrutor
export async function getCourseById(id: string, userId?: string) {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      category: true,
      instructors: true,
      modules: {
        orderBy: { orderNumber: "asc" },
        include: {
          lessons: { orderBy: { orderNumber: "asc" } },
          materials: true,
        },
      },
      courseTags: { include: { tag: true } },
    },
  });

  if (!course) return null;

  // Verifica se o usuário é instrutor do curso
  const isInstructor = userId ? course.instructors.some((i) => i.userId === userId) : false;

  return { course, isInstructor };
}

// Função para listar cursos do instrutor
// Retorna todos os cursos onde o usuário é instrutor
export async function listInstructorCourses(userId: string) {
  return prisma.course.findMany({
    where: {
      instructors: { some: { userId } }, // Filtra cursos onde usuário é instrutor
    },
    include: {
      category: true,
      _count: { select: { modules: true, enrollments: true } },
    },
    orderBy: { updatedAt: "desc" }, // Ordena por data de atualização
  });
}

// Função para criar novo curso
// Cria curso com slug único e status PENDING_REVIEW
function courseCategory(categoryId: string, name: string | undefined, userId: string) {
  return name
    ? { connectOrCreate: { where: { name }, create: { name, isApproved: false, suggestedById: userId } } }
    : { connect: { id: categoryId } };
}

export async function createCourse(userId: string, data: CourseInput, newCategory?: string) {
  await validateCourseText(userId, [
    { label: "título", text: data.title },
    { label: "descrição curta", text: data.shortDescription },
    { label: "descrição", text: data.description },
  ]);

  const slug = await uniqueSlug(data.title);

  return prisma.course.create({
    data: {
      title: data.title,
      slug,
      category: courseCategory(data.categoryId, newCategory, userId),
      shortDescription: data.shortDescription || null,
      description: data.description || null,
      thumbnailUrl: data.coverImage || data.thumbnailUrl || null,
      coverImage: data.coverImage || null,
      courseType: "FREE",
      level: data.level,
      estimatedHours: data.estimatedHours ?? null,
      progressionType: data.progressionType,
      status: "PENDING_REVIEW", // Curso começa pendente de aprovação
      isPublished: false, // Inicia como rascunho; instrutor publica após adicionar aulas
      instructors: {
        create: { userId }, // Adiciona usuário como instrutor
      },
    },
  });
}

// Função para atualizar curso
// Atualiza apenas campos fornecidos, verifica permissão de instrutor
export async function updateCourse(courseId: string, userId: string, data: Partial<CourseInput>, newCategory?: string) {
  // Verifica se o usuário é instrutor do curso
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      instructors: { some: { userId } },
    },
  });

  if (!course) {
    throw new Error("Curso não encontrado ou sem permissão.");
  }

  await validateCourseText(userId, [
    { label: "título", text: data.title },
    { label: "descrição curta", text: data.shortDescription },
    { label: "descrição", text: data.description },
  ]);

  const contentFieldsChanged =
    data.title !== undefined ||
    data.categoryId !== undefined ||
    data.shortDescription !== undefined ||
    data.description !== undefined ||
    data.thumbnailUrl !== undefined ||
    data.coverImage !== undefined ||
    data.removeCover === true ||
    data.level !== undefined ||
    data.estimatedHours !== undefined ||
    data.progressionType !== undefined;

  const needsRemoderation = course.status === "APPROVED" && contentFieldsChanged;

  // Atualiza apenas os campos fornecidos
  return prisma.course.update({
    where: { id: courseId },
    data: {
      ...(data.title ? { title: data.title } : {}),
      ...(data.categoryId ? { category: courseCategory(data.categoryId, newCategory, userId) } : {}),
      ...(data.shortDescription !== undefined
        ? { shortDescription: data.shortDescription || null }
        : {}),
      ...(data.description !== undefined ? { description: data.description || null } : {}),
      ...(data.removeCover === true
        ? { coverImage: null, thumbnailUrl: null }
        : data.coverImage !== undefined
          ? {
              coverImage: data.coverImage || null,
              thumbnailUrl: data.coverImage || null,
            }
          : data.thumbnailUrl !== undefined
            ? {
                thumbnailUrl: data.thumbnailUrl || null,
                coverImage: data.thumbnailUrl || null,
              }
            : {}),
      ...(data.level ? { level: data.level } : {}),
      ...(data.estimatedHours !== undefined ? { estimatedHours: data.estimatedHours ?? null } : {}),
      ...(data.progressionType ? { progressionType: data.progressionType } : {}),
      ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
      ...(needsRemoderation ? { status: "PENDING_REVIEW" } : {}),
    },
  });
}

// Função para adicionar módulo ao curso
// Verifica permissão de instrutor antes de criar módulo
export async function addModule(courseId: string, userId: string, data: ModuleInput) {
  await assertInstructor(courseId, userId);

  await validateCourseText(userId, [
    { label: "título do módulo", text: data.title },
    { label: "descrição do módulo", text: data.description },
  ]);

  return prisma.module.create({
    data: {
      courseId,
      title: data.title,
      description: data.description || null,
      orderNumber: data.orderNumber,
    },
  }).then(async (created) => {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, slug: true, status: true },
    });
    if (course?.status === "APPROVED") {
      await notifyEnrolledUsersOfCourseUpdate({
        courseId: course.id,
        courseTitle: course.title,
        courseSlug: course.slug,
        updateLabel: `Novo módulo: ${data.title}`,
        excludeUserId: userId,
      });
    }
    return created;
  });
}

// Função para adicionar aula ao módulo
// Verifica permissão de instrutor antes de criar aula
export async function addLesson(moduleId: string, userId: string, data: LessonInput) {
  // Busca módulo com curso e instrutores
  const courseModule = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          instructors: { select: { userId: true } },
        },
      },
    },
  });

  if (!courseModule || !courseModule.course.instructors.some((i) => i.userId === userId)) {
    throw new Error("Sem permissão para adicionar aula.");
  }

  await validateCourseText(userId, [
    { label: "título da aula", text: data.title },
    { label: "descrição da aula", text: data.description },
  ]);

  const detectedProvider = data.videoUrl
    ? data.videoUrl.includes("vimeo.com")
      ? "vimeo"
      : data.videoUrl.includes("youtube.com") || data.videoUrl.includes("youtu.be")
        ? "youtube"
        : data.videoProvider || null
    : null;

  const lesson = await prisma.lesson.create({
    data: {
      moduleId,
      title: data.title,
      description: data.description || null,
      videoUrl: data.videoUrl || null,
      videoProvider: detectedProvider,
      duration: data.duration ?? null,
      orderNumber: data.orderNumber,
    },
  });

  if (courseModule.course.status === "APPROVED") {
    await notifyEnrolledUsersOfCourseUpdate({
      courseId: courseModule.course.id,
      courseTitle: courseModule.course.title,
      courseSlug: courseModule.course.slug,
      updateLabel: `Nova aula: ${data.title}`,
      excludeUserId: userId,
    });
  }

  return lesson;
}

// Função para adicionar material ao módulo
// Verifica permissão de instrutor antes de criar material
export async function addMaterial(moduleId: string, userId: string, data: MaterialInput) {
  // Busca módulo com curso e instrutores
  const courseModule = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          instructors: { select: { userId: true } },
        },
      },
    },
  });

  if (!courseModule || !courseModule.course.instructors.some((i) => i.userId === userId)) {
    throw new Error("Sem permissão para adicionar material.");
  }

  await validateCourseText(userId, [{ label: "título do material", text: data.title }]);

  const material = await prisma.material.create({
    data: {
      moduleId,
      title: data.title,
      fileUrl: data.fileUrl,
      fileType: data.fileType,
    },
  });

  if (courseModule.course.status === "APPROVED") {
    await notifyEnrolledUsersOfCourseUpdate({
      courseId: courseModule.course.id,
      courseTitle: courseModule.course.title,
      courseSlug: courseModule.course.slug,
      updateLabel: `Novo material: ${data.title}`,
      excludeUserId: userId,
    });
  }

  return material;
}

// Função auxiliar para verificar se usuário é instrutor do curso
// Lança erro se não for instrutor ou curso não existir
async function assertInstructor(courseId: string, userId: string) {
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      instructors: { some: { userId } },
    },
  });

  if (!course) {
    throw new Error("Curso não encontrado ou sem permissão.");
  }
}

// Função para contar total de aulas em módulos
// Soma o número de aulas em todos os módulos
export function countTotalLessons(modules: { lessons: unknown[] }[]): number {
  return modules.reduce((acc, m) => acc + m.lessons.length, 0);
}

async function assertModuleInstructor(moduleId: string, userId: string) {
  const courseModule = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { course: { include: { instructors: true } } },
  });

  if (!courseModule || !courseModule.course.instructors.some((i) => i.userId === userId)) {
    throw new Error("Sem permissão para editar este módulo.");
  }

  return courseModule;
}

async function assertLessonInstructor(lessonId: string, userId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: { include: { course: { include: { instructors: true } } } },
    },
  });

  if (!lesson || !lesson.module.course.instructors.some((i) => i.userId === userId)) {
    throw new Error("Sem permissão para editar esta aula.");
  }

  return lesson;
}

export async function updateModule(moduleId: string, userId: string, data: Partial<ModuleInput>) {
  await assertModuleInstructor(moduleId, userId);

  return prisma.module.update({
    where: { id: moduleId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description || null } : {}),
      ...(data.orderNumber !== undefined ? { orderNumber: data.orderNumber } : {}),
    },
  });
}

export async function deleteModule(moduleId: string, userId: string) {
  const courseModule = await assertModuleInstructor(moduleId, userId);
  await prisma.module.delete({ where: { id: moduleId } });
  return courseModule.courseId;
}

export async function updateLesson(lessonId: string, userId: string, data: Partial<LessonInput>) {
  await assertLessonInstructor(lessonId, userId);

  const detectedProvider = data.videoUrl !== undefined
    ? data.videoUrl
      ? data.videoUrl.includes("vimeo.com")
        ? "vimeo"
        : data.videoUrl.includes("youtube.com") || data.videoUrl.includes("youtu.be")
          ? "youtube"
          : data.videoProvider || null
      : null
    : undefined;

  return prisma.lesson.update({
    where: { id: lessonId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description || null } : {}),
      ...(data.videoUrl !== undefined ? { videoUrl: data.videoUrl || null } : {}),
      ...(detectedProvider !== undefined ? { videoProvider: detectedProvider } : {}),
      ...(data.duration !== undefined ? { duration: data.duration ?? null } : {}),
      ...(data.orderNumber !== undefined ? { orderNumber: data.orderNumber } : {}),
    },
  });
}

export async function deleteLesson(lessonId: string, userId: string) {
  const lesson = await assertLessonInstructor(lessonId, userId);
  await prisma.lesson.delete({ where: { id: lessonId } });
  return lesson.module.courseId;
}

export async function deleteMaterial(materialId: string, userId: string) {
  const material = await prisma.material.findUnique({
    where: { id: materialId },
    include: {
      module: { include: { course: { include: { instructors: true } } } },
    },
  });

  if (!material || !material.module.course.instructors.some((i) => i.userId === userId)) {
    throw new Error("Sem permissão para excluir este material.");
  }

  await prisma.material.delete({ where: { id: materialId } });
  return material.module.courseId;
}
