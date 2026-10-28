import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
const save = vi.hoisted(() => vi.fn());
vi.mock("@/app/actions/notebook", () => ({saveNotebookPageAction:save,loadNotebookAction:vi.fn()}));
import { CourseNotebook } from "../notebook/course-notebook";
const initial = {success:true as const,data:{courses:[{id:"java",title:"Java",slug:"java"},{id:"git",title:"Git",slug:"git"}],pages:[]}};
beforeEach(() => { cleanup(); vi.clearAllMocks(); });
describe("fluxo do caderno", () => {
 it("cria uma página na divisória escolhida e a mantém após salvar", async () => {
  save.mockImplementation(async (input) => ({success:true,data:{...input,version:1,updatedAt:new Date().toISOString()}}));
  render(<CourseNotebook initial={initial} />);
  fireEvent.click(screen.getByRole("button",{name:/02 Git/}));
  fireEvent.click(screen.getByRole("button",{name:/Nova página/}));
  fireEvent.change(screen.getByLabelText("Título da página"),{target:{value:"Branches"}});
  fireEvent.change(screen.getByLabelText("Suas anotações"),{target:{value:"Uma ideia independente"}});
  fireEvent.click(screen.getByRole("button",{name:/Salvar página/}));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Salvo na sua conta"));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({courseId:"git",title:"Branches",content:"Uma ideia independente",version:null}));
  expect(screen.getByRole("button",{name:/Branches Uma ideia/})).toBeInTheDocument();
 });
 it("preserva o rascunho se salvar falhar", async () => {
  save.mockResolvedValue({success:false,error:"Falha ao salvar"});
  render(<CourseNotebook initial={initial} />);
  fireEvent.click(screen.getByRole("button",{name:/Nova página/}));
  fireEvent.change(screen.getByLabelText("Título da página"),{target:{value:"Meu resumo"}});
  fireEvent.click(screen.getByRole("button",{name:/Salvar página/}));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Falha ao salvar"));
  expect(screen.getByLabelText("Título da página")).toHaveValue("Meu resumo");
 });
 it("não descarta a página ao cancelar a troca de curso", () => {
  const confirm = vi.spyOn(window,"confirm").mockReturnValue(false);
  render(<CourseNotebook initial={initial} />);
  fireEvent.click(screen.getByRole("button",{name:/Nova página/}));
  fireEvent.change(screen.getByLabelText("Título da página"),{target:{value:"Rascunho"}});
  fireEvent.click(screen.getByRole("button",{name:/02 Git/}));
  expect(screen.getByLabelText("Título da página")).toHaveValue("Rascunho");
  expect(screen.getByRole("button",{name:/01 Java/})).toHaveAttribute("aria-pressed","true");
  confirm.mockRestore();
 });
});
