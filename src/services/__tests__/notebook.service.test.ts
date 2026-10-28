import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ findCourses: vi.fn(), findPages: vi.fn(), enrollment: vi.fn(), create: vi.fn(), update: vi.fn(), findPage: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  course: { findMany: mocks.findCourses }, notebookPage: { findMany: mocks.findPages },
  $transaction: async (callback: (tx: unknown) => unknown) => callback({ courseEnrollment: {findUnique:mocks.enrollment}, notebookPage: {create:mocks.create,updateMany:mocks.update,findFirstOrThrow:mocks.findPage} }),
} }));
import { getNotebook, saveNotebookPage } from "../notebook.service";
const input = {id:"ba86fc19-1e8d-4bb7-8f66-610123456789",courseId:"java",title:"Classes",content:"Minhas ideias",version:null};
beforeEach(() => { vi.clearAllMocks(); mocks.enrollment.mockResolvedValue({id:"matricula"}); mocks.findPage.mockResolvedValue({...input,version:1,updatedAt:new Date()}); });
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
  expect(mocks.enrollment).not.toHaveBeenCalled();
 });
 it("lista somente páginas e divisórias do dono", async () => {
  mocks.findCourses.mockResolvedValue([]); mocks.findPages.mockResolvedValue([]);
  await getNotebook("aluno");
  expect(mocks.findPages).toHaveBeenCalledWith(expect.objectContaining({where:{userId:"aluno"}}));
  expect(mocks.findCourses).toHaveBeenCalledWith(expect.objectContaining({where:{OR:[{enrollments:{some:{userId:"aluno"}}},{notebookPages:{some:{userId:"aluno"}}}]}}));
 });
});
