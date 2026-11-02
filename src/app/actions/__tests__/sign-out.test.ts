import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { signOutAction } from "../sign-out";
const mocks = vi.hoisted(() => ({
  getAccounts: vi.fn(), removeAccount: vi.fn(), switchAccount: vi.fn(), clearAccounts: vi.fn(),
  cookieStore: { getAll: vi.fn(), get: vi.fn(), delete: vi.fn(), set: vi.fn() },
}));
vi.mock("next/headers", () => ({cookies:async()=>mocks.cookieStore}));
vi.mock("next/navigation", () => ({redirect:(path:string)=>{throw new Error(`REDIRECT:${path}`);}}));
vi.mock("@/lib/auth-session",()=>({getApiUrl:()=>"https://api.example.test"}));
vi.mock("@/lib/account-switcher",()=>mocks);
beforeEach(()=>{
  vi.resetAllMocks();
  mocks.cookieStore.getAll.mockReturnValue([{name:"hexavante.session_token",value:"test-token"}]);
  mocks.cookieStore.get.mockReturnValue({value:"test-token"});
  mocks.getAccounts.mockResolvedValue([]);
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue({ok:true}));
});
afterEach(()=>vi.unstubAllGlobals());
it("preserva a conta seguinte após sair da atual", async()=>{
  mocks.getAccounts.mockResolvedValueOnce([{userId:"a",token:"test-token"}]).mockResolvedValueOnce([{userId:"b",token:"other-token"}]);
  mocks.switchAccount.mockResolvedValue(true);
  await expect(signOutAction()).rejects.toThrow("REDIRECT:/app");
  expect(mocks.removeAccount).toHaveBeenCalledWith("a");
  expect(mocks.switchAccount).toHaveBeenCalledWith("b");
  expect(mocks.clearAccounts).not.toHaveBeenCalled();
});
it("encerra a sessão local mesmo quando a API falha",async()=>{
  vi.mocked(fetch).mockRejectedValue(new Error("offline"));
  await expect(signOutAction()).rejects.toThrow("REDIRECT:/");
  expect(mocks.cookieStore.delete).toHaveBeenCalledWith("hexavante.session_token");
  expect(mocks.cookieStore.delete).toHaveBeenCalledWith("__Secure-hexavante.session_token");
  expect(mocks.clearAccounts).toHaveBeenCalledOnce();
});
it("adapta cookie local e limita a espera pela API",async()=>{
  await expect(signOutAction()).rejects.toThrow("REDIRECT:/");
  expect(fetch).toHaveBeenCalledWith("https://api.example.test/api/v1/auth/logout",expect.objectContaining({headers:{cookie:"__Secure-hexavante.session_token=test-token"},signal:expect.any(AbortSignal)}));
});
