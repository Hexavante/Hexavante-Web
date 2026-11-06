import { expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ExamThumbnail } from "../exams/exam-thumbnail";
import { ExamCoverUpload } from "../exams/exam-cover-upload";

it("carrega diretamente a capa e permite recuperar uma URL nova após falha", () => {
  const { rerender } = render(<ExamThumbnail title="Biologia" url="/uploads/exams/one.webp" />);
  expect(screen.getByRole("img")).toHaveAttribute("src", expect.stringMatching(/\/uploads\/exams\/one\.webp$/));
  fireEvent.error(screen.getByRole("img"));
  expect(screen.queryByRole("img")).toBeNull();
  rerender(<ExamThumbnail title="Biologia" url="/uploads/exams/two.webp" />);
  expect(screen.getByRole("img")).toHaveAttribute("src", expect.stringMatching(/\/uploads\/exams\/two\.webp$/));
});

it("avisa quando a capa salva não carrega, sem apagar o valor do formulário", () => {
  const { container } = render(<ExamCoverUpload initialUrl="/uploads/exams/one.webp" />);
  fireEvent.error(screen.getByRole("img"));
  expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível carregar a capa");
  expect(container.querySelector('input[name="coverImage"]')).toHaveValue("/uploads/exams/one.webp");
  fireEvent.click(screen.getByRole("button", {name: "Remover"}));
  expect(container.querySelector('input[name="coverImage"]')).toHaveValue("");
});
