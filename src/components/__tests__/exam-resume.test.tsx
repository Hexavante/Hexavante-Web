import { afterEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ExamForm } from "../exams/exam-form";
vi.mock("@/app/actions/exam", () => ({submitExamAction: vi.fn(), submitExamTimeoutAction: vi.fn()}));
vi.mock("../exams/exam-timer", () => ({ExamTimer: () => null}));
const questions = [{id:"q1",statement:"Qual alternativa?",orderNumber:1,type:"MULTIPLE_CHOICE" as const,alternatives:[{id:"a",text:"Primeira"},{id:"b",text:"Segunda"}]}];
function exam(attemptId: string) {
  return <ExamForm slug="teste" attemptId={attemptId} title="Teste" questions={questions} startedAt={new Date().toISOString()}/>;
}
afterEach(()=>sessionStorage.clear());
it("restaura a alternativa na mesma tentativa e mantém uma nova tentativa em branco",async()=>{
  const first = render(exam("one"));
  fireEvent.click(screen.getByRole("radio",{name:/Segunda/}));
  first.unmount();
  const restored=render(exam("one"));
  await waitFor(()=>expect(screen.getByRole("radio",{name:/Segunda/})).toBeChecked());
  expect(new FormData(restored.container.querySelector("form")!).get("q_q1")).toBe("b");
  restored.unmount();
  render(exam("two"));
  expect(screen.getByRole("radio",{name:/Segunda/})).not.toBeChecked();
});
