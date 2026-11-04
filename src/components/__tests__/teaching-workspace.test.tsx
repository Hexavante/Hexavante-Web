import { expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Workspace from "@/app/(main)/instructor/gerenciar/page";
import { canModerate } from "@/lib/permissions";
const { auth } = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock("@/auth", () => ({auth}));
vi.mock("@/lib/prisma", () => ({prisma:{tutorial:{findMany:async()=>[]},exam:{findMany:async()=>[]}}}));
vi.mock("@/services/course.service", () => ({listInstructorCourses:async()=>[]}));
vi.mock("@/services/live-room.service", () => ({listInstructorLiveRooms:async()=>[]}));
vi.mock("@/services/exam-admin.service", () => ({listExamsForAdmin:vi.fn()}));
vi.mock("@/app/actions/course", () => ({deleteCourseAction:vi.fn()}));
vi.mock("@/app/actions/tutorial", () => ({deleteTutorialAction:vi.fn()}));
vi.mock("@/app/actions/exam-admin", () => ({deleteExamByIdAction:vi.fn()}));
vi.mock("next/navigation", () => ({redirect:(url:string)=>{throw new Error(url)}}));

it.each(["TEACHER","INSTRUCTOR"])("abre as ferramentas de criação para %s sem acesso à moderação", async role => {
  auth.mockResolvedValue({user:{id:"prof",roles:["USER",role]}});
  const html = renderToStaticMarkup(await Workspace());
  expect(html).toContain("Mesa de trabalho");
  for (const path of ["courses","tutorials","simulados","live-rooms"]) expect(html).toContain("/instructor/"+path+"/new");
  expect(canModerate([role])).toBe(false);
});
it("reserva a área de criação a professores",async()=>{
  auth.mockResolvedValue({user:{id:"aluno",roles:["USER"]}});
  await expect(Workspace()).rejects.toThrow("/instructor/apply");
});
