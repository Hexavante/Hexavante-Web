import { beforeEach, expect, it, vi } from "vitest";
const { courseFind, courseUpdate, tutorialFind, tutorialUpdate } = vi.hoisted(
  () => ({
    courseFind: vi.fn(),
    courseUpdate: vi.fn(),
    tutorialFind: vi.fn(),
    tutorialUpdate: vi.fn(),
  }),
);
vi.mock("@/lib/prisma", () => ({
  prisma: {
    course: { findFirst: courseFind, update: courseUpdate },
    tutorial: { findFirst: tutorialFind, update: tutorialUpdate },
  },
}));
vi.mock("@/services/content-policy.service", () => ({
  enforceCleanContent: vi.fn(),
}));
vi.mock("@/services/course-notification.service", () => ({
  notifyEnrolledUsersOfCourseUpdate: vi.fn(),
}));
import { updateCourse } from "../course.service";
import { updateTutorial } from "../tutorial.service";
beforeEach(() => vi.resetAllMocks());
it.each(["PENDING_REVIEW", "APPROVED", "REVISION_REQUIRED", "REJECTED"])(
  "permite ao autor editar curso %s",
  async (status) => {
    courseFind.mockResolvedValue({ id: "course", status });
    await updateCourse("course", "author", { title: "Título revisado" });
    expect(courseFind).toHaveBeenCalledWith({
      where: { id: "course", instructors: { some: { userId: "author" } } },
    });
    expect(courseUpdate.mock.calls[0][0].data.title).toBe("Título revisado");
    if (status === "APPROVED")
      expect(courseUpdate.mock.calls[0][0].data.status).toBe("PENDING_REVIEW");
  },
);
it.each([false, true])(
  "permite editar tutorial publicado=%s",
  async (isPublished) => {
    tutorialFind.mockResolvedValue({ id: "tutorial", isPublished });
    await updateTutorial("tutorial", "author", { title: "Título revisado" });
    expect(tutorialFind).toHaveBeenCalledWith({
      where: { id: "tutorial", authorId: "author" },
    });
    expect(tutorialUpdate.mock.calls[0][0].data.title).toBe("Título revisado");
  },
);
it("impede alterar curso ou tutorial de outro autor", async () => {
  courseFind.mockResolvedValue(null);
  tutorialFind.mockResolvedValue(null);
  await expect(
    updateCourse("course", "other", { title: "Mudança" }),
  ).rejects.toThrow("sem permissão");
  await expect(
    updateTutorial("tutorial", "other", { title: "Mudança" }),
  ).rejects.toThrow("sem permissão");
  expect(courseUpdate).not.toHaveBeenCalled();
  expect(tutorialUpdate).not.toHaveBeenCalled();
});
