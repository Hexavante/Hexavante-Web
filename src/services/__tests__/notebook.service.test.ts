import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  findCourses: vi.fn(),
  findPages: vi.fn(),
  enrollment: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  findPage: vi.fn(),
  findFirst: vi.fn(),
  txFindMany: vi.fn(),
  updateOne: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  course: { findMany: mocks.findCourses }, notebookPage: { findMany: mocks.findPages },
  $transaction: async (callback: (tx: unknown) => unknown) => callback({
    courseEnrollment: { findUnique: mocks.enrollment },
    notebookPage: {
      create: mocks.create,
      updateMany: mocks.update,
      findFirstOrThrow: mocks.findPage,
      findFirst: mocks.findFirst,
      findMany: mocks.txFindMany,
      update: mocks.updateOne,
    },
  }),
} }));
import { getNotebook, saveNotebookPage } from "../notebook.service";
const input = {id:"ba86fc19-1e8d-4bb7-8f66-610123456789",courseId:"java" as string | null,title:"Classes",content:"Minhas ideias",version:null as number | null};
const row = (over: Record<string, unknown>) => ({ id: "x", courseId: null, title: "", content: "", version: 1, updatedAt: new Date("2026-11-13T10:00:00Z"), ...over });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.enrollment.mockResolvedValue({id:"matricula"});
  mocks.findPage.mockResolvedValue({...input,version:1,updatedAt:new Date()});
  mocks.findFirst.mockResolvedValue({ title: "Classes" });
  mocks.txFindMany.mockResolvedValue([]);
});
describe("caderno independente", () => {
 it("cria páginas pessoais vinculadas ao curso, sem lessonId", async () => {
  await saveNotebookPage("aluno",input);
  expect(mocks.create).toHaveBeenCalledWith({data:{id:input.id,userId:"aluno",courseId:"java",title:"Classes",content:"Minhas ideias"},select:{id:true}});
 });
 it("recusa escrita em curso sem matrícula", async () => {
  mocks.enrollment.mockResolvedValue(null);
  await expect(saveNotebookPage("outro",input)).rejects.toThrow("matriculado");
  expect(mocks.create).not.toHaveBeenCalled();
 });
 it("atualiza apenas páginas do usuário e da versão esperada", async () => {
  mocks.update.mockResolvedValue({count:1});
  await saveNotebookPage("aluno",{...input,version:3});
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({where:{id:input.id,userId:"aluno",courseId:"java",version:3}}));
 });
 it("não sobrescreve outra conta ou uma versão mais recente", async () => {
  mocks.update.mockResolvedValue({count:0});
  await expect(saveNotebookPage("outro",{...input,version:1})).rejects.toThrow("outra aba");
  expect(mocks.findPage).not.toHaveBeenCalled();
 });
 it("limita texto e exige título", async () => {
  await expect(saveNotebookPage("aluno",{...input,title:" "})).rejects.toThrow();
  await expect(saveNotebookPage("aluno",{...input,content:"a".repeat(50001)})).rejects.toThrow();
  await expect(saveNotebookPage("aluno",{...input,title:"Com [[colchetes]]"})).rejects.toThrow("[[");
  expect(mocks.enrollment).not.toHaveBeenCalled();
 });
 it("lista somente páginas e divisórias do dono", async () => {
  mocks.findCourses.mockResolvedValue([]); mocks.findPages.mockResolvedValue([]);
  await getNotebook("aluno");
  expect(mocks.findPages).toHaveBeenCalledWith(expect.objectContaining({where:{userId:"aluno"}}));
  expect(mocks.findCourses).toHaveBeenCalledWith(expect.objectContaining({where:{OR:[{enrollments:{some:{userId:"aluno"}}},{notebookPages:{some:{userId:"aluno"}}}]}}));
 });
});

describe("anotações livres", () => {
 it("cria sem curso e sem exigir matrícula", async () => {
  await saveNotebookPage("aluno",{...input,courseId:null});
  expect(mocks.enrollment).not.toHaveBeenCalled();
  expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({courseId:null})}));
 });
 it("atualiza mantendo a página como livre", async () => {
  mocks.update.mockResolvedValue({count:1});
  await saveNotebookPage("aluno",{...input,courseId:null,version:2});
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({courseId:null})}));
 });
});

describe("links [[...]] ao renomear", () => {
 it("atualiza os links das outras notas do usuário e devolve as alteradas", async () => {
  mocks.update.mockResolvedValue({count:1});
  mocks.findFirst.mockResolvedValue({ title: "Classes" });
  mocks.txFindMany.mockResolvedValue([
   row({ id: "p2", title: "Resumo", content: "Ver [[classes]] e [[Herança]]" }),
   row({ id: "p3", title: "Outra", content: "sem links" }),
  ]);
  mocks.updateOne.mockImplementation(async ({ where, data }) => row({ id: where.id, title: "Resumo", content: data.content, version: 2 }));

  const result = await saveNotebookPage("aluno",{...input,courseId:null,title:"Classes e objetos",version:1});

  expect(mocks.txFindMany).toHaveBeenCalledWith(expect.objectContaining({where:{userId:"aluno",id:{not:input.id}}}));
  expect(mocks.updateOne).toHaveBeenCalledTimes(1);
  expect(mocks.updateOne).toHaveBeenCalledWith(expect.objectContaining({
   where:{id:"p2"},
   data:{content:"Ver [[Classes e objetos]] e [[Herança]]",version:{increment:1}},
  }));
  expect(result.relinked.map((p) => p.id)).toEqual(["p2"]);
 });
 it("sem mudança de título não toca em outras notas", async () => {
  mocks.update.mockResolvedValue({count:1});
  mocks.findFirst.mockResolvedValue({ title: "classes" });
  const result = await saveNotebookPage("aluno",{...input,version:1});
  expect(mocks.txFindMany).not.toHaveBeenCalled();
  expect(result.relinked).toEqual([]);
 });
 it("se outra página ainda usa o título antigo, os links continuam apontando para ela", async () => {
  mocks.update.mockResolvedValue({count:1});
  mocks.txFindMany.mockResolvedValue([
   row({ id: "dup", title: "Classes", content: "" }),
   row({ id: "p2", title: "Resumo", content: "[[Classes]]" }),
  ]);
  const result = await saveNotebookPage("aluno",{...input,title:"Novo nome",version:1});
  expect(mocks.updateOne).not.toHaveBeenCalled();
  expect(result.relinked).toEqual([]);
 });
});
