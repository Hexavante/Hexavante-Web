import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CourseRecommendations } from "../course-recommendations";
import { StudentDashboard } from "../student-dashboard";
import { StudyContinueHero } from "../study-continue-hero";

function buildDashboardData(overrides: Record<string, unknown> = {}) {
  const base = {
    xpProfile: {
      level: 3,
      currentXp: 120,
      totalXp: 1320,
      xpToNextLevel: 500,
      progressPercent: 24,
    },
    enrollments: [],
    inProgress: [],
    completedCount: 1,
    recentXp: [],
    lastExam: null,
    continuation: null,
    recommendations: [],
    stats: null,
    achievements: [],
    showOnboardingTour: false,
    highlights: {
      nextGoal: null,
      lastCertificate: null,
      nextLiveEvent: null,
    },
    pendingItems: [],
    dailyPlan: null,
    cosmetics: {
      themeId: null,
      themeClassName: "theme-default",
      avatarBorderClassName: null,
      profileBackgroundId: null,
      frameId: null,
    },
    ...overrides,
  };
  return base as unknown as React.ComponentProps<typeof StudentDashboard>["data"];
}

describe("painel /app — layout sem duplo vazio", () => {
  it("hero com continuation==null mantém CTAs reais", () => {
    render(<StudyContinueHero continuation={null} />);

    expect(screen.getByText("Nenhum estudo em andamento")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /explorar cursos/i })).toHaveAttribute(
      "href",
      "/courses",
    );
    expect(screen.getByRole("link", { name: /simulados/i })).toHaveAttribute(
      "href",
      "/simulados",
    );
  });

  it("recomendações vazias mostram EmptyState com CTAs (sem inventar cursos)", () => {
    render(<CourseRecommendations courses={[]} />);

    expect(
      screen.getByText("Nenhuma recomendação por enquanto"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /explorar cursos/i })).toHaveAttribute(
      "href",
      "/courses",
    );
    expect(screen.getByRole("link", { name: /ver simulados/i })).toHaveAttribute(
      "href",
      "/simulados",
    );
  });

  it("recomendações reais continuam listadas", () => {
    render(
      <CourseRecommendations
        courses={[
          {
            id: "c1",
            title: "Curso Real de Redes",
            slug: "redes",
            level: "BEGINNER",
            shortDescription: "Descrição real",
            thumbnailUrl: null,
            categoryName: "Redes",
            enrollmentCount: 10,
            reason: "Popular entre estudantes",
          },
        ]}
      />,
    );

    expect(screen.getByText("Curso Real de Redes")).toBeInTheDocument();
  });

  it("sidebar lista cursos em andamento mesmo com continuation (sem falso vazio)", () => {
    const data = buildDashboardData({
      continuation: {
        href: "/courses/curso-a/learn/l1",
        courseTitle: "Curso A",
        lessonTitle: "Aula 1",
        progress: 20,
        lastStudyAt: new Date(),
        type: "lesson",
      },
      inProgress: [
        {
          id: "e1",
          progress: 20,
          course: { title: "Curso A", slug: "curso-a" },
        },
      ],
    });

    render(<StudentDashboard data={data} userName="Estudante Teste" />);

    expect(screen.getByText("Curso A")).toBeInTheDocument();
    expect(
      screen.queryByText("Nenhum curso em andamento."),
    ).not.toBeInTheDocument();
  });

  it("sidebar vazia mostra progresso geral + CTAs úteis", () => {
    const data = buildDashboardData({
      continuation: null,
      inProgress: [],
    });

    render(<StudentDashboard data={data} userName="Estudante Teste" />);

    // progresso geral ainda visível (XP + contadores)
    expect(screen.getByText(/XP total/)).toBeInTheDocument();
    expect(screen.getByText("Nenhum curso em andamento.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /explorar cursos/i })).toHaveAttribute(
      "href",
      "/courses",
    );
    expect(screen.getByRole("link", { name: /ver simulados/i })).toHaveAttribute(
      "href",
      "/simulados",
    );
  });
});
