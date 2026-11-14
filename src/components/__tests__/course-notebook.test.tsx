import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
const save = vi.hoisted(() => vi.fn());
vi.mock("@/app/actions/notebook", () => ({saveNotebookPageAction:save,loadNotebookAction:vi.fn()}));
import { CourseNotebook } from "../notebook/course-notebook";
const initial = {success:true as const,data:{courses:[{id:"java",title:"Java",slug:"java"},{id:"git",title:"Git",slug:"git"}],pages:[]}};
const savedPage = async (input: Record<string, unknown>) => ({success:true,data:{page:{...input,version:1,updatedAt:new Date().toISOString()},relinked:[]}});
const page = (over: Record<string, unknown>) => ({id:"p",courseId:null,title:"",content:"",version:1,updatedAt:"2026-11-10T10:00:00.000Z",...over});
beforeEach(() => { cleanup(); vi.clearAllMocks(); });

describe("fluxo do caderno", () => {
 it("cria uma página na divisória escolhida e a mantém após salvar", async () => {
  save.mockImplementation(savedPage);
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

describe("anotações livres", () => {
 it("sem nenhum curso o caderno abre direto nas anotações livres", async () => {
  save.mockImplementation(savedPage);
  render(<CourseNotebook initial={{success:true,data:{courses:[],pages:[]}}} />);
  expect(screen.getByRole("button",{name:/Anotações livres/})).toHaveAttribute("aria-pressed","true");
  fireEvent.click(screen.getByRole("button",{name:/Nova página/}));
  fireEvent.change(screen.getByLabelText("Título da página"),{target:{value:"Ideias soltas"}});
  fireEvent.click(screen.getByRole("button",{name:/Salvar página/}));
  await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({courseId:null,title:"Ideias soltas"})));
 });
});

describe("links entre anotações", () => {
 const withPages = {success:true as const,data:{courses:[],pages:[
  page({id:"f",title:"Fórmulas",content:"Bhaskara"}),
  page({id:"r",title:"Revisão",content:"Estudar [[Fórmulas]] e [[Geometria]]"}),
 ]}};

 it("ao digitar [[ sugere notas e completa o link", () => {
  render(<CourseNotebook initial={withPages} />);
  fireEvent.click(screen.getByRole("button",{name:/Nova página/}));
  const editor = screen.getByLabelText("Suas anotações") as HTMLTextAreaElement;
  fireEvent.change(editor,{target:{value:"Ver [[Fór",selectionStart:9}});
  const option = screen.getByRole("option",{name:/Fórmulas/});
  fireEvent.mouseDown(option);
  expect(editor.value).toBe("Ver [[Fórmulas]]");
 });

 it("no modo leitura abre a nota linkada e mostra quem a menciona", () => {
  render(<CourseNotebook initial={withPages} />);
  fireEvent.click(screen.getByRole("button",{name:/Revisão Estudar/}));
  fireEvent.click(screen.getByRole("button",{name:"Ler"}));
  fireEvent.click(screen.getByRole("button",{name:"Fórmulas"}));
  expect(screen.getByLabelText("Título da página")).toHaveValue("Fórmulas");
  const mentioned = screen.getByRole("region",{name:"Mencionada em"});
  expect(mentioned).toHaveTextContent("Revisão");
 });

 it("link para nota que não existe cria a nota com esse título", () => {
  render(<CourseNotebook initial={withPages} />);
  fireEvent.click(screen.getByRole("button",{name:/Revisão Estudar/}));
  fireEvent.click(screen.getByRole("button",{name:"Ler"}));
  fireEvent.click(screen.getByRole("button",{name:"Geometria"}));
  expect(screen.getByLabelText("Título da página")).toHaveValue("Geometria");
  expect(screen.getByRole("status")).not.toHaveTextContent("Salvo");
 });

 it("após renomear, as notas com links atualizados vêm da API e substituem as antigas", async () => {
  save.mockResolvedValue({success:true,data:{
   page:page({id:"f",title:"Fórmulas do 2º grau",content:"Bhaskara",version:2,updatedAt:"2026-11-13T10:00:00.000Z"}),
   relinked:[page({id:"r",title:"Revisão",content:"Estudar [[Fórmulas do 2º grau]] e [[Geometria]]",version:2})],
  }});
  render(<CourseNotebook initial={withPages} />);
  fireEvent.click(screen.getByRole("button",{name:/Fórmulas Bhaskara/}));
  fireEvent.change(screen.getByLabelText("Título da página"),{target:{value:"Fórmulas do 2º grau"}});
  fireEvent.click(screen.getByRole("button",{name:/Salvar página/}));
  await waitFor(() => expect(screen.getByRole("button",{name:/Revisão Estudar \[\[Fórmulas do 2º grau\]\]/})).toBeInTheDocument());
 });
});
