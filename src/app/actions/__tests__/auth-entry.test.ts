import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { loginAction, registerAction } from "../auth";
const api = vi.fn();
vi.mock("next/headers", () => ({ cookies: async () => ({ delete: vi.fn(), set: vi.fn() }) }));
vi.mock("@/lib/account-switcher", () => ({ addAccount: vi.fn() }));
vi.mock("@/lib/auth-session", () => ({ getApiUrl: () => "https://example.test" }));
vi.mock("@/lib/client-device", () => ({ getClientDevice: async () => ({}) }));
vi.mock("@/services/registration-profile.service", () => ({ saveRegistrationProfile: vi.fn() }));
const initial = { success:false };
function fields() {
  const form = new FormData();
  for(const [name,value] of Object.entries({ username:"aluno", fullName:"Aluno Teste", email:" ALUNO@example.com ", password:"senha-teste", confirmPassword:"senha-teste", terms:"on",birthDate:"2000-01-01",callbackUrl:"/app" })) form.set(name,value);
  return form;
}
beforeEach(()=>{api.mockReset();vi.stubGlobal("fetch",api);});
afterEach(()=>vi.unstubAllGlobals());
it("conta criada continua pelo login se a sessão automática falhar",async()=>{
  api.mockResolvedValueOnce(Response.json({}, {status:201})).mockRejectedValueOnce(new Error("offline"));
  const result = await registerAction(initial, fields());
  expect(result.redirectTo).toBe("/login?registered=1&callbackUrl=%2Fapp");
  expect(JSON.parse(api.mock.calls[0][1].body).email).toBe("aluno@example.com");
});
it("uma resposta sem token nunca autoriza o painel",async()=>{
  api.mockResolvedValue(Response.json({session:{}}));
  expect((await loginAction(initial,fields())).success).toBe(false);
});
it("novo dispositivo segue para a verificação antes do painel",async()=>{
  api.mockResolvedValue(Response.json({verificationId:"ver1",reason:"DEVICE"},{status:202}));
  expect((await loginAction(initial,fields())).redirectTo).toBe("/verificar-dispositivo?vid=ver1&callbackUrl=%2Fapp");
});

it("leva o instrutor para gerenciar após a verificação obrigatória", async()=>{
  const form = fields();
  form.set("accountType","INSTRUCTOR");
  api.mockResolvedValueOnce(Response.json({user:{id:"autor"}},{status:201}))
    .mockResolvedValueOnce(Response.json({verificationId:"v1",reason:"EMAIL_VERIFY"},{status:202}));
  const result=await registerAction(initial,form);
  expect(JSON.parse(api.mock.calls[0][1].body).accountType).toBe("INSTRUCTOR");
  expect(result.redirectTo).toContain("callbackUrl=%2Finstructor%2Fgerenciar");
});

it.each(["TEACHER", "INSTRUCTOR"])("direciona a sessão %s para gerenciar e respeita destinos específicos", async role => {
  const form = fields();
  api.mockImplementation(async () => Response.json({ user: { id: "docente", roles: [role] }, session: { token: "teste" } }));
  expect((await loginAction(initial, form)).redirectTo).toBe("/instructor/gerenciar");
  form.set("callbackUrl", "/anotacoes");
  expect((await loginAction(initial, form)).redirectTo).toBe("/anotacoes");
});
