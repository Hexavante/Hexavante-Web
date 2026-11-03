import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CourseFormShell } from "../courses/course-form-shell";
import NewTutorialForm from "@/app/(main)/instructor/tutorials/new/form";
import { createTutorialAction } from "@/app/actions/tutorial";

vi.mock("@/app/actions/tutorial", () => ({createTutorialAction: vi.fn(async () => ({success:false}))}));
vi.mock("@/components/courses/course-cover-upload", () => ({CourseCoverUpload: () => null}));
vi.mock("@/components/tutorials/video-upload-input", () => ({VideoUploadInput: () => null}));
vi.mock("@/components/tutorials/tutorial-thumbnail-upload", () => ({TutorialThumbnailUpload: () => null}));
afterEach(cleanup);
it("permite criar um curso com uma categoria nova sem escolher outra", () => {
  const {container} = render(<CourseFormShell categories={[]} action={vi.fn()} cancelHref="/" submitLabel="Criar curso" />);
  fireEvent.change(screen.getByLabelText("Título"),{target:{value:"Fundamentos de Java"}});
  expect(container.querySelector("form")!.checkValidity()).toBe(false);
  fireEvent.change(screen.getByLabelText(/Criar nova categoria/),{target:{value:"Programação"}});
  expect(container.querySelector("form")!.checkValidity()).toBe(true);
  expect(new FormData(container.querySelector("form")!).get("newCategory")).toBe("Programação");
});
it.each([false,true])("envia a escolha de publicação do tutorial (%s)", async (publish) => {
  const {container}=render(<NewTutorialForm categories={[]} />);
  fireEvent.change(screen.getByLabelText(/Título/),{target:{value:"Como revisar erros"}});
  if(publish) fireEvent.click(screen.getByLabelText("Publicar imediatamente"));
  const fn=vi.mocked(createTutorialAction);
  fn.mockClear();
  fireEvent.submit(container.querySelector("form")!);
  await waitFor(()=>expect(fn).toHaveBeenCalledTimes(1));
  expect(fn.mock.calls[0][1].get("isPublished")==="true").toBe(publish);
});
